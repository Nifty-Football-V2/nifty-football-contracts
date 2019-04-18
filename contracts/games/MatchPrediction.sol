pragma solidity ^0.5.0;

import "./abstract/FutballCardGame.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Holder.sol";

contract MatchPrediction is FutballCardGame, ERC721Holder {

    event ContractDeployed (
        address indexed nftAddress,
        address indexed matchServiceAddress
    );

    event GameCreated (
        uint256 indexed gameId,
        address indexed player1,
        uint256 indexed p1TokenId
    );

    event GameFinished (
        uint256 indexed id,
        GameState result
    );

    event GameClosed (
        uint256 indexed id
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

    event MatchCancelled (
        uint256 indexed id
    );

    event MatchRestored (
        uint256 indexed id
    );

    event MatchOutcome (
        uint256 indexed id,
        Outcome indexed result
    );

    enum Outcome {UNINITIALISED, HOME_WIN, AWAY_WIN, DRAW}

    enum MatchState {UNINITIALISED, UPCOMING, POSTPONED, CANCELLED}

    // A game's state can only be cancelled if a match's state is cancelled
    enum GameState {UNINITIALISED, OPEN, PREDICTIONS_RECEIVED, PLAYER_1_WIN, PLAYER_2_WIN, NEITHER_PLAYER_WINS, CLOSED}

    struct Match {
        uint256 id;
        uint256 predictBefore;
        uint256 resultAfter;
        MatchState state;
        Outcome result;
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
    }

    address public oracle;

    uint256 public totalGamesCreated = 0;

    mapping(uint256 => uint256) public tokenIdToGameIdMapping;
    mapping(uint256 => Game) public gameIdToGameMapping;
    mapping(uint256 => Match) public matchIdToMatchMapping;
    mapping(address => uint256[]) public playerToGameIdsMapping;

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

    modifier onlyWhenTimesValid(uint256 _predictBefore, uint256 _resultAfter) {
        require(_predictBefore <  _resultAfter, "match.prediction.validation.error.predict.before.is.after.result.after");
        require(now < _predictBefore, "match.prediction.validation.error.past.prediction.deadline");
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

    modifier onlyWhenMatchUpcoming(uint256 _matchId) {
        _isMatchUpcoming(_matchId);
        _;
    }

    modifier onlyWhenMatchPostponed(uint256 _matchId) {
        require(matchIdToMatchMapping[_matchId].state == MatchState.POSTPONED, "match.prediction.validation.error.match.not.postponed");
        _;
    }

    modifier onlyWhenGameMatchUpcoming(uint256 _gameId) {
        _isMatchUpcoming(gameIdToGameMapping[_gameId].matchId);
        _;
    }

    modifier onlyWhenBeforePredictionDeadline(uint256 _matchId) {
        _isBeforePredictionDeadline(_matchId);
        _;
    }

    modifier onlyWhenBeforeGamePredictionDeadline(uint256 _gameId) {
        _isBeforePredictionDeadline(gameIdToGameMapping[_gameId].matchId);
        _;
    }

    modifier onlyWhenGameMatchResultReceived(uint256 _gameId) {
        Match storage gameMatch = matchIdToMatchMapping[gameIdToGameMapping[_gameId].matchId];
        require(gameMatch.result != Outcome.UNINITIALISED, "match.prediction.validation.error.game.match.result.not.received");
        _;
    }

    modifier onlyWhenPredictionValid(Outcome _prediction) {
        require(_prediction != Outcome.UNINITIALISED, "match.prediction.validation.error.invalid.prediction");
        _;
    }

    modifier onlyWhenPlayer1NotRevokedTransferApproval(uint256 _gameId) {
        Game storage game = gameIdToGameMapping[_gameId];
        require(nft.getApproved(game.p1TokenId) == address(this), "match.prediction.validation.error.p1.revoked.approval");
        _;
    }

    modifier onlyWhenResultStateValid(Outcome _resultState) {
        require(_resultState != Outcome.UNINITIALISED, "match.prediction.validation.error.invalid.match.result.state");
        _;
    }

    modifier onlyWhenAllPredictionsReceived(uint256 _gameId) {
        require(gameIdToGameMapping[_gameId].state == GameState.PREDICTIONS_RECEIVED, "match.prediction.validation.error.game.predictions.not.received");
        _;
    }

    modifier onlyWhenResultWindowOpen(uint256 _matchId) {
        require(now >= matchIdToMatchMapping[_matchId].resultAfter, "match.prediction.validation.error.result.window.not.open");
        _;
    }

    modifier onlyWhenPlayer1(uint256 _gameId) {
        require(gameIdToGameMapping[_gameId].p1Address == msg.sender, "match.prediction.validation.error.not.player.1");
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

    function _isGameIncomplete(uint256 _gameId) internal view returns (bool) {
        return gameIdToGameMapping[_gameId].state == GameState.OPEN;
    }

    function _isTokenNotAlreadyPlaying(uint256 _tokenId) internal view returns (bool) {
        return tokenIdToGameIdMapping[_tokenId] == 0;
    }

    function _doesMatchExist(uint256 _matchId) internal view returns (bool) {
        Match storage aMatch = matchIdToMatchMapping[_matchId];
        return (_matchId > 0 && aMatch.predictBefore < aMatch.resultAfter);
    }

    function _isMatchUpcoming(uint256 _matchId) internal view {
        require(matchIdToMatchMapping[_matchId].state == MatchState.UPCOMING, "match.prediction.validation.error.match.not.upcoming");
    }

    function _isBeforePredictionDeadline(uint256 _matchId) private view {
        Match storage aMatch = matchIdToMatchMapping[_matchId];
        require(now <= aMatch.predictBefore, "match.prediction.validation.error.past.prediction.deadline");
    }

    function _escrowPlayerCards(Game storage game) private {
        nft.safeTransferFrom(game.p1Address, address(this), game.p1TokenId);
        nft.safeTransferFrom(game.p2Address, address(this), game.p2TokenId);
    }

    function _sendWinnerCards(address winner, uint256 tokenId1, uint256 tokenId2) private {
        nft.safeTransferFrom(address(this), winner, tokenId1);
        nft.safeTransferFrom(address(this), winner, tokenId2);
    }

    function _freeUpCardsForFutureGames(uint256 tokenId1, uint256 tokenId2) private {
        delete tokenIdToGameIdMapping[tokenId1];
        delete tokenIdToGameIdMapping[tokenId2];
    }

    function _performPostGameCleanup(uint256 _gameId) private {
        Game storage game = gameIdToGameMapping[_gameId];
        _freeUpCardsForFutureGames(game.p1TokenId, game.p2TokenId);
    }

    /////////////////
    // Constructor //
    /////////////////

    constructor (IERC721 _nft, address _oracle) public {
        require(address(_nft) != address(0), "match.prediction.error.nft.contract.address.zero");
        require(address(_nft) != msg.sender, "match.prediction.error.nft.contract.eq.owner");
        require(_oracle != address(0), "match.prediction.error.oracle.address.zero");
        require(_oracle != msg.sender, "match.prediction.error.oracle.address.eq.owner");
        //todo:matches contract address checks

        nft = _nft;
        oracle = _oracle;
    }

    ///////////////
    // Functions //
    ///////////////

    //todo: move all match functionality to its own contract - will make both entities more maintainable
    function addMatch(uint256 _matchId, uint256 _predictBefore, uint256 _resultAfter)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchDoesNotExist(_matchId)
    onlyWhenTimesValid(_predictBefore, _resultAfter) external {
        matchIdToMatchMapping[_matchId] = Match({
            id: _matchId,
            predictBefore: _predictBefore,
            resultAfter: _resultAfter,
            state: MatchState.UPCOMING,
            result: Outcome.UNINITIALISED
        });

        matchIds.push(_matchId);

        emit MatchAdded(_matchId);
    }

    function postponeMatch(uint256 _matchId)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchExists(_matchId)
    onlyWhenMatchUpcoming(_matchId) external {
        matchIdToMatchMapping[_matchId].state = MatchState.POSTPONED;

        emit MatchPostponed(_matchId);
    }

    function cancelMatch(uint256 _matchId)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchExists(_matchId)
    onlyWhenMatchUpcoming(_matchId) external {
        matchIdToMatchMapping[_matchId].state = MatchState.CANCELLED;

        emit MatchCancelled(_matchId);
    }

    function restoreMatch(uint256 _matchId, uint256 _predictBefore, uint256 _resultAfter)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchExists(_matchId)
    onlyWhenMatchPostponed(_matchId)
    onlyWhenTimesValid(_predictBefore, _resultAfter) external {
        Match storage aMatch = matchIdToMatchMapping[_matchId];
        aMatch.predictBefore = _predictBefore;
        aMatch.resultAfter = _resultAfter;
        aMatch.result = Outcome.UNINITIALISED;
        aMatch.state = MatchState.UPCOMING;

        emit MatchRestored(_matchId);
    }

    function matchResult(uint256 _matchId, Outcome _resultState)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchExists(_matchId)
    onlyWhenMatchUpcoming(_matchId)
    onlyWhenResultStateValid(_resultState)
    onlyWhenResultWindowOpen(_matchId) external {
        matchIdToMatchMapping[_matchId].result = _resultState;

        emit MatchOutcome(_matchId, _resultState);
    }

    function makeFirstPrediction(uint256 _matchId, uint256 _tokenId, Outcome _prediction)
    whenNotPaused
    onlyWhenTokenNotAlreadyPlaying(_tokenId)
    onlyWhenMatchExists(_matchId)
    onlyWhenMatchUpcoming(_matchId)
    onlyWhenBeforePredictionDeadline(_matchId)
    onlyWhenContractIsApproved(_tokenId)
    onlyWhenTokenOwner(_tokenId)
    onlyWhenPredictionValid(_prediction)
    external returns (uint256) {
        uint256 newGameId = totalGamesCreated.add(1);

        gameIdToGameMapping[newGameId] = Game({
            id: newGameId,
            p1TokenId: _tokenId,
            p1Address: msg.sender,
            p2TokenId: 0,
            p2Address: address(0),
            p1Prediction: _prediction,
            p2Prediction: Outcome.UNINITIALISED,
            state: GameState.OPEN,
            matchId: _matchId
        });

        tokenIdToGameIdMapping[_tokenId] = newGameId;
        playerToGameIdsMapping[msg.sender].push(newGameId);
        totalGamesCreated = newGameId;

        emit GameCreated(newGameId, msg.sender, _tokenId);

        return newGameId;
    }

    function makeSecondPrediction(uint256 _gameId, uint256 _tokenId, Outcome _prediction)
    whenNotPaused
    onlyWhenTokenNotAlreadyPlaying(_tokenId)
    onlyWhenRealGame(_gameId)
    onlyWhenGameMatchUpcoming(_gameId)
    onlyWhenBeforeGamePredictionDeadline(_gameId)
    onlyWhenGameNotComplete(_gameId)
    onlyWhenContractIsApproved(_tokenId)
    onlyWhenTokenOwner(_tokenId)
    onlyWhenPlayer1NotRevokedTransferApproval(_gameId)
    onlyWhenPredictionValid(_prediction) external {
        Game storage game = gameIdToGameMapping[_gameId];
        game.p2TokenId = _tokenId;
        game.p2Address = msg.sender;
        game.p2Prediction = _prediction;

        require(game.p2Prediction != game.p1Prediction, "match.prediction.validation.error.p2.prediction.invalid");

        game.state = GameState.PREDICTIONS_RECEIVED;

        tokenIdToGameIdMapping[_tokenId] = _gameId;
        playerToGameIdsMapping[msg.sender].push(_gameId);

        _escrowPlayerCards(game);

        emit PredictionsReceived(_gameId, game.p1Address, msg.sender);
    }

    function getAllGameIds(address player) external view returns(uint256[] memory) {
        return playerToGameIdsMapping[player];
    }

    function withdraw(uint256 _gameId)
    whenNotPaused
    onlyWhenRealGame(_gameId)
    onlyWhenAllPredictionsReceived(_gameId)
    onlyWhenGameMatchResultReceived(_gameId) external {
        Game storage game = gameIdToGameMapping[_gameId];
        Match storage gameMatch = matchIdToMatchMapping[game.matchId];

        if(game.p1Prediction == gameMatch.result) {
            game.state = GameState.PLAYER_1_WIN;
            _sendWinnerCards(game.p1Address, game.p1TokenId, game.p2TokenId);
        } else if(game.p2Prediction == gameMatch.result) {
            game.state = GameState.PLAYER_2_WIN;
            _sendWinnerCards(game.p2Address, game.p1TokenId, game.p2TokenId);
        } else {
            game.state = GameState.NEITHER_PLAYER_WINS;
        }

        _performPostGameCleanup(_gameId);

        emit GameFinished(_gameId, game.state);
    }

    function closeGame(uint256 _gameId)
    whenNotPaused
    onlyWhenRealGame(_gameId)
    onlyWhenGameNotComplete(_gameId)
    onlyWhenPlayer1(_gameId) external {
        gameIdToGameMapping[_gameId].state = GameState.CLOSED;

        _performPostGameCleanup(_gameId);

        emit GameClosed(_gameId);
    }
    
}