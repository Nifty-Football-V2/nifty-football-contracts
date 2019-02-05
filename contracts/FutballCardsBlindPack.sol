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
    IFutballCardsCreator public footballUnitedNFT;

    mapping(address => uint256) public credits;

    uint256 public totalPurchasesInWei = 0;
    uint256 public priceInWei = 100;

    constructor (
        FutballCardsGenerator _futballCardsGenerator,
        IFutballCardsCreator _footballUnitedNFT
    ) public {
        futballCardsGenerator = _futballCardsGenerator;
        footballUnitedNFT = _footballUnitedNFT;
    }

    function blindPack() public payable returns (uint256 _tokenId) {
        blindPackFrom(msg.sender);
    }

    function blindPackFrom(address _to) public payable returns (uint256 _tokenId) {
        require(
            credits[msg.sender] > 0 || msg.value >= priceInWei,
            "Must supply at least the required minimum purchase value or have credit"
        );

        (uint256 _nationality, uint256 _skin, uint256 _hair) = futballCardsGenerator.generate(msg.sender);

        uint256 tokenId = footballUnitedNFT.mintCard(
            _nationality,
            _nationality,
            _nationality,
            _nationality,
            _nationality,
            _nationality,
            _to
        );

        // use credits first
        if (credits[msg.sender] > 0) {
            credits[msg.sender] = credits[msg.sender].sub(1);
        } else {
            totalPurchasesInWei = totalPurchasesInWei.add(msg.value);
        }

        // FIXME
        // transfer for wei somewhere

        emit BlindPackPulled(tokenId, _to);

        return tokenId;
    }

    function setPriceInWei(uint256 _newPriceInWei) public onlyOwner returns (bool) {
        emit PriceInWeiChanged(priceInWei, _newPriceInWei);

        priceInWei = _newPriceInWei;

        return true;
    }

    // TODO batch add credits

    function addCredit(address _to) public onlyOwner returns (bool) {
        credits[_to] = credits[_to].add(1);

        // FIXME EVENT

        return true;
    }
}
