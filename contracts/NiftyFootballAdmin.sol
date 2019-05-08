pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

import "./libs/Strings.sol";
import "./INiftyTradingCardCreator.sol";
import "./generators/INiftyFootballTradingCardGenerator.sol";

contract NiftyFootballAdmin is Ownable, Pausable {
    using SafeMath for uint256;

    INiftyFootballTradingCardGenerator public generator;
    INiftyTradingCardCreator public creator;

    uint256 public cardTypeDefault = 100;
    uint256 public attributesBase = 50;

    constructor (
        INiftyFootballTradingCardGenerator _generator,
        INiftyTradingCardCreator _creator
    ) public {
        generator = _generator;
        creator = _creator;
    }

    function generateAndAssignCard(
        uint256 _nationality,
        uint256 _position,
        uint256 _ethnicity,
        uint256 _kit,
        uint256 _colour,
        uint256 _firstName,
        uint256 _lastName,
        address _to
    ) public onlyOwner returns (uint256) {

        // 100 for special
        uint256 tokenId = creator.mintCard(cardTypeDefault, _nationality, _position, _ethnicity, _kit, _colour, _to);
        
        // Generate attributes as normal
        (uint256 _strength, uint256 _speed, uint256 _intelligence, uint256 _skill) = generator.generateAttributes(msg.sender, attributesBase);

        creator.setAttributesAndName(tokenId, _strength, _speed, _intelligence, _skill, _firstName, _lastName);

        return tokenId;
    }

    function setCardTypeDefault(uint256 _newDefaultCardType) public onlyOwner returns (bool) {
        cardTypeDefault = _newDefaultCardType;
        return true;
    }

    function setAttributesBase(uint256 _newAttributesBase) public onlyOwner returns (bool) {
        attributesBase = _newAttributesBase;
        return true;
    }

    function setFutballCardsGenerator(INiftyFootballTradingCardGenerator _futballCardsGenerator) public onlyOwner returns (bool) {
        generator = _futballCardsGenerator;
        return true;
    }
}
