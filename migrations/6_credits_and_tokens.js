const {getAccountOne} = require('../constants');

const FutballCardsBlindPack = artifacts.require('FutballCardsBlindPack.sol');

module.exports = async function (deployer, network, accounts) {
    const _futballCardsBlindPack = await FutballCardsBlindPack.deployed();

    const accountOne = getAccountOne(accounts, network);

    await _futballCardsBlindPack.addCredit(accountOne, {from: accountOne});
    await _futballCardsBlindPack.addCredit(accountOne, {from: accountOne});
    await _futballCardsBlindPack.addCredit(accountOne, {from: accountOne});
    await _futballCardsBlindPack.addCredit(accountOne, {from: accountOne});
    await _futballCardsBlindPack.addCredit(accountOne, {from: accountOne});

    await _futballCardsBlindPack.blindPack({from: accountOne});
    await _futballCardsBlindPack.blindPack({from: accountOne});
    await _futballCardsBlindPack.blindPack({from: accountOne});
    await _futballCardsBlindPack.blindPack({from: accountOne});
    await _futballCardsBlindPack.blindPack({from: accountOne});
};
