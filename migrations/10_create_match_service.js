const {getAccountOne, getAccountTwo} = require('../constants');
const MatchService = artifacts.require('MatchService');

module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(MatchService, getAccountTwo(accounts, network), {from: getAccountOne(accounts, network)});
};
