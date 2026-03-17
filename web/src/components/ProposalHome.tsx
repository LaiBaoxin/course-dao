import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Typography, message, Button, Space, Modal, Form, Input, InputNumber, Tooltip, Descriptions, Divider, Flex } from 'antd';
import { PlusOutlined, ReloadOutlined, ThunderboltFilled, InfoCircleOutlined, WalletOutlined,PieChartOutlined } from '@ant-design/icons';
import { getProposals } from '../api/governance';
import type { Proposal } from '../api/types';
import { useWriteContract, useWaitForTransactionReceipt, useBalance, useAccount } from 'wagmi';
import { governanceABI } from '../api/governance.ts';
import { formatEther, parseEther, keccak256, toBytes } from 'viem';
import { medalABI } from "../api/medal.ts";
import { readContract } from '@wagmi/core';
import { config } from '../wagmi.ts';

const { Title, Text } = Typography;

// 新合约地址
const MEDAL_ADDRESS = '0xDB74fc276B744F433507Df2b1547573B9392a986' as `0x${string}`;
const GOVERNOR_ADDRESS = '0xdb37d21553F57516a1dc9b221741f369EEf26249' as `0x${string}`;

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

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(6);
    const [total, setTotal] = useState<number>(0);

    // 勋章配置
    const medalTiers = [
        { name: '青铜', level: 0, price: '0.01', color: '#B87333', bg: '#fdf5ef', icon: '🥉', weight: 1 },
        { name: '白银', level: 1, price: '0.02', color: '#A9A9A9', bg: '#f5f5f5', icon: '🥈', weight: 2 },
        { name: '黄金', level: 2, price: '0.05', color: '#D4AF37', bg: '#fffbf0', icon: '🥇', weight: 5 },
    ];

    const { data: treasuryBalance, refetch: refetchBalance } = useBalance({ address: GOVERNOR_ADDRESS });

    const [myLevel, setMyLevel] = useState<{name: string, color: string, weight: number} | null>(null);
    const checkMyIdentity = useCallback(async () => {
        if (!userAddress) {
            setMyLevel(null);
            return;
        }
        try {
            // 根据用户地址查 TokenId
            const tokenId = await readContract(config, {
                address: MEDAL_ADDRESS,
                abi: medalABI,
                functionName: 'userTokenId',
                args: [userAddress],
            });

            // 根据 TokenId 查等级
            const hasMedal = await readContract(config, {
                address: MEDAL_ADDRESS,
                abi: medalABI,
                functionName: 'hasClaimed',
                args: [userAddress],
            }) as boolean;

            if (!hasMedal) {
                console.log("该地址暂无勋章");
                setMyLevel(null);
                return;
            }

            const level = await readContract(config, {
                address: MEDAL_ADDRESS,
                abi: medalABI,
                functionName: 'tokenLevels',
                args: [tokenId as bigint],
            }) as number;

            console.log("检测到等级:", level);
            const tier = medalTiers[level];
            setMyLevel({ name: tier.name, color: tier.color, weight: tier.weight });
        } catch (e) {
            console.error("身份检测失败:", e);
            setMyLevel(null);
        }
    }, [userAddress]);

    // 监听地址变化或交易确认后重新检测
    useEffect(() => {
        checkMyIdentity();
    }, [userAddress, isConfirming, checkMyIdentity]);

    const fetchData = useCallback(async (page = currentPage, currentSize = pageSize) => {
        try {
            setLoading(true);
            const res = await getProposals({ page, size: currentSize });
            const actualData = (res as any).data ? (res as any).data : res;
            if (actualData && actualData.list) {
                setProposals(actualData.list);
                setTotal(actualData.total || 0);
            }
            refetchBalance();
        } catch (e) {
            message.error("数据同步失败");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, refetchBalance]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (isConfirming) {
            message.success("链上确认成功！");
            setIsModalVisible(false);
            form.resetFields();
            fetchData();
        }
    }, [isConfirming, fetchData, form]);

    const handleBuyMedal = (level: number, price: string) => {
        writeContract({
            address: MEDAL_ADDRESS,
            abi: medalABI,
            functionName: 'buyMedal',
            args: [level],
            value: parseEther(price),
        });
    };

    const handleDelegate = () => {
        if (!userAddress) return message.warning("请连接钱包");
        writeContract({
            address: MEDAL_ADDRESS,
            abi: medalABI,
            functionName: 'delegate',
            args: [userAddress],
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
            args: [[record.receiver as `0x${string}`], [BigInt(record.amount)], ["0x"], descriptionHash],
        });
    };

    const handleProposeSubmit = async () => {
        const values = await form.validateFields();
        writeContract({
            address: GOVERNOR_ADDRESS,
            abi: governanceABI,
            functionName: 'propose',
            args: [[values.receiver as `0x${string}`], [parseEther(values.amount.toString())], ["0x"], values.description],
        });
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', render: (id: string) => <Text strong style={{ color: '#1890ff' }}>#{id.slice(0, 6)}</Text> },
        { title: '提案描述', dataIndex: 'description', key: 'description', ellipsis: true },
        { title: '申请金额', dataIndex: 'amount', key: 'amount', render: (a: string) => <Text strong>{formatEther(BigInt(a))} ETH</Text> },
        { title: '赞成权重', dataIndex: 'votesFor', key: 'votesFor', render: (v: string) => <Tag color="blue" style={{ borderRadius: '4px' }}>{v || 0} 票</Tag> },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: Proposal) => {
                const isOpLoading = activeId === record.id && (isWalletPending || isTxLoading);
                return (
                    <Space>
                        <Button type="link" size="small" onClick={() => { setCurrentProposal(record); setIsDetailVisible(true); }}>详情</Button>
                        {record.executed ? <Tag color="success">已拨付</Tag> : (
                            <>
                                <Button size="small" onClick={() => handleVote(record.id)} loading={isOpLoading}>投票</Button>
                                {parseInt(record.votesFor) > 0 && <Button danger type="primary" size="small" onClick={() => handleExecute(record)} loading={isOpLoading}>执行</Button>}
                            </>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <Card className="m-5 border-0" style={{ borderRadius: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {/* 顶层 Header 区 */}
            <div style={{ padding: '24px 24px 0' }}>
                <Flex justify="space-between" align="center">
                    <div>
                        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '32px' }}><PieChartOutlined /></span> DAO 治理看板
                        </Title>
                        <Text type="secondary">Sepolia 测试网：提案监控、权重投票与国库拨付</Text>
                    </div>
                    <Space size="middle">
                        <Button icon={<ReloadOutlined />} onClick={() => fetchData()} loading={loading} />
                        <Button
                            type="primary"
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={() => setIsModalVisible(true)}
                            style={{ borderRadius: '12px', fontWeight: 'bold', height: '48px', padding: '0 24px' }}
                        >
                            发起治理提案
                        </Button>
                    </Space>
                </Flex>

                <Flex align="center" style={{ marginTop: '16px' }}>
                    <Tag icon={<WalletOutlined />} color="processing" style={{ padding: '4px 12px', fontSize: '14px', borderRadius: '6px' }}>
                        国库资产: <Text strong style={{ color: '#0958d9' }}>{treasuryBalance ? Number(formatEther(treasuryBalance.value)).toFixed(4) : '0.0000'} ETH</Text>
                    </Tag>
                    {/*身份*/}
                    {myLevel ? (
                        <Tag color="gold" style={{ borderRadius: '6px', padding: '4px 12px', marginLeft: '14px', border: `1px solid ${myLevel.color}` }}>
                            当前身份: <Text strong style={{ color: myLevel.color }}>{myLevel.name}会员 ({myLevel.weight} 票/次)</Text>
                        </Tag>
                    ) : (
                        <Tag style={{ borderRadius: '6px', padding: '4px 12px' }}>
                            身份: <Text type="secondary">游客 (无投票权)</Text>
                        </Tag>
                    )}
                </Flex>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            {/* 功能条 Action Bar */}
            <div style={{ padding: '0 4px 4px' }}>
                <Flex gap="large" align="center" wrap="wrap" style={{ background: '#f8f9fa', padding: '16px', borderRadius: '16px' }}>
                    {/* 申购勋章按钮组 */}
                    <div>
                        <Text strong type="secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
                            <InfoCircleOutlined /> 申购身份勋章 (获取投票权重)
                        </Text>
                        <Space>
                            {medalTiers.map((tier) => (
                                <Tooltip key={tier.level} title={`等级权重: ${tier.weight} 票`}>
                                    <Button
                                        onClick={() => handleBuyMedal(tier.level, tier.price)}
                                        loading={isWalletPending || isTxLoading}
                                        style={{
                                            borderColor: tier.color,
                                            color: tier.color,
                                            background: tier.bg,
                                            borderRadius: '8px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        {tier.icon} {tier.name} ({tier.price} ETH)
                                    </Button>
                                </Tooltip>
                            ))}
                        </Space>
                    </div>

                    {/* 激活投票权 */}
                    <div>
                        <Text strong type="secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
                            <ThunderboltFilled /> 状态激活
                        </Text>
                        <Button
                            type="primary"
                            ghost
                            onClick={handleDelegate}
                            loading={isWalletPending || isTxLoading}
                            style={{ borderRadius: '8px', color: '#52c41a', borderColor: '#52c41a', fontWeight: 'bold' }}
                        >
                            激活我的投票权 (Delegate)
                        </Button>
                    </div>
                </Flex>
            </div>

            {/* 表格区 */}
            <div style={{ padding: '0 24px 24px' }}>
                <Table
                    dataSource={proposals}
                    columns={columns}
                    loading={loading}
                    rowKey={(record, index) => `${record.id}-${index}`}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条提案`,
                        onChange: (page, size) => { setCurrentPage(page); setPageSize(size); fetchData(page, size); },
                    }}
                />
            </div>

            <Modal title={<b>创建新治理提案</b>} open={isModalVisible} onOk={handleProposeSubmit} onCancel={() => setIsModalVisible(false)} confirmLoading={isWalletPending || isTxLoading} okText="发送交易" cancelText="取消" destroyOnClose width={520}>
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item name="description" label="提案内容" rules={[{ required: true, message: '请描述用途' }]}><Input.TextArea rows={3} /></Form.Item>
                    <Form.Item name="amount" label="申请金额 (ETH)" rules={[{ required: true, message: '请输入金额' }]}><InputNumber style={{ width: '100%' }} min={0.000001} precision={6} /></Form.Item>
                    <Form.Item name="receiver" label="收款钱包地址" rules={[{ required: true, message: '请输入地址' }, { pattern: /^0x[a-fA-F0-9]{40}$/, message: '无效格式' }]}><Input spellCheck={false} /></Form.Item>
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
