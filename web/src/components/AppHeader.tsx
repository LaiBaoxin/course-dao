import { Layout, Button, Switch, Flex, Typography, Badge, theme, Tooltip } from 'antd';
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

    const handleLogout = () => {
        disconnect();
    };

    return (
        <Header
            style={{
                background: isDarkMode ? '#0a0a0a' : '#ffffff',
                backdropFilter: 'blur(10px)',
                borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                padding: '0 32px',
                lineHeight: '64px',
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

                        <Tooltip title="断开连接并退出">
                            <Button
                                type="text"
                                danger
                                icon={<DisconnectOutlined />}
                                onClick={handleLogout}
                                className="hover:scale-110 transition-transform"
                            />
                        </Tooltip>
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
