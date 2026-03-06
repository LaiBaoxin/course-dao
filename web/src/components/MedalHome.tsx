import React from 'react';
import { useMedal } from '../hooks/useMedal';

// 在接口中添加 setIsDarkMode 的定义
interface MedalHomeProps {
    isDarkMode: boolean;
    setIsDarkMode: (v: boolean) => void;
}

export const MedalHome: React.FC<MedalHomeProps> = ({ isDarkMode, setIsDarkMode }) => {
    const { account, ownedMedals, proof, loading, connectWallet, handleClaim } = useMedal();

    const containerStyle = isDarkMode
        ? "bg-black/60 border-white/10 text-white"
        : "bg-white/90 border-black/10 text-black";

    return (
        <div className={`flex flex-col gap-6 p-8 backdrop-blur-md border rounded-3xl shadow-2xl max-w-lg w-full transition-colors duration-500 ${containerStyle}`}>
            <header className="flex justify-between items-center">
                {/* 占位，保持标题居中 */}
                <div className="w-8"></div>

                <div className="text-center">
                    <h1 className="text-2xl font-black tracking-tight">COURSE DAO</h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>默克尔树勋章分发系统</p>
                </div>

                {/* 3. 在 UI 中使用 setIsDarkMode（增加一个切换按钮） */}
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                >
                    {isDarkMode ? '🌙' : '☀️'}
                </button>
            </header>

            {!account ? (
                <button onClick={connectWallet} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/30">
                    连接钱包以查看勋章
                </button>
            ) : (
                <div className="space-y-6">
                    {/* ... 保持地址展示逻辑不变 ... */}
                    <div className={`${isDarkMode ? 'bg-white/5' : 'bg-black/5'} p-4 rounded-2xl border border-current/5`}>
                        <span className="text-[10px] uppercase font-bold opacity-50">Connected Address</span>
                        <div className="text-blue-500 font-mono truncate text-sm mt-1">{account}</div>
                    </div>

                    {/* ... 保持领取提示逻辑不变 ... */}
                    {proof.length > 0 && (
                        <div className="bg-blue-500/10 p-6 rounded-3xl border border-blue-500/20 text-center">
                            <h2 className="font-bold text-blue-400">检测到 1 枚可领取的勋章</h2>
                            <button onClick={handleClaim} disabled={loading} className="mt-4 w-full py-2 bg-blue-500 text-white font-black rounded-xl hover:bg-blue-400 disabled:bg-gray-700">
                                {loading ? "上链中..." : "立即领取 (CLAIM)"}
                            </button>
                        </div>
                    )}

                    {/* ... 保持列表展示逻辑不变 ... */}
                    <div className="max-h-60 overflow-y-auto pr-2">
                        <h3 className="text-[10px] uppercase font-bold opacity-50 mb-3">勋章收藏 ({ownedMedals.length})</h3>
                        {ownedMedals.map((m, idx) => (
                            <div key={idx} className={`flex justify-between items-center p-3 rounded-xl mb-2 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-[10px] font-black">#{m.tokenId}</div>
                                    <span className="text-sm font-medium">Course DAO Medal</span>
                                </div>
                                <TextLink hash={m.txHash} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// 抽取的小组件保持不变
const TextLink = ({ hash }: { hash: string }) => (
    <a href={`http://127.0.0.1:8545/tx/${hash}`} target="_blank" className="text-xs text-blue-500 hover:underline">Explorer ↗</a>
);
