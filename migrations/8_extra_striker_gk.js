const {getAccountOne} = require('../constants');

const NiftyFootballTradingCardGenerator = artifacts.require('NiftyFootballTradingCardGenerator.sol');
const NiftyFootballTradingCardEliteGenerator = artifacts.require('NiftyFootballTradingCardEliteGenerator.sol');

module.exports = async function (deployer, network, accounts) {
    const accountOne = getAccountOne(accounts, network);
    
    const _generator = await NiftyFootballTradingCardGenerator.deployed();
    const _eliteGenerator = await NiftyFootballTradingCardEliteGenerator.deployed();

    await _generator.addPosition(3, {from: accountOne}); // ST
    await _eliteGenerator.addPosition(3, {from: accountOne}); // ST
};
