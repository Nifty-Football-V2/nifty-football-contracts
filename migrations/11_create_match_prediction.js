const NiftyFootballTradingCard = artifacts.require('./NiftyFootballTradingCard.sol');
const MatchPrediction = artifacts.require('MatchPrediction.sol');
const MatchService = artifacts.require('MatchService.sol');

module.exports = async function (deployer, network, accounts) {
    const _niftyFootballTradingCard = await NiftyFootballTradingCard.deployed();
    await deployer.deploy(MatchPrediction, _niftyFootballTradingCard.address, MatchService.address, {from: accounts[0]});
};
