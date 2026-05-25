import request from '@/utils/request'

/** 已注册 App 分页列表 POST /api/apps/page，支持搜索条件 */
export function getAppRegisterPage(data?: {
    current?: number
    size?: number
    appName?: string
    appDeveloperPhone?: string
    appDeveloperName?: string
    recommenderPhone?: string
    recommenderName?: string
}) {
    return request({
        url: '/api/apps/page',
        method: 'post',
        data: {
            current: data?.current ?? 1,
            size: data?.size ?? 10,
            ...(data?.appName && { appName: data.appName }),
            ...(data?.appDeveloperPhone && { appDeveloperPhone: data.appDeveloperPhone }),
            ...(data?.appDeveloperName && { appDeveloperName: data.appDeveloperName }),
            ...(data?.recommenderPhone && { recommenderPhone: data.recommenderPhone }),
            ...(data?.recommenderName && { recommenderName: data.recommenderName }),
        },
    })
}

/** App 详情 GET /api/apps/:id */
export function getAppDetail(id: number | string) {
    return request({
        url: `/api/apps/${id}`,
        method: 'get',
    })
}

/** 获取 App 下拉列表 GET /api/apps/getAppList（appName、appPkg、appDesc） */
export function getAppList() {
    return request({
        url: '/api/apps/getAppList',
        method: 'get',
    })
}

/** 新增 App（注册） POST /api/apps/register */
export function registerApp(data: {
    appName: string
    appPkg: string
    appStoreName?: string
    appStoreUrl?: string
    appDeveloperPhone?: string
    appDeveloperName?: string
    appDeveloperEmail?: string
    recommenderPhone?: string
    recommenderName?: string
    licenseUrl?: string
    licenseKey?: string
    licenseFileUrl?: string
    logoUrl?: string
    vodAppId: number
    usePlayUrl?: 0 | 1
}) {
    return request({
        url: '/api/apps/register',
        method: 'post',
        data,
    })
}

/** 新增 App POST /api/apps（备用） */
export function createApp(data: Record<string, any>) {
    return request({
        url: '/api/apps',
        method: 'post',
        data,
    })
}

/** 更新 App 信息 PUT /api/apps/update */
export function updateApp(data: {
    id: number | string
    appName: string
    appDesc?: string
    appStoreName?: string
    appStoreUrl?: string
    appDeveloperPhone?: string
    appDeveloperName?: string
    appDeveloperEmail?: string
    licenseUrl?: string
    licenseKey?: string
    licenseFileUrl?: string
    logoUrl?: string | null
    vodAppId: number
    usePlayUrl?: 0 | 1
}) {
    return request({
        url: '/api/apps/update',
        method: 'put',
        data: {
            ...data,
            id: Number(data.id),
        },
    })
}

/** 服务配置类型：A-基础版，B-高级版，C-专业版 */
export type ServicePackageTypeCode = 'A' | 'B' | 'C'

export const SERVICE_PACKAGE_TYPE_LABEL: Record<ServicePackageTypeCode, string> = {
    A: '基础版',
    B: '高级版',
    C: '专业版',
}

export function parseServicePackageType(type: unknown): ServicePackageTypeCode | undefined {
    const s = String(type ?? '').trim().toUpperCase()
    if (s === 'A' || s === 'B' || s === 'C') return s
    return undefined
}

export function servicePackageTypeLabel(type: unknown): string {
    const code = parseServicePackageType(type)
    return code ? SERVICE_PACKAGE_TYPE_LABEL[code] : ''
}

/** 新增服务配置 */
export function addServicePackageConfig(data: {
    name: string
    /** 配置类型(A-基础版，B-高级版，C-专业版) */
    type: ServicePackageTypeCode
    /** 默认赠送流量 */
    traffic: number
    /** 短剧数量 */
    dramaCount: number
    /** 支持语言编码列表 */
    supportLanguageList: string[]
    /** 流量预警阈值百分比 */
    trafficWarningRate: number
    /** 超标停用阈值百分比 */
    exceedanceRate: number
}) {
    return request({
        url: '/api/apps/servicePackageConfig/add',
        method: 'post',
        data,
    })
}

/** 编辑服务配置 */
export function updateServicePackageConfig(data: {
    id: number | string
    name: string
    type: ServicePackageTypeCode
    traffic: number
    dramaCount: number
    supportLanguageList: string[]
    trafficWarningRate: number
    exceedanceRate: number
}) {
    return request({
        url: '/api/apps/servicePackageConfig/update',
        method: 'put',
        data: {
            ...data,
            id: Number(data.id),
        },
    })
}

/** 服务配置列表 */
export function getServicePackageConfigList() {
    return request({
        url: '/api/apps/servicePackageConfig/list',
        method: 'get',
    })
}

/** 删除服务配置 */
export function deleteServicePackageConfig(id: number | string) {
    return request({
        url: `/api/apps/servicePackageConfig/${id}`,
        method: 'delete',
    })
}

/** 修改 App 状态 */
export function editAppStatus(id: number | string, status: 0 | 1) {
    return request({
        url: '/api/apps/editStatus',
        method: 'put',
        data: { id: Number(id), status },
    })
}

/** 重置 AppId 与 AppSecret */
export function resetAppSecret(id: number | string) {
    return request({
        url: '/api/apps/resetIdAndSecret',
        method: 'post',
        data: { id: Number(id) },
    })
}

/** 添加开发者账号 */
export function createAppDeveloperAccount(data: {
    userName: string
    nickName?: string
    email?: string
    phoneNumber?: string
    sex?: string
    avatar?: string
    password?: string
    status?: number
    appPkg: string
}) {
    return request({
        url: '/api/apps/createAccount',
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
            appPkg: data.appPkg,
        },
    })
}

/** 年费信息分页 POST /api/apps/feeInfo/page */
export function getFeeInfoPage(data?: {
    current?: number
    size?: number
    appName?: string
    appPkg?: string
}) {
    return request({
        url: '/api/apps/feeInfo/page',
        method: 'post',
        data: {
            current: data?.current ?? 1,
            size: data?.size ?? 10,
            ...(data?.appName && { appName: data.appName }),
            ...(data?.appPkg && { appPkg: data.appPkg }),
        },
    })
}

/** 新增年费记录 POST /api/apps/feeInfo/add */
export function addFeeInfo(data: {
    appPkg: string
    feePaid: number
    paidFileUrl?: string
    validityPeriodStart: string
    validityPeriodEnd: string
    status?: number
}) {
    return request({
        url: '/api/apps/feeInfo/add',
        method: 'post',
        data,
    })
}

/** 更新年费记录 PUT /api/apps/feeInfo/update（编辑用） */
export function updateFeeInfo(data: {
    id: number | string
    feePaid: number
    paidFileUrl?: string
    validityPeriodStart: string
    validityPeriodEnd: string
    status: number
}) {
    return request({
        url: '/api/apps/feeInfo/update',
        method: 'put',
        data,
    })
}

/** CDN 域名分页列表 POST /api/apps/cdnInfo/page */
export function getCdnInfoPage(data?: {
    current?: number
    size?: number
    appName?: string
    cdnDomain?: string
}) {
    return request({
        url: '/api/apps/cdnInfo/page',
        method: 'post',
        data: {
            current: data?.current ?? 1,
            size: data?.size ?? 10,
            ...(data?.appName && { appName: data.appName }),
            ...(data?.cdnDomain && { cdnDomain: data.cdnDomain }),
        },
    })
}

/** 新增 CDN 域名 POST /api/apps/cdnInfo/add */
export function addCdnInfo(data: {
    appPkg: string
    cdnDomain: string
    cdnServiceName: string
}) {
    return request({
        url: '/api/apps/cdnInfo/add',
        method: 'post',
        data,
    })
}

/** 编辑 CDN 域名 PUT /api/apps/cdnInfo/update */
export function updateCdnInfo(data: {
    id: number | string
    cdnDomain: string
    cdnServiceName: string
    status: 0 | 1
}) {
    return request({
        url: '/api/apps/cdnInfo/update',
        method: 'put',
        data,
    })
}

/** 新增 APP 流量 POST /api/apps/traffic/add（totalFlux 为 GB 数值，如 3 表示 3GB） */
export function addAppTraffic(data: {
    appPkg: string
    appName: string
    totalFlux: number
    status: number
}) {
    return request({
        url: '/api/apps/traffic/add',
        method: 'post',
        data,
    })
}

/** 删除 APP 流量 DELETE /api/apps/traffic/delete/{id} */
export function deleteAppTraffic(id: number | string) {
    return request({
        url: `/api/apps/traffic/delete/${id}`,
        method: 'delete',
    })
}

/** APP 流量分页 POST /api/apps/traffic/list */
export function getAppTrafficPage(data?: {
    current?: number
    size?: number
    appName?: string
    appPkg?: string
}) {
    return request({
        url: '/api/apps/traffic/list',
        method: 'post',
        data: {
            current: data?.current ?? 1,
            size: data?.size ?? 10,
            ...(data?.appName && { appName: data.appName }),
            ...(data?.appPkg && { appPkg: data.appPkg }),
        },
    })
}

/** APP 流量详情 POST /api/apps/traffic/detail */
export function getAppTrafficDetail(data: {
    appPkg?: string
    startTime: string
    endTime: string
    dataInterval: 60 | 1440
}) {
    return request({
        url: '/api/apps/traffic/detail',
        method: 'post',
        data,
    })
}

/** 上传文件得到 url（注册文件等）*/
export function uploadFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request({
        url: '/api/upload',
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}
