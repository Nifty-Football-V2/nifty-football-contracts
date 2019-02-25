pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract BuyNowMarketplace is Pausable {
    using SafeMath for uint256;

    event BoughtNow(address indexed payer, uint tokenId, uint256 amount);

    modifier onlyWhenTokenOwner(uint256 _tokenId) {
        require(nft.ownerOf(_tokenId) == msg.sender, "You cannot enter if you dont own the card");
        _;
    }

    modifier onlyWhenTokenExists(uint256 _tokenId) {
        require(nft.ownerOf(_tokenId) != address(0), "Token must exist");
        _;
    }

    ERC721 public nft;
    uint256 public commission;
    address payable wallet;

    mapping(uint256 => uint256) internal tokenIdToPrice;
    uint256[] internal listedTokenIds;

    constructor(address _nftAddress, address payable _wallet, uint256 _commission) public {
        nft = ERC721(_nftAddress);
        wallet = _wallet;
        commission = _commission;
    }

    function listToken(uint256 _tokenId, uint256 _priceInWei) public whenNotPaused onlyWhenTokenOwner(_tokenId) returns (bool) {
        // FIXME - allow this to be configurable and make msg more generic
        require(_priceInWei >= 1000000000, "Must be at least 1 GWEI");

        tokenIdToPrice[_tokenId] = _priceInWei;
        listedTokenIds.push(_tokenId);
        return true;
    }

    // if token does not have a price it is de-listed
    function delistToken(uint256 _tokenId) public whenNotPaused onlyWhenTokenOwner(_tokenId) returns (bool) {
        delete tokenIdToPrice[_tokenId];
        return true;
    }

    function buyNow(uint256 _tokenId) public payable whenNotPaused onlyWhenTokenExists(_tokenId) {
        require(tokenIdToPrice[_tokenId] > 0, "Token not listed");
        require(msg.value >= tokenIdToPrice[_tokenId], "Value is below asking price");

        address tokenSeller = nft.ownerOf(_tokenId);
        nft.safeTransferFrom(tokenSeller, msg.sender, _tokenId);

        // FIXME make possible to use smaller denomination e.g. 0.5%
        // send commission to wallet
        uint256 buyNowCommission = msg.value.div(100).mul(commission);
        wallet.transfer(buyNowCommission);

        // send value minus commission to token seller
        address payable tokenSellerPayable = address(uint160(tokenSeller));
        tokenSellerPayable.transfer(msg.value.sub(buyNowCommission));

        emit BoughtNow(msg.sender, _tokenId, msg.value);

        // FIXME include return type so we other contract can in theory call and know if it was successful
    }
}
