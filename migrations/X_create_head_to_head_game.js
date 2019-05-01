const {getAccountOne} = require('../constants');

const FutballCards = artifacts.require('FutballCards.sol');
const HeadToHead = artifacts.require('HeadToHead.sol');
const HeadToHeadResulter = artifacts.require('HeadToHeadResulter.sol');

module.exports = async function (deployer, network, accounts) {

    const accountOne = getAccountOne(accounts, network);

    await deployer.deploy(HeadToHeadResulter, {from: accountOne});

    const _resulter = await HeadToHeadResulter.deployed();
    const _futballCards = await FutballCards.deployed();

    await deployer.deploy(HeadToHead, _resulter.address, _futballCards.address, {from: accountOne});
};
