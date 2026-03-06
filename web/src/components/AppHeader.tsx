import { Layout, Button, Switch, Flex, Typography, Badge, theme } from 'antd';
import {
    SafetyCertificateOutlined, MoonOutlined, SunOutlined,
    DisconnectOutlined, WalletOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

const { Header } = Layout;
const { Title, Text } = Typography;

interface AppHeaderProps {
    isDarkMode: boolean;
    setIsDarkMode: (v: boolean) => void;
    isProcessing: boolean;
    onClaim: () => void;
    hasProof: boolean;
}

export const AppHeader = ({ isDarkMode, setIsDarkMode, isProcessing, onClaim, hasProof }: AppHeaderProps) => {
    const { token } = theme.useToken();
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();

    return (
        <Header
            style={{
                background: isDarkMode ? '#0a0a0a' : '#ffffff',
                backdropFilter: 'blur(10px)',
                // 2. 边框：白天淡淡的灰色边框，黑夜细微的亮色边框，实现与内容的对比
                borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                padding: '0 32px',
                lineHeight: '64px',
                // 3. 增加一点点阴影让它浮在页面上
                boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.02)'
            }}
            className="sticky top-0 z-50 flex items-center justify-between transition-all duration-300"
        >
            {/* Logo 区 */}
            <Flex align="center" gap="small">
                <SafetyCertificateOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
                <Title
                    level={4}
                    style={{
                        margin: 0,
                        fontWeight: 900,
                        fontStyle: 'italic',
                        // 🛠️ 修复：Logo 颜色白天黑，黑夜白
                        color: isDarkMode ? '#ffffff' : '#000000'
                    }}
                >
                    COURSE DAO
                </Title>
            </Flex>

            {/* 操作区 */}
            <Flex align="center" gap="large">
                <Switch
                    checkedChildren={<MoonOutlined />}
                    unCheckedChildren={<SunOutlined />}
                    checked={isDarkMode}
                    onChange={setIsDarkMode}
                />

                {isConnected ? (
                    <Flex align="center" gap="middle">
                        {hasProof && (
                            <Button
                                type="primary"
                                loading={isProcessing}
                                onClick={onClaim}
                                icon={<ThunderboltOutlined />}
                                className="shadow-lg shadow-yellow-500/20"
                            >
                                {isProcessing ? '处理中...' : '领取勋章'}
                            </Button>
                        )}

                        {/* 4. 钱包地址容器：白天浅灰背景+黑字，黑夜深色背景+白字 */}
                        <div className={`px-4 py-1 rounded-full border flex items-center gap-2 transition-colors ${
                            isDarkMode
                                ? 'bg-white/5 border-white/10 text-white'
                                : 'bg-black/5 border-black/5 text-black'
                        }`}>
                            <Badge status="processing" color="#fadb14" />
                            <Text code style={{ color: 'inherit', border: 'none', background: 'transparent' }}>
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </Text>
                        </div>

                        <Button
                            type="text"
                            danger
                            icon={<DisconnectOutlined />}
                            onClick={() => disconnect()}
                        />
                    </Flex>
                ) : (
                    <Button
                        type="primary"
                        shape="round"
                        icon={<WalletOutlined />}
                        onClick={() => connect({ connector: injected() })}
                    >
                        Connect Wallet
                    </Button>
                )}
            </Flex>
        </Header>
    );
};
