const FutballCards = artifacts.require('FutballCards');
const MatchPrediction = artifacts.require('MatchPrediction');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract.only('Match Prediction Contract Tests',
             ([_, creator, tokenOwner1, tokenOwner2, tokenOwner3, oracle, oracle2, random, ...accounts]) => {
    const baseURI = 'http://futball-cards';

    const thenExpectTheFollowingEvent = expectEvent;

    const validationErrorContentKeys = {
        notOracle: "match.prediction.validation.error.not.oracle",
        matchExists: "match.prediction.validation.error.match.exists",
        zeroAddress: "match.prediction.validation.error.address.zero",
        matchIdInvalid: "match.prediction.validation.error.invalid.match.id",
        nftNotApproved: "futball.card.game.error.nft.not.approved",
        notNFTOwner: "futball.card.game.error.not.nft.owner",
        tokenAlreadyPlaying: "futball.card.game.error.token.playing",
        oracleAddressZero: "match.prediction.error.oracle.address.zero",
        nftAddressZero: "match.prediction.error.nft.contract.address.zero",
        invalidGameId: "futball.card.game.error.invalid.game",
        gameComplete: "futball.card.game.error.game.complete",
        invalidPrediction: "match.prediction.validation.error.invalid.prediction",
        oracleEqOwner: "match.prediction.error.oracle.address.eq.owner",
        nftContractEqOwner: "match.prediction.error.nft.contract.eq.owner",
        p1RevokedApproval: "match.prediction.validation.error.p1.revoked.approval",
        p2PredictionInvalid: "match.prediction.validation.error.p2.prediction.invalid",
        matchNotUpcoming: "match.prediction.validation.error.match.not.upcoming",
        gameMatchResultNotReceived: "match.prediction.validation.error.game.match.result.not.received",
        invalidMatchResultState: "match.prediction.validation.error.invalid.match.result.state",
        matchResultStateNotWinning: "match.prediction.validation.error.match.result.state.not.winning",
        predictionsNotReceived: "match.prediction.validation.error.game.predictions.not.received",
        pastPredictionDeadline: "match.prediction.validation.error.past.prediction.deadline",
        predictBeforeAfterResultAfterTime: "match.prediction.validation.error.predict.before.is.after.result.after",
        resultAfterNotInFuture: "match.prediction.validation.error.result.after.not.in.future"
    };

    const Outcomes = {
        UNINITIALISED: new BN(0),
        HOME_WIN: new BN(1),
        AWAY_WIN: new BN(2),
        DRAW: new BN(3)
    };

    const MatchState = {
        UNINITIALISED: new BN(0),
        UPCOMING: new BN(1),
        POSTPONED: new BN(2),
        CANCELLED: new BN(3)
    };

    const GameState = {
        UNINITIALISED: new BN(0),
        OPEN: new BN(1),
        PREDICTIONS_RECEIVED: new BN(2),
        PLAYER_1_WIN: new BN(3),
        PLAYER_2_WIN: new BN(4),
        CLOSED: new BN(5)
    };

    const _tokenId1 = new BN(1);
    const _tokenId2 = new BN(2);
    const _tokenId3 = new BN(3);

    const _game1Id = new BN(1);

    function seconds_since_epoch(){ return Math.floor( Date.now() / 1000 ) }
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const match1 = {
        id: new BN(34564543)
    };

    function whenANewMatchIsAdded(contract, sender) {
        return contract.addMatch(match1.id, seconds_since_epoch() + 2, seconds_since_epoch() + 3, {from: sender});
    }

    function whenASpecificMatchIsAdded(contract, match, sender) {
        return contract.addMatch(match.id, match.predictBefore, match.resultAfter, {from: sender});
    }

    function whenAMatchIsPostponed(contract, sender) {
        return whenASpecificMatchIsPostponed(contract, match1.id, sender);
    }

    function whenASpecificMatchIsPostponed(contract, matchId, sender) {
        return contract.postponeMatch(matchId, {from: sender});
    }

    function whenAMatchIsCancelled(contract, sender) {
        return whenASpecificMatchIsCancelled(contract, match1.id, sender);
    }

    function whenASpecificMatchIsCancelled(contract, matchId, sender) {
        return contract.cancelMatch(matchId, {from: sender});
    }

    function whenAMatchIsRestored(contract, sender) {
        return whenASpecificMatchIsRestored(contract, match1.id, seconds_since_epoch() + 6, seconds_since_epoch() + 8, sender);
    }

    function whenASpecificMatchIsRestored(contract, matchId, predictBefore, resultAfter, sender) {
        return contract.restoreMatch(matchId, predictBefore, resultAfter, {from: sender});
    }

    function givenABasicFirstPrediction(contract, sender) {
        return makeAFirstPredictionFor(contract, match1.id, _tokenId1, Outcomes.HOME_WIN, sender);
    }

    function makeAFirstPredictionFor(contract, matchId, tokenId, prediction, sender) {
        return contract.makeFirstPrediction(matchId, tokenId, prediction, {from: sender});
    }

    function givenABasicSecondPrediction(contract, sender) {
        return makeASecondPredictionFor(contract, _game1Id, _tokenId2, Outcomes.AWAY_WIN, sender);
    }

    function makeASecondPredictionFor(contract, gameId, tokenId, prediction, sender) {
        return contract.makeSecondPrediction(gameId, tokenId, prediction, {from: sender});
    }

    function givenAWithdrawalTookPlace(contract, sender) {
        return givenAWithdrawalForASpecificGame(contract, _game1Id, sender);
    }

    function givenAWithdrawalForASpecificGame(contract, id, sender) {
        return contract.withdraw(id, {from: sender});
    }

    function givenAMatchResultWasSupplied(contract, sender) {
        return whenASpecificMatchResultSupplied(contract, match1.id, Outcomes.HOME_WIN, sender);
    }

    function whenASpecificMatchResultSupplied(contract, matchId, result, sender) {
        return contract.matchResult(matchId, result, {from: sender});
    }

    beforeEach(async () => {
        this.futballCards = await FutballCards.new(baseURI, {from: creator});
        this.matchPrediction = await MatchPrediction.new(this.futballCards.address, oracle, {from: creator});

        (await this.futballCards.totalCards()).should.be.bignumber.equal('0');
        (await this.matchPrediction.totalGamesCreated()).should.be.bignumber.equal('0');
        (await this.matchPrediction.owner()).should.be.equal(creator);
        (await this.matchPrediction.oracle()).should.be.equal(oracle);
    });

    context('validation', async () => {
        context('when creating the contract', async () => {
            it('should fail to create contract with address(0) oracle', async () => {
                await shouldFail.reverting.withMessage(
                    MatchPrediction.new(this.futballCards.address, constants.ZERO_ADDRESS, {from: creator}),
                    validationErrorContentKeys.oracleAddressZero
                );
            });

            it('should fail to create contract when oracle and owner are the same address', async () => {
                await shouldFail.reverting.withMessage(
                    MatchPrediction.new(this.futballCards.address, creator, {from: creator}),
                    validationErrorContentKeys.oracleEqOwner
                );
            });

            it('should fail to create contract with address(0) nft contract', async () => {
               await shouldFail.reverting.withMessage(
                   MatchPrediction.new(constants.ZERO_ADDRESS, oracle, {from: creator}),
                   validationErrorContentKeys.nftAddressZero
               );
            });

            it('should fail to create contract when nft contract and owner are the same address', async () => {
                await shouldFail.reverting.withMessage(
                    MatchPrediction.new(creator, oracle, {from: creator}),
                    validationErrorContentKeys.nftContractEqOwner
                );
            });
        });

        context('when paused', async () => {
            beforeEach(async () => {
                await this.matchPrediction.pause({from: creator});
                (await this.matchPrediction.paused()).should.be.true;
            });

            it('should fail to add a match', async () => {
               await shouldFail.reverting(whenANewMatchIsAdded(this.matchPrediction, oracle));
            });

            it('should fail to postpone a match', async () => {
               await shouldFail.reverting(whenAMatchIsPostponed(this.matchPrediction, oracle));
            });

            it('should fail to cancel a match', async () => {
               await shouldFail.reverting(whenAMatchIsCancelled(this.matchPrediction, oracle));
            });

            it('should fail to restore a match', async () => {
               await shouldFail.reverting(whenAMatchIsRestored(this.matchPrediction, oracle));
            });

            it('should fail to supply a match result', async () => {
               await shouldFail.reverting.withMessage(givenAMatchResultWasSupplied(this.matchPrediction, oracle));
            });

            it('should fail to withdraw cards', async () => {
               await shouldFail.reverting(givenAWithdrawalTookPlace(this.matchPrediction, random));
            });

            it('should fail to create a game', async () => {
                await shouldFail.reverting(givenABasicFirstPrediction(this.matchPrediction, tokenOwner1));
            });

            it('should fail on an attempt to do a second prediction', async () => {
                await shouldFail.reverting(givenABasicSecondPrediction(this.matchPrediction, tokenOwner2));
            });

            it('should fail to update the oracle address', async () => {
               await shouldFail.reverting(this.matchPrediction.updateOracle(oracle));
            });
        });

        context('when adding matches', async () => {
            it('should be successful with valid parameters', async () => {
                const {logs} = await whenANewMatchIsAdded(this.matchPrediction, oracle);

                thenExpectTheFollowingEvent.inLogs(logs,
                    "MatchAdded",
                    {
                        id: match1.id
                    }
                );

                (await this.matchPrediction.matchIds(0)).should.be.bignumber.equal(`${match1.id}`);
            });

            it('should block any non-oracle address', async () => {
                await shouldFail.reverting.withMessage(
                    whenANewMatchIsAdded(this.matchPrediction, tokenOwner1),
                    validationErrorContentKeys.notOracle
                );
            });

            it('should not allow the same match to be added twice', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);

                await shouldFail.reverting.withMessage(
                    whenANewMatchIsAdded(this.matchPrediction, oracle),
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
                   whenASpecificMatchIsAdded(this.matchPrediction, matchWithInvalidResultAfter, oracle),
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
                    whenASpecificMatchIsAdded(this.matchPrediction, matchWithPastPredictionDeadline, oracle),
                    validationErrorContentKeys.pastPredictionDeadline
                );
            });
        });

        context('when postponing a match', async () => {
            beforeEach(async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);
            });

            it('should be successful with valid parameters', async () => {
                const {logs} = await whenAMatchIsPostponed(this.matchPrediction, oracle);

                thenExpectTheFollowingEvent.inLogs(logs,
                    'MatchPostponed',
                    {
                        id: match1.id
                    }
                );
            });

            it('should block any non-oracle address', async () => {
                await shouldFail.reverting.withMessage(
                    whenAMatchIsPostponed(this.matchPrediction, random),
                    validationErrorContentKeys.notOracle
                );
            });

            it('should fail when match does not exist', async () => {
                const invalidMatchId = new BN(5);

                await shouldFail.reverting.withMessage(
                    whenASpecificMatchIsPostponed(this.matchPrediction, invalidMatchId, oracle),
                    validationErrorContentKeys.matchIdInvalid
                );
            });


            it('should fail when match already postponed', async () => {
                await whenAMatchIsPostponed(this.matchPrediction, oracle);

                await shouldFail.reverting.withMessage(
                    whenAMatchIsPostponed(this.matchPrediction, oracle),
                    validationErrorContentKeys.matchNotUpcoming
                );
            });

            it('should fail when a match has already been cancelled', async () => {
               await whenAMatchIsCancelled(this.matchPrediction, oracle);

               await shouldFail.reverting.withMessage(
                   whenAMatchIsPostponed(this.matchPrediction, oracle),
                   validationErrorContentKeys.matchNotUpcoming
               );
            });
        });

        context('when restoring a match', async () => {
            beforeEach(async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);
                await whenAMatchIsPostponed()
            });
        });

        context('when cancelling a match', async () => {
            beforeEach(async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);
            });

            it('should be successful with valid parameters', async () => {
               const {logs} = await whenAMatchIsCancelled(this.matchPrediction, oracle);

               thenExpectTheFollowingEvent.inLogs(logs,
                   'MatchCancelled',
                   {
                       id: match1.id
                   }
               );
            });

            it('should block any non-oracle address', async () => {
               await shouldFail.reverting.withMessage(
                   whenAMatchIsCancelled(this.matchPrediction, random),
                   validationErrorContentKeys.notOracle
               );
            });

            it('should fail when a match doesnt exist', async () => {
               await shouldFail.reverting.withMessage(
                   whenASpecificMatchIsCancelled(this.matchPrediction, new BN(5), oracle),
                   validationErrorContentKeys.matchIdInvalid
               );
            });

            it('should fail when match already cancelled', async () => {
               await whenAMatchIsCancelled(this.matchPrediction, oracle);

                await shouldFail.reverting.withMessage(
                    whenAMatchIsCancelled(this.matchPrediction, oracle),
                    validationErrorContentKeys.matchNotUpcoming
               );
            });

            it('should fail when a match has previously been postponed', async () => {
               await whenAMatchIsPostponed(this.matchPrediction, oracle);

               await shouldFail.reverting.withMessage(
                 whenAMatchIsCancelled(this.matchPrediction, oracle),
                 validationErrorContentKeys.matchNotUpcoming
               );
            });
        });

        context('when supplying a match result', async () => {
            beforeEach(async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);
            });

            it('should be successful with valid parameters', async () => {
                await sleep(4500);

                //await whenASpecificMatchIsAdded(this.matchPrediction, );
                const {logs} = await givenAMatchResultWasSupplied(this.matchPrediction, oracle);

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
                  whenASpecificMatchResultSupplied(this.matchPrediction, match1.id, Outcomes.HOME_WIN, random),
                  validationErrorContentKeys.notOracle
                );
            });

            it('should fail when a match doesnt exist', async () => {
               await shouldFail.reverting.withMessage(
                   whenASpecificMatchResultSupplied(this.matchPrediction, new BN(2), Outcomes.HOME_WIN, oracle),
                   validationErrorContentKeys.matchIdInvalid
               );
            });

            it('should fail when match has been cancelled', async () => {
               await whenAMatchIsCancelled(this.matchPrediction, oracle);

               await shouldFail.reverting.withMessage(
                   givenAMatchResultWasSupplied(this.matchPrediction, oracle),
                   validationErrorContentKeys.matchNotUpcoming
               );
            });

            it('should fail when match has been postponed', async () => {
                await whenAMatchIsPostponed(this.matchPrediction, oracle);

                await shouldFail.reverting.withMessage(
                    givenAMatchResultWasSupplied(this.matchPrediction, oracle),
                    validationErrorContentKeys.matchNotUpcoming
                );
            });

            it('should fail when result is invalid', async () => {
               await shouldFail.reverting.withMessage(
                   whenASpecificMatchResultSupplied(this.matchPrediction, match1.id, Outcomes.UNINITIALISED, oracle),
                   validationErrorContentKeys.invalidMatchResultState
               );
            });
        });

        context('when updating oracle address', async () => {
            it('should update as owner', async () => {
                const {logs} = await this.matchPrediction.updateOracle(oracle2, {from: creator});

                thenExpectTheFollowingEvent.inLogs(logs,
                    'OracleUpdated',
                    {
                        previous: oracle,
                        current: oracle2
                    }
                );
            });

            it('should fail when not owner', async () => {
                await shouldFail.reverting(this.matchPrediction.updateOracle(oracle2, {from: random}));
            });

            it('should prevent oracle being updated to address(0)', async () => {
                await shouldFail.reverting.withMessage(
                    this.matchPrediction.updateOracle(constants.ZERO_ADDRESS, {from: creator}),
                    validationErrorContentKeys.zeroAddress
                );
            });
        });

        context('when making the first prediction', async () => {
            beforeEach(async () => {
                await this.futballCards.mintCard(1, 1, 1, 1, 1, 1, tokenOwner1, {from: creator});
                await this.futballCards.approve(this.matchPrediction.address, _tokenId1, {from: tokenOwner1});

                await this.futballCards.mintCard(2, 2, 2, 2, 2, 2, tokenOwner2, {from: creator});

                (await this.futballCards.totalCards()).should.be.bignumber.equal('2');

                await whenANewMatchIsAdded(this.matchPrediction, oracle);
            });

            it('should be successful with valid parameters', async () => {
                const {logs} = await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);
                thenExpectTheFollowingEvent.inLogs(logs,
                    'GameCreated',
                    {
                        gameId: _game1Id,
                        player1: tokenOwner1,
                        p1TokenId: _tokenId1
                    }
                );

                (await this.matchPrediction.tokenIdToGameIdMapping(_tokenId1)).should.be.bignumber.equal(`${_game1Id}`);
                (await this.matchPrediction.getAllGameIds(tokenOwner1)).length.should.be.equal(1);
                (await this.matchPrediction.playerToGameIdsMapping(tokenOwner1,0)).should.be.bignumber.equal(`${_game1Id}`);
                (await this.matchPrediction.totalGamesCreated()).should.be.bignumber.equal('1');
            });

            it('should fail on referencing an invalid match', async () => {
                const invalidMatchId = new BN(2);
                await shouldFail.reverting.withMessage(
                    makeAFirstPredictionFor(this.matchPrediction, invalidMatchId, _tokenId1, Outcomes.UNINITIALISED, tokenOwner1),
                    validationErrorContentKeys.matchIdInvalid
                );
            });

            it('should fail when match has been postponed', async () => {
               await whenAMatchIsPostponed(this.matchPrediction, oracle);

               await shouldFail.reverting.withMessage(
                   makeAFirstPredictionFor(this.matchPrediction, match1.id, _tokenId1, Outcomes.UNINITIALISED, tokenOwner1),
                   validationErrorContentKeys.matchNotUpcoming
               );
            });

            it('should fail when match has been cancelled', async () => {
                await whenAMatchIsCancelled(this.matchPrediction, oracle);

                await shouldFail.reverting.withMessage(
                    makeAFirstPredictionFor(this.matchPrediction, match1.id, _tokenId1, Outcomes.UNINITIALISED, tokenOwner1),
                    validationErrorContentKeys.matchNotUpcoming
                );
            });

            it('should fail when contract not approved for token', async () => {
                await shouldFail.reverting.withMessage(
                    makeAFirstPredictionFor(this.matchPrediction, match1.id, _tokenId2, Outcomes.UNINITIALISED, tokenOwner2),
                    validationErrorContentKeys.nftNotApproved
                );
            });

            it('should fail when sender is not owner of token', async () => {
                await shouldFail.reverting.withMessage(
                    makeAFirstPredictionFor(this.matchPrediction, match1.id, _tokenId1, Outcomes.UNINITIALISED, tokenOwner2),
                    validationErrorContentKeys.notNFTOwner
                );
            });

            it('should fail when token is already playing', async () => {
                await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);

                await shouldFail.reverting.withMessage(
                    givenABasicFirstPrediction(this.matchPrediction, tokenOwner1),
                    validationErrorContentKeys.tokenAlreadyPlaying
                );
            });

            it('should fail when prediction is invalid', async () => {
                await shouldFail.reverting.withMessage(
                    makeAFirstPredictionFor(this.matchPrediction, match1.id, _tokenId1, Outcomes.UNINITIALISED, tokenOwner1),
                    validationErrorContentKeys.invalidPrediction
                );
            });

            it('should not allow a prediction past prediction deadline', async () => {
                const contract = this.matchPrediction;
                const randomMatch = {
                    id: new BN(24),
                    predictBefore: new BN(seconds_since_epoch() + 3),
                    resultAfter: new BN(seconds_since_epoch() + 5)
                };

                whenASpecificMatchIsAdded(contract, randomMatch, oracle);

                await sleep(4500);

                await shouldFail.reverting.withMessage(
                    makeAFirstPredictionFor(contract, randomMatch.id, _tokenId1, Outcomes.HOME_WIN, tokenOwner1),
                    validationErrorContentKeys.pastPredictionDeadline
                );
            });
        });

        context('when making the second prediction', async () => {
            beforeEach(async () => {
                await this.futballCards.mintCard(1, 1, 1, 1, 1, 1, tokenOwner1, {from: creator});
                await this.futballCards.approve(this.matchPrediction.address, _tokenId1, {from: tokenOwner1});

                await this.futballCards.mintCard(2, 2, 2, 2, 2, 2, tokenOwner2, {from: creator});
                await this.futballCards.approve(this.matchPrediction.address, _tokenId2, {from: tokenOwner2});

                await this.futballCards.mintCard(3, 3, 3, 3, 3, 3, random, {from: creator});

                (await this.futballCards.totalCards()).should.be.bignumber.equal('3');

                await whenANewMatchIsAdded(this.matchPrediction, oracle);

                await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);
            });

            it('should be successful with valid parameters', async () => {
               const {logs} = await givenABasicSecondPrediction(this.matchPrediction, tokenOwner2);
               thenExpectTheFollowingEvent.inLogs(logs,
                   'PredictionsReceived',
                   {
                       gameId: _game1Id,
                       player1: tokenOwner1,
                       player2: tokenOwner2
                   }
               );

               (await this.matchPrediction.totalGamesCreated()).should.be.bignumber.equal('1');

               (await this.matchPrediction.tokenIdToGameIdMapping(_tokenId1)).should.be.bignumber.equal(`${_game1Id}`);
               (await this.matchPrediction.tokenIdToGameIdMapping(_tokenId2)).should.be.bignumber.equal(`${_game1Id}`);
               (await this.matchPrediction.playerToGameIdsMapping(tokenOwner1,0)).should.be.bignumber.equal(`${_game1Id}`);
               (await this.matchPrediction.playerToGameIdsMapping(tokenOwner2,0)).should.be.bignumber.equal(`${_game1Id}`);

               // Ensures cards have been successfully escrowed
               (await this.futballCards.ownerOf(_tokenId1)).should.be.equal(this.matchPrediction.address);
               (await this.futballCards.ownerOf(_tokenId2)).should.be.equal(this.matchPrediction.address);
            });

            it('should fail on referencing an invalid game', async () => {
                await shouldFail.reverting.withMessage(
                    makeASecondPredictionFor(this.matchPrediction, new BN(2), _tokenId3, Outcomes.UNINITIALISED, random),
                    validationErrorContentKeys.invalidGameId
                );
            });

            it('should fail when match has been postponed', async () => {
                await whenAMatchIsPostponed(this.matchPrediction, oracle);

                await shouldFail.reverting.withMessage(
                    givenABasicSecondPrediction(this.matchPrediction, tokenOwner2),
                    validationErrorContentKeys.matchNotUpcoming
                );
            });

            it('should fail when match has been cancelled', async () => {
                await whenAMatchIsCancelled(this.matchPrediction, oracle);

                await shouldFail.reverting.withMessage(
                    givenABasicSecondPrediction(this.matchPrediction, tokenOwner2),
                    validationErrorContentKeys.matchNotUpcoming
                );
            });

            it('should fail when trying to amend second prediction', async () => {
                await givenABasicSecondPrediction(this.matchPrediction, tokenOwner2);

                await shouldFail.reverting.withMessage(
                    makeASecondPredictionFor(this.matchPrediction, _game1Id, _tokenId3, Outcomes.DRAW, tokenOwner3),
                    validationErrorContentKeys.gameComplete
                );
            });

            it('should fail when contract is not approved for token', async () => {
                await shouldFail.reverting.withMessage(
                    makeASecondPredictionFor(this.matchPrediction, _game1Id, _tokenId3, Outcomes.UNINITIALISED, tokenOwner3),
                    validationErrorContentKeys.nftNotApproved
                );
            });

            it('should fail when sender is not owner of token', async () => {
                await shouldFail.reverting.withMessage(
                    makeASecondPredictionFor(this.matchPrediction, _game1Id, _tokenId2, Outcomes.UNINITIALISED, tokenOwner3),
                    validationErrorContentKeys.notNFTOwner
                );
            });

            it('should fail when token is already playing', async () => {
                await givenABasicSecondPrediction(this.matchPrediction, tokenOwner2);

                await shouldFail.reverting.withMessage(
                    makeASecondPredictionFor(this.matchPrediction, _game1Id, _tokenId2, Outcomes.DRAW, tokenOwner2),
                    validationErrorContentKeys.tokenAlreadyPlaying
                );
            });

            it('should fail when player 1 has revoked transfer approval', async () => {
                function revokePlayer1TransferApproval(futballCards) {
                    return futballCards.approve(constants.ZERO_ADDRESS, _tokenId1, {from: tokenOwner1});
                }

                await revokePlayer1TransferApproval(this.futballCards);

                await shouldFail.reverting.withMessage(
                    givenABasicSecondPrediction(this.matchPrediction, tokenOwner2),
                    validationErrorContentKeys.p1RevokedApproval
                );
            });

            it('should fail when prediction is invalid', async () => {
                await shouldFail.reverting.withMessage(
                    makeASecondPredictionFor(this.matchPrediction, _game1Id, _tokenId2, Outcomes.UNINITIALISED, tokenOwner2),
                    validationErrorContentKeys.invalidPrediction
                );
            });

            it('should fail when player 2s prediction is the same as player 1', async () => {
                await shouldFail.reverting.withMessage(
                    makeASecondPredictionFor(this.matchPrediction, _game1Id, _tokenId2, Outcomes.HOME_WIN, tokenOwner2),
                    validationErrorContentKeys.p2PredictionInvalid
                );
            });
        });

        context('when a winner withdraws their cards', async () => {
           beforeEach(async () => {
               await this.futballCards.mintCard(1, 1, 1, 1, 1, 1, tokenOwner1, {from: creator});
               await this.futballCards.approve(this.matchPrediction.address, _tokenId1, {from: tokenOwner1});

               await this.futballCards.mintCard(2, 2, 2, 2, 2, 2, tokenOwner2, {from: creator});
               await this.futballCards.approve(this.matchPrediction.address, _tokenId2, {from: tokenOwner2});

               (await this.futballCards.totalCards()).should.be.bignumber.equal('2');

               await whenANewMatchIsAdded(this.matchPrediction, oracle);

               await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);
           });

           it('should be successful with valid parameters', async () => {
               await givenABasicSecondPrediction(this.matchPrediction, tokenOwner2);
               await sleep(4250);
               await givenAMatchResultWasSupplied(this.matchPrediction, oracle);

               (await this.matchPrediction.tokenIdToGameIdMapping(_tokenId1)).should.be.bignumber.equal(`${_game1Id}`);
               (await this.matchPrediction.tokenIdToGameIdMapping(_tokenId2)).should.be.bignumber.equal(`${_game1Id}`);

               const {logs} = await givenAWithdrawalTookPlace(this.matchPrediction, tokenOwner1);

               thenExpectTheFollowingEvent.inLogs(logs,
                   'GameFinished',
                   {
                       id: _game1Id,
                       result: GameState.PLAYER_1_WIN
                   }
               );

               (await this.futballCards.ownerOf(_tokenId1)).should.be.equal(tokenOwner1);
               (await this.futballCards.ownerOf(_tokenId2)).should.be.equal(tokenOwner1);
               (await this.matchPrediction.tokenIdToGameIdMapping(_tokenId1)).should.be.bignumber.equal('0');
               (await this.matchPrediction.tokenIdToGameIdMapping(_tokenId2)).should.be.bignumber.equal('0');
           });

           it('should fail when game doesnt exist', async () => {
              await shouldFail.reverting.withMessage(
                givenAWithdrawalForASpecificGame(this.matchPrediction, new BN(2), tokenOwner1),
                validationErrorContentKeys.invalidGameId
              );
           });

           it('should fail when not all predictions received', async () => {
              await shouldFail.reverting.withMessage(
                  givenAWithdrawalTookPlace(this.matchPrediction, tokenOwner1),
                  validationErrorContentKeys.predictionsNotReceived
              );
           });

           it('should fail when match result not yet received', async () => {
               await givenABasicSecondPrediction(this.matchPrediction, tokenOwner2);
               await shouldFail.reverting.withMessage(
                   givenAWithdrawalTookPlace(this.matchPrediction, tokenOwner1),
                   validationErrorContentKeys.gameMatchResultNotReceived
              );
           });
        });
    });

    /*context('playing the game', async () => {
        //todo: add beforeEach here with at least 2 matches added

        context('when match #1 is chosen', async () => {
            it('should handle a basic prediction', async () => {

            });
        });
    });*/

});
