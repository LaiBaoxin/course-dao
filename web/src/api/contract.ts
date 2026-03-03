// 本地部署的合约地址
export const CONTRACT_ADDRESS = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318';

export const MEDAL_ABI = [
    {
        "type": "function",
        "name": "safeMint",
        "inputs": [{ "name": "to", "type": "address", "internalType": "address" }],
        "outputs": [],
        "stateMutability": "nonpayable"
    }
] as const;
