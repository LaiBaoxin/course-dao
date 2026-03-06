import { ConfigProvider, App as AntdApp, Layout } from 'antd';
import { useTheme } from './hooks/useTheme';
import { MedalHome } from './components/MedalHome';

export default function App() {
    const { isDarkMode, setIsDarkMode, themeConfig } = useTheme();

    return (
        <ConfigProvider theme={themeConfig}>
            <AntdApp>
                <Layout className="min-h-screen transition-colors duration-500">
                    <MedalHome
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                    />
                </Layout>
            </AntdApp>
        </ConfigProvider>
    );
}
