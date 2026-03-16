// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import { ERC721Votes } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract CourseMedal is ERC721, EIP712, ERC721Votes, ERC721URIStorage, Ownable {
    bytes32 public merkleRoot;
    mapping(address => bool) public hasClaimed;
    // 记录用户拥有的 TokenID，用于查询权重
    mapping(address => uint256) public userTokenId;
    
    uint256 private _nextTokenId;

    // 定义勋章等级
    enum Level { Bronze, Silver, Gold }

    // 记录每个 TokenID 对应的等级
    mapping(uint256 => Level) public tokenLevels;

    event CourseMedalClaimed(address indexed account, uint256 tokenId);
    event CourseMedalBought(address indexed account, uint256 tokenId, Level level);

    constructor() 
        ERC721("Course DAO Medal", "CDM") 
        EIP712("Course DAO Medal", "1")
        Ownable(msg.sender) 
    {}

    // Bronze=1, Silver=2, Gold=5
    function getLevelWeight(Level level) public pure returns (uint256) {
        if (level == Level.Silver) return 2;
        if (level == Level.Gold) return 5;
        return 1;
    }

    // 告诉 Governor 这个人现在有多少票
    function _getVotingUnits(address account) internal view virtual override returns (uint256) {
        if (balanceOf(account) == 0) return 0;
        uint256 tokenId = userTokenId[account];
        return getLevelWeight(tokenLevels[tokenId]);
    }

    // 设置默克尔根
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    // safeMint 方法（供管理员/测试脚本使用）
    // 默认赋予 Level.Bronze 等级
    function safeMint(address to, string memory uri) public onlyOwner {
        require(!hasClaimed[to], "CourseMedal: User already has a medal");
        
        uint256 tokenId = _nextTokenId++;
        hasClaimed[to] = true;
        userTokenId[to] = tokenId;
        tokenLevels[tokenId] = Level.Bronze; // 管理员手动铸造默认给青铜

        _safeMint(to, tokenId);
        // 🌟 新增：设置 Token 的 IPFS URI
        _setTokenURI(tokenId, uri);
        _delegate(to, to); // 自动开启投票权
    }

    // 公开申购函数
    function buyMedal(Level level, string memory uri) external payable {
        uint256 requiredPrice = 0.01 ether;
        if (level == Level.Silver) requiredPrice = 0.02 ether;
        else if (level == Level.Gold) requiredPrice = 0.05 ether;

        require(msg.value >= requiredPrice, "Insufficient payment");
        require(!hasClaimed[msg.sender], "Already has a medal");

        uint256 tokenId = _nextTokenId++;
        
        hasClaimed[msg.sender] = true;
        userTokenId[msg.sender] = tokenId;
        tokenLevels[tokenId] = level;

        _safeMint(msg.sender, tokenId);
        // 设置 Token 的 IPFS URI
        _setTokenURI(tokenId, uri);
        _delegate(msg.sender, msg.sender);

        emit CourseMedalBought(msg.sender, tokenId, level);

        if (msg.value > requiredPrice) {
            payable(msg.sender).transfer(msg.value - requiredPrice);
        }
    }

    // 白名单领取
    function claim(bytes32[] calldata proof, uint256 tokenId, Level level, string memory uri) external {
        require(!hasClaimed[msg.sender], "Already claimed");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, tokenId, level));
        
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid merkle proof");

        hasClaimed[msg.sender] = true;
        userTokenId[msg.sender] = tokenId;
        
        tokenLevels[tokenId] = level;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        _delegate(msg.sender, msg.sender);

        emit CourseMedalClaimed(msg.sender, tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // 重写函数进行覆盖
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Votes)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Votes)
    {
        super._increaseBalance(account, value);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}