const {getAccountOne} = require('../constants');

const NiftyFootballTradingCard = artifacts.require('NiftyFootballTradingCard.sol');
const NiftyFootballTradingCardEliteBlindPack = artifacts.require('NiftyFootballTradingCardEliteBlindPack.sol');
const NiftyFootballTradingCardEliteGenerator = artifacts.require('NiftyFootballTradingCardEliteGenerator.sol');

module.exports = async function (deployer, network, accounts) {
    const accountOne = getAccountOne(accounts, network);

    // Deploy elite generator
    await deployer.deploy(NiftyFootballTradingCardEliteGenerator, {from: accountOne});
    const _eliteGenerator = await NiftyFootballTradingCardEliteGenerator.deployed();

    const _niftyFootballTradingCard = await NiftyFootballTradingCard.deployed();

    // Deploy elite blind pack
    await deployer.deploy(
        NiftyFootballTradingCardEliteBlindPack,
        accountOne,
        '0xacE0a8666953bf9E1fe1Cc91Abf5Db5a1c57DD46', // STAN'S ADDRESS
        _eliteGenerator.address,
        _niftyFootballTradingCard.address,
        {
            from: accountOne
        });

    const _niftyFootballTradingCardEliteBlindPack = await NiftyFootballTradingCardEliteBlindPack.deployed();

    // white blind pack creator
    await _niftyFootballTradingCard.addWhitelisted(_niftyFootballTradingCardEliteBlindPack.address, {from: accountOne});
};
