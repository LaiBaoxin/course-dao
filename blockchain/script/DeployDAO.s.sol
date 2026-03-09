// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CourseMedal} from "../src/CourseMedal.sol";
import {CourseGovernor} from "../src/CourseGovernor.sol";

contract DeployDAO is Script {
    function run() external {
        // 开始广播交易 (上链)
        vm.startBroadcast();

        // 先部署 NFT 勋章合约
        CourseMedal medal = new CourseMedal();
        console.log("CourseMedal deployed to:", address(medal));

        // 把勋章合约的地址传给 Governor 进行部署
        CourseGovernor governor = new CourseGovernor(medal);
        console.log("CourseGovernor deployed to:", address(governor));

        // 结束广播
        vm.stopBroadcast();
    }
}