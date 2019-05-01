const HDWalletProvider = require('truffle-hdwallet-provider');

function getAccountAddress(accounts, index, network) {
    let addr = accounts[index];
    if (network === 'ropsten' || network === 'rinkeby') {
        addr = new HDWalletProvider(process.env.NIFTY_FOOTBALL_MNEMONIC,
            `https://${network}.infura.io/v3/${process.env.NIFTY_FOOTBALL_INFURA_KEY}`, index).getAddress();
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
