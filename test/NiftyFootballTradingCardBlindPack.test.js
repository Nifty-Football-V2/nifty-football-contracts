const NiftyFootballTradingCard = artifacts.require('NiftyFootballTradingCard');
const NiftyFootballTradingCardBlindPack = artifacts.require('NiftyFootballTradingCardBlindPack');

const MockBlindBuyingContract = artifacts.require('MockBlindBuyingContract');
const NiftyFootballTradingCardGenerator = artifacts.require('NiftyFootballTradingCardGenerator');

const {BN, expectEvent, shouldFail, balance} = require('openzeppelin-test-helpers');

contract('NiftyFootballTradingCardBlindPack', ([_, creator, tokenOwner, anyone, wallet, cleanWallet, ...accounts]) => {

    const firstTokenId = new BN(1);
    const secondTokenId = new BN(2);
    const unknownTokenId = new BN(999);

    const firstURI = 'http://futball-cards';
    const baseURI = 'http://futball-cards';

    beforeEach(async function () {
        // Create 721 contract
        this.niftyFootballTradingCard = await NiftyFootballTradingCard.new(baseURI, {from: creator});

        this.generator = await NiftyFootballTradingCardGenerator.new({from: creator});

        // Create vending machine
        this.blindPack = await NiftyFootballTradingCardBlindPack.new(
            wallet,
            this.generator.address,
            this.niftyFootballTradingCard.address,
            {from: creator}
        );

        // Add to whitelist
        await this.niftyFootballTradingCard.addWhitelisted(this.blindPack.address, {from: creator});
        (await this.niftyFootballTradingCard.isWhitelisted(this.blindPack.address)).should.be.true;

        this.basePrice = await this.blindPack.totalPrice(1);
        this.basePrice.should.be.bignumber.equal('11000000000000000');

        (await this.niftyFootballTradingCard.totalCards()).should.be.bignumber.equal('0');
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
            (await this.niftyFootballTradingCard.totalCards()).should.be.bignumber.equal('1');
        });

        it('returns total purchases', async function () {
            (await this.blindPack.totalPurchasesInWei()).should.be.bignumber.equal(this.basePrice);
        });

        it('has an owner', async function () {
            (await this.niftyFootballTradingCard.tokensOfOwner(tokenOwner))[0].should.be.bignumber.equal(firstTokenId);
        });

        context('ensure card has attributes', function () {
            it('returns attributes', async function () {
                const attrs = await this.niftyFootballTradingCard.attributesAndName(firstTokenId);

                // between 0 - 99
                attrs[0].should.be.bignumber.lt('100');
                attrs[1].should.be.bignumber.lt('100');
                attrs[2].should.be.bignumber.lt('100');
                attrs[3].should.be.bignumber.lt('100');
                attrs[4].should.be.bignumber.lt('100');
                attrs[5].should.be.bignumber.lt('100');
                attrs[6].should.be.bignumber.lt('100');
            });
        });

        context('ensure card has card values', function () {
            it('returns attributes', async function () {
                const cardAttrs = await this.niftyFootballTradingCard.card(firstTokenId);

                // between 0 - 3
                cardAttrs[0].should.be.bignumber.lt('32');
                cardAttrs[1].should.not.be.null;
                cardAttrs[2].should.be.bignumber.lt('32');
                cardAttrs[3].should.be.bignumber.lt('32');
                cardAttrs[4].should.be.bignumber.lt('32');
                cardAttrs[6].should.not.be.null;
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

    context('ensure only contract owner can burn', function () {
        it('should revert if not contract owner', async function () {
            await shouldFail.reverting(this.niftyFootballTradingCard.burn(firstTokenId, {from: anyone}));
        });

        it('should burn if owner', async function () {
            await this.blindPack.blindPack({from: tokenOwner, value: this.basePrice});
            const {logs} = await this.niftyFootballTradingCard.burn(firstTokenId, {from: creator});
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
            this.cleanBlindPack = await NiftyFootballTradingCardBlindPack.new(
                cleanWallet,
                this.generator.address,
                this.niftyFootballTradingCard.address,
                {from: creator}
            );

            await this.niftyFootballTradingCard.addWhitelisted(this.cleanBlindPack.address, {from: creator});

            this.basePrice = await this.blindPack.totalPrice(1);
            this.basePrice.should.be.bignumber.equal('11000000000000000');
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

            await this.cleanBlindPack.blindPack({from: anyone, value: new BN('11000000000000123')});

            const postWalletBalance = await balance.current(cleanWallet);
            postWalletBalance.should.be.bignumber.equal(preWalletBalance.add(new BN('11000000000000123')));
        });

        it('should allow withdrawal of send eth if credit used', async function () {
            const preWalletBalance = await balance.current(cleanWallet);
            const contractBalance = await balance.current(this.cleanBlindPack.address);
            contractBalance.should.be.bignumber.equal(new BN('0'));

            await this.cleanBlindPack.addCredit(tokenOwner, {from: creator});
            await this.cleanBlindPack.blindPack({from: tokenOwner, value: new BN('11000000000000123')});

            const postContractBalance = await balance.current(this.cleanBlindPack.address);
            postContractBalance.should.be.bignumber.equal(new BN('11000000000000123'));

            await this.cleanBlindPack.withdraw({from: creator});
            const postWalletBalance = await balance.current(cleanWallet);
            postWalletBalance.should.be.bignumber.equal(preWalletBalance.add(new BN('11000000000000123')));

        });
    });

    context('batch buy', async function () {

        context('total price calculation', async function () {

            it('for 1 and 2 cards', async function () {
                const oneCard = await await this.blindPack.totalPrice(1);
                oneCard.should.be.bignumber.eq(new BN(1).mul(new BN('11000000000000000')));

                const twoCards = await await this.blindPack.totalPrice(2);
                twoCards.should.be.bignumber.eq(new BN(2).mul(new BN('11000000000000000')));
            });

            it('for 3 to 5 cards', async function () {
                const threeCards = await await this.blindPack.totalPrice(3);
                threeCards.should.be.bignumber.eq(new BN(3).mul(new BN('10000000000000000')));

                const fourCards = await await this.blindPack.totalPrice(4);
                fourCards.should.be.bignumber.eq(new BN(4).mul(new BN('10000000000000000')));

                const fiveCards = await await this.blindPack.totalPrice(5);
                fiveCards.should.be.bignumber.eq(new BN(5).mul(new BN('10000000000000000')));
            });

            it('for 6 to 8 cards', async function () {
                const sixCards = await await this.blindPack.totalPrice(6);
                sixCards.should.be.bignumber.eq(new BN(6).mul(new BN('9100000000000000')));

                const sevenCards = await await this.blindPack.totalPrice(7);
                sevenCards.should.be.bignumber.eq(new BN(7).mul(new BN('9100000000000000')));

                const eightCards = await await this.blindPack.totalPrice(8);
                eightCards.should.be.bignumber.eq(new BN(8).mul(new BN('9100000000000000')));
            });

            it('for 9 or more cards', async function () {
                const nineCards = await await this.blindPack.totalPrice(9);
                nineCards.should.be.bignumber.eq(new BN(9).mul(new BN('8500000000000000')));

                const tenCards = await await this.blindPack.totalPrice(10);
                tenCards.should.be.bignumber.eq(new BN(10).mul(new BN('8500000000000000')));

                const oneHundredCard = await await this.blindPack.totalPrice(100);
                oneHundredCard.should.be.bignumber.eq(new BN(100).mul(new BN('8500000000000000')));
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

                const tokensOfOwner = await this.niftyFootballTradingCard.tokensOfOwner(tokenOwner);
                tokensOfOwner.map(e => e.toNumber()).should.be.deep.equal([
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10
                ]);

                const remainingCredits = await this.blindPack.credits(tokenOwner);
                remainingCredits.should.be.bignumber.eq('0');
            });

            it('successful if caller sends enough ETH', async function () {
                const value = new BN(10).mul(new BN('55000000000000000'));

                await this.blindPack.buyBatch(10, {from: tokenOwner, value: value});

                const tokensOfOwner = await this.niftyFootballTradingCard.tokensOfOwner(tokenOwner);
                tokensOfOwner.map(e => e.toNumber()).should.be.deep.equal([
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10
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
            oneCard.should.be.bignumber.eq(new BN(1).mul(new BN('11000000000000000')));

            await this.blindPack.updatePricePerCardAtIndex(0, 100, {from: creator});

            oneCard = await await this.blindPack.totalPrice(1);
            oneCard.should.be.bignumber.eq('100');
        });


        it('can batch update if owner', async function () {
            let oneCard = await await this.blindPack.totalPrice(1);
            oneCard.should.be.bignumber.eq(new BN(1).mul(new BN('11000000000000000')));

            await this.blindPack.updatePricePerCard([100], {from: creator});

            oneCard = await await this.blindPack.totalPrice(1);
            oneCard.should.be.bignumber.eq('100');
        });

    });

    context('cant buy packs when caller is a contract', async function () {

        beforeEach(async function () {
            this.mockBuyingContract = await MockBlindBuyingContract.new(this.blindPack.address, {
                from: creator
            });
        });

        it('should fail blind pack if caller is address', async function () {
            await shouldFail.reverting.withMessage(
                this.mockBuyingContract.blindPackTo(creator, {value: this.basePrice}),
                "Unable to buy packs from another contract"
            );
        });

        it('should fail batch buy if caller is address', async function () {
            await shouldFail.reverting.withMessage(
                this.mockBuyingContract.buyBatchTo(creator, 1, {value: this.basePrice}),
                "Unable to buy packs from another contract"
            );
        });

    });
});
