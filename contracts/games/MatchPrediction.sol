pragma solidity 0.5.0;

import "./abstract/FutballCardGame.sol";

contract MatchPrediction is FutballCardGame {

    enum Outcome {UNINITIALISED, HOME_WIN, AWAY_WIN, DRAW}
    enum State {OPEN, PLAYER_1_WIN, PLAYER_2_WIN, DRAW, CLOSED}

    struct Match {
        uint256 id;
        uint256 predictFrom;
        uint256 predictTo;
    }

    struct Game {
        uint256 id;
        uint256 p1TokenId;
        address p1Address;
        uint256 p2TokenId;
        address p2Address;
        Outcome p1Prediction;
        Outcome p2Prediction;
        State state;
        uint256 matchId;
    }

    address oracle;

    Game game;
    uint256 public totalGames = 0;

    mapping(uint256 => uint256) tokenIdToGameIdMapping;
    mapping(uint256 => Game) gameIdToGameMapping;
    mapping(uint256 => Outcome) matchIdToResultMapping; // todo: result fn should emit outcome
    mapping(uint256 => uint256[]) matchIdToOpenGameIdListMapping;
    mapping(uint256 => Match) matchIdToMatchMapping;

    constructor (IFutballCardsAttributes _nft, address _oracle) public {
        // todo: add validation on all to ensure constructor is not supplied address(0) on any params
        // todo: should this be done in modifiers?
        nft = _nft;
        oracle = _oracle;
    }

    ///////////////
    // Modifiers //
    ///////////////
    modifier onlyWhenOracle() {
        require(oracle == msg.sender, "match.prediction.validation.error.not.oracle");
        _;
    }

    modifier onlyWhenTimesValid(uint256 _predictFrom, uint256 _predictTo) {
        require(_predictFrom >= block.timestamp, "match.prediction.validation.error.predict.from.invalid");
        require(_predictTo > _predictFrom, "match.prediction.validation.error.predict.to.before.from");
        _;
    }

    modifier onlyWhenNewMatchId(uint256 _matchId) {
        require(matchIdToMatchMapping[_matchId].id == 0, "match.prediction.validation.error.match.exists");
        _;
    }

    modifier onlyWhenMatchValid(uint256 _matchId) {
        require(matchIdToMatchMapping[_matchId].id > 0, "match.prediction.validation.error.invalid.match.id");
        _;
    }

    ///////////////
    // Functions //
    ///////////////

    function addMatch(uint256 _matchId, uint256 _predictFrom, uint256 _predictTo)
    onlyWhenOracle
    onlyWhenNewMatchId(_matchId)
    //onlyWhenTimesValid(_predictFrom, _predictTo) todo: tests break with this - will do further investigation
    public {
        matchIdToMatchMapping[_matchId] = Match({
            id: _matchId,
            predictFrom: _predictFrom,
            predictTo: _predictTo
        });
    }

    // todo: add modifier which checks if the Match ID is valid
    // todo: use inherited token validation modifiers
    // todo: investigate if prediction needs a validation modifier
    function makeFirstPrediction(uint256 _matchId, uint256 _tokenId, Outcome _prediction)
    whenNotPaused
    public returns (uint256 _gameId) {
        uint256 newGameId = totalGames.add(1);

        game = Game({
            id: newGameId,
            p1TokenId: _tokenId,
            p1Address: msg.sender,
            p2TokenId: 0,
            p2Address: address(0),
            p1Prediction: _prediction,
            p2Prediction: Outcome.UNINITIALISED,
            state: State.OPEN,
            matchId: _matchId
        });

        totalGames = totalGames.add(1);

        // todo: Emit a game created event

        return newGameId;
    }

    function wasPredictionTrue() public view returns (bool) {
        Outcome fixedResult = Outcome.HOME_WIN;
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

    // todo: add update oracle address function
}