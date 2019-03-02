pragma solidity 0.5.0;

import "./abstract/FutballCardGame.sol";

contract MatchPrediction is FutballCardGame {

    event GameCreated(
        uint256 indexed gameId,
        address indexed player1,
        uint256 indexed p1TokenId
    );

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

    uint256 public totalGames = 0;

    mapping(uint256 => uint256) tokenIdToGameIdMapping;
    mapping(uint256 => Game) gameIdToGameMapping;
    mapping(uint256 => Outcome) matchIdToResultMapping; // todo: result fn should emit outcome
    mapping(uint256 => uint256[]) matchIdToOpenGameIdListMapping;
    mapping(uint256 => Match) matchIdToMatchMapping;
    // todo: it may be useful to have an array of matchId keys that can be externally audited
    // todo: it may also be useful to have a list of gameId keys

    constructor (IFutballCardsAttributes _nft, address _oracle) public {
        // todo: add validation on all to ensure constructor is not supplied address(0) on any params
        // todo: should this be done in modifiers?
        // todo: add contract deployer as owner of this contract
        nft = _nft;
        oracle = _oracle;
    }

    ///////////////
    // Modifiers //
    ///////////////
    modifier onlyWhenNotAddressZero() {
        require(msg.sender != address(0), "match.prediction.validation.error.address.zero");
        _;
    }

    modifier onlyWhenOracle() {
        require(oracle == msg.sender, "match.prediction.validation.error.not.oracle");
        _;
    }

    modifier onlyWhenTimesValid(uint256 _predictFrom, uint256 _predictTo) {
        require(_predictFrom >= now, "match.prediction.validation.error.predict.from.invalid");
        require(_predictTo > _predictFrom, "match.prediction.validation.error.predict.to.before.from");
        _;
    }

    modifier onlyWhenMatchDoesNotExist(uint256 _matchId) {
        require(!_doesMatchExist(_matchId), "match.prediction.validation.error.match.exists");
        _;
    }

    modifier onlyWhenMatchValid(uint256 _matchId) {
        require(matchIdToMatchMapping[_matchId].id > 0, "match.prediction.validation.error.invalid.match.id");
        _;
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

    function _doesMatchExist(uint256 _matchId) internal returns (bool) {
        return (matchIdToMatchMapping[_matchId].predictFrom != matchIdToMatchMapping[_matchId].predictTo);
    }

    ///////////////
    // Functions //
    ///////////////

    function addMatch(uint256 _matchId, uint256 _predictFrom, uint256 _predictTo)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchDoesNotExist(_matchId)
    onlyWhenTimesValid(_predictFrom, _predictTo)
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

        gameIdToGameMapping[newGameId] = Game({
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

        totalGames = newGameId;

        emit GameCreated(newGameId, msg.sender, _tokenId);

        return newGameId;
    }

    function updateOracle(address _newOracle)
    whenNotPaused
    onlyOwner
    onlyWhenNotAddressZero public {
        oracle = _newOracle;
    }
}