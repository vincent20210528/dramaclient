import request from '../utils/request'
import { normalizeMessageLevel } from '../utils/messageDisplay'
import type {
    MessageItem,
    MessageListParams,
    MessageListResponse,
    SysMessagePageData,
    SysMessageRecord,
    SysMessageType,
    SysMessageUnReadCountData,
} from '../types/message'

function mapSysTypeToUi(type: SysMessageType): MessageItem['type'] {
    return type === 'SYS' ? 'system' : 'business'
}

const DEFAULT_MESSAGE_TITLE = '流量预警'

function resolveMessageTitle(item: SysMessageRecord): string {
    const title = String(item?.title ?? '').trim()
    if (title) return title
    return DEFAULT_MESSAGE_TITLE
}

function transformSysMessageRecord(item: SysMessageRecord): MessageItem {
    const content = String(item?.content ?? '').trim()
    return {
        id: item.id,
        type: mapSysTypeToUi(item.type),
        title: resolveMessageTitle(item),
        content,
        date: String(item?.createdAt ?? '').trim(),
        isRead: Number(item.readStatus) === 1,
        messageLevel: normalizeMessageLevel(item?.messageLevel),
        readStatus: item.readStatus,
        messageType: item.type,
        actionType: 'detail',
    }
}

function buildSysMessagePageBody(params?: MessageListParams) {
    const body: {
        current: number
        size: number
        status?: 0 | 1
        type?: SysMessageType
    } = {
        current: params?.pageNum ?? 1,
        size: params?.pageSize ?? 10,
    }

    if (params?.status === 0 || params?.status === 1) {
        body.status = params.status
    } else if (params?.type === 'unread') {
        body.status = 0
    } else if (params?.type === 'read') {
        body.status = 1
    }

    if (params?.messageType) {
        body.type = params.messageType
    } else if (params?.type === 'system') {
        body.type = 'SYS'
    } else if (params?.type === 'business') {
        body.type = 'BIZ'
    }

    return body
}

/**
 * 分页查询当前登录用户消息
 * POST /api/sysMessage/page
 */
export async function getMessageList(params?: MessageListParams): Promise<{
    code: number
    data: MessageListResponse
}> {
    const res = await request({
        url: '/api/sysMessage/page',
        method: 'post',
        data: buildSysMessagePageBody(params),
        headers: { 'Content-Type': 'application/json' },
    })

    const body = res?.data ?? {}
    if (Number(body?.code) === 200 && body.data) {
        const pageData = body.data as SysMessagePageData
        const records = Array.isArray(pageData.records) ? pageData.records : []
        const current = Number(pageData.current ?? params?.pageNum ?? 1)
        const size = Number(pageData.size ?? params?.pageSize ?? 10)
        return {
            code: 200,
            data: {
                list: records.map(transformSysMessageRecord),
                total: Number(pageData.total ?? 0),
                pageNum: current,
                pageSize: size,
            },
        }
    }

    return {
        code: Number(body?.code ?? 200),
        data: {
            list: [],
            total: 0,
            pageNum: params?.pageNum ?? 1,
            pageSize: params?.pageSize ?? 10,
        },
    }
}

/**
 * 标记消息已读
 * POST /api/sysMessage/markAsRead/{messageId}
 */
export function markMessageAsRead(messageId: number | string) {
    const id = encodeURIComponent(String(messageId))
    return request({
        url: `/api/sysMessage/markAsRead/${id}`,
        method: 'post',
    })
}

/**
 * 全部标记为已读
 * POST /api/sysMessage/markAllAsRead
 */
export function markAllMessagesAsRead() {
    return request({
        url: '/api/sysMessage/markAllAsRead',
        method: 'post',
    })
}

/**
 * 当前登录用户未读消息个数
 * GET /api/sysMessage/unReadCount
 */
export async function getUnreadCount(): Promise<{ code: number; data: SysMessageUnReadCountData }> {
    const res = await request({
        url: '/api/sysMessage/unReadCount',
        method: 'get',
    })
    const body = res?.data ?? {}
    const code = Number(body?.code ?? 200)
    const count = Number((body?.data as SysMessageUnReadCountData | undefined)?.count ?? 0)
    return {
        code,
        data: { count: Number.isFinite(count) && count >= 0 ? count : 0 },
    }
}
