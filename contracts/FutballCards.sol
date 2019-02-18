pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/access/roles/WhitelistedRole.sol";

import "./libs/Strings.sol";
import "./IFutballCardsCreator.sol";
import "./IFutballCardsAttributes.sol";
import "./erc721/CustomERC721Full.sol";

contract FutballCards is CustomERC721Full, WhitelistedRole, IFutballCardsCreator, IFutballCardsAttributes {
    using SafeMath for uint256;

    string public tokenBaseURI = "";

    event CardMinted(
        uint256 indexed _tokenId,
        address indexed _to
    );

    event TokenBaseURIChanged(
        string _new
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

    event SpecialSet(
        uint256 indexed _tokenId,
        uint256 _value
    );

    event BadgeSet(
        uint256 indexed _tokenId,
        uint256 _value
    );

    event SponsorSet(
        uint256 indexed _tokenId,
        uint256 _value
    );

    event NumberSet(
        uint256 indexed _tokenId,
        uint256 _value
    );

    event BootsSet(
        uint256 indexed _tokenId,
        uint256 _value
    );

    event StarAdded(
        uint256 indexed _tokenId,
        uint256 _value
    );

    event XpAdded(
        uint256 indexed _tokenId,
        uint256 _value
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
        uint256 stars;
        uint256 xp;
    }

    mapping(uint256 => Card) internal cardMapping;
    mapping(uint256 => Attributes) internal attributesMapping;
    mapping(uint256 => Name) internal namesMapping;
    mapping(uint256 => Experience) internal experienceMapping;
    mapping(uint256 => Extras) internal extrasMapping;

    constructor (string memory _tokenBaseURI) public CustomERC721Full("FutballCard", "FUT") {
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

        // the magic bit!
        _mint(_to, tokenIdPointer);

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
        uint256 _boots,
        uint256 _stars,
        uint256 _xp
    ) {
        require(_exists(_tokenId));
        Extras storage tokenExtras = extrasMapping[_tokenId];
        return (
        tokenExtras.badge,
        tokenExtras.sponsor,
        tokenExtras.number,
        tokenExtras.boots,
        tokenExtras.stars,
        tokenExtras.xp
        );
    }

    function attributesFlat(uint256 _tokenId) public view returns (uint256[5] memory) {
        require(_exists(_tokenId), "Token does not exist");
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

    // FIXME think about this - clean out stuff too in this contract
    function burn(uint256 _tokenId) public returns (bool) {
        _burn(msg.sender, _tokenId);

        // **sad face**
        totalCards = totalCards.sub(1);

        return true;
    }

    function setSpecial(uint256 _tokenId, uint256 _newSpecial) public onlyWhitelisted returns (bool) {
        require(_exists(_tokenId), "Token does not exist");

        Attributes storage tokenAttributes = attributesMapping[_tokenId];
        tokenAttributes.special = _newSpecial;

        emit SpecialSet(_tokenId, _newSpecial);

        return true;
    }

    function setBadge(uint256 _tokenId, uint256 _new) public onlyWhitelisted returns (bool) {
        require(_exists(_tokenId), "Token does not exist");

        Extras storage tokenExtras = extrasMapping[_tokenId];
        tokenExtras.badge = _new;

        emit BadgeSet(_tokenId, _new);

        return true;
    }

    function setSponsor(uint256 _tokenId, uint256 _new) public onlyWhitelisted returns (bool) {
        require(_exists(_tokenId), "Token does not exist");

        Extras storage tokenExtras = extrasMapping[_tokenId];
        tokenExtras.sponsor = _new;

        emit SponsorSet(_tokenId, _new);

        return true;
    }

    function setNumber(uint256 _tokenId, uint256 _new) public onlyWhitelisted returns (bool) {
        require(_exists(_tokenId), "Token does not exist");

        Extras storage tokenExtras = extrasMapping[_tokenId];
        tokenExtras.number = _new;

        emit NumberSet(_tokenId, _new);

        return true;
    }

    function setBoots(uint256 _tokenId, uint256 _new) public onlyWhitelisted returns (bool) {
        require(_exists(_tokenId), "Token does not exist");

        Extras storage tokenExtras = extrasMapping[_tokenId];
        tokenExtras.boots = _new;

        emit BootsSet(_tokenId, _new);

        return true;
    }

    function addStar(uint256 _tokenId) public onlyWhitelisted returns (bool) {
        require(_exists(_tokenId), "Token does not exist");

        Extras storage tokenExtras = extrasMapping[_tokenId];
        tokenExtras.stars = tokenExtras.stars.add(1);

        emit StarAdded(_tokenId, tokenExtras.stars);

        return true;
    }

    function addXp(uint256 _tokenId, uint256 _increment) public onlyWhitelisted returns (bool) {
        require(_exists(_tokenId), "Token does not exist");

        Extras storage tokenExtras = extrasMapping[_tokenId];
        tokenExtras.xp = tokenExtras.xp.add(_increment);

        emit XpAdded(_tokenId, tokenExtras.xp);

        return true;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId));
        return Strings.strConcat(tokenBaseURI, Strings.uint2str(tokenId));
    }

    function updateTokenBaseURI(string memory _newBaseURI) public onlyWhitelisted returns (bool) {
        require(bytes(_newBaseURI).length != 0, "Base URI invalid");
        tokenBaseURI = _newBaseURI;

        emit TokenBaseURIChanged(_newBaseURI);

        return true;
    }
}
