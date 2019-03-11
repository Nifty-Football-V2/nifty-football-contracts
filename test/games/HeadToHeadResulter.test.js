
const HeadToHeadResulter = artifacts.require('HeadToHeadResulter');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract('HeadToHead resulter tests', ([_, creator, tokenOwner1, tokenOwner2, anyone, ...accounts]) => {

    context.only('should be able to play game', async function () {

        it('cant create game', async function () {
            console.log(HeadToHeadResulter);
            const h2hResulter = await HeadToHeadResulter.new({from: creator});
            console.log(h2hResulter);

            for (let i = 0; i < 100; i++) {
                const {logs} = await h2hResulter.result(i, creator);

                console.log(logs[0].args.result);
            }
        });
    });

});
