pragma solidity 0.5.0;


contract IHeadToHeadEvents {

    // FIXME stream line these events

    event GameCreated(
        uint256 indexed gameId,
        address indexed home,
        uint256 indexed homeTokenId
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
}
