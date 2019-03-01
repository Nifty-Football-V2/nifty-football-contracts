const FutballCards = artifacts.require('FutballCards');
const FutballCardsBlindPack = artifacts.require('FutballCardsBlindPack');

const FutballCardsGenerator = artifacts.require('FutballCardsGenerator');

const {BN, expectEvent, shouldFail, balance} = require('openzeppelin-test-helpers');

contract('FutballCardsBlindPack', ([_, creator, tokenOwner, anyone, wallet, cleanWallet, ...accounts]) => {

    const firstTokenId = new BN(0);
    const secondTokenId = new BN(1);
    const unknownTokenId = new BN(999);

    const firstURI = 'http://futball-cards';
    const baseURI = 'http://futball-cards';

    beforeEach(async function () {
        // Create 721 contract
        this.futballCards = await FutballCards.new(baseURI, {from: creator});

        this.generator = await FutballCardsGenerator.new({from: creator});

        // Create vending machine
        this.blindPack = await FutballCardsBlindPack.new(
            wallet,
            this.generator.address,
            this.futballCards.address,
            {from: creator}
        );

        // Add to whitelist
        await this.futballCards.addWhitelisted(this.blindPack.address, {from: creator});
        (await this.futballCards.isWhitelisted(this.blindPack.address)).should.be.true;

        this.basePrice = await this.blindPack.totalPrice(1);
        this.basePrice.should.be.bignumber.equal('11000000');

        (await this.futballCards.totalCards()).should.be.bignumber.equal('0');
        (await this.blindPack.totalPurchasesInWei()).should.be.bignumber.equal('0');
    });

    context('ensure counters and getters are functional', function () {

        beforeEach(async function () {
            // mint a single building
            const {logs} = await this.blindPack.blindPack({from: tokenOwner, value: this.basePrice});
            expectEvent.inLogs(
                logs,
                `BlindPackPulled`,
                {_tokenId: firstTokenId, _to: tokenOwner}
            );
        });

        it('returns total card', async function () {
            (await this.futballCards.totalCards()).should.be.bignumber.equal('1');
        });

        it('returns total purchases', async function () {
            (await this.blindPack.totalPurchasesInWei()).should.be.bignumber.equal(this.basePrice);
        });

        it('has an owner', async function () {
            (await this.futballCards.tokensOfOwner(tokenOwner))[0].should.be.bignumber.equal(firstTokenId);
        });

        context('ensure card has attributes', function () {
            it('returns attributes', async function () {
                const attrs = await this.futballCards.attributesAndName(firstTokenId);

                // between 0 - 99
                attrs[0].should.be.bignumber.lt('100');
                attrs[1].should.be.bignumber.lt('100');
                attrs[2].should.be.bignumber.lt('100');
                attrs[3].should.be.bignumber.lt('100');
                attrs[4].should.be.bignumber.lt('100');
                attrs[5].should.be.bignumber.lt('256');
                attrs[6].should.be.bignumber.lt('256');
            });
        });

        context('ensure card has card values', function () {
            it('returns attributes', async function () {
                const cardAttrs = await this.futballCards.card(firstTokenId);

                // between 0 - 3
                cardAttrs[0].should.be.bignumber.lt('10');
                cardAttrs[1].should.be.bignumber.lt('10');
                cardAttrs[2].should.be.bignumber.lt('10');
                cardAttrs[3].should.be.bignumber.lt('10');
                cardAttrs[4].should.be.bignumber.lt('10');
                cardAttrs[5].should.be.bignumber.lt('10');
            });
        });

    });

    context('ensure only owner can change attributes base', function () {
        it('should revert if not owner', async function () {
            await shouldFail.reverting(this.blindPack.setAttributesBase(10, {from: tokenOwner}));
        });

        it('should adjust base if owner', async function () {
            const {logs} = await this.blindPack.setAttributesBase(30, {from: creator});
            expectEvent.inLogs(
                logs,
                `AttributesBaseChanged`,
                {_new: new BN(30)}
            );
            (await this.blindPack.attributesBase()).should.be.bignumber.equal('30');
        });
    });

    context('ensure only owner can add credit', function () {
        it('should revert if not owner', async function () {
            await shouldFail.reverting(this.blindPack.addCredit(anyone, {from: tokenOwner}));
        });

        it('should add credit if owner', async function () {
            const {logs} = await this.blindPack.addCredit(anyone, {from: creator});
            expectEvent.inLogs(
                logs,
                `CreditAdded`,
                {_to: anyone}
            );
            (await this.blindPack.credits(anyone)).should.be.bignumber.equal('1');
        });
    });

    context('ensure only owner can change default card type', function () {
        it('should revert if not owner', async function () {
            await shouldFail.reverting(this.blindPack.setCardTypeDefault(2, {from: tokenOwner}));
        });

        it('should add credit if owner', async function () {
            const {logs} = await this.blindPack.setCardTypeDefault(2, {from: creator});
            expectEvent.inLogs(
                logs,
                `DefaultCardTypeChanged`,
                {_new: new BN(2)}
            );
            (await this.blindPack.cardTypeDefault()).should.be.bignumber.equal('2');
        });
    });

    context('ensure only card owner can burn', function () {
        it('should revert if not card owner', async function () {
            await shouldFail.reverting(this.futballCards.burn(firstTokenId, {from: anyone}));
        });

        it('should burn if owner', async function () {
            await this.blindPack.blindPack({from: tokenOwner, value: this.basePrice});
            const {logs} = await this.futballCards.burn(firstTokenId, {from: tokenOwner});
            expectEvent.inLogs(
                logs,
                `Transfer`,
            );
        });
    });

    context('ensure can not mint with less than minimum purchase value', function () {
        it('should revert if not enough payable', async function () {
            await shouldFail.reverting(this.blindPack.blindPack({
                from: tokenOwner,
                value: 0
            }));
        });
    });

    context('credits', function () {
        it('should fail if no credit and no value', async function () {
            await shouldFail.reverting(this.blindPack.blindPack({
                from: tokenOwner,
                value: 0
            }));
        });

        it('should fulfil if credit and no value', async function () {
            await this.blindPack.addCredit(tokenOwner, {from: creator});
            await this.blindPack.blindPack({from: tokenOwner, value: 0});
        });
    });

    context('wallet', function () {
        before(async function () {
            // Create vending machine
            this.cleanBlindPack = await FutballCardsBlindPack.new(
                cleanWallet,
                this.generator.address,
                this.futballCards.address,
                {from: creator}
            );

            await this.futballCards.addWhitelisted(this.cleanBlindPack.address, {from: creator});

            this.basePrice = await this.blindPack.totalPrice(1);
            this.basePrice.should.be.bignumber.equal('11000000');
        });

        it('should be transferred the blind pack eth purchase', async function () {
            const preWalletBalance = await balance.current(cleanWallet);

            await this.cleanBlindPack.blindPack({from: anyone, value: this.basePrice});

            const postWalletBalance = await balance.current(cleanWallet);
            postWalletBalance.should.be.bignumber.equal(preWalletBalance.add(this.basePrice));

            await this.cleanBlindPack.blindPackTo(tokenOwner, {from: anyone, value: this.basePrice});

            const postToWalletBalance = await balance.current(cleanWallet);
            postToWalletBalance.should.be.bignumber.equal(postWalletBalance.add(this.basePrice));
        });

        it('should be transferred the blind pack eth purchase - over min amount', async function () {
            const preWalletBalance = await balance.current(cleanWallet);

            await this.cleanBlindPack.blindPack({from: anyone, value: 12345678});

            const postWalletBalance = await balance.current(cleanWallet);
            postWalletBalance.should.be.bignumber.equal(preWalletBalance.add(new BN('12345678')));
        });

        it('should allow withdrawal of send eth if credit used', async function () {
            const preWalletBalance = await balance.current(cleanWallet);
            const contractBalance = await balance.current(this.cleanBlindPack.address);
            contractBalance.should.be.bignumber.equal(new BN('0'));

            await this.cleanBlindPack.addCredit(tokenOwner, {from: creator});
            await this.cleanBlindPack.blindPack({from: tokenOwner, value: 12345678});

            const postContractBalance = await balance.current(this.cleanBlindPack.address);
            postContractBalance.should.be.bignumber.equal(new BN('12345678'));

            await this.cleanBlindPack.withdraw({from: creator});
            const postWalletBalance = await balance.current(cleanWallet);
            postWalletBalance.should.be.bignumber.equal(preWalletBalance.add(new BN('12345678')));

        });
    });

    context('batch buy', async function () {

        context('total price calculation', async function () {

            it('for 1 and 2 cards', async function () {
                const oneCard = await await this.blindPack.totalPrice(1);
                oneCard.should.be.bignumber.eq(new BN(1).mul(new BN(11000000)));

                const twoCards = await await this.blindPack.totalPrice(2);
                twoCards.should.be.bignumber.eq(new BN(2).mul(new BN(11000000)));
            });

            it('for 3 to 5 cards', async function () {
                const threeCards = await await this.blindPack.totalPrice(3);
                threeCards.should.be.bignumber.eq(new BN(3).mul(new BN(7300000)));

                const fourCards = await await this.blindPack.totalPrice(4);
                fourCards.should.be.bignumber.eq(new BN(4).mul(new BN(7300000)));

                const fiveCards = await await this.blindPack.totalPrice(5);
                fiveCards.should.be.bignumber.eq(new BN(5).mul(new BN(7300000)));
            });

            it('for 6 to 9 cards', async function () {
                const sixCards = await await this.blindPack.totalPrice(6);
                sixCards.should.be.bignumber.eq(new BN(6).mul(new BN(6200000)));

                const sevenCards = await await this.blindPack.totalPrice(7);
                sevenCards.should.be.bignumber.eq(new BN(7).mul(new BN(6200000)));

                const eightCards = await await this.blindPack.totalPrice(8);
                eightCards.should.be.bignumber.eq(new BN(8).mul(new BN(6200000)));

                const nineCards = await await this.blindPack.totalPrice(9);
                nineCards.should.be.bignumber.eq(new BN(9).mul(new BN(6200000)));
            });

            it('for 10 or more cards', async function () {
                const tenCards = await await this.blindPack.totalPrice(10);
                tenCards.should.be.bignumber.eq(new BN(10).mul(new BN(5500000)));

                const oneHundredCard = await await this.blindPack.totalPrice(100);
                oneHundredCard.should.be.bignumber.eq(new BN(100).mul(new BN(5500000)));
            });
        });

        context('to the caller', async function () {

            it('fails if caller does not have enough credits', async function () {
                await this.blindPack.addCredits(tokenOwner, 9, {from: creator});
                await shouldFail.reverting.withMessage(
                    this.blindPack.buyBatch(10, {from: tokenOwner}),
                    "Must supply at least the required minimum purchase value or have credit"
                );
            });

            it('fails if not enough ETH sent', async function () {
                await shouldFail.reverting.withMessage(
                    this.blindPack.buyBatch(10, {from: tokenOwner, value: this.basePrice}),
                    "Must supply at least the required minimum purchase value or have credit"
                );
            });

            it('successful if caller has enough credits', async function () {
                await this.blindPack.addCredits(tokenOwner, 10, {from: creator});

                await this.blindPack.buyBatch(10, {from: tokenOwner});

                const tokensOfOwner = await this.futballCards.tokensOfOwner(tokenOwner);
                tokensOfOwner.map(e => e.toNumber()).should.be.deep.equal([
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9
                ]);

                const remainingCredits = await this.blindPack.credits(tokenOwner);
                remainingCredits.should.be.bignumber.eq('0');
            });

            it('successful if caller sends enough ETH', async function () {
                const value = new BN(10).mul(new BN(5500000));

                await this.blindPack.buyBatch(10, {from: tokenOwner, value: value});

                const tokensOfOwner = await this.futballCards.tokensOfOwner(tokenOwner);
                tokensOfOwner.map(e => e.toNumber()).should.be.deep.equal([
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9
                ]);
            });

        });
    });

    context('updating price model', async function () {

        it('fails if not the owner', async function () {
            await shouldFail.reverting(
                this.blindPack.updatePricePerCardAtIndex(0, 100, {from: anyone})
            );
        });

        it('can update if owner', async function () {
            let oneCard = await await this.blindPack.totalPrice(1);
            oneCard.should.be.bignumber.eq(new BN(1).mul(new BN(11000000)));

            await this.blindPack.updatePricePerCardAtIndex(0, 100, {from: creator});

            oneCard = await await this.blindPack.totalPrice(1);
            oneCard.should.be.bignumber.eq('100');
        });

    });
});
