pragma solidity 0.5.0;

import "../libs/OracleInterface.sol";

//todo: change all of the predict before references to something else to make this contract more generic
contract MatchService is OracleInterface {
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
        uint256 predictBefore;
        uint256 resultAfter;
        MatchState state;
        Outcome result;
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

    modifier onlyWhenTimesValid(uint256 _predictBefore, uint256 _resultAfter) {
        require(_predictBefore <  _resultAfter, "match.service.error.predict.before.is.after.result.after");
        require(now < _predictBefore, "match.service.error.past.prediction.deadline");
        _;
    }

    modifier onlyWhenMatchExists(uint256 _matchId) {
        require(_doesMatchExist(_matchId), "match.service.error.invalid.match.id");
        _;
    }

    modifier onlyWhenOracle() {
        require(oracle == msg.sender, "match.service.error.not.oracle");
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
        require(now >= matchIdToMatchMapping[_matchId].resultAfter, "match.service.error.result.window.not.open");
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
        return (_matchId > 0 && aMatch.predictBefore < aMatch.resultAfter);
    }

    function _isMatchUpcoming(uint256 _matchId) internal view {
        require(matchIdToMatchMapping[_matchId].state == MatchState.UPCOMING, "match.service.error.match.not.upcoming");
    }

    //////////////////////
    // Public Functions //
    //////////////////////

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

    function restoreMatch(uint256 _matchId, uint256 _predictBefore, uint256 _resultAfter)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchExists(_matchId)
    onlyWhenMatchPostponed(_matchId)
    onlyWhenTimesValid(_predictBefore, _resultAfter) external {
        Match storage aMatch = matchIdToMatchMapping[_matchId];
        aMatch.predictBefore = _predictBefore;
        aMatch.resultAfter = _resultAfter;
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

    function matchState(uint256 _matchId)
    whenNotPaused
    onlyWhenAddressWhitelisted external view returns (MatchState) {
        return matchIdToMatchMapping[_matchId].state;
    }

    function matchResult(uint256 _matchId)
    whenNotPaused
    onlyWhenAddressWhitelisted external view returns (Outcome) {
        return matchIdToMatchMapping[_matchId].result;
    }

    function isBeforePredictionDeadline(uint256 _matchId)
    whenNotPaused
    onlyWhenAddressWhitelisted external view returns (bool) {
        return (now <= matchIdToMatchMapping[_matchId].predictBefore);
    }

    function whitelist(address addr)
    whenNotPaused
    onlyOwner external {
        isWhitelisted[addr] = true;

        emit NewWhitelist(addr);
    }
}