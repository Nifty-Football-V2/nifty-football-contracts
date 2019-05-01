const HDWalletProvider = require('truffle-hdwallet-provider');
const mnemonic = process.env.TEST_MNEMONIC || require('./mnemonic');
const INFURA_KEY = process.env.INFURA_KEY || require('./infura_key');

function getAccountAddress(accounts, index, network) {
    let addr = accounts[index];
    if (network === 'ropsten' || network === 'rinkeby') {
        addr = new HDWalletProvider(mnemonic, `https://${network}.infura.io/v3/${INFURA_KEY}`, index).getAddress();
    }
    return addr;
}

module.exports = {
    INFURA_KEY: INFURA_KEY,
    mnemonic: mnemonic,
    getAccountOne: (accounts, network) => {
        return getAccountAddress(accounts, 0, network);
    },
    getAccountTwo: (accounts, network) => {
        return getAccountAddress(accounts, 1, network);
    }
};
