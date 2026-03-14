import request from '../utils/request';
import type { GetMedalsResp, MedalDetailRes } from './types';

export const medalABI = [
    {
        "inputs": [{ "internalType": "uint8", "name": "level", "type": "uint8" }],
        "name": "buyMedal",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    // 检查是否有勋章
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "hasClaimed",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    // 查询用户的 TokenID
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "userTokenId",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    // 根据 TokenID 查询等级
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "tokenLevels",
        "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    },
    // 激活投票权 (Delegate)
    {
        "inputs": [{ "internalType": "address", "name": "delegatee", "type": "address" }],
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
    return request.get(`/v1/medals/list/${address}`);
};

/**
 * 获取特定勋章的链上存证详情
 * @param tokenId 勋章编号
 */
export const getMedalDetailByTokenId = (tokenId: number): Promise<MedalDetailRes> => {
    return request.get(`/v1/medals/detail/${tokenId}`);
};
