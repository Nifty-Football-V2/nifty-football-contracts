const _ = require('lodash');
const Web3 = require('web3');
const program = require('commander');

const HDWalletProvider = require('truffle-hdwallet-provider');

const {abi, contracts} = require('nifty-football-contract-tools');

const {INFURA_KEY} = require('../constants');

const {gas, gasPrice} = {gas: 6721975, gasPrice: '5000000000'};
console.log(`gas=${gas} | gasPrice=${gasPrice}`);

const data = require('./data/launch-credits-2');

function getHttpProviderUri (network) {
    if (network === 'local') {
        return 'HTTP://127.0.0.1:7545';
    }
    return `https://${network}.infura.io/v3/${INFURA_KEY}`;
}

void async function () {
    ////////////////////////
    // START : Setup Args //
    ////////////////////////

    program
        .option('-n, --network <n>', 'Network - either 1,3,4,5777', parseInt)
        .parse(process.argv);

    if (!program.network) {
        console.log(`Please specify --network=1, 3, 4 or 5777`);
        process.exit();
    }

    const networkString = contracts.getNetwork(program.network);
    console.log(`Running on network [${networkString}][${program.network}]`);

    const mnemonic = process.env.NIFTY_FOOTBALL_MNEMONIC;
    if (!mnemonic) {
        throw new Error(`Error missing NIFTY_FOOTBALL_MNEMONIC`);
    }

    //////////////////////
    // END : Setup Args //
    //////////////////////

    const httpProviderUrl = getHttpProviderUri(networkString);

    const provider = new HDWalletProvider(mnemonic, httpProviderUrl, 0);
    const fromAccount = provider.getAddress();

    const web3 = new Web3(provider);

    const failures = [];
    const successes = [];

    let startingNonce = await web3.eth.getTransactionCount(fromAccount);
    console.log(`Using account [${fromAccount}] with starting nonce [${startingNonce}]`);

    const blindPackMetaData = contracts.getNiftyFootballBlindPack(networkString);


    console.log(`on [${program.network}] with [${blindPackMetaData}]`);

    const NiftyFootballTradingCardBlindPackContract = new web3.eth.Contract(
        abi.NiftyFootballTradingCardBlindPackAbi,
        blindPackMetaData.address,
    );

    const creditPromises = _.map(data, ({name, address, credits}) => {

        console.log(`adding credits [${name}] [${address}] to [${credits}]`);

        return new Promise((resolve, reject) => {
            web3.eth
                .sendTransaction({
                    from: fromAccount,
                    to: blindPackMetaData.address,
                    data: NiftyFootballTradingCardBlindPackContract.methods.addCredits(
                        address,
                        credits,
                    ).encodeABI(),
                    gas: gas,
                    gasPrice: gasPrice,
                    nonce: startingNonce
                })
                .once('transactionHash', function (hash) {
                    successes.push(hash);
                    resolve(hash);
                })
                .catch((e) => {
                    failures.push({error: e});
                    reject(e);
                });

            startingNonce++;
        });

    });

    /////////////////////
    // Wait and Output //
    /////////////////////

    const promises = [
        ...creditPromises,
    ];
    console.log(promises);

    await Promise.all(promises)
        .then((rawTransactions) => {

            console.log(`
            Submitted transactions
              - Success [${successes.length}]
              - Failures [${failures.length}]
            `);

            console.log(rawTransactions);

            process.exit();
        })
        .catch((error) => {
            console.log('FAILURE', error);
        });

}();
