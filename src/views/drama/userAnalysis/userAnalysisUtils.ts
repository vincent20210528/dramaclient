/** 日期 YYYY-MM-DD */
export function formatYmd(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

export function getTodayDate(): Date {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
}

export function getTodayYmd(): string {
    return formatYmd(getTodayDate())
}

export function getYesterdayDate(): Date {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    d.setHours(0, 0, 0, 0)
    return d
}

export function getYesterdayYmd(): string {
    return formatYmd(getYesterdayDate())
}

export type RegionDatePreset = 'day' | 'week' | 'month'

/** 按预设返回日期范围 [start, end]（YYYY-MM-DD） */
export function getRegionDateRangeByPreset(preset: RegionDatePreset): [string, string] {
    const end = getTodayDate()
    if (preset === 'day') {
        const today = formatYmd(end)
        return [today, today]
    }
    if (preset === 'week') {
        const start = new Date(end)
        start.setDate(start.getDate() - 6)
        return [formatYmd(start), formatYmd(end)]
    }
    const start = new Date(end)
    start.setDate(start.getDate() - 29)
    return [formatYmd(start), formatYmd(end)]
}

/** 根据当前选中的范围推断日/周/月预设（自定义范围则返回 null） */
export function detectRegionDatePreset(range: unknown): RegionDatePreset | null {
    if (!Array.isArray(range) || range.length !== 2) return null
    const start = String(range[0] ?? '').trim()
    const end = String(range[1] ?? '').trim()
    if (!start || !end) return null
    if (start === getRegionDateRangeByPreset('day')[0] && end === getRegionDateRangeByPreset('day')[1]) {
        return 'day'
    }
    if (start === getRegionDateRangeByPreset('week')[0] && end === getRegionDateRangeByPreset('week')[1]) {
        return 'week'
    }
    if (start === getRegionDateRangeByPreset('month')[0] && end === getRegionDateRangeByPreset('month')[1]) {
        return 'month'
    }
    return null
}

/** 默认统计区间：当天（日） */
export function getDefaultRegionDateRange(): [string, string] {
    return getRegionDateRangeByPreset('day')
}

/** 禁止选择今天之后的日期（允许选当天） */
export function disableFutureDate(date: Date): boolean {
    const target = new Date(date)
    target.setHours(0, 0, 0, 0)
    const today = getTodayDate()
    return target.getTime() > today.getTime()
}

export interface CountryListItem {
    countryCode: string
    countryName: string
}

/** GET /api/userBehavior/countryList → 国家下拉 */
export function parseCountryListResponse(res: unknown): CountryListItem[] {
    const list = pickApiRecords(res)
    return list
        .map((r) => ({
            countryCode: String(r?.countryCode ?? '').trim(),
            countryName: String(r?.countryName ?? r?.country ?? '').trim(),
        }))
        .filter((x) => x.countryCode)
}

/** 国家下拉展示：countryCode (countryName) */
export function formatCountrySelectLabel(item: CountryListItem): string {
    const code = String(item.countryCode ?? '').trim()
    const name = String(item.countryName ?? '').trim()
    if (code && name) return `${code} (${name})`
    return code || name
}

export function pickApiRecords(res: unknown): any[] {
    const body = (res as { data?: unknown })?.data ?? res
    const data = (body as { data?: unknown })?.data ?? body
    if (Array.isArray(data)) return data
    if (Array.isArray((data as { records?: unknown })?.records)) return (data as { records: any[] }).records
    if (Array.isArray((data as { list?: unknown })?.list)) return (data as { list: any[] }).list
    return []
}

export function pickApiTotal(res: unknown, keys: string[]): number {
    const body = (res as { data?: unknown })?.data ?? res
    const data = (body as { data?: unknown })?.data ?? body
    if (!data || typeof data !== 'object') return 0
    for (const k of keys) {
        const v = Number((data as Record<string, unknown>)[k])
        if (Number.isFinite(v) && v >= 0) return v
    }
    return 0
}

export function formatCount(v: unknown): string {
    const n = Number(v)
    if (!Number.isFinite(n)) return '--'
    return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

/** 占比：接口小数（如 0.2930）转为百分比展示（29.30%） */
export function formatSharePercent(v: unknown, total?: number, part?: number): string {
    let n = Number(v)
    if (!Number.isFinite(n) && total != null && part != null) {
        const t = Number(total)
        const p = Number(part)
        if (Number.isFinite(t) && t > 0 && Number.isFinite(p)) n = p / t
    }
    if (!Number.isFinite(n)) return '--'
    if (Math.abs(n) <= 1) n *= 100
    return `${n.toFixed(2)}%`
}

/** @deprecated 使用 formatSharePercent */
export const formatRatio = formatSharePercent

/**
 * 环比：接口小数（如 1.1962 → +119.62%，-0.2930 → -29.30%）
 * 绝对值 ≤2 时按小数比率 ×100；更大绝对值视为已是百分数
 */
export function formatMom(v: unknown): string {
    let n = Number(v)
    if (!Number.isFinite(n)) return '--'
    if (Math.abs(n) <= 2) n *= 100
    const sign = n > 0 ? '+' : ''
    return `${sign}${n.toFixed(2)}%`
}

export function momTrendClass(v: unknown): string {
    const n = Number(v)
    if (!Number.isFinite(n) || n === 0) return ''
    return n > 0 ? 'ua-mom--up' : 'ua-mom--down'
}

export interface RegionAnalysisRow {
    country: string
    uniqueUserCount: number
    visitCount: number
    userRatio: number | null
    userMom: number | null
    visitRatio: number | null
    visitMom: number | null
}

export function normalizeRegionRow(raw: any, totals: { totalUsers: number; totalVisits: number }): RegionAnalysisRow {
    const country = String(raw?.countryName ?? raw?.country ?? raw?.region ?? '--').trim() || '--'
    const uniqueUserCount = Number(
        raw?.independentUsers ?? raw?.uniqueUserCount ?? raw?.independentUserCount ?? raw?.uv ?? 0,
    )
    const visitCount = Number(raw?.totalVisits ?? raw?.visitCount ?? raw?.totalVisitCount ?? raw?.pv ?? 0)
    const totalUsers = totals.totalUsers > 0 ? totals.totalUsers : 0
    const totalVisits = totals.totalVisits > 0 ? totals.totalVisits : 0

    let userRatio = Number(raw?.userShare ?? raw?.userRatio ?? raw?.userPercent)
    if (!Number.isFinite(userRatio) && totalUsers > 0) userRatio = uniqueUserCount / totalUsers

    let visitRatio = Number(raw?.visitShare ?? raw?.visitRatio ?? raw?.visitPercent ?? raw?.accessRatio)
    if (!Number.isFinite(visitRatio) && totalVisits > 0) visitRatio = visitCount / totalVisits

    const userMom = Number(raw?.userMom ?? raw?.userRingRatio ?? raw?.userChainRatio)
    const visitMom = Number(raw?.visitMom ?? raw?.visitRingRatio ?? raw?.visitChainRatio)

    return {
        country,
        uniqueUserCount: Number.isFinite(uniqueUserCount) ? uniqueUserCount : 0,
        visitCount: Number.isFinite(visitCount) ? visitCount : 0,
        userRatio: Number.isFinite(userRatio) ? userRatio : null,
        userMom: Number.isFinite(userMom) ? userMom : null,
        visitRatio: Number.isFinite(visitRatio) ? visitRatio : null,
        visitMom: Number.isFinite(visitMom) ? visitMom : null,
    }
}

export interface UserRetentionRow {
    statDate: string
    dau: number
    active7d: number
    active30d: number
    retention1d: number | null
    retention3d: number | null
    retention7d: number | null
}

export function normalizeRetentionRow(raw: any): UserRetentionRow {
    const statDate = String(raw?.date ?? raw?.statDate ?? raw?.statDay ?? '--').trim() || '--'
    const dau = Number(raw?.dau ?? raw?.dailyActive ?? raw?.dayActive ?? 0)
    const active7d = Number(raw?.active7d ?? raw?.sevenDayActive ?? raw?.active7Day ?? 0)
    const active30d = Number(raw?.active30d ?? raw?.thirtyDayActive ?? raw?.active30Day ?? 0)
    const retention1d = Number(raw?.retention1d ?? raw?.day1Retention ?? raw?.nextDayRetention ?? raw?.retentionDay1)
    const retention3d = Number(raw?.retention3d ?? raw?.day3Retention ?? raw?.retentionDay3)
    const retention7d = Number(raw?.retention7d ?? raw?.day7Retention ?? raw?.retentionDay7)

    return {
        statDate,
        dau: Number.isFinite(dau) ? dau : 0,
        active7d: Number.isFinite(active7d) ? active7d : 0,
        active30d: Number.isFinite(active30d) ? active30d : 0,
        retention1d: Number.isFinite(retention1d) ? retention1d : null,
        retention3d: Number.isFinite(retention3d) ? retention3d : null,
        retention7d: Number.isFinite(retention7d) ? retention7d : null,
    }
}

const PAGE_SIZES = [10, 20, 50] as const

export function normalizePageSize(size: number): (typeof PAGE_SIZES)[number] {
    return PAGE_SIZES.includes(size as (typeof PAGE_SIZES)[number]) ? (size as (typeof PAGE_SIZES)[number]) : 10
}

/** 前端分页切片（与播放统计列表一致） */
export function sliceTablePage<T>(all: T[], page: number, size: number): { rows: T[]; total: number } {
    const pageSizeSafe = normalizePageSize(size)
    const total = all.length
    const maxPage = Math.max(1, Math.ceil(total / pageSizeSafe) || 1)
    const safePage = Math.min(Math.max(1, page), maxPage)
    const start = (safePage - 1) * pageSizeSafe
    return { rows: all.slice(start, start + pageSizeSafe), total }
}

export function formatRetentionRate(v: number | null): string {
    if (v == null || !Number.isFinite(v)) return '--'
    let n = v
    if (n > 0 && n <= 1) n *= 100
    return `${n.toFixed(2)}%`
}
