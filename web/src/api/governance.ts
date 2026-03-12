// src/api/governance.ts
import request from '../utils/request';
import type { Proposal } from './types';

// 获取提案列表
export const getProposals = async () => {
    return await request.get<{ list: Proposal[] }>('http://localhost:8889/v1/governance/proposals');
};
