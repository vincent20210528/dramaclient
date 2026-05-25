import type { AxiosError } from 'axios'
import { ElMessage } from 'element-plus'

/** 同一文案在短时间内只弹一次，避免并行请求失败时刷屏 */
let lastToastMessage = ''
let lastToastAt = 0
const TOAST_DEBOUNCE_MS = 2500

/**
 * 将 axios / 网络异常转为用户可读文案
 */
export function parseRequestErrorMessage(error: unknown): string {
    if (error == null) return '请求失败，请稍后重试'
    if (typeof error === 'string' && error.trim()) return error.trim()
    if (error instanceof Error && error.message.trim()) {
        const m = error.message.trim()
        if (m !== 'Network Error') return m
    }

    const axiosErr = error as AxiosError<{ message?: string; msg?: string }>
    const dataMsg = axiosErr.response?.data?.message ?? axiosErr.response?.data?.msg
    if (typeof dataMsg === 'string' && dataMsg.trim()) return dataMsg.trim()

    if (axiosErr.response) {
        const status = axiosErr.response.status
        if (status === 401) return '登录已失效，请重新登录'
        if (status === 403) return '暂无权限访问'
        if (status >= 500) return `服务异常（${status}），请稍后重试`
        return `请求失败（${status}）`
    }

    const code = String(axiosErr.code ?? '')
    const rawMsg = String(axiosErr.message ?? '')

    if (code === 'ECONNABORTED' || /timeout/i.test(rawMsg)) {
        return '请求超时，请检查网络或稍后重试'
    }
    if (
        code === 'ERR_NETWORK' ||
        /Network Error/i.test(rawMsg) ||
        /ERR_CONNECTION_REFUSED/i.test(rawMsg) ||
        !axiosErr.response
    ) {
        return '无法连接服务器，请检查网络或服务是否已启动'
    }

    return rawMsg.trim() || '请求失败，请稍后重试'
}

/**
 * 弹出错误提示（带去重）；返回最终文案供调用方 reject
 */
export function notifyRequestError(error: unknown): string {
    const message = parseRequestErrorMessage(error)
    const now = Date.now()
    if (message !== lastToastMessage || now - lastToastAt > TOAST_DEBOUNCE_MS) {
        lastToastMessage = message
        lastToastAt = now
        ElMessage.error({
            message,
            grouping: true,
            duration: 4000,
            showClose: true,
        })
    }
    return message
}
