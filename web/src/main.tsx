import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

const config = createConfig({
    // 确保所有请求都打向本地
    // chains: [foundry],
    // transports: {
    //     [foundry.id]: http('http://127.0.0.1:9545', { batch: false }),
    // },
    // sepolia 测试链
    chains: [sepolia],
    transports: {
        // 直接使用 Alchemy 的 HTTPS 链接
        [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/h81_NhzDAZa0CosfZKdur'),
    },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </WagmiProvider>
    </React.StrictMode>,
)
