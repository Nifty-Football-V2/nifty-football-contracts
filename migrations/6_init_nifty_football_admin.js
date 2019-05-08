const {getAccountOne} = require('../constants');

const NiftyFootballTradingCard = artifacts.require('NiftyFootballTradingCard.sol');
const NiftyFootballTradingCardGenerator = artifacts.require('NiftyFootballTradingCardGenerator.sol');
const NiftyFootballAdmin = artifacts.require('NiftyFootballAdmin.sol');

module.exports = async function (deployer, network, accounts) {
    const accountOne = getAccountOne(accounts, network);

    const _niftyFootballTradingCard = await NiftyFootballTradingCard.deployed();
    const _niftyFootballTradingCardGenerator = await NiftyFootballTradingCardGenerator.deployed();

    // Deploy elite blind pack
    await deployer.deploy(
        NiftyFootballAdmin,
        _niftyFootballTradingCardGenerator.address,
        _niftyFootballTradingCard.address,
        {
            from: accountOne
        });

    const _niftyFootballAdmin = await NiftyFootballAdmin.deployed();

    // white blind pack creator
    await _niftyFootballTradingCard.addWhitelisted(_niftyFootballAdmin.address, {from: accountOne});
};
