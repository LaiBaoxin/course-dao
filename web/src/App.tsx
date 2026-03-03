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

    const fetchMedals = useCallback(async (addr: string) => {
        try {
            const res = await getMedalsByAddress(addr)
            setMedals(res.medals || [])
        } catch (err) {
            console.error("获取勋章失败:", err)
        }
    }, [])

    useEffect(() => {
        if (isConnected && address) {
            // 连接钱包成功就调用后端接口
            fetchMedals(address)
        } else {
            setMedals([])
        }
    }, [isConnected, address, fetchMedals])

    return (
        <div className="min-h-screen bg-black text-white p-8">
            {/* Header */}
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-16">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full blur-sm animate-pulse"></div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase">
                        Course DAO
                    </h1>
                </div>

                {isConnected ? (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400 font-mono bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                        </span>
                        <button
                            onClick={() => disconnect()}
                            className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
                        >
                            退出
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => connect({ connector: injected() })}
                        className="text-white ml-3 font-bold px-6 py-2 rounded-full hover:bg-yellow-500 transition-all active:scale-95"
                    >
                        连接钱包
                    </button>
                )}
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto">
                {isConnected ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {medals.length > 0 ? (
                            medals.map((item) => (
                                <div
                                    key={item.tokenId}
                                    className="group relative bg-zinc-900 border border-zinc-800 p-8 rounded-3xl overflow-hidden hover:border-yellow-500/50 transition-all"
                                >
                                    <div className="absolute -right-4 -top-4 text-8xl opacity-10 grayscale group-hover:grayscale-0 group-hover:opacity-20 transition-all">🏆</div>
                                    <div className="relative z-10">
                                        <p className="text-yellow-500 font-mono text-sm mb-2">#00{item.tokenId}</p>
                                        <h3 className="text-2xl font-bold mb-4">核心贡献勋章</h3>
                                        <div className="space-y-2">
                                            <p className="text-xs text-zinc-500 font-mono truncate">TX: {item.txHash}</p>
                                            <p className="text-xs text-zinc-500 font-mono">BLOCK: {item.blockNumber}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-32 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                                <p className="text-zinc-500">暂未发现勋章，快去完成课程吧！</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-40">
                        <h2 className="text-2xl font-bold mb-2">欢迎来到荣誉墙</h2>
                        <p className="text-zinc-500">请先连接 MetaMask 钱包以同步您的链上数据</p>
                    </div>
                )}
            </main>
        </div>
    )
}

export default App
