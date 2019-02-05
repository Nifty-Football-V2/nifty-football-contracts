pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./generators/FutballCardsGenerator.sol";

import "./libs/Strings.sol";
import "./IFootballUnitedCreator.sol";


contract FutballCardsBlindPack is Ownable {
    using SafeMath for uint256;

    event PriceInWeiChanged(
        uint256 _oldPriceInWei,
        uint256 _newPriceInWei
    );

    event BlindPackPulled(
        uint256 indexed _tokenId,
        address indexed _to
    );

    FutballCardsGenerator public futballCardsGenerator;
    IFutballCardsCreator public futballCardsNFT;
    address payable wallet;

    mapping(address => uint256) public credits;

    uint256 public totalPurchasesInWei = 0;
    uint256 public priceInWei = 100;

    constructor (address payable _wallet, FutballCardsGenerator _futballCardsGenerator, IFutballCardsCreator _fuballCardsNFT) public {
        futballCardsGenerator = _futballCardsGenerator;
        futballCardsNFT = _fuballCardsNFT;
        wallet = _wallet;
    }

    function blindPack() public payable returns (uint256 _tokenId) {
        return blindPackFrom(msg.sender);
    }

    function blindPackFrom(address _to) public payable returns (uint256 _tokenId) {
        require(
            credits[msg.sender] > 0 || msg.value >= priceInWei,
            "Must supply at least the required minimum purchase value or have credit"
        );

        (uint256 _nationality, uint256 _position, uint256 _ethnicity, uint256 _kit, uint256 _colour) = futballCardsGenerator.generate(msg.sender);

        uint256 tokenId = futballCardsNFT.mintCard(_nationality, _position, _ethnicity, _kit, _colour, _to);

        // generate attributes
        (uint256 _strength, uint256 _speed, uint256 _intelligence, uint256 _skill) = futballCardsGenerator.generateAttributes(msg.sender);
        futballCardsNFT.setAttributes(tokenId, _strength, _speed, _intelligence, _skill);

        // use credits first
        if (credits[msg.sender] > 0) {
            credits[msg.sender] = credits[msg.sender].sub(1);
        } else {
            totalPurchasesInWei = totalPurchasesInWei.add(msg.value);
            wallet.transfer(msg.value);
        }

        emit BlindPackPulled(tokenId, _to);

        return tokenId;
    }

    function setPriceInWei(uint256 _newPriceInWei) public onlyOwner returns (bool) {
        emit PriceInWeiChanged(priceInWei, _newPriceInWei);

        priceInWei = _newPriceInWei;

        return true;
    }

    function withdraw() public onlyOwner returns(bool) {
        wallet.transfer(address(this).balance);
        return true;
    }

    // TODO batch add credits

    function addCredit(address _to) public onlyOwner returns (bool) {
        credits[_to] = credits[_to].add(1);

        // FIXME EVENT

        return true;
    }
}
