// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {CourseMedal} from "../src/CourseMedal.sol";

contract CourseMedalTest is Test {
    CourseMedal public medal;
    address public teacher = address(1);
    address public student = address(2);

    function setUp() public {
        vm.prank(teacher);
        medal = new CourseMedal();
    }

    function testMintAndVotes() public {
        // 老师给学生发勋章
        vm.prank(teacher);
        medal.safeMint(student);

        // 检查勋章余额
        assertEq(medal.balanceOf(student), 1);

        // 检查当前投票权
        assertEq(medal.getVotes(student), 1);
        
        // 测试“历史快照”
        uint256 currentBlock = block.number;
        vm.roll(currentBlock + 1); // 向前推一个区块
        
        assertEq(medal.getPastVotes(student, currentBlock), 1);
        console.log("Student past votes checked!");
    }
}