import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Typography, message, Button, Space, Modal, Form, Input, InputNumber, Tooltip, Descriptions } from 'antd';
import { PlusOutlined, ReloadOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { getProposals } from '../api/governance';
import type { Proposal } from '../api/types';
import { useWriteContract, useWaitForTransactionReceipt, useBalance, useAccount } from 'wagmi';
import { governanceABI } from '../api/governance.ts';
import { formatEther, parseEther, keccak256, toBytes } from 'viem';
import { medalABI } from "../api/medal.ts";

const { Title, Text } = Typography;

// 新合约地址
const MEDAL_ADDRESS = '0x33a741ffe6dcE2Ac9461abbE8476f55B26992434' as `0x${string}`;
const GOVERNOR_ADDRESS = '0x55e802B25AFebD3A945474e1076D229286462577' as `0x${string}`;

const ProposalHome: React.FC = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDetailVisible, setIsDetailVisible] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null);
    const [form] = Form.useForm();

    const { address: userAddress } = useAccount();
    const { writeContract, data: hash, isPending: isWalletPending } = useWriteContract();
    const { isSuccess: isConfirming, isLoading: isTxLoading } = useWaitForTransactionReceipt({ hash });

    // 获取国库实时余额
    const { data: treasuryBalance, refetch: refetchBalance } = useBalance({ address: GOVERNOR_ADDRESS });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getProposals();
            const actualData = (res as any).data ? (res as any).data : res;
            if (actualData && actualData.list) {
                setProposals(actualData.list);
            }
            refetchBalance(); // 顺便刷新一下国库余额
        } catch (e) {
            message.error("从数据库同步数据失败");
        } finally {
            setLoading(false);
        }
    }, [refetchBalance]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (isConfirming) {
            message.success("区块链交易确认成功！");
            setIsModalVisible(false);
            form.resetFields();
            setActiveId(null);
            const timer = setTimeout(() => fetchData(), 2000);
            return () => clearTimeout(timer);
        }
    }, [isConfirming, fetchData, form]);

    const formatId = (id: string) => {
        if (!id || id.length <= 10) return id;
        return `${id.slice(0, 6)}...${id.slice(-4)}`;
    };

    // 购买勋章
    const handleBuyMedal = () => {
        writeContract({
            address: MEDAL_ADDRESS,
            abi: medalABI,
            functionName: 'buyMedal',
            value: parseEther('0.01'),
        }, {
            onSuccess: () => message.info("正在等待 MetaMask 签名购买..."),
            onError: (err) => {
                const errorStr = err.message.toLowerCase();
                if (errorStr.includes('reverted') || errorStr.includes('gas limit too high') || errorStr.includes('already')) {
                    message.warning("购买拦截：您当前账号已经拥有勋章，无法重复购买！");
                } else {
                    message.error("购买失败，请确保钱包有足够的 Sepolia ETH！");
                }
            }
        });
    };

    // 激活投票权 (Delegate)
    const handleDelegate = () => {
        if (!userAddress) return message.warning("请先连接钱包");
        writeContract({
            address: MEDAL_ADDRESS,
            abi: medalABI,
            functionName: 'delegate',
            args: [userAddress],
        }, {
            onSuccess: () => message.success("正在激活您的投票权，请在钱包中确认..."),
            onError: (err) => message.error(`激活失败: ${err.message.split('\n')[0]}`)
        });
    };

    const handleVote = (pid: string) => {
        setActiveId(pid);
        writeContract({
            address: GOVERNOR_ADDRESS,
            abi: governanceABI,
            functionName: 'castVote',
            args: [BigInt(pid), 1],
        });
    };

    const handleExecute = (record: Proposal) => {
        setActiveId(record.id);
        const descriptionHash = keccak256(toBytes(record.description));
        writeContract({
            address: GOVERNOR_ADDRESS,
            abi: governanceABI,
            functionName: 'execute',
            args: [
                [record.receiver as `0x${string}`],
                [BigInt(record.amount)],
                ["0x"],
                descriptionHash
            ],
        }, {
            onSuccess: () => message.info("正在等待签名执行拨付..."),
            onError: (err) => message.error(`执行失败: ${err.message.split('\n')[0]}`)
        });
    };

    const handleProposeSubmit = async () => {
        try {
            const values = await form.validateFields();
            const amountInWei = parseEther(values.amount.toString());
            writeContract({
                address: GOVERNOR_ADDRESS,
                abi: governanceABI,
                functionName: 'propose',
                args: [[values.receiver as `0x${string}`], [amountInWei], ["0x"], values.description],
            }, {
                onSuccess: () => message.info("正在等待 MetaMask 签名发起提案..."),
                onError: (err) => message.error(`提案失败: ${err.message.split('\n')[0]}`)
            });
        } catch (error) {
            message.warning("请检查表单输入是否完整");
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', render: (id: string) => <Tooltip title={id} placement="topLeft"><b style={{color: '#1890ff', cursor: 'pointer'}}>#{formatId(id)}</b></Tooltip> },
        { title: '提案描述', dataIndex: 'description', key: 'description', ellipsis: true },
        { title: '申请金额', dataIndex: 'amount', key: 'amount', render: (a: string) => <Space><Text strong>{formatEther(BigInt(a))} ETH</Text></Space> },
        { title: '当前权重', dataIndex: 'votesFor', key: 'votesFor', render: (v: string) => <Tag color="blue" style={{ borderRadius: '4px' }}>{v || 0} 票</Tag> },
        {
            title: '治理状态',
            key: 'action',
            render: (_: any, record: Proposal) => {
                const isOpLoading = activeId === record.id && (isWalletPending || isTxLoading);
                return (
                    <Space>
                        <Button type="link" size="small" onClick={() => { setCurrentProposal(record); setIsDetailVisible(true); }}>查看详情</Button>
                        {record.executed ? (
                            <Tag color="success">已拨付完成</Tag>
                        ) : (
                            <>
                                <Button type="default" size="small" onClick={() => handleVote(record.id)} loading={isOpLoading}>投票</Button>
                                {parseInt(record.votesFor) >= 1 && (
                                    <Button danger type="primary" size="small" onClick={() => handleExecute(record)} loading={isOpLoading}>执行拨付</Button>
                                )}
                            </>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <Card className="m-5 shadow-lg border-0" style={{ borderRadius: '16px', background: '#f8f9fa' }}>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Title level={2} style={{ margin: 0, color: '#1a1a1a' }}>DAO 治理看板</Title>
                    <Text type="secondary">链上实时提案监控与资产拨付系统</Text>
                    <div style={{ marginTop: '8px' }}>
                        <Tag color="gold" style={{ fontSize: '14px', padding: '4px 8px' }}>
                            国库总资产: {treasuryBalance ? Number(formatEther(treasuryBalance.value)).toFixed(4) : '0.0000'} ETH
                        </Tag>
                    </div>
                </div>
                <Space size="middle">
                    <Button type="dashed" size="large" icon={<ShoppingCartOutlined />} onClick={handleBuyMedal} style={{ borderRadius: '8px', borderColor: '#faad14', color: '#faad14' }} loading={isWalletPending || isTxLoading}>
                        申购勋章 (0.01 ETH)
                    </Button>

                    {/* 激活投票权按钮 */}
                    <Button type="default" size="large" onClick={handleDelegate} style={{ borderRadius: '8px', color: '#52c41a', borderColor: '#52c41a' }} loading={isWalletPending || isTxLoading}>
                        激活我的投票权
                    </Button>

                    <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} style={{ borderRadius: '8px', fontWeight: 'bold' }}>
                        发起提案
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} style={{ borderRadius: '8px' }}>刷新</Button>
                </Space>
            </div>

            <Table dataSource={proposals} columns={columns} loading={loading} rowKey={(record) => `${record.id}-${record.description}`} pagination={{ pageSize: 6 }} style={{ background: '#fff', borderRadius: '8px' }} />

            <Modal title={<b>创建新治理提案</b>} open={isModalVisible} onOk={handleProposeSubmit} onCancel={() => setIsModalVisible(false)} confirmLoading={isWalletPending || isTxLoading} okText="发送交易" cancelText="取消" destroyOnClose width={520}>
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item name="description" label="提案内容" rules={[{ required: true, message: '请描述您的提案用途' }]}><Input.TextArea rows={3} /></Form.Item>
                    <Form.Item name="amount" label="申请金额 (ETH)" rules={[{ required: true, message: '请输入金额' }]}><InputNumber style={{ width: '100%' }} min={0.000001} precision={6} /></Form.Item>
                    <Form.Item name="receiver" label="收款钱包地址" rules={[{ required: true, message: '请输入收款人地址' }, { pattern: /^0x[a-fA-F0-9]{40}$/, message: '无效格式' }]}><Input spellCheck={false} /></Form.Item>
                </Form>
            </Modal>

            <Modal title={<b>提案详细信息</b>} open={isDetailVisible} onCancel={() => setIsDetailVisible(false)} footer={[<Button key="close" onClick={() => setIsDetailVisible(false)}>关闭</Button>]} width={600}>
                {currentProposal && (
                    <Descriptions column={1} bordered size="small" style={{ marginTop: '16px' }}>
                        <Descriptions.Item label="完整提案 ID"><Text copyable>{currentProposal.id}</Text></Descriptions.Item>
                        <Descriptions.Item label="提案描述">{currentProposal.description}</Descriptions.Item>
                        <Descriptions.Item label="申请金额"><Text strong type="danger">{formatEther(BigInt(currentProposal.amount))} ETH</Text></Descriptions.Item>
                        <Descriptions.Item label="收款人地址"><Text copyable>{currentProposal.receiver}</Text></Descriptions.Item>
                        <Descriptions.Item label="当前赞成票"><Tag color="blue">{currentProposal.votesFor || 0} 票</Tag></Descriptions.Item>
                        <Descriptions.Item label="执行状态">{currentProposal.executed ? <Tag color="success">已拨付完成</Tag> : <Tag color="processing">投票中 / 待执行</Tag>}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </Card>
    );
};

export default ProposalHome;
