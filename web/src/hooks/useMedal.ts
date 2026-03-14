import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, MEDAL_ABI } from '../api/contract';
import { getMedalsByAddress } from '../api/medal';
import { useAccount } from 'wagmi';
import { App as AntdApp } from 'antd';
import confetti from 'canvas-confetti';

// const MEDAL_CONTRACT_ADDRESS = '0x3D28b0bDFbeaf0F8aa29F4e90780f6fb8004BF01';

export const useMedal = () => {
    const { message: msgApi, modal } = AntdApp.useApp();
    const [account, setAccount] = useState<string>('');
    const [ownedMedals, setOwnedMedals] = useState<any[]>([]);
    const [proof, setProof] = useState<string[]>([]);
    const [claimId, setClaimId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const { address: wagmiAddress, isConnected } = useAccount();

    const clearState = useCallback(() => {
        setAccount('');
        setOwnedMedals([]);
        setProof([]);
        setClaimId(null);
    }, []);

    // 获取逻辑
    const fetchData = useCallback(async (rawAddress: string) => {
        if (!rawAddress) return;
        const address = rawAddress.toLowerCase();

        try {
            setLoading(true);
            const res = await getMedalsByAddress(address);
            const data = (res as any).data ? (res as any).data : res;

            // 更新用户已拥有的勋章列表
            const medals = data.medals || [];
            setOwnedMedals(medals);

            // 是否显示白名单领取按钮
            const claimableId = Number(data.claimableTokenId);
            const isAlreadyOwned = medals.some((m: any) => Number(m.tokenId) === claimableId);

            // 如果后端给出了有效的白名单 ID，且用户还没领过，且有 Proof 数据
            if (claimableId > 0 && !isAlreadyOwned && data.proof !== null) {
                setProof(data.proof);
                setClaimId(claimableId);
                console.log(`命中白名单: #${claimableId}`);
            } else {
                setProof([]);
                setClaimId(null);
            }
        } catch (err) {
            console.error("获取勋章数据失败 (可能是404或网络问题):", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // 监听钱包和登录状态
    useEffect(() => {
        const token = localStorage.getItem('course_dao_jwt');

        if (isConnected && wagmiAddress && token) {
            setAccount(wagmiAddress);
            fetchData(wagmiAddress);
        } else {
            clearState();
        }
    }, [isConnected, wagmiAddress, fetchData, clearState]);

    // 领取逻辑 (Merkle Proof 领取)
    const handleClaim = async () => {
        if (!claimId) {
            msgApi.warning({ content: '您当前没有可领取的勋章' });
            return;
        }

        if (!window.ethereum) {
            msgApi.error({ content: '未检测到以太坊环境 (MetaMask)' });
            return;
        }

        modal.confirm({
            title: '确认领取荣誉',
            content: `即将领取 Course DAO #${claimId} 号白名单勋章，点击确定发起交易。`,
            onOk: async () => {
                try {
                    setLoading(true);
                    const provider = new ethers.BrowserProvider(window.ethereum as any);
                    const signer = await provider.getSigner();
                    const contract = new ethers.Contract(CONTRACT_ADDRESS, MEDAL_ABI, signer);

                    // 发起链上 claim 交易
                    const tx = await contract.claim(proof, claimId);
                    msgApi.info({ content: '交易已发出，正在同步区块...' });

                    await tx.wait();
                    msgApi.success({ content: `🎉 恭喜！勋章 #${claimId} 领取成功` });

                    // 撒花
                    confetti({
                        zIndex: 9999,
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 },
                        colors: ['#D4AF37', '#C0C0C0', '#B87333']
                    });

                    // 领取成功后刷新状态
                    setProof([]);
                    setClaimId(null);
                    setTimeout(() => fetchData(account), 3000);
                } catch (err: any) {
                    console.error("Claim Error:", err);
                    msgApi.error({ content: `领取失败: ${err.reason || err.message}` });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return { account, ownedMedals, proof, claimId, loading, handleClaim, refresh: () => fetchData(account) };
};
