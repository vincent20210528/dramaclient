import { getUserInfo, isTokenValid } from './index'
import { menuData } from '@/components/menu'
import type { Menus } from '@/types/menu'

/**
 * 登录状态检测结果
 */
export interface LoginCheckResult {
    isValid: boolean
    shouldAutoLogin: boolean
    redirectPath: string
}

function resolveFirstAccessibleMenuPath(items: Menus[], allowedPaths: Set<string>): string | null {
    for (const item of items) {
        const currentPath = String(item.index || '').trim()
        const hasChildren = Array.isArray(item.children) && item.children.length > 0

        if (hasChildren) {
            const childPath = resolveFirstAccessibleMenuPath(item.children!, allowedPaths)
            if (childPath) return childPath
        } else if (currentPath.startsWith('/') && allowedPaths.has(currentPath)) {
            return currentPath
        }
    }
    return null
}

/** 登录后默认跳转：有统计概览权限则跳 dashboard，否则跳第一个权限路径 */
export const getDefaultRedirectPath = (): string => {
    const userInfo = getUserInfo()
    const perms = Array.isArray(userInfo?.perms) ? userInfo.perms : []

    const paths: string[] = perms
        .map((item: any) => {
            if (typeof item === 'string') return ''
            const path = String(item?.path ?? '').trim()
            return path.startsWith('/') ? path : ''
        })
        .filter((path): path is string => Boolean(path))
    const allowedPathSet = new Set<string>(paths)

    if (allowedPathSet.has('/dashboard')) {
        return '/dashboard'
    }

    // 仅返回可导航的叶子菜单路径，避免跳到 /app、/system 等父级导致404
    const firstLeafPath = resolveFirstAccessibleMenuPath(menuData, allowedPathSet)
    if (firstLeafPath) {
        return firstLeafPath
    }

    // 兜底：如果 perms 里存在子级路径，优先选第一个子级路径
    const firstChildLikePath = paths.find((p) => p.split('/').length > 2)
    if (firstChildLikePath) {
        return firstChildLikePath
    }
    return '/403'
}

/**
 * 检测登录状态并返回处理建议
 */
export const checkLoginStatus = (): LoginCheckResult => {
    const tokenValid = isTokenValid()

    if (tokenValid) {
        // token有效，按权限决定默认页
        return {
            isValid: true,
            shouldAutoLogin: false,
            redirectPath: getDefaultRedirectPath(),
        }
    }

    // 正常环境且token无效，需要登录
    return {
        isValid: false,
        shouldAutoLogin: false,
        redirectPath: '/login',
    }
}

/**
 * 执行登录状态检测和自动处理
 */
export const handleLoginCheck = async (): Promise<{ success: boolean; redirectPath: string }> => {
    try {
        const result = checkLoginStatus()
        console.log('handleLoginCheck', result)

        if (result.isValid) {
            // token有效，直接跳转
            return { success: true, redirectPath: result.redirectPath }
        }

        // 需要手动登录
        return { success: false, redirectPath: result.redirectPath }
    } catch (error) {
        console.error('登录状态检测失败:', error)
        return { success: false, redirectPath: '/login' }
    }
}

/**
 * 在Vue组件中使用的登录检测hook
 */
export const useLoginChecker = () => {
    const checkStatus = () => checkLoginStatus()
    const handleCheck = () => handleLoginCheck()

    return {
        checkStatus,
        handleCheck,
    }
}
