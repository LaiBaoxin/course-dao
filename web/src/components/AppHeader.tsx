import { Layout, Button, Switch, Flex, Typography, Badge, theme } from 'antd'
import {
    SafetyCertificateOutlined, MoonOutlined, SunOutlined,
    DisconnectOutlined, WalletOutlined, ThunderboltOutlined
} from '@ant-design/icons'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

const { Header } = Layout
const { Title, Text } = Typography

interface AppHeaderProps {
    isDarkMode: boolean
    setIsDarkMode: (v: boolean) => void
    isProcessing: boolean
    onClaim: () => void
    hasProof: boolean
}

export const AppHeader = ({ isDarkMode, setIsDarkMode, isProcessing, onClaim, hasProof }: AppHeaderProps) => {
    // 使用 Antd 的 Token，这样背景色会自动跟随主题变化
    const { token } = theme.useToken()
    const { address, isConnected } = useAccount()
    const { connect } = useConnect()
    const { disconnect } = useDisconnect()

    return (
        <Header
            style={{
                // 关键点 1：使用 Token 动态获取背景色，并增加透明度实现毛玻璃
                background: isDarkMode ? 'rgba(10, 10, 10, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                padding: '0 24px',
                lineHeight: '64px', // 确保内容垂直居中
            }}
            className="sticky top-0 z-50 flex items-center justify-between"
        >
            {/* Logo 区 */}
            <Flex align="center" gap="small">
                <SafetyCertificateOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
                <Title level={4} style={{ margin: 0, fontWeight: 900, fontStyle: 'italic' }}>
                    COURSE DAO
                </Title>
            </Flex>

            {/* 操作区 */}
            <Flex align="center" gap="middle">
                {/* 亮暗模式切换 */}
                <Switch
                    checkedChildren={<MoonOutlined />}
                    unCheckedChildren={<SunOutlined />}
                    checked={isDarkMode}
                    onChange={setIsDarkMode}
                />

                {isConnected ? (
                    <Flex align="center" gap="middle">
                        {/* 只有在有 Proof 时才显示的领取按钮 */}
                        {hasProof && (
                            <Button
                                type="primary"
                                loading={isProcessing}
                                onClick={onClaim}
                                icon={<ThunderboltOutlined />}
                                className="shadow-lg shadow-yellow-500/20"
                            >
                                {isProcessing ? '领取中...' : '领取勋章'}
                            </Button>
                        )}
                        <Badge
                            status="processing"
                            color="gold"
                            text={<Text code>{address?.slice(0, 6)}...{address?.slice(-4)}</Text>}
                        />
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
    )
}
