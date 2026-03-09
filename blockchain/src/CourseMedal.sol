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

    event CourseMedalClaimed(address indexed account, uint256 tokenId);

    constructor() 
        ERC721("Course DAO Medal", "CDM") 
        EIP712("Course DAO Medal", "1")
        Ownable(msg.sender) 
    {}

    // 重新实现 ERC721Votes 的相关函数，确保不会调用到导致 StackOverflow 的代码路径
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

    // 铸造函数，允许合约所有者铸造新的 CourseMedal 
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
        emit CourseMedalClaimed(msg.sender, tokenId);
    }
}