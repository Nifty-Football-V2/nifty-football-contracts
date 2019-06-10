pragma solidity 0.5.0;

import "../libs/OracleInterface.sol";

//todo: upcoming, past matches
contract MatchOracle is OracleInterface {
    event MatchAdded (
        uint256 indexed id
    );

    event MatchPostponed (
        uint256 indexed id
    );

    event MatchCancelled (
        uint256 indexed id
    );

    event MatchRestored (
        uint256 indexed id
    );

    event MatchOutcome (
        uint256 indexed id,
        Outcome indexed result
    );

    event NewWhitelist (
        address indexed addr
    );

    enum Outcome {UNINITIALISED, HOME_WIN, AWAY_WIN, DRAW}

    enum MatchState {UNINITIALISED, UPCOMING, POSTPONED, CANCELLED, RESULTED}

    struct Match {
        uint256 id;
        uint256 matchStart;
        uint256 matchEnd;
        string description;
        string resultSource;
        uint256 homeGoals;
        uint256 awayGoals;
        MatchState state;
        Outcome result;
    }

    struct BasicMatchInfo {
        uint256 id;
        uint256 matchStart;
        uint256 matchEnd;
        string description;
    }

    uint256[] public matchIds;
    mapping(uint256 => Match) public matchIdToMatchMapping;
    mapping(address => bool) public isWhitelisted;

    ///////////////
    // Modifiers //
    ///////////////

    modifier onlyWhenMatchDoesNotExist(uint256 _matchId) {
        require(!_doesMatchExist(_matchId), "match.service.error.match.exists");
        _;
    }

    modifier onlyWhenTimesValid(uint256 _matchStart, uint256 _matchEnd) {
        require(_matchStart <  _matchEnd, "match.service.error.match.start.is.after.match.end");
        require(now < _matchStart, "match.service.error.past.match.start.time");
        _;
    }

    modifier onlyWhenMatchExists(uint256 _matchId) {
        require(_doesMatchExist(_matchId), "match.service.error.invalid.match.id");
        _;
    }

    modifier onlyWhenOracle() {
        require(isOracle[msg.sender], "match.service.error.not.oracle");
        _;
    }

    modifier onlyWhenMatchUpcoming(uint256 _matchId) {
        _isMatchUpcoming(_matchId);
        _;
    }

    modifier onlyWhenMatchPostponed(uint256 _matchId) {
        require(matchIdToMatchMapping[_matchId].state == MatchState.POSTPONED, "match.service.error.match.not.postponed");
        _;
    }

    modifier onlyWhenResultStateValid(Outcome _resultState) {
        require(_resultState != Outcome.UNINITIALISED, "match.service.error.invalid.match.result.state");
        _;
    }

    modifier onlyWhenResultWindowOpen(uint256 _matchId) {
        require(now >= matchIdToMatchMapping[_matchId].matchEnd, "match.service.error.result.window.not.open");
        _;
    }

    modifier onlyWhenAddressWhitelisted() {
        require(isWhitelisted[msg.sender], "match.service.error.sender.not.whitelisted");
        _;
    }

    ////////////////////////
    // Internal Functions //
    ////////////////////////

    function _doesMatchExist(uint256 _matchId) internal view returns (bool) {
        Match storage aMatch = matchIdToMatchMapping[_matchId];
        return (_matchId > 0 && aMatch.matchStart < aMatch.matchEnd);
    }

    function _isMatchUpcoming(uint256 _matchId) internal view {
        require(matchIdToMatchMapping[_matchId].state == MatchState.UPCOMING, "match.service.error.match.not.upcoming");
    }

    //////////////////////
    // Public Functions //
    //////////////////////

    constructor(address oracle) OracleInterface(oracle) public {}

    function addMatch(uint256 _matchId, uint256 _matchStart, uint256 _matchEnd, string calldata _description, string calldata _resultSource)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchDoesNotExist(_matchId)
    onlyWhenTimesValid(_matchStart, _matchEnd) external {
        matchIdToMatchMapping[_matchId] = Match({
            id: _matchId,
            matchStart: _matchStart,
            matchEnd: _matchEnd,
            description: _description,
            resultSource: _resultSource,
            homeGoals: 0,
            awayGoals: 0,
            state: MatchState.UPCOMING,
            result: Outcome.UNINITIALISED
        });

        matchIds.push(_matchId);

        emit MatchAdded(_matchId);
    }

    //todo: add batch add functionality

    function postponeMatch(uint256 _matchId)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchExists(_matchId)
    onlyWhenMatchUpcoming(_matchId) external {
        matchIdToMatchMapping[_matchId].state = MatchState.POSTPONED;

        emit MatchPostponed(_matchId);
    }

    function cancelMatch(uint256 _matchId)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchExists(_matchId)
    onlyWhenMatchUpcoming(_matchId) external {
        matchIdToMatchMapping[_matchId].state = MatchState.CANCELLED;

        emit MatchCancelled(_matchId);
    }

    function restoreMatch(uint256 _matchId, uint256 _matchStart, uint256 _matchEnd)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchExists(_matchId)
    onlyWhenMatchPostponed(_matchId)
    onlyWhenTimesValid(_matchStart, _matchEnd) external {
        Match storage aMatch = matchIdToMatchMapping[_matchId];
        aMatch.matchStart = _matchStart;
        aMatch.matchEnd = _matchEnd;
        aMatch.result = Outcome.UNINITIALISED;
        aMatch.state = MatchState.UPCOMING;

        emit MatchRestored(_matchId);
    }

    function resultMatch(uint256 _matchId, Outcome _resultState)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchExists(_matchId)
    onlyWhenMatchUpcoming(_matchId)
    onlyWhenResultStateValid(_resultState)
    onlyWhenResultWindowOpen(_matchId) external {
        Match storage aMatch = matchIdToMatchMapping[_matchId];
        aMatch.result = _resultState;
        aMatch.state = MatchState.RESULTED;

        emit MatchOutcome(_matchId, _resultState);
    }

    function matchState(uint256 _matchId) whenNotPaused external view returns (MatchState) {
        return matchIdToMatchMapping[_matchId].state;
    }

    function matchResult(uint256 _matchId) whenNotPaused external view returns (Outcome) {
        return matchIdToMatchMapping[_matchId].result;
    }

    function isBeforeMatchStartTime(uint256 _matchId) whenNotPaused external view returns (bool) {
        return (now <= matchIdToMatchMapping[_matchId].matchStart);
    }

    function getAllMatchIds() whenNotPaused external view returns(uint256[] memory allMatchIds) {
        allMatchIds = new uint256[](matchIds.length);

        for(uint256 i = 0; i < matchIds.length; i++) {
            allMatchIds[i] = matchIds[i];
        }
    }

    function getUpcomingMatchIds() whenNotPaused external view returns(uint256[] memory upcomingMatchIds) {
        uint256 upcomingMatchCount = 0;
        for(uint256 i = 0; i < matchIds.length; i++) {
            if(now < matchIdToMatchMapping[matchIds[i]].matchStart) {
                upcomingMatchCount.add(1);
            }
        }

        upcomingMatchIds = new uint256[](upcomingMatchCount);

        for(uint256 i = 0; i < matchIds.length; i++) {
            if(now < matchIdToMatchMapping[matchIds[i]].matchStart) {
                upcomingMatchIds[i] = matchIds[i];
            }
        }
    }

    function getPastMatchIds() whenNotPaused external view returns(uint256[] memory pastMatchIds) {
        uint256 pastMatchCount = 0;
        for(uint256 i = 0; i < matchIds.length; i++) {
            if(now > matchIdToMatchMapping[matchIds[i]].matchEnd) {
                pastMatchCount.add(1);
            }
        }

        pastMatchIds = new uint256[](pastMatchCount);

        for(uint256 i = 0; i < matchIds.length; i++) {
            if(now > matchIdToMatchMapping[matchIds[i]].matchEnd) {
                pastMatchIds[i] = matchIds[i];
            }
        }
    }

    function whitelist(address addr) whenNotPaused onlyOwner external {
        isWhitelisted[addr] = true;

        emit NewWhitelist(addr);
    }
}