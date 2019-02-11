pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract FutballCardsGenerator is Ownable {

    event CardGenerated(
        uint256 _nationality,
        uint256 _position,
        uint256 _ethnicity,
        uint256 _kit,
        uint256 _colour
    );

    uint256 internal randNonce = 0;

    uint256[] nationalities = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    uint256[] positions = [0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3];
    uint256[] kits = [0, 0, 0, 0, 1, 1, 1, 2, 2, 3];
    uint256[] colours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    function generateCard(address _sender)
    external
    returns (
        uint256 _nationality,
        uint256 _position,
        uint256 _ethnicity,
        uint256 _kit,
        uint256 _colour
    ) {

        uint256 _nationality = nationalities[generate(_sender, nationalities.length)];
        uint256 _position = positions[generate(_sender, positions.length)];

        uint256 _ethnicity = generate(_sender, 10);

        uint256 _kit = kits[generate(_sender, kits.length)];
        uint256 _colour = colours[generate(_sender, colours.length)];

        emit CardGenerated(
            _nationality,
            _position,
            _ethnicity,
            _kit,
            _colour
        );

        return (
        _nationality,
        _position,
        _ethnicity,
        _kit,
        _colour
        );
    }

    function generateAttributes(address _sender, uint256 _base)
    external
    returns (
        uint256 strength,
        uint256 speed,
        uint256 intelligence,
        uint256 skill
    ) {
        return (
        _base + generate(_sender, 100 - _base),
        _base + generate(_sender, 100 - _base),
        _base + generate(_sender, 100 - _base),
        _base + generate(_sender, 100 - _base)
        );
    }

    function generateName(address _sender)
    external
    returns (
        uint256 firstName,
        uint256 lastName
    ) {
        return (
        generate(_sender, 100),
        generate(_sender, 100)
        );
    }

    function generate(address _sender, uint256 _max) internal returns (uint256) {
        randNonce++;
        bytes memory packed = abi.encodePacked(blockhash(block.number), _sender, randNonce);
        return uint256(keccak256(packed)) % _max;
    }
}
