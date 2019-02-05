const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');
const {ZERO_ADDRESS} = constants;

const {shouldBehaveLikeERC721} = require('./ERC721.behavior');
const FutballCards = artifacts.require('FutballCards');

contract('ERC721', function ([_, creator, tokenOwner, anyone, ...accounts]) {
    const baseURI = 'http://futball-cards';

    beforeEach(async function () {
        this.token = await FutballCards.new(baseURI, {from: creator});
    });

    shouldBehaveLikeERC721(creator, creator, accounts);

    describe('internal functions', function () {
        const tokenId = new BN('0');

        describe('_mint(address, uint256)', function () {
            context('with minted token', async function () {
                beforeEach(async function () {
                    ({logs: this.logs} = await this.token.mintCard(1, 1, 1, 1, 1, creator, {from: creator}));
                });

                it('emits a Transfer event', function () {
                    expectEvent.inLogs(this.logs, 'Transfer', {from: ZERO_ADDRESS, to: creator, tokenId});
                });

                it('creates the token', async function () {
                    (await this.token.balanceOf(creator)).should.be.bignumber.equal('1');
                    (await this.token.ownerOf(tokenId)).should.equal(creator);
                });
            });
        });
    });

    describe('_burn(uint256)', function () {

        it('reverts when burning a non-existent token id', async function () {
            await shouldFail.reverting(this.token.methods['burn(uint256)'](999, {from: creator}));
        });

        context('with minted token', function () {
            const tokenId = new BN('0');

            beforeEach(async function () {
                ({logs: this.logs} = await this.token.mintCard(1, 1, 1, 1, 1, anyone, {from: creator}));
            });

            context('with burnt token', function () {
                beforeEach(async function () {
                    ({logs: this.logs} = await this.token.methods['burn(uint256)'](tokenId, {from: anyone}));
                });

                it('emits a Transfer event', function () {
                    expectEvent.inLogs(this.logs, 'Transfer', {from: anyone, to: ZERO_ADDRESS, tokenId});
                });

                it('deletes the token', async function () {
                    (await this.token.balanceOf(creator)).should.be.bignumber.equal('0');
                    await shouldFail.reverting(this.token.ownerOf(tokenId));
                });

                it('reverts when burning a token id that has been deleted', async function () {
                    await shouldFail.reverting(this.token.methods['burn(uint256)'](tokenId));
                });
            });
        });
    });
});
