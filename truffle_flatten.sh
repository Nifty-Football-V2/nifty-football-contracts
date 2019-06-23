#!/usr/bin/env bash

node ./node_modules/.bin/truffle-flattener ./contracts/Migrations.sol > ./contracts-flat/Migrations.sol;

node ./node_modules/.bin/truffle-flattener ./contracts/NiftyFootballTradingCard.sol > ./contracts-flat/NiftyFootballTradingCard.sol;

node ./node_modules/.bin/truffle-flattener ./contracts/NiftyFootballTradingCardBlindPack.sol > ./contracts-flat/NiftyFootballTradingCardBlindPack.sol;
node ./node_modules/.bin/truffle-flattener ./contracts/NiftyFootballTradingCardEliteBlindPack.sol > ./contracts-flat/NiftyFootballTradingEliteCardBlindPack.sol;
node ./node_modules/.bin/truffle-flattener ./contracts/NiftyFootballAdmin.sol > ./contracts-flat/NiftyFootballAdmin.sol;

#node ./node_modules/.bin/truffle-flattener ./contracts/BuyNowMarketplace.sol > ./contracts-flat/BuyNowMarketplace.sol;

#node ./node_modules/.bin/truffle-flattener ./contracts/games/HeadToHead.sol > ./contracts-flat/HeadToHead.sol;

node ./node_modules/.bin/truffle-flattener ./contracts/service/MatchService.sol > ./contracts-flat/MatchService.sol;

node ./node_modules/.bin/truffle-flattener ./contracts/games/MatchPrediction.sol > ./contracts-flat/MatchPrediction.sol;
