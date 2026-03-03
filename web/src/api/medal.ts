import request from '../utils/request';
import type {GetMedalsResp} from './types';

/**
 * 获取指定地址的勋章列表
 * @param address 钱包地址
 */
export const getMedalsByAddress = (address: string): Promise<GetMedalsResp> => {
    return request.get(`/v1/medals/${address}`);
};
