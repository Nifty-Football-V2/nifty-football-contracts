
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

// File: contracts/generators/HeadToHeadResulter.sol

pragma solidity ^0.5.0;


contract HeadToHeadResulter is Pausable
{
    event Resulted(uint256 gameId, uint256 result);

    uint256 randNonce = 0;

    // TODO test this properly

    function result(uint256 gameId, address _sender) whenNotPaused public returns (uint256) {
        randNonce++;
        bytes memory packed = abi.encodePacked(blockhash(block.number), _sender, randNonce);
        uint256 outcome = uint256(keccak256(packed)) % 4;
        emit Resulted(gameId, outcome);
        return outcome;
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

// File: contracts/IFutballCardsAttributes.sol

pragma solidity 0.5.0;


contract IFutballCardsAttributes is IERC721 {

    function attributesFlat(uint256 _tokenId) public view returns (
        uint256[5] memory attributes
    );

    function attributesAndName(uint256 _tokenId) public view returns (
        uint256 _strength,
        uint256 _speed,
        uint256 _intelligence,
        uint256 _skill,
        uint256 _special,
        uint256 _firstName,
        uint256 _lastName
    );

    function extras(uint256 _tokenId) public view returns (
        uint256 _badge,
        uint256 _sponsor,
        uint256 _number,
        uint256 _boots,
        uint256 _stars,
        uint256 _xp
    );

    function card(uint256 _tokenId) public view returns (
        uint256 _cardType,
        uint256 _nationality,
        uint256 _position,
        uint256 _ethnicity,
        uint256 _kit,
        uint256 _colour
    );

}

// File: contracts/games/HeadToHead.sol

pragma solidity 0.5.0;






contract HeadToHead is Ownable, Pausable {
    using SafeMath for uint256;

    event GameCreated(
        uint256 indexed gameId,
        address indexed home,
        uint256 indexed homeTokenId
    );

    event Test(
        uint256 indexed home,
        uint256 indexed away,
        uint256 indexed result
    );

    event GameResulted(
        address indexed home,
        address indexed away,
        uint256 indexed gameId,
        uint256 homeValue,
        uint256 awayValue,
        uint256 result
    );

    event GameDraw(
        address indexed home,
        address indexed away,
        uint256 indexed gameId,
        uint256 homeValue,
        uint256 awayValue,
        uint256 result
    );

    event GameClosed(
        uint256 indexed gameId,
        address indexed closer
    );

    enum State {OPEN, HOME_WIN, AWAY_WIN, DRAW, CLOSED}

    struct Game {
        uint256 id;
        uint256 homeTokenId;
        address homeOwner;
        uint256 awayTokenId;
        address awayOwner;
        State state;
    }

    // Start at 1 so we can use Game ID 0 to identify not set
    uint256 public totalGames = 1;

    // Game ID -> Game
    mapping(uint256 => Game) games;

    // Token ID -> Game ID - once resulted or withdraw from game we remove from here
    mapping(uint256 => uint256) tokenToGameMapping;

    // TODO TEST MAPPINGS

    // A list of open game IDS
    uint256[] openGames;

    // A mapping for the list of GameID => Position in open games array
    mapping(uint256 => uint256) gamesIndex;

    IFutballCardsAttributes public nft;
    HeadToHeadResulter public resulter;

    /////////////////
    // Constructor //
    /////////////////

    constructor (HeadToHeadResulter _resulter, IFutballCardsAttributes _nft) public {
        resulter = _resulter;
        nft = _nft;
    }

    ///////////////
    // Modifiers //
    ///////////////

    modifier onlyWhenTokenOwner(uint256 _tokenId) {
        require(nft.ownerOf(_tokenId) == msg.sender, "You cannot enter if you dont own the card");
        _;
    }

    modifier onlyWhenContractIsApproved() {
        require(nft.isApprovedForAll(msg.sender, address(this)), "NFT not approved to play");
        _;
    }

    modifier onlyWhenRealGame(uint256 _gameId) {
        require(games[_gameId].id > 0, "Game not setup");
        _;
    }

    modifier onlyWhenGameOpen(uint256 _gameId) {
        require(games[_gameId].state == State.OPEN, "Game not open");
        _;
    }

    modifier onlyWhenGameDrawn(uint256 _gameId) {
        require(games[_gameId].state == State.DRAW, "Game not in drawn state");
        _;
    }

    modifier onlyWhenGameNotComplete(uint256 _gameId) {
        require(games[_gameId].state == State.DRAW || games[_gameId].state == State.OPEN, "Game not open");
        _;
    }

    modifier onlyWhenTokenNotAlreadyPlaying(uint256 _tokenId) {
        require(tokenToGameMapping[_tokenId] == 0, "Token already playing a game");
        _;
    }

    ///////////////
    // Functions //
    ///////////////

    function createGame(uint256 _tokenId)
    whenNotPaused
    onlyWhenContractIsApproved
    onlyWhenTokenOwner(_tokenId)
    onlyWhenTokenNotAlreadyPlaying(_tokenId)
    public returns (uint256 _gameId) {

        uint256 gameId = totalGames;

        games[totalGames] = Game({
            id : gameId,
            homeTokenId : _tokenId,
            homeOwner : msg.sender,
            awayTokenId : 0,
            awayOwner : address(0),
            state : State.OPEN
            });

        totalGames = totalGames.add(1);

        tokenToGameMapping[_tokenId] = gameId;

        // Keep a track of the game
        gamesIndex[gameId] = openGames.length;
        openGames.push(gameId);

        emit GameCreated(gameId, msg.sender, _tokenId);

        return gameId;
    }

    function resultGame(uint256 _gameId, uint256 _tokenId)
    whenNotPaused
    onlyWhenContractIsApproved
    onlyWhenTokenOwner(_tokenId)
    onlyWhenTokenNotAlreadyPlaying(_tokenId)
    onlyWhenRealGame(_gameId)
    onlyWhenGameOpen(_gameId)
    public returns (bool) {

        uint256[5] memory home = nft.attributesFlat(games[_gameId].homeTokenId);
        uint256[5] memory away = nft.attributesFlat(_tokenId);

        bool homeHasASlimChanceOfWinning = false;
        bool awayHasASlimChanceOfWinning = false;

        // Ensure you can win at least on one attribute
        for (uint i = 0; i < 4; i++) {
            if (home[i] < away[i]) {
                awayHasASlimChanceOfWinning = true;
            } else {
                homeHasASlimChanceOfWinning = true;
            }
        }
        require(homeHasASlimChanceOfWinning && awayHasASlimChanceOfWinning, "There is no chance of winning");

        games[_gameId].awayTokenId = _tokenId;
        games[_gameId].awayOwner = msg.sender;

        // Update mapping
        tokenToGameMapping[_tokenId] = _gameId;

        _resultGame(_gameId);

        return true;
    }

    function reMatch(uint256 _gameId)
    whenNotPaused
    onlyWhenContractIsApproved
    onlyWhenGameDrawn(_gameId)
    public returns (bool) {

        address homeOwner = games[_gameId].homeOwner;
        address awayOwner = games[_gameId].awayOwner;

        // Allow both players or the contract owner to result the game
        require(awayOwner == msg.sender || homeOwner == msg.sender || isOwner(), "Can only re-match when you are playing");

        _resultGame(_gameId);

        return true;
    }

    function withdrawFromGame(uint256 _gameId)
    whenNotPaused
    onlyWhenGameNotComplete(_gameId)
    public returns (bool) {
        require(games[_gameId].homeOwner == msg.sender || games[_gameId].awayOwner == msg.sender || isOwner(), "Cannot close a game you are not part of");

        games[_gameId].state = State.CLOSED;

        _cleanUpGame(_gameId, games[_gameId].homeTokenId, games[_gameId].awayTokenId);

        emit GameClosed(_gameId, msg.sender);

        return true;
    }

    function getGame(uint256 _gameId)
    onlyWhenRealGame(_gameId)
    public view returns (
        uint256 homeTokenId,
        address homeOwner,
        uint256 awayTokenId,
        address awayOwner,
        State state
    ) {
        Game memory game = games[_gameId];
        return (
        game.homeTokenId,
        game.homeOwner,
        game.awayTokenId,
        game.awayOwner,
        game.state
        );
    }

    function _resultGame(uint256 _gameId) internal {
        address homeOwner = games[_gameId].homeOwner;
        uint256 homeTokenId = games[_gameId].homeTokenId;

        address awayOwner = games[_gameId].awayOwner;
        uint256 awayTokenId = games[_gameId].awayTokenId;

        // indexes are zero based
        uint256 result = resulter.result(_gameId, msg.sender).sub(1);

        uint256[5] memory home = nft.attributesFlat(homeTokenId);
        uint256[5] memory away = nft.attributesFlat(awayTokenId);

        emit Test(home[result], away[result], result);

        if (home[result] > away[result]) {
            nft.safeTransferFrom(awayOwner, homeOwner, awayTokenId);
            games[_gameId].state = State.HOME_WIN;

            _cleanUpGame(_gameId, homeTokenId, awayTokenId);

            emit GameResulted(homeOwner, awayOwner, _gameId, home[result], away[result], result);
        }
        else if (home[result] < away[result]) {
            nft.safeTransferFrom(homeOwner, awayOwner, homeTokenId);
            games[_gameId].state = State.AWAY_WIN;

            _cleanUpGame(_gameId, homeTokenId, awayTokenId);

            emit GameResulted(homeOwner, awayOwner, _gameId, home[result], away[result], result);
        }
        else {
            // Allow a re-match if no winner found
            games[_gameId].state = State.DRAW;

            emit GameDraw(homeOwner, awayOwner, _gameId, home[result], away[result], result);
        }
    }

    function _cleanUpGame(uint256 _gameId, uint256 _homeTokenId, uint256 _awayTokenId) internal {

        // Clean up in game mappings
        delete tokenToGameMapping[_homeTokenId];
        delete tokenToGameMapping[_awayTokenId];

        // Delete the game once its finished
        delete openGames[gamesIndex[_gameId]];
    }
}
