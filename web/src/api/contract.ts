// 本地部署的合约地址
export const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// mint 的 abi
export const MEDAL_ABI = [
    {
        "inputs": [{ "internalType": "address", "name": "to", "type": "address" }],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;
