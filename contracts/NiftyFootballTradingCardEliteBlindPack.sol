pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";


import "./libs/Strings.sol";
import "./INiftyTradingCardCreator.sol";
import "./INiftyTradingCardCreator.sol";
import "./generators/INiftyFootballTradingCardGenerator.sol";

contract NiftyFootballTradingCardEliteBlindPack is Ownable, Pausable {
    using SafeMath for uint256;

    event PriceInWeiChanged(uint256 _old, uint256 _new);

    event BlindPackPulled(uint256 indexed _tokenId, address indexed _to);

    event DefaultCardTypeChanged(uint256 _new);

    event AttributesBaseChanged(uint256 _new);

    event FutballCardsGeneratorChanged(INiftyFootballTradingCardGenerator _new);

    INiftyFootballTradingCardGenerator public generator;
    INiftyTradingCardCreator public creator;
    address payable wallet;

    uint256 public totalPurchasesInWei = 0;
    uint256 public cardTypeDefault = 0;
    uint256 public attributesBase = 60; // Standard 60-100

    uint256[] public pricePerCard = [
    // single cards
    16000000000000000, // 1 @ = 0.016 ETH / $2.50
    16000000000000000, // 2 @ = 0.016 ETH / $2.50

    // 1 packs
    14500000000000000, //  3 @ = 0.0145 ETH / $2.30
    14500000000000000, //  4 @ = 0.0145 ETH / $2.30
    14500000000000000, //  5 @ = 0.0145 ETH / $2.30

    // 2 packs
    13500000000000000, //  6 @ = 0.0135 ETH / $2.15
    13500000000000000, //  7 @ = 0.0135 ETH / $2.15
    13500000000000000, //  8 @ = 0.0135 ETH / $2.15

    // 3 packs or more
    12500000000000000, //  9 @ = 0.0125 ETH / $2
    12500000000000000 //  10 @ = 0.0125 ETH / $2
    ];

    constructor (address payable _wallet, INiftyFootballTradingCardGenerator _generator, INiftyTradingCardCreator _creator) public {
        generator = _generator;
        creator = _creator;
        wallet = _wallet;
    }

    function blindPack() whenNotPaused public payable returns (uint256 _tokenId) {
        return blindPackTo(msg.sender);
    }

    function blindPackTo(address _to) whenNotPaused public payable returns (uint256 _tokenId) {
        require(
            msg.value >= totalPrice(1),
            "Must supply at least the required minimum purchase value"
        );
        require(!isContract(msg.sender), "Unable to buy packs from another contract");

        uint256 tokenId = _generateAndAssignCard(_to);

        _takePayment();

        return tokenId;
    }

    function buyBatch(uint256 _numberOfCards) whenNotPaused public payable returns (uint256[] memory _tokenIds){
        return buyBatchTo(msg.sender, _numberOfCards);
    }

    function buyBatchTo(address _to, uint256 _numberOfCards) whenNotPaused public payable returns (uint256[] memory _tokenIds){
        require(
            msg.value >= totalPrice(_numberOfCards),
            "Must supply at least the required minimum purchase value"
        );
        require(!isContract(msg.sender), "Unable to buy packs from another contract");

        uint256[] memory generatedTokenIds = new uint256[](_numberOfCards);

        for (uint i = 0; i < _numberOfCards; i++) {
            generatedTokenIds[i] = _generateAndAssignCard(_to);
        }

        _takePayment();

        return generatedTokenIds;
    }

    function _generateAndAssignCard(address _to) internal returns (uint256 _tokenId) {
        // Generate card
        (uint256 _nationality, uint256 _position, uint256 _ethnicity, uint256 _kit, uint256 _colour) = generator.generateCard(msg.sender);

        // cardType is 0 for genesis (initially)
        uint256 tokenId = creator.mintCard(cardTypeDefault, _nationality, _position, _ethnicity, _kit, _colour, _to);

        // Generate attributes
        (uint256 _strength, uint256 _speed, uint256 _intelligence, uint256 _skill) = generator.generateAttributes(msg.sender, attributesBase);
        creator.setAttributes(tokenId, _strength, _speed, _intelligence, _skill);

        (uint256 _firstName, uint256 _lastName) = generator.generateName(msg.sender);
        creator.setName(tokenId, _firstName, _lastName);

        emit BlindPackPulled(tokenId, _to);

        return tokenId;
    }

    function _takePayment() internal {
        // any trapped ether can be withdrawn with withdraw()
        totalPurchasesInWei = totalPurchasesInWei.add(msg.value);
        wallet.transfer(msg.value);
    }

    function setCardTypeDefault(uint256 _newDefaultCardType) public onlyOwner returns (bool) {
        cardTypeDefault = _newDefaultCardType;

        emit DefaultCardTypeChanged(_newDefaultCardType);

        return true;
    }

    function setAttributesBase(uint256 _newAttributesBase) public onlyOwner returns (bool) {
        attributesBase = _newAttributesBase;

        emit AttributesBaseChanged(_newAttributesBase);

        return true;
    }

    function setFutballCardsGenerator(INiftyFootballTradingCardGenerator _futballCardsGenerator) public onlyOwner returns (bool) {
        generator = _futballCardsGenerator;

        emit FutballCardsGeneratorChanged(_futballCardsGenerator);

        return true;
    }

    function updatePricePerCardAtIndex(uint256 _index, uint256 _priceInWei) public onlyOwner returns (bool) {
        pricePerCard[_index] = _priceInWei;
        return true;
    }

    function updatePricePerCard(uint256[] memory _pricePerCard) public onlyOwner returns (bool) {
        pricePerCard = _pricePerCard;
        return true;
    }

    function withdraw() public onlyOwner returns (bool) {
        wallet.transfer(address(this).balance);
        return true;
    }


    function totalPrice(uint256 _numberOfCards) public view returns (uint256) {
        if (_numberOfCards > pricePerCard.length) {
            return pricePerCard[pricePerCard.length - 1].mul(_numberOfCards);
        }
        return pricePerCard[_numberOfCards - 1].mul(_numberOfCards);
    }

    /**
     * Returns whether the target address is a contract
     * Based on OpenZeppelin Address library
     * @dev This function will return false if invoked during the constructor of a contract,
     * as the code is not actually created until after the constructor finishes.
     * @param account address of the account to check
     * @return whether the target address is a contract
     */
    function isContract(address account) internal view returns (bool) {
        uint256 size;
        // XXX Currently there is no better way to check if there is a contract in an address
        // than to check the size of the code at that address.
        // See https://ethereum.stackexchange.com/a/14016/36603
        // for more details about how this works.
        // contracts then.
        // solhint-disable-next-line no-inline-assembly
        assembly {size := extcodesize(account)}
        return size > 0;
    }
}
