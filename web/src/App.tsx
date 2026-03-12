import { useState } from 'react';
import { ConfigProvider, App as AntdApp, Layout } from 'antd';
import { useTheme } from './hooks/useTheme';

// 引入你写好的 Hook
import { useMedal } from './hooks/useMedal';

// 自定义组件
import { AppHeader } from './components/AppHeader';
import { MedalHome } from './components/MedalHome';
import ProposalHome from './components/ProposalHome';

export default function App() {
    const { isDarkMode, setIsDarkMode, themeConfig } = useTheme();

    // 默认展示勋章页
    const [currentTab, setCurrentTab] = useState<string>('medal');

    const { loading, proof, ownedMedals, handleClaim } = useMedal();

    // 推导真实的白名单和拥有状态
    const hasProof = proof && proof.length > 0;
    const hasMedal = ownedMedals && ownedMedals.length > 0;
    console.log("hasMedal:", hasMedal);

    return (
        <ConfigProvider theme={themeConfig}>
            <AntdApp>
                <Layout className="min-h-screen transition-colors duration-500">

                    {/* 全局顶部导航 */}
                    <AppHeader
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                        isProcessing={loading}
                        onClaim={handleClaim}
                        hasProof={hasProof}
                        currentTab={currentTab}
                        onTabChange={setCurrentTab}
                    />

                    {/* 根据 currentTab 条件渲染组件 */}
                    <div className="flex-1 w-full max-w-7xl mx-auto">
                        {currentTab === 'medal' && (
                            <MedalHome
                                isDarkMode={isDarkMode}
                                setIsDarkMode={setIsDarkMode}
                            />
                        )}

                        {currentTab === 'governance' && (
                            <ProposalHome />
                        )}
                    </div>

                </Layout>
            </AntdApp>
        </ConfigProvider>
    );
}
