pragma solidity 0.5.0;

import "./abstract/FutballCardGame.sol";

contract MatchPrediction is FutballCardGame {

    enum Outcomes {HOME_WIN, AWAY_WIN, DRAW, ABSTAIN}
    enum State {OPEN, PLAYER_1_WIN, PLAYER_2_WIN, DRAW, CLOSED}

    struct Game {
        uint256 id;
        uint256 p1TokenId;
        address p1Address;
        uint256 p2TokenId;
        address p2Address;
        Outcomes p1Prediction;
        Outcomes p2Prediction;
        State state;
    }

    Game game;
    uint256 public totalGames = 0;

    constructor (IFutballCardsAttributes _nft) public {
        nft = _nft;
    }

    ///////////////
    // Functions //
    ///////////////

    function makeFirstPrediction(uint256 _tokenId, Outcomes _prediction)
    whenNotPaused
    public {
        uint256 newGameId = totalGames.add(1);

        game = Game({
            id: newGameId,
            p1TokenId: _tokenId,
            p1Address: msg.sender,
            p2TokenId: 0,
            p2Address: address(0),
            p1Prediction: _prediction,
            p2Prediction: Outcomes.ABSTAIN,
            state: State.OPEN
        });

        totalGames = totalGames.add(1);

        // todo: Emit a game created event and return a Game ID
    }

    function wasPredictionTrue()  public view returns (bool) {
        Outcomes fixedResult = Outcomes.HOME_WIN;
        return fixedResult == game.p1Prediction;
    }

    //////////////////////////
    // Interface Functions  //
    //////////////////////////
    // todo: Implement these functions so they can be called in the modifier guards

    function _isValidGame(uint256 _gameId) internal returns (bool) {
        return false;
    }

    function _isGameOpen(uint256 _gameId) internal returns (bool) {
        return false;
    }

    function _isGameDraw(uint256 _gameId) internal returns (bool) {
        return false;
    }

    function _isGameIncomplete(uint256 _gameId) internal returns (bool) {
        return false;
    }

    function _isTokenNotAlreadyPlaying(uint256 _tokenId) internal returns (bool) {
        return false;
    }
}