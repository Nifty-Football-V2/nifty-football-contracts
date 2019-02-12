const _ = require('lodash');

const FutballCardsGenerator = artifacts.require('FutballCardsGenerator');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract.only('FutballCardsGenerator tests', (accounts) => {

    before(async function () {
        // console.log(accounts);
        this.generator = await FutballCardsGenerator.new({from: accounts[0]});
    });

    context('ensure can add to seed arrays', function () {
        it('adds to nationalities', async function () {
            let nationalities = await this.generator.allNationalities();
            nationalities.length.should.be.equal(5);

            await this.generator.addNationality(new BN('5'), {from: accounts[0]});
            nationalities = await this.generator.allNationalities();
            nationalities.length.should.be.equal(6);
        });

        it('replace nationality at index', async function () {
            await this.generator.clearNationalityAtIndex(1, {from: accounts[0]});
            let nationalities = await this.generator.allNationalities();
            nationalities.length.should.be.equal(5);

            await this.generator.clearNationalityAtIndex(1, {from: accounts[0]});
            nationalities = await this.generator.allNationalities();
            nationalities.length.should.be.equal(4);
        });

        it('replace nationalities', async function () {
            await this.generator.clearNationalities({from: accounts[0]});
            let nationalities = await this.generator.allNationalities();
            nationalities.length.should.be.equal(0);
        });

        it('only owner can clear nationalities', async function () {
            await shouldFail.reverting(this.generator.clearNationalities({from: accounts[1]}));
        });

        it('only owner can clear nationality at index', async function () {
            await shouldFail.reverting(this.generator.clearNationalityAtIndex(1, {from: accounts[1]}));
        });

        it('only owner can add to nationalities', async function () {
            await shouldFail.reverting(this.generator.addNationality(new BN('6'), {from: accounts[1]}));
        });
    });

    // it('generate me some randoms', async function () {
    //     const results = {};
    //     for (let i = 0; i < 100; i++) {
    //         const {logs} = await this.generator.generateCard(randomAccount());
    //
    //         const {_nationality, _position, _ethnicity, _kit, _colour} = logs[0].args;
    //         console.log(`N ${_nationality} P ${_position} E ${_ethnicity} K ${_kit} C ${_colour}`);
    //     }
    // });

    function randomAccount () {
        // Random account between 0-9 (10 accounts)
        return accounts[Math.floor(Math.random() * Math.floor(9))];
    }
});
