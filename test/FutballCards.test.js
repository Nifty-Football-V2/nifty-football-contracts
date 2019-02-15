const FutballCards = artifacts.require('FutballCards');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract.only('FutballCards', ([_, creator, tokenOwner, anyone, ...accounts]) => {

    const firstTokenId = new BN(0);
    const secondTokenId = new BN(1);
    const unknownTokenId = new BN(999);

    const firstURI = 'http://futball-cards';
    const baseURI = 'http://futball-cards';

    before(async function () {
        // Create 721 contract
        this.futballCards = await FutballCards.new(baseURI, {from: creator});
        (await this.futballCards.isWhitelisted(creator)).should.be.true;
    });

    context('should mint card', function () {
        it('mints and emits event', async function () {
            const {logs} = await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});
            expectEvent.inLogs(
                logs,
                `CardMinted`,
                {_tokenId: new BN(0), _to: tokenOwner}
            );

            (await this.futballCards.totalCards()).should.be.bignumber.equal('1');
        });
    });

    context('should return correct values', function () {
        it('mints set card values', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            const cardAttrs = await this.futballCards.card(firstTokenId);

            cardAttrs[0].should.be.bignumber.equal('0');
            cardAttrs[1].should.be.bignumber.equal('0');
            cardAttrs[2].should.be.bignumber.equal('0');
            cardAttrs[3].should.be.bignumber.equal('0');
            cardAttrs[4].should.be.bignumber.equal('0');
            cardAttrs[5].should.be.bignumber.equal('0');
        });

        it('set attributes', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            await this.futballCards.setAttributes(firstTokenId, 1, 1, 1, 1, {from: creator});

            const attrsAndName = await this.futballCards.attributesAndName(firstTokenId);
            attrsAndName[0].should.be.bignumber.equal('1');
            attrsAndName[1].should.be.bignumber.equal('1');
            attrsAndName[2].should.be.bignumber.equal('1');
            attrsAndName[3].should.be.bignumber.equal('1');
        });

        it('set name', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            await this.futballCards.setName(firstTokenId, 2, 2, {from: creator});

            const attrsAndName = await this.futballCards.attributesAndName(firstTokenId);
            attrsAndName[5].should.be.bignumber.equal('2');
            attrsAndName[6].should.be.bignumber.equal('2');
        });
    });
});
