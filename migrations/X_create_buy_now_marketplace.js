const {getAccountOne} = require('../constants');

const FutballCards = artifacts.require('FutballCards.sol');
const BuyNowMarketplace = artifacts.require('BuyNowMarketplace.sol');

module.exports = async function (deployer, network, accounts) {
    const accountOne = getAccountOne(accounts, network);

    const _futballCards = await FutballCards.deployed();

    await deployer.deploy(BuyNowMarketplace, accountOne, _futballCards.address, 3, {from: accountOne});
};
