const {getAccountOne} = require('../constants');

const NiftyFootballTradingCard = artifacts.require('NiftyFootballTradingCard.sol');
const NiftyFootballTradingCardBlindPack = artifacts.require('NiftyFootballTradingCardBlindPack.sol');
const NiftyFootballTradingCardGenerator = artifacts.require('NiftyFootballTradingCardGenerator.sol');

module.exports = async function (deployer, network, accounts) {
    const _generator = await NiftyFootballTradingCardGenerator.deployed();
    const _niftyFootballTradingCard = await NiftyFootballTradingCard.deployed();

    const accountOne = getAccountOne(accounts, network);

    // Deploy
    await deployer.deploy(
        NiftyFootballTradingCardBlindPack,
        accounts[0],
        _generator.address,
        _niftyFootballTradingCard.address,
        {
            from: accountOne
        });

    const _niftyFootballTradingCardBlindPack = await NiftyFootballTradingCardBlindPack.deployed();

    // white blind pack creator
    await _niftyFootballTradingCard.addWhitelisted(_niftyFootballTradingCardBlindPack.address, {from: accountOne});
};
