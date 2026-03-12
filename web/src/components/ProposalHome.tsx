import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Spin, message } from 'antd';
import { getProposals } from '../api/governance';
import type { Proposal } from '../api/types';

const { Title } = Typography;

const ProposalHome: React.FC = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // 请求后端接口获取提案列表
    const fetchProposals = async () => {
        try {
            setLoading(true);
            // 调用 api
            const res = await getProposals();
            console.log("获取提案列表成功:", res)
            if (res && res) {
                setProposals(res.list);
            }
        } catch (error) {
            console.error("获取提案失败:", error);
            message.error("获取提案列表失败");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProposals();
    }, []);

    // 配置 Ant Design Table 的列
    const columns = [
        {
            title: '提案 ID',
            dataIndex: 'id',
            key: 'id',
            render: (text: string) => <b>#{text}</b>,
        },
        {
            title: '提案描述',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: '申请资金',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: string) => `${amount} Wei`, // 暂时直接展示 Wei
        },
        {
            title: '当前票数',
            dataIndex: 'votesFor',
            key: 'votesFor',
            render: (votes: string) => <Tag color="blue">{votes} 票</Tag>,
        },
        {
            title: '状态',
            key: 'executed',
            render: (_: any, record: Proposal) => (
                record.executed ? <Tag color="green">已执行</Tag> : <Tag color="orange">投票中</Tag>
            ),
        },
    ];

    return (
        <Card style={{ margin: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Title level={3}>DAO 治理提案看板</Title>
            <p style={{ color: 'gray', marginBottom: '20px' }}>在这里查看和参与社区的重要决策。</p>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Table
                    dataSource={proposals}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                />
            )}
        </Card>
    );
};

export default ProposalHome;
