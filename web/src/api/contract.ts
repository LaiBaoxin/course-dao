// 本地部署的合约地址
export const CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

export const MEDAL_ABI = [
    {
        "type": "function",
        "name": "claim",
        "inputs": [
            { "name": "proof", "type": "bytes32[]", "internalType": "bytes32[]" },
            { "name": "tokenId", "type": "uint256", "internalType": "uint256" }
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
        "inputs": [{ "name": "to", "type": "address", "internalType": "address" }],
        "outputs": [],
        "stateMutability": "nonpayable"
    }
] as const;
