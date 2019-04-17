pragma solidity 0.5.0;

import "../libs/OracleInterface.sol";

contract MatchService is OracleInterface {
    enum Outcome {UNINITIALISED, HOME_WIN, AWAY_WIN, DRAW}

    enum MatchState {UNINITIALISED, UPCOMING, POSTPONED, CANCELLED}

    struct Match {
        uint256 id;
        uint256 predictBefore;
        uint256 resultAfter;
        MatchState state;
        Outcome result;
    }

    mapping(uint256 => Match) public matchIdToMatchMapping;

    constructor(address oracle) OracleInterface(oracle) public {

    }
}