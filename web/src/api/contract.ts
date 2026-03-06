// 本地部署的合约地址
export const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export const MEDAL_ABI = [
    {
        "type": "function",
        "name": "safeMint",
        "inputs": [{ "name": "to", "type": "address", "internalType": "address" }],
        "outputs": [],
        "stateMutability": "nonpayable"
    }
] as const;
