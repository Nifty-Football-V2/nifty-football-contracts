#!/usr/bin/env bash

node ./node_modules/.bin/truffle-flattener ./contracts/Migrations.sol > ./contracts-flat/Migrations.sol;

node ./node_modules/.bin/truffle-flattener ./contracts/FutballCards.sol > ./contracts-flat/FutballCards.sol;

node ./node_modules/.bin/truffle-flattener ./contracts/FutballCardsBlindPack.sol > ./contracts-flat/FutballCardsBlindPack.sol;

node ./node_modules/.bin/truffle-flattener ./contracts/BuyNowMarketplace.sol > ./contracts-flat/BuyNowMarketplace.sol;

node ./node_modules/.bin/truffle-flattener ./contracts/games/HeadToHead.sol > ./contracts-flat/HeadToHead.sol;

node ./node_modules/.bin/truffle-flattener ./contracts/service/MatchService.sol > ./contracts-flat/MatchService.sol;

node ./node_modules/.bin/truffle-flattener ./contracts/games/MatchPrediction.sol > ./contracts-flat/MatchPrediction.sol;