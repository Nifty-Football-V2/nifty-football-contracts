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
    constructor (string memory name, string memory symbol) public ERC721MetadataWithoutTokenUri(name, symbol) {
        // solhint-disable-previous-line no-empty-blocks
    }
}
