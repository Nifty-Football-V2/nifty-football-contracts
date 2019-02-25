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
contract CustomERC721Full is ERC721, ERC721Enumerable, ERC721MetadataWithoutTokenUri {

    address public commissionAccount;
    uint256 private commissionValue = 1;

    constructor (string memory name, string memory symbol) public ERC721MetadataWithoutTokenUri(name, symbol) {
        commissionAccount = msg.sender;
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public {
        transferFrom(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, _data));
    }

}
