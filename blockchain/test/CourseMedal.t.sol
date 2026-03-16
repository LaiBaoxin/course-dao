// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol"; 
import { CourseMedal } from "../src/CourseMedal.sol";

contract CourseMedalTest is Test {
    CourseMedal public medal;
    address public teacher = address(1);
    address public student = address(2);
    address public hacker = address(3);

    string constant MOCK_URI = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";

    function setUp() public {
        vm.prank(teacher);
        medal = new CourseMedal();
    }

    function test_MintAndVotes() public {
        vm.prank(teacher);
        medal.safeMint(student, MOCK_URI);
        
        vm.prank(student);
        medal.delegate(student); 

        // 验证权重：默认 Bronze 等级权重为 1
        assertEq(medal.getVotes(student), 1);
        
        // 验证 tokenURI 是否正确存储
        assertEq(medal.tokenURI(0), MOCK_URI);

        uint256 snapshotBlock = block.number;
        vm.roll(snapshotBlock + 1);
        assertEq(medal.getPastVotes(student, snapshotBlock), 1);
    }

    function test_ClaimSuccess() public {
        uint256 tokenId = 888;
        // 合约 assembly 逻辑等同于 abi.encodePacked(address, uint256)
        bytes32 leaf = keccak256(abi.encodePacked(student, tokenId));
        
        vm.prank(teacher);
        medal.setMerkleRoot(leaf);

        bytes32[] memory proof = new bytes32[](0);
        
        vm.prank(student);
        medal.claim(proof, tokenId, MOCK_URI);

        assertEq(medal.balanceOf(student), 1);
        assertTrue(medal.hasClaimed(student));
        // 验证详情
        assertEq(medal.tokenURI(tokenId), MOCK_URI);
    }

    function test_BuyMedal() public {
        // 测试购买黄金勋章 (Level.Gold = 2)
        // 价格为 0.05 ether
        uint256 price = 0.05 ether;
        vm.deal(student, 1 ether); // 给学生打点钱

        vm.prank(student);
        medal.buyMedal{value: price}(CourseMedal.Level.Gold, MOCK_URI);

        // 验证权重：Gold 权重应该是 5
        assertEq(medal.getVotes(student), 5);
        assertEq(medal.balanceOf(student), 1);
    }

    function test_RevertWhen_ClaimTwice() public {
        uint256 tokenId = 999;
        bytes32 leaf = keccak256(abi.encodePacked(student, tokenId));
        
        vm.prank(teacher);
        medal.setMerkleRoot(leaf);

        bytes32[] memory proof = new bytes32[](0);

        vm.prank(student);
        medal.claim(proof, tokenId, MOCK_URI);

        // 预期报错：用户已拥有勋章
        vm.expectRevert("Already claimed");
        vm.prank(student);
        medal.claim(proof, tokenId, MOCK_URI);
    }

    function test_RevertWhen_InvalidProof() public {
        uint256 tokenId = 777;
        bytes32 leaf = keccak256(abi.encodePacked(student, tokenId));
        vm.prank(teacher);
        medal.setMerkleRoot(leaf);

        bytes32[] memory proof = new bytes32[](0);

        // 预期报错：Merkle 校验失败
        vm.expectRevert("Invalid merkle proof"); 
        vm.prank(hacker);
        medal.claim(proof, tokenId, MOCK_URI);
    }
}