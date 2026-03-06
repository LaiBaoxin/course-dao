import { useState, useEffect, useCallback } from 'react'
import {
    Layout, Button, Card, Row, Col, Typography,
    Badge, Spin, Empty, ConfigProvider, theme, Switch, Flex, App as AntdApp
} from 'antd'
import {
    DisconnectOutlined, WalletOutlined,
    SafetyCertificateOutlined, SunOutlined, MoonOutlined,
    ThunderboltOutlined
} from '@ant-design/icons'
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { getMedalsByAddress } from './api/medal'
import { CONTRACT_ADDRESS, MEDAL_ABI } from './api/contract'
import type { MedalInfo } from './api/types'

const { Header, Content } = Layout
const { Title, Text } = Typography

const MedalHome = () => {
    const { address, isConnected } = useAccount()
    const { connect } = useConnect()
    const { disconnect } = useDisconnect()
    const [medals, setMedals] = useState<MedalInfo[]>([])
    const [loading, setLoading] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light')

    const { notification: antdNotify } = AntdApp.useApp()

    const { data: hash, writeContract, isPending: isMinting } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

    const isProcessing = isMinting || isConfirming

    useEffect(() => {
        const root = window.document.documentElement
        isDarkMode ? root.classList.add('dark') : root.classList.remove('dark')
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    }, [isDarkMode])

    const fetchMedals = useCallback(async (addr: string) => {
        setLoading(true)
        try {
            const res = await getMedalsByAddress(addr)
            setMedals(res.medals || [])
        } catch (err) {
            antdNotify.error({
                description: '请检查网络连接并稍后再试',
                placement: 'bottomRight',
            })
            console.error("Fetch Error:", err)
        } finally {
            setLoading(false)
        }
    }, [])

    const handleMint = () => {
        if (!address) return
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: MEDAL_ABI,
            functionName: 'safeMint',
            args: [address],
        })
    }

    useEffect(() => {
        if (isConfirmed && address) {
            antdNotify.success({
                description: '交易已上链，正在从 ClickHouse 同步数据...',
                placement: 'bottomRight',
            })
            // 交易成功后延迟刷新数据
            setTimeout(() => fetchMedals(address), 3000)
        }
    }, [isConfirmed, address, fetchMedals, antdNotify])

    useEffect(() => {
        if (isConnected && address) fetchMedals(address)
        else setMedals([])
    }, [isConnected, address, fetchMedals])

    return (
        <Layout className={`min-h-screen flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#f8f9fa]'}`}>
            <Header style={{ background: 'transparent' }} className={`px-6 md:px-12 flex items-center justify-between sticky top-0 z-20 border-b backdrop-blur-xl ${isDarkMode ? 'bg-[#0a0a0a]/70 border-white/10' : 'bg-white/70 border-black/5'}`}>
                <Flex align="center" gap="middle">
                    <SafetyCertificateOutlined className="text-3xl text-yellow-500" />
                    <Title level={4} className="!m-0 font-black italic tracking-tighter">COURSE DAO</Title>
                </Flex>

                <Flex align="center" gap="large">
                    <Switch checkedChildren={<MoonOutlined />} unCheckedChildren={<SunOutlined />} checked={isDarkMode} onChange={setIsDarkMode} />
                    {isConnected ? (
                        <Flex align="center" gap="middle">
                            <Button type="primary" loading={isProcessing} onClick={handleMint} icon={<ThunderboltOutlined />}>
                                {isProcessing ? '上链中...' : '领取勋章'}
                            </Button>
                            <Badge status="processing" color="gold" text={<Text code>{address?.slice(0, 6)}...{address?.slice(-4)}</Text>} />
                            <Button type="text" danger icon={<DisconnectOutlined />} onClick={() => disconnect()} />
                        </Flex>
                    ) : (
                        <Button type="primary" shape="round" icon={<WalletOutlined />} onClick={() => connect({ connector: injected() })}>Connect Wallet</Button>
                    )}
                </Flex>
            </Header>

            <Content className="p-6 md:p-12 max-w-7xl mx-auto w-full flex-grow">
                <Spin spinning={loading} size="large">
                    <div className="mb-12 border-b border-gray-500/10 pb-8">
                        <Title level={1}>荣誉仓库</Title>
                        <Text type="secondary">数据实时从 ClickHouse 索引库同步</Text>
                    </div>

                    {medals.length > 0 ? (
                        <Row gutter={[32, 32]}>
                            {medals.map((item) => (
                                <Col xs={24} sm={12} lg={8} key={item.tokenId}>
                                    <Card hoverable className={`border-none rounded-[2rem] ${isDarkMode ? 'bg-zinc-900/50' : 'bg-white'}`}>
                                        <Flex vertical gap="large">
                                            <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center text-3xl">🏆</div>
                                            <Title level={3} className="!mb-1 font-black">核心贡献勋章</Title>
                                            <Flex vertical gap="small" className={`p-4 rounded-2xl ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}>
                                                <Flex justify="space-between"><Text className="text-[10px] uppercase font-bold text-gray-400">Transaction</Text><Text className="font-mono text-xs">{item.txHash.slice(0, 12)}...</Text></Flex>
                                                <Flex justify="space-between"><Text className="text-[10px] uppercase font-bold text-gray-400">Token ID</Text><Text className="font-mono text-xs font-bold">#{item.tokenId}</Text></Flex>
                                            </Flex>
                                        </Flex>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Empty description={<Text type="secondary">暂无勋章记录</Text>} />
                    )}
                </Spin>
            </Content>
        </Layout>
    )
}

function App() {
    return (
        <ConfigProvider theme={{
            token: { colorPrimary: '#fadb14', borderRadius: 12 },
            algorithm: theme.defaultAlgorithm
        }}>
            <AntdApp>
                <MedalHome />
            </AntdApp>
        </ConfigProvider>
    )
}

export default App
