pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract FutballCardsGenerator is Ownable {

    uint256 internal randNonce = 0;

    uint256 public nameLength = 100;
    uint256 public maxAttributeScore = 100;

    uint256[] internal nationalities = [0, 1, 2, 3, 4];
    uint256[] internal positions = [0, 1, 1, 1, 1, 2, 2, 2, 3, 3];
    uint256[] internal kits = [0, 0, 0, 0, 1, 1, 1, 2, 2, 3];
    uint256[] internal colours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];


    uint256[][] internal ethnicity = [
        [0, 0, 0, 0, 1, 1, 1, 2, 2, 3],
        [0, 0, 0, 0, 1, 1, 1, 2, 2, 3],
        [0, 0, 0, 0, 1, 1, 1, 2, 2, 3],
        [0, 0, 0, 0, 1, 1, 1, 2, 2, 3],
        [0, 0, 0, 0, 1, 1, 1, 2, 2, 3]
    ];

    function generateCard(address _sender)
    external
    returns (
        uint256 _nationality,
        uint256 _position,
        uint256 _ethnicity,
        uint256 _kit,
        uint256 _colour
    ) {
        uint256 nationalityRandom = nationalities[generate(_sender, nationalities.length)];
        return (
        nationalityRandom,
        positions[generate(_sender, positions.length)],
        ethnicity[nationalityRandom][generate(_sender, ethnicity.length)],
        kits[generate(_sender, kits.length)],
        colours[generate(_sender, colours.length)]
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
        _base + generate(_sender, maxAttributeScore - _base),
        _base + generate(_sender, maxAttributeScore - _base),
        _base + generate(_sender, maxAttributeScore - _base),
        _base + generate(_sender, maxAttributeScore - _base)
        );
    }

    function generateName(address _sender)
    external
    returns (
        uint256 firstName,
        uint256 lastName
    ) {
        return (
        generate(_sender, nameLength),
        generate(_sender, nameLength)
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

//    // FIXME - by nationality mapping?
//    function addEthnicity(uint256 _new) external onlyOwner returns (bool) {
//        ethnicity.push(_new);
//    }

    function generate(address _sender, uint256 _max) internal returns (uint256) {
        randNonce++;
        bytes memory packed = abi.encodePacked(blockhash(block.number), _sender, randNonce);
        return uint256(keccak256(packed)) % _max;
    }
}
