// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CourseMedal} from "../src/CourseMedal.sol";
import {CourseVault} from "../src/CourseVault.sol";

contract CourseVaultTest is Test {
    CourseMedal medal;
    CourseVault vault;
    
    address student = makeAddr("student");
    address teacher = makeAddr("teacher");

    function setUp() public {
        medal = new CourseMedal();
        vault = new CourseVault(address(medal));
        vm.deal(address(vault), 10 ether);
    }

    receive() external payable {}

    function testGovernanceFlow() public {
        // 激活投票权
        medal.safeMint(student);
        vm.prank(student);
        medal.delegate(student);
        vm.roll(block.number + 1);

        // 发起提案
        vm.prank(student);
        vault.createProposal("Funding", 1 ether, payable(teacher));
        uint256 pid = 0;

        // 模拟多人投票以达到 Quorum (3票)
        _setupMultipleVoters(pid);

        // 执行并验证
        uint256 balBefore = teacher.balance;
        vault.execute(pid);

        // 断言检查
       (,,,,,, bool executed) = vault.getProposal(pid);

        assertTrue(executed, "Proposal should be marked as executed");
        assertEq(teacher.balance, balBefore + 1 ether, "Teacher did not receive funds");
    }

    // 测试多投票的结果
    function _setupMultipleVoters(uint256 pid) internal {
        for(uint160 i = 1; i <= 3; i++) {
            address v = address(i + 1000);
            medal.safeMint(v);
            vm.prank(v);
            medal.delegate(v);
        }
        vm.roll(block.number + 1);
        for(uint160 i = 1; i <= 3; i++) {
            address v = address(i + 1000);
            vm.prank(v);
            vault.vote(pid);
        }
    }
}