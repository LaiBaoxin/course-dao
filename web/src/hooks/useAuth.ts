import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { getNonce, login } from '../api/auth';

export const useAuth = () => {
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async () => {
        if (!isConnected || !address) {
            alert('请先连接钱包');
            return;
        }

        try {
            setIsLoggingIn(true);

            // 1. 从后端获取 Nonce
            const nonceRes = await getNonce(address);
            const nonce = nonceRes.nonce; // 注意：如果你的 axios 没拦截 .data，这里可能是 nonceRes.data.nonce

            // 2. 构造要签名的消息 (明文，用户在 MetaMask 里会看到这段话)
            const message = `欢迎登录 Course DAO！\n请签名以验证您的身份。\n随机数: ${nonce}`;

            // 3. 唤起 MetaMask 签名 (用户点击确认后会返回乱码一样的 signature)
            const signature = await signMessageAsync({ message });

            // 4. 将签名结果发送给后端，换取 JWT
            const loginRes = await login({
                address,
                message,
                signature,
            });

            // 5. 保存 JWT 到浏览器的 localStorage
            // loginRes.token 同样注意 axios 的数据结构解构
            localStorage.setItem('course_dao_jwt', loginRes.token);
            alert('登录成功！');

            // 刷新状态
            window.location.reload();

        } catch (error: any) {
            console.error('登录失败:', error);
            // 判断是不是用户拒绝了签名
            if (error.code === 4001) {
                alert('您拒绝了签名请求');
            } else {
                alert('登录失败，请重试');
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('course_dao_jwt');
        window.location.reload();
    };

    return {
        handleLogin,
        logout,
        isLoggingIn,
        isAuthenticated: !!localStorage.getItem('course_dao_jwt'),
    };
};
