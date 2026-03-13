import request from '../utils/request';
import type { GetMedalsResp, MedalDetailRes } from './types';

export const medalABI = [
    {
        "inputs": [],
        "name": "buyMedal",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"name": "delegatee", "type": "address"}],
        "name": "delegate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

/**
 * 获取指定地址的勋章列表
 * @param address 钱包地址
 */
export const getMedalsByAddress = (address: string): Promise<GetMedalsResp> => {
    return request.get(`/v1/medals/${address}`);
};

/**
 * 获取特定勋章的链上存证详情
 * @param tokenId 勋章编号
 */
export const getMedalDetailByTokenId = (tokenId: number): Promise<MedalDetailRes> => {
    return request.get(`/v1/medals/detail/${tokenId}`);
};
