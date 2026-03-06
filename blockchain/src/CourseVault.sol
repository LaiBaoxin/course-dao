// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CourseMedal} from "./CourseMedal.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CourseVault is ReentrancyGuard {
    struct Proposal {
        string description;
        uint256 amount;
        uint256 snapshotBlock; 
        uint256 votesFor;
        bool executed;
    }

    CourseMedal public immutable MEDAL; 
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    constructor(address _medalAddress) {
        MEDAL = CourseMedal(_medalAddress); 
    }

    function createProposal(string memory _desc, uint256 _amount) external {
        uint256 pid = proposalCount++;
        proposals[pid] = Proposal({
            description: _desc,
            amount: _amount,
            snapshotBlock: block.number, 
            votesFor: 0,
            executed: false
        });
    }

    function vote(uint256 _pid) external {
        Proposal storage p = proposals[_pid];
        require(!p.executed, "Already executed");
        require(!hasVoted[_pid][msg.sender], "Already voted");

        uint256 weight = MEDAL.getPastVotes(msg.sender, p.snapshotBlock);
        require(weight > 0, "No voting power at snapshot");

        p.votesFor += weight;
        hasVoted[_pid][msg.sender] = true;
    }

    // call 进行交易
    function execute(uint256 _pid) external nonReentrant {
        Proposal storage p = proposals[_pid];
        require(p.votesFor > 0, "Insufficient votes");
        require(!p.executed, "Already executed");

        p.executed = true;

        // 只需要判断是否交易成功
        (bool success, ) = msg.sender.call{value: p.amount}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
}