import React, { useState } from 'react';
import {
    Layout, Button, Typography, Empty, Tag, Tooltip, Space,
    Badge, Row, Col, Card, Flex, Modal, Descriptions, message
} from 'antd';
import {
    TrophyFilled, WalletOutlined, ExportOutlined, VerifiedOutlined,
    SafetyCertificateFilled, CreditCardOutlined, InfoCircleOutlined,
    ClockCircleOutlined, BlockOutlined, LogoutOutlined // 🛠️ 增加退出图标
} from '@ant-design/icons';
import { useMedal } from '../hooks/useMedal';
import { getMedalDetailByTokenId } from '../api/medal';
import { useDisconnect } from 'wagmi';

const { Content, Header } = Layout;
const { Title, Text } = Typography;

export const MedalHome: React.FC<{ isDarkMode: boolean; setIsDarkMode: (v: boolean) => void }> = ({ isDarkMode, setIsDarkMode }) => {
    const { account, ownedMedals, proof, claimId, loading, connectWallet, handleClaim } = useMedal();
    const { disconnect } = useDisconnect();

    // --- 详情弹窗状态 ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState<any>(null);

    // 动态样式
    const themeBg = isDarkMode ? '#0a0a0a' : '#ffffff';
    const contentBg = isDarkMode ? '#050505' : '#f8f9fa';
    const textColor = isDarkMode ? '#ffffff' : '#000000';
    const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

    // 获取详情并弹窗
    const handleCardClick = async (tokenId: number) => {
        try {
            setDetailLoading(true);
            const data = await getMedalDetailByTokenId(tokenId);
            setDetailData(data);
            setIsModalOpen(true);
        } catch (err) {
            message.error("无法调取勋章档案，请稍后重试");
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <Layout className="min-h-screen transition-all duration-500">
            <Header
                style={{
                    background: themeBg,
                    borderBottom: `1px solid ${borderColor}`,
                    boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(0,0,0,0.02)'
                }}
                className="px-8 md:px-16 flex items-center justify-between sticky top-0 z-50 transition-all"
            >
                <Flex align="center" gap="small">
                    <TrophyFilled className="text-2xl text-yellow-500 drop-shadow-sm" />
                    <Title level={4} style={{ color: textColor }} className="!m-0 font-black tracking-tighter uppercase italic">
                        COURSE DAO
                    </Title>
                </Flex>

                <Space size="large">
                    <Button
                        type="text" shape="circle" size="large"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        icon={isDarkMode ? <span className="text-xl">🌙</span> : <span className="text-xl">☀️</span>}
                    />
                    {account ? (
                        <Flex align="center" gap="middle">
                            <div className={`px-4 py-1.5 rounded-2xl flex items-center gap-2 transition-colors ${
                                isDarkMode ? 'text-white' : 'text-black'
                            }`}>
                                <Badge status="processing" color="#fadb14" />
                                <Text strong className="font-mono text-xs opacity-80" style={{ color: 'inherit' }}>
                                    {account.slice(0, 8)}...{account.slice(-8)}
                                </Text>
                            </div>

                            <Tooltip title="断开连接 / 切换钱包">
                                <Button
                                    type="text"
                                    danger
                                    shape="circle"
                                    icon={<LogoutOutlined />}
                                    onClick={() => disconnect?.()} // 调用 wagmi 断开逻辑
                                />
                            </Tooltip>
                        </Flex>
                    ) : (
                        <Button type="primary" shape="round" icon={<WalletOutlined />} onClick={connectWallet} className="h-10 px-6 font-bold">
                            Connect Wallet
                        </Button>
                    )}
                </Space>
            </Header>

            <Content style={{ background: contentBg }} className="p-8 md:p-16 transition-colors duration-500">
                <div className="max-w-[1440px] mx-auto">
                    {!account ? (
                        <Flex vertical align="center" justify="center" style={{ minHeight: '65vh' }}>
                            <div className="relative mb-10">
                                <div className="absolute inset-0 bg-yellow-400 blur-[100px] opacity-10 rounded-full"></div>
                                <div className="relative text-9xl"><CreditCardOutlined /></div>
                            </div>
                            <Title level={2} style={{ color: textColor }}>连接钱包以查阅荣誉</Title>
                            <Text type="secondary" className="text-lg mb-10">您的链上勋章已准备就绪，授权钱包即可解锁仓库</Text>
                            <Button type="primary" size="large" onClick={connectWallet} className="h-14 px-12 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-transform">Connect Wallet</Button>
                        </Flex>
                    ) : (
                        <div className="space-y-16">
                            <Flex justify="space-between" align="end" className="border-b border-gray-500/10 pb-12 pt-8">
                                <div><Title style={{ color: textColor }} className="!m-0 !mb-2">勋章仓库</Title><Text type="secondary" className="text-lg opacity-60">基于区块链存证的社区贡献荣誉展厅</Text></div>
                                <Tag color="gold" icon={<VerifiedOutlined />} className="px-4 py-1.5 rounded-xl font-bold border-none shadow-sm">WHITELISTED</Tag>
                            </Flex>

                            {/* 申领 Banner */}
                            {proof.length > 0 && (
                                <div className="p-12 md:p-20 mt-6 rounded-[4rem] bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white shadow-2xl relative overflow-hidden group">
                                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12 text-center lg:text-left">
                                        <div>
                                            <Title level={1} className="!text-white !m-0 mb-4 tracking-tight">🎉 您有待领取的荣誉！</Title>
                                            <Text className="text-white/80 text-xl block">检测到您的白名单身份，可立即申领 Course DAO #{claimId} 号核心勋章。</Text>
                                        </div>
                                        <Button
                                            size="large"
                                            loading={loading}
                                            onClick={handleClaim} // 确保这里绑定了 useMedal 导出的方法
                                            className="h-16 px-14 rounded-2xl border-none bg-white text-indigo-700 font-black text-xl hover:scale-105 transition-all shadow-2xl"
                                        >
                                            {loading ? '铸造中...' : '立即铸造 (CLAIM)'}
                                        </Button>
                                    </div>
                                    <SafetyCertificateFilled className="absolute -right-16 -bottom-16 text-[22rem] opacity-10 rotate-12" />
                                </div>
                            )}

                            {/* 勋章列表网格 */}
                            <div>
                                <Title level={4} style={{ color: textColor }} className="p-4 w-full uppercase tracking-widest text-[10px] opacity-50">我的藏品清单 ({ownedMedals.length})</Title>
                                {ownedMedals.length > 0 ? (
                                    <Row gutter={[32, 32]}>
                                        {ownedMedals.map((m, idx) => (
                                            <Col xs={24} sm={12} lg={8} xl={6} key={idx}>
                                                <Card
                                                    hoverable
                                                    loading={detailLoading}
                                                    onClick={() => handleCardClick(m.tokenId)}
                                                    className={`border-none mt-4 rounded-[3rem] transition-all hover:-translate-y-4 ${
                                                        isDarkMode ? 'bg-zinc-900/40 shadow-2xl border border-white/5' : 'bg-white shadow-xl shadow-gray-200/50 border border-black/5'
                                                    }`}
                                                    cover={
                                                        <div className={`h-60 flex items-center justify-center rounded-t-[3rem] relative overflow-hidden border-b transition-colors duration-500 ${isDarkMode ? 'bg-[#111] border-white/5' : 'bg-white border-black/5'}`}>
                                                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-yellow-400/10 to-transparent blur-2xl"></div>
                                                            <div className="font-black mt-12 ml-4 italic tracking-tighter uppercase select-none transform -rotate-6 group-hover:rotate-0 duration-500">
                                                                <span className={`text-5xl ${isDarkMode ? 'text-white' : 'text-black'}`} style={{ textShadow: isDarkMode ? '0 4px 12px rgba(255,255,255,0.1)' : '0 4px 12px rgba(0,0,0,0.05)' }}>COU</span>
                                                                <span className="text-7xl bg-gradient-to-tr from-yellow-400 to-orange-500 bg-clip-text text-transparent">RSE</span>
                                                            </div>
                                                        </div>
                                                    }
                                                >
                                                    <Flex justify="space-between" align="end">
                                                        <Space direction="vertical" size={0}>
                                                            <Text strong className="mt-6 text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1 block">NFT TOKEN ID</Text>
                                                            <Title level={3} style={{ color: textColor }} className="!m-0 font-black italic">#{m.tokenId}</Title>
                                                        </Space>
                                                        <Tooltip title="点击查看档案详情">
                                                            <Button type="text" shape="circle" icon={<InfoCircleOutlined className="text-xl opacity-20" />} />
                                                        </Tooltip>
                                                    </Flex>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                ) : (
                                    <div className="py-32 text-center border-2 border-dashed border-gray-500/10 rounded-[4rem] opacity-60"><Empty description={<Text type="secondary" className="text-lg">暂无勋章记录，快去参与社区建设吧！</Text>} /></div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Content>

            {/* 勋章详情 */}
            <Modal
                title={null}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
                width={500}
                styles={{ body: { padding: 0, overflow: 'hidden', borderRadius: '24px' } }}
            >
                {detailData && (
                    <div className={isDarkMode ? 'bg-[#111] text-white' : 'bg-white text-black'}>
                        <div className="h-44 bg-gradient-to-tr from-indigo-600 to-purple-800 flex items-center justify-center relative overflow-hidden">
                            <TrophyFilled className="text-9xl text-white/10 absolute -right-4 -bottom-4 rotate-12" />
                            <div className="z-10 bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-2xl">
                                <TrophyFilled className="text-5xl text-yellow-400 drop-shadow-lg" />
                            </div>
                        </div>
                        <div className="p-8">
                            <Flex justify="space-between" align="center" className="mb-4">
                                <Title level={3} style={{ color: 'inherit', margin: 0 }}>{detailData.name}</Title>
                                <Tag color="gold" className="m-0 px-3 py-0.5 rounded-lg border-none font-bold uppercase text-[10px]">{detailData.type}</Tag>
                            </Flex>
                            <Text className="block mb-8 opacity-70 italic leading-relaxed">"{detailData.description}"</Text>
                            <Descriptions column={1} bordered size="small" className={isDarkMode ? 'dark-descriptions' : ''}>
                                <Descriptions.Item label={<Space><ClockCircleOutlined /> 铸造时间</Space>}><Text strong style={{ color: 'inherit' }}>{detailData.createTime}</Text></Descriptions.Item>
                                <Descriptions.Item label={<Space><BlockOutlined /> 链上哈希</Space>}><a href={`https://sepolia.etherscan.io/tx/${detailData.txHash}`} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1 font-mono text-xs">{detailData.txHash?.slice(0, 16)}... <ExportOutlined className="text-[10px]" /></a></Descriptions.Item>
                            </Descriptions>
                            <Button block type="primary" size="large" className="mt-10 h-14 rounded-2xl font-black text-lg shadow-xl" onClick={() => setIsModalOpen(false)}>确认阅览</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
};
