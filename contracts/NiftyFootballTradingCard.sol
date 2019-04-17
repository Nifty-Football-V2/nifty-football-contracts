pragma solidity 0.5.0;

import "./NiftyTradingCard.sol";

contract NiftyFootballTradingCard is NiftyTradingCard {

    constructor (string memory _tokenBaseURI) public CustomERC721Full("Nifty Football Trading Card", "NFTFC") {
        super.addWhitelisted(msg.sender);
        tokenBaseURI = _tokenBaseURI;
    }
}
