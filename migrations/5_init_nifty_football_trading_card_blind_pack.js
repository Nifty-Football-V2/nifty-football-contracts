const {getAccountOne} = require('../constants');

const NiftyFootballTradingCard = artifacts.require('NiftyFootballTradingCard.sol');
const NiftyFootballTradingCardBlindPack = artifacts.require('NiftyFootballTradingCardBlindPack.sol');
const FutballCardsGenerator = artifacts.require('FutballCardsGenerator.sol');

module.exports = async function (deployer, network, accounts) {
    const _futballCardsGenerator = await FutballCardsGenerator.deployed();
    const _niftyFootballTradingCard = await NiftyFootballTradingCard.deployed();

    // Deploy
    await deployer.deploy(
        NiftyFootballTradingCardBlindPack,
        accounts[0],
        _futballCardsGenerator.address,
        _niftyFootballTradingCard.address,
        {
            from: accounts[0]
        });

    const _niftyFootballTradingCardBlindPack = await NiftyFootballTradingCardBlindPack.deployed();

    // white blind pack creator
    await _niftyFootballTradingCard.addWhitelisted(_niftyFootballTradingCardBlindPack.address, {from: getAccountOne(accounts, network)});
};
