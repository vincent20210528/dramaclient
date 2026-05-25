import request from '@/utils/request'

/** 用户国家分布占比 POST /api/userBehavior/countryStats */
export function postCountryStats(data: {
    startDate: string
    endDate: string
    appPkg?: string
    vid?: string
}) {
    return request({
        url: '/api/userBehavior/countryStats',
        method: 'post',
        data: {
            appPkg: String(data.appPkg ?? '').trim(),
            startDate: data.startDate.trim(),
            endDate: data.endDate.trim(),
            vid: String(data.vid ?? '').trim(),
        },
        headers: { 'Content-Type': 'application/json' },
    })
}

/** 国家列表 GET /api/userBehavior/countryList */
export function getCountryList() {
    return request({
        url: '/api/userBehavior/countryList',
        method: 'get',
    })
}

/** 用户活跃与留存 POST /api/userBehavior/userActive */
export function postUserActive(data: { appPkg?: string; countryCode?: string }) {
    return request({
        url: '/api/userBehavior/userActive',
        method: 'post',
        data: {
            appPkg: String(data.appPkg ?? '').trim(),
            countryCode: String(data.countryCode ?? '').trim(),
        },
        headers: { 'Content-Type': 'application/json' },
    })
}
