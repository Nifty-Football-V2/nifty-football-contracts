const {getAccountOne} = require('../constants');
const NiftyFootballTradingCardGenerator = artifacts.require('./NiftyFootballTradingCardGenerator.sol');

module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(NiftyFootballTradingCardGenerator, {from: getAccountOne(accounts, network)});
};
