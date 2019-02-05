const FutballCards = artifacts.require('FutballCards');
const HeadToHead = artifacts.require('HeadToHead');
const HeadToHeadResulter = artifacts.require('HeadToHeadResulter');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');


contract.only('HeadToHead game tests', ([_, creator, tokenOwner1, tokenOwner2, anyone, ...accounts]) => {
    const baseURI = 'http://futball-cards';

    before(async function () {
        // Create 721 contract
        this.futballCards = await FutballCards.new(baseURI, {from: creator});
        this.resulter = await HeadToHeadResulter.new({from: creator});

        this.headToHead = await HeadToHead.new(this.resulter.address, this.futballCards.address, {from: creator});

        this.basePrice = await this.blindPack.priceInWei();
        this.basePrice.should.be.bignumber.equal('100');

        (await this.futballCards.totalCards()).should.be.bignumber.equal('0');
    });

    context('should be able to play game', async function () {

        beforeEach(async function () {
            await this.futballCards.mintCard(1, 1, 1, 1, 1, 1, tokenOwner1, {from: creator});
            await this.futballCards.setAttributes(0, 10, 10, 10, 10, {from: creator});

            await this.futballCards.mintCard(2, 2, 2, 2, 2, 2, tokenOwner2, {from: creator});
            await this.futballCards.setAttributes(1, 20, 20, 20, 20, {from: creator});

            await this.futballCards.mintCard(3, 3, 3, 3, 3, 3, anyone, {from: creator});
            await this.futballCards.setAttributes(2, 30, 30, 30, 30, {from: creator});

            (await this.futballCards.totalCards()).should.be.bignumber.equal(3);
        });
    });

});
