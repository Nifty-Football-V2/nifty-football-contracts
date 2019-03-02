const FutballCards = artifacts.require('FutballCards');
const MatchPrediction = artifacts.require('MatchPrediction');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract.only('Match Prediction Contract Tests', ([_, creator, tokenOwner1, tokenOwner2, oracle, oracle2, ...accounts]) => {
    const baseURI = 'http://futball-cards';

    const validationErrorContentKeys = {
        notOracle: "match.prediction.validation.error.not.oracle",
        matchExists: "match.prediction.validation.error.match.exists",
        predictFromInvalid: "match.prediction.validation.error.predict.from.invalid",
        predictToBeforeFrom: "match.prediction.validation.error.predict.to.before.from",
        zeroAddress: "match.prediction.validation.error.address.zero"
    };

    const Outcomes = {
        UNINITIALISED: new BN(0),
        HOME_WIN: new BN(1),
        AWAY_WIN: new BN(2),
        DRAW: new BN(3)
    };

    const _tokenId1 = new BN(0);
    const _tokenId2 = new BN(1);

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
        return makeAFirstPredictionFor(contract, _match1, _tokenId1, Outcomes.HOME_WIN, sender);
    }

    function makeAFirstPredictionFor(contract, match, tokenId, prediction, sender) {
        return contract.makeFirstPrediction(match._matchId, tokenId, prediction, {from: sender});
    }

    beforeEach(async () => {
        this.futballCards = await FutballCards.new(baseURI, {from: creator});
        this.matchPrediction = await MatchPrediction.new(this.futballCards.address, oracle, {from: creator});

        (await this.futballCards.totalCards()).should.be.bignumber.equal('0');
        (await this.matchPrediction.totalGames()).should.be.bignumber.equal('0');
        (await this.matchPrediction.oracle()).should.be.equal(oracle);
    });

    context('validation', async () => {
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
                await whenANewMatchIsAdded(this.matchPrediction, oracle);
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
                await this.matchPrediction.updateOracle(oracle2, {from: creator});
            });

            it('should prevent oracle being updated to address(0)', async () => {
                await shouldFail.reverting.withMessage(
                    this.matchPrediction.updateOracle(constants.ZERO_ADDRESS, {from: creator}),
                    validationErrorContentKeys.zeroAddress
                );
            });
        });
    });

    context('playing the game', async () => {
        context('when match #1 is chosen', async () => {
            it('should handle a basic prediction', async () => {
                // todo: Extend this by minting a card and checking the onlyWhenTokenOwner guard and others work
                whenANewMatchIsAdded(this.matchPrediction, oracle);
                const {logs} = await givenABasicFirstPrediction(this.matchPrediction, tokenOwner1);

                const expectedGameId = new BN(1);
                expectEvent.inLogs(logs,
                    'GameCreated',
                    {
                        gameId: expectedGameId,
                        player1: tokenOwner1,
                        p1TokenId: _tokenId1
                    }
                );

                (await this.matchPrediction.totalGames()).should.be.bignumber.equal('1');
            });
        });
    });

});
