import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
    chains: [sepolia],
    connectors: [injected()],
    transports: {
        // 使用你代码里的 Alchemy 链接
        [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/h81_NhzDAZa0CosfZKdur'),
    },
})
