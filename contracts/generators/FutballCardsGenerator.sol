pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract FutballCardsGenerator is Ownable {

    uint256 internal randNonce = 0;

    function generate(address _sender)
    external
    returns (
        uint256 nationality,
        uint256 baseExteriorColorway,
        uint256 baseWindowColorway
    ) {

        // TODO THIS IS DUMB FOR NOW, JUST TO PROVE THE POINT

        return (
        // Base
        generate(_sender, 3),
        generate(_sender, 3),
        generate(_sender, 3)
        );
    }

    function generate(address _sender, uint256 _max) internal returns (uint256) {
        randNonce++;
        bytes memory packed = abi.encodePacked(blockhash(block.number), _sender, randNonce);
        return uint256(keccak256(packed)) % _max;
    }
}
