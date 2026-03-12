// src/hooks/useMedal.ts
import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import request from '../utils/request';
import { CONTRACT_ADDRESS, MEDAL_ABI } from '../api/contract';
import { App as AntdApp } from 'antd';
import confetti from 'canvas-confetti';
import { useAccount } from 'wagmi';

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

    const fetchData = useCallback(async (rawAddress: string) => {
        if (!rawAddress) return;
        const address = rawAddress.toLowerCase();

        try {
            const response: any = await request.get(`/v1/medals/${address}`);
            const res = response.data ? response.data : response;

            // 更新已拥有的勋章
            const medals = res.medals || [];
            setOwnedMedals(medals);

            // 判断是否显示“领取”按钮
            const claimableId = Number(res.claimableTokenId);

            // 检查这个 TokenId 是否已经领过
            const isAlreadyOwned = medals.some((m: any) => Number(m.tokenId) === claimableId);

            // 只要后端给出了有效的 claimableTokenId，且用户还没领过
            // 即使 proof 是空数组 [] (单白名单) 或者是 [hash] (双白名单)，都允许设置状态
            if (claimableId > 0 && !isAlreadyOwned && res.proof !== null) {
                setProof(res.proof); // 可能是 []，也可能是 ["0x..."]
                setClaimId(claimableId);
                console.log(`发现可领取勋章: #${claimableId}, Proof长度: ${res.proof.length}`);
            } else {
                setProof([]);
                setClaimId(null);
            }
        } catch (err) {
            console.error("Fetch data failed", err);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('course_dao_jwt');

        if (isConnected && wagmiAddress && token) {
            setAccount(wagmiAddress);
            fetchData(wagmiAddress); // 发起真正的网络请求！
        } else if (!isConnected || !token) {
            // 如果钱包断开或没有登录，清空状态
            clearState();
        }
    }, [isConnected, wagmiAddress, fetchData, clearState]);

    const handleClaim = async () => {
        if (claimId === null || claimId === 0) {
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

                    const rootOnChain = await contract.merkleRoot();
                    if (rootOnChain === ethers.ZeroHash) {
                        throw new Error("合约 Merkle Root 未初始化，请联系管理员运行 set_root.go");
                    }

                    const tx = await contract.claim(proof, claimId);
                    msgApi.info({ content: '交易已发出，等待链上确认...', duration: 4 });

                    await tx.wait();
                    msgApi.success({ content: `🎉 领取成功！ID: #${claimId}` });

                    // 触发全屏烟花效果
                    confetti({
                        zIndex: 9999,
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.5 },
                        colors: ['#fadb14', '#1890ff', '#52c41a', '#ff4d4f']
                    });

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

    return { account, ownedMedals, proof, claimId, loading, handleClaim };
};
