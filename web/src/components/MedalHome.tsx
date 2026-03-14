import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Typography, Tag, Divider, Spin, Alert, Button, Flex, Modal, Descriptions, Tooltip } from 'antd';
import {
    LockOutlined,
    RocketOutlined,
    TrophyTwoTone,
    CrownFilled,
    CodeOutlined,
    PlayCircleOutlined,
    FireTwoTone,
    StarFilled,
    SafetyCertificateOutlined,
    ShoppingOutlined,
    InfoCircleOutlined,
    ExportOutlined
} from '@ant-design/icons';
import { useMedal } from '../hooks/useMedal';
import { useAuth } from '../hooks/useAuth';
import { getPremiumCourse, type PremiumCourseResp } from '../api/course';
import { getMedalDetailByTokenId } from '../api/medal.ts';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

interface MedalHomeProps {
    isDarkMode: boolean;
    setIsDarkMode: (v: boolean) => void;
}

// 新增：勋章完整详情数据接口
interface FullMedalDetail {
    name: string;
    description: string;
    image: string;
    createTime: string;
    txHash: string;
    level: number;
}

const TIER_CONFIGS: Record<number, any> = {
    0: { name: '青铜勋章', color: '#B87333', tagColor: 'orange', bgGradient: 'from-orange-900/10 to-transparent', icon: <TrophyTwoTone twoToneColor="#B87333" />, weight: 1 },
    1: { name: '白银勋章', color: '#A9A9A9', tagColor: 'default', bgGradient: 'from-gray-400/10 to-transparent', icon: <TrophyTwoTone twoToneColor="#A9A9A9" />, weight: 2 },
    2: { name: '黄金勋章', color: '#D4AF37', tagColor: 'gold', bgGradient: 'from-yellow-600/20 to-transparent', icon: <TrophyTwoTone twoToneColor="#fadb14" />, weight: 5 }
};

export const MedalHome: React.FC<MedalHomeProps> = ({ isDarkMode }) => {
    const { loading: loadingMedals, proof, ownedMedals } = useMedal();
    const { isAuthenticated } = useAuth();

    const [premiumData, setPremiumData] = useState<PremiumCourseResp | null>(null);
    const [loadingPremium, setLoadingPremium] = useState(false);
    const [medalLevel, setMedalLevel] = useState<number>(0);
    const [loadingLevel, setLoadingLevel] = useState(false);

    // 控制详情弹窗显示和存储详情数据
    const [fullDetail, setFullDetail] = useState<FullMedalDetail | null>(null);
    const [isDetailVisible, setIsDetailVisible] = useState(false);

    const hasProof = proof && proof.length > 0;
    const hasMedal = ownedMedals && ownedMedals.length > 0;

    const fetchPremiumContent = useCallback(async () => {
        setLoadingPremium(true);
        try {
            const response: any = await getPremiumCourse();
            const data = response.data ? response.data : response;
            setPremiumData(data);
        } catch (error: any) {
            console.log("err:", error)
        } finally {
            setLoadingPremium(false);
        }
    }, []);

    const fetchMedalDetail = useCallback(async () => {
        if (hasMedal && ownedMedals[0]) {
            setLoadingLevel(true);
            try {
                const tokenId = Number(ownedMedals[0].tokenId);
                const res: any = await getMedalDetailByTokenId(tokenId);
                const data = res.data ? res.data : res;
                if (data && typeof data.level !== 'undefined') {
                    setMedalLevel(Number(data.level));
                    setFullDetail(data);
                }
            } catch (e) {
                console.error("获取等级详情失败:", e);
            } finally {
                setLoadingLevel(false);
            }
        }
    }, [hasMedal, ownedMedals]);

    useEffect(() => {
        if (isAuthenticated && hasMedal) {
            fetchMedalDetail();
            fetchPremiumContent();
        }
    }, [isAuthenticated, hasMedal, fetchMedalDetail, fetchPremiumContent]);

    const currentTier = TIER_CONFIGS[medalLevel] || TIER_CONFIGS[0];

    const cardBaseClass = `p-8 rounded-3xl border shadow-2xl transition-all duration-500 max-w-2xl w-full text-center relative overflow-hidden`;
    const themeClass = isDarkMode
        ? 'bg-gray-900 border-gray-800 shadow-black/40'
        : 'bg-white border-gray-100 shadow-gray-200/50';

    return (
        <Layout className="min-h-screen bg-transparent">
            <Content className="p-8 relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">

                {/* 未登录 */}
                {!isAuthenticated && (
                    <div className={`${cardBaseClass} ${themeClass}`}>
                        <LockOutlined className="text-6xl text-gray-400 mb-6" />
                        <Title level={2} style={{ color: isDarkMode ? '#fff' : '#1f2937' }}>受保护的 DAO 领地</Title>
                        <Paragraph className="text-lg text-gray-500">请连接钱包并登录以解锁权益。</Paragraph>
                    </div>
                )}

                {isAuthenticated && (loadingMedals || loadingLevel) && !hasMedal && (
                    <div className={`${cardBaseClass} ${themeClass} py-20`}>
                        <Spin size="large" description="正在同步链上身份..." />
                    </div>
                )}

                {/* 已登录，已拥有勋章 */}
                {isAuthenticated && hasMedal && !loadingLevel && (
                    <div className={`${cardBaseClass} ${themeClass} bg-gradient-to-br ${currentTier.bgGradient} border-opacity-30`}
                         style={{ borderColor: currentTier.color }}>

                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ backgroundColor: currentTier.color }} />

                        {/* 详情 */}
                        <div
                            className="mb-6 drop-shadow-xl inline-block transform hover:scale-110 cursor-pointer transition-transform duration-300"
                            style={{ fontSize: '80px' }}
                            onClick={() => setIsDetailVisible(true)}
                        >
                            {currentTier.icon}
                        </div>

                        <Title level={1} style={{ color: currentTier.color, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            {medalLevel === 2 ? <CrownFilled /> : <StarFilled />}
                            {fullDetail?.name || currentTier.name}
                        </Title>

                        <div className="mt-8 flex justify-center gap-4">
                            <Tag color={currentTier.tagColor} className="text-base px-4 py-1 rounded-full font-mono font-bold">
                                Hash: {ownedMedals[0].txHash ? `${ownedMedals[0].txHash.slice(0, 6)}...${ownedMedals[0].txHash.slice(-4)}` : 'N/A'}
                            </Tag>
                            <Tag icon={<CodeOutlined />} color="blue" className="text-base px-4 py-1 rounded-full">
                                权重: {currentTier.weight} 票
                            </Tag>
                        </div>
                        <Divider style={{ borderColor: isDarkMode ? '#424242' : '#e5e7eb', marginTop: '32px' }}>
                            <Text type="secondary" className="tracking-widest text-sm uppercase"><FireTwoTone twoToneColor="#eb2f96" className="mr-2" />会员专属特权</Text>
                        </Divider>

                        {loadingPremium ? (
                            <Spin description="正在解析高级资源..." />
                        ) : premiumData ? (
                            <div className={`p-6 rounded-2xl text-left transition-all ${isDarkMode ? 'bg-black/40 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
                                <Flex vertical gap="small">
                                    <Text className="text-gray-500 font-bold uppercase text-[10px]">Premium Unlock</Text>
                                    <Title level={4} style={{ color: isDarkMode ? '#fff' : '#000', margin: 0 }}>{premiumData.title}</Title>
                                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex justify-between items-center">
                                        <Text style={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}><PlayCircleOutlined className="mr-2" /> 绝密视频课程已就绪</Text>
                                        <Button type="primary" icon={<PlayCircleOutlined />} href={premiumData.video_url} target="_blank" className="bg-indigo-600 border-none">立即播放</Button>
                                    </div>
                                </Flex>
                            </div>
                        ) : (
                            <Alert type="warning" title="未能识别特权数据" showIcon />
                        )}
                    </div>
                )}

                {/* 已登录，未拥有勋章，但有白名单资格 (待领取) */}
                {isAuthenticated && !hasMedal && hasProof && !loadingMedals && (
                    <div className={`${cardBaseClass} ${themeClass} border-blue-500/30`}>
                        <RocketOutlined className="text-7xl text-blue-500 mb-6 animate-bounce" />
                        <Title level={2} style={{ color: isDarkMode ? '#fff' : '#1f2937' }}>您有勋章待领取！</Title>
                        <Alert title="检测到白名单，请前往「领取勋章」进行铸造。" type="info" showIcon />
                    </div>
                )}

                {/* 已登录，既没有勋章，也没有白名单资格 */}
                {isAuthenticated && !loadingMedals && !hasMedal && !hasProof && (
                    <div className={`${cardBaseClass} ${themeClass}`}>
                        <SafetyCertificateOutlined className="text-6xl text-gray-400 mb-6 opacity-50" />
                        <Title level={3} style={{ color: isDarkMode ? '#fff' : '#1f2937' }}>暂无勋章资产</Title>
                        <Paragraph className="text-gray-500 px-10">
                            当前地址尚未持有勋章。您可以前往治理看板购买身份，或者参与社区活动获取白名单资格。
                        </Paragraph>
                        <Button
                            type="primary"
                            size="large"
                            icon={<ShoppingOutlined />}
                            onClick={() => window.location.href = '/governance'}
                            style={{ borderRadius: '12px', marginTop: '12px', height: '50px', fontWeight: 'bold' }}
                        >
                            前往申购勋章身份
                        </Button>
                    </div>
                )}

                {/* 勋章存证详情弹窗组件 */}
                <Modal
                    title={<Title level={4} style={{ margin: 0 }}>勋章链上存证详情</Title>}
                    open={isDetailVisible}
                    onCancel={() => setIsDetailVisible(false)}
                    footer={[
                        <Button key="close" onClick={() => setIsDetailVisible(false)}>
                            返回
                        </Button>,
                        <Button
                            key="explorer"
                            type="primary"
                            icon={<ExportOutlined />}
                            href={`https://etherscan.io/tx/${fullDetail?.txHash}`}
                            target="_blank"
                        >
                            浏览器查看
                        </Button>
                    ]}
                    centered
                    width={500}
                >
                    {fullDetail ? (
                        <div className="py-2">
                            <Flex justify="center" className="mb-6">
                                <div style={{
                                    fontSize: '60px',
                                    padding: '24px',
                                    background: isDarkMode ? '#1a1a1a' : '#f9f9f9',
                                    borderRadius: '50%',
                                    border: `2px solid ${currentTier.color}20`
                                }}>
                                    {currentTier.icon}
                                </div>
                            </Flex>
                            <Descriptions bordered column={1} size="small" labelStyle={{ width: '120px', fontWeight: 'bold' }}>
                                <Descriptions.Item label="勋章名称">{fullDetail.name}</Descriptions.Item>
                                <Descriptions.Item label="等级权重">
                                    <Tag color={currentTier.tagColor}>{currentTier.name}</Tag>
                                    <Text type="secondary" size="small">投票权重: {currentTier.weight}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="勋章简介">{fullDetail.description}</Descriptions.Item>
                                <Descriptions.Item label="铸造时间">{fullDetail.createTime}</Descriptions.Item>
                                <Descriptions.Item label="交易哈希">
                                    <Text copyable className="font-mono text-xs" style={{ wordBreak: 'break-all' }}>
                                        {fullDetail.txHash}
                                    </Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    ) : (
                        <div className="py-10 text-center"><Spin description="正在调取存证数据..." /></div>
                    )}
                </Modal>

            </Content>
        </Layout>
    );
};
