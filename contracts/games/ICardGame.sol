pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";

contract ICardGame is Ownable, Pausable {
    using SafeMath for uint256;

    event NFTUpdated(
        address indexed prevAddr,
        address indexed newAddr
    );

    IERC721 public nft;

    ///////////////
    // Modifiers //
    ///////////////

    modifier onlyWhenNotAddressZero(address addr) {
        require(addr != address(0), "card.game.error.address.zero");
        _;
    }

    modifier onlyWhenTokenOwner(uint256 _tokenId) {
        require(nft.ownerOf(_tokenId) == msg.sender, "card.game.error.not.nft.owner");
        _;
    }

    modifier onlyWhenContractIsApproved(uint256 _tokenId) {
        require(nft.getApproved(_tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "card.game.error.nft.not.approved");
        _;
    }

    modifier onlyWhenRealGame(uint256 _gameId) {
        require(_isValidGame(_gameId), "card.game.error.invalid.game");
        _;
    }

    modifier onlyWhenGameOpen(uint256 _gameId) {
        require(_isGameOpen(_gameId), "card.game.error.game.closed");
        _;
    }

    modifier onlyWhenGameNotComplete(uint256 _gameId) {
        require(_isGameIncomplete(_gameId), "card.game.error.game.complete");
        _;
    }

    modifier onlyWhenTokenNotAlreadyPlaying(uint256 _tokenId) {
        require(_isTokenNotAlreadyPlaying(_tokenId), "card.game.error.token.playing");
        _;
    }

    /////////////////////////
    // Function Signatures //
    /////////////////////////

    function _isValidGame(uint256 _gameId) internal view returns (bool);
    function _isGameOpen(uint256 _gameId) internal view returns (bool);
    function _isGameIncomplete(uint256 _gameId) internal view returns (bool);
    function _isTokenNotAlreadyPlaying(uint256 _tokenId) internal view returns (bool);

    ////////////////
    // Functions //
    ///////////////

    function updateNft(IERC721 _newNft)
    whenNotPaused
    onlyOwner
    onlyWhenNotAddressZero(address(_newNft)) external {
        IERC721 previous = nft;
        nft = _newNft;
        emit NFTUpdated(address(previous), address(_newNft));
    }
}
