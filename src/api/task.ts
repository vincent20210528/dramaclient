import request from '@/utils/request'
import type {
    TaskDetailQueryParams,
    TaskDetailListResponse,
    TaskDetailViewParams,
    TaskDetailViewResponse,
} from '@/types/task'

// 获取任务明细列表
export function getTaskDetailList(params: TaskDetailQueryParams) {
    return request<TaskDetailListResponse>({
        url: '/serverapi/taskDetails/list',
        method: 'post',
        data: {
            type: params.type || 'crop',
            pageNum: params.pageNum || 1,
            pageSize: params.pageSize || 10,
            ...params,
        },
    })
}

// 获取任务详情
export function getTaskDetailView(params: TaskDetailViewParams) {
    return request<TaskDetailViewResponse>({
        url: '/api/taskDetail/view',
        method: 'post',
        data: params,
    })
}

