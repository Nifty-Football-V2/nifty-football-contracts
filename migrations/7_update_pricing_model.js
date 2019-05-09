const {getAccountOne} = require('../constants');

const NiftyFootballTradingCardBlindPack = artifacts.require('NiftyFootballTradingCardBlindPack.sol');
const NiftyFootballTradingCardEliteBlindPack = artifacts.require('NiftyFootballTradingCardEliteBlindPack.sol');

module.exports = async function (deployer, network, accounts) {
    const accountOne = getAccountOne(accounts, network);

    const _niftyFootballTradingCardBlindPack = await NiftyFootballTradingCardBlindPack.deployed();
    const _niftyFootballTradingCardEliteBlindPack = await NiftyFootballTradingCardEliteBlindPack.deployed();

    /*
    |   | REGULAR (USD) | ELITE (USD) | SHOW  |
    | - | ------------- | ----------- | ----- |
    | 1 | 3             | 4           | R     |
    | 3 | 7             | 9           | R & E |
    | 6 | 12            | 15          | R & E |
    | 9 | 18            | 21          | E     |
     */

    await _niftyFootballTradingCardBlindPack.updatePricePerCard([
        // single cards
        "17660000000000000", // 1 @ = 0.01766 ETH / $3
        "17660000000000000", // 2 @ = 0.01766 ETH / $3

        // 1 packs
        "13720000000000000", //  3 @ = 0.01372 ETH / $2.33
        "13720000000000000", //  4 @ = 0.01372 ETH / $2.33
        "13720000000000000", //  5 @ = 0.01372 ETH / $2.33

        // 2 packs
        "11780000000000000", //  6 @ = 0.01178 ETH / $2
        "11780000000000000", //  7 @ = 0.01178 ETH / $2
        "11780000000000000", //  8 @ = 0.01178 ETH / $2

        // 3 packs or more
        "11780000000000000", //  9 @ = 0.01178 ETH / $2
        "11780000000000000" //  10 @ = 0.01178 ETH / $2
    ], {from: accountOne});

    await _niftyFootballTradingCardEliteBlindPack.updatePricePerCard([
        // single cards
        "23550000000000000", // 1 @ = 0.02355 ETH / $4
        "23550000000000000", // 2 @ = 0.02355 ETH / $4

        // 1 packs
        "17660000000000000", //  3 @ = 0.01766 ETH / $3
        "17660000000000000", //  4 @ = 0.01766 ETH / $3
        "17660000000000000", //  5 @ = 0.01766 ETH / $3

        // 2 packs
        "14720000000000000", //  6 @ = 0.01472 ETH / $2.50
        "14720000000000000", //  7 @ = 0.01472 ETH / $2.50
        "14720000000000000", //  8 @ = 0.01472 ETH / $2.50

        // 3 packs or more
        "13720000000000000", //  9 @ = 0.01372 ETH / $2.33
        "13720000000000000" //  10 @ = 0.01372 ETH / $2.33
    ], {from: accountOne});

};
