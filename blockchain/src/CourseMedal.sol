// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import { ERC721Votes } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract CourseMedal is ERC721, EIP712, ERC721Votes, Ownable {
    bytes32 public merkleRoot;
    mapping(address => bool) public hasClaimed;
    uint256 private _nextTokenId;

    // 申购价格 (0.01 ETH)
    uint256 public constant MINT_PRICE = 0.01 ether;

    event CourseMedalClaimed(address indexed account, uint256 tokenId);
    // 购买事件
    event CourseMedalBought(address indexed account, uint256 tokenId);

    constructor() 
        ERC721("Course DAO Medal", "CDM") 
        EIP712("Course DAO Medal", "1")
        Ownable(msg.sender) 
    {}

    // 公开申购函数
    // 给钱就卖，不查白名单，每人限购一个（通过 hasClaimed 复用逻辑）
    function buyMedal() external payable {
        require(msg.value >= MINT_PRICE, "CourseMedal: Insufficient ETH sent");
        require(!hasClaimed[msg.sender], "CourseMedal: Already has a medal");

        uint256 tokenId = _nextTokenId++;
        
        hasClaimed[msg.sender] = true;
        _safeMint(msg.sender, tokenId);
        
        // 自动为自己委托投票权，用户买完秒变“选民”
        _delegate(msg.sender, msg.sender);

        emit CourseMedalBought(msg.sender, tokenId);

        // 多余的钱退还
        if (msg.value > MINT_PRICE) {
            payable(msg.sender).transfer(msg.value - MINT_PRICE);
        }
    }

    // 所有者提现
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }

    // --- 以下保持你原有的逻辑不变 ---

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

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function claim(bytes32[] calldata proof, uint256 tokenId) external {
        require(!hasClaimed[msg.sender], "CourseMedal: Already claimed");

        bytes32 leaf;
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, caller())         
            mstore(add(ptr, 32), tokenId) 
            leaf := keccak256(add(ptr, 12), 52)
        }
        
        require(
            MerkleProof.verify(proof, merkleRoot, leaf),
            "CourseMedal: Invalid merkle proof"
        );

        hasClaimed[msg.sender] = true;
        _safeMint(msg.sender, tokenId);
        
        // 白名单用户领取后直接有票
        _delegate(msg.sender, msg.sender);

        emit CourseMedalClaimed(msg.sender, tokenId);
    }
}