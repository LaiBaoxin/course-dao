/**
 * 将 IPFS 协议的链接转换为浏览器可访问的网关链接
 */
export const resolveIpfsUrl = (url: string | undefined | null) => {
    if (!url) return '';
    if (url.startsWith('ipfs://')) {
        return url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    return url;
};
