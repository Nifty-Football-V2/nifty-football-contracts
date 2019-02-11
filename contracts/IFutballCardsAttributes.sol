pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";

contract IFutballCardsAttrbiutes is IERC721 {

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
        uint256 _boots
    );

    function experience(uint256 _tokenId) public view returns (
        uint256 _points,
        uint256 _stars
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
