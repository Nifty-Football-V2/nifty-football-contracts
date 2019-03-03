const FutballCards = artifacts.require('FutballCards');
const MatchPrediction = artifacts.require('MatchPrediction');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract.only('Match Prediction Contract Tests', ([_, creator, tokenOwner1, tokenOwner2, oracle, oracle2, random, ...accounts]) => {
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
        nftAddressZero: "match.prediction.error.nft.contract.address.zero"
    };

    const Outcomes = {
        UNINITIALISED: new BN(0),
        HOME_WIN: new BN(1),
        AWAY_WIN: new BN(2),
        DRAW: new BN(3)
    };

    const _tokenId1 = new BN(0);
    const _tokenId2 = new BN(1);
    const _tokenId3 = new BN(2);

    const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;
    const predictFrom = Math.floor((new Date()).getTime());
    const predictTo = predictFrom + MILLISECONDS_IN_A_DAY;

    const _match1 = {
        _matchId: new BN(34564543),
        _predictFrom: new BN(predictFrom),
        _predictTo: new BN(predictTo)
    };

    function whenANewMatchIsAdded(contract, sender) {
        return contract.addMatch(_match1._matchId, _match1._predictFrom, _match1._predictTo, {from: sender});
    }

    function whenASpecificMatchIsAdded(contract, match, sender) {
        return contract.addMatch(match._matchId, match._predictFrom, match._predictTo, {from: sender});
    }

    function givenABasicFirstPrediction(contract, sender) {
        return makeAFirstPredictionFor(contract, _match1._matchId, _tokenId1, Outcomes.HOME_WIN, sender);
    }

    function makeAFirstPredictionFor(contract, matchId, tokenId, prediction, sender) {
        return contract.makeFirstPrediction(matchId, tokenId, prediction, {from: sender});
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

            it('should fail to create a game', async () => {
                await shouldFail.reverting(givenABasicFirstPrediction(this.matchPrediction, tokenOwner1));
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
                        id: _match1._matchId
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
                    _matchId: new BN(1),
                    _predictFrom: new BN(0),
                    _predictTo: new BN(predictTo)
                };

                await shouldFail.reverting.withMessage(
                   whenASpecificMatchIsAdded(this.matchPrediction, matchWithInvalidFrom, oracle),
                   validationErrorContentKeys.predictFromInvalid
               );
            });

            it('should not allow predict to time to be before allowed from time', async () => {
               const matchWithInvalidTo = {
                   _matchId: new BN(1),
                   _predictFrom: new BN(predictFrom),
                   _predictTo: new BN(0)
               };

               await shouldFail.reverting.withMessage(
                   whenASpecificMatchIsAdded(this.matchPrediction, matchWithInvalidTo, oracle),
                   validationErrorContentKeys.predictToBeforeFrom
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

        context('when creating the first prediction', async () => {
            beforeEach(async () => {
                await this.futballCards.mintCard(1, 1, 1, 1, 1, 1, tokenOwner1, {from: creator});
                await this.futballCards.setAttributes(_tokenId1, 10, 10, 10, 10, {from: creator});
                await this.futballCards.approve(this.matchPrediction.address, _tokenId1, {from: tokenOwner1});

                await this.futballCards.mintCard(2, 2, 2, 2, 2, 2, tokenOwner2, {from: creator});
                await this.futballCards.setAttributes(_tokenId2, 5, 10, 20, 20, {from: creator});

                await this.futballCards.mintCard(3, 3, 3, 3, 3, 3, random, {from: creator});
                await this.futballCards.setAttributes(_tokenId3, 30, 30, 30, 30, {from: creator});

                (await this.futballCards.totalCards()).should.be.bignumber.equal('3');
            });

            it('should be successful with valid parameters', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);

                const {logs} = await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);
                thenExpectTheFollowingEvent.inLogs(logs,
                    'GameCreated',
                    {
                        gameId: new BN(1),
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

            it('should fail when contract not approved for token', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);

                await shouldFail.reverting.withMessage(
                    makeAFirstPredictionFor(this.matchPrediction, _match1._matchId, _tokenId2, Outcomes.UNINITIALISED, tokenOwner2),
                    validationErrorContentKeys.nftNotApproved
                );
            });

            it('should fail when sender is not owner of token', async () => {
                await whenANewMatchIsAdded(this.matchPrediction, oracle);

                await shouldFail.reverting.withMessage(
                    makeAFirstPredictionFor(this.matchPrediction, _match1._matchId, _tokenId1, Outcomes.UNINITIALISED, tokenOwner2),
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
