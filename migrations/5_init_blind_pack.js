const {getAccountOne} = require('../constants');

const FutballCards = artifacts.require('FutballCards.sol');
const FutballCardsBlindPack = artifacts.require('FutballCardsBlindPack.sol');
const FutballCardsGenerator = artifacts.require('FutballCardsGenerator.sol');

module.exports = async function (deployer, network, accounts) {
    const _futballCardsGenerator = await FutballCardsGenerator.deployed();
    const _futballCards = await FutballCards.deployed();

    // Deploy
    await deployer.deploy(
        FutballCardsBlindPack,
        accounts[0],
        _futballCardsGenerator.address,
        _futballCards.address,
        {
            from: accounts[0]
        });

    const _futballCardsBlindPack = await FutballCardsBlindPack.deployed();

    // white blind pack creator
    await _futballCards.addWhitelisted(_futballCardsBlindPack.address, {from: getAccountOne(accounts, network)});
};
