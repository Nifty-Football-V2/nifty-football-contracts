const {getAccountOne} = require('../constants');

const NiftyFootballTradingCardBlindPack = artifacts.require('NiftyFootballTradingCardBlindPack.sol');

module.exports = async function (deployer, network, accounts) {
    const _niftyFootballTradingCardBlindPack = await NiftyFootballTradingCardBlindPack.deployed();

    const accountOne = getAccountOne(accounts, network);

    await _niftyFootballTradingCardBlindPack.addCredit(accountOne, {from: accountOne});
    await _niftyFootballTradingCardBlindPack.addCredit(accountOne, {from: accountOne});
    await _niftyFootballTradingCardBlindPack.addCredit(accountOne, {from: accountOne});
    await _niftyFootballTradingCardBlindPack.addCredit(accountOne, {from: accountOne});
    await _niftyFootballTradingCardBlindPack.addCredit(accountOne, {from: accountOne});

    await _niftyFootballTradingCardBlindPack.blindPack({from: accountOne});
    await _niftyFootballTradingCardBlindPack.blindPack({from: accountOne});
    await _niftyFootballTradingCardBlindPack.blindPack({from: accountOne});
    await _niftyFootballTradingCardBlindPack.blindPack({from: accountOne});
    await _niftyFootballTradingCardBlindPack.blindPack({from: accountOne});
};
