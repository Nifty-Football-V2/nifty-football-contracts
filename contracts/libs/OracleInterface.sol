pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract OracleInterface is Ownable, Pausable {
    using SafeMath for uint256;

    event OracleUpdated (
        address indexed previous,
        address indexed current
    );

    address public oracle;

    modifier onlyWhenNotAddressZero(address addr) {
        require(addr != address(0), "oracle.interface.error.address.zero");
        _;
    }

    constructor (address _oracle) internal {
        require(_oracle != address(0), "oracle.interface.error.oracle.address.zero");
        require(_oracle != msg.sender, "oracle.interface.error.oracle.address.eq.owner");
        oracle = _oracle;

        emit OracleUpdated(address(0), _oracle);
    }

    function updateOracle(address _newOracle)
    whenNotPaused
    onlyOwner
    onlyWhenNotAddressZero(_newOracle) external {
        address previous = oracle;
        oracle = _newOracle;

        emit OracleUpdated(previous, oracle);
    }
}