import { ConfigProvider, App as AntdApp } from 'antd';
import { useTheme } from './hooks/useTheme';
import { MedalHome } from './components/MedalHome';

export default function App() {
    // 引入主题钩子
    const { isDarkMode, setIsDarkMode, themeConfig } = useTheme();

    return (
        <ConfigProvider theme={themeConfig}>
            <AntdApp>
                <div className="min-h-screen flex items-center justify-center p-4 transition-all duration-500">
                    <MedalHome
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                    />
                </div>
            </AntdApp>
        </ConfigProvider>
    );
}
