import { useState, useEffect, useCallback, useMemo } from 'react'
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

const MedalHome = ({ isDarkMode, setIsDarkMode }: { isDarkMode: boolean, setIsDarkMode: (v: boolean) => void }) => {
    // 钱包与账户状态
    const { address, isConnected } = useAccount()
    const { connect } = useConnect()
    const { disconnect } = useDisconnect()

    // 勋章数据与加载状态
    const [medals, setMedals] = useState<MedalInfo[]>([])
    const [loading, setLoading] = useState(false)

    // 全局提示 API
    const { message: msgApi } = AntdApp.useApp()

    // 合约写入与交易等待钩子
    const { data: hash, writeContract, isPending: isMinting } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

    const isProcessing = isMinting || isConfirming

    // 从后端 API 获取勋章列表
    const fetchMedals = useCallback(async (addr: string) => {
        setLoading(true)
        try {
            const res = await getMedalsByAddress(addr)
            setMedals(res.medals || [])
        } catch (err) {
            msgApi.error({ content: '获取数据失败，请检查后端连接' })
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [msgApi])

    // 调用合约 safeMint 方法
    const handleMint = () => {
        if (!address) return
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: MEDAL_ABI,
            functionName: 'safeMint',
            args: [address],
        })
    }

    // 交易确认后的自动刷新逻辑
    useEffect(() => {
        if (isConfirmed && address) {
            msgApi.success({ content: '勋章领取成功！正在同步索引数据...' })
            // 延迟 3 秒给 ClickHouse 同步留出时间
            setTimeout(() => fetchMedals(address), 3000)
        }
    }, [isConfirmed, address, fetchMedals, msgApi])

    // 账户切换时的自动查询
    useEffect(() => {
        if (isConnected && address) fetchMedals(address)
        else setMedals([])
    }, [isConnected, address, fetchMedals])

    return (
        <Layout className={`min-h-screen flex flex-col transition-all duration-500 ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#f8f9fa]'}`}>
            {/* 顶部导航栏 */}
            <Header style={{ background: 'transparent' }} className={`px-6 md:px-12 flex items-center justify-between sticky top-0 z-20 border-b backdrop-blur-xl ${isDarkMode ? 'bg-[#0a0a0a]/70 border-white/10' : 'bg-white/70 border-black/5'}`}>
                <Flex align="center" gap="middle">
                    <SafetyCertificateOutlined className="text-3xl text-yellow-500" />
                    <Title level={4} className="!m-0 font-black italic tracking-tighter">COURSE DAO</Title>
                </Flex>

                <Flex align="center" gap="large">
                    {/* 亮暗模式切换 */}
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

            {/* 主内容区 */}
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
                                    <Card hoverable className={`border-none rounded-[2rem] transition-all ${isDarkMode ? 'bg-zinc-900/50 shadow-2xl shadow-black' : 'bg-white shadow-xl shadow-gray-200'}`}>
                                        <Flex vertical gap="large">
                                            <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center text-3xl">🏆</div>
                                            <Title level={3} className="!mb-1 font-black">核心贡献勋章</Title>
                                            <Flex vertical gap="small" className={`p-4 rounded-2xl ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}>
                                                <Flex justify="space-between">
                                                    <Text className="text-[10px] uppercase font-bold text-gray-400">Transaction</Text>
                                                    <Text className="font-mono text-xs">{item.txHash.slice(0, 12)}...</Text>
                                                </Flex>
                                                <Flex justify="space-between">
                                                    <Text className="text-[10px] uppercase font-bold text-gray-400">Token ID</Text>
                                                    <Text className="font-mono text-xs font-bold">#{item.tokenId}</Text>
                                                </Flex>
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



// 根组件：管理全局主题配置
export default function App() {
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light')

    // 同步暗黑模式到本地存储和 DOM
    useEffect(() => {
        const root = window.document.documentElement
        if (isDarkMode) {
            root.classList.add('dark')
            root.style.backgroundColor = '#0a0a0a'
        } else {
            root.classList.remove('dark')
            root.style.backgroundColor = '#f8f9fa'
        }
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    }, [isDarkMode])

    // 响应式主题算法配置
    const themeConfig = useMemo(() => ({
        token: {
            colorPrimary: '#fadb14',
            borderRadius: 12,
        },
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm
    }), [isDarkMode])

    return (
        <ConfigProvider theme={themeConfig}>
            <AntdApp>
                <MedalHome isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
            </AntdApp>
        </ConfigProvider>
    )
}
