const FutballCards = artifacts.require('FutballCards');
const MatchPrediction = artifacts.require('MatchPrediction');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract.only('Match Prediction Contract Tests', ([_, creator, tokenOwner1, tokenOwner2, anyone, ...accounts]) => {
    const baseURI = 'http://futball-cards';
    const Outcomes = {
        HOME_WIN: new BN(0),
        AWAY_WIN: new BN(1),
        DRAW: new BN(2)
    };

    const _tokenId1 = new BN(0);
    const _tokenId2 = new BN(1);

    before(async () => {
        this.futballCards = await FutballCards.new(baseURI, {from: creator});
        this.matchPrediction = await MatchPrediction.new(this.futballCards.address, {from: creator});

        (await this.futballCards.totalCards()).should.be.bignumber.equal('0');
    });

    context('should be able to play game', async () => {

        it('should handle a basic prediction', async () => {
            await this.matchPrediction.makePrediction(Outcomes.HOME_WIN);
            const result = await this.matchPrediction.wasPredictionTrue();
            result.should.be.true;
        });
    });

});
