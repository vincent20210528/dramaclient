import request from '@/utils/request'
import type { OrderQueryParams, OrderListResponse } from '@/types/order'

// 获取订单/任务列表
export function getOrderList(params: OrderQueryParams) {
    return request<OrderListResponse>({
        url: '/serverapi/agent/queryOrderlist',
        method: 'post',
        data: params,
    })
}

// 查询推荐用户列表
export function queryReferralUserList(params: { pageNum: number; pageSize: number; phoneNum?: string }) {
    return request({
        url: '/serverapi/agent/queryReferralUserList',
        method: 'post',
        data: params,
    })
}

