const MatchOracle = artifacts.require('MatchOracle');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract.only('MatchOracle Contract Tests',
             ([_, creator, tokenOwner1, externalContract, oracle, oracle2, random, ...accounts]) => {
     const thenExpectTheFollowingEvent = expectEvent;

     const validationErrorContentKeys = {
         oracleAddressZero: "oracle.interface.error.oracle.address.zero",
         oracleEqOwner: "oracle.interface.error.oracle.address.eq.owner",
         zeroAddress: "oracle.interface.error.address.zero",
         matchExists: "match.service.error.match.exists",
         predictBeforeAfterResultAfterTime: "match.service.error.match.start.is.after.match.end",
         pastPredictionDeadline: "match.service.error.past.match.start.time",
         notOracle: "match.service.error.not.oracle",
         matchIdInvalid: "match.service.error.invalid.match.id",
         matchNotUpcoming: "match.service.error.match.not.upcoming",
         notPostponed: "match.service.error.match.not.postponed",
         invalidMatchResultState: "match.service.error.invalid.match.result.state",
         resultWindowNotOpen: "match.service.error.result.window.not.open"
     };

     const MatchStates = {
         UNINITIALISED: new BN(0),
         UPCOMING: new BN(1),
         POSTPONED: new BN(2),
         CANCELLED: new BN(3),
         RESULTED: new BN(4)
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
         const match = {
             id: match1.id,
             predictBefore: seconds_since_epoch() + 2,
             resultAfter: seconds_since_epoch() + 3,
             description: "",
             resultSource: ""
         };
         return givenASpecificMatchIsAdded(contract, match, sender);
     }

     function givenASpecificMatchIsAdded(contract, match, sender) {
         return contract.addMatch(match.id, match.predictBefore, match.resultAfter, match.description, match.resultSource, {from: sender});
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
         return contract.resultMatch(matchId, result, {from: sender});
     }

     function givenTheOracleAddressWasUpdatedTo(contract, address, sender) {
         return contract.updateOracle(address, true, {from: sender});
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

     function isBeforeMatchStartTime(contract, matchId, sender) {
         return contract.isBeforeMatchStartTime(matchId, {from: sender});
     }

     async function thenExpectTheFollowingMatchState(contract, state) {
         await givenAnAddressIsWhitelisted(contract, externalContract, creator);
         (await getMatchState(contract, match1.id, externalContract)).should.be.bignumber.equal(state);
     }

     async function thenExpectTheFirstMatchIdToEqual(contract, target) {
         (await contract.matchIds(0)).should.be.bignumber.equal(`${target}`);
     }

     async function thenExpectTheFollowingMatchResult(contract, result) {
         await givenAnAddressIsWhitelisted(contract, externalContract, creator);
         (await getMatchResult(contract, match1.id, externalContract)).should.be.bignumber.equal(result);
     }

     async function thenExpectNowToBeBeforePredictionDeadline(contract) {
         await givenAnAddressIsWhitelisted(contract, externalContract, creator);
         (await isBeforeMatchStartTime(contract, match1.id, externalContract)).should.be.true;
     }

     beforeEach(async () => {
         this.matchService = await MatchOracle.new(oracle, {from: creator});

         (await this.matchService.owner()).should.be.equal(creator);
         (await this.matchService.isOracle(oracle)).should.be.true;
     });

     context('validation', async () => {
         context('when creating the contract', async () => {
             it('should fail to create contract with address(0) oracle', async () => {
                 await shouldFail.reverting.withMessage(
                     MatchOracle.new(constants.ZERO_ADDRESS, {from: creator}),
                     validationErrorContentKeys.oracleAddressZero
                 );
             });

             it('should fail to create contract when oracle and owner are the same address', async () => {
                 await shouldFail.reverting.withMessage(
                     MatchOracle.new(creator, {from: creator}),
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
                await shouldFail.reverting(getMatchState(this.matchService, match1.id, creator));
             });

             it('should fail to get a match result', async () => {
                 await shouldFail.reverting(getMatchResult(this.matchService, match1.id, creator));
             });

             it('should fail to establish prediction deadline status', async () => {
                await shouldFail.reverting(isBeforeMatchStartTime(this.matchService, match1.id, creator));
             });
         });

         context('when updating oracle address', async () => {
             it('should be successful with valid parameters', async () => {
                 const {logs} = await givenTheOracleAddressWasUpdatedTo(this.matchService, oracle2, creator);

                 thenExpectTheFollowingEvent.inLogs(logs,
                     'OracleUpdated',
                     {
                         addr: oracle2,
                         isOracle: true
                     }
                 );

                 // Ensure the new oracle can now perform operations and a random address can't
                 await givenAMatchIsAdded(this.matchService, oracle2);

                 let match2 = {
                     id: 2,
                     predictBefore: seconds_since_epoch() + 2,
                     resultAfter: seconds_since_epoch() + 3,
                     description: "",
                     resultSource: ""
                 };
                 await shouldFail.reverting.withMessage(
                     givenASpecificMatchIsAdded(this.matchService, match2, random),
                     validationErrorContentKeys.notOracle
                 );
             });

             it('should fail when not owner', async () => {
                 await shouldFail.reverting(givenTheOracleAddressWasUpdatedTo(this.matchService, oracle2, random));
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

                 await thenExpectTheFollowingMatchState(this.matchService, MatchStates.UPCOMING);
                 await thenExpectTheFollowingMatchResult(this.matchService, Outcomes.UNINITIALISED);
                 await thenExpectTheFirstMatchIdToEqual(this.matchService, match1.id);
                 await thenExpectNowToBeBeforePredictionDeadline(this.matchService);

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
                     resultAfter: new BN(seconds_since_epoch() + 4),
                     description: "",
                     resultSource: ""
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
                     resultAfter: new BN(seconds_since_epoch() + 9),
                     description: "",
                     resultSource: ""
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

                 await thenExpectTheFollowingMatchState(this.matchService, MatchStates.POSTPONED);
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

                 await thenExpectTheFollowingMatchState(this.matchService, MatchStates.CANCELLED);
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

                 await thenExpectTheFollowingMatchState(this.matchService, MatchStates.UPCOMING);
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
                     resultAfter: seconds_since_epoch() + 8,
                     description: "",
                     resultSource: ""
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

                 await thenExpectTheFollowingMatchState(this.matchService, MatchStates.RESULTED);
                 await thenExpectTheFollowingMatchResult(this.matchService, Outcomes.HOME_WIN);
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

             it('should fail when trying to supply a match result twice', async () => {
                 await sleep(4500);
                 await givenAMatchResultWasSupplied(this.matchService, oracle);

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
                const {logs} = await givenAnAddressIsWhitelisted(this.matchService, externalContract, creator);

                thenExpectTheFollowingEvent.inLogs(logs,
                    'NewWhitelist',
                    {
                        addr: externalContract
                    }
                );
            });

            it('should fail when owner is not whitelisting', async () => {
                await shouldFail.reverting(givenAnAddressIsWhitelisted(this.matchService, random, random));
            });
         });
     });
});
