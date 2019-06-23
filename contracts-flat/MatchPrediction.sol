
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

// File: openzeppelin-solidity/contracts/introspection/IERC165.sol

pragma solidity ^0.5.0;

/**
 * @title IERC165
 * @dev https://github.com/ethereum/EIPs/blob/master/EIPS/eip-165.md
 */
interface IERC165 {
    /**
     * @notice Query if a contract implements an interface
     * @param interfaceId The interface identifier, as specified in ERC-165
     * @dev Interface identification is specified in ERC-165. This function
     * uses less than 30,000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

// File: openzeppelin-solidity/contracts/token/ERC721/IERC721.sol

pragma solidity ^0.5.0;


/**
 * @title ERC721 Non-Fungible Token Standard basic interface
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) public view returns (uint256 balance);
    function ownerOf(uint256 tokenId) public view returns (address owner);

    function approve(address to, uint256 tokenId) public;
    function getApproved(uint256 tokenId) public view returns (address operator);

    function setApprovalForAll(address operator, bool _approved) public;
    function isApprovedForAll(address owner, address operator) public view returns (bool);

    function transferFrom(address from, address to, uint256 tokenId) public;
    function safeTransferFrom(address from, address to, uint256 tokenId) public;

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public;
}

// File: contracts/games/abstract/FutballCardGame.sol

pragma solidity 0.5.0;





contract FutballCardGame is Ownable, Pausable {
    using SafeMath for uint256;

    IERC721 public nft;
    // todo: abstract resulter / oracle to enable creation of update methods

    ///////////////
    // Modifiers //
    ///////////////

    modifier onlyWhenTokenOwner(uint256 _tokenId) {
        require(nft.ownerOf(_tokenId) == msg.sender, "futball.card.game.error.not.nft.owner");
        _;
    }

    modifier onlyWhenContractIsApproved(uint256 _tokenId) {
        require(nft.getApproved(_tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "futball.card.game.error.nft.not.approved");
        _;
    }

    modifier onlyWhenRealGame(uint256 _gameId) {
        require(_isValidGame(_gameId), "futball.card.game.error.invalid.game");
        _;
    }

    modifier onlyWhenGameOpen(uint256 _gameId) {
        require(_isGameOpen(_gameId), "futball.card.game.error.game.closed");
        _;
    }

    modifier onlyWhenGameNotComplete(uint256 _gameId) {
        require(_isGameIncomplete(_gameId), "futball.card.game.error.game.complete");
        _;
    }

    modifier onlyWhenTokenNotAlreadyPlaying(uint256 _tokenId) {
        require(_isTokenNotAlreadyPlaying(_tokenId), "futball.card.game.error.token.playing");
        _;
    }

    /////////////////////////
    // Function Signatures //
    /////////////////////////

    function _isValidGame(uint256 _gameId) internal view returns (bool);
    function _isGameOpen(uint256 _gameId) internal view returns (bool);
    function _isGameIncomplete(uint256 _gameId) internal view returns (bool);
    function _isTokenNotAlreadyPlaying(uint256 _tokenId) internal view returns (bool);

    // todo: Add nft / resulter contract update methods
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

// File: openzeppelin-solidity/contracts/token/ERC721/IERC721Receiver.sol

pragma solidity ^0.5.0;

/**
 * @title ERC721 token receiver interface
 * @dev Interface for any contract that wants to support safeTransfers
 * from ERC721 asset contracts.
 */
contract IERC721Receiver {
    /**
     * @notice Handle the receipt of an NFT
     * @dev The ERC721 smart contract calls this function on the recipient
     * after a `safeTransfer`. This function MUST return the function selector,
     * otherwise the caller will revert the transaction. The selector to be
     * returned can be obtained as `this.onERC721Received.selector`. This
     * function MAY throw to revert and reject the transfer.
     * Note: the ERC721 contract address is always the message sender.
     * @param operator The address which called `safeTransferFrom` function
     * @param from The address which previously owned the token
     * @param tokenId The NFT identifier which is being transferred
     * @param data Additional data with no specified format
     * @return `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
     */
    function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data)
    public returns (bytes4);
}

// File: openzeppelin-solidity/contracts/token/ERC721/ERC721Holder.sol

pragma solidity ^0.5.0;


contract ERC721Holder is IERC721Receiver {
    function onERC721Received(address, address, uint256, bytes memory) public returns (bytes4) {
        return this.onERC721Received.selector;
    }
}

// File: contracts/games/MatchPrediction.sol

pragma solidity ^0.5.0;




contract MatchPrediction is FutballCardGame, ERC721Holder {

    event ContractDeployed (
        address indexed nftAddress,
        address indexed matchServiceAddress
    );

    event GameCreated (
        uint256 indexed gameId,
        address indexed player1,
        uint256 indexed p1TokenId
    );

    event GameFinished (
        uint256 indexed id,
        GameState result
    );

    event GameClosed (
        uint256 indexed id
    );

    event PredictionsReceived (
        uint256 indexed gameId,
        address indexed player1,
        address indexed player2
    );

    enum Outcome {UNINITIALISED, HOME_WIN, AWAY_WIN, DRAW}
    enum GameState {UNINITIALISED, OPEN, PREDICTIONS_RECEIVED, PLAYER_1_WIN, PLAYER_2_WIN, NEITHER_PLAYER_WINS, CLOSED}

    struct Game {
        uint256 id;
        uint256 p1TokenId;
        address p1Address;
        uint256 p2TokenId;
        address p2Address;
        Outcome p1Prediction;
        Outcome p2Prediction;
        GameState state;
        uint256 matchId;
    }

    MatchService public matchService;

    uint256 public totalGamesCreated = 0;

    mapping(uint256 => uint256) public tokenIdToGameIdMapping;
    mapping(uint256 => Game) public gameIdToGameMapping;
    mapping(address => uint256[]) public playerToGameIdsMapping;

    ///////////////
    // Modifiers //
    ///////////////

    modifier onlyWhenMatchUpcoming(uint256 _matchId) {
        _isMatchUpcoming(_matchId);
        _;
    }

    modifier onlyWhenGameMatchUpcoming(uint256 _gameId) {
        _isMatchUpcoming(gameIdToGameMapping[_gameId].matchId);
        _;
    }

    modifier onlyWhenBeforePredictionDeadline(uint256 _matchId) {
        _isBeforePredictionDeadline(_matchId);
        _;
    }

    modifier onlyWhenBeforeGamePredictionDeadline(uint256 _gameId) {
        _isBeforePredictionDeadline(gameIdToGameMapping[_gameId].matchId);
        _;
    }

    modifier onlyWhenGameMatchResultReceived(uint256 _gameId) {
        require(matchService.matchResult(gameIdToGameMapping[_gameId].matchId) != MatchService.Outcome.UNINITIALISED, "match.prediction.validation.error.game.match.result.not.received");
        _;
    }

    modifier onlyWhenPredictionValid(Outcome _prediction) {
        require(_prediction != Outcome.UNINITIALISED, "match.prediction.validation.error.invalid.prediction");
        _;
    }

    modifier onlyWhenPlayer1NotRevokedTransferApproval(uint256 _gameId) {
        Game storage game = gameIdToGameMapping[_gameId];
        require(nft.getApproved(game.p1TokenId) == address(this), "match.prediction.validation.error.p1.revoked.approval");
        _;
    }

    modifier onlyWhenAllPredictionsReceived(uint256 _gameId) {
        require(gameIdToGameMapping[_gameId].state == GameState.PREDICTIONS_RECEIVED, "match.prediction.validation.error.game.predictions.not.received");
        _;
    }

    modifier onlyWhenPlayer1(uint256 _gameId) {
        require(gameIdToGameMapping[_gameId].p1Address == msg.sender, "match.prediction.validation.error.not.player.1");
        _;
    }

    ////////////////////////////////////////
    // Interface and Internal Functions  //
    ///////////////////////////////////////

    function _isValidGame(uint256 _gameId) internal view returns (bool) {
        return gameIdToGameMapping[_gameId].id > 0;
    }

    function _isGameOpen(uint256 _gameId) internal view returns (bool) {
        return _isGameIncomplete(_gameId);
    }

    function _isGameIncomplete(uint256 _gameId) internal view returns (bool) {
        return gameIdToGameMapping[_gameId].state == GameState.OPEN;
    }

    function _isTokenNotAlreadyPlaying(uint256 _tokenId) internal view returns (bool) {
        return tokenIdToGameIdMapping[_tokenId] == 0;
    }

    function _isMatchUpcoming(uint256 _matchId) internal view {
        require(matchService.matchState(_matchId) == MatchService.MatchState.UPCOMING, "match.prediction.validation.error.match.not.upcoming");
    }

    function _isBeforePredictionDeadline(uint256 _matchId) private view {
        require(matchService.isBeforePredictionDeadline(_matchId), "match.prediction.validation.error.past.prediction.deadline");
    }

    function _escrowPlayerCards(Game storage _game) private {
        nft.safeTransferFrom(_game.p1Address, address(this), _game.p1TokenId);
        nft.safeTransferFrom(_game.p2Address, address(this), _game.p2TokenId);
    }

    function _sendWinnerCards(address _winner, uint256 _tokenId1, uint256 _tokenId2) private {
        nft.safeTransferFrom(address(this), _winner, _tokenId1);
        nft.safeTransferFrom(address(this), _winner, _tokenId2);
    }

    function _performWithdrawal(Game storage _game, Outcome _result) private {
        if(_game.p1Prediction == _result) {
            _game.state = GameState.PLAYER_1_WIN;
            _sendWinnerCards(_game.p1Address, _game.p1TokenId, _game.p2TokenId);
        } else if(_game.p2Prediction == _result) {
            _game.state = GameState.PLAYER_2_WIN;
            _sendWinnerCards(_game.p2Address, _game.p1TokenId, _game.p2TokenId);
        } else {
            _game.state = GameState.NEITHER_PLAYER_WINS;
        }
    }

    function _freeUpCardsForFutureGames(uint256 _tokenId1, uint256 _tokenId2) private {
        delete tokenIdToGameIdMapping[_tokenId1];
        delete tokenIdToGameIdMapping[_tokenId2];
    }

    function _performPostGameCleanup(uint256 _gameId) private {
        Game storage game = gameIdToGameMapping[_gameId];
        _freeUpCardsForFutureGames(game.p1TokenId, game.p2TokenId);
    }

    function _convertMatchServiceResult(MatchService.Outcome _result) private pure returns (Outcome) {
        if(_result == MatchService.Outcome.HOME_WIN) {
            return Outcome.HOME_WIN;
        } else if (_result == MatchService.Outcome.AWAY_WIN) {
            return Outcome.AWAY_WIN;
        } else if (_result == MatchService.Outcome.DRAW) {
            return Outcome.DRAW;
        } else {
            return Outcome.UNINITIALISED;
        }
    }

    /////////////////
    // Constructor //
    /////////////////

    constructor (IERC721 _nft, MatchService _matchService) public {
        require(address(_nft) != address(0), "match.prediction.error.nft.contract.address.zero");
        require(address(_nft) != msg.sender, "match.prediction.error.nft.contract.eq.owner");
        require(address(_matchService) != address(0), "match.prediction.error.match.service.address.zero");
        require(address(_matchService) != msg.sender, "match.prediction.error.match.service.address.eq.owner");

        nft = _nft;
        matchService = _matchService;

        emit ContractDeployed(address(nft), address(matchService));
    }

    ///////////////
    // Functions //
    ///////////////

    function makeFirstPrediction(uint256 _matchId, uint256 _tokenId, Outcome _prediction)
    whenNotPaused
    onlyWhenTokenNotAlreadyPlaying(_tokenId)
    onlyWhenMatchUpcoming(_matchId)
    onlyWhenBeforePredictionDeadline(_matchId)
    onlyWhenContractIsApproved(_tokenId)
    onlyWhenTokenOwner(_tokenId)
    onlyWhenPredictionValid(_prediction)
    external returns (uint256) {
        uint256 newGameId = totalGamesCreated.add(1);

        gameIdToGameMapping[newGameId] = Game({
            id: newGameId,
            p1TokenId: _tokenId,
            p1Address: msg.sender,
            p2TokenId: 0,
            p2Address: address(0),
            p1Prediction: _prediction,
            p2Prediction: Outcome.UNINITIALISED,
            state: GameState.OPEN,
            matchId: _matchId
        });

        tokenIdToGameIdMapping[_tokenId] = newGameId;
        playerToGameIdsMapping[msg.sender].push(newGameId);
        totalGamesCreated = newGameId;

        emit GameCreated(newGameId, msg.sender, _tokenId);

        return newGameId;
    }

    function makeSecondPrediction(uint256 _gameId, uint256 _tokenId, Outcome _prediction)
    whenNotPaused
    onlyWhenTokenNotAlreadyPlaying(_tokenId)
    onlyWhenRealGame(_gameId)
    onlyWhenGameMatchUpcoming(_gameId)
    onlyWhenBeforeGamePredictionDeadline(_gameId)
    onlyWhenGameNotComplete(_gameId)
    onlyWhenContractIsApproved(_tokenId)
    onlyWhenTokenOwner(_tokenId)
    onlyWhenPlayer1NotRevokedTransferApproval(_gameId)
    onlyWhenPredictionValid(_prediction) external {
        Game storage game = gameIdToGameMapping[_gameId];
        game.p2TokenId = _tokenId;
        game.p2Address = msg.sender;
        game.p2Prediction = _prediction;

        require(game.p2Prediction != game.p1Prediction, "match.prediction.validation.error.p2.prediction.invalid");

        game.state = GameState.PREDICTIONS_RECEIVED;

        tokenIdToGameIdMapping[_tokenId] = _gameId;
        playerToGameIdsMapping[msg.sender].push(_gameId);

        _escrowPlayerCards(game);

        emit PredictionsReceived(_gameId, game.p1Address, msg.sender);
    }

    function getAllGameIds(address player)
    whenNotPaused external view returns(uint256[] memory) {
        return playerToGameIdsMapping[player];
    }

    function withdraw(uint256 _gameId)
    whenNotPaused
    onlyWhenRealGame(_gameId)
    onlyWhenAllPredictionsReceived(_gameId)
    onlyWhenGameMatchResultReceived(_gameId) external {
        Game storage game = gameIdToGameMapping[_gameId];
        MatchService.Outcome matchResult = matchService.matchResult(game.matchId);

        _performWithdrawal(game, _convertMatchServiceResult(matchResult));
        _performPostGameCleanup(_gameId);

        emit GameFinished(_gameId, game.state);
    }

    function closeGame(uint256 _gameId)
    whenNotPaused
    onlyWhenRealGame(_gameId)
    onlyWhenGameNotComplete(_gameId)
    onlyWhenPlayer1(_gameId) external {
        gameIdToGameMapping[_gameId].state = GameState.CLOSED;

        _performPostGameCleanup(_gameId);

        emit GameClosed(_gameId);
    }
    
}
