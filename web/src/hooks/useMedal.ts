// src/hooks/useMedal.ts
import { useState, useCallback, useEffect } from 'react';
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

    const clearState = useCallback(() => {
        setAccount('');
        setOwnedMedals([]);
        setProof([]);
        setClaimId(null);
    }, []);

    const fetchData = useCallback(async (address: string) => {
        if (!address) return;
        try {
            const res: any = await request.get(`/v1/medals/${address}`);
            // 初始化为空
            const medals = res.medals || [];
            setOwnedMedals(medals);

            // 如果领过了就不显示证明
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

    useEffect(() => {
        const eth = window.ethereum as any;
        if (eth && eth.on) {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    fetchData(accounts[0]);
                } else {
                    clearState();
                }
            };
            const handleChainChanged = () => window.location.reload();
            eth.on('accountsChanged', handleAccountsChanged);
            eth.on('chainChanged', handleChainChanged);
            return () => {
                eth.removeListener('accountsChanged', handleAccountsChanged);
                eth.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, [fetchData, clearState]);

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

    const disconnectWallet = () => {
        clearState();
        msgApi.info({ content: '已断开钱包连接' });
    };

    const handleClaim = async () => {
        // claimId 的合法性深度校验
        if (proof.length === 0 || claimId === null || claimId === 0) {
            msgApi.warning({ content: '申领凭证无效，请确保您在白名单中' });
            return;
        }

        if (!window.ethereum) {
            msgApi.error({ content: '未检测到环境' });
            return;
        }

        modal.confirm({
            title: '确认领取荣誉',
            content: `即将领取 Course DAO #${claimId} 号勋章，是否继续？`,
            onOk: async () => {
                try {
                    setLoading(true);
                    const provider = new ethers.BrowserProvider(window.ethereum as any);
                    const signer = await provider.getSigner();
                    const contract = new ethers.Contract(CONTRACT_ADDRESS, MEDAL_ABI, signer);

                    // 在发送交易前再次确认 root 状态（防御 revert）
                    const rootOnChain = await contract.merkleRoot();
                    if (rootOnChain === ethers.ZeroHash) {
                        throw new Error("合约 Merkle Root 未初始化，请联系管理员运行 set_root.go");
                    }

                    const tx = await contract.claim(proof, claimId);
                    msgApi.info({ content: '交易已发出，等待链上确认...', duration: 4 });

                    await tx.wait();
                    msgApi.success({ content: `🎉 领取成功！ID: #${claimId}` });

                    setProof([]);
                    setClaimId(null);
                    setTimeout(() => fetchData(account), 3000);
                } catch (err: any) {
                    console.error("Claim Error Details:", err);
                    const reason = err.reason || err.message || "";
                    if (reason.includes("0x7e273289")) {
                        msgApi.error({ content: "操作失败：该勋章目前无法在链上定位，请检查合约部署状态" });
                    } else {
                        msgApi.error({ content: `失败: ${reason.slice(0, 50)}` });
                    }
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return { account, ownedMedals, proof, claimId, loading, connectWallet, disconnectWallet, handleClaim };
};
