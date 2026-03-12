// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { CourseMedal } from "./CourseMedal.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CourseVault is ReentrancyGuard {
    struct Proposal {
        string description;
        uint256 amount;
        address payable receiver; 
        uint256 snapshotBlock; 
        uint256 votesFor;
        uint256 deadline;
        bool executed;
    }

    CourseMedal public immutable MEDAL; 
    
    uint256 public constant VOTING_PERIOD = 50400; 
    uint256 public constant QUORUM_THRESHOLD = 3; 

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed pid, string desc, uint256 amount, address receiver);
    event Voted(uint256 indexed pid, address voter, uint256 weight);
    event Executed(uint256 indexed pid, address receiver, uint256 amount);

    constructor(address _medalAddress) {
        MEDAL = CourseMedal(_medalAddress); 
    }

    // 创建提案 (限持勋章者)
    function createProposal(string memory _desc, uint256 _amount, address payable _receiver) external {
        require(MEDAL.balanceOf(msg.sender) > 0, "Only holders");
        require(_amount <= address(this).balance, "Insufficient balance");

        uint256 pid = proposalCount++;
        proposals[pid] = Proposal({
            description: _desc,
            amount: _amount,
            receiver: _receiver,
            snapshotBlock: block.number, 
            votesFor: 0,
            deadline: block.number + VOTING_PERIOD,
            executed: false
        });

        emit ProposalCreated(pid, _desc, _amount, _receiver);
    }

    // 投票逻辑
    function vote(uint256 _pid) external {
        Proposal storage p = proposals[_pid];
        require(block.number <= p.deadline, "Ended");
        require(!p.executed, "Executed");
        require(!hasVoted[_pid][msg.sender], "Voted");

        uint256 weight = MEDAL.getPastVotes(msg.sender, p.snapshotBlock);
        require(weight > 0, "No power");

        p.votesFor += weight;
        hasVoted[_pid][msg.sender] = true;

        emit Voted(_pid, msg.sender, weight);
    }

    // 执行提案
    function execute(uint256 _pid) external nonReentrant {
        Proposal storage p = proposals[_pid];
        require(!p.executed, "Executed");
        require(p.votesFor >= QUORUM_THRESHOLD, "No quorum");

        p.executed = true;
        (bool success, ) = p.receiver.call{value: p.amount}("");
        require(success, "Failed");

        emit Executed(_pid, p.receiver, p.amount);
    }

    // 显式查询接口
    function getProposal(uint256 _pid) external view returns (
        string memory description,
        uint256 amount,
        address receiver,
        uint256 snapshotBlock,
        uint256 votesFor,
        uint256 deadline,
        bool executed
    ) {
        Proposal storage p = proposals[_pid];
        return (
            p.description, 
            p.amount, 
            p.receiver, 
            p.snapshotBlock, 
            p.votesFor, 
            p.deadline, 
            p.executed
        );
    }

    function getVaultBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}