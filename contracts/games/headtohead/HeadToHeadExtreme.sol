pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../generators/HeadToHeadResulter.sol";
import "./IHeadToHeadEvents.sol";
import "../../INiftyTradingCardAttributes.sol";

/*
 * Head to Head Extreme - where players lose their cards if the battle is lost
 */
contract HeadToHeadExtreme is Ownable, Pausable, IHeadToHeadEvents {
    using SafeMath for uint256;

    enum State {UNSET, OPEN, HOME_WIN, AWAY_WIN, DRAW, CLOSED}

    struct Game {
        uint256 id;
        uint256 homeTokenId;
        address homeOwner;
        uint256 awayTokenId;
        address awayOwner;
        State state;
    }

    // Start at 1 so we can use Game ID 0 to identify not set
    uint256 public totalGames = 1;

    // Game ID -> Game
    mapping(uint256 => Game) public games;

    // Token ID -> Game ID - once resulted or withdraw from game we remove from here
    mapping(uint256 => uint256) public tokenToGameMapping;

    // A list of open game IDS
    uint256[] public openGames;

    // A mapping for the list of GameID => Position in open games array
    mapping(uint256 => uint256) public gamesIndex;

    INiftyTradingCardAttributes public nft;
    HeadToHeadResulter public resulter;

    /////////////////
    // Constructor //
    /////////////////

    constructor (HeadToHeadResulter _resulter, INiftyTradingCardAttributes _nft) public {
        resulter = _resulter;
        nft = _nft;
    }

    ///////////////
    // Modifiers //
    ///////////////

    modifier onlyWhenTokenOwner(uint256 _tokenId) {
        require(nft.ownerOf(_tokenId) == msg.sender, "You dont own the card");
        _;
    }

    modifier onlyWhenContractIsApproved(uint256 _tokenId) {
        address owner = nft.ownerOf(_tokenId);
        require(nft.getApproved(_tokenId) == address(this) || nft.isApprovedForAll(owner, address(this)), "Card not approved to sell");
        _;
    }

    modifier onlyWhenRealGame(uint256 _gameId) {
        require(games[_gameId].id > 0, "Game not setup");
        _;
    }

    modifier onlyWhenGameOpen(uint256 _gameId) {
        require(games[_gameId].state == State.OPEN, "Game not open");
        _;
    }

    modifier onlyWhenGameDrawn(uint256 _gameId) {
        require(games[_gameId].state == State.DRAW, "Game not in drawn state");
        _;
    }

    modifier onlyWhenGameNotComplete(uint256 _gameId) {
        require(games[_gameId].state == State.DRAW || games[_gameId].state == State.OPEN, "Game not open");
        _;
    }

    modifier onlyWhenTokenNotAlreadyPlaying(uint256 _tokenId) {
        require(tokenToGameMapping[_tokenId] == 0, "Token already playing a game");
        _;
    }

    ///////////////
    // Functions //
    ///////////////

    function createGame(uint256 _tokenId)
    whenNotPaused
    onlyWhenContractIsApproved(_tokenId)
    onlyWhenTokenOwner(_tokenId)
    onlyWhenTokenNotAlreadyPlaying(_tokenId)
    public returns (uint256 _gameId) {

        uint256 gameId = totalGames;

        games[totalGames] = Game({
            id : gameId,
            homeTokenId : _tokenId,
            homeOwner : msg.sender,
            awayTokenId : 0,
            awayOwner : address(0),
            state : State.OPEN
            });

        totalGames = totalGames.add(1);

        tokenToGameMapping[_tokenId] = gameId;

        // Keep a track of the game
        gamesIndex[gameId] = openGames.length;
        openGames.push(gameId);

        emit GameCreated(gameId, msg.sender, _tokenId);

        return gameId;
    }

    function resultGame(uint256 _gameId, uint256 _tokenId)
    whenNotPaused
    onlyWhenContractIsApproved(_tokenId)
    onlyWhenTokenOwner(_tokenId)
    onlyWhenTokenNotAlreadyPlaying(_tokenId)
    onlyWhenRealGame(_gameId)
    onlyWhenGameOpen(_gameId)
    public returns (bool) {

        uint256[5] memory home = nft.attributesFlat(games[_gameId].homeTokenId);
        uint256[5] memory away = nft.attributesFlat(_tokenId);

        bool homeHasASlimChanceOfWinning = false;
        bool awayHasASlimChanceOfWinning = false;

        // Ensure you can win at least on one attribute
        for (uint i = 0; i < 4; i++) {
            if (home[i] < away[i]) {
                awayHasASlimChanceOfWinning = true;
            } else {
                homeHasASlimChanceOfWinning = true;
            }
        }
        require(homeHasASlimChanceOfWinning && awayHasASlimChanceOfWinning, "There is no chance of winning");

        games[_gameId].awayTokenId = _tokenId;
        games[_gameId].awayOwner = msg.sender;

        // Update mapping
        tokenToGameMapping[_tokenId] = _gameId;

        _resultGame(_gameId);

        return true;
    }

    function reMatch(uint256 _gameId)
    whenNotPaused
    onlyWhenGameDrawn(_gameId)
    public returns (bool) {

        address homeOwner = games[_gameId].homeOwner;
        address awayOwner = games[_gameId].awayOwner;

        // FIXME should this check approval of both again?

        // Allow both players or the contract owner to result the game
        require(awayOwner == msg.sender || homeOwner == msg.sender || isOwner(), "Can only re-match when you are playing");

        _resultGame(_gameId);

        return true;
    }

    function withdrawFromGame(uint256 _gameId)
    whenNotPaused
    onlyWhenGameNotComplete(_gameId)
    public returns (bool) {

        require(games[_gameId].homeOwner == msg.sender || games[_gameId].awayOwner == msg.sender || isOwner(), "Cannot close a game you are not part of");

        games[_gameId].state = State.CLOSED;

        _cleanUpGame(_gameId, games[_gameId].homeTokenId, games[_gameId].awayTokenId);

        emit GameClosed(_gameId, msg.sender);

        return true;
    }

    function getGame(uint256 _gameId)
    onlyWhenRealGame(_gameId)
    public view returns (
        uint256 homeTokenId,
        address homeOwner,
        uint256 awayTokenId,
        address awayOwner,
        State state
    ) {
        Game memory game = games[_gameId];
        return (
        game.homeTokenId,
        game.homeOwner,
        game.awayTokenId,
        game.awayOwner,
        game.state
        );
    }

    function openGamesSize() public view returns (uint256 _size) {
        return openGames.length;
    }

    function _resultGame(uint256 _gameId) internal {
        address homeOwner = games[_gameId].homeOwner;
        uint256 homeTokenId = games[_gameId].homeTokenId;

        address awayOwner = games[_gameId].awayOwner;
        uint256 awayTokenId = games[_gameId].awayTokenId;

        // indexes are zero based
        uint256 result = resulter.result(_gameId, msg.sender);

        uint256[5] memory home = nft.attributesFlat(homeTokenId);
        uint256[5] memory away = nft.attributesFlat(awayTokenId);

        if (home[result] > away[result]) {
            nft.safeTransferFrom(awayOwner, homeOwner, awayTokenId);
            games[_gameId].state = State.HOME_WIN;

            _cleanUpGame(_gameId, homeTokenId, awayTokenId);

            emit GameResulted(homeOwner, awayOwner, _gameId, home[result], away[result], result);
        }
        else if (home[result] < away[result]) {
            nft.safeTransferFrom(homeOwner, awayOwner, homeTokenId);
            games[_gameId].state = State.AWAY_WIN;

            _cleanUpGame(_gameId, homeTokenId, awayTokenId);

            emit GameResulted(homeOwner, awayOwner, _gameId, home[result], away[result], result);
        }
        else {
            // Allow a re-match if no winner found
            games[_gameId].state = State.DRAW;

            emit GameDraw(homeOwner, awayOwner, _gameId, home[result], away[result], result);
        }
    }

    function getGameForToken(uint256 _tokenId) public view returns (uint256 gameId, uint256 homeTokenId, address homeOwner, uint256 awayTokenId, address awayOwner, State state) {
        uint256 _gameId = tokenToGameMapping[_tokenId];
        Game storage _game = games[_gameId];
        return (
        _game.id,
        _game.homeTokenId,
        _game.homeOwner,
        _game.awayTokenId,
        _game.awayOwner,
        _game.state
        );
    }

    function _cleanUpGame(uint256 _gameId, uint256 _homeTokenId, uint256 _awayTokenId) internal {

        // Clean up in game mappings
        delete tokenToGameMapping[_homeTokenId];
        delete tokenToGameMapping[_awayTokenId];

        // Delete the game once its finished
        delete openGames[gamesIndex[_gameId]];
    }

}
