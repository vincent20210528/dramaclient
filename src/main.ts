import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { usePermissStore } from './store/permiss'
import { isTokenValid, startTokenCheck, autoLogin } from './utils'
import { overrideConsole, updateConfig } from './utils/console-override'
import { getConsoleConfigWithEnvVars } from './config/console'
import { getAppTitle } from './utils/env'
import 'element-plus/dist/index.css'
import './assets/css/message-box-confirm.css'
import './assets/css/menu-add-dialog.css'
import './assets/css/icon.css'
import './index.css'
import { setupGlobalComponents } from './common'
import 'virtual:svg-icons-register'

// 兼容部分浏览器端依赖（如 vod-js-sdk-v6）在运行时访问 Node 风格 global
if (typeof globalThis !== 'undefined' && !(globalThis as any).global) {
    ;(globalThis as any).global = globalThis
}

// 初始化 console 重写
const consoleConfig = getConsoleConfigWithEnvVars()

// 更新配置并重写 console
updateConfig(consoleConfig)
overrideConsole()

// 示例：如果需要完全禁用所有 console 输出，可以这样设置：
// updateConfig({ disableAll: true });

// 示例：如果需要临时启用所有日志，可以这样设置：
// updateConfig({
//     disableAll: false,
//     enableLogInProduction: true,
//     enableInfoInProduction: true,
//     enableDebugInProduction: true
// });

// 测试免权限路由配置
import { isNoAuthRoute, getNoAuthRoutes } from './config/routes'
console.log('免权限路由列表:', getNoAuthRoutes())
console.log('业务开通页面是否为免权限路由:', isNoAuthRoute('/channel/business-enable'))
console.log('合同列表页面是否为免权限路由:', isNoAuthRoute('/contract/list'))
console.log('合同管理页面是否为免权限路由:', isNoAuthRoute('/contract'))
console.log('登录页面是否为免权限路由:', isNoAuthRoute('/login'))

const app = createApp(App)

// 设置应用标题
document.title = getAppTitle()

app.use(createPinia())
app.use(router)
;(window as any).$router = router
setupGlobalComponents(app)

// 注册elementplus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
// 自定义权限指令
const permiss = usePermissStore()
app.directive('permiss', {
    mounted(el, binding) {
        // 如果还没有获取到权限数据，先获取一次
        if (permiss.allowedPaths.length === 0) {
            permiss.fetchMenuPermissions().then(() => {
                checkPermission(el, binding, permiss)
            })
        } else {
            checkPermission(el, binding, permiss)
        }
    },
    updated(el, binding) {
        checkPermission(el, binding, permiss)
    },
})

// 权限检查函数
function checkPermission(el: any, binding: any, permiss: any) {
    if (binding.value) {
        // 使用新的权限检查方式：通过path匹配
        if (!permiss.hasPermission(String(binding.value))) {
            el['hidden'] = true
        } else {
            el['hidden'] = false
        }
    }
}

// 应用启动时检查token状态
if (isTokenValid()) {
    // 如果token有效，启动定时检查
    startTokenCheck()
}
// 注意：登录状态检测现在由空页面组件处理

// 安全配置 - 高德地图已注释
// ;(window as any)._AMapSecurityConfig = {
//   securityJsCode: 'c989819b72e183ea5bc5cff735192998', // 请替换为您的实际密钥
// }

app.mount('#app')
