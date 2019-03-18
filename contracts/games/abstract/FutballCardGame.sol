pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";

contract FutballCardGame is Ownable, Pausable {
    using SafeMath for uint256;

    IERC721 public nft;
    // todo: abstract resulter / oracle to enable creation of update methods

    ///////////////
    // Modifiers //
    ///////////////

    modifier onlyWhenTokenOwner(uint256 _tokenId) {
        require(nft.ownerOf(_tokenId) == msg.sender, "futball.card.game.error.not.nft.owner");
        _;
    }

    modifier onlyWhenContractIsApproved(uint256 _tokenId) {
        require(nft.getApproved(_tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "futball.card.game.error.nft.not.approved");
        _;
    }

    modifier onlyWhenRealGame(uint256 _gameId) {
        require(_isValidGame(_gameId), "futball.card.game.error.invalid.game");
        _;
    }

    modifier onlyWhenGameOpen(uint256 _gameId) {
        require(_isGameOpen(_gameId), "futball.card.game.error.game.closed");
        _;
    }

    modifier onlyWhenGameNotComplete(uint256 _gameId) {
        require(_isGameIncomplete(_gameId), "futball.card.game.error.game.complete");
        _;
    }

    modifier onlyWhenTokenNotAlreadyPlaying(uint256 _tokenId) {
        require(_isTokenNotAlreadyPlaying(_tokenId), "futball.card.game.error.token.playing");
        _;
    }

    /////////////////////////
    // Function Signatures //
    /////////////////////////

    function _isValidGame(uint256 _gameId) internal view returns (bool);
    function _isGameOpen(uint256 _gameId) internal view returns (bool);
    function _isGameIncomplete(uint256 _gameId) internal view returns (bool);
    function _isTokenNotAlreadyPlaying(uint256 _tokenId) internal view returns (bool);

    // todo: Add nft / resulter contract update methods
}