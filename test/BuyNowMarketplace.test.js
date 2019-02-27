const FutballCards = artifacts.require('FutballCards');
const BuyNowMarketplace = artifacts.require('BuyNowMarketplace');

const {BN, expectEvent, shouldFail, balance} = require('openzeppelin-test-helpers');

contract.only('BuyNowMarketplace', ([_, creator, tokenOwner, anyone, wallet, cleanWallet, ...accounts]) => {

    const firstTokenId = new BN(0);
    const secondTokenId = new BN(1);
    const thirdTokenId = new BN(2);
    const forthTokenId = new BN(3);
    const unknownTokenId = new BN(999);
    const listPrice = new BN(1000000);

    const baseURI = 'http://futball-cards/';

    beforeEach(async function () {
        // Create 721 contract
        this.futballCards = await FutballCards.new(baseURI, {from: creator});
        await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});
        await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});
        await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});
        await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

        this.marketplace = await BuyNowMarketplace.new(wallet, this.futballCards.address, 3, {from: creator});

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

        it('should revert if not owner', async function () {
            await shouldFail.reverting(this.marketplace.updateListedTokenPrice(thirdTokenId, 456, {from: anyone}));
        });

        it('should revert if paused', async function () {
            await this.marketplace.pause({from: creator});
            await shouldFail.reverting(this.marketplace.updateListedTokenPrice(forthTokenId, 456, {from: tokenOwner}));
        });

        // it('delists token', async function () {
        //     await this.marketplace.listToken(secondTokenId, listPrice, {from: tokenOwner});
        //
        //     let listed = await this.marketplace.listedTokens();
        //
        //     listed.length.should.be.equal(2);
        //
        //     await this.marketplace.delistToken(firstTokenId, {from: tokenOwner});
        //
        //     listed = await this.marketplace.listedTokens();
        //     console.log(listed);
        //     listed.length.should.be.equal(1);
        // });
    });
});
