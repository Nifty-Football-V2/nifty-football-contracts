pragma solidity ^0.5.0;

import "./abstract/FutballCardGame.sol";
import "../service/MatchService.sol";
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

    enum Outcome {UNINITIALISED, HOME_WIN, AWAY_WIN, DRAW}
    enum GameState {UNINITIALISED, OPEN, PREDICTIONS_RECEIVED, PLAYER_1_WIN, PLAYER_2_WIN, NEITHER_PLAYER_WINS, CLOSED}

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

    MatchService public matchService;

    uint256 public totalGamesCreated = 0;

    mapping(uint256 => uint256) public tokenIdToGameIdMapping;
    mapping(uint256 => Game) public gameIdToGameMapping;
    mapping(address => uint256[]) public playerToGameIdsMapping;

    ///////////////
    // Modifiers //
    ///////////////

    modifier onlyWhenMatchUpcoming(uint256 _matchId) {
        _isMatchUpcoming(_matchId);
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
        require(matchService.matchResult(gameIdToGameMapping[_gameId].matchId) != MatchService.Outcome.UNINITIALISED, "match.prediction.validation.error.game.match.result.not.received");
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

    modifier onlyWhenAllPredictionsReceived(uint256 _gameId) {
        require(gameIdToGameMapping[_gameId].state == GameState.PREDICTIONS_RECEIVED, "match.prediction.validation.error.game.predictions.not.received");
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

    function _isMatchUpcoming(uint256 _matchId) internal view {
        require(matchService.matchState(_matchId) == MatchService.MatchState.UPCOMING, "match.prediction.validation.error.match.not.upcoming");
    }

    function _isBeforePredictionDeadline(uint256 _matchId) private view {
        require(matchService.isBeforePredictionDeadline(_matchId), "match.prediction.validation.error.past.prediction.deadline");
    }

    function _escrowPlayerCards(Game storage _game) private {
        nft.safeTransferFrom(_game.p1Address, address(this), _game.p1TokenId);
        nft.safeTransferFrom(_game.p2Address, address(this), _game.p2TokenId);
    }

    function _sendWinnerCards(address _winner, uint256 _tokenId1, uint256 _tokenId2) private {
        nft.safeTransferFrom(address(this), _winner, _tokenId1);
        nft.safeTransferFrom(address(this), _winner, _tokenId2);
    }

    function _performWithdrawal(Game storage _game, Outcome _result) private {
        if(_game.p1Prediction == _result) {
            _game.state = GameState.PLAYER_1_WIN;
            _sendWinnerCards(_game.p1Address, _game.p1TokenId, _game.p2TokenId);
        } else if(_game.p2Prediction == _result) {
            _game.state = GameState.PLAYER_2_WIN;
            _sendWinnerCards(_game.p2Address, _game.p1TokenId, _game.p2TokenId);
        } else {
            _game.state = GameState.NEITHER_PLAYER_WINS;
        }
    }

    function _freeUpCardsForFutureGames(uint256 _tokenId1, uint256 _tokenId2) private {
        delete tokenIdToGameIdMapping[_tokenId1];
        delete tokenIdToGameIdMapping[_tokenId2];
    }

    function _performPostGameCleanup(uint256 _gameId) private {
        Game storage game = gameIdToGameMapping[_gameId];
        _freeUpCardsForFutureGames(game.p1TokenId, game.p2TokenId);
    }

    function _convertMatchServiceResult(MatchService.Outcome _result) private pure returns (Outcome) {
        if(_result == MatchService.Outcome.HOME_WIN) {
            return Outcome.HOME_WIN;
        } else if (_result == MatchService.Outcome.AWAY_WIN) {
            return Outcome.AWAY_WIN;
        } else if (_result == MatchService.Outcome.DRAW) {
            return Outcome.DRAW;
        } else {
            return Outcome.UNINITIALISED;
        }
    }

    /////////////////
    // Constructor //
    /////////////////

    constructor (IERC721 _nft, MatchService _matchService) public {
        require(address(_nft) != address(0), "match.prediction.error.nft.contract.address.zero");
        require(address(_nft) != msg.sender, "match.prediction.error.nft.contract.eq.owner");
        require(address(_matchService) != address(0), "match.prediction.error.match.service.address.zero");
        require(address(_matchService) != msg.sender, "match.prediction.error.match.service.address.eq.owner");

        nft = _nft;
        matchService = _matchService;

        emit ContractDeployed(address(nft), address(matchService));
    }

    ///////////////
    // Functions //
    ///////////////

    function makeFirstPrediction(uint256 _matchId, uint256 _tokenId, Outcome _prediction)
    whenNotPaused
    onlyWhenTokenNotAlreadyPlaying(_tokenId)
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

    function getAllGameIds(address player)
    whenNotPaused external view returns(uint256[] memory) {
        return playerToGameIdsMapping[player];
    }

    function withdraw(uint256 _gameId)
    whenNotPaused
    onlyWhenRealGame(_gameId)
    onlyWhenAllPredictionsReceived(_gameId)
    onlyWhenGameMatchResultReceived(_gameId) external {
        Game storage game = gameIdToGameMapping[_gameId];
        MatchService.Outcome matchResult = matchService.matchResult(game.matchId);

        _performWithdrawal(game, _convertMatchServiceResult(matchResult));
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