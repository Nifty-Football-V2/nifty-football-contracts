const FutballCards = artifacts.require('FutballCards');
const MatchPrediction = artifacts.require('MatchPrediction');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract.only('Match Prediction Contract Tests', ([_, creator, tokenOwner1, tokenOwner2, oracle, ...accounts]) => {
    const baseURI = 'http://futball-cards';
    const Outcomes = {
        UNINITIALISED: new BN(0),
        HOME_WIN: new BN(1),
        AWAY_WIN: new BN(2),
        DRAW: new BN(3)
    };

    const _tokenId1 = new BN(0);
    const _tokenId2 = new BN(1);

    const _matchId = new BN(34564543);

    before(async () => {
        this.futballCards = await FutballCards.new(baseURI, {from: creator});
        this.matchPrediction = await MatchPrediction.new(this.futballCards.address, oracle, {from: creator});

        (await this.futballCards.totalCards()).should.be.bignumber.equal('0');
    });

    context('should be able to play game', async () => {

        it('should handle a basic prediction', async () => {
            // todo: Extend this by minting a card and checking the onlyWhenTokenOwner guard and others work
            await this.matchPrediction.makeFirstPrediction(_matchId, _tokenId1, Outcomes.HOME_WIN);

            (await this.matchPrediction.wasPredictionTrue()).should.be.true;
        });
    });

});
