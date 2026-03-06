// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import { ERC721Votes } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";

/**
 * @title CourseMedal
 * @dev 具备治理功能与 Merkle 空投领取的勋章合约
 */
contract CourseMedal is ERC721, Ownable, EIP712, ERC721Votes {
    bytes32 public merkleRoot;
    mapping(address => bool) public hasClaimed;
    uint256 private _nextTokenId;

    event CourseMedalClaimed(address indexed account, uint256 tokenId);

    constructor() 
        ERC721("Course DAO Medal", "CDM") 
        Ownable(msg.sender) 
        EIP712("CourseMedal", "1") 
    {}

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
            mstore(ptr, caller())         // 写入 32 字节，地址在后 20 字节
            mstore(add(ptr, 32), tokenId) // 在偏移 32 字节处写入 tokenId
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

    // 重写必要的冲突函数
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
}