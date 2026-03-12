export interface MedalInfo {
    tokenId: number;
    txHash: string;
    blockNumber: number;
}

export interface GetMedalsResp {
    medals: MedalInfo[];
}

export interface MedalDetailRes {
    tokenId: number;
    txHash: string;
    blockNumber: number;
    owner: string;
    proof: string[];
}
export interface MedalDetailResp {
    medal: MedalDetailRes;
}

// 定义提案的数据结构
export interface Proposal {
    id: string;
    proposer: string;
    description: string;
    amount: string;
    receiver: string;
    votesFor: string;
    executed: boolean;
}
