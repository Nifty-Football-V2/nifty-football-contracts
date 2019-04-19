const MatchService = artifacts.require('MatchService');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract.only('MatchService Contract Tests',
             ([_, creator, tokenOwner1, tokenOwner2, tokenOwner3, oracle, oracle2, random, ...accounts]) => {
     const thenExpectTheFollowingEvent = expectEvent;

     const validationErrorContentKeys = {
         oracleAddressZero: "oracle.interface.error.oracle.address.zero",
         oracleEqOwner: "oracle.interface.error.oracle.address.eq.owner",
         zeroAddress: "oracle.interface.error.address.zero",
         matchExists: "match.service.error.match.exists",
         predictBeforeAfterResultAfterTime: "match.service.error.predict.before.is.after.result.after",
         pastPredictionDeadline: "match.service.error.past.prediction.deadline",
         notOracle: "match.service.error.not.oracle"
     };

     const match1 = {
         id: new BN(34564543)
     };

     function seconds_since_epoch(){ return Math.floor( Date.now() / 1000 ) }
     function sleep(ms) {
         return new Promise(resolve => setTimeout(resolve, ms));
     }

     function givenAMatchIsAdded(contract, sender) {
         return contract.addMatch(match1.id, seconds_since_epoch() + 2, seconds_since_epoch() + 3, {from: sender});
     }

     function givenASpecificMatchIsAdded(contract, match, sender) {
         return contract.addMatch(match.id, match.predictBefore, match.resultAfter, {from: sender});
     }

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

         context('when adding matches', async () => {
             it('should be successful with valid parameters', async () => {
                 const {logs} = await givenAMatchIsAdded(this.matchService, oracle);

                 thenExpectTheFollowingEvent.inLogs(logs,
                     "MatchAdded",
                     {
                         id: match1.id
                     }
                 );

                 (await this.matchService.matchIds(0)).should.be.bignumber.equal(`${match1.id}`);
             });

             it('should block any non-oracle address', async () => {
                 await shouldFail.reverting.withMessage(
                     givenAMatchIsAdded(this.matchService, tokenOwner1),
                     validationErrorContentKeys.notOracle
                 );
             });

             it('should not allow the same match to be added twice', async () => {
                 await givenAMatchIsAdded(this.matchService, oracle);

                 await shouldFail.reverting.withMessage(
                     givenAMatchIsAdded(this.matchService, oracle),
                     validationErrorContentKeys.matchExists
                 );
             });

             it('should not allow result after time to be before prediction deadline', async () => {
                 const matchWithInvalidResultAfter = {
                     id: new BN(1),
                     predictBefore: new BN(seconds_since_epoch() + 9),
                     resultAfter: new BN(seconds_since_epoch() + 4)
                 };

                 await shouldFail.reverting.withMessage(
                     givenASpecificMatchIsAdded(this.matchService, matchWithInvalidResultAfter, oracle),
                     validationErrorContentKeys.predictBeforeAfterResultAfterTime
                 );
             });

             it('should not allow addition when already past prediction deadline', async () => {
                 const matchWithPastPredictionDeadline = {
                     id: match1.id,
                     predictBefore: new BN(seconds_since_epoch() - 5),
                     resultAfter: new BN(seconds_since_epoch() + 9)
                 };

                 await shouldFail.reverting.withMessage(
                     givenASpecificMatchIsAdded(this.matchService, matchWithPastPredictionDeadline, oracle),
                     validationErrorContentKeys.pastPredictionDeadline
                 );
             });
         });
     });
});