/** 接口消息类型 */
export type SysMessageType = 'SYS' | 'BIZ'

/** 前端展示用消息类型 */
export type MessageUiType = 'system' | 'business'

/** 消息等级：低 low / 中 medium / 高 high */
export type MessageLevel = 'low' | 'medium' | 'high'

export interface MessageItem {
    id: number | string
    type: MessageUiType
    title: string
    content: string
    /** 创建时间展示 */
    date: string
    isRead: boolean
    messageLevel: MessageLevel
    /** 原始 readStatus：0 未读，1 已读 */
    readStatus?: 0 | 1
    /** 原始 type：SYS / BIZ */
    messageType?: SysMessageType
    icon?: string
    tag?: string
    actionType?: string
    actionParams?: Record<string, unknown>
}

/** POST /api/sysMessage/page 单条记录 */
export interface SysMessageRecord {
    id: number
    /** 消息标题 */
    title?: string
    /** 消息内容 */
    content: string
    /** SYS 系统 / BIZ 业务 */
    type: SysMessageType
    /** 0 未读，1 已读 */
    readStatus: 0 | 1
    /** 低 low / 中 medium / 高 high */
    messageLevel?: string
    createdAt?: string
}

/** POST /api/sysMessage/page 分页 data */
export interface SysMessagePageData {
    records: SysMessageRecord[]
    total: number
    size: number
    current: number
    pages: number
}

export interface MessageListParams {
    pageNum?: number
    pageSize?: number
    /** all | unread | read | system(SYS) | business(BIZ) */
    type?: 'all' | 'unread' | 'read' | 'system' | 'business'
    /** 0 未读，1 已读；与 type 二选一由 API 层组装 */
    status?: 0 | 1
    messageType?: SysMessageType
}

export interface MessageListResponse {
    list: MessageItem[]
    total: number
    pageNum: number
    pageSize: number
}

/** GET /api/sysMessage/unReadCount */
export interface SysMessageUnReadCountData {
    count: number
}
