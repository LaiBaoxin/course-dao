import { useState, useEffect, useMemo } from 'react'
import { theme } from 'antd'

export const useTheme = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light')

    useEffect(() => {
        const root = window.document.documentElement
        if (isDarkMode) {
            root.classList.add('dark')
            root.style.backgroundColor = '#0a0a0a'
        } else {
            root.classList.remove('dark')
            root.style.backgroundColor = '#f8f9fa'
        }
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    }, [isDarkMode])

    const themeConfig = useMemo(() => ({
        token: {
            colorPrimary: '#fadb14',
            borderRadius: 12,
        },
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm
    }), [isDarkMode])

    return { isDarkMode, setIsDarkMode, themeConfig }
}
