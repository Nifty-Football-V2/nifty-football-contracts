const BuyNowMarketplace = artifacts.require('BuyNowMarketplace.sol');
const FutballCards = artifacts.require('FutballCards.sol');

module.exports = async function (deployer, network, accounts) {

    const _buyNowMarketplace = await BuyNowMarketplace.deployed();
    const _futballCards = await FutballCards.deployed();

    await _futballCards.approve(_buyNowMarketplace.address, 4);

    await _buyNowMarketplace.listToken(4, 100, {from: accounts[0]});
};
