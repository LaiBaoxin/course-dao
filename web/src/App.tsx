import { useState, useEffect, useCallback } from 'react'
import {
    Layout, Button, Card, Row, Col, Typography,
    Badge, Spin, Empty, ConfigProvider, theme, message, Switch, Flex, notification
} from 'antd'
import {
    DisconnectOutlined, WalletOutlined,
    SafetyCertificateOutlined, ExportOutlined, SunOutlined, MoonOutlined,
    ThunderboltOutlined, LoadingOutlined
} from '@ant-design/icons'
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { getMedalsByAddress } from './api/medal'
import { CONTRACT_ADDRESS, MEDAL_ABI } from './api/contract'
import type { MedalInfo } from './api/types'

const { Header, Content, Footer } = Layout
const { Title, Text } = Typography

function App() {
    const { address, isConnected } = useAccount()
    const { connect } = useConnect()
    const { disconnect } = useDisconnect()
    const [medals, setMedals] = useState<MedalInfo[]>([])
    const [loading, setLoading] = useState(false)

    // Mint 交互状态
    const { data: hash, writeContract, isPending: isMinting } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light')

    // 是否处于“上链中”过程
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
            message.error("数据同步失败")
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
            notification.success({
                message: '勋章领取成功',
                description: '交易已确认，正在同步索引库...',
                placement: 'bottomRight',
            })
            // 交易成功后延迟刷新数据
            setTimeout(() => fetchMedals(address), 3000)
        }
    }, [isConfirmed, address, fetchMedals])

    useEffect(() => {
        if (isConnected && address) fetchMedals(address)
        else setMedals([])
    }, [isConnected, address, fetchMedals])

    return (
        <ConfigProvider
            theme={{
                algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                token: {
                    colorPrimary: '#fadb14',
                    borderRadius: 16,
                },
            }}
        >
            <Layout className={`min-h-screen flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#f8f9fa]'}`}>
                <Header
                    style={{ background: 'transparent' }}
                    className={`px-6 md:px-12 flex items-center justify-between sticky top-0 z-20 transition-all border-b backdrop-blur-xl ${
                        isDarkMode ? 'bg-[#0a0a0a]/70 border-white/10' : 'bg-white/70 border-black/5'
                    }`}
                >
                    <Flex align="center" gap="middle">
                        <SafetyCertificateOutlined className="text-3xl text-yellow-500" />
                        <Title level={4} className="!m-0 font-black italic tracking-tighter">COURSE DAO</Title>
                    </Flex>

                    <Flex align="center" gap="large">
                        <Switch checkedChildren={<MoonOutlined />} unCheckedChildren={<SunOutlined />} checked={isDarkMode} onChange={setIsDarkMode} />

                        {isConnected ? (
                            <Flex align="center" gap="middle">
                                <Button
                                    type="primary"
                                    icon={isProcessing ? <LoadingOutlined /> : <ThunderboltOutlined />}
                                    loading={isProcessing}
                                    onClick={handleMint}
                                    className={`font-bold transition-all duration-500 border-none ${
                                        isProcessing ? '!bg-[#0052ff] !text-white' : ''
                                    }`}
                                >
                                    {isProcessing ? '上链中...' : '领取勋章'}
                                </Button>

                                <Badge status="processing" color="gold" text={
                                    <Text code className={`font-mono px-2 py-1 rounded hidden sm:inline-block ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`}>
                                        {address?.slice(0, 6)}...{address?.slice(-4)}
                                    </Text>
                                } />
                                <Button type="text" danger icon={<DisconnectOutlined />} onClick={() => disconnect()} />
                            </Flex>
                        ) : (
                            <Button type="primary" size="large" shape="round" icon={<WalletOutlined />} onClick={() => connect({ connector: injected() })}>Connect Wallet</Button>
                        )}
                    </Flex>
                </Header>

                <Content className="p-6 md:p-12 max-w-7xl mx-auto w-full flex-grow">
                    {!isConnected ? (
                        <Flex vertical align="center" justify="center" className="py-40">
                            <Empty image={<div className="text-8xl opacity-20 mb-4">🛡️</div>} description={<Title level={3}>连接钱包开启荣誉之旅</Title>} />
                            <Button type="primary" size="large" shape="round" onClick={() => connect({ connector: injected() })}>立即授权进入</Button>
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
                                                className={`border-none rounded-[2rem] transition-all hover:scale-[1.02] shadow-sm ${isDarkMode ? 'bg-zinc-900/50' : 'bg-white'}`}
                                                actions={[<Button type="link" icon={<ExportOutlined />} href={`https://etherscan.io/tx/${item.txHash}`} target="_blank">区块详情</Button>]}
                                            >
                                                <Flex vertical gap="large">
                                                    <Flex justify="space-between">
                                                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-yellow-500/20">🏆</div>
                                                        <Text type="secondary" className="font-mono text-[10px] opacity-40">Verified ID: {item.tokenId}</Text>
                                                    </Flex>
                                                    <div>
                                                        <Title level={3} className="!mb-1 font-black">核心贡献勋章</Title>
                                                        <Text type="secondary">Course DAO 官方认证结业证明</Text>
                                                    </div>
                                                    <Flex vertical gap="small" className={`p-4 rounded-2xl ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}>
                                                        <Flex justify="space-between"><Text className="text-[10px] uppercase font-bold text-gray-400">Transaction</Text><Text copyable={{ text: item.txHash }} className="font-mono text-xs">{item.txHash.slice(0, 8)}...</Text></Flex>
                                                        <Flex justify="space-between"><Text className="text-[10px] uppercase font-bold text-gray-400">Block Height</Text><Text className="font-mono text-xs font-bold">{item.blockNumber}</Text></Flex>
                                                    </Flex>
                                                </Flex>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <Empty
                                    description={
                                        <Flex vertical align="center" gap="middle">
                                            <Text type="secondary">您的仓库空空如也</Text>
                                            <Button
                                                type="primary"
                                                size="large"
                                                shape="round"
                                                icon={isProcessing ? <LoadingOutlined /> : <ThunderboltOutlined />}
                                                onClick={handleMint}
                                                loading={isProcessing}
                                                className={`transition-all duration-500 border-none ${
                                                    isProcessing ? '!bg-[#0052ff] !text-white' : ''
                                                }`}
                                            >
                                                {isProcessing ? '正在请求上链...' : '立即申领我的勋章'}
                                            </Button>
                                        </Flex>
                                    }
                                    className="py-40"
                                />
                            )}
                        </Spin>
                    )}
                </Content>

                <Footer className="text-center py-12 bg-transparent opacity-30 mt-auto">
                    <Text className="font-mono text-[10px] tracking-[0.3em] uppercase">Built with Go-Zero · ClickHouse · React · AntD 5</Text>
                </Footer>
            </Layout>
        </ConfigProvider>
    )
}

export default App
