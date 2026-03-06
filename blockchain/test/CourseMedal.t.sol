// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol"; 
import { CourseMedal } from "../src/CourseMedal.sol";

contract CourseMedalTest is Test {
    CourseMedal public medal;
    address public teacher = address(1);
    address public student = address(2);
    address public hacker = address(3);

    function setUp() public {
        vm.prank(teacher);
        medal = new CourseMedal();
    }

    function test_MintAndVotes() public {
        vm.prank(teacher);
        medal.safeMint(student);
        
        vm.prank(student);
        medal.delegate(student); 

        assertEq(medal.getVotes(student), 1);
        
        uint256 snapshotBlock = block.number;
        vm.roll(snapshotBlock + 1);
        assertEq(medal.getPastVotes(student, snapshotBlock), 1);
    }

    function test_ClaimSuccess() public {
        uint256 tokenId = 888;
        bytes32 leaf = keccak256(abi.encodePacked(student, tokenId));
        
        vm.prank(teacher);
        medal.setMerkleRoot(leaf);

        bytes32[] memory proof = new bytes32[](0);
        
        vm.prank(student);
        medal.claim(proof, tokenId);

        assertEq(medal.balanceOf(student), 1);
        assertTrue(medal.hasClaimed(student));
    }

    function test_RevertWhen_ClaimTwice() public {
        uint256 tokenId = 999;
        bytes32 leaf = keccak256(abi.encodePacked(student, tokenId));
        
        vm.prank(teacher);
        medal.setMerkleRoot(leaf);

        bytes32[] memory proof = new bytes32[](0);

        vm.prank(student);
        medal.claim(proof, tokenId);

        vm.expectRevert("CourseMedal: Already claimed");
        vm.prank(student);
        medal.claim(proof, tokenId);
    }

    function test_RevertWhen_InvalidProof() public {
        uint256 tokenId = 777;
        bytes32 leaf = keccak256(abi.encodePacked(student, tokenId));
        vm.prank(teacher);
        medal.setMerkleRoot(leaf);

        bytes32[] memory proof = new bytes32[](0);

        // 显式告知 Foundry，下一行代码预期会 Revert
        vm.expectRevert(); 
        vm.prank(hacker);
        medal.claim(proof, tokenId);
    }
}