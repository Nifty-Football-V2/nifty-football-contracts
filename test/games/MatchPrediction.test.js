const NiftyFootballTradingCard = artifacts.require('NiftyFootballTradingCard');
const MatchPrediction = artifacts.require('MatchPrediction');
const MatchService = artifacts.require('MatchService');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract('Match Prediction Contract Tests',
             ([_, creator, tokenOwner1, tokenOwner2, tokenOwner3, oracle, oracle2, random, ...accounts]) => {
    const baseURI = 'http://futball-cards';

    const thenExpectTheFollowingEvent = expectEvent;

    const validationErrorContentKeys = {
        notOracle: "match.prediction.validation.error.not.oracle",
        matchExists: "match.prediction.validation.error.match.exists",
        zeroAddress: "match.prediction.validation.error.address.zero",
        zeroAddressCardGame: "card.game.error.address.zero",
        matchIdInvalid: "match.prediction.validation.error.invalid.match.id",
        nftNotApproved: "card.game.error.nft.not.approved",
        notNFTOwner: "card.game.error.not.nft.owner",
        tokenAlreadyPlaying: "card.game.error.token.playing",
        matchServiceAddressZero: "match.prediction.error.match.service.address.zero",
        nftAddressZero: "match.prediction.error.nft.contract.address.zero",
        invalidGameId: "card.game.error.invalid.game",
        gameComplete: "card.game.error.game.complete",
        invalidPrediction: "match.prediction.validation.error.invalid.prediction",
        matchServiceEqOwner: "match.prediction.error.match.service.address.eq.owner",
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
        resultAfterNotInFuture: "match.prediction.validation.error.result.after.not.in.future",
        notPostponed: "match.prediction.validation.error.match.not.postponed",
        resultWindowNotOpen: "match.prediction.validation.error.result.window.not.open"
    };

    const Outcomes = {
        UNINITIALISED: new BN(0),
        HOME_WIN: new BN(1),
        AWAY_WIN: new BN(2),
        DRAW: new BN(3)
    };

    const GameState = {
        UNINITIALISED: new BN(0),
        OPEN: new BN(1),
        PREDICTIONS_RECEIVED: new BN(2),
        PLAYER_1_WIN: new BN(3),
        PLAYER_2_WIN: new BN(4),
        NEITHER_PLAYER_WINS: new BN(5),
        CLOSED: new BN(6)
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
        return contract.resultMatch(matchId, result, {from: sender});
    }

    function givenTheNftContractWasUpdated(contract, newAddr, sender) {
        return contract.updateNft(newAddr, {from: sender});
    }

    beforeEach(async () => {
        this.niftyFootballCards = await NiftyFootballTradingCard.new(baseURI, {from: creator});
        this.matchService = await MatchService.new(oracle, {from: creator});
        this.matchPrediction = await MatchPrediction.new(this.niftyFootballCards.address, this.matchService.address, {from: creator});

        await this.matchService.whitelist(this.matchPrediction.address, {from: creator});

        //(await this.niftyFootballCards.totalCards()).should.be.bignumber.equal('0');
        (await this.matchPrediction.totalGamesCreated()).should.be.bignumber.equal('0');
        (await this.matchPrediction.owner()).should.be.equal(creator);
        (await this.matchService.isWhitelisted(this.matchPrediction.address)).should.be.true;
    });

    context('validation', async () => {
        context('when creating the contract', async () => {
            it('should fail to create contract with address(0) Match Service', async () => {
                await shouldFail.reverting.withMessage(
                    MatchPrediction.new(this.niftyFootballCards.address, constants.ZERO_ADDRESS, {from: creator}),
                    validationErrorContentKeys.matchServiceAddressZero
                );
            });

            it('should fail to create contract when Match Service and owner are the same address', async () => {
                await shouldFail.reverting.withMessage(
                    MatchPrediction.new(this.niftyFootballCards.address, creator, {from: creator}),
                    validationErrorContentKeys.matchServiceEqOwner
                );
            });

            it('should fail to create contract with address(0) nft contract', async () => {
               await shouldFail.reverting.withMessage(
                   MatchPrediction.new(constants.ZERO_ADDRESS, this.matchService.address, {from: creator}),
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

            it('should fail to update the nft contract', async () => {
               await shouldFail.reverting(givenTheNftContractWasUpdated(this.matchPrediction, random, creator));
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
        });

        context('when updating the nft contract', async () => {
            it('should be successful with valid parameters', async () => {
                const {logs} = await givenTheNftContractWasUpdated(this.matchPrediction, random, creator);

                thenExpectTheFollowingEvent.inLogs(logs,
                    'NFTUpdated',
                    {
                        prevAddr: this.niftyFootballCards.address,
                        newAddr: random
                    }
                );
            });

            it('should fail when not owner', async () => {
               await shouldFail.reverting(givenTheNftContractWasUpdated(this.matchPrediction, random, random));
            });

            it('should fail when trying to update to address zero', async () => {
               await shouldFail.reverting.withMessage(
                   givenTheNftContractWasUpdated(this.matchPrediction, constants.ZERO_ADDRESS, creator),
                   validationErrorContentKeys.zeroAddressCardGame
               );
            });
        });

        context('when making the first prediction', async () => {
            beforeEach(async () => {
                await this.niftyFootballCards.mintCard(1, 1, 1, 1, 1, 1, tokenOwner1, {from: creator});
                await this.niftyFootballCards.approve(this.matchPrediction.address, _tokenId1, {from: tokenOwner1});

                await this.niftyFootballCards.mintCard(2, 2, 2, 2, 2, 2, tokenOwner2, {from: creator});

                //(await this.niftyFootballCards.totalCards()).should.be.bignumber.equal('2');

                await givenAMatchIsAdded(this.matchService, oracle);
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
                    validationErrorContentKeys.matchNotUpcoming
                );
            });

            it('should fail when match has been postponed', async () => {
               await givenAMatchIsPostponed(this.matchService, oracle);

               await shouldFail.reverting.withMessage(
                   makeAFirstPredictionFor(this.matchPrediction, match1.id, _tokenId1, Outcomes.UNINITIALISED, tokenOwner1),
                   validationErrorContentKeys.matchNotUpcoming
               );
            });

            it('should fail when match has been cancelled', async () => {
                await whenAMatchIsCancelled(this.matchService, oracle);

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
                const randomMatch = {
                    id: new BN(24),
                    predictBefore: new BN(seconds_since_epoch() + 3),
                    resultAfter: new BN(seconds_since_epoch() + 5)
                };

                givenASpecificMatchIsAdded(this.matchService, randomMatch, oracle);

                await sleep(4500);

                await shouldFail.reverting.withMessage(
                    makeAFirstPredictionFor(this.matchPrediction, randomMatch.id, _tokenId1, Outcomes.HOME_WIN, tokenOwner1),
                    validationErrorContentKeys.pastPredictionDeadline
                );
            });
        });

        context('when making the second prediction', async () => {
            beforeEach(async () => {
                await this.niftyFootballCards.mintCard(1, 1, 1, 1, 1, 1, tokenOwner1, {from: creator});
                await this.niftyFootballCards.approve(this.matchPrediction.address, _tokenId1, {from: tokenOwner1});

                await this.niftyFootballCards.mintCard(2, 2, 2, 2, 2, 2, tokenOwner2, {from: creator});
                await this.niftyFootballCards.approve(this.matchPrediction.address, _tokenId2, {from: tokenOwner2});

                await this.niftyFootballCards.mintCard(3, 3, 3, 3, 3, 3, random, {from: creator});

                //(await this.niftyFootballCards.totalCards()).should.be.bignumber.equal('3');

                await givenAMatchIsAdded(this.matchService, oracle);

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
               (await this.niftyFootballCards.ownerOf(_tokenId1)).should.be.equal(this.matchPrediction.address);
               (await this.niftyFootballCards.ownerOf(_tokenId2)).should.be.equal(this.matchPrediction.address);
            });

            it('should fail on referencing an invalid game', async () => {
                await shouldFail.reverting.withMessage(
                    makeASecondPredictionFor(this.matchPrediction, new BN(2), _tokenId3, Outcomes.UNINITIALISED, random),
                    validationErrorContentKeys.invalidGameId
                );
            });

            it('should fail when match has been postponed', async () => {
                await givenAMatchIsPostponed(this.matchService, oracle);

                await shouldFail.reverting.withMessage(
                    givenABasicSecondPrediction(this.matchPrediction, tokenOwner2),
                    validationErrorContentKeys.matchNotUpcoming
                );
            });

            it('should fail when match has been cancelled', async () => {
                await whenAMatchIsCancelled(this.matchService, oracle);

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
                function revokePlayer1TransferApproval(niftyFootballCards) {
                    return niftyFootballCards.approve(constants.ZERO_ADDRESS, _tokenId1, {from: tokenOwner1});
                }

                await revokePlayer1TransferApproval(this.niftyFootballCards);

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
               await this.niftyFootballCards.mintCard(1, 1, 1, 1, 1, 1, tokenOwner1, {from: creator});
               await this.niftyFootballCards.approve(this.matchPrediction.address, _tokenId1, {from: tokenOwner1});

               await this.niftyFootballCards.mintCard(2, 2, 2, 2, 2, 2, tokenOwner2, {from: creator});
               await this.niftyFootballCards.approve(this.matchPrediction.address, _tokenId2, {from: tokenOwner2});

               //(await this.niftyFootballCards.totalCards()).should.be.bignumber.equal('2');

               await givenAMatchIsAdded(this.matchService, oracle);

               await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);
           });

           it('should be successful with valid parameters', async () => {
               await givenABasicSecondPrediction(this.matchPrediction, tokenOwner2);
               await sleep(4250);
               await givenAMatchResultWasSupplied(this.matchService, oracle);

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

               (await this.niftyFootballCards.ownerOf(_tokenId1)).should.be.equal(tokenOwner1);
               (await this.niftyFootballCards.ownerOf(_tokenId2)).should.be.equal(tokenOwner1);
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
