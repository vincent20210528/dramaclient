import request from '@/utils/request'

/** 添加开发者 POST /api/developer/add */
export function addDeveloperAccount(data: {
    userName: string
    nickName?: string
    email?: string
    phoneNumber?: string
    sex?: string
    avatar?: string
    password?: string
    status?: number
    appPkgList: string[]
    /** 服务配置 id，对应 /api/apps/servicePackageConfig/list */
    serviceId?: number
}) {
    return request({
        url: '/api/developer/add',
        method: 'post',
        data: {
            userName: data.userName,
            ...(data.nickName != null && data.nickName !== '' && { nickName: data.nickName }),
            ...(data.email != null && data.email !== '' && { email: data.email }),
            ...(data.phoneNumber != null && data.phoneNumber !== '' && { phoneNumber: data.phoneNumber }),
            ...(data.sex != null && data.sex !== '' && { sex: data.sex }),
            ...(data.avatar != null && data.avatar !== '' && { avatar: data.avatar }),
            ...(data.password != null && data.password !== '' && { password: data.password }),
            status: data.status ?? 1,
            appPkgList: Array.isArray(data.appPkgList) ? data.appPkgList : [],
            ...(data.serviceId != null &&
                Number.isFinite(Number(data.serviceId)) &&
                Number(data.serviceId) > 0 && { serviceId: Number(data.serviceId) }),
        },
    })
}

/** 开发者管理列表分页 POST /api/developer/page */
export function getDevelopersPage(data?: {
    current?: number
    size?: number
    appPkg?: string
}) {
    return request({
        url: '/api/developer/page',
        method: 'post',
        data: {
            current: data?.current ?? 1,
            size: data?.size ?? 10,
            ...(data?.appPkg ? { appPkg: data.appPkg } : {}),
        },
    })
}

/** 更新开发者信息 PUT /api/developer/update */
export function updateDeveloperAccount(data: {
    id: number | string
    userName: string
    nickName?: string
    email?: string
    phoneNumber?: string
    sex?: string
    avatar?: string
    status?: number
    appPkgList: string[]
    serviceId?: number
}) {
    return request({
        url: '/api/developer/update',
        method: 'put',
        data: {
            id: Number(data.id),
            userName: data.userName,
            ...(data.nickName != null && data.nickName !== '' && { nickName: data.nickName }),
            ...(data.email != null && data.email !== '' && { email: data.email }),
            ...(data.phoneNumber != null && data.phoneNumber !== '' && { phoneNumber: data.phoneNumber }),
            ...(data.sex != null && data.sex !== '' && { sex: data.sex }),
            ...(data.avatar != null && data.avatar !== '' && { avatar: data.avatar }),
            status: data.status ?? 1,
            appPkgList: Array.isArray(data.appPkgList) ? data.appPkgList : [],
            ...(data.serviceId != null &&
                Number.isFinite(Number(data.serviceId)) &&
                Number(data.serviceId) > 0 && { serviceId: Number(data.serviceId) }),
        },
    })
}

/** 删除开发者信息 DELETE /api/developer/delete/{id} */
export function deleteDeveloperAccount(id: number | string) {
    return request({
        url: `/api/developer/delete/${id}`,
        method: 'delete',
    })
}

/** 获取开发者 App 列表 GET /api/developer/getAppList */
export function getDeveloperAppList() {
    return request({
        url: '/api/developer/getAppList',
        method: 'get',
    })
}

/** 获取开发者详情 GET /api/developer/detail/{userId} */
export function getDeveloperDetail(userId: number | string) {
    return request({
        url: `/api/developer/detail/${Number(userId)}`,
        method: 'get',
    })
}

/** 充值流量包 POST /api/developer/topUp */
export function topUpDeveloperFlux(data: {
    userId: number | string
    topUpFlux: number
    type: 1 | 2
    topUpTime: string
}) {
    return request({
        url: '/api/developer/topUp',
        method: 'post',
        data: {
            userId: Number(data.userId),
            topUpFlux: Number(data.topUpFlux),
            type: data.type,
            topUpTime: data.topUpTime,
        },
    })
}

/** topUpList 充值时间：接口要求 YYYY-MM-DD */
export function formatTopUpListDate(value?: string | null): string | undefined {
    const s = String(value ?? '').trim()
    if (!s) return undefined
    const datePart = s.slice(0, 10)
    return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : undefined
}

/**
 * 查询开发者充值明细 POST /api/developer/topUpList
 * @example { userId: 11, current: 1, size: 10, startTime: '2026-03-25', endTime: '2026-03-26' }
 */
export function getDeveloperTopUpList(data: {
    userId: number | string
    current?: number
    size?: number
    /** 开始日期 YYYY-MM-DD */
    startTime?: string
    /** 结束日期 YYYY-MM-DD */
    endTime?: string
}) {
    const startTime = formatTopUpListDate(data.startTime)
    const endTime = formatTopUpListDate(data.endTime)
    return request({
        url: '/api/developer/topUpList',
        method: 'post',
        data: {
            userId: Number(data.userId),
            current: data.current ?? 1,
            size: data.size ?? 10,
            ...(startTime ? { startTime } : {}),
            ...(endTime ? { endTime } : {}),
        },
    })
}

