import { useState, useEffect, useCallback } from 'react'
import {
    Layout, Button, Card, Row, Col, Typography,
    Badge, Spin, Empty, ConfigProvider, theme, message, Switch, Flex
} from 'antd'
import {
    DisconnectOutlined, WalletOutlined, ReloadOutlined,
    SafetyCertificateOutlined, ExportOutlined, SunOutlined, MoonOutlined
} from '@ant-design/icons'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { getMedalsByAddress } from './api/medal'
import type { MedalInfo } from './api/types'

const { Header, Content, Footer } = Layout
const { Title, Text } = Typography

function App() {
    const { address, isConnected } = useAccount()
    const { connect } = useConnect()
    const { disconnect } = useDisconnect()
    const [medals, setMedals] = useState<MedalInfo[]>([])
    const [loading, setLoading] = useState(false)

    // 存储到本地进行持久化
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') !== 'light'
    })

    // 主题界面样式
    useEffect(() => {
        const root = window.document.documentElement
        if (isDarkMode) {
            root.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            root.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, [isDarkMode])

    const fetchMedals = useCallback(async (addr: string) => {
        setLoading(true)
        try {
            const res = await getMedalsByAddress(addr)
            setMedals(res.medals || [])
            if (res.medals?.length) {
                message.success(`已成功同步 ${res.medals.length} 枚勋章`)
            }
        } catch (err) {
            message.error("数据同步失败，请检查 API 服务状态")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (isConnected && address) {
            fetchMedals(address)
        } else {
            setMedals([])
        }
    }, [isConnected, address, fetchMedals])

    return (
        <ConfigProvider
            theme={{
                algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                token: {
                    colorPrimary: '#fadb14',
                    borderRadius: 16,
                    colorBgLayout: isDarkMode ? '#0a0a0a' : '#f8f9fa'
                },
            }}
        >
            <Layout className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#f8f9fa]'}`}>
                <Header
                    style={{ background: 'transparent' }}
                    className={`px-6 md:px-12 flex items-center justify-between sticky top-0 z-20 transition-all duration-300 border-b backdrop-blur-xl ${
                        isDarkMode ? 'bg-[#0a0a0a]/70 border-white/10' : 'bg-white/70 border-black/5'
                    }`}
                >
                    <Flex align="center" gap="middle">
                        <SafetyCertificateOutlined className="text-3xl text-yellow-500 drop-shadow-[0_0_8px_rgba(250,219,20,0.4)]" />
                        <Title level={4} className="!m-0 !font-black italic tracking-tighter" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                            COURSE DAO
                        </Title>
                    </Flex>

                    <Flex align="center" gap="large">
                        <Switch
                            checkedChildren={<MoonOutlined />}
                            unCheckedChildren={<SunOutlined />}
                            checked={isDarkMode}
                            onChange={setIsDarkMode}
                        />

                        {isConnected && (
                            <Button
                                type="text"
                                shape="circle"
                                icon={<ReloadOutlined spin={loading} />}
                                onClick={() => address && fetchMedals(address)}
                            />
                        )}

                        {isConnected ? (
                            <Flex align="center" gap="middle" className="hidden sm:flex">
                                <Badge status="processing" color="gold" text={
                                    <Text code className={`font-mono px-2 py-1 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`}>
                                        {address?.slice(0, 6)}...{address?.slice(-4)}
                                    </Text>
                                } />
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
                                size="large"
                                shape="round"
                                className="font-bold px-6"
                                icon={<WalletOutlined />}
                                onClick={() => connect({ connector: injected() })}
                            >
                                Connect Wallet
                            </Button>
                        )}
                    </Flex>
                </Header>

                <Content className="p-6 md:p-12 max-w-7xl mx-auto w-full">
                    {!isConnected ? (
                        <Flex vertical align="center" justify="center" className="py-40">
                            <Empty
                                image={<div className="text-8xl opacity-20 mb-4">🛡️</div>}
                                description={
                                    <Flex vertical gap="large">
                                        <div>
                                            <Title level={2}>验证您的成就</Title>
                                            <Text type="secondary" className="text-lg">连接钱包以访问存储在 ClickHouse 中的链上结业证明</Text>
                                        </div>
                                        <Button type="primary" size="large" shape="round" block onClick={() => connect({ connector: injected() })}>
                                            立即授权进入
                                        </Button>
                                    </Flex>
                                }
                            />
                        </Flex>
                    ) : (
                        <Spin spinning={loading} size="large">
                            <Flex justify="space-between" align="end" className="mb-12 border-b border-gray-500/10 pb-8">
                                <div>
                                    <Title level={1} className="!m-0">荣誉仓库</Title>
                                    <Text type="secondary" className="text-lg">已从 ClickHouse 同步最新数据</Text>
                                </div>
                                <Badge count={medals.length} showZero color="#fadb14">
                                    <div className={`px-4 py-2 rounded-xl font-bold ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`}>MEDALS</div>
                                </Badge>
                            </Flex>

                            {medals.length > 0 ? (
                                <Row gutter={[32, 32]}>
                                    {medals.map((item) => (
                                        <Col xs={24} sm={12} lg={8} key={item.tokenId}>
                                            <Card
                                                hoverable
                                                className={`border-none rounded-[2rem] transition-all hover:scale-[1.02] shadow-sm ${
                                                    isDarkMode ? 'bg-zinc-900/50' : 'bg-white'
                                                }`}
                                                actions={[
                                                    <Button
                                                        type="link"
                                                        icon={<ExportOutlined />}
                                                        href={`https://etherscan.io/tx/${item.txHash}`}
                                                        target="_blank"
                                                        className="font-bold"
                                                    >
                                                        区块详情
                                                    </Button>
                                                ]}
                                            >
                                                <Flex vertical gap="large">
                                                    <Flex justify="space-between">
                                                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-yellow-500/20">
                                                            🏆
                                                        </div>
                                                        <Text type="secondary" className="font-mono text-[10px] tracking-widest uppercase opacity-40">
                                                            Verified ID: {item.tokenId}
                                                        </Text>
                                                    </Flex>

                                                    <div>
                                                        <Title level={3} className="!mb-1 font-black">核心贡献勋章</Title>
                                                        <Text type="secondary">Course DAO 官方认证结业证明</Text>
                                                    </div>

                                                    <Flex vertical gap="small" className={`p-4 rounded-2xl ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}>
                                                        <Flex justify="space-between">
                                                            <Text className="text-[10px] uppercase font-bold text-gray-400">Transaction</Text>
                                                            <Text copyable={{ text: item.txHash }} className="font-mono text-xs opacity-80">
                                                                {item.txHash.slice(0, 8)}...
                                                            </Text>
                                                        </Flex>
                                                        <Flex justify="space-between">
                                                            <Text className="text-[10px] uppercase font-bold text-gray-400">Block Height</Text>
                                                            <Text className="font-mono text-xs font-bold">{item.blockNumber}</Text>
                                                        </Flex>
                                                    </Flex>
                                                </Flex>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <Empty description="您的仓库空空如也" className="py-40" />
                            )}
                        </Spin>
                    )}
                </Content>

                <Footer className="text-center py-12 bg-transparent opacity-30">
                    <Text className="font-mono text-[10px] tracking-[0.3em] uppercase">
                        Built with Go-Zero · ClickHouse · React · AntD 5
                    </Text>
                </Footer>
            </Layout>
        </ConfigProvider>
    )
}

export default App
