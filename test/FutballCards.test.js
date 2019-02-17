const FutballCards = artifacts.require('FutballCards');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract('FutballCards', ([_, creator, tokenOwner, anyone, ...accounts]) => {

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

        it('set attributes must be whitelisted', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            await shouldFail.reverting(this.futballCards.setAttributes(firstTokenId, 1, 1, 1, 1, {from: tokenOwner}));
        });

        it('set name', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            await this.futballCards.setName(firstTokenId, 2, 2, {from: creator});

            const attrsAndName = await this.futballCards.attributesAndName(firstTokenId);
            attrsAndName[5].should.be.bignumber.equal('2');
            attrsAndName[6].should.be.bignumber.equal('2');
        });

        it('set name must be whitelisted', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            await shouldFail.reverting(this.futballCards.setName(firstTokenId, 2, 2, {from: tokenOwner}));
        });

        it('set special', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            const {logs} = await this.futballCards.setSpecial(firstTokenId, 3, {from: creator});
            expectEvent.inLogs(
                logs,
                `SpecialSet`,
                {_tokenId: new BN(0), _value: new BN(3)}
            );

            const attrsAndName = await this.futballCards.attributesAndName(firstTokenId);
            attrsAndName[4].should.be.bignumber.equal('3');
        });

        it('set special must be whitelisted', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            await shouldFail.reverting(this.futballCards.setSpecial(firstTokenId, 3, {from: tokenOwner}));
        });
    });

    context('should set extras', function () {

        it('set badge', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            const {logs} = await this.futballCards.setBadge(firstTokenId, 4, {from: creator});
            expectEvent.inLogs(
                logs,
                `BadgeSet`,
                {_tokenId: new BN(0), _value: new BN(4)}
            );

            const extras = await this.futballCards.extras(firstTokenId);
            extras[0].should.be.bignumber.equal('4');
        });

        it('set badge must be whitelisted', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            await shouldFail.reverting(this.futballCards.setBadge(firstTokenId, 4, {from: tokenOwner}));
        });

        it('set sponsor', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            const {logs} = await this.futballCards.setSponsor(firstTokenId, 5, {from: creator});
            expectEvent.inLogs(
                logs,
                `SponsorSet`,
                {_tokenId: new BN(0), _value: new BN(5)}
            );

            const extras = await this.futballCards.extras(firstTokenId);
            extras[1].should.be.bignumber.equal('5');
        });

        it('set sponsor must be whitelisted', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            await shouldFail.reverting(this.futballCards.setSponsor(firstTokenId, 4, {from: tokenOwner}));
        });

        it('set number', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            const {logs} = await this.futballCards.setNumber(firstTokenId, 6, {from: creator});
            expectEvent.inLogs(
                logs,
                `NumberSet`,
                {_tokenId: new BN(0), _value: new BN(6)}
            );

            const extras = await this.futballCards.extras(firstTokenId);
            extras[2].should.be.bignumber.equal('6');
        });

        it('set number must be whitelisted', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            await shouldFail.reverting(this.futballCards.setNumber(firstTokenId, 4, {from: tokenOwner}));
        });

        it('set boots', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            const {logs} = await this.futballCards.setBoots(firstTokenId, 7, {from: creator});
            expectEvent.inLogs(
                logs,
                `BootsSet`,
                {_tokenId: new BN(0), _value: new BN(7)}
            );

            const extras = await this.futballCards.extras(firstTokenId);
            extras[3].should.be.bignumber.equal('7');
        });

        it('set boots must be whitelisted', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            await shouldFail.reverting(this.futballCards.setBoots(firstTokenId, 4, {from: tokenOwner}));
        });

        it('add star', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            const {logs} = await this.futballCards.addStar(firstTokenId, {from: creator});
            expectEvent.inLogs(
                logs,
                `StarAdded`,
                {_tokenId: new BN(0), _value: new BN(1)}
            );

            const extras = await this.futballCards.extras(firstTokenId);
            extras[4].should.be.bignumber.equal('1');
        });

        it('add star must be whitelisted', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            await shouldFail.reverting(this.futballCards.addStar(firstTokenId, {from: tokenOwner}));
        });

        it('add xp', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            const {logs} = await this.futballCards.addXp(firstTokenId, 99, {from: creator});
            expectEvent.inLogs(
                logs,
                `XpAdded`,
                {_tokenId: new BN(0), _value: new BN(99)}
            );

            const extras = await this.futballCards.extras(firstTokenId);
            extras[4].should.be.bignumber.equal('1');
        });

        it('add xp must be whitelisted', async function () {
            await this.futballCards.mintCard(0, 0, 0, 0, 0, 0, tokenOwner, {from: creator});

            await shouldFail.reverting(this.futballCards.addXp(firstTokenId, 4, {from: tokenOwner}));
        });
    });
});
