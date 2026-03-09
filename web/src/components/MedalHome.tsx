import React from 'react';
import { Layout, Typography, Tag, Space, Divider, Spin, Flex, Alert } from 'antd';
import {
    SafetyCertificateOutlined,
    LockOutlined,
    RocketOutlined,
    TrophyTwoTone,
    CrownFilled,
    CodeOutlined,
    CheckCircleFilled
} from '@ant-design/icons';
import { AppHeader } from './AppHeader';
import { useMedal } from '../hooks/useMedal';
import { useAuth } from '../hooks/useAuth';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

interface MedalHomeProps {
    isDarkMode: boolean;
    setIsDarkMode: (v: boolean) => void;
}

export const MedalHome: React.FC<MedalHomeProps> = ({ isDarkMode, setIsDarkMode }) => {
    // 获取业务状态
    const { loading, proof, ownedMedals, handleClaim } = useMedal();
    // 获取登录状态
    const { isAuthenticated } = useAuth();

    // 状态推导
    const hasProof = proof && proof.length > 0;
    const hasMedal = ownedMedals && ownedMedals.length > 0;

    // 动态卡片样式 (适配暗黑/明亮模式)
    const cardBaseClass = `p-8 rounded-3xl border shadow-2xl transition-all duration-500 max-w-2xl w-full text-center relative overflow-hidden`;
    const themeClass = isDarkMode
        ? 'bg-gray-900 border-gray-800 shadow-yellow-900/10'
        : 'bg-white border-gray-100 shadow-yellow-500/10';

    return (
        <Layout className="min-h-screen bg-transparent">
            <AppHeader
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                isProcessing={loading}
                onClaim={handleClaim}
                hasProof={hasProof}
            />

            <Content className="p-8 relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">

                {/* 未登录 */}
                {!isAuthenticated && (
                    <div className={`${cardBaseClass} ${themeClass}`}>
                        <LockOutlined className="text-6xl text-gray-400 mb-6" />
                        <Title level={2} style={{ color: isDarkMode ? '#fff' : '#1f2937' }}>
                            受保护的 DAO 领地
                        </Title>
                        <Paragraph className="text-lg text-gray-500">
                            请先连接钱包并点击右上角「签名登录」，以验证您的身份并查看资产。
                        </Paragraph>
                    </div>
                )}

                {/* 已登录，正在请求数据 (Loading) */}
                {isAuthenticated && loading && !hasMedal && (
                    <div className={`${cardBaseClass} ${themeClass} py-20`}>
                        <Spin size="large" />
                        <p className="mt-4 text-gray-500">正在与区块链同步数据...</p>
                    </div>
                )}

                {/* 已登录，已拥有勋章 (成功领取后的展示) */}
                {isAuthenticated && hasMedal && (
                    <div className={`${cardBaseClass} ${themeClass} bg-gradient-to-br ${isDarkMode ? 'from-gray-900 to-yellow-900/20' : 'from-white to-yellow-50'} border-yellow-500/30`}>

                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-yellow-400 rounded-full blur-3xl opacity-20" />

                        <TrophyTwoTone twoToneColor="#fadb14" className="text-8xl mb-6 drop-shadow-lg" />

                        <Title level={1} style={{ color: isDarkMode ? '#fadb14' : '#d48806', margin: 0 }}>
                            <CrownFilled className="mr-2" />
                            创世勋章
                        </Title>

                        <Divider style={{ borderColor: isDarkMode ? '#424242' : '#e5e7eb' }}>
                            <Text type="secondary">YOUR ASSET</Text>
                        </Divider>

                        {ownedMedals.map((medal, idx) => (
                            <div key={idx} className={`p-6 rounded-2xl mb-4 text-left ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}>
                                <Space direction="vertical" className="w-full" size="middle">
                                    <Flex justify="space-between" align="center">
                                        <Text className="text-gray-500 font-bold">代币 ID</Text>
                                        <Tag color="gold" className="text-lg px-4 py-1 rounded-full font-mono">
                                            #{Number(medal.tokenId)}
                                        </Tag>
                                    </Flex>
                                    <Flex justify="space-between" align="center">
                                        <Text className="text-gray-500 font-bold">合约标准</Text>
                                        <Tag icon={<CodeOutlined />} color="blue">ERC-721</Tag>
                                    </Flex>
                                    <Flex justify="space-between" align="center">
                                        <Text className="text-gray-500 font-bold">特权状态</Text>
                                        <Tag icon={<CheckCircleFilled />} color="success">高级课程已解锁</Tag>
                                    </Flex>
                                </Space>
                            </div>
                        ))}
                    </div>
                )}

                {/* 已登录，未拥有勋章，但有白名单资格 (待领取) */}
                {isAuthenticated && !hasMedal && hasProof && (
                    <div className={`${cardBaseClass} ${themeClass} border-blue-500/30`}>
                        <div className="absolute top-0 left-0 -mt-10 -ml-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-20" />
                        <RocketOutlined className="text-7xl text-blue-500 mb-6" />
                        <Title level={2} style={{ color: isDarkMode ? '#fff' : '#1f2937' }}>
                            您在白名单中！
                        </Title>
                        <Paragraph className="text-lg text-gray-500 mb-6">
                            检测到您的地址具备 Course DAO 创世勋章的空投资格。
                        </Paragraph>
                        <Alert
                            message="点击右上角「领取勋章」按钮进行链上铸造"
                            type="info"
                            showIcon
                            className="text-left"
                        />
                    </div>
                )}

                {/* 已登录，既没有勋章，也没有白名单资格 */}
                {isAuthenticated && !hasMedal && !hasProof && !loading && (
                    <div className={`${cardBaseClass} ${themeClass}`}>
                        <SafetyCertificateOutlined className="text-6xl text-gray-400 mb-6" />
                        <Title level={3} style={{ color: isDarkMode ? '#fff' : '#1f2937' }}>
                            暂无空投资格
                        </Title>
                        <Paragraph className="text-gray-500">
                            您的当前地址未被包含在本次创世勋章的 Merkle 树中。<br/>
                            请继续关注社区后续的活动！
                        </Paragraph>
                    </div>
                )}

            </Content>
        </Layout>
    );
};
