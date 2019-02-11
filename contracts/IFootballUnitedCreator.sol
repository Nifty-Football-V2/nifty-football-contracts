pragma solidity 0.5.0;

interface IFutballCardsCreator {
    function mintCard(
        uint256 _cardType,
        uint256 _nationality,
        uint256 _position,
        uint256 _ethnicity,
        uint256 _kit,
        uint256 _colour,
        address _to
    ) external returns (uint256 _tokenId);


    function setAttributes(
        uint256 _tokenId,
        uint256 _strength,
        uint256 _speed,
        uint256 _intelligence,
        uint256 _skill
    ) external returns (bool);

    function setName(
        uint256 _tokenId,
        uint256 _firstName,
        uint256 _lastName
    ) external returns (bool);
}
