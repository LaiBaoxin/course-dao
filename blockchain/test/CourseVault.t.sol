// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CourseMedal} from "../src/CourseMedal.sol";
import {CourseVault} from "../src/CourseVault.sol";

contract CourseVaultTest is Test {
    CourseMedal medal;
    CourseVault vault;
    address student = address(100);
    address teacher = address(200);

    function setUp() public {
        medal = new CourseMedal();
        vault = new CourseVault(address(medal));
        vm.deal(address(vault), 10 ether);
    }

    // 让测试合约有收钱的能力
    receive() external payable {}

    function testGovernanceFlow() public {
        // 1. 发放勋章
        medal.safeMint(student);
        vm.roll(block.number + 1); 

        // 2. 发起提案
        vm.prank(teacher);
        vault.createProposal("Buy Servers", 1 ether);
        
        vm.roll(block.number + 1); 

        // 3. 学生投票
        vm.prank(student);
        vault.vote(0);

        // 4. 验证执行: 明确谁来领取这笔钱
        uint256 beforeBalance = teacher.balance;
        vm.prank(teacher); // 老师去执行提案领取资金
        vault.execute(0);

        // 5. 最终断言
        assertEq(address(vault).balance, 9 ether);
        assertEq(teacher.balance, beforeBalance + 1 ether);
    }
}