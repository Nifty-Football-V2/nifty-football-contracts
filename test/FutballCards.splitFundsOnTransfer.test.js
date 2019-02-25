const FutballCards = artifacts.require('FutballCards');

const {BN, constants, expectEvent, shouldFail, ether, balance} = require('openzeppelin-test-helpers');

contract.only('FutballCards send ETH on transfer', ([_, creator, seller, buyer, ...accounts]) => {

    const firstTokenId = new BN(0);
    const ONE_ETH = ether("1");

    const baseURI = 'http://futball-cards/';

    beforeEach(async function () {
        this.futballCards = await FutballCards.new(baseURI, {from: creator});
        (await this.futballCards.isWhitelisted(creator)).should.be.true;

        await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, seller, {from: creator});
        (await this.futballCards.totalCards()).should.be.bignumber.equal('1');

        this.commissionAccount = await this.futballCards.commissionAccount();
    });

    it('checking token owner', async function () {
        const ownerOf = await this.futballCards.ownerOf(firstTokenId);
        ownerOf.should.be.equal(seller);
    });

    context('should split funds if transfer invoked with msg.value', function () {

        it('during normal transfer', async function () {

            const sellerBalance = await balance.current(seller);
            const buyerBalance = await balance.current(buyer);
            const commissionAccountBalance = await balance.current(this.commissionAccount);

            console.log(seller, buyerBalance);
            console.log(buyer, sellerBalance);
            console.log(this.commissionAccount, commissionAccountBalance);

            await this.futballCards.transferFrom(seller, buyer, firstTokenId, {from: seller, value: ONE_ETH});

            const sellerBalanceAfter = await balance.current(seller);
            const buyerBalanceAfter = await balance.current(buyer);
            const commissionAccountBalanceAfter = await balance.current(this.commissionAccount);

            console.log(sellerBalance, sellerBalanceAfter);
            console.log(buyerBalance, buyerBalanceAfter);
            console.log(commissionAccountBalance, commissionAccountBalanceAfter);
        });

    });

    context('parent marketplace takes all funds', function () {


    });
});
