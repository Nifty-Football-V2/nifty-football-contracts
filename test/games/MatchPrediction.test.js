const FutballCards = artifacts.require('FutballCards');
const MatchPrediction = artifacts.require('MatchPrediction');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract.only('Match Prediction Contract Tests', ([_, creator, tokenOwner1, tokenOwner2, oracle, ...accounts]) => {
    const baseURI = 'http://futball-cards';

    const validationErrorContentKeys = {
        notOracle: "match.prediction.validation.error.not.oracle",
        matchExists: "match.prediction.validation.error.match.exists"
    };

    const Outcomes = {
        UNINITIALISED: new BN(0),
        HOME_WIN: new BN(1),
        AWAY_WIN: new BN(2),
        DRAW: new BN(3)
    };

    const _tokenId1 = new BN(0);
    const _tokenId2 = new BN(1);

    const SECONDS_IN_A_DAY = 24 * 60 * 60;
    const predictFrom = Math.floor(((new Date()).getTime() / 1000) - 15);
    const predictTo = predictFrom + SECONDS_IN_A_DAY;

    const _match1 = {
        _matchId: new BN(34564543),
        _predictFrom: new BN(predictFrom),
        _predictTo: new BN(predictTo)
    };

    before(async () => {
        this.futballCards = await FutballCards.new(baseURI, {from: creator});
        this.matchPrediction = await MatchPrediction.new(this.futballCards.address, oracle, {from: creator});

        (await this.futballCards.totalCards()).should.be.bignumber.equal('0');
    });

    context('validation', async () => {
        context('when adding matches', async () => {
            it('should be successful with valid parameters', async () => {
                await this.matchPrediction.addMatch(_match1._matchId, _match1._predictFrom, _match1._predictTo, {from: oracle});
            });

            it('should block any non-oracle address', async () => {
                await shouldFail.reverting.withMessage(
                    this.matchPrediction.addMatch(_match1._matchId, _match1._predictFrom, _match1._predictTo, {from: tokenOwner1}),
                    validationErrorContentKeys.notOracle
                );
            });

            it('should not allow the same match to be added twice', async () => {
                await shouldFail.reverting.withMessage(
                    this.matchPrediction.addMatch(_match1._matchId, _match1._predictFrom, _match1._predictTo, {from: oracle}),
                    validationErrorContentKeys.matchExists
                );
            });

            // todo: add invalid tests for time i.e. trying to add a match where end is before start time etc.
        });
    });

    context('playing the game', async () => {
        context('when match #1 is chosen', async () => {
            it('should handle a basic prediction', async () => {
                // todo: Extend this by minting a card and checking the onlyWhenTokenOwner guard and others work
                const expectedGameId = new BN(1);
                const {logs} = await this.matchPrediction.makeFirstPrediction(_match1._matchId, _tokenId1, Outcomes.HOME_WIN, {from: tokenOwner1});
                expectEvent.inLogs(logs,
                    'GameCreated',
                    {
                        gameId: expectedGameId,
                        player1: tokenOwner1,
                        p1TokenId: _tokenId1
                    }
                );
            });
        });
    });

});
