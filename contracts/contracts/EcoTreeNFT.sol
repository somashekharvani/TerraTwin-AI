// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC165 standard, as defined in the EIP.
 */
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

/**
 * @dev Required interface of an ERC721 compliant contract.
 */
interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed spender, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

contract EcoTreeNFT is IERC721 {
    string public name = "TerraTwin Eco Tree";
    string public symbol = "TTREE";
    address public owner;
    uint256 private _nextTokenId;

    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;

    // Mapping owner address to token count
    mapping(address => uint256) private _balances;

    // Mapping from token ID to approved address
    mapping(uint256 => address) private _tokenApprovals;

    // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // Eco Tree evolution level tracker:
    // 0: Seed, 1: Sprout, 2: Tree, 3: Forest, 4: Wildlife, 5: Ecosystem
    mapping(uint256 => uint8) private _treeLevels;
    mapping(uint256 => uint256) private _carbonSavedKg;

    event TreeEvolved(uint256 indexed tokenId, uint8 newLevel, string stageName);

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == 0x80ac58cd || interfaceId == 0x5b5e139f; // ERC721 and ERC165
    }

    function balanceOf(address ownerAddr) external view override returns (uint256) {
        require(ownerAddr != address(0), "Balance query for zero address");
        return _balances[ownerAddr];
    }

    function ownerOf(uint256 tokenId) external view override returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Owner query for nonexistent token");
        return tokenOwner;
    }

    function getTreeLevel(uint256 tokenId) external view returns (uint8, string memory, uint256) {
        require(_owners[tokenId] != address(0), "Query for nonexistent token");
        uint8 lvl = _treeLevels[tokenId];
        string memory stage = "Seed";
        
        if (lvl == 1) stage = "Sprout";
        else if (lvl == 2) stage = "Tree";
        else if (lvl == 3) stage = "Forest";
        else if (lvl == 4) stage = "Wildlife";
        else if (lvl == 5) stage = "Ecosystem";

        return (lvl, stage, _carbonSavedKg[tokenId]);
    }

    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _owners[tokenId] = to;
        _balances[to] += 1;
        _treeLevels[tokenId] = 0; // Starts as Seed
        _carbonSavedKg[tokenId] = 0;

        emit Transfer(address(0), to, tokenId);
        emit TreeEvolved(tokenId, 0, "Seed");

        return tokenId;
    }

    function evolveTree(uint256 tokenId, uint256 carbonSaved) external onlyOwner {
        require(_owners[tokenId] != address(0), "Evolution query for nonexistent token");
        
        _carbonSavedKg[tokenId] = carbonSaved;
        uint8 newLevel = 0;

        if (carbonSaved < 50) newLevel = 0; // Seed
        else if (carbonSaved < 100) newLevel = 1; // Sprout
        else if (carbonSaved < 250) newLevel = 2; // Tree
        else if (carbonSaved < 500) newLevel = 3; // Forest
        else if (carbonSaved < 1000) newLevel = 4; // Wildlife
        else newLevel = 5; // Ecosystem

        if (_treeLevels[tokenId] != newLevel) {
            _treeLevels[tokenId] = newLevel;
            string memory stage = "Seed";
            if (newLevel == 1) stage = "Sprout";
            else if (newLevel == 2) stage = "Tree";
            else if (newLevel == 3) stage = "Forest";
            else if (newLevel == 4) stage = "Wildlife";
            else if (newLevel == 5) stage = "Ecosystem";

            emit TreeEvolved(tokenId, newLevel, stage);
        }
    }

    function approve(address to, uint256 tokenId) external override {
        address tokenOwner = _owners[tokenId];
        require(msg.sender == tokenOwner || _operatorApprovals[tokenOwner][msg.sender], "Approve caller is not owner nor approved for all");
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view override returns (address) {
        require(_owners[tokenId] != address(0), "Approved query for nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external override {
        require(operator != msg.sender, "ERC721: approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address ownerAddr, address operator) external view override returns (bool) {
        return _operatorApprovals[ownerAddr][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Transfer caller is not owner nor approved");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external override {
        transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata /*data*/) external override {
        transferFrom(from, to, tokenId);
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(_owners[tokenId] == from, "Transfer from incorrect owner");
        require(to != address(0), "Transfer to the zero address");

        _tokenApprovals[tokenId] = address(0);
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Query for nonexistent token");
        return (spender == tokenOwner || _operatorApprovals[tokenOwner][spender] || _tokenApprovals[tokenId] == spender);
    }
}
