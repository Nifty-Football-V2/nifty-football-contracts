const FutballCards = artifacts.require('FutballCards.sol');
const MatchPrediction = artifacts.require('MatchPrediction.sol');
const MatchService = artifacts.require('MatchService.sol');

module.exports = async function (deployer, network, accounts) {

    await deployer.deploy(MatchPrediction, FutballCards.address, MatchService.address, {from: accounts[0]});
};
