import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Typography, message, Button, Space, Modal, Form, Input, InputNumber, Tooltip } from 'antd';
import { PlusOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getProposals } from '../api/governance';
import type { Proposal } from '../api/types';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { governanceABI } from '../api/governance.ts';
import { formatEther, parseEther } from 'viem'; // 单位转换工具

const { Title, Text } = Typography;

// Sepolia 或本地合约地址（第四阶段部署后需更新此处）
const CONTRACT_ADDRESS = '0x3761b1F7f037318C018Ba5C5D473Ea92799B4Db5' as `0x${string}`;

const ProposalHome: React.FC = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [form] = Form.useForm();

    // Wagmi
    const { writeContract, data: hash, isPending: isWalletPending } = useWriteContract();

    // 监听所有写入交易的回执
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
            message.error("从数据库同步数据失败");
        } finally {
            setLoading(false);
        }
    }, []);

    // 初始加载
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 监听链上确认结果
    useEffect(() => {
        if (isConfirming) {
            message.success("区块链确认成功！数据已同步至分布式存储。");
            setIsModalVisible(false);
            form.resetFields();
            setActiveId(null);
            // 延迟刷新，给后端 Listener 留出扫描区块的时间
            const timer = setTimeout(() => fetchData(), 2000);
            return () => clearTimeout(timer);
        }
    }, [isConfirming, fetchData, form]);

    // 投票处理
    const handleVote = (pid: string) => {
        setActiveId(pid);
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: governanceABI,
            functionName: 'vote',
            args: [BigInt(pid)],
        });
    };

    // 执行拨付处理
    const handleExecute = (pid: string) => {
        setActiveId(pid);
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: governanceABI,
            functionName: 'executeProposal',
            args: [BigInt(pid)],
        });
    };

    // 支持 ETH 单位转换
    const handleProposeSubmit = async () => {
        try {
            const values = await form.validateFields();

            // 将输入的 ETH 转换为 Wei (uint256)
            // 用户输入 1，parseEther 转换为 10^18
            const amountInWei = parseEther(values.amount.toString());

            writeContract({
                address: CONTRACT_ADDRESS,
                abi: governanceABI,
                functionName: 'propose',
                args: [
                    values.description,
                    amountInWei,
                    values.receiver as `0x${string}`
                ],
            }, {
                onError: (err) => {
                    console.error("合约写入失败：", err);
                    message.error(`交易被拒绝: ${err.message.split('\n')[0]}`);
                }
            });
        } catch (error) {
            message.warning("请检查表单输入是否完整");
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => <b style={{color: '#1890ff'}}>#{id}</b>
        },
        {
            title: '提案描述',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true
        },
        {
            title: '申请金额',
            dataIndex: 'amount',
            key: 'amount',
            render: (a: string) => (
                <Space>
                    <Text strong>{formatEther(BigInt(a))} ETH</Text>
                    <Tooltip title={`${a} Wei`}>
                        <InfoCircleOutlined style={{ color: '#bfbfbf', fontSize: '12px' }} />
                    </Tooltip>
                </Space>
            )
        },
        {
            title: '当前权重',
            dataIndex: 'votesFor',
            key: 'votesFor',
            render: (v: string) => <Tag color="blue" style={{ borderRadius: '4px' }}>{v || 0} 票</Tag>
        },
        {
            title: '治理状态',
            key: 'action',
            render: (_: any, record: Proposal) => {
                const isOpLoading = activeId === record.id && (isWalletPending || isTxLoading);
                return (
                    <Space>
                        {record.executed ? (
                            <Tag color="success" style={{ padding: '2px 10px' }}>已执行完成</Tag>
                        ) : (
                            <>
                                <Button
                                    type="link"
                                    size="small"
                                    onClick={() => handleVote(record.id)}
                                    loading={isOpLoading}
                                >
                                    投票
                                </Button>
                                {parseInt(record.votesFor) >= 10 && (
                                    <Button
                                        danger
                                        type="primary"
                                        size="small"
                                        onClick={() => handleExecute(record.id)}
                                        loading={isOpLoading}
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
        <Card className="m-5 shadow-lg border-0" style={{ borderRadius: '16px', background: '#f8f9fa' }}>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Title level={2} style={{ margin: 0, color: '#1a1a1a' }}>DAO 治理看板</Title>
                    <Text type="secondary">链上实时提案监控与资产拨付系统</Text>
                </div>
                <Space size="middle">
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalVisible(true)}
                        style={{ borderRadius: '8px', fontWeight: 'bold' }}
                    >
                        发起提案
                    </Button>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchData}
                        loading={loading}
                        style={{ borderRadius: '8px' }}
                    >
                        刷新
                    </Button>
                </Space>
            </div>

            <Table
                dataSource={proposals}
                columns={columns}
                loading={loading}
                rowKey={(record) => `${record.id}-${record.description}`}
                pagination={{ pageSize: 6 }}
                style={{ background: '#fff', borderRadius: '8px' }}
            />

            {/* 发起提案弹窗 */}
            <Modal
                title={<b>创建新治理提案</b>}
                open={isModalVisible}
                onOk={handleProposeSubmit}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={isWalletPending || isTxLoading}
                okText="发送交易 (Sepolia)"
                cancelText="取消"
                destroyOnClose
                width={520}
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item
                        name="description"
                        label="提案内容"
                        rules={[{ required: true, message: '请描述您的提案用途' }]}
                    >
                        <Input.TextArea placeholder="例如：支付 2026 Q1 社区运营费用" rows={3} />
                    </Form.Item>

                    <Form.Item
                        name="amount"
                        label="申请金额 (ETH)"
                        extra={<Text type="secondary" style={{ fontSize: '12px' }}>* 系统会自动转换为 Wei 提交至以太坊网络</Text>}
                        rules={[{ required: true, message: '请输入金额' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0.000001}
                            placeholder="0.1"
                            precision={6}
                        />
                    </Form.Item>

                    <Form.Item
                        name="receiver"
                        label="收款钱包地址"
                        rules={[
                            { required: true, message: '请输入收款人地址' },
                            { pattern: /^0x[a-fA-F0-9]{40}$/, message: '无效的以太坊地址格式' }
                        ]}
                    >
                        <Input placeholder="0x..." spellCheck={false} />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default ProposalHome;
