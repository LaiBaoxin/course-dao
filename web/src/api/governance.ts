import request from '../utils/request';
import type { Proposal } from './types';

export const governanceABI = [
    {
        "inputs": [
            { "name": "targets", "type": "address[]" },
            { "name": "values", "type": "uint256[]" },
            { "name": "calldatas", "type": "bytes[]" },
            { "name": "description", "type": "string" }
        ],
        "name": "propose",
        "outputs": [{ "name": "proposalId", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "name": "proposalId", "type": "uint256" },
            { "name": "support", "type": "uint8" }
        ],
        "name": "castVote",
        "outputs": [{ "name": "weight", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "name": "targets", "type": "address[]" },
            { "name": "values", "type": "uint256[]" },
            { "name": "calldatas", "type": "bytes[]" },
            { "name": "descriptionHash", "type": "bytes32" }
        ],
        "name": "execute",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;

export interface ListProposalsResp {
    list: Proposal[];
}

// 获取提案列表
export const getProposals = async (params: { page: number; size: number }) => {
    return request.get('http://localhost:8889/v1/governance/proposals', {params});
};
