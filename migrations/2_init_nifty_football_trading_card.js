const {getAccountOne} = require('../constants');

const NiftyFootballTradingCard = artifacts.require('./NiftyFootballTradingCard.sol');

module.exports = async function (deployer, network, accounts) {
    let tokenbaseuri = "http://localhost:5000/futball-cards/us-central1/api/network/5777";

    // assume all is live network unless specified
    if (network === 'live') {
        tokenbaseuri = "https://niftyfootball.cards/api/network/1";
    } else if (network === 'ropsten') {
        tokenbaseuri = "https://niftyfootball.cards/api/network/3";
    } else if (network === 'rinkeby') {
        tokenbaseuri = "https://niftyfootball.cards/api/network/4";
    }

    await deployer.deploy(NiftyFootballTradingCard, tokenbaseuri, {from: getAccountOne(accounts, network)});
};
