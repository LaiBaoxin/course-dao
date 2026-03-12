import request from '../utils/request';
import type { Proposal } from './types';

export const governanceABI = [
    {
        "inputs": [{ "name": "_pid", "type": "uint256" }],
        "name": "vote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_pid", "type": "uint256" }],
        "name": "executeProposal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export interface ListProposalsResp {
    list: Proposal[];
}

// 获取提案列表
export const getProposals = async () => {
    return await request.get<ListProposalsResp>('http://localhost:8889/v1/governance/proposals');
};
