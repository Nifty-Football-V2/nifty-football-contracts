pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IFutballCardsGenerator.sol";

contract FutballCardsGenerator is Ownable, IFutballCardsGenerator {

    uint256 internal randNonce = 0;

    uint256 public constant nameLength = 256;
    uint256 public constant maxAttributeScore = 100;

    uint256[] internal positions = [0, 1, 1, 1, 1, 2, 2, 2, 3, 3];
    uint256[] internal nationalities = [0, 1, 2, 3, 4];
    uint256[] internal kits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    uint256[] internal colours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    uint256[] internal ethnicities = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    function generateCard(address _sender)
    external
    returns (
        uint256 _nationality,
        uint256 _position,
        uint256 _ethnicity,
        uint256 _kit,
        uint256 _colour
    ) {
        bytes32 hash = blockhash(block.number);
        return (
        nationalities[generate(_sender, nationalities.length, hash)],
        positions[generate(_sender, positions.length, hash)],
        ethnicities[generate(_sender, ethnicities.length, hash)],
        kits[generate(_sender, kits.length, hash)],
        colours[generate(_sender, colours.length, hash)]
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
        bytes32 hash = blockhash(block.number);
        return (
        _base + generate(_sender, maxAttributeScore - _base, hash),
        _base + generate(_sender, maxAttributeScore - _base, hash),
        _base + generate(_sender, maxAttributeScore - _base, hash),
        _base + generate(_sender, maxAttributeScore - _base, hash)
        );
    }

    function generateName(address _sender)
    external
    returns (
        uint256 firstName,
        uint256 lastName
    ) {
        bytes32 hash = blockhash(block.number);
        return (
        generate(_sender, nameLength, hash),
        generate(_sender, nameLength, hash)
        );
    }

    function allNationalities() public view returns (uint256[] memory) {
        return nationalities;
    }

    function addNationality(uint256 _new) external onlyOwner returns (bool) {
        nationalities.push(_new);
        return true;
    }

    function clearNationalities() external onlyOwner returns (bool) {
        nationalities.length = 0;
        return true;
    }

    function clearNationalityAtIndex(uint256 _index) external onlyOwner returns (bool) {
        uint lastIndex = nationalities.length - 1;
        require(_index <= lastIndex);

        nationalities[_index] = nationalities[lastIndex];
        nationalities.length--;
    }

    function allPositions() public view returns (uint256[] memory) {
        return positions;
    }

    function addPosition(uint256 _new) external onlyOwner returns (bool) {
        positions.push(_new);
        return true;
    }

    function clearPositions() external onlyOwner returns (bool) {
        positions.length = 0;
        return true;
    }

    function clearPositionAtIndex(uint256 _index) external onlyOwner returns (bool) {
        uint lastIndex = positions.length - 1;
        require(_index <= lastIndex);

        positions[_index] = positions[lastIndex];
        positions.length--;
    }

    function allKits() public view returns (uint256[] memory) {
        return kits;
    }

    function addKit(uint256 _new) external onlyOwner returns (bool) {
        kits.push(_new);
        return true;
    }

    function clearKits() external onlyOwner returns (bool) {
        kits.length = 0;
        return true;
    }

    function clearKitAtIndex(uint256 _index) external onlyOwner returns (bool) {
        uint lastIndex = kits.length - 1;
        require(_index <= lastIndex);

        kits[_index] = kits[lastIndex];
        kits.length--;
    }

    function allColours() public view returns (uint256[] memory) {
        return colours;
    }

    function addColour(uint256 _new) external onlyOwner returns (bool) {
        colours.push(_new);
        return true;
    }

    function clearColours() external onlyOwner returns (bool) {
        colours.length = 0;
        return true;
    }

    function clearColourAtIndex(uint256 _index) external onlyOwner returns (bool) {
        uint lastIndex = colours.length - 1;
        require(_index <= lastIndex);

        colours[_index] = colours[lastIndex];
        colours.length--;
    }

    function allEthnicities() public view returns (uint256[] memory) {
        return ethnicities;
    }

    function addEthnicity(uint256 _new) external onlyOwner returns (bool) {
        ethnicities.push(_new);
        return true;
    }

    function clearEthnicities() external onlyOwner returns (bool) {
        ethnicities.length = 0;
        return true;
    }

    function clearEthnicityAtIndex(uint256 _index) external onlyOwner returns (bool) {
        uint lastIndex = ethnicities.length - 1;
        require(_index <= lastIndex);

        ethnicities[_index] = ethnicities[lastIndex];
        ethnicities.length--;
    }

    function generate(address _sender, uint256 _max, bytes32 _hash) internal returns (uint256) {
        randNonce++;
        bytes memory packed = abi.encodePacked(_hash, _sender, randNonce);
        return uint256(keccak256(packed)) % _max;
    }
}
