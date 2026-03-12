import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Typography, message, Button, Space, Modal, Form, Input, InputNumber } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
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

    // 初始化加载
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 监听链上确认，成功后刷新列表并重置状态
    useEffect(() => {
        if (isConfirming) {
            message.success("区块链确认成功！正在同步链下数据库...");
            setIsModalVisible(false);
            form.resetFields();
            setActiveId(null);
            // 给 Listener 留出 2 秒的扫描入库时间
            const timer = setTimeout(() => fetchData(), 2000);
            return () => clearTimeout(timer);
        }
    }, [isConfirming, fetchData, form]);

    // 操作处理
    const handleVote = (pid: string) => {
        setActiveId(pid);
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: governanceABI,
            functionName: 'vote',
            args: [BigInt(pid)],
        });
    };

    const handleExecute = (pid: string) => {
        setActiveId(pid);
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: governanceABI,
            functionName: 'executeProposal',
            args: [BigInt(pid)],
        });
    };

    const handleProposeSubmit = async () => {
        try {
            // 验证表单字段
            const values = await form.validateFields();
            console.log("发起提案数据：", values);
            // 3. 调用合约
            const amount = values.amount ? BigInt(values.amount) : 0n;

            writeContract({
                address: CONTRACT_ADDRESS,
                abi: governanceABI,
                functionName: 'propose',
                args: [
                    values.description,
                    amount,
                    values.receiver
                ],
            }, {
                onSuccess: (txHash) => {
                    console.log("交易已提交，哈希：", txHash);
                },
                onError: (err) => {
                    console.error("合约写入失败：", err);
                    message.error(`发起失败: ${err.message.split('\n')[0]}`);
                }
            });
        } catch (error) {
            // 表单验证未通过的情况
            message.warning("请完善表单信息");
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', render: (id: string) => <b style={{color: '#1890ff'}}>#{id}</b> },
        { title: '提案描述', dataIndex: 'description', key: 'description' },
        { title: '金额', dataIndex: 'amount', key: 'amount', render: (a: string) => `${a} Wei` },
        {
            title: '当前票数',
            dataIndex: 'votesFor',
            key: 'votesFor',
            render: (v: string) => <Tag color="processing">{v || 0} 票</Tag>
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: Proposal) => {
                const isOpLoading = activeId === record.id && (isWalletPending || isTxLoading);
                return (
                    <Space>
                        {record.executed ? (
                            <Tag color="success">已执行完成</Tag>
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
        <Card className="m-5 shadow-lg border-0" style={{ borderRadius: '12px' }}>
            <div className="flex justify-between items-center mb-6">
                <Title level={3} style={{ margin: 0 }}>DAO 治理中心</Title>
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalVisible(true)}
                    >
                        发起新提案
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
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
            />

            {/* 发起提案弹窗 */}
            <Modal
                title="创建新提案"
                open={isModalVisible}
                onOk={handleProposeSubmit}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={isWalletPending || isTxLoading}
                okText="发送到区块链"
                cancelText="取消"
                destroyOnClose
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item
                        name="description"
                        label="提案内容"
                        rules={[{ required: true, message: '请描述您的提案' }]}
                    >
                        <Input.TextArea placeholder="例如：给社区开发者发放奖励" rows={3} />
                    </Form.Item>
                    <Form.Item
                        name="amount"
                        label="申请金额 (Wei)"
                        rules={[{ required: true, message: '请输入金额' }]}
                    >
                        <InputNumber style={{ width: '100%' }} min={1} placeholder="100" />
                    </Form.Item>
                    <Form.Item
                        name="receiver"
                        label="接收者地址"
                        rules={[
                            { required: true, message: '请输入钱包地址' },
                            { pattern: /^0x[a-fA-F0-9]{40}$/, message: '无效的以太坊地址' }
                        ]}
                    >
                        <Input placeholder="0x..." />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default ProposalHome;
