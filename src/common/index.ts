import type { App } from 'vue'
import PageContent from './PageContent.vue'
import SvgIcon from './SvgIcon.vue'

// 全局组件注册
export const setupGlobalComponents = (app: App) => {
    app.component('SvgIcon', SvgIcon)
    app.component('PageContent', PageContent)
}

// 默认导出
export { SvgIcon }
