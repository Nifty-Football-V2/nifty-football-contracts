const FutballCardsBlindPack = artifacts.require('FutballCardsBlindPack.sol');

module.exports = async function (deployer, network, accounts) {
    const _futballCardsBlindPack = await FutballCardsBlindPack.deployed();

    await _futballCardsBlindPack.addCredit(accounts[0], {from: accounts[0]});
    await _futballCardsBlindPack.addCredit(accounts[0], {from: accounts[0]});
    await _futballCardsBlindPack.addCredit(accounts[0], {from: accounts[0]});
    await _futballCardsBlindPack.addCredit(accounts[0], {from: accounts[0]});
    await _futballCardsBlindPack.addCredit(accounts[0], {from: accounts[0]});

    await _futballCardsBlindPack.blindPack({from: accounts[0]});
    await _futballCardsBlindPack.blindPack({from: accounts[0]});
    await _futballCardsBlindPack.blindPack({from: accounts[0]});
    await _futballCardsBlindPack.blindPack({from: accounts[0]});
    await _futballCardsBlindPack.blindPack({from: accounts[0]});
};
