let Migrations = artifacts.require('Migrations');
const {getAccountOne} = require('../constants');

module.exports = function (deployer, network, accounts) {
    deployer.deploy(Migrations, {from: getAccountOne(accounts, network)});
};
