
// File: openzeppelin-solidity/contracts/ownership/Ownable.sol

pragma solidity ^0.5.0;

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor () internal {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    /**
     * @return the address of the owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner());
        _;
    }

    /**
     * @return true if `msg.sender` is the owner of the contract.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }

    /**
     * @dev Allows the current owner to relinquish control of the contract.
     * @notice Renouncing to ownership will leave the contract without an owner.
     * It will not be possible to call the functions with the `onlyOwner`
     * modifier anymore.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0));
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

// File: openzeppelin-solidity/contracts/access/Roles.sol

pragma solidity ^0.5.0;

/**
 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 */
library Roles {
    struct Role {
        mapping (address => bool) bearer;
    }

    /**
     * @dev give an account access to this role
     */
    function add(Role storage role, address account) internal {
        require(account != address(0));
        require(!has(role, account));

        role.bearer[account] = true;
    }

    /**
     * @dev remove an account's access to this role
     */
    function remove(Role storage role, address account) internal {
        require(account != address(0));
        require(has(role, account));

        role.bearer[account] = false;
    }

    /**
     * @dev check if an account has this role
     * @return bool
     */
    function has(Role storage role, address account) internal view returns (bool) {
        require(account != address(0));
        return role.bearer[account];
    }
}

// File: openzeppelin-solidity/contracts/access/roles/PauserRole.sol

pragma solidity ^0.5.0;


contract PauserRole {
    using Roles for Roles.Role;

    event PauserAdded(address indexed account);
    event PauserRemoved(address indexed account);

    Roles.Role private _pausers;

    constructor () internal {
        _addPauser(msg.sender);
    }

    modifier onlyPauser() {
        require(isPauser(msg.sender));
        _;
    }

    function isPauser(address account) public view returns (bool) {
        return _pausers.has(account);
    }

    function addPauser(address account) public onlyPauser {
        _addPauser(account);
    }

    function renouncePauser() public {
        _removePauser(msg.sender);
    }

    function _addPauser(address account) internal {
        _pausers.add(account);
        emit PauserAdded(account);
    }

    function _removePauser(address account) internal {
        _pausers.remove(account);
        emit PauserRemoved(account);
    }
}

// File: openzeppelin-solidity/contracts/lifecycle/Pausable.sol

pragma solidity ^0.5.0;


/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 */
contract Pausable is PauserRole {
    event Paused(address account);
    event Unpaused(address account);

    bool private _paused;

    constructor () internal {
        _paused = false;
    }

    /**
     * @return true if the contract is paused, false otherwise.
     */
    function paused() public view returns (bool) {
        return _paused;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(!_paused);
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(_paused);
        _;
    }

    /**
     * @dev called by the owner to pause, triggers stopped state
     */
    function pause() public onlyPauser whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev called by the owner to unpause, returns to normal state
     */
    function unpause() public onlyPauser whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }
}

// File: openzeppelin-solidity/contracts/math/SafeMath.sol

pragma solidity ^0.5.0;

/**
 * @title SafeMath
 * @dev Unsigned math operations with safety checks that revert on error
 */
library SafeMath {
    /**
    * @dev Multiplies two unsigned integers, reverts on overflow.
    */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b);

        return c;
    }

    /**
    * @dev Integer division of two unsigned integers truncating the quotient, reverts on division by zero.
    */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
    * @dev Subtracts two unsigned integers, reverts on overflow (i.e. if subtrahend is greater than minuend).
    */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a);
        uint256 c = a - b;

        return c;
    }

    /**
    * @dev Adds two unsigned integers, reverts on overflow.
    */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a);

        return c;
    }

    /**
    * @dev Divides two unsigned integers and returns the remainder (unsigned integer modulo),
    * reverts when dividing by zero.
    */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0);
        return a % b;
    }
}

// File: contracts/libs/OracleInterface.sol

pragma solidity 0.5.0;




contract OracleInterface is Ownable, Pausable {
    using SafeMath for uint256;

    event OracleUpdated (
        address indexed previous,
        address indexed current
    );

    address public oracle;

    modifier onlyWhenNotAddressZero(address addr) {
        require(addr != address(0), "oracle.interface.error.address.zero");
        _;
    }

    constructor (address _oracle) internal {
        require(_oracle != address(0), "oracle.interface.error.oracle.address.zero");
        require(_oracle != msg.sender, "oracle.interface.error.oracle.address.eq.owner");
        oracle = _oracle;

        emit OracleUpdated(address(0), _oracle);
    }

    function updateOracle(address _newOracle)
    whenNotPaused
    onlyOwner
    onlyWhenNotAddressZero(_newOracle) external {
        address previous = oracle;
        oracle = _newOracle;

        emit OracleUpdated(previous, oracle);
    }
}

// File: contracts/service/MatchService.sol

pragma solidity 0.5.0;


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

    enum MatchState {UNINITIALISED, UPCOMING, POSTPONED, CANCELLED}

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

    function matchResult(uint256 _matchId, Outcome _resultState)
    whenNotPaused
    onlyWhenOracle
    onlyWhenMatchExists(_matchId)
    onlyWhenMatchUpcoming(_matchId)
    onlyWhenResultStateValid(_resultState)
    onlyWhenResultWindowOpen(_matchId) external {
        matchIdToMatchMapping[_matchId].result = _resultState;

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
