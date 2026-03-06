import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import request from '../utils/request';
import { CONTRACT_ADDRESS, MEDAL_ABI } from '../api/contract';

export const useMedal = () => {
    const [account, setAccount] = useState<string>('');
    const [ownedMedals, setOwnedMedals] = useState<any[]>([]);
    const [proof, setProof] = useState<string[]>([]);
    const [claimId, setClaimId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async (address: string) => {
        try {
            const res: any = await request.get(`/v1/medals/${address}`);
            setOwnedMedals(res.medals || []);
            setProof(res.proof || []);
            setClaimId(res.claimableTokenId);
        } catch (err) {
            console.error("Fetch data failed", err);
        }
    }, []);

    const connectWallet = async () => {
        if (!window.ethereum) return alert('请安装 MetaMask');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            setAccount(accounts[0]);
            fetchData(accounts[0]);
        } catch (err) {
            console.error("Connect wallet failed", err);
        }
    };

    const handleClaim = async () => {
        if (!proof.length || !claimId || !window.ethereum) return;
        try {
            setLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, MEDAL_ABI, signer);

            const tx = await contract.claim(proof, claimId);
            await tx.wait();
            alert("勋章领取成功！");
            fetchData(account);
        } catch (err: any) {
            alert(`领取失败: ${err.reason || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return { account, ownedMedals, proof, claimId, loading, connectWallet, handleClaim };
};
