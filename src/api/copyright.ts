import request from '@/utils/request'

export type CopyrightSourceForm = {
    id?: number
    copyrightCode: string
    copyrightName: string
    contact?: string
    phoneNumber?: string
    email?: string
    contractNo?: string
    expiryDate?: string
    status: 0 | 1
    remarks?: string
}

/** 添加版权方信息 POST /api/copyrightSourceInfo/add */
export function addCopyrightSourceInfo(data: CopyrightSourceForm) {
    return request({
        url: '/api/copyrightSourceInfo/add',
        method: 'post',
        data,
    })
}

/** 分页查询版权方 POST /api/copyrightSourceInfo/page */
export function getCopyrightSourceInfoPage(data?: {
    current?: number
    size?: number
    param?: string
    status?: 0 | 1
}) {
    return request({
        url: '/api/copyrightSourceInfo/page',
        method: 'post',
        data: {
            current: data?.current ?? 1,
            size: data?.size ?? 10,
            ...(data?.param ? { param: data.param } : {}),
            ...(data?.status !== undefined ? { status: data.status } : {}),
        },
    })
}

/** 编辑版权方信息 PUT /api/copyrightSourceInfo/update */
export function updateCopyrightSourceInfo(data: Required<Pick<CopyrightSourceForm, 'id'>> & CopyrightSourceForm) {
    return request({
        url: '/api/copyrightSourceInfo/update',
        method: 'put',
        data,
    })
}

/** 删除版权方 DELETE /api/copyrightSourceInfo/delete/{id} */
export function deleteCopyrightSourceInfo(id: number | string) {
    return request({
        url: `/api/copyrightSourceInfo/delete/${id}`,
        method: 'delete',
    })
}

/** 版权方下拉列表 GET /api/copyrightSourceInfo/list */
export function getCopyrightSourceInfoList() {
    return request({
        url: '/api/copyrightSourceInfo/list',
        method: 'get',
    })
}

