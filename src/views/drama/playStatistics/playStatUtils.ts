/** 播放统计表格（列表 / Top100 / 详情）统一行结构 */
export type PlayStatRow = {
    vid: string
    fileId: string
    /** 原始剧名（接口 title） */
    originTitle: string
    /** 上线剧名（接口 titleLanguage） */
    onlineTitle: string
    /** 字幕语言编码（接口 languageCode） */
    languageCode: string
    /** 配音语言编码（接口 subtitleLanguageCode） */
    subtitleLanguageCode: string
    appName: string
    appPkg: string
    copyrightName: string
    copyrightCode: string
    hostName: string
    episodeNo: number | string
    playCount: number
    /** 播放次数（接口 ownerPlayTimes） */
    ownerPlayTimes: number
    playTraffic: number
    fileSize: number | null
    dateRangeText: string
    /** 该剧总集数（列表接口 dramaCount） */
    dramaCount: number | null
}

/** 接口单行 → {@link PlayStatRow} */
export function normalizePlayStatRow(raw: any): PlayStatRow {
    const episodeNo = Number(raw?.seriesIndex ?? raw?.episodeNo ?? raw?.seriesCount ?? raw?.index)
    const dateText = String(raw?.date ?? '').trim()
    const originTitle = String(raw?.title ?? '').trim()
    const onlineTitle = String(raw?.titleLanguage ?? '').trim()
    const languageCode = String(raw?.languageCode ?? '').trim()
    const subtitleLanguageCode = String(raw?.subtitleLanguageCode ?? '').trim()
    const appName = String(raw?.appName ?? '').trim()
    const appPkg = String(raw?.appPkg ?? '').trim()
    const copyrightName = String(raw?.copyrightName ?? '').trim()
    const copyrightCode = String(raw?.copyrightCode ?? '').trim()
    const hostRaw = String(raw?.hostName ?? '').trim()
    const dcNum = Number(raw?.dramaCount)
    const dramaCount =
        raw?.dramaCount != null &&
        raw?.dramaCount !== '' &&
        Number.isFinite(dcNum) &&
        dcNum >= 0
            ? Math.floor(dcNum)
            : null

    return {
        vid: String(raw?.vid ?? ''),
        fileId: String(raw?.fileId ?? ''),
        originTitle,
        onlineTitle,
        languageCode,
        subtitleLanguageCode,
        appName,
        appPkg,
        copyrightName,
        copyrightCode,
        hostName: hostRaw || '--',
        episodeNo: Number.isFinite(episodeNo) && episodeNo > 0 ? episodeNo : '--',
        playCount: Number(raw?.playTimes ?? raw?.playCount ?? 0),
        ownerPlayTimes: Number(raw?.ownerPlayTimes ?? 0),
        playTraffic: Number(raw?.flux ?? raw?.playTraffic ?? raw?.trafficCount ?? 0),
        fileSize:
            raw?.fileSize == null || raw?.fileSize === '' || !Number.isFinite(Number(raw?.fileSize))
                ? null
                : Number(raw.fileSize),
        dateRangeText: dateText || '--',
        dramaCount,
    }
}

export function formatAppLine(row: PlayStatRow): string {
    const n = row.appName.trim()
    const p = row.appPkg.trim()
    if (!n && !p) return '--'
    if (n && p) return `${n} (${p})`
    return n || p
}

export function formatCopyrightLine(row: PlayStatRow): string {
    const n = row.copyrightName.trim()
    const c = row.copyrightCode.trim()
    if (!n && !c) return '--'
    if (n && c) return `${n}（${c}）`
    return n || c
}

export function formatCount(v: unknown) {
    const n = Number(v ?? 0)
    return Number.isFinite(n) ? n.toLocaleString('zh-CN') : '--'
}

export function formatTraffic(v: unknown) {
    const n = Number(v ?? 0)
    if (!Number.isFinite(n) || n < 0) return '--'
    const gb = n / (1000 * 1000 * 1000)
    if (gb >= 1000) {
        return `${(gb / 1000).toLocaleString('zh-CN', { maximumFractionDigits: 2 })} TB`
    }
    if (gb >= 1) {
        return `${gb.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} GB`
    }
    const mb = n / (1000 * 1000)
    return `${mb.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} MB`
}

/** 剧集筛选：合法正整数 → API seriesIndex */
export function parseSeriesIndexForApi(raw: string): number | undefined {
    const t = String(raw ?? '').trim()
    if (!t) return undefined
    const n = parseInt(t, 10)
    if (!Number.isFinite(n) || n < 1) return undefined
    return n
}

/**
 * 分页 / Top100 共用的 dataType：overview | detailedView | 具体包名。
 */
export function resolvePlayStatDataType(raw: unknown): string {
    const t = String(raw ?? '').trim()
    if (t === 'overview' || t === 'detailedView') return t
    if (t) return t
    return 'overview'
}

/** 运营管理菜单下的播放统计（与短剧管理共用页面，路径不同） */
export function isOperationPlayStatRoute(path: string) {
    return String(path ?? '').startsWith('/operation/playStatistics')
}

export function getPlayStatListRouteName(path: string) {
    return isOperationPlayStatRoute(path) ? 'operationPlayStatistics' : 'dramaPlayStatistics'
}

export function getPlayStatDetailRouteName(path: string) {
    return isOperationPlayStatRoute(path)
        ? 'operationPlayStatisticsDetail'
        : 'dramaPlayStatisticsDetail'
}

export function getPlayStatListSessionKey(path: string) {
    return isOperationPlayStatRoute(path)
        ? 'operationPlayStatistics:listSession:v1'
        : 'dramaPlayStatistics:listSession:v1'
}

export function getPlayStatPageTitle(path: string) {
    return {
        firstTitle: isOperationPlayStatRoute(path) ? '运营管理' : '短剧管理',
        secondTitle: '播放统计',
    }
}

export type PlayStatAppSelectOption = import('@/utils/appSelectOptions').AppSelectOption

export { mapGetAppListToSelectOptions } from '@/utils/appSelectOptions'
