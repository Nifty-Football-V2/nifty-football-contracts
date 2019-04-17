const HDWalletProvider = require('truffle-hdwallet-provider');
const mnemonic = process.env.NIFTY_FOOTBALL_MNEMONIC;

const INFURA_KEY = "8d878f1ce20b4e2fa9eea01668281193";

module.exports = {
    INFURA_KEY: INFURA_KEY,
    getAccountOne: (accounts, network) => {
        let _owner = accounts[0];
        if (network === 'ropsten' || network === 'rinkeby') {
            _owner = new HDWalletProvider(mnemonic, `https://${network}.infura.io/v3/${INFURA_KEY}`, 0).getAddress();
        }
        return _owner;
    }
};
