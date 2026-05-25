// Console 配置文件
export interface ConsoleSettings {
    // 是否完全禁用所有 console 输出（优先级最高）
    disableAll: boolean;
    enableLogInProduction: boolean;
    enableInfoInProduction: boolean;
    enableDebugInProduction: boolean;
    enableWarnInProduction: boolean;
    enableErrorInProduction: boolean;
    enableTableInProduction: boolean;
    enableGroupInProduction: boolean;
}

// 开发环境配置
export const developmentConfig: ConsoleSettings = {
    disableAll: false,  // 开发环境不禁用所有输出
    enableLogInProduction: true,
    enableInfoInProduction: true,
    enableDebugInProduction: true,
    enableWarnInProduction: true,
    enableErrorInProduction: true,
    enableTableInProduction: true,
    enableGroupInProduction: true,
};

// 生产环境配置
export const productionConfig: ConsoleSettings = {
    disableAll: false,  // 生产环境默认不禁用所有输出
    enableLogInProduction: false,
    enableInfoInProduction: false,
    enableDebugInProduction: false,
    enableWarnInProduction: true,  // 保留警告
    enableErrorInProduction: true, // 保留错误
    enableTableInProduction: false,
    enableGroupInProduction: false,
};

// 测试环境配置
export const testConfig: ConsoleSettings = {
    disableAll: false,  // 测试环境默认不禁用所有输出
    enableLogInProduction: false,
    enableInfoInProduction: false,
    enableDebugInProduction: false,
    enableWarnInProduction: true,
    enableErrorInProduction: true,
    enableTableInProduction: false,
    enableGroupInProduction: false,
};

// 根据环境获取配置
export function getConsoleConfig(): ConsoleSettings {
    const env = import.meta.env.MODE;
    
    switch (env) {
        case 'development':
            return developmentConfig;
        case 'production':
            return productionConfig;
        case 'test':
            return testConfig;
        default:
            return productionConfig; // 默认使用生产环境配置
    }
}

// 从环境变量覆盖配置
export function getConsoleConfigWithEnvVars(): ConsoleSettings {
    const baseConfig = getConsoleConfig();
    
    return {
        disableAll: import.meta.env.VITE_DISABLE_ALL_CONSOLE === 'true' || baseConfig.disableAll,
        enableLogInProduction: import.meta.env.VITE_ENABLE_CONSOLE_LOG === 'true' || baseConfig.enableLogInProduction,
        enableInfoInProduction: import.meta.env.VITE_ENABLE_CONSOLE_INFO === 'true' || baseConfig.enableInfoInProduction,
        enableDebugInProduction: import.meta.env.VITE_ENABLE_CONSOLE_DEBUG === 'true' || baseConfig.enableDebugInProduction,
        enableWarnInProduction: import.meta.env.VITE_ENABLE_CONSOLE_WARN !== 'false' && baseConfig.enableWarnInProduction,
        enableErrorInProduction: import.meta.env.VITE_ENABLE_CONSOLE_ERROR !== 'false' && baseConfig.enableErrorInProduction,
        enableTableInProduction: import.meta.env.VITE_ENABLE_CONSOLE_TABLE === 'true' || baseConfig.enableTableInProduction,
        enableGroupInProduction: import.meta.env.VITE_ENABLE_CONSOLE_GROUP === 'true' || baseConfig.enableGroupInProduction,
    };
}
