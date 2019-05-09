const NiftyFootballTradingCard = artifacts.require('NiftyFootballTradingCard');

const NiftyFootballTradingCardGenerator = artifacts.require('NiftyFootballTradingCardGenerator');
const NiftyFootballAdmin = artifacts.require('NiftyFootballAdmin');

const {BN, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract('NiftyFootballAdmin', ([_, creator, tokenOwner, ...accounts]) => {

    const one = new BN(1);
    const baseURI = 'http://futball-cards';

    beforeEach(async function () {
        // Create 721 contract
        this.niftyFootballTradingCard = await NiftyFootballTradingCard.new(baseURI, {from: creator});

        this.generator = await NiftyFootballTradingCardGenerator.new({from: creator});

        // Create vending machine
        this.admin = await NiftyFootballAdmin.new(
            this.generator.address,
            this.niftyFootballTradingCard.address,
            {from: creator}
        );

        // Add to whitelist
        await this.niftyFootballTradingCard.addWhitelisted(this.admin.address, {from: creator});
        (await this.niftyFootballTradingCard.isWhitelisted(this.admin.address)).should.be.true;
    });

    context('can create cards as owner', function () {

        it('reverts if not owner', async function () {
            await shouldFail.reverting(this.admin.generateAndAssignCard(
                one,
                one,
                one,
                one,
                one,
                one,
                one,
                tokenOwner,
                {from: tokenOwner}
            ));
        });

        it('creates and assigns if owner', async function () {
            const countBefore = await this.niftyFootballTradingCard.tokenIdPointer();

            const {logs} = await this.admin.generateAndAssignCard(
                one,
                one,
                one,
                one,
                one,
                one,
                one,
                tokenOwner,
                {from: creator}
            );

            const countAfter = await this.niftyFootballTradingCard.tokenIdPointer();

            countAfter.should.be.bignumber.equal(countBefore.add(one));
        });
    });
});
