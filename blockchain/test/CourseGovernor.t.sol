// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {CourseGovernor} from "../src/CourseGovernor.sol";
import {CourseMedal} from "../src/CourseMedal.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

contract CourseGovernorTest is Test {
    CourseGovernor public governor;
    CourseMedal public medal;

    address public proposer = address(0x1);
    address public voter = address(0x2);
    address public receiver = address(0x3);

    uint256 public constant INITIAL_TREASURY = 10 ether;
    uint256 public constant PROPOSAL_AMOUNT = 1 ether;

    function setUp() public {
        // 部署勋章合约
        medal = new CourseMedal();
        
        // 部署治理合约
        governor = new CourseGovernor(IVotes(address(medal)));

        // 给治理合约注入“国库”资金
        vm.deal(address(governor), INITIAL_TREASURY);
        
        // 给投票者准备点钱并让他买个勋章（获得投票权）
        vm.startPrank(voter);
        vm.deal(voter, 1 ether);
        medal.buyMedal{value: 0.01 ether}();
        vm.stopPrank();

        vm.roll(block.number + 1);
    }

    function test_TreasuryBalance() public view {
        assertEq(governor.getTreasuryBalance(), INITIAL_TREASURY);
    }

    function test_ProposeAndExecuteFlow() public {
        // --- 发起提案 ---
        string memory description = "Grant for developer";
        
        // 构建提案所需的 CallData (模拟转账给 receiver)
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = receiver;
        values[0] = PROPOSAL_AMOUNT;
        calldatas[0] = ""; 

        vm.prank(voter);
        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        console.log("Proposal created with ID:", proposalId);

        // --- 推进时间到投票期 ---
        // votingDelay 是 1 个区块
        vm.roll(block.number + governor.votingDelay() + 1);

        // --- 投票 ---
        vm.prank(voter);
        governor.castVote(proposalId, 1); // 1 代表 For (赞成)

        // --- 推进时间到投票结束 ---
        // votingPeriod 是 300 个区块
        vm.roll(block.number + governor.votingPeriod() + 1);

        // --- 执行提案 ---
        uint256 receiverBalanceBefore = receiver.balance;

        // 执行时需要传入相同的描述，哈希后与 ID 匹配
        bytes32 descriptionHash = keccak256(bytes(description));
        governor.execute(targets, values, calldatas, descriptionHash);

        // --- 验证结果 ---
        assertEq(receiver.balance, receiverBalanceBefore + PROPOSAL_AMOUNT);
        assertEq(governor.getTreasuryBalance(), INITIAL_TREASURY - PROPOSAL_AMOUNT);
        console.log("Proposal executed successfully, receiver got 1 ETH");
    }
}