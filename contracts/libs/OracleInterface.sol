pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract OracleInterface is Ownable, Pausable {
    using SafeMath for uint256;

    event OracleUpdated (
        address indexed addr,
        bool indexed isOracle
    );

    mapping(address => bool) public isOracle;

    constructor (address _oracle) internal {
        require(_oracle != address(0), "oracle.interface.error.oracle.address.zero");
        require(_oracle != msg.sender, "oracle.interface.error.oracle.address.eq.owner");
        isOracle[_oracle] = true;

        emit OracleUpdated(_oracle, true);
    }

    function updateOracle(address _oracle, bool _isOracle)
    whenNotPaused
    onlyOwner external {
        isOracle[_oracle] = true;

        emit OracleUpdated(_oracle, _isOracle);
    }
}