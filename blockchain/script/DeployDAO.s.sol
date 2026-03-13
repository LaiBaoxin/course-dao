// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CourseMedal} from "../src/CourseMedal.sol";
import {CourseGovernor} from "../src/CourseGovernor.sol";

contract DeployDAO is Script {
    function run() external {
        vm.startBroadcast();

        CourseMedal medal = new CourseMedal();
        console.log("CourseMedal deployed to:", address(medal));

        CourseGovernor governor = new CourseGovernor(medal);
        console.log("CourseGovernor deployed to:", address(governor));

        // 给新 Governor 初始注入 0.3 ETH 种子基金，用于后续提案执行测试
        payable(address(governor)).transfer(0.3 ether); 

        vm.stopBroadcast();
    }
}