pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/access/roles/WhitelistedRole.sol";

import "./libs/Strings.sol";
import "./IFootballUnitedCreator.sol";

contract FutballCards is ERC721Full, WhitelistedRole, IFutballCardsCreator {
    using SafeMath for uint256;

    string public tokenBaseURI = "";

    event CardMinted(
        uint256 indexed _tokenId,
        address indexed _to
    );

    uint256 public totalCards = 0;
    uint256 public tokenIdPointer = 0;

    enum CardType {BESPOKE, BLIND, OTHER}

    struct Card {
        CardType cardType;

        uint256 nationality;
        uint256 position;

        uint256 skin;
        uint256 hair;

        uint256 kit;
        uint256 colour;
    }

    struct Attributes {
        uint256 strength;
        uint256 speed;
        uint256 intelligence;
        uint256 skill;
    }

    mapping(uint256 => Card) internal cardMapping;
    mapping(uint256 => Attributes) internal attributesMapping;

    constructor (string memory _tokenBaseURI) public ERC721Full("FootballUnited", "FUTA") {
        super.addWhitelisted(msg.sender);
        tokenBaseURI = _tokenBaseURI;
    }

    function mintCard(
        uint256 _nationality,
        uint256 _position,
        uint256 _skin,
        uint256 _hair,
        uint256 _kit,
        uint256 _colour,
        address _to
    ) public onlyWhitelisted returns (uint256 _tokenId) {

        // create new card
        cardMapping[tokenIdPointer] = Card({
            cardType : CardType.BESPOKE,
            nationality : _nationality,
            position : _position,

            skin : _skin,
            hair : _hair,

            kit : _kit,
            colour : _colour
            });

        // dynamic string URI
        string memory _tokenURI = Strings.strConcat(tokenBaseURI, "/token/", Strings.uint2str(tokenIdPointer));

        // the magic bit!
        _mint(_to, tokenIdPointer);
        _setTokenURI(tokenIdPointer, _tokenURI);

        // woo! more cards exist!
        totalCards = totalCards.add(1);

        emit CardMinted(tokenIdPointer, _to);

        // increment pointer
        tokenIdPointer = tokenIdPointer.add(1);

        return tokenIdPointer;
    }

//    function attributes(uint256 _tokenId) public view returns (
//        uint256 _city,
//        uint256 _base,
//        uint256 _baseExteriorColorway,
//        uint256 _baseWindowColorway,
//        uint256 _body,
//        uint256 _bodyExteriorColorway,
//        uint256 _bodyWindowColorway,
//        uint256 _roof,
//        uint256 _roofExteriorColorway,
//        uint256 _roofWindowColorway,
//        address _architect
//    ) {
//        require(_exists(_tokenId), "Token ID not found");
//        Building storage building = buildings[_tokenId];
//        return (
//        building.city,
//        building.base,
//        building.baseExteriorColorway,
//        building.baseWindowColorway,
//        building.body,
//        building.bodyExteriorColorway,
//        building.bodyWindowColorway,
//        building.roof,
//        building.roofExteriorColorway,
//        building.roofWindowColorway,
//        building.architect
//        );
//    }

    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        return _tokensOfOwner(owner);
    }

    function burn(uint256 _tokenId) public returns (bool) {
        _burn(msg.sender, _tokenId);
        return true;
    }

    function setTokenURI(uint256 _tokenId, string memory _tokenUri) public onlyWhitelisted {
        require(bytes(_tokenUri).length != 0, "URI invalid");
        _setTokenURI(_tokenId, _tokenUri);
    }

    function updateTokenBaseURI(string memory _newBaseURI) public onlyWhitelisted {
        require(bytes(_newBaseURI).length != 0, "Base URI invalid");
        tokenBaseURI = _newBaseURI;
    }
}
