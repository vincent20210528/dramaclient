// 环境配置工具
export interface EnvConfig {
    VITE_APP_TITLE: string
    VITE_APP_ENV: string
    VITE_APP_BASE_URL: string
    VITE_APP_API_TIMEOUT: number
    VITE_APP_MOCK_ENABLED: boolean
}

// 获取环境配置
export const getEnvConfig = (): EnvConfig => {
    const env = import.meta.env.VITE_APP_ENV || 'development'

    return {
        VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE || 'HuntShorts',
        VITE_APP_ENV: env,
        VITE_APP_BASE_URL: import.meta.env.VITE_APP_BASE_URL || 'http://192.168.4.4:9090',
        VITE_APP_API_TIMEOUT: parseInt(import.meta.env.VITE_APP_API_TIMEOUT || '10000'),
        VITE_APP_MOCK_ENABLED: import.meta.env.VITE_APP_MOCK_ENABLED === 'true',
    }
}

// 判断是否为开发环境
export const isDevelopment = (): boolean => {
    return getEnvConfig().VITE_APP_ENV === 'development'
}

// 判断是否为生产环境
export const isProduction = (): boolean => {
    return getEnvConfig().VITE_APP_ENV === 'prod'
}

// 判断是否为测试环境
export const isTest = (): boolean => {
    return getEnvConfig().VITE_APP_ENV === 'dev'
}

// 判断是否为UAT环境
export const isUAT = (): boolean => {
    return getEnvConfig().VITE_APP_ENV === 'uat'
}

// 判断是否为SITE环境
export const isSite = (): boolean => {
    return getEnvConfig().VITE_APP_ENV === 'site'
}

// 获取当前环境名称
export const getCurrentEnv = (): string => {
    return getEnvConfig().VITE_APP_ENV
}

// 获取应用标题
export const getAppTitle = (): string => {
    return getEnvConfig().VITE_APP_TITLE
}

// 获取API基础URL
export const getBaseURL = (): string => {
    return getEnvConfig().VITE_APP_BASE_URL
}

// 获取API超时时间
export const getApiTimeout = (): number => {
    return getEnvConfig().VITE_APP_API_TIMEOUT
}

// 判断是否启用Mock
export const isMockEnabled = (): boolean => {
    return getEnvConfig().VITE_APP_MOCK_ENABLED
}
