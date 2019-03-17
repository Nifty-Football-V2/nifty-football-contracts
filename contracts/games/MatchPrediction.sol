pragma solidity 0.5.0;

import "./abstract/FutballCardGame.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Holder.sol";

contract MatchPrediction is FutballCardGame, ERC721Holder {

    event GameCreated (
        uint256 indexed gameId,
        address indexed player1,
        uint256 indexed p1TokenId
    );

    event GameResulted (
        uint256 indexed id,
        address indexed player1,
        address indexed player2,
        GameState result
    );

    event PredictionsReceived (
        uint256 indexed gameId,
        address indexed player1,
        address indexed player2
    );

    event MatchAdded (
        uint256 indexed id
    );

    event MatchPostponed (
        uint256 indexed id
    );

    event MatchOutcome (
        uint256 indexed id,
        Outcome indexed outcome
    );

    event OracleUpdated (
        address indexed previous,
        address indexed current
    );

    enum Outcome {UNINITIALISED, HOME_WIN, AWAY_WIN, DRAW}

    enum MatchState {UNINITIALISED, UPCOMING, POSTPONED, CANCELLED}

    // A game's state can only be cancelled if a match's state is cancelled
    enum GameState {UNINITIALISED, OPEN, PREDICTIONS_RECEIVED, PLAYER_1_WIN, PLAYER_2_WIN, DRAW, CANCELLED, CLOSED}

    struct Match {
        uint256 id;
        uint256 predictFrom;
        uint256 predictTo;
        MatchState state;
    }

    struct Game {
        uint256 id;
        uint256 p1TokenId;
        address p1Address;
        uint256 p2TokenId;
        address p2Address;
        Outcome p1Prediction;
        Outcome p2Prediction;
        GameState state;
        uint256 matchId;
        uint256 openGamesListIndex;
    }

    address public oracle;

    uint256 public totalGamesCreated = 0;

    mapping(uint256 => uint256) public tokenIdToGameIdMapping;
    mapping(uint256 => Game) public gameIdToGameMapping;
    mapping(uint256 => Outcome) public matchIdToResultMapping; // todo: result fn should emit outcome
    mapping(uint256 => uint256[]) public matchIdToOpenGameIdListMapping;
    mapping(uint256 => Match) public matchIdToMatchMapping;

    uint256[] public matchIds;

    ///////////////
    // Modifiers //
    ///////////////

    modifier onlyWhenNotAddressZero(address addr) {
        require(addr != address(0), "match.prediction.validation.error.address.zero");
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

    modifier onlyWhenMatchExists(uint256 _matchId) {
        require(_doesMatchExist(_matchId), "match.prediction.validation.error.invalid.match.id");
        _;
    }

    modifier onlyWhenMatchNotPostponed(uint256 _matchId) {
        require(!_hasMatchBeenPostponed(_matchId), "match.prediction.validation.error.match.postponed");
        _;
    }

    modifier onlyWhenGameMatchNotPostponed(uint256 _gameId) {
        uint256 matchId = gameIdToGameMapping[_gameId].matchId;
        require(!_hasMatchBeenPostponed(matchId), "match.prediction.validation.error.match.postponed");
        _;
    }

    modifier onlyWhenPredictionValid(Outcome _prediction) {
        require(_prediction != Outcome.UNINITIALISED, "match.prediction.validation.error.invalid.prediction");
        _;
    }

    //todo: add prediction valid check for second player where their choice does not match p1's choice i.e it's the remaining 2/3 options

    modifier onlyWhenPlayer1NotRevokedTransferApproval(uint256 _gameId) {
        Game storage game = gameIdToGameMapping[_gameId];
        require(nft.getApproved(game.p1TokenId) == address(this), "match.prediction.validation.error.p1.revoked.approval");
        _;
    }

    ////////////////////////////////////////
    // Interface and Internal Functions  //
    ///////////////////////////////////////

    function _isValidGame(uint256 _gameId) internal view returns (bool) {
        return gameIdToGameMapping[_gameId].id > 0;
    }

    function _isGameOpen(uint256 _gameId) internal view returns (bool) {
        return _isGameIncomplete(_gameId);
    }

    function _isGameDraw(uint256 _gameId) internal view returns (bool) {
        return gameIdToGameMapping[_gameId].state == GameState.DRAW;
    }

    function _isGameIncomplete(uint256 _gameId) internal view returns (bool) {
        return gameIdToGameMapping[_gameId].state == GameState.OPEN;
    }

    function _isTokenNotAlreadyPlaying(uint256 _tokenId) internal view returns (bool) {
        return tokenIdToGameIdMapping[_tokenId] == 0;
    }

    function _doesMatchExist(uint256 _matchId) internal view returns (bool) {
        return (_matchId > 0 && matchIdToMatchMapping[_matchId].predictTo > matchIdToMatchMapping[_matchId].predictFrom);
    }

    function _hasMatchBeenPostponed(uint256 _matchId) internal view returns (bool) {
        return matchIdToMatchMapping[_matchId].state == MatchState.POSTPONED;
    }

    function _escrowPlayerCards(Game storage game) internal {
        nft.safeTransferFrom(game.p1Address, address(this), game.p1TokenId);
        nft.safeTransferFrom(game.p2Address, address(this), game.p2TokenId);
    }

    /////////////////
    // Constructor //
    /////////////////

    constructor (IERC721 _nft, address _oracle) public {
        require(address(_nft) != address(0), "match.prediction.error.nft.contract.address.zero");
        require(address(_nft) != msg.sender, "match.prediction.error.nft.contract.eq.owner");
        require(_oracle != address(0), "match.prediction.error.oracle.address.zero");
        require(_oracle != msg.sender, "match.prediction.error.oracle.address.eq.owner");

        nft = _nft;
        oracle = _oracle;
    }

    ///////////////
    // Functions //
    ///////////////

    function addMatch(uint256 _matchId, uint256 _predictFrom, uint256 _predictTo)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchDoesNotExist(_matchId)
    onlyWhenTimesValid(_predictFrom, _predictTo) public {//todo: further unit testing around time
        matchIdToMatchMapping[_matchId] = Match({
            id: _matchId,
            predictFrom: _predictFrom,
            predictTo: _predictTo,
            state: MatchState.UPCOMING
        });

        matchIds.push(_matchId);

        emit MatchAdded(_matchId);
    }

    function postponeMatch(uint256 _matchId)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchExists(_matchId)
    onlyWhenMatchNotPostponed(_matchId) public {
        matchIdToMatchMapping[_matchId].state = MatchState.POSTPONED;

        emit MatchPostponed(_matchId);
    }

    //todo: add functionality around a match being cancelled

    //todo: Add a retrieve fn for retrieving an escrowed card for a game in the following states: postponed, cancelled
    //todo: Specifically for a winning state, a withdrawal fn should enable withdrawal of 2 cards.

    function makeFirstPrediction(uint256 _matchId, uint256 _tokenId, Outcome _prediction)
    whenNotPaused
    onlyWhenTokenNotAlreadyPlaying(_tokenId)
    onlyWhenMatchExists(_matchId)
    onlyWhenMatchNotPostponed(_matchId)
    onlyWhenContractIsApproved(_tokenId)
    onlyWhenTokenOwner(_tokenId)
    onlyWhenPredictionValid(_prediction)
    public returns (uint256 _gameId) {
        uint256 newGameId = totalGamesCreated.add(1);
        uint256 openGamesForSpecifiedMatchCount = matchIdToOpenGameIdListMapping[_matchId].length;

        gameIdToGameMapping[newGameId] = Game({
            id: newGameId,
            p1TokenId: _tokenId,
            p1Address: msg.sender,
            p2TokenId: 0,
            p2Address: address(0),
            p1Prediction: _prediction,
            p2Prediction: Outcome.UNINITIALISED,
            state: GameState.OPEN,
            matchId: _matchId,
            openGamesListIndex: openGamesForSpecifiedMatchCount
        });

        tokenIdToGameIdMapping[_tokenId] = newGameId;
        matchIdToOpenGameIdListMapping[_matchId].push(newGameId);
        totalGamesCreated = newGameId;

        emit GameCreated(newGameId, msg.sender, _tokenId);

        _gameId = newGameId;
    }

    function makeSecondPrediction(uint256 _gameId, uint256 _tokenId, Outcome _prediction)
    whenNotPaused
    onlyWhenTokenNotAlreadyPlaying(_tokenId)
    onlyWhenRealGame(_gameId)
    onlyWhenGameMatchNotPostponed(_gameId)
    onlyWhenGameNotComplete(_gameId)
    onlyWhenContractIsApproved(_tokenId)
    onlyWhenTokenOwner(_tokenId)
    onlyWhenPlayer1NotRevokedTransferApproval(_gameId)
    onlyWhenPredictionValid(_prediction) public {
        Game storage game = gameIdToGameMapping[_gameId];
        game.p2TokenId = _tokenId;
        game.p2Address = msg.sender;
        game.p2Prediction = _prediction;

        require(game.p2Prediction != game.p1Prediction, "match.prediction.validation.error.p2.prediction.invalid");

        game.state = GameState.PREDICTIONS_RECEIVED;

        tokenIdToGameIdMapping[_tokenId] = _gameId;

        _escrowPlayerCards(game);

        emit PredictionsReceived(_gameId, game.p1Address, msg.sender);
    }

    //todo: add match result function that oracle can call into

    function updateOracle(address _newOracle)
    whenNotPaused
    onlyOwner
    onlyWhenNotAddressZero(_newOracle) public {
        address previous = oracle;
        oracle = _newOracle;

        emit OracleUpdated(previous, oracle);
    }
    
}