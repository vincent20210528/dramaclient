// 商店类型
export const STORE_TYPE_OPTIONS = [
    { label: 'App Store', value: 'App Store' },
    { label: 'Google Play', value: 'Google Play' },
    { label: 'TikTok MiniDrama', value: 'TikTok MiniDrama' },
    { label: '其他', value: '其他' },
] as const

/** 表单回填：兼容历史数据中的 GooglePlay */
export function normalizeStoreTypeForForm(value: unknown): string {
    const s = String(value ?? '').trim()
    if (s === 'GooglePlay') return 'Google Play'
    return s
}

export type StoreTypeValue = (typeof STORE_TYPE_OPTIONS)[number]['value']

// App 列表项 / 详情
export interface AppRegisterItem {
    id?: number | string
    appName?: string
    /** 列表「App包名」列展示文案（分页接口 appDesc） */
    appDesc?: string
    packageName?: string
    storeType?: string
    appId?: string
    appSecret?: string
    status?: number | string
    developerName?: string
    developerEmail?: string
    developerPhone?: string
    referrerPhone?: string
    referrerName?: string
    registerFileUrl?: string
    logoUrl?: string
    storeName?: string
    storeUrl?: string
    createdAt?: string
    updatedAt?: string
    createTime?: string
    updateTime?: string
}

// 新增/编辑 App 表单
export interface AppRegisterForm {
    appName: string
    packageName: string
    storeType: string
    storeName?: string
    storeUrl: string
    developerPhone?: string
    developerName?: string
    developerEmail?: string
    referrerPhone?: string
    referrerName?: string
    registerFileUrl?: string
    logoUrl?: string
}
