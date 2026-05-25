// 全局 console 重写配置
interface ConsoleConfig {
    // 是否完全禁用所有 console 输出（优先级最高）
    disableAll: boolean;
    // 是否在生产环境中启用 console.log
    enableLogInProduction: boolean;
    // 是否在生产环境中启用 console.info
    enableInfoInProduction: boolean;
    // 是否在生产环境中启用 console.debug
    enableDebugInProduction: boolean;
    // 是否在生产环境中启用 console.warn
    enableWarnInProduction: boolean;
    // 是否在生产环境中启用 console.error
    enableErrorInProduction: boolean;
    // 是否在生产环境中启用 console.table
    enableTableInProduction: boolean;
    // 是否在生产环境中启用 console.group
    enableGroupInProduction: boolean;
}

// 默认配置
const defaultConfig: ConsoleConfig = {
    disableAll: false,  // 默认不禁用所有输出
    enableLogInProduction: false,
    enableInfoInProduction: false,
    enableDebugInProduction: false,
    enableWarnInProduction: true,  // 警告在生产环境中通常需要保留
    enableErrorInProduction: true, // 错误在生产环境中通常需要保留
    enableTableInProduction: false,
    enableGroupInProduction: false,
};

// 当前配置
let currentConfig: ConsoleConfig = { ...defaultConfig };

// 检查是否为生产环境
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

// 保存原始的 console 方法
const originalConsole = {
    log: console.log,
    info: console.info,
    debug: console.debug,
    warn: console.warn,
    error: console.error,
    table: console.table,
    group: console.group,
    groupEnd: console.groupEnd,
};

// 重写 console 方法
function overrideConsole() {
    // 重写 console.log
    console.log = (...args: any[]) => {
        if (currentConfig.disableAll) return; // 如果禁用所有输出，直接返回
        if (!isProduction || currentConfig.enableLogInProduction) {
            originalConsole.log(...args);
        }
    };

    // 重写 console.info
    console.info = (...args: any[]) => {
        if (currentConfig.disableAll) return; // 如果禁用所有输出，直接返回
        if (!isProduction || currentConfig.enableInfoInProduction) {
            originalConsole.info(...args);
        }
    };

    // 重写 console.debug
    console.debug = (...args: any[]) => {
        if (currentConfig.disableAll) return; // 如果禁用所有输出，直接返回
        if (!isProduction || currentConfig.enableDebugInProduction) {
            originalConsole.debug(...args);
        }
    };

    // 重写 console.warn
    console.warn = (...args: any[]) => {
        if (currentConfig.disableAll) return; // 如果禁用所有输出，直接返回
        if (!isProduction || currentConfig.enableWarnInProduction) {
            originalConsole.warn(...args);
        }
    };

    // 重写 console.error
    console.error = (...args: any[]) => {
        if (currentConfig.disableAll) return; // 如果禁用所有输出，直接返回
        if (!isProduction || currentConfig.enableErrorInProduction) {
            originalConsole.error(...args);
        }
    };

    // 重写 console.table
    console.table = (data: any) => {
        if (currentConfig.disableAll) return; // 如果禁用所有输出，直接返回
        if (!isProduction || currentConfig.enableTableInProduction) {
            originalConsole.table(data);
        }
    };

    // 重写 console.group
    console.group = (label?: string) => {
        if (currentConfig.disableAll) return; // 如果禁用所有输出，直接返回
        if (!isProduction || currentConfig.enableGroupInProduction) {
            originalConsole.group(label);
        }
    };

    // 重写 console.groupEnd
    console.groupEnd = () => {
        if (currentConfig.disableAll) return; // 如果禁用所有输出，直接返回
        if (!isProduction || currentConfig.enableGroupInProduction) {
            originalConsole.groupEnd();
        }
    };
}

// 恢复原始的 console 方法
function restoreConsole() {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.table = originalConsole.table;
    console.group = originalConsole.group;
    console.groupEnd = originalConsole.groupEnd;
}

// 更新配置
function updateConfig(newConfig: Partial<ConsoleConfig>) {
    currentConfig = { ...currentConfig, ...newConfig };
}

// 获取当前配置
function getConfig(): ConsoleConfig {
    return { ...currentConfig };
}

// 检查当前环境
function getEnvironment(): string {
    return isProduction ? 'production' : 'development';
}

// 导出配置函数
export {
    overrideConsole,
    restoreConsole,
    updateConfig,
    getConfig,
    getEnvironment,
    type ConsoleConfig,
};

// 默认导出配置对象
export default {
    overrideConsole,
    restoreConsole,
    updateConfig,
    getConfig,
    getEnvironment,
};
