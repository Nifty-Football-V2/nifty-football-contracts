const {getAccountOne} = require('../constants');

const NiftyFootballTradingCard = artifacts.require('./NiftyFootballTradingCard.sol');

module.exports = async function (deployer, network, accounts) {
    let tokenbaseuri = "http://localhost:5000/futball-cards/us-central1/api/network/5777/token/";

    // assume all is mainnet network unless specified
    if (network === 'mainnet') {
        tokenbaseuri = "https://niftyfootball.cards/api/network/1/token/";
    } else if (network === 'ropsten') {
        tokenbaseuri = "https://niftyfootball.cards/api/network/3/token/";
    } else if (network === 'rinkeby') {
        tokenbaseuri = "https://niftyfootball.cards/api/network/4/token/";
    }

    await deployer.deploy(NiftyFootballTradingCard, tokenbaseuri, {from: getAccountOne(accounts, network)});
};
