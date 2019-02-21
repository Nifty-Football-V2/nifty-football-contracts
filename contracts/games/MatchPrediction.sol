pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";


contract MatchPrediction {

    ERC721 nft;

    uint256 result = 0;

    constructor (ERC721 _nft) public {
        nft = _nft;
    }
}