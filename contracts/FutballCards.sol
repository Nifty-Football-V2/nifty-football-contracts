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

    event CardAttributesSet(
        uint256 indexed _tokenId,
        uint256 _strength,
        uint256 _speed,
        uint256 _intelligence,
        uint256 _skill
    );

    uint256 public totalCards = 0;
    uint256 public tokenIdPointer = 0;

    struct Card {
        uint256 cardType;

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
        uint256 special;
    }

    struct Experience {
        uint256 points;
        uint256 stars;
    }

    mapping(uint256 => Card) internal cardMapping;
    mapping(uint256 => Attributes) internal attributesMapping;
    mapping(uint256 => Experience) internal experienceMapping;

    constructor (string memory _tokenBaseURI) public ERC721Full("FutballCard", "FUT") {
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
            cardType : 1, // bespoke
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

        // pointer been bumped so return the last token ID
        return tokenIdPointer.sub(1);
    }

    function setAttributes(
        uint256 _tokenId,
        uint256 _strength,
        uint256 _speed,
        uint256 _intelligence,
        uint256 _skill
    ) public onlyWhitelisted returns (bool) {
        require(_exists(_tokenId));

        attributesMapping[_tokenId] = Attributes({
            strength : _strength,
            speed : _speed,
            intelligence : _intelligence,
            skill : _skill,
            special : 0
            });

        emit CardAttributesSet(
            _tokenId,
            _strength,
            _speed,
            _intelligence,
            _skill
        );

        return true;
    }

    function attributes(uint256 _tokenId) public view returns (
        uint256 _strength,
        uint256 _speed,
        uint256 _intelligence,
        uint256 _skill,
        uint256 _special
    ) {
        require(_exists(_tokenId));
        Attributes storage attributes = attributesMapping[_tokenId];
        return (
        attributes.strength,
        attributes.speed,
        attributes.intelligence,
        attributes.skill,
        attributes.special
        );
    }

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
