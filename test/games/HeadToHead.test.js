const NiftyFootballTradingCard = artifacts.require('NiftyFootballTradingCard');
const HeadToHead = artifacts.require('HeadToHead');
const MockHeadToHeadResulter = artifacts.require('MockHeadToHeadResulter');

const {BN, constants, expectEvent, shouldFail} = require('openzeppelin-test-helpers');

contract('HeadToHead game tests', ([_, creator, tokenOwner1, tokenOwner2, anyone, ...accounts]) => {
    const baseURI = 'http://futball-cards';
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    const State = {
        UNSET: new BN(0),
        OPEN: new BN(1),
        HOME_WIN: new BN(2),
        AWAY_WIN: new BN(3),
        DRAW: new BN(4),
        CLOSED: new BN(5)
    };

    const _tokenId1 = new BN(1);
    const _tokenId2 = new BN(2);
    const _tokenId3 = new BN(3);

    beforeEach(async function () {
        // Create 721 contract
        this.niftyFootballTradingCard = await NiftyFootballTradingCard.new(baseURI, {from: creator});
        this.resulter = await MockHeadToHeadResulter.new({from: creator});

        this.headToHead = await HeadToHead.new(this.resulter.address, this.niftyFootballTradingCard.address, {from: creator});

        (await this.niftyFootballTradingCard.totalCards()).should.be.bignumber.equal('0');
    });

    context('should be able to play game', async function () {

        beforeEach(async function () {
            await this.niftyFootballTradingCard.mintCard(1, 1, 1, 1, 1, 1, tokenOwner1, {from: creator});
            await this.niftyFootballTradingCard.setAttributes(_tokenId1, 10, 10, 10, 10, {from: creator});

            await this.niftyFootballTradingCard.mintCard(2, 2, 2, 2, 2, 2, tokenOwner2, {from: creator});
            await this.niftyFootballTradingCard.setAttributes(_tokenId2, 5, 10, 20, 20, {from: creator});

            await this.niftyFootballTradingCard.mintCard(3, 3, 3, 3, 3, 3, anyone, {from: creator});
            await this.niftyFootballTradingCard.setAttributes(_tokenId3, 30, 30, 30, 30, {from: creator});

            (await this.niftyFootballTradingCard.totalCards()).should.be.bignumber.equal('3');
        });

        context('validation', async function () {

            context('when paused', async function () {
                beforeEach(async function () {
                    await this.headToHead.pause({from: creator});
                    (await this.headToHead.paused()).should.be.equal(true);
                });
                it('cant create game', async function () {
                    await shouldFail.reverting(this.headToHead.createGame(1, {from: tokenOwner2}));
                });
                it('cant result game', async function () {
                    await shouldFail.reverting(this.headToHead.resultGame(1, _tokenId2, {from: tokenOwner2}));
                });
                it('cant reMatch', async function () {
                    await shouldFail.reverting(this.headToHead.reMatch(1, {from: tokenOwner2}));

                });
                it('cant withdraw', async function () {
                    await shouldFail.reverting(this.headToHead.withdrawFromGame(1, {from: tokenOwner2}));
                });
            });

            context('when contract NOT approved', async function () {

                beforeEach(async function () {
                    await this.niftyFootballTradingCard.setApprovalForAll(this.headToHead.address, false, {from: tokenOwner1});
                    await this.niftyFootballTradingCard.setApprovalForAll(this.headToHead.address, false, {from: tokenOwner2});
                });

                it('cant create game when not approved', async function () {
                    await shouldFail.reverting.withMessage(
                        this.headToHead.createGame(_tokenId2, {from: tokenOwner2}),
                        "Card not approved to sell"
                    );
                });

                it('cant result a game when not approved', async function () {
                    await shouldFail.reverting.withMessage(
                        this.headToHead.resultGame(1, _tokenId1, {from: tokenOwner1}),
                        "Card not approved to sell"
                    );
                });
            });

            context('when contract approved', async function () {

                beforeEach(async function () {
                    await this.niftyFootballTradingCard.setApprovalForAll(this.headToHead.address, true, {from: tokenOwner1});
                    await this.niftyFootballTradingCard.setApprovalForAll(this.headToHead.address, true, {from: tokenOwner2});
                });

                it('cant create game when not the owner', async function () {
                    await shouldFail.reverting.withMessage(
                        this.headToHead.createGame(_tokenId1, {from: tokenOwner2}),
                        "You cannot enter if you dont own the card"
                    );
                });

                it('cant result a game for a token you dont own', async function () {
                    await shouldFail.reverting.withMessage(
                        this.headToHead.resultGame(1, _tokenId2, {from: tokenOwner1}),
                        "You cannot enter if you dont own the card"
                    );
                });

                it('cant result a game which does not exist', async function () {
                    await shouldFail.reverting.withMessage(
                        this.headToHead.resultGame(1, _tokenId2, {from: tokenOwner2}),
                        "Game not setup"
                    );
                });

                it('cant reMatch a game which does not exist', async function () {
                    await shouldFail.reverting.withMessage(
                        this.headToHead.reMatch(1, {from: tokenOwner2}),
                        "Game not in drawn state"
                    );
                });

            });

            context('joining multiple game', async function () {

                beforeEach(async function () {
                    await this.niftyFootballTradingCard.setApprovalForAll(this.headToHead.address, true, {from: tokenOwner1});
                    await this.niftyFootballTradingCard.setApprovalForAll(this.headToHead.address, true, {from: tokenOwner2});
                    await this.niftyFootballTradingCard.setApprovalForAll(this.headToHead.address, true, {from: anyone});
                });

                it('cant create a new game if you are already playing', async function () {
                    await this.headToHead.createGame(_tokenId1, {from: tokenOwner1});
                    await shouldFail.reverting.withMessage(
                        this.headToHead.createGame(_tokenId1, {from: tokenOwner1}),
                        "Token already playing a game"
                    );
                });

                it('cant join an existing game if you are already playing', async function () {
                    await this.headToHead.createGame(_tokenId1, {from: tokenOwner1});

                    await this.headToHead.createGame(_tokenId3, {from: anyone});

                    await shouldFail.reverting.withMessage(
                        this.headToHead.resultGame(new BN(1), _tokenId1, {from: tokenOwner1}),
                        "Token already playing a game"
                    );
                });

            });
        });

        context('playing a game', async function () {

            beforeEach(async function () {
                await this.niftyFootballTradingCard.setApprovalForAll(this.headToHead.address, true, {from: tokenOwner1});
                await this.niftyFootballTradingCard.setApprovalForAll(this.headToHead.address, true, {from: tokenOwner2});
            });

            it('between token 0 (home) and 1 (away) and home wins', async function () {
                const _gameId = new BN(1);

                (await this.niftyFootballTradingCard.ownerOf(_tokenId1)).should.be.equal(tokenOwner1);
                (await this.niftyFootballTradingCard.ownerOf(_tokenId2)).should.be.equal(tokenOwner2);

                const {logs} = await this.headToHead.createGame(_tokenId1, {from: tokenOwner1});
                expectEvent.inLogs(logs,
                    `GameCreated`,
                    {
                        gameId: _gameId,
                        home: tokenOwner1,
                        homeTokenId: _tokenId1
                    }
                );

                const {homeTokenId, homeOwner, awayTokenId, awayOwner, state} = await this.headToHead.getGame(_gameId);
                homeTokenId.should.be.bignumber.equal(_tokenId1);
                homeOwner.should.be.equal(tokenOwner1);
                awayTokenId.should.be.bignumber.equal('0');
                awayOwner.should.be.equal(ZERO_ADDRESS);
                state.should.be.bignumber.equal(State.OPEN);

                // mock result
                const result = new BN(0);
                await this.resulter.setResult(result);

                const {logs: resultLogs} = await this.headToHead.resultGame(_gameId, _tokenId2, {from: tokenOwner2});
                expectEvent.inLogs(resultLogs,
                    `GameResulted`,
                    {
                        home: tokenOwner1,
                        away: tokenOwner2,
                        gameId: _gameId,
                        homeValue: new BN(10),
                        awayValue: new BN(5),
                        result: result
                    }
                );

                // token owner 1 now owns both
                (await this.niftyFootballTradingCard.ownerOf(_tokenId1)).should.be.equal(tokenOwner1);
                (await this.niftyFootballTradingCard.ownerOf(_tokenId2)).should.be.equal(tokenOwner1);

                // Check values on game set correctly
                const {awayTokenId: resultedAwayTokenId, awayOwner: resultedAwayOwner, state: resultedState} = await this.headToHead.getGame(_gameId);
                resultedState.should.be.bignumber.equal(State.HOME_WIN);
                resultedAwayTokenId.should.be.bignumber.equal(_tokenId2);
                resultedAwayOwner.should.be.equal(tokenOwner2);
            });

            it('between token 0 (home) and 1 (away) and away wins', async function () {
                const _gameId = new BN(1);

                (await this.niftyFootballTradingCard.ownerOf(_tokenId1)).should.be.equal(tokenOwner1);
                (await this.niftyFootballTradingCard.ownerOf(_tokenId2)).should.be.equal(tokenOwner2);

                const {logs} = await this.headToHead.createGame(_tokenId1, {from: tokenOwner1});
                expectEvent.inLogs(logs,
                    `GameCreated`,
                    {
                        gameId: _gameId,
                        home: tokenOwner1,
                        homeTokenId: _tokenId1
                    }
                );

                const {homeTokenId, homeOwner, awayTokenId, awayOwner, state} = await this.headToHead.getGame(_gameId);
                homeTokenId.should.be.bignumber.equal(_tokenId1);
                homeOwner.should.be.equal(tokenOwner1);
                awayTokenId.should.be.bignumber.equal('0');
                awayOwner.should.be.equal(ZERO_ADDRESS);
                state.should.be.bignumber.equal(State.OPEN);

                // mock result
                const result = new BN(2);
                await this.resulter.setResult(result);

                const {logs: resultLogs} = await this.headToHead.resultGame(_gameId, _tokenId2, {from: tokenOwner2});
                expectEvent.inLogs(resultLogs,
                    `GameResulted`,
                    {
                        home: tokenOwner1,
                        away: tokenOwner2,
                        gameId: _gameId,
                        homeValue: new BN(10),
                        awayValue: new BN(20),
                        result: result
                    }
                );

                // token owner 1 now owns both
                (await this.niftyFootballTradingCard.ownerOf(_tokenId1)).should.be.equal(tokenOwner2);
                (await this.niftyFootballTradingCard.ownerOf(_tokenId2)).should.be.equal(tokenOwner2);

                // Check values on game set correctly
                const {
                    homeTokenId: resultedHomeTokenId,
                    homeOwner: resultedHomeOwner,
                    awayTokenId: resultedAwayTokenId,
                    awayOwner: resultedAwayOwner,
                    state: resultedState
                } = await this.headToHead.getGame(_gameId);

                resultedState.should.be.bignumber.equal(State.AWAY_WIN);

                resultedHomeTokenId.should.be.bignumber.equal(_tokenId1);
                resultedHomeOwner.should.be.equal(tokenOwner1);

                resultedAwayTokenId.should.be.bignumber.equal(_tokenId2);
                resultedAwayOwner.should.be.equal(tokenOwner2);
            });

            it('between token 0 (home) and 1 (away) and the game is drawn', async function () {
                const _gameId = new BN(1);

                (await this.niftyFootballTradingCard.ownerOf(_tokenId1)).should.be.equal(tokenOwner1);
                (await this.niftyFootballTradingCard.ownerOf(_tokenId2)).should.be.equal(tokenOwner2);

                await this.headToHead.createGame(_tokenId1, {from: tokenOwner1});

                const {homeTokenId, homeOwner, awayTokenId, awayOwner, state} = await this.headToHead.getGame(_gameId);
                homeTokenId.should.be.bignumber.equal(_tokenId1);
                homeOwner.should.be.equal(tokenOwner1);
                awayTokenId.should.be.bignumber.equal('0');
                awayOwner.should.be.equal(ZERO_ADDRESS);
                state.should.be.bignumber.equal(State.OPEN);

                const result = new BN(1);
                await this.resulter.setResult(result);

                const {logs} = await this.headToHead.resultGame(_gameId, _tokenId2, {from: tokenOwner2});
                expectEvent.inLogs(logs,
                    `GameDraw`,
                    {
                        home: tokenOwner1,
                        away: tokenOwner2,
                        gameId: _gameId,
                        homeValue: new BN(10),
                        awayValue: new BN(10),
                        result: result
                    }
                );

                // token owner 1 now owns both
                (await this.niftyFootballTradingCard.ownerOf(_tokenId1)).should.be.equal(tokenOwner1);
                (await this.niftyFootballTradingCard.ownerOf(_tokenId2)).should.be.equal(tokenOwner2);

                // Check values on game set correctly
                const {
                    homeTokenId: resultedHomeTokenId,
                    homeOwner: resultedHomeOwner,
                    awayTokenId: resultedAwayTokenId,
                    awayOwner: resultedAwayOwner,
                    state: resultedState
                } = await this.headToHead.getGame(_gameId);
                resultedState.should.be.bignumber.equal(State.DRAW);

                resultedHomeTokenId.should.be.bignumber.equal(_tokenId1);
                resultedHomeOwner.should.be.equal(tokenOwner1);

                resultedAwayTokenId.should.be.bignumber.equal(_tokenId2);
                resultedAwayOwner.should.be.equal(tokenOwner2);
            });

        });

        context('reMatch a game', async function () {

            beforeEach(async function () {
                await this.niftyFootballTradingCard.setApprovalForAll(this.headToHead.address, true, {from: tokenOwner1});
                await this.niftyFootballTradingCard.setApprovalForAll(this.headToHead.address, true, {from: tokenOwner2});
            });

            it('can rematch when drawn', async function () {
                const _gameId = new BN(1);

                await this.headToHead.createGame(_tokenId1, {from: tokenOwner1});

                await this.resulter.setResult(1);

                // Result game
                await this.headToHead.resultGame(_gameId, _tokenId2, {from: tokenOwner2});
                const {state} = await this.headToHead.getGame(_gameId);
                state.should.be.bignumber.equal(State.DRAW);

                await this.resulter.setResult(2);

                await this.headToHead.reMatch(_gameId, {from: tokenOwner2});

                const {state: wonGame} = await this.headToHead.getGame(_gameId);
                wonGame.should.be.bignumber.equal(State.AWAY_WIN);
            });

        });

        context('withdrawing from a game', async function () {

            beforeEach(async function () {
                await this.niftyFootballTradingCard.setApprovalForAll(this.headToHead.address, true, {from: tokenOwner1});
                await this.niftyFootballTradingCard.setApprovalForAll(this.headToHead.address, true, {from: tokenOwner2});
            });

            it('can withdraw once entered', async function () {
                const _gameId = new BN(1);

                await this.headToHead.createGame(_tokenId1, {from: tokenOwner1});

                const {homeTokenId, homeOwner, awayTokenId, awayOwner, state} = await this.headToHead.getGame(_gameId);
                homeTokenId.should.be.bignumber.equal(_tokenId1);
                homeOwner.should.be.equal(tokenOwner1);
                awayTokenId.should.be.bignumber.equal('0');
                awayOwner.should.be.equal(ZERO_ADDRESS);
                state.should.be.bignumber.equal(State.OPEN);

                await this.headToHead.withdrawFromGame(_gameId, {from: tokenOwner1});

                const {state: updatedState} = await this.headToHead.getGame(_gameId);
                updatedState.should.be.bignumber.equal(State.CLOSED);
            });

            it('can withdraw when drawn', async function () {
                const _gameId = new BN(1);

                await this.headToHead.createGame(_tokenId1, {from: tokenOwner1});

                await this.resulter.setResult(1);

                // Result game
                await this.headToHead.resultGame(_gameId, _tokenId2, {from: tokenOwner2});
                const {state} = await this.headToHead.getGame(_gameId);
                state.should.be.bignumber.equal(State.DRAW);

                // withdraw from game
                await this.headToHead.withdrawFromGame(_gameId, {from: tokenOwner1});
                const {state: updatedState} = await this.headToHead.getGame(_gameId);
                updatedState.should.be.bignumber.equal(State.CLOSED);
            });

            it('cannot withdraw when not owner', async function () {
                const _gameId = new BN(1);

                await this.headToHead.createGame(_tokenId1, {from: tokenOwner1});

                await shouldFail.reverting.withMessage(
                    this.headToHead.withdrawFromGame(_gameId, {from: tokenOwner2}),
                    "Cannot close a game you are not part of"
                );
            });

            it('cannot withdraw when not the winner', async function () {
                const _gameId = new BN(1);

                await this.headToHead.createGame(_tokenId1, {from: tokenOwner1});

                await this.resulter.setResult(3);

                await this.headToHead.resultGame(_gameId, _tokenId2, {from: tokenOwner2});

                const {state} = await this.headToHead.getGame(_gameId);
                state.should.be.bignumber.equal(State.AWAY_WIN);

                await shouldFail.reverting.withMessage(
                    this.headToHead.withdrawFromGame(_gameId, {from: tokenOwner2}),
                    "Game not open"
                );
            });
        });
    });

});
