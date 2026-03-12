import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Typography, message, Button, Space } from 'antd';
import { getProposals } from '../api/governance';
import type { Proposal } from '../api/types';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { governanceABI } from '../api/governance.ts';

const { Title } = Typography;

// Remix 中最新的合约地址
const CONTRACT_ADDRESS = '0x3761b1F7f037318C018Ba5C5D473Ea92799B4Db5' as `0x${string}`;

const ProposalHome: React.FC = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Wagmi 写入钩子
    const { writeContract, data: hash, isPending: isWalletPending } = useWriteContract();

    // 监听交易结果
    const { isSuccess: isConfirming, isLoading: isTxLoading } = useWaitForTransactionReceipt({ hash });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getProposals();
            const actualData = (res as any).data ? (res as any).data : res;
            if (actualData && actualData.list) {
                setProposals(actualData.list);
            }
        } catch (e) {
            message.error("获取数据失败");
        } finally {
            setLoading(false);
        }
    }, []);

    // 初始加载
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 交易成功后的闭环逻辑
    useEffect(() => {
        if (isConfirming) {
            message.success("链上执行成功！正在同步 ClickHouse...");
            setActiveId(null);
            // 延迟 1.5 秒确保 Listener 写入完成
            const timer = setTimeout(() => {
                fetchData();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isConfirming, fetchData]);

    // 处理投票
    const handleVote = (pid: string) => {
        setActiveId(pid);
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: governanceABI,
            functionName: 'vote',
            args: [BigInt(pid)],
        });
    };

    // 处理执行拨付
    const handleExecute = (pid: string) => {
        setActiveId(pid);
        const cleanPid = pid.trim();
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: governanceABI,
            functionName: 'executeProposal',
            args: [BigInt(cleanPid)],
        });
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', render: (id: string) => `#${id}` },
        { title: '描述', dataIndex: 'description', key: 'description' },
        { title: '金额', dataIndex: 'amount', key: 'amount', render: (a: string) => `${a} Wei` },
        {
            title: '当前票数',
            dataIndex: 'votesFor',
            key: 'votesFor',
            render: (v: string) => <Tag color="blue">{v ? v : 0} 票</Tag>
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: Proposal) => {
                const isCurrentPending = activeId === record.id && (isWalletPending || isTxLoading);

                return (
                    <Space>
                        {record.executed ? (
                            <Tag color="green">已执行完成</Tag>
                        ) : (
                            <>
                                <Button
                                    type="link"
                                    onClick={() => handleVote(record.id)}
                                    loading={isCurrentPending}
                                    disabled={!!activeId && activeId !== record.id}
                                >
                                    投票
                                </Button>
                                {/* 满足 10 票门槛显示执行按钮 */}
                                {parseInt(record.votesFor) >= 10 && (
                                    <Button
                                        danger
                                        type="primary"
                                        size="small"
                                        onClick={() => handleExecute(record.id)}
                                        loading={isCurrentPending}
                                        disabled={!!activeId && activeId !== record.id}
                                    >
                                        执行拨付
                                    </Button>
                                )}
                            </>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <Card className="m-5 rounded-xl shadow-md border-0 bg-gray-50/50">
            <div className="flex justify-between items-center mb-6">
                <Title level={3} style={{ margin: 0 }}>DAO 治理提案看板</Title>
                <Button onClick={fetchData} loading={loading}>刷新列表</Button>
            </div>
            <Table
                loading={loading}
                dataSource={proposals}
                columns={columns}
                rowKey={(record) => `${record.id}-${record.description}`}
                pagination={{ pageSize: 5 }}
                className="shadow-sm rounded-lg overflow-hidden"
            />
        </Card>
    );
};

export default ProposalHome;
