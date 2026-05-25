import { getUserInfo } from './index'

/** 从登录 userInfo.perms 中收集「权限标识」（与菜单管理中 perms 字段一致） */
function collectPermIdentifiers(perms: unknown): Set<string> {
    const set = new Set<string>()
    if (!Array.isArray(perms)) return set
    for (const item of perms) {
        if (typeof item === 'string' && item.trim()) {
            set.add(item.trim())
            continue
        }
        if (item && typeof item === 'object') {
            const id = (item as Record<string, unknown>).perms
            if (typeof id === 'string' && id.trim()) set.add(id.trim())
        }
    }
    return set
}

/**
 * 是否拥有某权限标识（按钮级）。
 * 超管（id / userId 为 1）或权限集合含 * 时视为全部通过。
 */
export function hasPerm(perm: string): boolean {
    const user = getUserInfo()
    if (!user) return false
    const set = collectPermIdentifiers(user.perms)
    if (set.has('*')) return true
    return set.has(perm)
}

/** 注册管理 — 按钮权限标识（与菜单管理中配置一致） */
export const PERM_APP = {
    add: 'system:app:add',
    editStatus: 'system:app:editStatus',
    edit: 'system:app:edit',
    reset: 'system:app:reset',
} as const

/** 年费管理 */
export const PERM_APPFEE = {
    add: 'system:appfee:add',
    edit: 'system:appfee:edit',
} as const

/** 流量管理 */
export const PERM_APP_TRAFFIC = {
    /** 添加 APP 流量 */
    add: 'system:appTraffic:add',
    detail: 'system:appTraffic:detail',
    delete: 'system:appTraffic:delete',
} as const

/** 域名管理（CDN）— 编辑项与菜单配置一致为 system:appcdn:delete */
export const PERM_APPCDN = {
    add: 'system:appcdn:add',
    edit: 'system:appcdn:delete',
} as const

/** 语言字典 */
export const PERM_DRAMA_LANGUAGE = {
    add: 'system:dramaLanguage:add',
    list: 'system:dramaLanguage:list',
    edit: 'system:dramaLanguage:edit',
    delete: 'system:dramaLanguage:delete',
} as const

/** 分类管理 */
export const PERM_DRAMA_CAT = {
    add: 'system:dramaCat:add',
    list: 'system:dramaCat:list',
    edit: 'system:dramaCat:edit',
    delete: 'system:dramaCat:delete',
} as const

/** 情节标签 */
export const PERM_DRAMA_TAG = {
    add: 'system:tag:add',
    edit: 'system:tag:edit',
    delete: 'system:tag:delete',
    list: 'system:tag:list',
} as const

/** 版权来源 */
export const PERM_COPYRIGHT_SOURCE = {
    add: 'system:copyrightSource:add',
    list: 'system:copyrightSource:list',
    edit: 'system:copyrightSource:edit',
    delete: 'system:copyrightSource:delete',
} as const

/** 内容等级 */
export const PERM_CONTENT_RATING = {
    add: 'system:contentRating:add',
    list: 'system:contentRating:list',
    edit: 'system:contentRating:edit',
    delete: 'system:contentRating:delete',
} as const

/** 短剧 */
export const PERM_DRAMA = {
    add: 'system:drama:add',
    edit: 'system:drama:edit',
    delete: 'system:drama:delete',
    list: 'system:drama:list',
} as const

/** 剧集 */
export const PERM_DRAMA_SERIES = {
    add: 'system:dramaseries:add',
    edit: 'system:dramaseries:edit',
    delete: 'system:dramaseries:delete',
    /** 短剧列表进入剧集管理 */
    list: 'system:dramaseries:list',
    /** 视频状态刷新 */
    handleSeries: 'system:dramaseries:handleSeries',
} as const

/** 角色管理（与菜单 / 后端 perms 一致，冒号分隔） */
export const PERM_ROLE = {
    add: 'system:role:add',
    edit: 'system:role:edit',
    delete: 'system:role:delete',
} as const

/** 菜单管理 */
export const PERM_MENU = {
    add: 'system:menu:add',
    edit: 'system:menu:edit',
    delete: 'system:menu:delete',
} as const

/** 开发者管理 */
export const PERM_DEVELOPER = {
    add: 'system:developer:add',
    list: 'system:developer:list',
    edit: 'system:developer:edit',
    delete: 'system:developer:delete',
    addAppTraffic: 'system:developerTopUp:add', /* 添加流量包 */
} as const

/** 流量包管理 */
export const PERM_TRAFFICE_DETAIL = {
    list: 'system:developerTopUp:list', /** 查看开发者的充值列表 */
} as const


/** 账户信息 */
export const PERM_ACCOUNT = {
    edit: 'system:user:edit', /** 修改密码 */
    list: 'system:developer:list', /** 查看管辖应用列表 */
} as const

/** 播放统计 — 列表、详情、集间留存 */
export const PERM_VOD_PLAY_DAILY_INFO = {
    list: 'system:vodPlayDailyInfo:list',
} as const

/** 用户分析 — 区域分析、用户活跃与留存 */
export const PERM_DRAMA_USER_ANALYSIS = {
    list: 'system:dramaUserAnalysis:list',
} as const

/** 播放统计 — 实时概览 */
export const PERM_DRAMA_USER_ACTION_STATS_INCR = {
    list: 'system:dramaUserActionStatsIncr:list',
} as const

/** 播放统计 — 日度趋势 */
export const PERM_VOD_PLAY_DRAMA_DAILY_STATS = {
    list: 'system:vodPlayDramaDailyStats:list',
} as const

/** 播放统计 — 播放次数 Top100 / 播放流量 Top100 */
export const PERM_VOD_PLAY_TOP100 = {
    list: 'system:vodPlayTop100:list',
} as const

/** 服务配置管理（App 管理 — 服务配置） */
export const PERM_SERVICE_PACKAGE_CONFIG = {
    list: 'system:servicePackageConfig:list',
    add: 'system:servicePackageConfig:add',
    edit: 'system:servicePackageConfig:edit',
    delete: 'system:servicePackageConfig:delete',
} as const