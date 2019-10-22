pragma solidity 0.5.5;

import "../NiftyFootballTradingCardBlindPack.sol";

contract MockBlindBuyingContract {

    NiftyFootballTradingCardBlindPack public blindPack;

    constructor (NiftyFootballTradingCardBlindPack _blindPack) public {
        blindPack = _blindPack;
    }

    function blindPackTo(address _to) public payable {
        blindPack.blindPackTo.value(msg.value)(_to);
    }

    function buyBatchTo(address _to, uint256 _numberOfCards) public payable {
        blindPack.buyBatchTo.value(msg.value)(_to, _numberOfCards);
    }

}
