pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract HeadToHeadResulter is Ownable {
    using SafeMath for uint256;

    uint256 public MAX_VALUE = 100;

    struct Result {
        uint256 outcome;
        uint256 weight;
    }

    Result[] public result;

    constructor () public {
        result.push(Result(1, 25));
        result.push(Result(2, 25));
        result.push(Result(3, 25));
        result.push(Result(4, 25));
    }

    uint256 internal nonce = 0;

    event Resulted(uint256 gameId, uint256 result);

    function result(uint256 gameId, address _sender) external returns (uint256) {
        nonce++;

        bytes memory packed = abi.encodePacked(blockhash(block.number), _sender, nonce);

        uint256 random = uint256(keccak256(packed)) % MAX_VALUE;

        uint256 marker = 0;

        for (uint i = 0; i < result.length; i++) {
            marker = marker.add(result[i].weight);
            if (random < marker) {
                emit Resulted(gameId, result[i].outcome);
                return result[i].outcome;
            }
        }

        revert("Unable to find match");
    }

    function getConfigSize() public view returns (uint256) {
        return result.length;
    }

    function getConfig(uint256 index) public view returns (uint256 value, uint256 weight) {
        return (result[index].outcome, result[index].weight);
    }
}
