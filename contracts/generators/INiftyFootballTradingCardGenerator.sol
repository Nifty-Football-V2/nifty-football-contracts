pragma solidity 0.5.5;

contract INiftyFootballTradingCardGenerator {
    function generateCard(address _sender) external returns (uint256 _nationality, uint256 _position, uint256 _ethnicity, uint256 _kit, uint256 _colour);

    function generateAttributes(address _sender, uint256 _base) external returns (uint256 strength, uint256 speed, uint256 intelligence, uint256 skill);

    function generateName(address _sender) external returns (uint256 firstName, uint256 lastName);
}
