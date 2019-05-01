pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/access/roles/WhitelistedRole.sol";

import "./libs/Strings.sol";
import "./erc721/CustomERC721Full.sol";
import "./INiftyTradingCardCreator.sol";
import "./INiftyTradingCardAttributes.sol";

contract NiftyTradingCard is CustomERC721Full, WhitelistedRole, INiftyTradingCardCreator, INiftyTradingCardAttributes {
    using SafeMath for uint256;

    string public tokenBaseURI = "";
    string public tokenBaseIpfsURI = "https://ipfs.infura.io/ipfs/";

    event TokenBaseURIChanged(
        string _new
    );

    event TokenBaseIPFSURIChanged(
        string _new
    );

    event StaticIpfsTokenURISet(
        uint256 indexed _tokenId,
        string _ipfsHash
    );

    event StaticIpfsTokenURICleared(
        uint256 indexed _tokenId
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

    struct Card {
        uint256 cardType;

        uint256 nationality;
        uint256 position;

        uint256 ethnicity;

        uint256 kit;
        uint256 colour;

        uint256 birth;
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

    struct Extras {
        uint256 badge;
        uint256 sponsor;
        uint256 number;
        uint256 boots;
        uint256 stars;
        uint256 xp;
    }

    modifier onlyWhitelistedOrTokenOwner(uint256 _tokenId){
        require(isWhitelisted(msg.sender) || ownerOf(_tokenId) == msg.sender, "Unable to set token image URI unless owner of whitelisted");
        _;
    }

    uint256 public totalCards = 0;
    uint256 public tokenIdPointer = 1;

    mapping(uint256 => string) public staticIpfsImageLink;
    mapping(uint256 => Card) internal cardMapping;
    mapping(uint256 => Attributes) internal attributesMapping;
    mapping(uint256 => Name) internal namesMapping;
    mapping(uint256 => Extras) internal extrasMapping;

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
            colour : _colour,
            birth: now
        });

        // the magic bit!
        _mint(_to, tokenIdPointer);

        // woo! more cards exist!
        totalCards = totalCards.add(1);

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
        require(_exists(_tokenId), "Token does not exist");

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
        require(_exists(_tokenId), "Token does not exist");

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
        uint256 _colour,
        uint256 _birth
    ) {
        require(_exists(_tokenId), "Token does not exist");
        Card storage tokenCard = cardMapping[_tokenId];
        return (
        tokenCard.cardType,
        tokenCard.nationality,
        tokenCard.position,
        tokenCard.ethnicity,
        tokenCard.kit,
        tokenCard.colour,
        tokenCard.birth
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
        require(_exists(_tokenId), "Token does not exist");
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
        require(_exists(_tokenId), "Token does not exist");
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

    function burn(uint256 _tokenId) onlyWhitelisted public returns (bool) {
        require(_exists(_tokenId), "Token does not exist");

        delete staticIpfsImageLink[_tokenId];
        delete cardMapping[_tokenId];
        delete attributesMapping[_tokenId];
        delete namesMapping[_tokenId];
        delete extrasMapping[_tokenId];

        _burn(ownerOf(_tokenId), _tokenId);

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

        // If we have an override then use it
        if (bytes(staticIpfsImageLink[tokenId]).length > 0) {
            return Strings.strConcat(tokenBaseIpfsURI, staticIpfsImageLink[tokenId]);
        }
        return Strings.strConcat(tokenBaseURI, Strings.uint2str(tokenId));
    }

    function updateTokenBaseURI(string memory _newBaseURI) public onlyWhitelisted returns (bool) {
        require(bytes(_newBaseURI).length != 0, "Base URI invalid");
        tokenBaseURI = _newBaseURI;

        emit TokenBaseURIChanged(_newBaseURI);

        return true;
    }

    function updateTokenBaseIpfsURI(string memory _tokenBaseIpfsURI) public onlyWhitelisted returns (bool) {
        require(bytes(_tokenBaseIpfsURI).length != 0, "Base IPFS URI invalid");
        tokenBaseIpfsURI = _tokenBaseIpfsURI;

        emit TokenBaseIPFSURIChanged(_tokenBaseIpfsURI);

        return true;
    }

    function overrideDynamicImageWithIpfsLink(uint256 _tokenId, string memory _ipfsHash)
    public
    onlyWhitelistedOrTokenOwner(_tokenId)
    returns (bool) {
        require(bytes(_ipfsHash).length != 0, "Base IPFS URI invalid");

        staticIpfsImageLink[_tokenId] = _ipfsHash;

        emit StaticIpfsTokenURISet(_tokenId, _ipfsHash);

        return true;
    }

    function clearIpfsImageUri(uint256 _tokenId)
    public
    onlyWhitelistedOrTokenOwner(_tokenId)
    returns (bool) {
        delete staticIpfsImageLink[_tokenId];

        emit StaticIpfsTokenURICleared(_tokenId);

        return true;
    }
}
