const FutballCards = artifacts.require('FutballCards');
const BuyNowMarketplace = artifacts.require('BuyNowMarketplace');

const {BN, expectEvent, shouldFail, balance} = require('openzeppelin-test-helpers');

contract('BuyNowMarketplace', ([_, creator, tokenOwner, anyone, wallet, ...accounts]) => {

    const firstTokenId = new BN(0);
    const secondTokenId = new BN(1);
    const thirdTokenId = new BN(2);
    const forthTokenId = new BN(3);
    const unknownTokenId = new BN(999);
    const listPrice = new BN(1000000);
    const commission = new BN(3);

    const baseURI = 'http://futball-cards/';

    beforeEach(async function () {
        // Create 721 contract
        this.futballCards = await FutballCards.new(baseURI, {from: creator});
        await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});
        await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});
        await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});
        await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

        this.marketplace = await BuyNowMarketplace.new(wallet, this.futballCards.address, commission, {from: creator});

        // approve markeplace to sell card on behalf of token owner
        await this.futballCards.approve(this.marketplace.address, firstTokenId, {from: tokenOwner});

        const {logs} = await this.marketplace.listToken(firstTokenId, listPrice, {from: tokenOwner});
        expectEvent.inLogs(
            logs,
            `ListedToken`,
            {_seller: tokenOwner, _tokenId: firstTokenId, _priceInWei: listPrice}
        );
    });

    context('ensure public access correct', function () {

        it('returns nft', async function () {
            (await this.marketplace.nft()).should.be.equal(this.futballCards.address);
        });

        it('returns commission', async function () {
            (await this.marketplace.commission()).should.be.bignumber.equal('3');
        });
    });

    context('list token', function () {

        it('returns listed token', async function () {
            const listed = await this.marketplace.listedTokens();

            listed.length.should.be.equal(1);
            listed[0].should.be.bignumber.equal(firstTokenId);
            (await this.marketplace.listedTokenPrice(firstTokenId)).should.be.bignumber.equal(listPrice);
        });

        it('should revert already listed', async function () {
            await shouldFail.reverting(this.marketplace.listToken(firstTokenId, listPrice, {from: tokenOwner}));
        });

        it('should revert if no price', async function () {
            await shouldFail.reverting(this.marketplace.listToken(secondTokenId, 0, {from: tokenOwner}));
        });

        it('should revert if not owner', async function () {
            await shouldFail.reverting(this.marketplace.listToken(thirdTokenId, 0, {from: anyone}));
        });

        it('should revert if paused', async function () {
            await this.marketplace.pause({from: creator});
            await shouldFail.reverting(this.marketplace.listToken(forthTokenId, 0, {from: tokenOwner}));
        });
    });

    context('update listed token price', function () {

        it('updates price', async function () {
            const {logs} = await this.marketplace.updateListedTokenPrice(firstTokenId, 123, {from: tokenOwner});
            expectEvent.inLogs(
                logs,
                `ListedTokenPriceUpdate`,
                {_seller: tokenOwner, _tokenId: firstTokenId, _priceInWei: new BN(123)}
            );

            (await this.marketplace.listedTokenPrice(firstTokenId)).should.be.bignumber.equal('123');
        });

        it('should revert if not listed', async function () {
            await shouldFail.reverting(this.marketplace.updateListedTokenPrice(unknownTokenId, listPrice, {from: tokenOwner}));
        });

        it('should revert if no price', async function () {
            await shouldFail.reverting(this.marketplace.updateListedTokenPrice(secondTokenId, 0, {from: tokenOwner}));
        });

        it('should revert if not owner', async function () {
            await shouldFail.reverting(this.marketplace.updateListedTokenPrice(thirdTokenId, 456, {from: anyone}));
        });

        it('should revert if paused', async function () {
            await this.marketplace.pause({from: creator});
            await shouldFail.reverting(this.marketplace.updateListedTokenPrice(forthTokenId, 456, {from: tokenOwner}));
        });
    });

    context('delist token', function () {
        it('sets price to zero when delisting', async function () {
            const {logs} = await this.marketplace.delistToken(firstTokenId, {from: tokenOwner});
            expectEvent.inLogs(
                logs,
                `DelistedToken`,
                {_seller: tokenOwner, _tokenId: firstTokenId}
            );

            (await this.marketplace.listedTokenPrice(firstTokenId)).should.be.bignumber.equal('0');
        });

        it('should revert if not owner', async function () {
            await shouldFail.reverting(this.marketplace.delistToken(firstTokenId, {from: anyone}));
        });

        it('should revert if paused', async function () {
            // give approval
            await this.futballCards.approve(this.marketplace.address, firstTokenId, {from: tokenOwner});

            await this.marketplace.pause({from: creator});
            await shouldFail.reverting(this.marketplace.delistToken(firstTokenId, {from: tokenOwner}));
        });
    });

    context('buy now', function () {
        it('successfully buys token', async function () {
            (await this.futballCards.ownerOf(firstTokenId)).should.be.equal(tokenOwner);

            // give approval
            await this.futballCards.approve(this.marketplace.address, firstTokenId, {from: tokenOwner});

            const preWalletBalance = await balance.current(wallet);
            const preTokenOwnerBalance = await balance.current(tokenOwner);

            const {logs} = await this.marketplace.buyNow(firstTokenId, {from: anyone, value: listPrice});
            expectEvent.inLogs(
                logs,
                `BoughtNow`,
                {_buyer: anyone, _tokenId: firstTokenId, _priceInWei: listPrice}
            );

            // transferred to new home!
            (await this.futballCards.ownerOf(firstTokenId)).should.be.equal(anyone);

            const postWalletBalance = await balance.current(wallet);
            const postTokenOwnerBalance = await balance.current(tokenOwner);

            // list price times commission percentage
            const listPriceCommission = listPrice.div(new BN(100)).mul(commission);

            postWalletBalance.should.be.bignumber.equal(preWalletBalance.add(listPriceCommission));
            postTokenOwnerBalance.should.be.bignumber.equal(preTokenOwnerBalance.add(listPrice.sub(listPriceCommission)));
        });

        it('should revert if not listed', async function () {
            await shouldFail.reverting(this.marketplace.buyNow(unknownTokenId, {from: anyone, value: listPrice}));
        });

        it('should revert if no price', async function () {
            // give approval
            await this.futballCards.approve(this.marketplace.address, firstTokenId, {from: tokenOwner});

            await shouldFail.reverting(this.marketplace.buyNow(firstTokenId, {from: anyone, value: 0}));
        });

        it('should revert if paused', async function () {
            // give approval
            await this.futballCards.approve(this.marketplace.address, firstTokenId, {from: tokenOwner});

            await this.marketplace.pause({from: creator});
            await shouldFail.reverting(this.marketplace.buyNow(firstTokenId, {from: anyone, value: listPrice}));
        });
    });
});
