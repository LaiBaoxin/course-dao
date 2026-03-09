// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import { ERC721Votes } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title CourseMedal (Restored Version)
 * @dev 已经修复了误以为是 ERC721Votes 导致的 Anvil StackOverflow 问题
 */
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

    // The following functions are overrides required by Solidity.
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
        emit CourseMedalClaimed(msg.sender, tokenId);
    }
}