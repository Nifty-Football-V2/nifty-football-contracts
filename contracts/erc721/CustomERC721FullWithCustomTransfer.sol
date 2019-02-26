pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Enumerable.sol";

import "./ERC721MetadataWithoutTokenUri.sol";

/**
 * @title Full ERC721 Token without token URI as this is handled in the base contract
 *
 * This implementation includes all the required and some optional functionality of the ERC721 standard
 * Moreover, it includes approve all functionality using operator terminology
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract CustomERC721FullWithCustomTransfer is ERC721, ERC721Enumerable, ERC721MetadataWithoutTokenUri {

    address payable public commissionAccount;

    // TODO do we need floating points e.g. 0.25%?
    uint256 private commissionValue = 1; // 1% by default

    // FIXME setter, need whitelisting though
    // Allow this logic to be disabled
    bool enableSplit = true;

    constructor (string memory name, string memory symbol) public ERC721MetadataWithoutTokenUri(name, symbol) {
        commissionAccount = msg.sender;
    }

    // Needs to be payable?
    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Caller not approved or owner");
        _splitFunds(from);
        super.transferFrom(from, to, tokenId);
    }

    function transferFromPayable(address from, address to, uint256 tokenId) payable public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Caller not approved or owner");
        _splitFunds(from);
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public {
        transferFrom(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, _data));
    }

    function _splitFunds(address from) internal {
        if (enableSplit && msg.value > 0) {
            // Extra and absorb commission
            uint256 baseCommission = msg.value.div(100).mul(commissionValue);
            commissionAccount.transfer(baseCommission);

            // FIMXE - how to handle is from is a contract address, is this a problem?
            // Send remaining commission to previous player
            address payable tokenSellerPayable = address(uint160(from));
            tokenSellerPayable.transfer(msg.value.sub(baseCommission));
        }
    }

}
