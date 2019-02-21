const FutballCards = artifacts.require('FutballCards.sol');
const MatchPrediction = artifacts.require('MatchPrediction.sol');

module.exports = async function (deployer, network, accounts) {

    await deployer.deploy(MatchPrediction, FutballCards.address, {from: accounts[0]});
};
