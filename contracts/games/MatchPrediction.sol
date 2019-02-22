pragma solidity 0.5.0;

import "./abstract/FutballCardGame.sol";
import "../IFutballCardsAttributes.sol";

contract MatchPrediction is FutballCardGame {

    enum Outcomes {HOME_WIN, AWAY_WIN, DRAW}

    Outcomes public prediction;

    constructor (IFutballCardsAttributes _nft) public {
        nft = _nft;
    }

    function makePrediction(Outcomes _prediction) whenNotPaused public {
        prediction = _prediction;
    }

    function wasPredictionTrue() whenNotPaused public view returns (bool) {
        Outcomes fixedResult = Outcomes.HOME_WIN;
        return fixedResult == prediction;
    }
}