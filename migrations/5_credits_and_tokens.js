const {getAccountOne} = require('../constants');

const NiftyFootballTradingCardBlindPack = artifacts.require('NiftyFootballTradingCardBlindPack.sol');

module.exports = async function (deployer, network, accounts) {
    const _niftyFootballTradingCardBlindPack = await NiftyFootballTradingCardBlindPack.deployed();

    const accountOne = getAccountOne(accounts, network);

    await _niftyFootballTradingCardBlindPack.addCredits(accountOne, 30, {from: accountOne});
};
