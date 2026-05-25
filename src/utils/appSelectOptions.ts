/** GET /api/apps/getAppList 单项 */
export interface AppListSelectItem {
    appName?: string
    appPkg?: string
    appDesc?: string
}

export interface AppSelectOption {
    /** 筛选/提交入参：完整 appPkg（含 ## 后缀时保留原值） */
    value: string
    /** 展示：有 appDesc 为 appName（appDesc），否则 appName（去 ## 后的 appPkg） */
    label: string
    raw?: AppListSelectItem
}

/** 从接口响应中解析 App 数组（兼容 data 直接为数组或嵌套 data） */
export function parseGetAppListResponse(res: unknown): AppListSelectItem[] {
    const body = (res as { data?: unknown })?.data ?? res
    const data = (body as { data?: unknown })?.data ?? body
    return Array.isArray(data) ? (data as AppListSelectItem[]) : []
}

/** 展示用：去掉 appPkg 中「##」及之后字符（如 com.xxx##App Store → com.xxx） */
export function stripAppPkgForDisplay(appPkg?: string): string {
    const s = String(appPkg ?? '').trim()
    const idx = s.indexOf('##')
    return (idx >= 0 ? s.slice(0, idx) : s).trim()
}

/**
 * 下拉展示文案：
 * - 有 appDesc：appName（appDesc）
 * - 无 appDesc：appName（strip 后的 appPkg）
 */
export function formatAppSelectLabel(appName?: string, appDesc?: string, appPkg?: string): string {
    const name = String(appName ?? '').trim()
    const desc = String(appDesc ?? '').trim()
    const pkgDisplay = stripAppPkgForDisplay(appPkg)
    if (name && desc) return `${name} (${desc})`
    if (name && pkgDisplay) return `${name} (${pkgDisplay})`
    if (name) return name
    if (desc) return `(${desc})`
    if (pkgDisplay) return pkgDisplay
    return ''
}

/** GET /api/apps/getAppList → 下拉选项（value 为 appPkg） */
export function mapGetAppListToSelectOptions(res: unknown): AppSelectOption[] {
    return parseGetAppListResponse(res)
        .map((r) => {
            const appPkg = String(r?.appPkg ?? '').trim()
            const label = formatAppSelectLabel(r?.appName, r?.appDesc, appPkg) || stripAppPkgForDisplay(appPkg) || appPkg
            return {
                value: appPkg,
                label,
                raw: r,
            }
        })
        .filter((x) => x.value)
}
