import { Layout, Button, Switch, Flex, Typography, Badge, theme, Tooltip } from 'antd';
import {
    SafetyCertificateOutlined, MoonOutlined, SunOutlined,
    DisconnectOutlined, WalletOutlined, ThunderboltOutlined,
    KeyOutlined
} from '@ant-design/icons';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useAuth } from '../hooks/useAuth'; // 你的 JWT 登录 Hook

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

    // Wagmi 的状态
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();

    // 签名登录的状态
    const { handleLogin, logout, isLoggingIn, isAuthenticated } = useAuth();

    // 断开钱包 + 清除 JWT
    const handleFullLogout = () => {
        disconnect();
        logout();
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
                        {/* 领取勋章按钮：必须是 "有白名单资格" 且 "已签名登录" 才会显示 */}
                        {hasProof && isAuthenticated && (
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

                        {/* 签名登录按钮：已连接钱包，但还没获取到后端 JWT */}
                        {!isAuthenticated && (
                            <Button
                                type="primary"
                                onClick={handleLogin}
                                loading={isLoggingIn}
                                icon={<KeyOutlined />}
                                className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20"
                            >
                                {isLoggingIn ? '签名中...' : '签名登录'}
                            </Button>
                        )}

                        {/* 钱包地址展示区 (带红绿灯状态) */}
                        <div className={`px-4 py-1 rounded-full flex items-center gap-2 transition-colors ${
                            isDarkMode
                                ? 'text-white'
                                : 'text-black'
                        }`}>
                            <Badge
                                status={isAuthenticated ? "success" : "warning"}
                                color={isAuthenticated ? "#52c41a" : "#faad14"}
                            />
                            <Text code style={{ color: 'inherit', border: 'none', background: 'transparent' }}>
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </Text>
                        </div>

                        {/* 4. 退出按钮 */}
                        <Tooltip title={isAuthenticated ? "退出登录并断开" : "断开连接"}>
                            <Button
                                type="text"
                                danger
                                icon={<DisconnectOutlined />}
                                onClick={handleFullLogout}
                                className="hover:scale-110 transition-transform"
                            />
                        </Tooltip>
                    </Flex>
                ) : (
                    // 未连接钱包状态
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
