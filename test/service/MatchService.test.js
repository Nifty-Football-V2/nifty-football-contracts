const MatchService = artifacts.require('MatchService');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract('MatchService Contract Tests',
             ([_, creator, tokenOwner1, tokenOwner2, tokenOwner3, oracle, oracle2, random, ...accounts]) => {
     const thenExpectTheFollowingEvent = expectEvent;

     const validationErrorContentKeys = {
         oracleAddressZero: "oracle.interface.error.oracle.address.zero",
         oracleEqOwner: "oracle.interface.error.oracle.address.eq.owner",
         zeroAddress: "oracle.interface.error.address.zero"
     };

     function givenTheOracleAddressWasUpdatedTo(contract, address, sender) {
         return contract.updateOracle(address, {from: sender});
     }

     beforeEach(async () => {
         this.matchService = await MatchService.new(oracle, {from: creator});

         (await this.matchService.owner()).should.be.equal(creator);
         (await this.matchService.oracle()).should.be.equal(oracle);
     });

     context('validation', async () => {
         context('when creating the contract', async () => {
             it('should fail to create contract with address(0) oracle', async () => {
                 await shouldFail.reverting.withMessage(
                     MatchService.new(constants.ZERO_ADDRESS, {from: creator}),
                     validationErrorContentKeys.oracleAddressZero
                 );
             });

             it('should fail to create contract when oracle and owner are the same address', async () => {
                 await shouldFail.reverting.withMessage(
                     MatchService.new(creator, {from: creator}),
                     validationErrorContentKeys.oracleEqOwner
                 );
             });
         });

         context('when paused', async () => {
             beforeEach(async () => {
                this.matchService.pause({from: creator});
                 (await this.matchService.paused()).should.be.true;
             });

            it('should fail to update the oracles address', async () => {
                await shouldFail.reverting(givenTheOracleAddressWasUpdatedTo(this.matchService, random, creator));
            });
         });

         context('when updating oracle address', async () => {
             it('should be successful with valid parameters', async () => {
                 const {logs} = await givenTheOracleAddressWasUpdatedTo(this.matchService, oracle2, creator);

                 thenExpectTheFollowingEvent.inLogs(logs,
                     'OracleUpdated',
                     {
                         previous: oracle,
                         current: oracle2
                     }
                 );
             });

             it('should fail when not owner', async () => {
                 await shouldFail.reverting(givenTheOracleAddressWasUpdatedTo(this.matchService, oracle2, random));
             });

             it('should prevent oracle being updated to address(0)', async () => {
                 await shouldFail.reverting.withMessage(
                     givenTheOracleAddressWasUpdatedTo(this.matchService, constants.ZERO_ADDRESS, creator),
                     validationErrorContentKeys.zeroAddress
                 );
             });
         });
     });
});