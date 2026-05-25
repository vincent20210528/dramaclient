export const setProperty = (prop: string, val: any, dom = document.documentElement) => {
    dom.style.setProperty(prop, val)
}

export const mix = (color1: string, color2: string, weight: number = 0.5): string => {
    let color = '#'
    for (let i = 0; i <= 2; i++) {
        const c1 = parseInt(color1.substring(1 + i * 2, 3 + i * 2), 16)
        const c2 = parseInt(color2.substring(1 + i * 2, 3 + i * 2), 16)
        const c = Math.round(c1 * weight + c2 * (1 - weight))
        color += c.toString(16).padStart(2, '0')
    }
    return color
}

// 用户角色ID相关工具函数
export const getUserRoleId = (): string | null => {
    return localStorage.getItem('user_role_id')
}

export const setUserRoleId = (roleId: string): void => {
    localStorage.setItem('user_role_id', roleId)
}

export const removeUserRoleId = (): void => {
    localStorage.removeItem('user_role_id')
}

export const hasUserRoleId = (): boolean => {
    return !!localStorage.getItem('user_role_id')
}

// 用户信息相关工具函数
export const getUserInfo = (): any => {
    const userInfoStr = localStorage.getItem('agent_user_info')
    if (userInfoStr) {
        try {
            return JSON.parse(userInfoStr)
        } catch (error) {
            console.error('解析用户信息失败:', error)
            return null
        }
    }
    return null
}

export const setUserInfo = (userInfo: any): void => {
    localStorage.setItem('user_info', JSON.stringify(userInfo))
}

export const removeUserInfo = (): void => {
    localStorage.removeItem('user_info')
}

// Token验证相关工具函数
export const isTokenValid = (): boolean => {
    const token = localStorage.getItem('agent_token')
    const userInfo = getUserInfo()

    // 检查token和用户信息是否存在
    if (!token || !userInfo) {
        return false
    }

    // 检查token是否过期（如果后端返回了过期时间）
    const tokenExpireTime = localStorage.getItem('token_expire_time')
    if (tokenExpireTime) {
        const expireTime = parseInt(tokenExpireTime)
        const currentTime = Date.now()

        if (currentTime > expireTime) {
            // token已过期，清除用户数据
            clearUserData()
            return false
        }
    }

    return true
}

export const clearUserData = (): void => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_info')
    localStorage.removeItem('token_expire_time')
    removeUserRoleId()
}

export const redirectToLogin = (): void => {
    clearUserData()
    // 使用window.location.href确保完全跳转到登录页
    window.location.href = '#/login'
}

// 定时检查token有效性
let tokenCheckInterval: ReturnType<typeof setInterval> | null = null

export const startTokenCheck = (): void => {
    // 清除之前的定时器
    if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval)
    }

    // 每5分钟检查一次token有效性
    tokenCheckInterval = setInterval(
        () => {
            if (!isTokenValid()) {
                // token无效，清除定时器并跳转到登录页
                stopTokenCheck()
                redirectToLogin()
            }
        },
        5 * 60 * 1000
    ) // 5分钟
}

export const stopTokenCheck = (): void => {
    if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval)
        tokenCheckInterval = null
    }
}

// 自动免登录功能
export const autoLogin = (
    token: string = localStorage.getItem('agent_token'),
    userInfo?: any
): void => {
    try {
        // 清除之前的用户数据
        clearUserData()

        // 设置token
        localStorage.setItem('token', token)

        // 设置token过期时间（24小时后过期）
        const expireTime = Date.now() + 24 * 60 * 60 * 1000 // 24小时
        localStorage.setItem('token_expire_time', expireTime.toString())

        // 设置默认用户信息（如果没有提供）
        const defaultUserInfo = userInfo || {
            id: 1,
            username: 'auto_user',
            nickname: '自动登录用户',
            email: 'auto@example.com',
            roles: [
                {
                    roleId: '1',
                    roleName: '管理员',
                },
            ],
        }

        // 保存用户信息
        setUserInfo(defaultUserInfo)

        // 设置用户角色ID
        if (defaultUserInfo.roles && defaultUserInfo.roles.length > 0) {
            setUserRoleId(defaultUserInfo.roles[0].roleId)
        }

        console.log('自动登录成功，token已设置:', token)

        // 跳转到统计概览
        window.location.href = '#/dashboard'
    } catch (error) {
        console.error('自动登录失败:', error)
        // 如果自动登录失败，清除数据并跳转到登录页
        clearUserData()
        window.location.href = '#/login'
    }
}

// 检查是否已自动登录
export const isAutoLoggedIn = (): boolean => {
    return isTokenValid()
}

// 快速免登录（使用默认token）
export const quickLogin = (): void => {
    autoLogin(localStorage.getItem('agent_token'))
}

/** 节流方法（防止按钮频繁点击） */
export { throttle } from './throttle'

/** 华为 OBS 上传工具（签名链接 + PUT/POST 上传） */
export {
    uploadToObs,
    uploadByPut,
    uploadByPost,
    getFileExtension,
    getFileContentType,
    isAllowedFile,
    ALLOWED_EXTENSIONS,
} from './obsUpload'
export type { ObsUploadMethod } from './obsUpload'

/**
 * 处理API返回数据的公共方法
 * @param res API返回的响应对象
 * @returns 成功时返回data字段，失败时抛出错误
 */
export const handleApiResponse = (res: any) => {
    if (res?.data?.code === 200) {
        return res.data.data
    } else {
        throw new Error(res?.data?.msg || '操作失败')
    }
}
