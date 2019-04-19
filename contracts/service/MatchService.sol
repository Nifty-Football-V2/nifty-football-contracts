pragma solidity 0.5.0;

import "../libs/OracleInterface.sol";

contract MatchService is OracleInterface {
    event MatchAdded (
        uint256 indexed id
    );

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
    uint256[] public matchIds;

    modifier onlyWhenMatchDoesNotExist(uint256 _matchId) {
        require(!_doesMatchExist(_matchId), "match.service.error.match.exists");
        _;
    }

    modifier onlyWhenTimesValid(uint256 _predictBefore, uint256 _resultAfter) {
        require(_predictBefore <  _resultAfter, "match.service.error.predict.before.is.after.result.after");
        require(now < _predictBefore, "match.service.error.past.prediction.deadline");
        _;
    }

    function _doesMatchExist(uint256 _matchId) internal view returns (bool) {
        Match storage aMatch = matchIdToMatchMapping[_matchId];
        return (_matchId > 0 && aMatch.predictBefore < aMatch.resultAfter);
    }

    modifier onlyWhenOracle() {
        require(oracle == msg.sender, "match.service.error.not.oracle");
        _;
    }

    constructor(address oracle) OracleInterface(oracle) public {}

    function addMatch(uint256 _matchId, uint256 _predictBefore, uint256 _resultAfter)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchDoesNotExist(_matchId)
    onlyWhenTimesValid(_predictBefore, _resultAfter) external {
        matchIdToMatchMapping[_matchId] = Match({
            id: _matchId,
            predictBefore: _predictBefore,
            resultAfter: _resultAfter,
            state: MatchState.UPCOMING,
            result: Outcome.UNINITIALISED
            });

        matchIds.push(_matchId);

        emit MatchAdded(_matchId);
    }
}