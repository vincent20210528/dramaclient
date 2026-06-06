import type { AxiosResponse } from 'axios'
import request from '../utils/request'

/**
 * 修改短剧状态
 * @returns axios 响应，接口 body 在 res.data 中
 */
export function updateDramaStatus(id: number | string, status: 0 | 1){
    return request({
        url: '/api/apps/dramasInfo/editStatus',
        method: 'put',
        data: { id: Number(id), status },
        headers: { 'Content-Type': 'application/json' },
    })
}

/** 修改置顶 PUT /api/apps/dramasInfo/editPin */
export interface EditDramaPinParams {
    /** 短剧 id（接口文档为字符串） */
    id: string
    /** 1 置顶 / 0 非置顶 */
    pin: 0 | 1
}

export interface EditDramaPinResponse {
    code: number
    message: string
    data: boolean
    timestamp: number
    version: string
}

/**
 * 修改短剧置顶状态（PUT）
 * @returns axios 响应，接口 body 在 res.data 中
 */
export function editDramaPin(
    data: EditDramaPinParams,
): Promise<AxiosResponse<EditDramaPinResponse>> {
    return request({
        url: '/api/apps/dramasInfo/editPin',
        method: 'put',
        data,
        headers: { 'Content-Type': 'application/json' },
    })
}


/** 添加短剧接口入参（与后端 /api/apps/dramasInfo/add 一致） */
export interface AddDramaParams {
    originVid: string
    /** 字幕语言编码，如 en */
    languageCode: string
    title: string
    titleLanguage: string
    coverImg: string
    description: string
    sex: 0 | 1 | 2
    dramaCount: number
    /** 版权方编码，如 pangle */
    copyrightCode: string
    status: 0 | 1
    seriesStatus: 0 | 1
    /** 发布时间，格式如 2026-03-27 */
    publishTime?: string
    /** 情节标签编码，逗号分隔 */
    dramaTagsCodes: string
    /** 类型（剧分类）编码，逗号分隔 */
    dramaCategoriesCodes: string
    /** 配音语言编码，如 zh */
    subtitleLanguageCode: string
}

/** 添加短剧接口响应 body */
export interface AddDramaResponse {
    code: number
    message: string
    data: null
    timestamp: number
    version: string
}

/**
 * 添加短剧
 * @returns axios 响应，接口 body 在 res.data 中
 */
export function addDrama(data: AddDramaParams): Promise<AxiosResponse<AddDramaResponse>> {
    return request({
        url: '/api/apps/dramasInfo/add',
        method: 'post',
        data,
        headers: { 'Content-Type': 'application/json' },
    })
}

/** 批量添加短剧单条入参 POST /api/apps/dramasInfo/batchAddDrama */
export interface BatchAddDramaItem {
    languageCode: string
    title: string
    titleLanguage: string
    coverImg: string
    description: string
    dramaCount: number
    copyrightCode: string
    dramaTagsCodes: string
    dramaCategoriesCodes: string
    subtitleLanguageCode: string
}

/** 批量添加短剧接口响应 body */
export interface BatchAddDramaResponse {
    code: number
    message: string
    data: boolean | null
    timestamp: number
    version: string
}

/**
 * 批量添加短剧（POST）
 * @returns axios 响应，接口 body 在 res.data 中
 */
export function batchAddDrama(
    data: BatchAddDramaItem[],
): Promise<AxiosResponse<BatchAddDramaResponse>> {
    return request({
        url: '/api/apps/dramasInfo/batchAddDrama',
        method: 'post',
        data,
        headers: { 'Content-Type': 'application/json' },
    })
}

/** YouTube 批量添加短剧 dramasInfo 入参 POST /api/apps/dramasInfo/batchAddDramaForYouTube */
export interface BatchAddDramaForYouTubeDramasInfo {
    languageCode: string
    title: string
    titleLanguage: string
    description: string
    sex: number
    copyrightCode: string
    status: number
    seriesStatus: number
    dramaCategoriesCodes: string
    dramaTagsCodes: string
    subtitleLanguageCode: string
    pin: number
}

/** YouTube 批量添加短剧入参（mode 1 需 playlistUrl） */
export interface BatchAddDramaForYouTubeParams {
    mode: 1 | 2
    playlistUrl?: string
    dramasInfo: BatchAddDramaForYouTubeDramasInfo
}

/**
 * YouTube 批量添加短剧（POST）
 * @returns axios 响应，接口 body 在 res.data 中
 */
export function batchAddDramaForYouTube(
    data: BatchAddDramaForYouTubeParams,
): Promise<AxiosResponse<BatchAddDramaResponse>> {
    return request({
        url: '/api/apps/dramasInfo/batchAddDramaForYouTube',
        method: 'post',
        data,
        headers: { 'Content-Type': 'application/json' },
    })
}

// ========== 编辑短剧 ==========

/** 编辑短剧接口入参（与后端 /api/apps/dramasInfo/update 一致） */
export interface UpdateDramaParams {
    id: number
    originVid: string
    languageCode: string
    title: string
    titleLanguage: string
    coverImg: string
    description: string
    sex: 0 | 1 | 2
    dramaCount: number
    copyrightCode: string
    status: 0 | 1
    seriesStatus: 0 | 1
    pin: 0 | 1
    contentCode: string
    publishTime?: string
    dramaTagsCodes: string
    dramaCategoriesCodes: string
    subtitleLanguageCode: string
}

/** 编辑短剧接口响应 body */
export interface UpdateDramaResponse {
    code: number
    message: string
    data: boolean
    timestamp: number
    version: string
}

/**
 * 编辑短剧（PUT）
 * @returns axios 响应，接口 body 在 res.data 中
 */
export function updateDrama(data: UpdateDramaParams): Promise<AxiosResponse<UpdateDramaResponse>> {
    return request({
        url: '/api/apps/dramasInfo/update',
        method: 'put',
        data,
        headers: { 'Content-Type': 'application/json' },
    })
}

/** 更新短剧封面接口入参 PUT /api/apps/dramasInfo/edit/dramaCoverImg */
export interface UpdateDramaCoverImgParams {
    id: number
    coverImg: string
}

/**
 * 更新短剧封面（PUT）
 * @returns axios 响应，接口 body 在 res.data 中
 */
export function updateDramaCoverImg(
    data: UpdateDramaCoverImgParams,
): Promise<AxiosResponse<UpdateDramaResponse>> {
    return request({
        url: '/api/apps/dramasInfo/edit/dramaCoverImg',
        method: 'put',
        data,
        headers: { 'Content-Type': 'application/json' },
    })
}

// ========== 删除短剧 ==========

/** 删除短剧接口响应 body */
export interface DeleteDramaResponse {
    code: number
    message: string
    data: boolean
    timestamp: number
    version: string
}

/**
 * 删除短剧（DELETE）
 * @param id 短剧信息的 id
 */
export function deleteDrama(id: number): Promise<AxiosResponse<DeleteDramaResponse>> {
    return request({
        url: `/api/apps/dramasInfo/id/${id}`,
        method: 'delete',
    })
}

// ========== 剧集列表（根据短剧 vid 查询） ==========

/** 视频文件处理状态：0 上传中 1 处理中 2 处理完成 -1 上传错误 */
export type HandleStatus = 0 | 1 | 2 | -1

/** 单条剧集（接口返回字段，注意 seresId 为接口原文） */
export interface DramaSeriesItem {
    seresId: number
    vid: string
    seriesCount: number
    seriesName: string
    duration: string
    coverImg: string
    /** 点播播放地址（新需求里不再依赖该字段） */
    playUrl?: string
    status: number
    /** 剧集简介（列表/编辑回显） */
    seresDescription?: string
    createdAt: string
    updatedAt: string
    /** 腾讯云点播文件 ID，上传完成后由后台/前端更新 */
    fileId: string
    /** 文件大小（字节） */
    fileSize?: number | null
    /** 腾讯云点播播放签名（psign），供播放器播放 fileId */
    playSign: string
    /** 0 上传中 1 处理中 2 处理完成 -1 上传错误 */
    handleStatus?: HandleStatus
}

/** 剧集列表响应 body */
export interface DramaSeriesListResponse {
    code: number
    message: string
    data: DramaSeriesItem[]
    timestamp: number
    version: string
}

/** 剧集处理进度统计 */
export interface DramaSeriesCountProcessData {
    uploadedDramaCount: number
    processingDramaCount: number
    uploadingDramaCount: number
    failProcessedDramaCount: number
}

/** 剧集处理进度统计响应 body */
export interface DramaSeriesCountProcessResponse {
    code: number
    message: string
    data: DramaSeriesCountProcessData | null
    timestamp: number
    version: string
}

/** 视频管理分页单条记录（接口：POST /api/apps/dramaSeriesInfo/page） */
export interface DramaSeriesInfoPageRecord {
    seresId: number
    vid: string
    /** 第几集（接口字段 seriesCount） */
    seriesCount: number
    seriesName: string
    duration: string
    coverImg: string
    /** 加密显示的源播放地址 */
    playUrl: string
    /** 加密显示的源 m3u8 地址 */
    m3u8Url: string | null
    status: number
    seresDescription: string
    /** 文件 id */
    fileId: string
    /** 0 上传中 1 处理中 2 处理完成 -1 上传错误 */
    handleStatus: HandleStatus
    createdAt: string
    updatedAt: string
    fileSize?: number | null
    /** 剧名 */
    title: string
    /** 字幕语言 */
    languageCode: string
}

/** 视频管理分页查询入参 */
export interface DramaSeriesInfoPageParams {
    current: number
    size: number
    vid?: string
    fileId?: string
    title?: string
    languageCode?: string
    handleStatus?: -1 | 0 | 1 | 2
    /** 0: 创建时间 1: 修改时间 2: 文件大小 */
    sortType?: 0 | 1 | 2
}

/** 视频管理分页数据结构 */
export interface DramaSeriesInfoPageData {
    records: DramaSeriesInfoPageRecord[]
    total: number
    size: number
    current: number
    pages: number
}

/** 视频管理分页响应 */
export interface DramaSeriesInfoPageResponse {
    code: number
    message: string
    data: DramaSeriesInfoPageData
    timestamp: number
    version: string
}

/**
 * 视频管理分页查询
 * 接口：POST /api/apps/dramaSeriesInfo/page
 */
export function getDramaSeriesInfoPage(
    params: DramaSeriesInfoPageParams,
    requestOptions?: { signal?: AbortSignal },
): Promise<AxiosResponse<DramaSeriesInfoPageResponse>> {
    const body: Record<string, unknown> = {
        current: params.current,
        size: params.size,
        vid: params.vid?.trim() ?? '',
        fileId: params.fileId?.trim() ?? '',
        title: params.title?.trim() ?? '',
        languageCode: params.languageCode?.trim() ?? '',
        handleStatus:
            params.handleStatus === -1 ||
            params.handleStatus === 0 ||
            params.handleStatus === 1 ||
            params.handleStatus === 2
                ? params.handleStatus
                : '',
        sortType: params.sortType === 1 || params.sortType === 2 ? params.sortType : 0,
    }

    return request({
        url: '/api/apps/dramaSeriesInfo/page',
        method: 'post',
        data: body,
        headers: { 'Content-Type': 'application/json' },
        ...(requestOptions?.signal ? { signal: requestOptions.signal } : {}),
    })
}

/** getPlayUrl 入参 type */
export type DramaSeriesInfoPlayUrlType = 'mp4' | 'm3u8'

/** 获取可播放地址入参 */
export interface DramaSeriesInfoGetPlayUrlParams {
    seresId: number
    type: DramaSeriesInfoPlayUrlType
}

/** 获取可播放地址响应 data */
export interface DramaSeriesInfoGetPlayUrlData {
    playUrl: string
}

/**
 * 获取可播放地址
 * 接口：POST /api/apps/dramaSeriesInfo/getPlayUrl
 */
export function getDramaSeriesInfoPlayUrl(
    params: DramaSeriesInfoGetPlayUrlParams,
): Promise<
    AxiosResponse<{
        code: number
        message: string
        data: DramaSeriesInfoGetPlayUrlData
        timestamp: number
        version: string
    }>
> {
    return request({
        url: '/api/apps/dramaSeriesInfo/getPlayUrl',
        method: 'post',
        data: {
            seresId: params.seresId,
            type: params.type,
        },
        headers: { 'Content-Type': 'application/json' },
    })
}

/**
 * 根据短剧 vid 查询剧集列表（GET）
 * @param vid 短剧的 vid
 */
export function getDramaSeriesListByVid(vid: string): Promise<AxiosResponse<DramaSeriesListResponse>> {
    return request({
        url: `/api/apps/dramaSeriesInfo/listByVid/${encodeURIComponent(vid)}`,
        method: 'get',
    })
}

/**
 * 根据短剧 vid 查询剧集每种状态的 处理的个数
 * @param vid 短剧的 vid
 */
export function getSeriesCountProcess(vid: string): Promise<AxiosResponse<DramaSeriesCountProcessResponse>> {
    return request({
        url: `/api/apps/dramaSeriesInfo/seriesCountProcess/${encodeURIComponent(vid)}`,
        method: 'get',
    })
}

/** 刷新剧集视频处理状态（GET） */
export function handleSeriesRefresh(): Promise<AxiosResponse<{ code: number; message: string; data?: unknown }>> {
    return request({
        url: '/api/apps/dramaSeriesInfo/handleSeries',
        method: 'get',
    })
}

// ========== 添加短剧集 ==========

/** 添加短剧集接口入参（与后端 /api/apps/dramaSeriesInfo/add 一致） */
export interface AddDramaSeriesParams {
    vid: string
    seriesCount: number
    seriesName: string
    duration: string
    coverImg: string
    playUrl: string
    /** 1 正常，0 停用 */
    status: 0 | 1
    seresDescription: string
    /** 腾讯云点播 fileId，新增时默认 "" */
    fileId?: string
    /** 文件大小（字节） */
    fileSize?: number | null
    /** 0 上传中 1 处理中 2 处理完成 -1 上传错误，新增时默认 0 */
    handleStatus?: HandleStatus
}

/** 添加短剧集接口响应 body */
export interface AddDramaSeriesResponse {
    code: number
    message: string
    data: boolean
    timestamp: number
    version: string
}

/**
 * 添加短剧集（POST）
 */
export function addDramaSeries(data: AddDramaSeriesParams): Promise<AxiosResponse<AddDramaSeriesResponse>> {
    return request({
        url: '/api/apps/dramaSeriesInfo/add',
        method: 'post',
        data,
        headers: { 'Content-Type': 'application/json' },
    })
}

// ========== 编辑短剧集 ==========

/** 编辑短剧集接口入参（与后端 /api/apps/dramaSeriesInfo/update 一致，seresId 为接口原文） */
export interface UpdateDramaSeriesParams {
    seresId: number
    vid: string
    seriesCount: number
    seriesName: string
    duration: string
    coverImg: string
    playUrl: string
    /** 1 正常，0 停用 */
    status: 0 | 1
    seresDescription: string
    /** 腾讯云点播 fileId */
    fileId?: string
    /** 文件大小（字节） */
    fileSize?: number | null
    /** 0 上传中 1 处理中 2 处理完成 -1 上传错误 */
    handleStatus?: HandleStatus
}

/** 编辑短剧集接口响应 body */
export interface UpdateDramaSeriesResponse {
    code: number
    message: string
    data: boolean
    timestamp: number
    version: string
}

/**
 * 编辑短剧集（PUT）
 */
export function updateDramaSeries(data: UpdateDramaSeriesParams): Promise<AxiosResponse<UpdateDramaSeriesResponse>> {
    return request({
        url: '/api/apps/dramaSeriesInfo/update',
        method: 'put',
        data,
        headers: { 'Content-Type': 'application/json' },
    })
}

// ========== 删除短剧集 ==========

/** 删除短剧集接口响应 body */
export interface DeleteDramaSeriesResponse {
    code: number
    message: string
    data: boolean
    timestamp: number
    version: string
}

/**
 * 删除短剧集（DELETE）
 * @param seresId 短剧集的 seresId
 */
export function deleteDramaSeries(seresId: number): Promise<AxiosResponse<DeleteDramaSeriesResponse>> {
    return request({
        url: `/api/apps/dramaSeriesInfo/seresId/${seresId}`,
        method: 'delete',
    })
}

/** 添加到任务队列中入参 */
export interface UpdateQueueParams {
    vid: string
    index: string
}
/** 添加到任务队列中 */
export function uploadQueue(data: UpdateQueueParams) {
    return request({
        url: '/api/apps/dramaSeriesInfo/uploadQueue',
        method: 'post',
        data,
        headers: { 'Content-Type': 'application/json' },
    })
}

// ========== 分页查询短剧列表 ==========

/** 分页查询请求参数 */
export interface DramaPageParams {
    current: number
    size: number
    /** 短剧 vid（精确/模糊由后端决定） */
    vid?: string
    /** 原始剧名（模糊匹配） */
    title?: string
    languageCode?: string
    /** 上线 1 / 下线 0 */
    status?: 0 | 1
    /** 剧集完结状态：1 已完结 / 0 未完结 */
    seriesStatus?: 0 | 1
    /** 版权方编码 */
    copyrightCode?: string
    /** 剧分类编码（多选） */
    dramaCategoriesCodes?: string[]
    /** 情节标签编码（多选） */
    dramaTagsCodes?: string[]
    /** 剧集数范围，如 1-45、100以上 */
    indexRange?: string
    /** 置顶：1 置顶 / 0 未置顶；不传则不筛选 */
    pin?: 0 | 1
}

/** 分页接口返回的单条短剧（后端字段） */
export interface DramaPageRecord {
    id: number
    vid: string
    originVid: string
    languageName: string
    languageCode: string
    subtitleLanguageName?: string
    subtitleLanguageCode?: string
    /** 腾讯云播放器子应用 ID */
    vodSubAppId?: number | null
    title: string
    titleLanguage: string
    coverImg: string
    description: string
    sex: 0 | 1 | 2
    dramaCount: number
    /** 已上传剧集数（后端可能暂未返回） */
    uploadedDramaCount?: number | null
    /** 处理中剧集数 */
    processingDramaCount?: number | null
    /** 上传中剧集数 */
    uploadingDramaCount?: number | null
    /** 上传失败剧集数 */
    failProcessedDramaCount?: number | null
    /** 类型/剧分类：接口可能返回逗号串或字符串数组 */
    dramaCategories: string | string[] | null
    /** 情节标签展示：接口可能返回逗号串、字符串数组，或与 dramaTags 二选一 */
    plotTags?: string | string[] | null
    /** 情节标签（与 plotTags 同义，部分接口仅返回此项） */
    dramaTags?: string[] | string | null
    /** 情节标签编码串（逗号分隔，与 add 接口 dramaTagsCodes 对应） */
    dramaTagsCodes?: string
    /** 版权方编码（与 add 接口 copyrightCode 对应） */
    copyrightCode?: string
    /** 版权来源信息（分页接口新增嵌套对象） */
    copyrightSourceInfo?: {
        id?: number
        copyrightCode?: string
        copyrightName?: string
        contact?: string
        phoneNumber?: string
        email?: string
        contractNo?: string
        expiryDate?: string | null
        status?: 0 | 1
        remarks?: string
        createdAt?: string
        updatedAt?: string
    } | null
    dramaSource: string
    status: 0 | 1
    seriesStatus: 0 | 1
    totalCollectCount: number | null
    totalLikesCount: number | null
    totalPlayCount: number | null
    publishTime: string | null
    /** 过期时间（yyyy-MM-dd） */
    expiryDate?: string | null
    createdAt: string
    updatedAt: string
     /** 内容等级 */
    contentRating: {
        id: number,
        ratingName: string,
        ratingCode: string,
        ratingValue: number,
        createdAt: string,
        updatedAt: string
    },
    /** 是否置顶 0 未置顶 1置顶 */
    pin: 0 | 1
    /** 热度值 */
    popularityScore: number 
}

/** 分页数据结构 */
export interface DramaPageData {
    records: DramaPageRecord[]
    total: number
    size: number
    current: number
    pages: number
}

/** 分页查询响应 body */
export interface DramaPageResponse {
    code: number
    message: string
    data: DramaPageData
    timestamp: number
    version: string
}

/**
 * 分页查询短剧列表（POST，请求体为 JSON，可带查询条件）
 * 启用 Mock 时由 mock 服务返回模拟数据，否则请求真实接口
 */
export function getDramaPage(
    params: DramaPageParams,
    /** 传入 AbortSignal 可在新查询发起时取消旧请求，避免并发覆盖 */
    requestOptions?: { signal?: AbortSignal }
): Promise<AxiosResponse<DramaPageResponse>> {
    const body: Record<string, unknown> = {
        current: params.current,
        size: params.size,
    }
    if (params.vid?.trim()) body.vid = params.vid.trim()
    if (params.title?.trim()) body.title = params.title.trim()
    if (params.languageCode?.trim()) body.languageCode = params.languageCode.trim()
    if (params.status !== undefined && params.status !== null) body.status = params.status
    if (params.seriesStatus !== undefined && params.seriesStatus !== null) body.seriesStatus = params.seriesStatus
    if (params.copyrightCode?.trim()) body.copyrightCode = params.copyrightCode.trim()
    if (params.dramaCategoriesCodes?.length) body.dramaCategoriesCodes = params.dramaCategoriesCodes
    if (params.dramaTagsCodes?.length) body.dramaTagsCodes = params.dramaTagsCodes
    if (params.indexRange?.trim()) body.indexRange = params.indexRange.trim()
    if (params.pin === 0 || params.pin === 1) body.pin = params.pin

    return request({
        url: '/api/apps/dramasInfo/page',
        method: 'post',
        data: body,
        headers: { 'Content-Type': 'application/json' },
        ...(requestOptions?.signal ? { signal: requestOptions.signal } : {}),
    })
}

/** 播放统计分页查询参数 */
export interface DramaPlayStatsPageParams {
    current: number
    size: number
    /** 开始日期，格式 yyyy-MM-dd */
    startTime?: string
    /** 结束日期，格式 yyyy-MM-dd */
    endTime?: string
    /** 短剧 vid */
    vid?: string
    /** 文件ID */
    fileId?: string
    /** 短剧名关键词（原始剧名或上线剧名模糊搜索，由后端实现） */
    title?: string
    /** 字幕语言 */
    languageCode?: string
    /** 版权方编码 */
    copyrightCode?: string
    /** App 包名（与接口字段 pkgName 一致） */
    pkgName?: string
    /** 集数（传了须同时传 vid） */
    seriesIndex?: number
    /** 排序：0 播放次数，1 播放流量，2 日期倒序 */
    sortType?: 0 | 1 | 2
    /** 总览 overview | 分览 detailedView | 选中 App 时为包名（与 Top100 一致） */
    dataType?: string
    /** 应用包名筛选；全部应用时传空字符串 */
    appPkg?: string
}

/** 播放统计分页单行 */
export interface DramaPlayStatsRecord {
    id: number
    date: string
    fileId: string
    /** 文件大小（字节） */
    fileSize?: number | null
    vid: string
    /** 原始剧名 */
    title: string
    /** 上线剧名 */
    titleLanguage?: string | null
    seriesIndex: number
    playTimes: number
    /** HS播放次数 */
    ownerPlayTimes?: number
    flux: number
    hostName?: string
    appPkg?: string | null
    appName?: string | null
    copyrightName?: string | null
    copyrightCode?: string | null
    /** 字幕语言编码 */
    languageCode?: string | null
    /** 配音语言编码 */
    subtitleLanguageCode?: string | null
    /** 该剧总集数 */
    dramaCount?: number | null
    createdAt?: string
    updatedAt?: string
}

/** 播放统计分页数据 */
export interface DramaPlayStatsPageData {
    records: DramaPlayStatsRecord[]
    total: number
    size: number
    current: number
    pages: number
    /** 当前筛选条件下总播放次数（列表汇总） */
    totalPlayTimes?: number | null
    /** 当前筛选条件下自己播放总次数 */
    totalOwnerPlayTimes?: number | null
    /** 当前筛选条件下总播放流量（字节等，与 flux 字段含义一致） */
    totalFlux?: number | null
}

/** 播放统计分页响应 */
export interface DramaPlayStatsPageResponse {
    code: number
    message: string
    data: DramaPlayStatsPageData
    timestamp: number
    version: string
}

/**
 * 播放统计分页（每日播放）
 * 接口：POST /api/vodPlayDailyInfo/page
 */
export function getDramaPlayStatisticsPage(
    params: DramaPlayStatsPageParams
): Promise<AxiosResponse<DramaPlayStatsPageResponse>> {
    const body: Record<string, unknown> = {
        current: params.current,
        size: params.size,
    }
    if (params.startTime?.trim()) body.startTime = params.startTime.trim()
    if (params.endTime?.trim()) body.endTime = params.endTime.trim()
    if (params.vid?.trim()) body.vid = params.vid.trim()
    if (params.fileId?.trim()) body.fileId = params.fileId.trim()
    if (params.title?.trim()) body.title = params.title.trim()
    if (params.languageCode?.trim()) body.languageCode = params.languageCode.trim()
    if (params.copyrightCode?.trim()) body.copyrightCode = params.copyrightCode.trim()
    if (params.pkgName?.trim()) body.pkgName = params.pkgName.trim()
    if (params.seriesIndex != null && Number.isFinite(Number(params.seriesIndex)) && Number(params.seriesIndex) > 0) {
        body.seriesIndex = Number(params.seriesIndex)
    }
    const st = params.sortType
    body.sortType = st === 2 ? 2 : st === 1 ? 1 : 0
    const dt = params.dataType?.trim()
    if (dt) body.dataType = dt
    if (params.appPkg !== undefined) {
        body.appPkg = String(params.appPkg ?? '').trim()
    }

    return request({
        url: '/api/vodPlayDailyInfo/page',
        method: 'post',
        data: body,
        headers: { 'Content-Type': 'application/json' },
    })
}

/** 播放统计详情分页 POST /api/vodPlayDailyInfo/detail */
export interface VodPlayDailyDetailParams {
    current: number
    size: number
    /** 开始日期 yyyy-MM-dd */
    startTime: string
    /** 结束日期 yyyy-MM-dd */
    endTime: string
    /** 短剧 vid（必传） */
    vid: string
    /** 剧集，空字符串表示不按集筛选 */
    seriesIndex?: string
    fileId?: string
    /** 0 播放量排序（默认） 1 流量排序 */
    sortType?: 0 | 1
    /** overview | detailedView | App 包名 */
    dataType: string
}

/**
 * 短剧播放数据详情分页
 * 接口：POST /api/vodPlayDailyInfo/detail
 */
export function getVodPlayDailyInfoDetail(
    params: VodPlayDailyDetailParams,
): Promise<AxiosResponse<DramaPlayStatsPageResponse>> {
    const body = {
        current: params.current,
        size: params.size,
        startTime: params.startTime.trim(),
        endTime: params.endTime.trim(),
        vid: params.vid.trim(),
        seriesIndex: params.seriesIndex?.trim() ?? '',
        fileId: params.fileId?.trim() ?? '',
        sortType: params.sortType === 1 ? 1 : 0,
        dataType: params.dataType.trim(),
    }
    return request({
        url: '/api/vodPlayDailyInfo/detail',
        method: 'post',
        data: body,
        headers: { 'Content-Type': 'application/json' },
    })
}

/** 剧集留存 POST /api/vodPlayDailyInfo/userActionPlay */
export interface VodPlayUserActionPlayParams {
    /** 短剧 vid（必传） */
    vid: string
    /** 查全部则空或不传；指定 App 时传包名 */
    pkgName?: string
}

export interface VodPlayUserActionPlayRow {
    currentEpisode: number
    totalUsers: number
    totalPlays: number
    nextEpisodeUsers: number
    nextEpisodeUserPlayCount: number
    retentionRate: number
}

/** POST userActionPlay 新版 data 结构（列表在 records，含全剧汇总） */
export interface VodPlayUserActionPlayPayload {
    records: VodPlayUserActionPlayRow[]
    totalPlayCount: number
    totalPlayUserCount: number
}

export interface VodPlayUserActionPlayResponse {
    code: number
    message: string
    /** 新版为对象含 records；旧版可能为行数组（兼容） */
    data: VodPlayUserActionPlayPayload | VodPlayUserActionPlayRow[] | null
    timestamp?: number
    version?: string
}

/**
 * 剧集用户留存/续看行为（按集）
 * 接口：POST /api/vodPlayDailyInfo/userActionPlay
 */
export function postVodPlayDailyUserActionPlay(
    params: VodPlayUserActionPlayParams,
): Promise<AxiosResponse<VodPlayUserActionPlayResponse>> {
    const body: { vid: string; pkgName?: string } = {
        vid: String(params.vid ?? '').trim(),
    }
    const pkg = String(params.pkgName ?? '').trim()
    if (pkg) body.pkgName = pkg
    return request({
        url: '/api/vodPlayDailyInfo/userActionPlay',
        method: 'post',
        data: body,
        headers: { 'Content-Type': 'application/json' },
    })
}

/** Top100 查询入参 POST /api/vodPlayDailyInfo/top100 */
export interface VodPlayDailyTop100Params {
    /** 日期，格式 yyyy-MM-dd（必传） */
    date: string
    /** 0：播放 Top100；1：流量 Top100（默认 0） */
    type?: 0 | 1
    /** 总览 overview | 分览 detailedView | 选中 App 时为包名 */
    dataType: string
}

/**
 * Top100 查询
 * 接口：POST /api/vodPlayDailyInfo/top100
 */
export function getVodPlayDailyTop100(data: VodPlayDailyTop100Params) {
    return request({
        url: '/api/vodPlayDailyInfo/top100',
        method: 'post',
        data: {
            date: data.date,
            type: data.type === 1 ? 1 : 0,
            dataType: data.dataType,
        },
        headers: { 'Content-Type': 'application/json' },
    })
}

/** 每日视频数据统计分页 POST /api/dramaStatsDaily/page */
export interface DramaStatsDailyPageParams {
    current: number
    size: number
    /** yyyy-MM-dd */
    startDate: string
    /** yyyy-MM-dd */
    endDate: string
}

export interface DramaStatsDailyRecord {
    id: number
    date: string
    playTimes: number
    /** HS播放次数 */
    ownerPlayTimes?: number
    /** 流量 byte */
    flux: number
    likes: number
    fave: number
    createdAt?: string
    updatedAt?: string
}

export interface DramaStatsDailyPageData {
    records: DramaStatsDailyRecord[]
    total: number
    size: number
    current: number
    pages: number
    /** 当前筛选条件下汇总 */
    totalPlayTimes?: number | null
    /** 自己播放总次数 */
    totalOwnerPlayTimes?: number | null
    /** 总流量 byte */
    totalFlux?: number | null
    totalLike?: number | null
    totalFave?: number | null
}

export interface DramaStatsDailyPageResponse {
    code: number
    message: string
    data: DramaStatsDailyPageData
    timestamp?: number
    version?: string
}

/**
 * 每日视频数据统计分页
 * 接口：POST /api/dramaStatsDaily/page
 */
export function getDramaStatsDailyPage(
    params: DramaStatsDailyPageParams,
): Promise<AxiosResponse<DramaStatsDailyPageResponse>> {
    return request({
        url: '/api/dramaStatsDaily/page',
        method: 'post',
        data: {
            current: params.current,
            size: params.size,
            startDate: params.startDate.trim(),
            endDate: params.endDate.trim(),
        },
        headers: { 'Content-Type': 'application/json' },
    })
}

/** 24 小时维度用户行为增量 POST /api/dramaStatsDaily/dramaUserActionStatsIncr */
export interface DramaUserActionStatsIncrRow {
    totalLikes: number
    totalFaves: number
    totalPlays: number
    dateTime: string
}

export interface DramaUserActionStatsIncrResponse {
    code: number
    message: string
    data: DramaUserActionStatsIncrRow[]
    timestamp?: number
    version?: string
}

/**
 * 近 24 小时用户行为增量（按小时点位）
 * 接口：POST /api/dramaStatsDaily/dramaUserActionStatsIncr
 */
export function postDramaUserActionStatsIncr(params?: {
    /** 不传或空串：全部包名；否则按包名筛 */
    pkgName?: string
}): Promise<AxiosResponse<DramaUserActionStatsIncrResponse>> {
    const body: { pkgName?: string } = {}
    const pkg = String(params?.pkgName ?? '').trim()
    if (pkg) body.pkgName = pkg
    return request({
        url: '/api/dramaStatsDaily/dramaUserActionStatsIncr',
        method: 'post',
        data: body,
        headers: { 'Content-Type': 'application/json' },
    })
}
