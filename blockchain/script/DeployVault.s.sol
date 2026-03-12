// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CourseVault} from "../src/CourseVault.sol";

contract DeployVault is Script {
    // CourseMedal 的测试链地址
    address constant MEDAL_ADDRESS = 0xdD782fB0cf54970F1706c4E8fE5EA1f64d13A524;

    function run() external {
    
        vm.startBroadcast();

        // 部署国库合约
        CourseVault vault = new CourseVault(MEDAL_ADDRESS);
        
        console.log("CourseVault Deployed to:", address(vault));

        vm.stopBroadcast();
    }
}