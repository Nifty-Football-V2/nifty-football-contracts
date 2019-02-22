pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../IFutballCardsAttributes.sol";

contract FutballCardGame is Ownable, Pausable {
    using SafeMath for uint256;

    IFutballCardsAttributes public nft;
    // todo: abstract resulter / oracle to enable creation of update methods

    ///////////////
    // Modifiers //
    ///////////////

    modifier onlyWhenTokenOwner(uint256 _tokenId) {
        require(nft.ownerOf(_tokenId) == msg.sender, "You cannot enter if you dont own the card");
        _;
    }

    modifier onlyWhenContractIsApprovedForAllNFTs() {
        require(nft.isApprovedForAll(msg.sender, address(this)), "No NFTs approved for play");
        _;
    }

    modifier onlyWhenContractIsApproved(uint256 _tokenId) {
        require(nft.getApproved(_tokenId) == address(this), "NFT not approved for play");
        _;
    }

    modifier onlyWhenRealGame(uint256 _gameId) {
        require(_isValidGame(_gameId), "Game not setup");
        _;
    }

    modifier onlyWhenGameOpen(uint256 _gameId) {
        require(_isGameOpen(_gameId), "Game not open");
        _;
    }

    modifier onlyWhenGameDrawn(uint256 _gameId) {
        require(_isGameDraw(_gameId), "Game not in drawn state");
        _;
    }

    modifier onlyWhenGameNotComplete(uint256 _gameId) {
        require(_isGameIncomplete(_gameId), "Game not complete");
        _;
    }

    modifier onlyWhenTokenNotAlreadyPlaying(uint256 _tokenId) {
        require(_isTokenNotAlreadyPlaying(_tokenId), "Token already playing a game");
        _;
    }

    /////////////////////////
    // Function Signatures //
    /////////////////////////

    function _isValidGame(uint256 _gameId) internal returns (bool);
    function _isGameOpen(uint256 _gameId) internal returns (bool);
    function _isGameDraw(uint256 _gameId) internal returns (bool);
    function _isGameIncomplete(uint256 _gameId) internal returns (bool);
    function _isTokenNotAlreadyPlaying(uint256 _tokenId) internal returns (bool);

    // todo: Add nft / resulter contract update methods
}