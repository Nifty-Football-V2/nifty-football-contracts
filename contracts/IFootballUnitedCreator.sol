pragma solidity 0.5.0;

interface IFutballCardsCreator {
    function mintCard(
        uint256 _nationality,
        uint256 _position,
        uint256 _skin,
        uint256 _hair,
        uint256 _kit,
        uint256 _colour,
        address _to
    ) external returns (uint256 _tokenId);

}
