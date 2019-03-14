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
        predictFromInvalid: "match.prediction.validation.error.predict.from.invalid",
        predictToBeforeFrom: "match.prediction.validation.error.predict.to.before.from",
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
        matchPostponed: "match.prediction.validation.error.match.postponed"
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

    const _tokenId1 = new BN(1);
    const _tokenId2 = new BN(2);
    const _tokenId3 = new BN(3);

    const _game1Id = new BN(1);

    const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;
    const predictFrom = Math.floor((new Date()).getTime());
    const predictTo = predictFrom + MILLISECONDS_IN_A_DAY;

    const match1 = {
        id: new BN(34564543),
        predictFrom: new BN(predictFrom),
        predictTo: new BN(predictTo),
        state: MatchState.UPCOMING
    };

    function whenANewMatchIsAdded(contract, sender) {
        return contract.addMatch(match1.id, match1.predictFrom, match1.predictTo, {from: sender});
    }

    function whenASpecificMatchIsAdded(contract, match, sender) {
        return contract.addMatch(match.id, match.predictFrom, match.predictTo, {from: sender});
    }

    function whenAMatchIsPostponed(contract, sender) {
        return whenASpecificMatchIsPostponed(contract, match1.id, sender);
    }

    function whenASpecificMatchIsPostponed(contract, matchId, sender) {
        return contract.postponeMatch(matchId, {from: sender});
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

    beforeEach(async () => {
        this.futballCards = await FutballCards.new(baseURI, {from: creator});
        this.matchPrediction = await MatchPrediction.new(this.futballCards.address, oracle, {from: creator});

        (await this.futballCards.totalCards()).should.be.bignumber.equal('0');
        (await this.matchPrediction.totalGames()).should.be.bignumber.equal('0');
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

            it('should fail to create contract with address(0) nft contract', async () => {
               await shouldFail.reverting.withMessage(
                   MatchPrediction.new(constants.ZERO_ADDRESS, oracle, {from: creator}),
                   validationErrorContentKeys.nftAddressZero
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

            it('should not allow predict from time to be in the past', async () => {
                const matchWithInvalidFrom = {
                    id: new BN(1),
                    predictFrom: new BN(0),
                    predictTo: new BN(predictTo)
                };

                await shouldFail.reverting.withMessage(
                   whenASpecificMatchIsAdded(this.matchPrediction, matchWithInvalidFrom, oracle),
                   validationErrorContentKeys.predictFromInvalid
               );
            });

            it('should not allow predict to time to be before allowed from time', async () => {
               const matchWithInvalidTo = {
                   id: new BN(1),
                   predictFrom: new BN(predictFrom),
                   predictTo: new BN(0)
               };

               await shouldFail.reverting.withMessage(
                   whenASpecificMatchIsAdded(this.matchPrediction, matchWithInvalidTo, oracle),
                   validationErrorContentKeys.predictToBeforeFrom
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


            it('should fail when match not already postponed', async () => {
                await whenAMatchIsPostponed(this.matchPrediction, oracle);

                await shouldFail.reverting.withMessage(
                    whenAMatchIsPostponed(this.matchPrediction, oracle),
                    validationErrorContentKeys.matchPostponed
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
                await this.futballCards.setAttributes(_tokenId1, 10, 10, 10, 10, {from: creator});
                await this.futballCards.approve(this.matchPrediction.address, _tokenId1, {from: tokenOwner1});

                await this.futballCards.mintCard(2, 2, 2, 2, 2, 2, tokenOwner2, {from: creator});
                await this.futballCards.setAttributes(_tokenId2, 5, 10, 20, 20, {from: creator});

                (await this.futballCards.totalCards()).should.be.bignumber.equal('2');
            });

            it('should be successful with valid parameters', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);

                const {logs} = await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);
                thenExpectTheFollowingEvent.inLogs(logs,
                    'GameCreated',
                    {
                        gameId: _game1Id,
                        player1: tokenOwner1,
                        p1TokenId: _tokenId1
                    }
                );

                (await this.matchPrediction.totalGames()).should.be.bignumber.equal('1');
            });

            it('should fail on referencing an invalid match', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);

                const invalidMatchId = new BN(2);
                await shouldFail.reverting.withMessage(
                    makeAFirstPredictionFor(this.matchPrediction, invalidMatchId, _tokenId1, Outcomes.UNINITIALISED, tokenOwner1),
                    validationErrorContentKeys.matchIdInvalid
                );
            });

            it('should fail when match has been postponed', async () => {
               await whenANewMatchIsAdded(this.matchPrediction, oracle);
               await whenAMatchIsPostponed(this.matchPrediction, oracle);

               await shouldFail.reverting.withMessage(
                   makeAFirstPredictionFor(this.matchPrediction, match1.id, _tokenId1, Outcomes.UNINITIALISED, tokenOwner1),
                   validationErrorContentKeys.matchPostponed
               );
            });

            it('should fail when contract not approved for token', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);

                await shouldFail.reverting.withMessage(
                    makeAFirstPredictionFor(this.matchPrediction, match1.id, _tokenId2, Outcomes.UNINITIALISED, tokenOwner2),
                    validationErrorContentKeys.nftNotApproved
                );
            });

            it('should fail when sender is not owner of token', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);

                await shouldFail.reverting.withMessage(
                    makeAFirstPredictionFor(this.matchPrediction, match1.id, _tokenId1, Outcomes.UNINITIALISED, tokenOwner2),
                    validationErrorContentKeys.notNFTOwner
                );
            });

            it('should fail when token is already playing', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);
                await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);

                await shouldFail.reverting.withMessage(
                    givenABasicFirstPrediction(this.matchPrediction, tokenOwner1),
                    validationErrorContentKeys.tokenAlreadyPlaying
                );
            });

            it('should fail when prediction is invalid', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);
                await shouldFail.reverting.withMessage(
                    makeAFirstPredictionFor(this.matchPrediction, match1.id, _tokenId1, Outcomes.UNINITIALISED, tokenOwner1),
                    validationErrorContentKeys.invalidPrediction
                );
            });
        });

        context('when making the second prediction', async () => {
            beforeEach(async () => {
                await this.futballCards.mintCard(1, 1, 1, 1, 1, 1, tokenOwner1, {from: creator});
                await this.futballCards.setAttributes(_tokenId1, 10, 10, 10, 10, {from: creator});
                await this.futballCards.approve(this.matchPrediction.address, _tokenId1, {from: tokenOwner1});

                await this.futballCards.mintCard(2, 2, 2, 2, 2, 2, tokenOwner2, {from: creator});
                await this.futballCards.setAttributes(_tokenId2, 5, 10, 20, 20, {from: creator});
                await this.futballCards.approve(this.matchPrediction.address, _tokenId2, {from: tokenOwner2});

                await this.futballCards.mintCard(3, 3, 3, 3, 3, 3, random, {from: creator});
                await this.futballCards.setAttributes(_tokenId3, 30, 30, 30, 30, {from: creator});

                (await this.futballCards.totalCards()).should.be.bignumber.equal('3');
            });

            it('should be successful with valid parameters', async () => {
               await whenANewMatchIsAdded(this.matchPrediction, oracle);
               await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);

               const {logs} = await givenABasicSecondPrediction(this.matchPrediction, tokenOwner2);
               thenExpectTheFollowingEvent.inLogs(logs,
                   'PredictionsReceived',
                   {
                       gameId: _game1Id,
                       player1: tokenOwner1,
                       player2: tokenOwner2
                   }
               );
            });

            it('should fail on referencing an invalid game', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);
                await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);

                await shouldFail.reverting.withMessage(
                    makeASecondPredictionFor(this.matchPrediction, new BN(2), _tokenId3, Outcomes.UNINITIALISED, random),
                    validationErrorContentKeys.invalidGameId
                );
            });

            it('should fail when match has been postponed', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);
                await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);
                await whenAMatchIsPostponed(this.matchPrediction, oracle);

                await shouldFail.reverting.withMessage(
                    givenABasicSecondPrediction(this.matchPrediction, tokenOwner2),
                    validationErrorContentKeys.matchPostponed
                );
            });

            it('should fail when trying to amend second prediction', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);
                await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);
                await givenABasicSecondPrediction(this.matchPrediction, tokenOwner2);

                await shouldFail.reverting.withMessage(
                    givenABasicSecondPrediction(this.matchPrediction, tokenOwner2),
                    validationErrorContentKeys.gameComplete
                );
            });

            it('should fail when contract is not approved for token', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);
                await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);

                await shouldFail.reverting.withMessage(
                    makeASecondPredictionFor(this.matchPrediction, _game1Id, _tokenId3, Outcomes.UNINITIALISED, tokenOwner3),
                    validationErrorContentKeys.nftNotApproved
                );
            });

            it('should fail when sender is not owner of token', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);
                await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);

                await shouldFail.reverting.withMessage(
                    makeASecondPredictionFor(this.matchPrediction, _game1Id, _tokenId2, Outcomes.UNINITIALISED, tokenOwner3),
                    validationErrorContentKeys.notNFTOwner
                );
            });

            it('should fail when prediction is invalid', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);
                await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);

                await shouldFail.reverting.withMessage(
                    makeASecondPredictionFor(this.matchPrediction, _game1Id, _tokenId2, Outcomes.UNINITIALISED, tokenOwner2),
                    validationErrorContentKeys.invalidPrediction
                );
            });
        });
    });

    /*context('playing the game', async () => {
        context('when match #1 is chosen', async () => {
            it('should handle a basic prediction', async () => {
                // todo: Extend this by minting a card and checking the onlyWhenTokenOwner guard and others work

            });
        });
    });*/

});
