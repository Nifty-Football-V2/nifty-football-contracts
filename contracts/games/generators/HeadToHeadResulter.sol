pragma solidity 0.5.0;

contract HeadToHeadResulter {

    // FIXME remove parent event is event coming form resulter
    event Resulted(uint256 gameId, uint256 result);

    uint256 randNonce = 0;

    // TODO test this properly

    function result(uint256 gameId, address _sender) public returns (uint256) {
        randNonce++;
        bytes memory packed = abi.encodePacked(blockhash(block.number), _sender, randNonce);
        uint256 outcome = uint256(keccak256(packed)) % 4;
        emit Resulted(gameId, outcome);
        return outcome;
    }
}
