const FutballCardsGenerator = artifacts.require('./FutballCardsGenerator.sol');

module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(FutballCardsGenerator, {from: accounts[0]});
};
