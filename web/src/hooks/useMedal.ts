// src/hooks/useMedal.ts
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import request from '../utils/request';
import { CONTRACT_ADDRESS, MEDAL_ABI } from '../api/contract';
import { App as AntdApp } from 'antd';

export const useMedal = () => {
    const { message: msgApi, modal } = AntdApp.useApp();
    const [account, setAccount] = useState<string>('');
    const [ownedMedals, setOwnedMedals] = useState<any[]>([]);
    const [proof, setProof] = useState<string[]>([]);
    const [claimId, setClaimId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async (address: string) => {
        try {
            const res: any = await request.get(`/v1/medals/${address}`);
            const medals = res.medals || [];
            setOwnedMedals(medals);

            // 逻辑：如果该 TokenID 已在拥有的列表中，则清空证明以隐藏 UI
            const isClaimed = medals.some((m: any) => Number(m.tokenId) === Number(res.claimableTokenId));

            if (!isClaimed && res.proof?.length > 0) {
                setProof(res.proof);
                setClaimId(res.claimableTokenId);
            } else {
                setProof([]);
                setClaimId(null);
            }
        } catch (err) {
            console.error("Fetch data failed", err);
        }
    }, []);

    const connectWallet = async () => {
        if (!window.ethereum) {
            msgApi.error({ content: '请安装 MetaMask 钱包' });
            return;
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum as any);
            const accounts = await provider.send("eth_requestAccounts", []);
            setAccount(accounts[0]);
            fetchData(accounts[0]);
        } catch (err) {
            msgApi.warning({ content: '连接已取消' });
        }
    };

    const handleClaim = async () => {
        if (!proof.length || !claimId || !window.ethereum) return;

        modal.confirm({
            title: '确认领取',
            content: `即将领取 Course DAO #${claimId} 号勋章，是否继续？`,
            onOk: async () => {
                try {
                    setLoading(true);
                    const provider = new ethers.BrowserProvider(window.ethereum as any);
                    const signer = await provider.getSigner();
                    const contract = new ethers.Contract(CONTRACT_ADDRESS, MEDAL_ABI, signer);

                    const tx = await contract.claim(proof, claimId);
                    msgApi.info({ content: '交易已发出，等待链上确认...', duration: 4 });

                    await tx.wait();

                    msgApi.success({ content: `领取成功！ID: #${claimId}`, duration: 5 });

                    // 领取成功后立即清理 proof 状态
                    setProof([]);
                    setClaimId(null);

                    // 延迟同步 ClickHouse 索引
                    setTimeout(() => fetchData(account), 3000);
                } catch (err: any) {
                    msgApi.error({ content: err.reason || '交易失败' });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return { account, ownedMedals, proof, claimId, loading, connectWallet, handleClaim };
};
