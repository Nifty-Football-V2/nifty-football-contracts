const _ = require('lodash');

const FundsSplitter = artifacts.require('FundsSplitter');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract('FundsSplitter tests', (accounts) => {

    before(async function () {
        this.splitter = await FundsSplitter.new(accounts[0], accounts[1], {from: accounts[0]});
    });

    it('check setup', async function () {
        const rate = await this.splitter.partnerRate();
        rate.should.be.bignumber.equal(new BN(7));

        const platform = await this.splitter.platform();
        const partner = await this.splitter.partner();

        platform.should.be.equal(accounts[0]);
        partner.should.be.equal(accounts[1]);
    });

    context('only owner update partner address', function () {
        it('updates as owner', async function () {
            await this.splitter.updatePartnerAddress(accounts[3], {from: accounts[0]});

            const partner = await this.splitter.partner();
            partner.should.be.equal(accounts[3]);
        });

        it('reverts as not owner', async function () {
            await shouldFail.reverting(this.splitter.updatePartnerAddress(accounts[3], {from: accounts[1]}));
        });
    });

    context('only owner update platform address', function () {
        it('updates as owner', async function () {
            await this.splitter.updatePlatformAddress(accounts[3], {from: accounts[0]});

            const platform = await this.splitter.platform();
            platform.should.be.equal(accounts[3]);
        });

        it('reverts as not owner', async function () {
            await shouldFail.reverting(this.splitter.updatePlatformAddress(accounts[3], {from: accounts[1]}));
        });
    });

    context('only owner update partner rate', function () {
        it('updates as owner', async function () {
            await this.splitter.updatePartnerRate(new BN(50), {from: accounts[0]});

            const rate = await this.splitter.partnerRate();
            rate.should.be.bignumber.equal(new BN(50));
        });

        it('reverts as not owner', async function () {
            await shouldFail.reverting(this.splitter.updatePartnerRate(new BN(50), {from: accounts[1]}));
        });
    });
});
