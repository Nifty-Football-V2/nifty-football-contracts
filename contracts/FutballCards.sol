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

    event NameSet(
        uint256 indexed _tokenId,
        uint256 _firstName,
        uint256 _lastName
    );

    event ExtrasSet(
        uint256 indexed _tokenId,
        uint256 _badge,
        uint256 _sponsor,
        uint256 _number,
        uint256 _boots
    );


    uint256 public totalCards = 0;
    uint256 public tokenIdPointer = 0;

    struct Card {
        uint256 cardType;

        uint256 nationality;
        uint256 position;

        uint256 ethnicity;

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

    struct Name {
        uint256 firstName;
        uint256 lastName;
    }

    struct Experience {
        uint256 points;
        uint256 stars;
    }

    struct Extras {
        uint256 badge;
        uint256 sponsor;
        uint256 number;
        uint256 boots;
    }

    mapping(uint256 => Card) internal cardMapping;
    mapping(uint256 => Attributes) internal attributesMapping;
    mapping(uint256 => Name) internal namesMapping;
    mapping(uint256 => Experience) internal experienceMapping;
    mapping(uint256 => Extras) internal extrasMapping;

    constructor (string memory _tokenBaseURI) public ERC721Full("FutballCard", "FUT") {
        super.addWhitelisted(msg.sender);
        tokenBaseURI = _tokenBaseURI;
    }

    function mintCard(
        uint256 _cardType,
        uint256 _nationality,
        uint256 _position,
        uint256 _ethnicity,
        uint256 _kit,
        uint256 _colour,
        address _to
    ) public onlyWhitelisted returns (uint256 _tokenId) {

        // create new card
        cardMapping[tokenIdPointer] = Card({
            cardType : _cardType,
            nationality : _nationality,
            position : _position,
            ethnicity : _ethnicity,
            kit : _kit,
            colour : _colour
            });

        // FIXME don't set full URI - only suffix
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

    function setName(
        uint256 _tokenId,
        uint256 _firstName,
        uint256 _lastName
    ) public onlyWhitelisted returns (bool) {
        require(_exists(_tokenId));

        namesMapping[_tokenId] = Name({
            firstName : _firstName,
            lastName : _lastName
            });

        emit NameSet(
            _tokenId,
            _firstName,
            _lastName
        );

        return true;
    }

    function setExtras(
        uint256 _tokenId,
        uint256 _badge,
        uint256 _sponsor,
        uint256 _number,
        uint256 _boots
    ) public onlyWhitelisted returns (bool) {
        require(_exists(_tokenId));

        extrasMapping[_tokenId] = Extras({
            badge : _badge,
            sponsor : _sponsor,
            number : _number,
            boots : _boots
            });

        emit ExtrasSet(
            _tokenId,
            _badge,
            _sponsor,
            _number,
            _boots
        );

        return true;
    }

    function card(uint256 _tokenId) public view returns (
        uint256 _cardType,
        uint256 _nationality,
        uint256 _position,
        uint256 _ethnicity,
        uint256 _kit,
        uint256 _colour
    ) {
        require(_exists(_tokenId));
        Card storage tokenCard = cardMapping[_tokenId];
        return (
        tokenCard.cardType,
        tokenCard.nationality,
        tokenCard.position,
        tokenCard.ethnicity,
        tokenCard.kit,
        tokenCard.colour
        );
    }

    function attributesAndName(uint256 _tokenId) public view returns (
        uint256 _strength,
        uint256 _speed,
        uint256 _intelligence,
        uint256 _skill,
        uint256 _special,
        uint256 _firstName,
        uint256 _lastName
    ) {
        require(_exists(_tokenId));
        Attributes storage tokenAttributes = attributesMapping[_tokenId];
        Name storage tokenName = namesMapping[_tokenId];
        return (
        tokenAttributes.strength,
        tokenAttributes.speed,
        tokenAttributes.intelligence,
        tokenAttributes.skill,
        tokenAttributes.special,
        tokenName.firstName,
        tokenName.lastName
        );
    }

    function extras(uint256 _tokenId) public view returns (
        uint256 _badge,
        uint256 _sponsor,
        uint256 _number,
        uint256 _boots
    ) {
        require(_exists(_tokenId));
        Extras storage tokenExtras = extrasMapping[_tokenId];
        return (
        tokenExtras.badge,
        tokenExtras.sponsor,
        tokenExtras.number,
        tokenExtras.boots
        );
    }

    function experience(uint256 _tokenId) public view returns (
        uint256 _points,
        uint256 _stars
    ) {
        require(_exists(_tokenId));
        Experience storage tokenExperience = experienceMapping[_tokenId];
        return (
        tokenExperience.points,
        tokenExperience.stars
        );
    }

    function attributesFlat(uint256 _tokenId) public view returns (uint256[5] memory) {
        require(_exists(_tokenId));
        Attributes storage tokenAttributes = attributesMapping[_tokenId];
        uint256[5] memory tokenAttributesFlat = [
        tokenAttributes.strength,
        tokenAttributes.speed,
        tokenAttributes.intelligence,
        tokenAttributes.skill,
        tokenAttributes.special
        ];
        return tokenAttributesFlat;
    }

    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        return _tokensOfOwner(owner);
    }

    function burn(uint256 _tokenId) public returns (bool) {
        _burn(msg.sender, _tokenId);

        // **sad face**
        totalCards = totalCards.sub(1);

        return true;
    }

    function setTokenURI(uint256 _tokenId, string memory _tokenUri) public onlyWhitelisted returns (bool) {
        require(bytes(_tokenUri).length != 0, "URI invalid");
        _setTokenURI(_tokenId, _tokenUri);
        return true;
    }

    function updateTokenBaseURI(string memory _newBaseURI) public onlyWhitelisted returns (bool) {
        require(bytes(_newBaseURI).length != 0, "Base URI invalid");
        tokenBaseURI = _newBaseURI;
        return true;
    }
}
