import type { Component } from 'vue'
import { DataLine, InfoFilled, Odometer } from '@element-plus/icons-vue'
import type { MessageItem, MessageLevel, MessageUiType } from '@/types/message'

export function normalizeMessageLevel(raw: unknown): MessageLevel {
    const s = String(raw ?? 'low').trim().toLowerCase()
    if (s === 'high' || s === 'medium' || s === 'low') return s
    return 'low'
}

/** 仅高优先级展示角标文案「重要」；中、低不展示优先级标签 */
export function messageLevelBadgeText(level: MessageLevel): string | null {
    return level === 'high' ? '重要' : null
}

export function messageLevelItemClass(level: MessageLevel): string {
    return `message-level--${level}`
}

/** 系统通知：仪表盘（流量监控）；业务消息：数据线（流量消耗/预警） */
export function getMessageListIcon(message: Pick<MessageItem, 'type'>): Component {
    const iconMap: Record<MessageUiType, Component> = {
        system: Odometer,
        business: DataLine,
    }
    return iconMap[message.type] ?? InfoFilled
}

export function messageIconItemClass(message: Pick<MessageItem, 'type'>): string {
    if (message.type === 'system') return 'message-icon--system'
    if (message.type === 'business') return 'message-icon--business'
    return ''
}
