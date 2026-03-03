import { useState, useEffect, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { getMedalsByAddress } from './api/medal'
import type { MedalInfo } from './api/types'

function App() {
    const { address, isConnected } = useAccount()
    const { connect } = useConnect()
    const { disconnect } = useDisconnect()
    const [medals, setMedals] = useState<MedalInfo[]>([])
    const [loading, setLoading] = useState(false)

    const fetchMedals = useCallback(async (addr: string) => {
        setLoading(true)
        try {
            const res = await getMedalsByAddress(addr)
            setMedals(res.medals || [])
        } catch (err) {
            console.error("获取勋章失败:", err)
        } finally {
            setLoading(false)
        }
    }, [])

    /**
     * 当钱包连接成功或地址切换时，自动触发查询
     */
    useEffect(() => {
        if (isConnected && address) {
            fetchMedals(address)
        } else {
            setMedals([])
        }
    }, [isConnected, address, fetchMedals])

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-16">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full blur-[2px] animate-pulse"></div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase">
                        Course DAO
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* 手动刷新按钮 */}
                    {isConnected && (
                        <button
                            onClick={() => address && fetchMedals(address)}
                            disabled={loading}
                            className={`p-2 text-xl hover:bg-zinc-800 rounded-full transition-all ${loading ? 'animate-spin opacity-50' : 'active:scale-90'}`}
                            title="刷新数据"
                        >
                            🔄
                        </button>
                    )}

                    {isConnected ? (
                        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-2xl">
                            <span className="text-sm font-mono text-yellow-500">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                            <button
                                onClick={() => disconnect()}
                                className="text-xs font-bold text-zinc-500 hover:text-red-400 transition-colors"
                            >
                                退出
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => connect({ connector: injected() })}
                            className="ml-3 text-white font-bold px-8 py-2.5 rounded-full hover:bg-yellow-500 transition-all active:scale-95"
                        >
                            连接钱包
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto">
                {isConnected ? (
                    <div className="space-y-8">
                        <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
                            <h2 className="text-xl font-bold">我的荣誉勋章 ({medals.length})</h2>
                            <p className="text-zinc-500 text-sm italic">数据实时同步自 ClickHouse 引擎</p>
                        </div>

                        {medals.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {medals.map((item) => (
                                    <div
                                        key={item.tokenId}
                                        className="group relative bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] overflow-hidden hover:border-yellow-500/50 hover:bg-zinc-900/50 transition-all"
                                    >
                                        {/* 背景装饰勋章 */}
                                        <div className="absolute -right-6 -top-6 text-9xl opacity-5 grayscale group-hover:grayscale-0 group-hover:opacity-20 transition-all duration-500 rotate-12">🏆</div>

                                        <div className="relative z-10">
                                            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6 border border-yellow-500/20">
                                                <span className="text-2xl">🎖️</span>
                                            </div>
                                            <p className="text-yellow-500 font-mono text-xs mb-1">MEDAL ID</p>
                                            <h3 className="text-3xl font-black mb-6">#{item.tokenId}</h3>

                                            <div className="space-y-3 pt-4 border-t border-zinc-800">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-zinc-600 uppercase font-bold">Transaction Hash</span>
                                                    {/* 区块浏览器跳转链接 */}
                                                    <a
                                                        href={`https://etherscan.io/tx/${item.txHash}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-zinc-400 font-mono truncate hover:text-yellow-500 transition-colors underline decoration-zinc-800 underline-offset-4"
                                                    >
                                                        {item.txHash}
                                                    </a>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-zinc-600 uppercase font-bold">Block Height</span>
                                                    <span className="text-xs text-zinc-400 font-mono">{item.blockNumber}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* 空状态 */
                            <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-zinc-900 rounded-[3rem]">
                                <div className="text-5xl mb-4 opacity-20">🍃</div>
                                <p className="text-zinc-500 font-medium">当前地址尚未获得任何勋章</p>
                                <p className="text-zinc-700 text-sm mt-1">去课程中心完成挑战以赢取奖励</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* 未连接状态 */
                    <div className="flex flex-col items-center justify-center py-48">
                        <div className="relative w-24 h-24 mb-8">
                            <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                            <div className="relative text-7xl flex justify-center items-center">🛡️</div>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">连接钱包开启荣誉之旅</h2>
                        <p className="text-zinc-500 max-w-sm text-center leading-relaxed">
                            我们需要读取您的钱包地址以从区块链索引库中匹配属于您的课程勋章。
                        </p>
                    </div>
                )}
            </main>

            <footer className="max-w-6xl mx-auto mt-24 pt-8 border-t border-zinc-900 flex justify-between text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                <span>Go-Zero + ClickHouse + React Stack</span>
                <span>© 2026 COURSE DAO PROTOCOL</span>
            </footer>
        </div>
    )
}

export default App
