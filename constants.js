const HDWalletProvider = require('truffle-hdwallet-provider');

const INFURA_KEY = process.env.NIFTY_FOOTBALL_INFURA_KEY;
const mnemonic = process.env.NIFTY_FOOTBALL_MNEMONIC;


function getAccountAddress(accounts, index, network) {
    let addr = accounts[index];
    if (network === 'ropsten' || network === 'rinkeby') {
        addr = new HDWalletProvider(mnemonic, `https://${network}.infura.io/v3/${INFURA_KEY}`, index).getAddress();
    }
    console.log(`Using account [${addr}] for network [${network}]`);
    return addr;
}

module.exports = {
    getAccountOne: (accounts, network) => {
        return getAccountAddress(accounts, 0, network);
    },
    getAccountTwo: (accounts, network) => {
        return getAccountAddress(accounts, 1, network);
    }
};
