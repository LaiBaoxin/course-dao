export interface MedalInfo {
    tokenId: number;
    txHash: string;
    blockNumber: number;
}

export interface GetMedalsResp {
    medals: MedalInfo[];
}
