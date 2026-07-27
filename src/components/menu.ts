import { Menus } from '@/types/menu'
import { getUserInfo } from '@/utils'

/** 权限项：登录返回的 userInfo.perms 元素，path 与菜单 index 匹配则显示；perms 为菜单管理中配置的权限标识（按钮级） */
export interface PermItem {
    path?: string
    /** 权限标识，如 system:app:add，供页面 hasPerm 判断 */
    perms?: string
    [key: string]: any
}

/** 根据权限列表过滤菜单：index 与 perms.path 匹配的显示，子菜单显示时父菜单也显示 */
export function getFilteredMenuData(perms: PermItem[] | null | undefined): Menus[] {
    // 临时策略：超管角色直接显示全部菜单
    // if (isSuperAdminUser()) {
    //     return menuData
    // }
    if (!perms || !Array.isArray(perms) || perms.length === 0) {
        return []
    }
    const allowedPaths = new Set(perms.map((p) => (p.path ? String(p.path).trim() : '')).filter(Boolean))

    function filter(items: Menus[]): Menus[] {
        return items
            .map((item) => {
                const hasPath = item.index.startsWith('/') && allowedPaths.has(item.index)
                if (item.children && item.children.length > 0) {
                    const filteredChildren = filter(item.children)
                    const showParent = hasPath || filteredChildren.length > 0
                    if (!showParent) return null
                    return { ...item, children: filteredChildren }
                }
                return hasPath ? item : null
            })
            .filter((x): x is Menus => x != null)
    }

    return filter(menuData)
}

// function isSuperAdminUser(): boolean {
//     const userInfo = getUserInfo()
//     if (!userInfo) return false

//     const id = Number(userInfo?.id ?? userInfo?.userId ?? NaN)
//     if (id === 1) return true

//     const roles = Array.isArray(userInfo?.roles) ? userInfo.roles : []
//     return roles.some((role: any) => {
//         const roleId = Number(role?.roleId ?? role?.id ?? NaN)
//         const roleName = String(role?.roleName ?? role?.name ?? '').toLowerCase()
//         if (roleId === 1) return true
//         return roleName.includes('超管') || roleName.includes('超级管理员') || roleName.includes('super')
//     })
// }

/**
 * 根据当前路径解析侧边栏菜单对应的面包屑：一级标题 / 当前页标题（与 menuData 结构一致）
 * 优先匹配最长路径前缀（支持详情等子路径）
 */
export function getMenuBreadcrumb(path: string): { parent?: string; current: string } {
    const p = (path.split('?')[0] || '').replace(/\/$/, '') || '/'
    let best: { parent?: string; current: string; len: number } | null = null

    const consider = (parentTitle: string | undefined, childTitle: string, index: string) => {
        const idx = index.replace(/\/$/, '') || '/'
        const match =
            p === idx || (idx !== '/' && p.startsWith(idx + '/'))
        if (!match) return
        const len = idx.length
        if (!best || len > best.len) {
            best = { parent: parentTitle, current: childTitle, len }
        }
    }

    for (const item of menuData) {
        if (item.children?.length) {
            for (const child of item.children) {
                consider(item.title, child.title, child.index)
            }
        } else {
            consider(undefined, item.title, item.index)
        }
    }

    if (!best) return { current: '' }
    return { parent: best.parent, current: best.current }
}

/**
 * 侧边栏 `el-menu` 的 default-active：必须是已存在的菜单 index。
 * 当路由为子路径（如 /operation/dramaManagement/episodes/1）时，若直接把 fullPath 传给菜单，
 * Element Plus 会因找不到对应 index 而把 activeIndex 清空，导致父子菜单都不高亮。
 * 因此对当前 path 与所有菜单 index 做「最长前缀匹配」（与 getMenuBreadcrumb 思路一致）。
 */
export function resolveSidebarActiveIndex(path: string, menuItems: Menus[]): string {
    const p = (path.split('?')[0] || '').replace(/\/$/, '') || '/'

    const indices: string[] = []
    function walk(items: Menus[]) {
        for (const it of items) {
            if (it.index) indices.push(it.index)
            if (it.children?.length) walk(it.children)
        }
    }
    walk(menuItems)

    let best = ''
    let bestLen = -1
    for (const raw of indices) {
        const idx = (raw.split('?')[0] || '').replace(/\/$/, '') || '/'
        const match = p === idx || (idx !== '/' && p.startsWith(idx + '/'))
        if (match && idx.length > bestLen) {
            best = raw.split('?')[0] || raw
            bestLen = idx.length
        }
    }
    return best
}

export const menuData: Menus[] = [
    {
        id: '2',
        icon: 'Monitor',
        index: '/dashboard',
        title: '统计概览',
    },
    {
        id: '9',
        icon: 'Iphone',
        index: '/app',
        title: 'App管理',
        children: [
            {
                id: '9-1',
                pid: '9',
                icon: 'EditPen',
                index: '/app/registerManagement',
                title: '注册管理',
            },
            {
                id: '9-2',
                pid: '9',
                icon: 'Tickets',
                index: '/app/feeManagement',
                title: '年费管理',
            },
            {
                id: '9-5',
                pid: '9',
                icon: 'Setting',
                index: '/app/serviceConfig',
                title: '服务配置',
            },
            {
                id: '9-3',
                pid: '9',
                icon: 'Histogram',
                index: '/app/trafficManagement',
                title: '流量管理',
            },
            {
                id: '9-4',
                pid: '9',
                icon: 'Link',
                index: '/domain/management',
                title: '域名管理',
            },
        ],
    },
    {
        id: '10',
        icon: 'VideoPlay',
        index: '/drama',
        title: '短剧管理',
        children: [
            {
                id: '10-1',
                pid: '10',
                icon: 'List',
                index: '/drama/contentManagement',
                title: '内容列表',
            },
             /** 先注释 已集成到内容配置 */
            // {
            //     id: '10-2',
            //     pid: '10',
            //     index: '/drama/languageDict',
            //     title: '语言字典',
            // },
            // {
            //     id: '10-3',
            //     pid: '10',
            //     index: '/drama/categoryManagement',
            //     title: '类型标签',
            // },
            {
                id: '10-4',
                pid: '10',
                icon: 'Tools',
                index: '/drama/contentConfig',
                title: '内容配置',
            },
            {
                id: '10-7',
                pid: '10',
                icon: 'Histogram',
                index: '/drama/playStatistics',
                title: '播放统计',
            },
            {
                id: '10-9',
                pid: '10',
                icon: 'DataAnalysis',
                index: '/drama/userAnalysis',
                title: '用户分析',
            },
            {
                id: '10-8',
                pid: '10',
                icon: 'VideoCamera',
                index: '/drama/videoManagement',
                title: '视频管理',
            },
            /** 先注释 已集成到内容配置 */
            // {
            //     id: '10-5',
            //     pid: '10',
            //     index: '/drama/plotTag',
            //     title: '情节标签',
            // },
            // {
            //     id: '10-6',
            //     pid: '10',
            //     index: '/drama/copyrightManagement',
            //     title: '版权管理',
            // },
            
        ],
    },
    {
        id: '11',
        icon: 'Cpu',
        index: '/game',
        title: '游戏管理',
        children: [
            {
                id: '11-1',
                pid: '11',
                icon: 'Grid',
                index: '/game/categoryConfig',
                title: '游戏分类配置',
            },
            {
                id: '11-2',
                pid: '11',
                icon: 'Tickets',
                index: '/game/resourceManagement',
                title: '游戏资源管理',
            },
            {
                id: '11-3',
                pid: '11',
                icon: 'Promotion',
                index: '/game/adPlacement',
                title: '游戏广告位管理',
            },
            {
                id: '11-4',
                pid: '11',
                icon: 'Present',
                index: '/game/directAd',
                title: '直客广告',
            },
        ],
    },
    {
        id: '3',
        icon: 'Setting',
        index: '/system',
        title: '系统管理',
        children: [
            {
                id: '3-0',
                pid: '3',
                icon: 'User',
                index: '/system/userManagement',
                title: '用户管理',
            },
            {
                id: '3-0-1',
                pid: '3',
                icon: 'Avatar',
                index: '/system/roleManagement',
                title: '角色管理',
            },
            {
                id: '3-0-2',
                pid: '3',
                icon: 'Grid',
                index: '/system/menuManagement',
                title: '菜单管理',
            },
             {
                id: '3-0-3',
                pid: '3',
                icon: 'UserFilled',
                index: '/system/developerManagement',
                title: '开发者管理',
            },
        ],
    },
    {
        id: '1',
        icon: 'Files',
        index: '/operation',
        title: '运营管理',
        children:[
            {
                id: '1-1',
                pid: '1',
                icon: 'VideoCamera',
                index: '/operation/dramaManagement',
                title: '内容列表',
            },
            {
                id: '1-2',
                pid: '1',
                icon: 'Histogram',
                index: '/operation/trafficManagement',
                title: '流量管理',
            },
            {
                id: '1-3',
                pid: '1',
                icon: 'Box',
                index: '/operation/trafficPacketManagement',
                title: '流量包管理',
            },
            {
                id: '1-4',
                pid: '1',
                icon: 'Coin',
                index: '/operation/accountInfo',
                title: '账户信息',
            },
            {
                id: '1-5',
                pid: '1',
                icon: 'Histogram',
                index: '/operation/playStatistics',
                title: '播放统计',
            },
        ]
    },
]
