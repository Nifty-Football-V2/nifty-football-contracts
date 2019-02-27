const FutballCards = artifacts.require('FutballCards.sol');
const BuyNowMarketplace = artifacts.require('BuyNowMarketplace.sol');

module.exports = async function (deployer, network, accounts) {

    const _futballCards = await FutballCards.deployed();

    await deployer.deploy(BuyNowMarketplace, accounts[0], _futballCards.address, 3, {from: accounts[0]});
};
