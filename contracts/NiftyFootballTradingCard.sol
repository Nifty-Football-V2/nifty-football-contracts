pragma solidity 0.5.5;

import "./NiftyTradingCard.sol";

contract NiftyFootballTradingCard is NiftyTradingCard {

    constructor (string memory _tokenBaseURI) public NiftyTradingCard("Nifty Football Trading Card", "NFTFC") {
        super.addWhitelisted(msg.sender);
        tokenBaseURI = _tokenBaseURI;
    }
}
