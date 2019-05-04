const MatchService = artifacts.require('MatchService');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract('MatchService Contract Tests',
             ([_, creator, tokenOwner1, tokenOwner2, tokenOwner3, oracle, oracle2, random, ...accounts]) => {
     const thenExpectTheFollowingEvent = expectEvent;

     const validationErrorContentKeys = {
         oracleAddressZero: "oracle.interface.error.oracle.address.zero",
         oracleEqOwner: "oracle.interface.error.oracle.address.eq.owner",
         zeroAddress: "oracle.interface.error.address.zero",
         matchExists: "match.service.error.match.exists",
         predictBeforeAfterResultAfterTime: "match.service.error.predict.before.is.after.result.after",
         pastPredictionDeadline: "match.service.error.past.prediction.deadline",
         notOracle: "match.service.error.not.oracle",
         matchIdInvalid: "match.service.error.invalid.match.id",
         matchNotUpcoming: "match.service.error.match.not.upcoming",
         notPostponed: "match.service.error.match.not.postponed",
         invalidMatchResultState: "match.service.error.invalid.match.result.state",
         resultWindowNotOpen: "match.service.error.result.window.not.open"
     };

     const Outcomes = {
         UNINITIALISED: new BN(0),
         HOME_WIN: new BN(1),
         AWAY_WIN: new BN(2),
         DRAW: new BN(3)
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

     function givenAMatchIsPostponed(contract, sender) {
         return givenASpecificMatchIsPostponed(contract, match1.id, sender);
     }

     function givenASpecificMatchIsPostponed(contract, matchId, sender) {
         return contract.postponeMatch(matchId, {from: sender});
     }

     function givenAMatchIsCancelled(contract, sender) {
         return givenASpecificMatchIsCancelled(contract, match1.id, sender);
     }

     function givenASpecificMatchIsCancelled(contract, matchId, sender) {
         return contract.cancelMatch(matchId, {from: sender});
     }

     function givenAMatchIsRestored(contract, sender) {
         return givenASpecificMatchIsRestored(contract, match1.id, seconds_since_epoch() + 6, seconds_since_epoch() + 8, sender);
     }

     function givenASpecificMatchIsRestored(contract, matchId, predictBefore, resultAfter, sender) {
         return contract.restoreMatch(matchId, predictBefore, resultAfter, {from: sender});
     }

     function givenAMatchResultWasSupplied(contract, sender) {
         return givenASpecificMatchResultSupplied(contract, match1.id, Outcomes.HOME_WIN, sender);
     }

     function givenASpecificMatchResultSupplied(contract, matchId, result, sender) {
         return contract.matchResult(matchId, result, {from: sender});
     }

     function givenTheOracleAddressWasUpdatedTo(contract, address, sender) {
         return contract.updateOracle(address, {from: sender});
     }

     function givenAnAddressIsWhitelisted(contract, address, sender) {
         return contract.whitelist(address, {from: sender});
     }

     function getMatchState(contract, matchId, sender) {
         return contract.matchState(matchId, {from: sender});
     }

     function getMatchResult(contract, matchId, sender) {
         return contract.matchResult(matchId, {from: sender});
     }

     function isBeforePredictionDeadline(contract, matchId, sender) {
         return contract.isBeforePredictionDeadline(matchId, {from: sender});
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

             it('should fail to add a match', async () => {
                 await shouldFail.reverting(givenAMatchIsAdded(this.matchService, oracle));
             });

             it('should fail to postpone a match', async () => {
                 await shouldFail.reverting(givenAMatchIsPostponed(this.matchService, oracle));
             });

             it('should fail to cancel a match', async () => {
                 await shouldFail.reverting(givenAMatchIsCancelled(this.matchService, oracle));
             });

             it('should fail to restore a match', async () => {
                 await shouldFail.reverting(givenAMatchIsRestored(this.matchService, oracle));
             });

             it('should fail to supply a match result', async () => {
                 await shouldFail.reverting(givenAMatchResultWasSupplied(this.matchService, oracle));
             });

             it('should fail to whitelist an address', async () => {
                await shouldFail.reverting(givenAnAddressIsWhitelisted(this.matchService, random, creator));
             });

             it('should fail to get a match state', async () => {
                await shouldFail.reverting(getMatchState(this.matchPrediction, match1.id, creator));
             });

             it('should fail to get a match result', async () => {
                 await shouldFail.reverting(getMatchResult(this.matchPrediction, match1.id, creator));
             });

             it('should fail to establish prediction deadline status', async () => {
                await shouldFail.reverting(isBeforePredictionDeadline(this.matchPrediction, match1.id, creator));
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

         context('when postponing a match', async () => {
             beforeEach(async () => {
                 await givenAMatchIsAdded(this.matchService, oracle);
             });

             it('should be successful with valid parameters', async () => {
                 const {logs} = await givenAMatchIsPostponed(this.matchService, oracle);

                 thenExpectTheFollowingEvent.inLogs(logs,
                     'MatchPostponed',
                     {
                         id: match1.id
                     }
                 );
             });

             it('should block any non-oracle address', async () => {
                 await shouldFail.reverting.withMessage(
                     givenAMatchIsPostponed(this.matchService, random),
                     validationErrorContentKeys.notOracle
                 );
             });

             it('should fail when match does not exist', async () => {
                 const invalidMatchId = new BN(5);

                 await shouldFail.reverting.withMessage(
                     givenASpecificMatchIsPostponed(this.matchService, invalidMatchId, oracle),
                     validationErrorContentKeys.matchIdInvalid
                 );
             });


             it('should fail when match already postponed', async () => {
                 await givenAMatchIsPostponed(this.matchService, oracle);

                 await shouldFail.reverting.withMessage(
                     givenAMatchIsPostponed(this.matchService, oracle),
                     validationErrorContentKeys.matchNotUpcoming
                 );
             });

             it('should fail when a match has already been cancelled', async () => {
                 await givenAMatchIsCancelled(this.matchService, oracle);

                 await shouldFail.reverting.withMessage(
                     givenAMatchIsPostponed(this.matchService, oracle),
                     validationErrorContentKeys.matchNotUpcoming
                 );
             });
         });

         context('when cancelling a match', async () => {
             beforeEach(async () => {
                 await givenAMatchIsAdded(this.matchService, oracle);
             });

             it('should be successful with valid parameters', async () => {
                 const {logs} = await givenAMatchIsCancelled(this.matchService, oracle);

                 thenExpectTheFollowingEvent.inLogs(logs,
                     'MatchCancelled',
                     {
                         id: match1.id
                     }
                 );
             });

             it('should block any non-oracle address', async () => {
                 await shouldFail.reverting.withMessage(
                     givenAMatchIsCancelled(this.matchService, random),
                     validationErrorContentKeys.notOracle
                 );
             });

             it('should fail when a match doesnt exist', async () => {
                 await shouldFail.reverting.withMessage(
                     givenASpecificMatchIsCancelled(this.matchService, new BN(5), oracle),
                     validationErrorContentKeys.matchIdInvalid
                 );
             });

             it('should fail when match already cancelled', async () => {
                 await givenAMatchIsCancelled(this.matchService, oracle);

                 await shouldFail.reverting.withMessage(
                     givenAMatchIsCancelled(this.matchService, oracle),
                     validationErrorContentKeys.matchNotUpcoming
                 );
             });

             it('should fail when a match has previously been postponed', async () => {
                 await givenAMatchIsPostponed(this.matchService, oracle);

                 await shouldFail.reverting.withMessage(
                     givenAMatchIsCancelled(this.matchService, oracle),
                     validationErrorContentKeys.matchNotUpcoming
                 );
             });
         });

         context('when restoring a match', async () => {
             beforeEach(async () => {
                 await givenAMatchIsAdded(this.matchService, oracle);
                 await givenAMatchIsPostponed(this.matchService, oracle);
             });

             it('should be successful with valid parameters', async () => {
                 const {logs} = await givenAMatchIsRestored(this.matchService, oracle);

                 thenExpectTheFollowingEvent.inLogs(logs,
                     'MatchRestored',
                     {
                         id: match1.id
                     }
                 );
             });

             it('should block any non-oracle address', async () => {
                 await shouldFail.reverting.withMessage(
                     givenAMatchIsRestored(this.matchService, random),
                     validationErrorContentKeys.notOracle
                 );
             });

             it('should fail when a match doesnt exist', async () => {
                 await shouldFail.reverting.withMessage(
                     givenASpecificMatchIsRestored(this.matchService, new BN(4), new BN(0), new BN(0), oracle),
                     validationErrorContentKeys.matchIdInvalid
                 );
             });

             it('should fail when match not postponed', async () => {
                 const randomMatch = {
                     id: new BN(45),
                     predictBefore: seconds_since_epoch() + 5,
                     resultAfter: seconds_since_epoch() + 8
                 };

                 await givenASpecificMatchIsAdded(this.matchService, randomMatch, oracle);

                 await shouldFail.reverting.withMessage(
                     givenASpecificMatchIsRestored(this.matchService, randomMatch.id, seconds_since_epoch() + 3, seconds_since_epoch() + 6, oracle),
                     validationErrorContentKeys.notPostponed
                 );
             });

             it('should fail when result after is before prediction window', async () => {
                 await shouldFail.reverting.withMessage(
                     givenASpecificMatchIsRestored(this.matchService, match1.id, seconds_since_epoch() + 8, seconds_since_epoch(), oracle),
                     validationErrorContentKeys.predictBeforeAfterResultAfterTime
                 );
             });

             it('should fail when prediction window invalid', async () => {
                 await shouldFail.reverting.withMessage(
                     givenASpecificMatchIsRestored(this.matchService, match1.id, seconds_since_epoch() - 6, seconds_since_epoch() + 1, oracle),
                     validationErrorContentKeys.pastPredictionDeadline
                 );
             });
         });

         context('when supplying a match result', async () => {
             beforeEach(async () => {
                 await givenAMatchIsAdded(this.matchService, oracle);
             });

             it('should be successful with valid parameters', async () => {
                 await sleep(4500);

                 //await whenASpecificMatchIsAdded(this.matchPrediction, );
                 const {logs} = await givenAMatchResultWasSupplied(this.matchService, oracle);

                 thenExpectTheFollowingEvent.inLogs(logs,
                     'MatchOutcome',
                     {
                         id: match1.id,
                         result: Outcomes.HOME_WIN
                     }
                 );
             });

             it('should block any non-oracle address', async () => {
                 await shouldFail.reverting.withMessage(
                     givenASpecificMatchResultSupplied(this.matchService, match1.id, Outcomes.HOME_WIN, random),
                     validationErrorContentKeys.notOracle
                 );
             });

             it('should fail when a match doesnt exist', async () => {
                 await shouldFail.reverting.withMessage(
                     givenASpecificMatchResultSupplied(this.matchService, new BN(2), Outcomes.HOME_WIN, oracle),
                     validationErrorContentKeys.matchIdInvalid
                 );
             });

             it('should fail when match has been cancelled', async () => {
                 await givenAMatchIsCancelled(this.matchService, oracle);

                 await shouldFail.reverting.withMessage(
                     givenAMatchResultWasSupplied(this.matchService, oracle),
                     validationErrorContentKeys.matchNotUpcoming
                 );
             });

             it('should fail when match has been postponed', async () => {
                 await givenAMatchIsPostponed(this.matchService, oracle);

                 await shouldFail.reverting.withMessage(
                     givenAMatchResultWasSupplied(this.matchService, oracle),
                     validationErrorContentKeys.matchNotUpcoming
                 );
             });

             it('should fail when result is invalid', async () => {
                 await shouldFail.reverting.withMessage(
                     givenASpecificMatchResultSupplied(this.matchService, match1.id, Outcomes.UNINITIALISED, oracle),
                     validationErrorContentKeys.invalidMatchResultState
                 );
             });

             it('should fail when result window not open', async () => {
                 await shouldFail.reverting.withMessage(
                     givenAMatchResultWasSupplied(this.matchService, oracle),
                     validationErrorContentKeys.resultWindowNotOpen
                 );
             });
         });

         context('when whitelisting an address', async () => {
            it('should be successful with valid parameters', async () => {
                const {logs} = await givenAnAddressIsWhitelisted(this.matchService, random, creator);

                thenExpectTheFollowingEvent.inLogs(logs,
                    'NewWhitelist',
                    {
                        addr: random
                    }
                );
            });

            it('should fail when owner is not whitelisting', async () => {
                await shouldFail.reverting(givenAnAddressIsWhitelisted(this.matchService, random, random));
            });
         });
     });
});
