pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract BuyNowMarketplace is Pausable {
    using SafeMath for uint256;

    event BoughtNow(address indexed _buyer, uint _tokenId, uint256 _priceInWei);
    event ListedToken(address indexed _seller, uint indexed _tokenId, uint256 _priceInWei);
    event DelistedToken(address indexed _seller, uint indexed _tokenId);
    event ListedTokenPriceUpdate(address indexed _seller, uint indexed _tokenId, uint256 _priceInWei);

    modifier onlyWhenTokenOwner(uint256 _tokenId) {
        require(nft.ownerOf(_tokenId) == msg.sender, "You do not own the card");
        _;
    }

    modifier onlyWhenMarketplaceIsApproved(uint256 _tokenId) {
        address owner = nft.ownerOf(_tokenId);
        require(nft.getApproved(_tokenId) == address(this) || nft.isApprovedForAll(owner, address(this)), "Card not approved to sell");
        _;
    }

    ERC721 public nft;
    uint256 public commission;
    address payable wallet;

    mapping(uint256 => uint256) internal tokenIdToPrice;
    uint256[] internal listedTokenIds;

    constructor(address payable _wallet, address _nftAddress, uint256 _commission) public {
        nft = ERC721(_nftAddress);
        wallet = _wallet;
        commission = _commission;
    }

    function listToken(uint256 _tokenId, uint256 _priceInWei) public whenNotPaused onlyWhenTokenOwner(_tokenId) onlyWhenMarketplaceIsApproved(_tokenId) returns (bool) {
        require(tokenIdToPrice[_tokenId] == 0, "Must not be already listed");
        require(_priceInWei > 0, "Must have a positive price");

        tokenIdToPrice[_tokenId] = _priceInWei;

        listedTokenIds.push(_tokenId);

        emit ListedToken(msg.sender, _tokenId, _priceInWei);

        return true;
    }

    function updateListedTokenPrice(uint256 _tokenId, uint256 _priceInWei) public whenNotPaused onlyWhenTokenOwner(_tokenId) returns (bool) {
        require(tokenIdToPrice[_tokenId] != 0, "Must be already listed");
        require(_priceInWei > 0, "Must have a positive price");

        tokenIdToPrice[_tokenId] = _priceInWei;

        emit ListedTokenPriceUpdate(msg.sender, _tokenId, _priceInWei);

        return true;
    }

    function delistToken(uint256 _tokenId) public whenNotPaused onlyWhenTokenOwner(_tokenId) returns (bool) {
        tokenIdToPrice[_tokenId] = 0;

        emit DelistedToken(msg.sender, _tokenId);

        return true;
    }

    function listedTokens() public view returns (uint256[] memory) {
        return listedTokenIds;
    }

    function listedTokenPrice(uint256 _tokenId) public view returns (uint256) {
        return tokenIdToPrice[_tokenId];
    }

    function buyNow(uint256 _tokenId) public payable whenNotPaused onlyWhenMarketplaceIsApproved(_tokenId) {
        require(tokenIdToPrice[_tokenId] > 0, "Token not listed");
        require(msg.value >= tokenIdToPrice[_tokenId], "Value is below asking price");

        address tokenSeller = nft.ownerOf(_tokenId);
        nft.safeTransferFrom(tokenSeller, msg.sender, _tokenId);

        // send commission to wallet
        uint256 buyNowCommission = msg.value.div(100).mul(commission);
        wallet.transfer(buyNowCommission);

        // send value minus commission to token seller
        address payable tokenSellerPayable = address(uint160(tokenSeller));
        tokenSellerPayable.transfer(msg.value.sub(buyNowCommission));

        // delist
        tokenIdToPrice[_tokenId] = 0;

        emit BoughtNow(msg.sender, _tokenId, msg.value);
    }
}
