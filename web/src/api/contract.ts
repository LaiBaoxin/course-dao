// 本地部署的合约地址
export const CONTRACT_ADDRESS = '0xDB74fc276B744F433507Df2b1547573B9392a986';
export const GOVERNOR_ADDRESS = "0xdb37d21553F57516a1dc9b221741f369EEf26249";

export const MEDAL_ABI = [
    {
        "type": "function",
        "name": "claim",
        "inputs": [
            { "name": "proof", "type": "bytes32[]", "internalType": "bytes32[]" },
            { "name": "tokenId", "type": "uint256", "internalType": "uint256" },
            { "name": "level", "type": "uint8", "internalType": "enum CourseMedal.Level" },
            { "name": "uri", "type": "string", "internalType": "string" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "merkleRoot",
        "inputs": [],
        "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "balanceOf",
        "inputs": [{ "name": "owner", "type": "address", "internalType": "address" }],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "safeMint",
        "inputs": [
            { "name": "to", "type": "address", "internalType": "address" },
            { "name": "uri", "type": "string", "internalType": "string" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    }
] as const;
