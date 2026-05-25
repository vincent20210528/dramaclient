import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { usePermissStore } from '@/store/permiss'
import { setUserRoleId, startTokenCheck, clearUserData } from './index'
import { getDefaultRedirectPath } from './loginChecker'

// 自动登录配置
export interface AutoLoginConfig {
    token: string
    userInfo?: any
    autoRedirect?: boolean
    showMessage?: boolean
}

// 默认用户信息
const defaultUserInfo = {
    id: 1,
    username: 'auto_user',
    nickname: '自动登录用户',
    email: 'auto@example.com',
    avatar: '',
    roles: [
        {
            roleId: '1',
            roleName: '管理员',
            permissions: ['*'], // 所有权限
        },
    ],
}

// 自动登录函数
export const autoLogin = async (
    config: AutoLoginConfig = { token: localStorage.getItem('agent_token') }
): Promise<boolean> => {
    const { token, userInfo = defaultUserInfo, autoRedirect = true, showMessage = true } = config

    try {
        // 清除之前的用户数据
        clearUserData()

        // 设置token
        localStorage.setItem('token', token)

        // 设置token过期时间（24小时后过期）
        const expireTime = Date.now() + 24 * 60 * 60 * 1000 // 24小时
        localStorage.setItem('token_expire_time', expireTime.toString())

        // 保存用户信息
        localStorage.setItem('user_info', JSON.stringify(userInfo))

        // 设置用户角色ID
        if (userInfo.roles && userInfo.roles.length > 0) {
            setUserRoleId(userInfo.roles[0].roleId)
        }

        if (showMessage) {
            ElMessage.success('自动登录成功')
        }

        console.log('自动登录成功，token已设置:', token)

        // 启动token检查
        startTokenCheck()

        // 如果需要自动跳转
        if (autoRedirect) {
            // 使用setTimeout确保状态更新完成后再跳转
            setTimeout(() => {
                window.location.href = `#${getDefaultRedirectPath()}`
            }, 100)
        }

        return true
    } catch (error) {
        console.error('自动登录失败:', error)

        if (showMessage) {
            ElMessage.error('自动登录失败')
        }

        // 如果自动登录失败，清除数据
        clearUserData()

        return false
    }
}

// 快速免登录（使用默认配置）
export const quickLogin = (): Promise<boolean> => {
    return autoLogin({
        token: localStorage.getItem('agent_token'),
        autoRedirect: true,
        showMessage: true,
    })
}

// 静默免登录（不显示消息，不自动跳转）
export const silentLogin = (): Promise<boolean> => {
    return autoLogin({
        token: localStorage.getItem('agent_token'),
        autoRedirect: false,
        showMessage: false,
    })
}

// 自定义token免登录
export const customTokenLogin = (token: string, userInfo?: any): Promise<boolean> => {
    return autoLogin({
        token,
        userInfo,
        autoRedirect: true,
        showMessage: true,
    })
}

// 检查是否已自动登录
export const isAutoLoggedIn = (): boolean => {
    const token = localStorage.getItem('agent_token')
    const userInfo = localStorage.getItem('agent_user_info')
    return !!(token && userInfo)
}

// 获取当前登录状态信息
export const getLoginStatus = () => {
    const token = localStorage.getItem('agent_token')
    const userInfo = localStorage.getItem('agent_user_info')
    const roleId = localStorage.getItem('user_role_id')
    const expireTime = localStorage.getItem('token_expire_time')

    return {
        hasToken: !!token,
        hasUserInfo: !!userInfo,
        hasRoleId: !!roleId,
        tokenExpireTime: expireTime ? new Date(parseInt(expireTime)) : null,
        isExpired: expireTime ? Date.now() > parseInt(expireTime) : false,
    }
}

// 在Vue组件中使用的自动登录hook
export const useAutoLogin = () => {
    const router = useRouter()
    const permiss = usePermissStore()

    const handleAutoLogin = async () => {
        const success = await quickLogin()
        if (success) {
            // 获取菜单权限
            try {
                await permiss.fetchMenuPermissions()
            } catch (error) {
                console.error('获取菜单权限失败:', error)
            }
        }
    }

    const handleSilentLogin = async () => {
        const success = await silentLogin()
        if (success) {
            // 获取菜单权限
            try {
                await permiss.fetchMenuPermissions()
            } catch (error) {
                console.error('获取菜单权限失败:', error)
            }
        }
        return success
    }

    return {
        handleAutoLogin,
        handleSilentLogin,
        quickLogin,
        silentLogin,
        customTokenLogin,
        isAutoLoggedIn,
        getLoginStatus,
    }
}
