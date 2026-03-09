// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

/**
 * Course DAO 的链上治理合约
 */
contract CourseGovernor is 
    Governor, 
    GovernorSettings, 
    GovernorCountingSimple, 
    GovernorVotes, 
    GovernorVotesQuorumFraction 
{
    // 传入 CourseMedal (NFT) 合约地址作为“选票”来源
    constructor(IVotes _token)
        Governor("Course DAO Governor")
        GovernorSettings(
            1,   /* initialVotingDelay: 提案发起后，延迟多久可以开始投票 (本地测试设为 1 秒/区块) */
            300, /* initialVotingPeriod: 投票期持续多久 (本地测试设为 300 秒/区块) */
            0    /* initialProposalThreshold: 发起提案需要多少票门槛 (0代表任何有勋章的人都能发提案) */
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(1) /* 法定人数比例：至少需要流通总量的 1% 票数参与，投票才算有效 */
    {}

    // --- 重写函数 (Overrides) ---

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}