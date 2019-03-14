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

    event EscrowFailed (
        uint256 indexed gameId
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

    uint256 public totalGames = 0;

    mapping(uint256 => uint256) tokenIdToGameIdMapping;
    mapping(uint256 => Game) gameIdToGameMapping;
    mapping(uint256 => Outcome) matchIdToResultMapping; // todo: result fn should emit outcome
    mapping(uint256 => uint256[]) matchIdToOpenGameIdListMapping;
    mapping(uint256 => Match) matchIdToMatchMapping;
    // todo: it may be useful to have an array of matchId keys that can be externally audited
    // todo: it may also be useful to have a list of gameId keys

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

    modifier onlyWhenPlayer1NotRevokedTransferApproval(uint256 _gameId) {
        Game memory game = gameIdToGameMapping[_gameId];
        require(nft.getApproved(game.p1TokenId) == address(this), "match.prediction.validation.error.p1.revoked.approval");
        _;
    }//todo: write unit tests around this functionality

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

    function _escrowPlayerCards(uint256 _gameId) internal returns (bool) {
        Game memory game = gameIdToGameMapping[_gameId];
        nft.safeTransferFrom(game.p1Address, address(this), game.p1TokenId);
        nft.safeTransferFrom(game.p2Address, address(this), game.p2TokenId);
        return true;
    }//todo: add unit tests

    /////////////////
    // Constructor //
    /////////////////

    constructor (IERC721 _nft, address _oracle) public {
        require(address(_nft) != address(0), "match.prediction.error.nft.contract.address.zero");
        require(_oracle != address(0), "match.prediction.error.oracle.address.zero");

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
    onlyWhenTimesValid(_predictFrom, _predictTo) public {
        matchIdToMatchMapping[_matchId] = Match({
            id: _matchId,
            predictFrom: _predictFrom,
            predictTo: _predictTo,
            state: MatchState.UPCOMING
        });

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

    //todo: Add a retrieve fn for retrieving an escrowed card for a game in the following states: postponed, cancelled
    //todo: Specifically for a winning state, a withdrawal fn should enable withdrawal of 2 cards.

    function makeFirstPrediction(uint256 _matchId, uint256 _tokenId, Outcome _prediction)
    whenNotPaused
    onlyWhenMatchExists(_matchId)
    onlyWhenMatchNotPostponed(_matchId)
    onlyWhenContractIsApproved(_tokenId)
    onlyWhenTokenOwner(_tokenId)
    onlyWhenTokenNotAlreadyPlaying(_tokenId)
    onlyWhenPredictionValid(_prediction)
    public returns (uint256 _gameId) {
        uint256 newGameId = totalGames.add(1);
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
        totalGames = newGameId;

        emit GameCreated(newGameId, msg.sender, _tokenId);

        _gameId = newGameId;
    }

    function makeSecondPrediction(uint256 _gameId, uint256 _tokenId, Outcome _prediction)
    whenNotPaused
    onlyWhenRealGame(_gameId)
    onlyWhenGameMatchNotPostponed(_gameId)
    onlyWhenGameNotComplete(_gameId)
    onlyWhenContractIsApproved(_tokenId)
    onlyWhenTokenOwner(_tokenId)
    onlyWhenPlayer1NotRevokedTransferApproval(_gameId)
    onlyWhenPredictionValid(_prediction) public {
        gameIdToGameMapping[_gameId].p2TokenId = _tokenId;
        gameIdToGameMapping[_gameId].p2Address = msg.sender;
        gameIdToGameMapping[_gameId].p2Prediction = _prediction;
        gameIdToGameMapping[_gameId].state = GameState.PREDICTIONS_RECEIVED;

        bool result = _escrowPlayerCards(_gameId);

        if (result) {
            emit PredictionsReceived(_gameId, gameIdToGameMapping[_gameId].p1Address, msg.sender);
        } else {
            gameIdToGameMapping[_gameId].state = GameState.OPEN;
            //todo: emit that the escrow failed?
        }
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