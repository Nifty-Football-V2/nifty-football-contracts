const _ = require('lodash');

const NiftyFootballTradingCardGenerator = artifacts.require('NiftyFootballTradingCardGenerator');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract.skip('NiftyFootballTradingCardGenerator tests', (accounts) => {

    beforeEach(async function () {
        this.generator = await NiftyFootballTradingCardGenerator.new({from: accounts[0]});

        this.nationalitiesLen = 10;
        this.positionsLen = 10;
        this.kitsLen = 22;
        this.coloursLen = 22;
        this.ethnicitiesLen = 22;
    });

    context('Nationalities - ensure can manipulate seed arrays', function () {
        it('adds to', async function () {
            let nationalities = await this.generator.allNationalities();
            nationalities.length.should.be.equal(this.nationalitiesLen);

            await this.generator.addNationality(new BN('5'), {from: accounts[0]});
            nationalities = await this.generator.allNationalities();
            nationalities.length.should.be.equal(this.nationalitiesLen + 1);
        });

        it('replace at index', async function () {
            await this.generator.clearNationalityAtIndex(1, {from: accounts[0]});
            let nationalities = await this.generator.allNationalities();
            nationalities.length.should.be.equal(this.nationalitiesLen - 1);

            await this.generator.clearNationalityAtIndex(1, {from: accounts[0]});
            nationalities = await this.generator.allNationalities();
            nationalities.length.should.be.equal(this.nationalitiesLen - 2);
        });

        it('replace', async function () {
            await this.generator.clearNationalities({from: accounts[0]});
            let nationalities = await this.generator.allNationalities();
            nationalities.length.should.be.equal(0);

            await this.generator.addNationality(new BN('55'), {from: accounts[0]});
            nationalities = await this.generator.allNationalities();
            nationalities.length.should.be.equal(1);
            nationalities[0].should.be.bignumber.equal('55');
        });

        it('only owner can clear', async function () {
            await shouldFail.reverting(this.generator.clearNationalities({from: accounts[1]}));
        });

        it('only owner can clear at index', async function () {
            await shouldFail.reverting(this.generator.clearNationalityAtIndex(1, {from: accounts[1]}));
        });

        it('only owner can add to', async function () {
            await shouldFail.reverting(this.generator.addNationality(new BN('6'), {from: accounts[1]}));
        });
    });

    context('Positions - ensure can manipulate seed arrays', function () {
        it('adds to', async function () {
            let positions = await this.generator.allPositions();
            positions.length.should.be.equal(this.positionsLen);

            await this.generator.addPosition(new BN('5'), {from: accounts[0]});
            positions = await this.generator.allPositions();
            positions.length.should.be.equal(this.positionsLen + 1);
        });

        it('replace at index', async function () {
            await this.generator.clearPositionAtIndex(1, {from: accounts[0]});
            let positions = await this.generator.allPositions();
            positions.length.should.be.equal(this.positionsLen - 1);

            await this.generator.clearPositionAtIndex(1, {from: accounts[0]});
            positions = await this.generator.allPositions();
            positions.length.should.be.equal(this.positionsLen - 2);
        });

        it('replace', async function () {
            await this.generator.clearPositions({from: accounts[0]});
            let positions = await this.generator.allPositions();
            positions.length.should.be.equal(0);

            await this.generator.addPosition(new BN('55'), {from: accounts[0]});
            positions = await this.generator.allPositions();
            positions.length.should.be.equal(1);
            positions[0].should.be.bignumber.equal('55');
        });

        it('only owner can clear', async function () {
            await shouldFail.reverting(this.generator.clearPositions({from: accounts[1]}));
        });

        it('only owner can clear at index', async function () {
            await shouldFail.reverting(this.generator.clearPositionAtIndex(1, {from: accounts[1]}));
        });

        it('only owner can add to', async function () {
            await shouldFail.reverting(this.generator.addPosition(new BN('6'), {from: accounts[1]}));
        });
    });

    context('Kits - ensure can manipulate seed arrays', function () {
        it('adds to', async function () {
            let kits = await this.generator.allKits();
            kits.length.should.be.equal(this.kitsLen);

            await this.generator.addKit(new BN('5'), {from: accounts[0]});
            kits = await this.generator.allKits();
            kits.length.should.be.equal(this.kitsLen + 1);
        });

        it('replace at index', async function () {
            await this.generator.clearKitAtIndex(1, {from: accounts[0]});
            let kits = await this.generator.allKits();
            kits.length.should.be.equal(this.kitsLen - 1);

            await this.generator.clearKitAtIndex(1, {from: accounts[0]});
            kits = await this.generator.allKits();
            kits.length.should.be.equal(this.kitsLen - 2);
        });

        it('replace', async function () {
            await this.generator.clearKits({from: accounts[0]});
            let kits = await this.generator.allKits();
            kits.length.should.be.equal(0);

            await this.generator.addKit(new BN('55'), {from: accounts[0]});
            kits = await this.generator.allKits();
            kits.length.should.be.equal(1);
            kits[0].should.be.bignumber.equal('55');
        });

        it('only owner can clear', async function () {
            await shouldFail.reverting(this.generator.clearKits({from: accounts[1]}));
        });

        it('only owner can clear at index', async function () {
            await shouldFail.reverting(this.generator.clearKitAtIndex(1, {from: accounts[1]}));
        });

        it('only owner can add to', async function () {
            await shouldFail.reverting(this.generator.addKit(new BN('6'), {from: accounts[1]}));
        });
    });

    context('Colours - ensure can manipulate seed arrays', function () {
        it('adds to', async function () {
            let colours = await this.generator.allColours();
            colours.length.should.be.equal(this.coloursLen);

            await this.generator.addColour(new BN('5'), {from: accounts[0]});
            colours = await this.generator.allColours();
            colours.length.should.be.equal(this.coloursLen + 1);
        });

        it('replace at index', async function () {
            await this.generator.clearColourAtIndex(1, {from: accounts[0]});
            let colours = await this.generator.allColours();
            colours.length.should.be.equal(this.coloursLen -1);

            await this.generator.clearColourAtIndex(1, {from: accounts[0]});
            colours = await this.generator.allColours();
            colours.length.should.be.equal(this.coloursLen - 2);
        });

        it('replace', async function () {
            await this.generator.clearColours({from: accounts[0]});
            let colours = await this.generator.allColours();
            colours.length.should.be.equal(0);

            await this.generator.addColour(new BN('55'), {from: accounts[0]});
            colours = await this.generator.allColours();
            colours.length.should.be.equal(1);
            colours[0].should.be.bignumber.equal('55');
        });

        it('only owner can clear', async function () {
            await shouldFail.reverting(this.generator.clearColours({from: accounts[1]}));
        });

        it('only owner can clear at index', async function () {
            await shouldFail.reverting(this.generator.clearColourAtIndex(1, {from: accounts[1]}));
        });

        it('only owner can add to', async function () {
            await shouldFail.reverting(this.generator.addColour(new BN('6'), {from: accounts[1]}));
        });
    });

    context('Ethnicities - ensure can manipulate seed arrays', function () {
        it('adds to', async function () {
            let ethnicities = await this.generator.allEthnicities();
            ethnicities.length.should.be.equal(this.ethnicitiesLen);

            await this.generator.addEthnicity(new BN('5'), {from: accounts[0]});
            ethnicities = await this.generator.allEthnicities();
            ethnicities.length.should.be.equal(this.ethnicitiesLen + 1);
        });

        it('replace at index', async function () {
            await this.generator.clearEthnicityAtIndex(1, {from: accounts[0]});
            let ethnicities = await this.generator.allEthnicities();
            ethnicities.length.should.be.equal(this.ethnicitiesLen - 1);

            await this.generator.clearEthnicityAtIndex(1, {from: accounts[0]});
            ethnicities = await this.generator.allEthnicities();
            ethnicities.length.should.be.equal(this.ethnicitiesLen - 2);
        });

        it('replace', async function () {
            await this.generator.clearEthnicities({from: accounts[0]});
            let ethnicities = await this.generator.allEthnicities();
            ethnicities.length.should.be.equal(0);

            await this.generator.addEthnicity(new BN('55'), {from: accounts[0]});
            ethnicities = await this.generator.allEthnicities();
            ethnicities.length.should.be.equal(1);
            ethnicities[0].should.be.bignumber.equal('55');
        });

        it('only owner can clear', async function () {
            await shouldFail.reverting(this.generator.clearEthnicities({from: accounts[1]}));
        });

        it('only owner can clear at index', async function () {
            await shouldFail.reverting(this.generator.clearEthnicityAtIndex(1, {from: accounts[1]}));
        });

        it('only owner can add to', async function () {
            await shouldFail.reverting(this.generator.addEthnicity(new BN('6'), {from: accounts[1]}));
        });
    });

    // it('generate me some randoms', async function () {
    //     const results = {};
    //     for (let i = 0; i < 100; i++) {
    //         const {logs} = await this.generator.generateCard(randomAccount());
    //
    //         // const {_nationality, _position, _ethnicity, _kit, _colour} = logs[0].args;
    //         // console.log(`N ${_nationality} P ${_position} E ${_ethnicity} K ${_kit} C ${_colour}`);
    //     }
    // });

    function randomAccount () {
        // Random account between 0-9 (10 accounts)
        return accounts[Math.floor(Math.random() * Math.floor(9))];
    }
});
