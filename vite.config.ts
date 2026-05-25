import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueSetupExtend from 'vite-plugin-vue-setup-extend'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import tailwindcss from '@tailwindcss/vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import path from 'path'

export default defineConfig(({ command, mode }) => {
    // 根据当前工作目录中的 `mode` 加载 .env 文件
    const env = loadEnv(mode, process.cwd(), '')

    return {
        base: './',
        plugins: [
            vue(),
            VueSetupExtend(),
            AutoImport({
                resolvers: [ElementPlusResolver()],
                imports: ['vue', 'vue-router', 'pinia'], // 指定要自动导入的库
                dts: './src/auto-imports.d.ts', // 生成类型声明文件
                eslintrc: {
                    enabled: true, // 生成ESLint配置
                    filepath: './.eslintrc-auto-import.json',
                },
            }),
            Components({
                resolvers: [ElementPlusResolver()],
            }),
            createSvgIconsPlugin({
                iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
                // 重点检查这一行：symbolId 的格式
                symbolId: 'icon-[name]', // [name] 会被替换为 SVG 文件的文件名
            }),
        ],
        optimizeDeps: {
            include: ['schart.js', 'qrcode'],
        },
        resolve: {
            alias: {
                '@': path.resolve(process.cwd(), 'src'),
                '~': path.resolve(process.cwd(), 'src/assets'),
            },
            // 确保 CommonJS 模块能够正确解析
            mainFields: ['module', 'main'],
        },
        define: {
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true',
        },
        server: {
            host: '0.0.0.0',
            port: 3001,
            open: true,
            proxy: {
                // // UAT环境特殊处理：代理到site-jjt域名的接口（需要放在 /api 之前，优先匹配）
                // '/api/task/manage/getClick': {
                //     target: 'https://site-jjt.ld3.xyz',
                //     changeOrigin: true,
                //     secure: true,
                //     rewrite: (path) => path.replace(/^\/api/, '/gateway/api'),
                // },
                // 代理 /api 接口（用于本地IP地址等不包含/serverapi的情况）
                '/api': {
                    target: env.VITE_APP_BASE_URL || 'http://192.168.4.4:9090',
                    changeOrigin: true,
                    secure: false,
                    // 去掉路径中的 /api 前缀
                    rewrite: (path) => path.replace(/^\/api/, ''),
                },
                // 代理 /serverapi 接口（用于包含/serverapi的baseURL）
                '/serverapi': {
                    target: env.VITE_APP_BASE_URL || 'http://192.168.4.4:9090',
                    changeOrigin: true,
                    secure: false,
                    // 如果 VITE_APP_BASE_URL 已经包含 /serverapi，需要重写路径
                    rewrite: (path) => {
                        const baseURL = env.VITE_APP_BASE_URL || 'http://192.168.4.4:9090'
                        // 如果 baseURL 已经包含 /serverapi，去掉路径中的 /serverapi 前缀
                        if (baseURL.includes('/serverapi')) {
                            return path.replace(/^\/serverapi/, '')
                        }
                        // 否则保持原样
                        return path
                    },
                },
            },
        },
        build: {
            // 根据环境设置不同的构建配置
            outDir: `dist-${mode}`,
            rollupOptions: {
                output: {
                    // 根据环境设置不同的文件名
                    chunkFileNames: `js/[name]-[hash].js`,
                    entryFileNames: `js/[name]-[hash].js`,
                    assetFileNames: `assets/[name]-[hash].[ext]`,
                },
            },
        },
    }
})
