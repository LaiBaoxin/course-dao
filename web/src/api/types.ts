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
