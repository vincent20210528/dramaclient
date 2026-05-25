import { defineStore } from 'pinia'
import { getUnreadCount } from '@/api/message'

/** 合并并发请求，避免进入消息中心等场景重复调用 unReadCount */
let fetchUnreadCountInflight: Promise<void> | null = null

export const useMessageStore = defineStore('message', {
    state: () => {
        return {
            unreadCount: 0, // 未读消息数量
        }
    },
    getters: {
        // 是否有未读消息
        hasUnread: (state) => state.unreadCount > 0,
        // 未读消息文本
        unreadText: (state) => {
            if (state.unreadCount === 0) {
                return ''
            }
            return `${state.unreadCount}条未读消息`
        },
    },
    actions: {
        // 设置未读消息数量
        setUnreadCount(count: number) {
            this.unreadCount = count
        },
        // 增加未读消息数量
        increaseUnreadCount() {
            this.unreadCount++
        },
        // 减少未读消息数量
        decreaseUnreadCount() {
            if (this.unreadCount > 0) {
                this.unreadCount--
            }
        },
        // 从服务器获取未读消息数量
        async fetchUnreadCount() {
            if (fetchUnreadCountInflight) {
                return fetchUnreadCountInflight
            }
            fetchUnreadCountInflight = (async () => {
                try {
                    const res = await getUnreadCount()
                    if (res?.code === 200) {
                        this.setUnreadCount(res.data?.count ?? 0)
                    }
                } catch (error: any) {
                    if (error?.message?.includes('Token已失效') || error?.message?.includes('重新登录')) {
                        this.setUnreadCount(0)
                    } else {
                        console.error('获取未读消息数量失败', error)
                    }
                } finally {
                    fetchUnreadCountInflight = null
                }
            })()
            return fetchUnreadCountInflight
        },
    },
})



