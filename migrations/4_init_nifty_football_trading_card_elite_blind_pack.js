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
        accounts[0],
        '0x860E21aBcc3b9C10635a65C8a3bc7F1BA692211c', // SWITCH TO STAN CHOW ADDRESS
        _eliteGenerator.address,
        _niftyFootballTradingCard.address,
        {
            from: accountOne
        });

    const _niftyFootballTradingCardEliteBlindPack = await NiftyFootballTradingCardEliteBlindPack.deployed();

    // white blind pack creator
    await _niftyFootballTradingCard.addWhitelisted(_niftyFootballTradingCardEliteBlindPack.address, {from: accountOne});
};
