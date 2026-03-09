import React, { useEffect, useState } from 'react';
import { Layout, Typography, Tag, Space, Divider, Spin, Alert, Button, message } from 'antd';
import {
    SafetyCertificateOutlined,
    LockOutlined,
    RocketOutlined,
    TrophyTwoTone,
    CrownFilled,
    CodeOutlined,
    PlayCircleOutlined,
    FireTwoTone
} from '@ant-design/icons';
import { AppHeader } from './AppHeader';
import { useMedal } from '../hooks/useMedal';
import { useAuth } from '../hooks/useAuth';
import {getPremiumCourse, type PremiumCourseResp} from '../api/course';

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

    const [premiumData, setPremiumData] = useState<PremiumCourseResp | null>(null);
    const [loadingPremium, setLoadingPremium] = useState(false);

    useEffect(() => {
        // 已登录 且 已经拥有勋章时才获取
        if (isAuthenticated && hasMedal) {
            fetchPremiumContent();
        }
    }, [isAuthenticated, hasMedal]);

    const fetchPremiumContent = async () => {
        setLoadingPremium(true);
        try {
            const response: any = await getPremiumCourse();
            // 兼容可能存在的 data 包装层
            const data = response.data ? response.data : response;
            setPremiumData(data);
        } catch (error: any) {
            console.error("获取高级内容失败:", error);
            // 如果后端返回 403 拦截，这里可以捕获到
            if (error?.response?.status === 403) {
                message.error("权限不足：暂未检测到链上勋章确认。");
            }
        } finally {
            setLoadingPremium(false);
        }
    };

    // 动态卡片样式
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
                            请先连接钱包并点击右上角「签名登录」，以验证您的身份并解锁特权。
                        </Paragraph>
                    </div>
                )}

                {/* 已登录，正在请求数据 (Loading) */}
                {isAuthenticated && loading && !hasMedal && (
                    <div className={`${cardBaseClass} ${themeClass} py-20`}>
                        <Spin size="large" />
                        <p className="mt-4 text-gray-500">正在与区块链同步资产数据...</p>
                    </div>
                )}

                {/* 已登录，已拥有勋章*/}
                {isAuthenticated && hasMedal && (
                    <div className={`${cardBaseClass} ${themeClass} bg-gradient-to-br ${isDarkMode ? 'from-gray-900 to-yellow-900/20' : 'from-white to-yellow-50'} border-yellow-500/30`}>

                        {/* 装饰性背景光晕 */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-yellow-400 rounded-full blur-3xl opacity-20" />

                        <TrophyTwoTone twoToneColor="#fadb14" className="text-8xl mb-6 drop-shadow-lg" />

                        <Title level={1} style={{ color: isDarkMode ? '#fadb14' : '#d48806', margin: 0 }}>
                            <CrownFilled className="mr-2" />
                            创世勋章
                        </Title>

                        {/* 资产基础信息 */}
                        <div className="mt-8 flex justify-center gap-4">
                            <Tag color="gold" className="text-base px-4 py-1 rounded-full font-mono">
                                ID #{Number(ownedMedals[0].tokenId)}
                            </Tag>
                            <Tag icon={<CodeOutlined />} color="blue" className="text-base px-4 py-1 rounded-full">
                                ERC-721
                            </Tag>
                        </div>

                        <Divider style={{ borderColor: isDarkMode ? '#424242' : '#e5e7eb', marginTop: '32px' }}>
                            <Text type="secondary" className="tracking-widest text-sm">
                                <FireTwoTone twoToneColor="#eb2f96" className="mr-2" />
                                勋章专属权益
                            </Text>
                        </Divider>

                        {loadingPremium ? (
                            <Spin tip="正在解密高级资源..." />
                        ) : premiumData ? (
                            <div className={`p-6 rounded-2xl text-left transition-all ${isDarkMode ? 'bg-black/40 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
                                <Space direction="vertical" className="w-full" size="small">
                                    <Text className="text-gray-500 font-bold uppercase text-xs">Premium Content</Text>
                                    <Title level={4} style={{ color: isDarkMode ? '#fff' : '#000', margin: 0 }}>
                                        {premiumData.title}
                                    </Title>
                                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex justify-between items-center">
                                        <Text style={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}>
                                            绝密视频已解锁
                                        </Text>
                                        <Button
                                            type="primary"
                                            icon={<PlayCircleOutlined />}
                                            href={premiumData.video_url}
                                            target="_blank"
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 border-none hover:scale-105 transition-transform"
                                        >
                                            立即播放
                                        </Button>
                                    </div>
                                </Space>
                            </div>
                        ) : (
                            <Alert type="error" message="未能获取特权数据，请稍后重试" />
                        )}

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
                            message="点击右上角「领取勋章」按钮进行链上铸造，即可解锁高级课程。"
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
