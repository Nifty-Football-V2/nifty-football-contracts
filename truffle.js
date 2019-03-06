const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraApikey = '6e7a3de11d3745fe8763bab4466ec8de';
const mnemonic = process.env.TEST_MNEMONIC || require('./mnemonic');

// Check gas prices before live deploy - https://ethgasstation.info/

module.exports = {
  mocha: {
    useColors: true,
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
      gasPrice: 10
    }
  },
  compilers: {
    solc: {
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 200      // Default: 200
        },
      }
    }
  },
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      gas: 6721975, // <-- Use this high gas value
      gasPrice: 1000000000,    // <-- Use this low gas price
      network_id: '*', // Match any network id
    },
    ganache: {
      host: '127.0.0.1',
      port: 7545,
      gas: 6721975, // <-- Use this high gas value
      gasPrice: 1000000000,    // <-- Use this low gas price
      network_id: '5777', // Match any network id
    },
    coverage: {
      host: 'localhost',
      port: 7545,
      network_id: "*", // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01      // <-- Use this low gas price
    },
    ropsten: {
      provider: function () {
        return new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${infuraApikey}`);
      },
      network_id: 3,
      gas: 7000000, // default = 4712388
      gasPrice: 4000000000, // default = 100 gwei = 100000000000
      skipDryRun: true
    },
  }
};
