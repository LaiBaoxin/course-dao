import request from '../utils/request'; // 假设这是你封装的 axios

export interface NonceResp {
    nonce: string;
}

export interface LoginReq {
    address: string;
    message: string;
    signature: string;
}

export interface LoginResp {
    token: string;
}

// 获取登录随机数
export const getNonce = (address: string) => {
    return request.post<any, NonceResp>('/v1/auth/nonce', { address });
};

// 提交签名进行登录
export const login = (data: LoginReq) => {
    return request.post<any, LoginResp>('/v1/auth/login', data);
};
