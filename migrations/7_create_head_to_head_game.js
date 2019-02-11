const FutballCards = artifacts.require('FutballCards.sol');
const HeadToHead = artifacts.require('HeadToHead.sol');
const HeadToHeadResulter = artifacts.require('HeadToHeadResulter.sol');

module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(HeadToHeadResulter, {from: accounts[0]});

    const _resulter = await HeadToHeadResulter.deployed();
    const _futballCards = await FutballCards.deployed();

    await deployer.deploy(HeadToHead, _resulter.address, _futballCards.address, {from: accounts[0]});
};
