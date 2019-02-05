const FutballCardsBlindPack = artifacts.require('./FutballCardsBlindPack.sol');
const FutballCards = artifacts.require('./FutballCards.sol');

const BaseGenerator = artifacts.require('./BaseGenerator.sol');

module.exports = async function (deployer, network, accounts) {
    const _baseGenerator = await BaseGenerator.deployed();
    const _futballCards = await FutballCards.deployed();

    // Deploy vending machine
    await deployer.deploy(
        FutballCardsBlindPack,
        _baseGenerator.address,
        _futballCards.address,
        {
            from: accounts[0]
        });

    const _futballCardsBlindPack = await FutballCardsBlindPack.deployed();

    // Whitelist vending machine in the core contract
    await _futballCards.addWhitelisted(_futballCardsBlindPack.address, {from: accounts[0]});
};
