import { Layout, Button, Switch, Flex, Typography, Badge, theme, Tooltip, Menu } from 'antd';
import {
    SafetyCertificateOutlined, SunOutlined,
    DisconnectOutlined, WalletOutlined, ThunderboltOutlined,
    KeyOutlined, BankOutlined, TrophyOutlined
} from '@ant-design/icons';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useAuth } from '../hooks/useAuth';

const { Header } = Layout;
const { Title, Text } = Typography;

interface AppHeaderProps {
    isDarkMode: boolean;
    setIsDarkMode: (v: boolean) => void;
    isProcessing: boolean;
    onClaim: () => void;
    hasProof: boolean;
    // 3. 新增这两个 Prop 用于控制导航状态
    currentTab: string;
    onTabChange: (tab: string) => void;
}

export const AppHeader = ({
                              isDarkMode, setIsDarkMode, isProcessing, onClaim, hasProof,
                              currentTab, onTabChange // 解构拿出来
                          }: AppHeaderProps) => {
    const { token } = theme.useToken();

    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();

    const { handleLogin, logout, isLoggingIn, isAuthenticated } = useAuth();

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
            <Flex align="center" gap="small" style={{ width: '250px' }}>
                <SafetyCertificateOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
                <Title level={4} style={{ margin: 0, fontWeight: 900, fontStyle: 'italic', color: isDarkMode ? '#ffffff' : '#000000' }}>
                    COURSE DAO
                </Title>
            </Flex>

            {/* 导航菜单区 */}
            <Menu
                mode="horizontal"
                selectedKeys={[currentTab]}
                onClick={(e) => onTabChange(e.key)}
                theme={isDarkMode ? 'dark' : 'light'}
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    background: 'transparent',
                    borderBottom: 'none',
                    fontSize: '16px',
                    fontWeight: 500,
                }}
                items={[
                    { key: 'medal', icon: <TrophyOutlined />, label: '我的勋章' },
                    { key: 'governance', icon: <BankOutlined />, label: 'DAO 治理' }
                ]}
            />

            {/* 操作区*/}
            <Flex align="center" gap="large" justify="flex-end" style={{ width: 'auto', minWidth: '250px' }}>
                <Switch
                    checkedChildren={<TrophyOutlined />}
                    unCheckedChildren={<SunOutlined />}
                    checked={isDarkMode}
                    onChange={setIsDarkMode}
                />

                {isConnected ? (
                    <Flex align="center" gap="middle">
                        {hasProof && isAuthenticated && (
                            <Button type="primary" loading={isProcessing} onClick={onClaim} icon={<ThunderboltOutlined />} className="shadow-lg shadow-yellow-500/20">
                                {isProcessing ? '处理中...' : '领取勋章'}
                            </Button>
                        )}

                        {!isAuthenticated && (
                            <Button type="primary" onClick={handleLogin} loading={isLoggingIn} icon={<KeyOutlined />} className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20">
                                {isLoggingIn ? '签名中...' : '签名登录'}
                            </Button>
                        )}

                        <div className={`px-4 py-1 rounded-full flex items-center gap-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            <Badge status={isAuthenticated ? "success" : "warning"} color={isAuthenticated ? "#52c41a" : "#faad14"} />
                            <Text code style={{ color: 'inherit', border: 'none', background: 'transparent' }}>
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </Text>
                        </div>

                        <Tooltip title={isAuthenticated ? "退出登录并断开" : "断开连接"}>
                            <Button type="text" danger icon={<DisconnectOutlined />} onClick={handleFullLogout} className="hover:scale-110 transition-transform" />
                        </Tooltip>
                    </Flex>
                ) : (
                    <Button type="primary" shape="round" icon={<WalletOutlined />} onClick={() => connect({ connector: injected() })}>
                        Connect Wallet
                    </Button>
                )}
            </Flex>
        </Header>
    );
};
