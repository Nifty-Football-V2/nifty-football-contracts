const _ = require('lodash');

const FutballCardsGenerator = artifacts.require('FutballCardsGenerator');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract('FutballCardsGenerator tests', (accounts) => {

    before(async function () {
        console.log(accounts);
        this.generator = await FutballCardsGenerator.new({from: accounts[0]});
    });

    it('generate me some randoms', async function () {
        const results = {};
        for (let i = 0; i < 100; i++) {
            const {logs} = await this.generator.generateCard(randomAccount());

            const {_nationality, _position, _ethnicity, _kit, _colour} = logs[0].args;
            console.log(`N ${_nationality} P ${_position} E ${_ethnicity} K ${_kit} C ${_colour}`);
        }
    });

    function randomAccount () {
        // Random account between 0-9 (10 accounts)
        return accounts[Math.floor(Math.random() * Math.floor(9))];
    }
});
