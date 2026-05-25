import request from '../utils/request'
/**
 * 统计概览相关接口（预留）
 * 当前统计概览为空白页，后续可在此添加统计接口
 */

/** 5.1 获取概览总数 */
export interface OverviewTotalCountData {
    /** 在线短剧数 */
    totalOnlineDramaCount: number
    /** 一周内新增短剧数 */
    increaseDramaCount: number
    /** 总 app 数 */
    totalAppCount: number
    /** 日活 app 数 */
    appDailyActive: number
    /** 总收藏数 */
    totalFavoriteCount: number
    /** 一周内收藏增长率（百分比数值，如 7.69 表示 7.69%） */
    increaseFavorite: number
    /** 总喜欢数 */
    totalLikesCount: number
    /** 一周内喜欢增长率 */
    increaseLikes: number
    /** 总播放数 */
    totalPlayCount: number
    /** 一周内播放增长率 */
    increasePlay: number
    /** 总流量（byte） */
    totalTrafficCount: number
    /** 一周内流量增长率 */
    increaseTraffic: number
    /** 一周内短剧增长率 */
    increaseDrama: number
    /** 一周内收藏增长数 */
    increaseFavoriteCount: number
    /** 一周内喜欢增长数 */
    increaseLikesCount: number
    /** 一周内播放增长数 */
    increasePlayCount: number
    /** 一周内流量增长数 */
    increaseTrafficCount: number
}

export const getOverviewTotalCount = () => {
    return request<{ code: number; message: string; data: OverviewTotalCountData }>({
        url: '/api/overview/totalCount',
        method: 'get',
    })
}

/** 排行榜 / 趋势折线图等共用周期：7 / 15 / 30 天 */
export type OverviewRankDateRange = 7 | 15 | 30

/** 趋势单日数据点 */
export interface OverviewTrendPoint {
    date: string
    count: number
}

/** GET /api/overview/trend/{dateRange} */
export interface OverviewTrendRangeData {
    likes: OverviewTrendPoint[]
    plays: OverviewTrendPoint[]
    staffs: OverviewTrendPoint[]
    favorites: OverviewTrendPoint[]
    dramaContents: OverviewTrendPoint[]
}

/** 5.2 按周期获取趋势数据 */
export const getOverviewTrend = (dateRange: OverviewRankDateRange) => {
    return request<{ code: number; message: string; data: OverviewTrendRangeData }>({
        url: `/api/overview/trend/${dateRange}`,
        method: 'get',
    })
}

/** 短剧热播榜单项 */
export interface OverviewDramaPlayRankItem {
    rank: number
    vid: string
    title: string
    playCount: number
    favoriteRate: number
}

/** 单集播放榜单项 */
export interface OverviewEpisodePlayRankItem {
    rank: number
    vid: string
    title: string
    seriesIndex: number
    playCount: number
}

/** GET /api/overview/rank/{dateRange} 返回体 */
export interface OverviewRankRangeData {
    dramaPlayRank: OverviewDramaPlayRankItem[]
    episodePlayRank: OverviewEpisodePlayRankItem[]
}

/** 5.3 按周期获取热播榜 + 单集播放榜 */
export const getOverviewRankRange = (dateRange: OverviewRankDateRange) => {
    return request<{ code: number; message: string; data: OverviewRankRangeData }>({
        url: `/api/overview/rank/${dateRange}`,
        method: 'get',
    })
}

/** App 流量排行单项 */
export interface OverviewAppRankItem {
    rank: number
    appPkg: string
    appName: string
    trafficCount: number
    playCount: number
}

/** 点赞率排行单项 */
export interface OverviewDramaLikeRankItem {
    rank: number
    vid: string
    title: string
    likeCount: number
    playCount: number
    likeRate: number
}

/** GET /api/overview/dramaAppRank */
export interface OverviewDramaAppRankData {
    appRank: OverviewAppRankItem[]
    dramaLikeRank: OverviewDramaLikeRankItem[]
}

/** 5.4 App 渠道榜 + 口碑榜（点赞率） */
export const getOverviewDramaAppRank = () => {
    return request<{ code: number; message: string; data: OverviewDramaAppRankData }>({
        url: '/api/overview/dramaAppRank',
        method: 'get',
    })
}