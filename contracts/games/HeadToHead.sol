pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";
import "openzeppelin-solidity/contracts/access/roles/WhitelistedRole.sol";

import "./libs/Strings.sol";
import "./IFootballUnitedCreator.sol";
import "../generators/HeadToHeadResulter.sol";

contract HeadToHead is Ownable, Pausable, WhitelistedRole {

    IERC721 public nft;

    HeadToHeadResulter public resulter;


    enum State {OPEN, CLOSED}

    struct Game {
        uint256 id;
        uint256 home;
        uint256 away;
        State state;
    }

    // Start at 1 so we can use Game 0 to identify not present
    uint256 totalGames = 1;

    mapping(uint256 => Game) games;

    function createGame(uint256 _tokenId) public returns (uint256 gameId) {
        require(nft.ownerOf(_tokenId) == msg.sender, "You cannot enter if you dont own the card");
        require(nft.isApprovedForAll(msg.sender, this), "NFt not approved to play yet");


        uint256 gameId = totalGames;

        games[totalGames] = Game({
            id : gameId,
            home : _tokenId,
            away : 0,
            state : State.OPEN
            });

        totalGames = totalGames.add(1);

        return gameId;
    }

    // withdraw from game method

    function joinGame(uint256 _gameId, uint256 _tokenId) public {
        require(nft.ownerOf(_tokenId) == msg.sender, "You cannot enter if you dont own the card");
        require(nft.isApprovedForAll(msg.sender, this), "NFt not approved to play yet");

        require(games[_gameId].id > 0, "Game not setup");
        require(games[_gameId].state == State.OPEN, "Game not open");

        // TODO cant enter if you a card cant win 1/4 chance

        games[_gameId].away = _tokenId;

        uint256 result = resulter.result(_gameId, msg.sender);



    }

}
