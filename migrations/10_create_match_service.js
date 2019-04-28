const MatchService = artifacts.require('MatchService.sol');

module.exports = async function (deployer, network, accounts) {

    await deployer.deploy(MatchService, accounts[3], {from: accounts[0]});
};
