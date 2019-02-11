pragma solidity ^0.5.0;

import "../generators/HeadToHeadResulter.sol";

contract MockHeadToHeadResulter is HeadToHeadResulter
{
    event Resulted(uint256 gameId, uint256 result);

    uint256 mockResult = 0;

    function setResult(uint256 result) public {
        mockResult = result;
    }

    function result(uint256 gameId, address _sender) public returns (uint256) {
        if (mockResult != 0) {
            uint256 fakeResult = mockResult;
            mockResult = 0; // reset between results
            emit Resulted(gameId, fakeResult);
            return fakeResult;
        }
        return super.result(gameId, _sender);
    }
}
