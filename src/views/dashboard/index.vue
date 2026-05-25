<template>
    <page-content :title="title">
        <template #bottom>
            <div class="dashboard-page">
                <section class="panel">
                    <div class="kpi-grid">
                        <el-card
                            v-for="(item, i) in kpiCards"
                            :key="item.title"
                            class="kpi-card"
                            shadow="hover"
                        >
                            <div class="kpi-main">
                                <div class="kpi-left">
                                    <div class="kpi-title">{{ item.title }}</div>
                                    <div class="kpi-value">
                                        <span class="num">{{ item.num }}</span>
                                        <span class="unit">{{ item.unit }}</span>
                                    </div>
                                    <div class="kpi-trend">
                                    <div v-if="item.showTrendIcon !== false" class="trend-img">
                                            <img
                                                v-if="item.trendValue >= 0"
                                                src="@/assets/svg/dashboard_up.svg"
                                            />
                                            <!-- 下降 -->
                                            <img v-else src="@/assets/svg/dashboard_down.svg" />
                                        </div>
                                    <div class="trend-value"> {{ item.trend }} </div>
                                    </div>
                                </div>
                                <div class="kpi-icon-wrap">
                                    <img class="kpi-icon" :src="getIcon(kpiIcons[i])" alt="" />
                                </div>
                            </div>
                        </el-card>
                    </div>
                </section>

                <el-card class="panel trend-panel" shadow="never">
                    <div class="trend-panel-head">
                        <h3 class="panel-title trend-panel-head__title">趋势分析区</h3>
                        <div class="trend-panel-head__actions">
                            <el-radio-group v-model="trendChartType" size="default">
                                <el-radio-button value="line">折线图</el-radio-button>
                                <el-radio-button value="bar">柱状图</el-radio-button>
                            </el-radio-group>
                        </div>
                    </div>
                    <el-tabs v-model="trendTab" class="trend-tab">
                        <el-tab-pane label="播放次数" name="play" />
                        <el-tab-pane label="播放流量" name="traffic" />
                        <el-tab-pane label="点赞/收藏" name="engage" />
                        <el-tab-pane label="新增内容" name="newContent" />
                    </el-tabs>
                    <div v-show="trendChartType === 'line'" class="trend-line-section">
                        <div class="trend-line-toolbar">
                            <el-radio-group v-model="trendLineRange" size="default">
                                <el-radio-button :value="7">近 7 天</el-radio-button>
                                <el-radio-button :value="15">近 15 天</el-radio-button>
                                <el-radio-button :value="30">近 30 天</el-radio-button>
                            </el-radio-group>
                        </div>
                        <div
                            class="trend-line-grid"
                            :class="{ 'trend-line-grid--single': !trendSecondaryTitleMap[trendTab] }"
                        >
                            <el-card class="trend-line-card" shadow="never">
                                <div class="trend-title">{{ trendTitleMap[trendTab] }}</div>
                                <div
                                    ref="trendLineChartLeftRef"
                                    class="trend-line-chart-inner"
                                    aria-label="趋势折线图左"
                                />
                            </el-card>
                            <el-card
                                v-if="trendSecondaryTitleMap[trendTab]"
                                class="trend-line-card"
                                shadow="never"
                            >
                                <div class="trend-title">{{ trendSecondaryTitleMap[trendTab] }}</div>
                                <div
                                    ref="trendLineChartRightRef"
                                    class="trend-line-chart-inner"
                                    aria-label="趋势折线图右"
                                />
                            </el-card>
                        </div>
                    </div>
                    <div v-show="trendChartType === 'bar'" class="trend-grid">
                        <el-card class="trend-card" shadow="never">
                            <div class="trend-title">{{ trendTitleMap[trendTab] }}</div>
                            <div class="trend-list">
                                <div
                                    v-for="(v, idx) in trendLeftData[trendTab]"
                                    :key="idx"
                                    class="trend-row"
                                >
                                    <span class="weekday">{{ trendDates[trendTab][idx] }}</span>
                                    <el-tooltip
                                        :content="buildTrendTooltip(trendTab, 'left', idx)"
                                        placement="top"
                                    >
                                        <el-progress
                                            :percentage="v"
                                            :stroke-width="12"
                                            :show-text="false"
                                            :color="'#0756F9'"
                                        />
                                    </el-tooltip>
                                    <span class="trend-value">{{ v }}%</span>
                                </div>
                            </div>
                        </el-card>
                        <el-card
                            v-if="trendSecondaryTitleMap[trendTab]"
                            class="trend-card"
                            shadow="never"
                        >
                            <div class="trend-title">{{ trendSecondaryTitleMap[trendTab] }}</div>
                            <div class="trend-list">
                                <div
                                    v-for="(v, idx) in trendRightData[trendTab]"
                                    :key="idx"
                                    class="trend-row"
                                >
                                    <span class="weekday">{{ trendDates[trendTab][idx] }}</span>
                                    <el-tooltip
                                        :content="buildTrendTooltip(trendTab, 'right', idx)"
                                        placement="top"
                                    >
                                        <el-progress
                                            :percentage="v"
                                            :stroke-width="12"
                                            :show-text="false"
                                            status="success"
                                            :color="'#00C964'"
                                        />
                                    </el-tooltip>
                                    <span class="trend-value">{{ v }}%</span>
                                </div>
                            </div>
                        </el-card>
                    </div>
                </el-card>

                <section class="rank-range-toolbar">
                    <span class="rank-range-toolbar__label">排行榜周期</span>
                    <el-radio-group v-model="rankDateRange" size="default">
                        <el-radio-button :value="7">近 7 天</el-radio-button>
                        <el-radio-button :value="15">近 15 天</el-radio-button>
                        <el-radio-button :value="30">近 30 天</el-radio-button>
                    </el-radio-group>
                </section>
                <section class="rank-grid">
                    <el-card class="rank-card" shadow="never">
                        <div class="rank-head">
                            <img src="https://dramares.huntshorts.ai/imgs/dashboard_dramaPlayRank.png" alt="" />
                            <span>短剧热播榜（播放量）</span>
                        </div>
                        <div v-for="item in dramaPlayRank" :key="`${item.vid}-${item.rank}`" class="rank-item">
                            <div class="rank-main">{{ item.rank }}. {{ item.title }}</div>
                            <div class="rank-num">{{ formatCount(item.playCount) }}</div>
                            <div class="rank-sub">
                                收藏率 {{ formatFavoriteRate(item.favoriteRate) }}
                            </div>
                        </div>
                    </el-card>

                    <el-card class="rank-card" shadow="never">
                        <div class="rank-head">
                            <img src="https://dramares.huntshorts.ai/imgs/dashboard_episodeHotRank.png" alt="" />
                            <span>单集爆点榜</span>
                        </div>
                        <div
                            v-for="item in episodePlayRank"
                            :key="`${item.vid}-${item.seriesIndex}-${item.rank}`"
                            class="rank-item"
                        >
                            <div class="rank-main">{{ item.rank }}. {{ item.title }}</div>
                            <div class="rank-num">{{ formatCount(item.playCount) }}</div>
                            <div class="rank-sub">
                                第 {{ item.seriesIndex }} 集 · vid {{ item.vid }}
                            </div>
                        </div>
                    </el-card>

                    <el-card class="rank-card" shadow="never">
                        <div class="rank-head">
                            <img src="https://dramares.huntshorts.ai/imgs/dashboard_appRank.png" alt="" />
                            <span>App 渠道榜（流量贡献）</span>
                        </div>
                        <div v-for="item in appRankTop" :key="item.appPkg" class="rank-item">
                            <div class="rank-main">{{ item.rank }}. {{ item.appName }}</div>
                            <div class="rank-num">{{ fmtTrafficBytes(item.trafficCount) }}</div>
                            <div class="rank-sub">播放 {{ formatCount(item.playCount) }}</div>
                        </div>
                    </el-card>

                    <el-card class="rank-card" shadow="never">
                        <div class="rank-head">
                            <img src="https://dramares.huntshorts.ai/imgs/dashboard_dramaLikeRank.png" alt="" />
                            <span>口碑榜（点赞率）</span>
                        </div>
                        <div v-for="item in dramaLikeRanks" :key="item.vid" class="rank-item">
                            <div class="rank-main">{{ item.rank }}. {{ item.title }}</div>
                            <div class="rank-num">{{ fmtPct(item.likeRate) }}</div>
                            <div class="rank-sub">
                                播放 {{ formatCount(item.playCount) }} | 点赞
                                {{ formatCount(item.likeCount, 'like') }}
                            </div>
                        </div>
                    </el-card>
                </section>

            </div>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { ElMessage } from 'element-plus'
import { CollectionTag, Film, Grid, Star, VideoPlay, DataLine } from '@element-plus/icons-vue'
import {
    getOverviewTotalCount,
    type OverviewTotalCountData,
    getOverviewTrend,
    type OverviewTrendRangeData,
    type OverviewTrendPoint,
    getOverviewRankRange,
    getOverviewDramaAppRank,
    type OverviewRankDateRange,
    type OverviewDramaPlayRankItem,
    type OverviewEpisodePlayRankItem,
    type OverviewAppRankItem,
    type OverviewDramaLikeRankItem,
    type OverviewDramaAppRankData,
} from '@/api/dashboard'

type TrendKey = 'play' | 'traffic' | 'engage' | 'newContent'
type RightTrendKey = 'play' | 'traffic' | 'engage'

const rankDateRange = ref<OverviewRankDateRange>(7)
const dramaPlayRank = ref<OverviewDramaPlayRankItem[]>([])
const episodePlayRank = ref<OverviewEpisodePlayRankItem[]>([])
const appRankTop = ref<OverviewAppRankItem[]>([])
const dramaLikeRanks = ref<OverviewDramaLikeRankItem[]>([])

const title = {
    firstTitle: '统计概览',
    secondTitle: '',
}

const fmtInt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('zh-CN') : '—')
/** 流量 byte → 可读（GB / TB） */
const fmtTrafficBytes = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes < 0) return '—'
    const gb = bytes / (1000 * 1000 * 1000)
    if (gb >= 1000) {
        const tb = gb / 1000
        return `${tb.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} TB`
    }
    return `${gb.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} GB`
}

/** 折线图 Y 轴刻度：字节 → GB（过小用 MB，≥1024GB 用 TB） */
function formatTrendAxisTraffic(bytes: number): string {
    if (!Number.isFinite(bytes)) return ''
    const abs = Math.abs(bytes)
    if (abs === 0) return '0'
    if (abs < 1000 * 1000) {
        const mb = bytes / (1000 * 1000)
        return `${mb.toFixed(0)} MB`
    }
    const gb = bytes / (1000 * 1000 * 1000)
    if (Math.abs(gb) >= 1000) {
        const tb = gb / 1000
        return `${tb.toFixed(2)} TB`
    }
    const decimals = Math.abs(gb) >= 100 ? 1 : 2
    return `${gb.toFixed(decimals)} GB`
}

/** 当前折线为播放流量（staffs，字节） */
function isTrendSeriesTrafficBytes(tab: TrendKey, side: 'left' | 'right'): boolean {
    return (tab === 'play' && side === 'right') || (tab === 'traffic' && side === 'left')
}
/**
 * 通用数字格式化（默认：播放量 次）
 * @param num 数值
 * @param类型 play=播放量（默认） like=点赞数
 */
function formatCount(
    num: number | null | undefined,
    type: 'play' | 'like' = 'play' // 👈 这里默认就是 play
): string {
    if (num == null || num === 0) {
        return type === 'play' ? '0次' : '0个'
    }

    if (num < 1000) {
        const unit = type === 'play' ? '次' : '个'
        return `${num}${unit}`
    }

    if (num >= 10000) {
        return `${(num / 10000).toFixed(1)}W`
    }

    return `${(num / 1000).toFixed(1)}K`
}
const fmtPct = (n: number) => (Number.isFinite(n) ? `${n.toFixed(2)}%` : '—')
function formatFavoriteRate(n: number | null | undefined) {
    if (n == null || !Number.isFinite(Number(n))) return '—'
    return fmtPct(Number(n))
}
const fmtTrafficDelta = (bytes: number) => {
    if (!Number.isFinite(bytes)) return '—'
    const negative = bytes < 0
    const mb = Math.abs(bytes) / (1000 * 1000)
    let s = ''
    if (mb >= 1000 * 1000) {
        const tb = mb / (1000 * 1000)
        s = `${tb.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} TB`
    } else if (mb >= 1000) {
        const gb = mb / 1000
        s = `${gb.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} GB`
    } else {
        s = `${mb.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} MB`
    }
    return negative ? `-${s}` : s
}
const fmtUnitCount = (count: number, unit: string) => `${fmtInt(count)}${unit}`
/** 增长数部分：非负时带 +，负数为 fmt 自带的负号，不再额外加 + */
const fmtTrendDeltaPart = (count: number, formatted: string) =>
    count >= 0 ? `+${formatted}` : formatted
const fmtTrend = (rate: number, count: number, unit = '') =>
    `${fmtPct(rate)}（${fmtTrendDeltaPart(count, fmtUnitCount(count, unit))}）`

// 计算列表中每一天的占比（近7天，按日期倒序：最新在前）
// 同时返回：近7天日期数组 + 百分比数组
function getDateAndPercent(list: { date: string; count: number }[]) {
    const grouped = new Map<string, number>()
    for (const item of list) {
        const date = String(item?.date ?? '').trim()
        if (!date) continue
        const count = Number(item?.count ?? 0)
        grouped.set(date, (grouped.get(date) ?? 0) + (Number.isFinite(count) ? count : 0))
    }

    const normalized = Array.from(grouped.entries())
        .map(([date, count]) => ({
            date,
            count: Math.max(Number(count ?? 0), 0),
        }))
        .sort((a, b) => b.date.localeCompare(a.date))

    const recent7 = normalized.slice(0, 7) // 取最近7天（倒序）
    const total = recent7.reduce((sum, cur) => sum + cur.count, 0)

    const dates = recent7.map((item) => item.date) // 日期：2026-04-01
    const counts = recent7.map((item) => Number(item.count ?? 0))
    const percents =
        total === 0
            ? recent7.map(() => 0)
            : recent7.map((item) => Math.round((item.count / total) * 100))

    return { dates, percents, counts }
}

const kpiCards = ref([
    { title: '在线短剧总数', num: '—', unit: '-', trend: '—', trendValue: 0, showTrendIcon: true },
    { title: '接入 App 数', num: '—', unit: '-', trend: '—', trendValue: 0, showTrendIcon: false },
    { title: '累计播放次数', num: '—', unit: '-', trend: '—', trendValue: 0, showTrendIcon: true },
    { title: '总流量', num: '—', unit: '-', trend: '—', trendValue: 0, showTrendIcon: true },
    { title: '总收藏数', num: '—', unit: '-', trend: '—', trendValue: 0, showTrendIcon: true },
    { title: '总喜欢数', num: '—', unit: '-', trend: '—', trendValue: 0, showTrendIcon: true },
])
const kpiIcons = [
    'dashboard_totalOnlineDramaCount',
    'dashboard_totalAppCount',
    'dashboard_totalPlayCount',
    'dashboard_totalTrafficCount',
    'dashboard_totalFavoriteCount',
    'dashboard_totalLikesCount',
]
// 获取图标
const getIcon = (name) => {
    try {
        return `https://dramares.huntshorts.ai/imgs/${name}.png`
    } catch (e) {
        return ''
    }
}
/** 获取总数目 */
const loadOverviewTotal = async () => {
    try {
        const res = await getOverviewTotalCount()
        const body = res.data as { code?: number; data?: OverviewTotalCountData }
        if (Number(body?.code) !== 200 || !body.data) return
        const d = body.data
        kpiCards.value = [
            {
                title: '在线短剧总数',
                num: fmtInt(d.totalOnlineDramaCount), // 纯数字
                unit: '部', // 单位
                trend: fmtTrend(d.increaseDrama, d.increaseDramaCount, '部'),
                trendValue: d.increaseDrama,
                showTrendIcon: true,
            },
            {
                title: '接入 App 数',
                num: fmtInt(d.totalAppCount),
                unit: '个',
                trend: `${fmtInt(d.appDailyActive)} （日活）`,
                trendValue: d.appDailyActive,
                showTrendIcon: false,
            },
            {
                title: '累计播放次数',
                num: fmtInt(d.totalPlayCount),
                unit: '次',
                trend: fmtTrend(d.increasePlay, d.increasePlayCount, '次'),
                trendValue: d.increasePlay,
                showTrendIcon: true,
            },
            {
                title: '总流量',
                num: fmtTrafficBytes(d.totalTrafficCount).split(' ')[0], // 流量数字
                unit: fmtTrafficBytes(d.totalTrafficCount).split(' ')[1], // GB
                trend: `${fmtPct(d.increaseTraffic)}（${fmtTrendDeltaPart(
                    d.increaseTrafficCount,
                    fmtTrafficDelta(d.increaseTrafficCount)
                )}）`,
                trendValue: d.increaseTraffic,
                showTrendIcon: true,
            },
            {
                title: '总收藏数',
                num: fmtInt(d.totalFavoriteCount),
                unit: '个',
                trend: fmtTrend(d.increaseFavorite, d.increaseFavoriteCount, '个'),
                trendValue: d.increaseFavorite,
                showTrendIcon: true,
            },
            {
                title: '总喜欢数',
                num: fmtInt(d.totalLikesCount),
                unit: '个',
                trend: fmtTrend(d.increaseLikes, d.increaseLikesCount, '个'),
                trendValue: d.increaseLikes,
                showTrendIcon: true,
            },
        ]
    } catch {
        /* 静默失败，保留占位 */
    }
}

const trendTab = ref<TrendKey>('play')
const trendTitleMap: Record<TrendKey, string> = {
    play: '播放次数趋势',
    traffic: '播放流量趋势',
    engage: '点赞趋势',
    newContent: '新增内容趋势',
}
const trendSecondaryTitleMap: Record<RightTrendKey, string> = {
    play: '播放流量趋势',
    traffic: '播放次数趋势',
    engage: '收藏趋势',
}
const trendLeftData = ref<Record<string, number[]>>({
    play: [],
    traffic: [],
    engage: [],
    newContent: [],
})
const trendRightData = ref<Record<string, number[]>>({
    play: [],
    traffic: [],
    engage: [],
})
const trendLeftRawData = ref<Record<string, number[]>>({
    play: [],
    traffic: [],
    engage: [],
    newContent: [],
})
const trendRightRawData = ref<Record<string, number[]>>({
    play: [],
    traffic: [],
    engage: [],
})
const trendDates = ref<Record<string, string[]>>({
    play: [],
    traffic: [],
    engage: [],
    newContent: [],
})

type TrendChartType = 'line' | 'bar'
const trendChartType = ref<TrendChartType>('line')
const trendLineRange = ref<OverviewRankDateRange>(7)
const trendDataByRange = ref<Partial<Record<OverviewRankDateRange, OverviewTrendRangeData>>>({})
const trendLineChartLeftRef = ref<HTMLDivElement | null>(null)
const trendLineChartRightRef = ref<HTMLDivElement | null>(null)
let trendLineChartInstLeft: echarts.ECharts | null = null
let trendLineChartInstRight: echarts.ECharts | null = null

/** 柱状图仅用近 7 日占比数据（来自 /api/overview/trend/7） */
function hydrateBarChartsFromTrendData(trendDataList: OverviewTrendRangeData) {
    const play = getDateAndPercent(trendDataList.plays)
    const traffic = getDateAndPercent(trendDataList.staffs)
    const like = getDateAndPercent(trendDataList.likes)
    const content = getDateAndPercent(trendDataList.dramaContents)
    const favorite = getDateAndPercent(trendDataList.favorites)

    trendLeftData.value = {
        play: play.percents,
        traffic: traffic.percents,
        engage: like.percents,
        newContent: content.percents,
    }
    trendRightData.value = {
        play: traffic.percents,
        traffic: play.percents,
        engage: favorite.percents,
        newContent: content.percents,
    }
    trendLeftRawData.value = {
        play: play.counts,
        traffic: traffic.counts,
        engage: like.counts,
        newContent: content.counts,
    }
    trendRightRawData.value = {
        play: traffic.counts,
        traffic: play.counts,
        engage: favorite.counts,
    }
    trendDates.value = {
        play: play.dates,
        traffic: traffic.dates,
        engage: like.dates,
        newContent: content.dates,
    }
}

async function ensureTrendLoaded(range: OverviewRankDateRange) {
    if (trendDataByRange.value[range]) {
        if (range === 7) hydrateBarChartsFromTrendData(trendDataByRange.value[range]!)
        return
    }
    try {
        const res = await getOverviewTrend(range)
        const body = res.data as { code?: number; data?: OverviewTrendRangeData }
        if (Number(body?.code) !== 200 || !body.data) return
        trendDataByRange.value = { ...trendDataByRange.value, [range]: body.data }
        if (range === 7) hydrateBarChartsFromTrendData(body.data)
    } catch {
        /* 静默失败 */
    }
}

/** 按周期获取：短剧热播榜 + 单集播放榜 */
const loadOverviewRankRangeData = async () => {
    try {
        const res = await getOverviewRankRange(rankDateRange.value)
        const body = res.data as { code?: number; data?: { dramaPlayRank?: unknown[]; episodePlayRank?: unknown[] } }
        if (Number(body?.code) !== 200 || !body.data) return
        const d = body.data
        dramaPlayRank.value = Array.isArray(d.dramaPlayRank)
            ? (d.dramaPlayRank as OverviewDramaPlayRankItem[])
            : []
        episodePlayRank.value = Array.isArray(d.episodePlayRank)
            ? (d.episodePlayRank as OverviewEpisodePlayRankItem[])
            : []
    } catch {
        /* 静默失败，保留占位 */
    }
}

/** App 渠道榜 + 口碑榜 */
const loadOverviewDramaAppRankData = async () => {
    try {
        const res = await getOverviewDramaAppRank()
        const body = res.data as {
            code?: number
            message?: string
            data?: OverviewDramaAppRankData | null
        }
        if (Number(body?.code) !== 200 || body.data == null) {
            const msg = typeof body?.message === 'string' ? body.message.trim() : ''
            ElMessage.error(msg || `加载 App 渠道榜 / 口碑榜失败（${body?.code ?? '—'}）`)
            appRankTop.value = []
            dramaLikeRanks.value = []
            return
        }
        const d = body.data
        appRankTop.value = Array.isArray(d.appRank) ? d.appRank : []
        dramaLikeRanks.value = Array.isArray(d.dramaLikeRank) ? d.dramaLikeRank : []
    } catch (e: unknown) {
        const ax = e as { response?: { data?: { message?: string } }; message?: string }
        ElMessage.error(ax?.response?.data?.message ?? ax?.message ?? '加载 App 渠道榜 / 口碑榜失败')
        appRankTop.value = []
        dramaLikeRanks.value = []
    }
}

watch(rankDateRange, () => {
    loadOverviewRankRangeData()
})

function formatTrendRaw(tab: TrendKey, side: 'left' | 'right', rawValue: number) {
    if (tab === 'newContent') return `${fmtInt(rawValue)} 部`
    if (tab === 'engage') return `${fmtInt(rawValue)} 个`
    if ((tab === 'play' && side === 'right') || (tab === 'traffic' && side === 'left')) {
        return fmtTrafficBytes(rawValue)
    }
    return `${fmtInt(rawValue)} 次`
}

function buildTrendTooltip(tab: TrendKey, side: 'left' | 'right', idx: number) {
    const dateText = trendDates.value[tab]?.[idx] ?? '--'
    const rawList = side === 'left' ? trendLeftRawData.value[tab] : trendRightRawData.value[tab]
    const rawValue = Number(rawList?.[idx] ?? 0)
    return `${dateText}：${formatTrendRaw(tab, side, rawValue)}`
}

function aggregateTrendByDate(points: OverviewTrendPoint[]) {
    const m = new Map<string, number>()
    for (const p of points) {
        const d = String(p?.date ?? '').trim()
        if (!d) continue
        const c = Number(p?.count ?? 0)
        if (!Number.isFinite(c)) continue
        m.set(d, (m.get(d) ?? 0) + c)
    }
    return m
}

function buildSingleTrendSeries(points: OverviewTrendPoint[]) {
    const m = aggregateTrendByDate(points)
    const categories = [...m.keys()].sort((a, b) => a.localeCompare(b))
    const data = categories.map((d) => m.get(d) ?? 0)
    return { categories, data }
}

function buildTrendSingleLineOption(
    tab: TrendKey,
    side: 'left' | 'right',
    seriesName: string,
    categories: string[],
    data: number[],
    color: string,
    yAxisAsTrafficBytes = false
): EChartsOption {
    const n = categories.length
    const rotate = n > 10 ? 34 : 0
    /** 底部留白：点多 / 倾斜时加大，避免日期贴边被裁切 */
    const bottomPx = rotate > 0 ? (n > 24 ? 78 : n > 14 ? 64 : 50) : n > 7 ? 44 : 36

    return {
        tooltip: {
            trigger: 'axis',
            formatter(params: unknown) {
                const arr = Array.isArray(params) ? params : [params]
                const p = arr[0] as {
                    axisValue?: string
                    axisValueLabel?: string
                    name?: string
                    value?: number
                }
                const axisRaw = String(p?.axisValue ?? p?.axisValueLabel ?? p?.name ?? '')
                const v = Number(p?.value ?? 0)
                return `${axisRaw}<br/>${seriesName}：${formatTrendRaw(tab, side, v)}`
            },
        },
        grid: {
            left: 10,
            right: 18,
            top: 14,
            bottom: bottomPx,
            containLabel: true,
        },
        // ECharts 类目轴支持 boundaryGap 为 [number, number]，部分 TS 定义仅写了 boolean，此处断言与官方配置一致
        xAxis: {
            type: 'category',
            boundaryGap: [0.03, 0.1],
            data: categories,
            axisLabel: {
                rotate,
                hideOverlap: true,
                margin: 12,
                fontSize: n > 20 ? 10 : 11,
                formatter(value: string) {
                    if (n > 16 && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                        return value.slice(5)
                    }
                    return value
                },
            },
        } as EChartsOption['xAxis'],
        yAxis: {
            type: 'value',
            scale: true,
            splitLine: { lineStyle: { type: 'dashed', opacity: 0.7 } },
            ...(yAxisAsTrafficBytes
                ? {
                      axisLabel: {
                          formatter(value: number) {
                              return formatTrendAxisTraffic(value)
                          },
                      },
                  }
                : {}),
        },
        series: [
            {
                name: seriesName,
                type: 'line',
                smooth: true,
                symbolSize: 6,
                data,
                itemStyle: { color },
                lineStyle: { color, width: 2 },
            },
        ],
    }
}

function getTrendTabSeries(data: OverviewTrendRangeData, tab: TrendKey) {
    switch (tab) {
        case 'play':
            return {
                left: data.plays ?? [],
                right: data.staffs ?? [],
                leftName: '播放次数',
                rightName: '播放流量',
            }
        case 'traffic':
            return {
                left: data.staffs ?? [],
                right: data.plays ?? [],
                leftName: '播放流量',
                rightName: '播放次数',
            }
        case 'engage':
            return {
                left: data.likes ?? [],
                right: data.favorites ?? [],
                leftName: '点赞',
                rightName: '收藏',
            }
        case 'newContent':
            return {
                left: data.dramaContents ?? [],
                right: null,
                leftName: '新增内容',
                rightName: null,
            }
    }
}

function renderTrendLineChart() {
    if (trendChartType.value !== 'line') return
    const payload = trendDataByRange.value[trendLineRange.value]
    if (!payload) return

    const tab = trendTab.value
    const { left, right, leftName, rightName } = getTrendTabSeries(payload, tab)

    const leftEl = trendLineChartLeftRef.value
    if (leftEl) {
        const { categories, data } = buildSingleTrendSeries(left)
        if (!trendLineChartInstLeft) trendLineChartInstLeft = echarts.init(leftEl)
        trendLineChartInstLeft.setOption(
            buildTrendSingleLineOption(
                tab,
                'left',
                leftName,
                categories,
                data,
                '#0756F9',
                isTrendSeriesTrafficBytes(tab, 'left')
            ),
            true
        )
    }

    const showRight = tab !== 'newContent' && right && rightName
    if (showRight) {
        const rightEl = trendLineChartRightRef.value
        if (rightEl) {
            const { categories: catR, data: dataR } = buildSingleTrendSeries(right)
            if (!trendLineChartInstRight) trendLineChartInstRight = echarts.init(rightEl)
            trendLineChartInstRight.setOption(
                buildTrendSingleLineOption(
                    tab,
                    'right',
                    rightName,
                    catR,
                    dataR,
                    '#00C964',
                    isTrendSeriesTrafficBytes(tab, 'right')
                ),
                true
            )
        }
    } else {
        trendLineChartInstRight?.dispose()
        trendLineChartInstRight = null
    }

    /**
     * Tab 在「双列 ↔ 单列」间切换时，grid 宽度会变，须等 DOM 布局后再 resize，
     * 否则新增内容等单列图会沿用上一 Tab 的窄宽度。
     */
    void nextTick(() => {
        handleTrendChartResize()
        requestAnimationFrame(() => {
            handleTrendChartResize()
        })
    })
}

function handleTrendChartResize() {
    trendLineChartInstLeft?.resize()
    trendLineChartInstRight?.resize()
}

watch(trendLineRange, async () => {
    await ensureTrendLoaded(trendLineRange.value)
    await nextTick()
    if (trendChartType.value === 'line') {
        renderTrendLineChart()
        handleTrendChartResize()
    }
})

watch(trendChartType, async (t) => {
    if (t === 'bar') {
        await ensureTrendLoaded(7)
        return
    }
    await ensureTrendLoaded(trendLineRange.value)
    await nextTick()
    renderTrendLineChart()
    handleTrendChartResize()
})

watch(trendTab, async () => {
    await nextTick()
    if (trendChartType.value === 'line') {
        renderTrendLineChart()
    }
})

onMounted(async () => {
    loadOverviewTotal()
    await ensureTrendLoaded(7)
    await nextTick()
    renderTrendLineChart()
    loadOverviewRankRangeData()
    loadOverviewDramaAppRankData()
    window.addEventListener('resize', handleTrendChartResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleTrendChartResize)
    trendLineChartInstLeft?.dispose()
    trendLineChartInstLeft = null
    trendLineChartInstRight?.dispose()
    trendLineChartInstRight = null
})

</script>

<style scoped>
:deep(.flex-center.justify-between) {
    display: none;
}
.dashboard-page {
    display: flex;
    flex-direction: column;
    gap: 14px;
}
.panel {
    border-radius: 10px;
}
.panel-title {
    margin: 0 0 12px;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
}
.panel-title.no-margin {
    margin: 0;
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}
.kpi-card {
    border-radius: 20px;
    min-height: 120px;
    border: none;
    box-shadow: none;
}
.kpi-card :deep(.el-card__body) {
    width: 100%;
    padding: 18px 24px;
    border-radius: 20px;
    color: #fff;
    background-color: #c6d7fb;
}
.kpi-grid .kpi-card:nth-child(2) :deep(.el-card__body) {
    background-color: #f8e0d0;
}
.kpi-grid .kpi-card:nth-child(3) :deep(.el-card__body) {
    background-color: rgba(2, 178, 241, 0.2);
}
.kpi-grid .kpi-card:nth-child(4) :deep(.el-card__body) {
    background-color: hsla(155, 98%, 40%, 0.2);
}
.kpi-grid .kpi-card:nth-child(5) :deep(.el-card__body) {
    background-color: hsla(247, 100%, 61%, 0.2);
}
.kpi-grid .kpi-card:nth-child(6) :deep(.el-card__body) {
    background-color: hsla(356, 94%, 62%, 0.2);
}

.kpi-main {
    display: flex;
    align-items: center;
    gap: 8px;
}
.kpi-left {
    min-width: 0;
}
.kpi-title {
    color: #000000;
    font-size: 24px;
    opacity: 0.92;
}
.kpi-value {
    display: flex;
    align-items: center;
    font-size: 30px;
    font-weight: 500;
}
/* 单位单独样式 */
.kpi-value .unit {
    font-size: 16px;
    color: #0756f9;
    margin-left: 8px;
}

/* 数字单独样式 */
.kpi-value .num {
    font-size: 30px;
    font-weight: bold;
    color: #0756f9;
}
.kpi-grid .kpi-card:nth-child(2) :deep(.kpi-value .num),
.kpi-grid .kpi-card:nth-child(2) :deep(.kpi-value .unit) {
    color: #fe8424;
}
.kpi-grid .kpi-card:nth-child(3) :deep(.kpi-value .num),
.kpi-grid .kpi-card:nth-child(3) :deep(.kpi-value .unit) {
    color: #02B2F1;
}
.kpi-grid .kpi-card:nth-child(4) :deep(.kpi-value .num),
.kpi-grid .kpi-card:nth-child(4) :deep(.kpi-value .unit) {
    color: #00c964;
}
.kpi-grid .kpi-card:nth-child(5) :deep(.kpi-value .num),
.kpi-grid .kpi-card:nth-child(5) :deep(.kpi-value .unit) {
    color: #4e37ff;
}
.kpi-grid .kpi-card:nth-child(6) :deep(.kpi-value .num),
.kpi-grid .kpi-card:nth-child(6) :deep(.kpi-value .unit) {
    color: #f9414e;
}
.kpi-trend {
    display: flex;
    gap: 5px;
    align-items: center;
    color: #000000;
    margin-top: 13px;
    font-size: 16px;
    font-weight: 500;
}
.kpi-icon-wrap {
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
}
.kpi-icon {
    margin-right: 36px;
    font-size: 28px;
    color: #fff;
}

.trend-panel-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px 16px;
    margin-bottom: 10px;
}
.trend-panel-head__title {
    margin: 0;
}
.trend-panel-head__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
}
.trend-line-section {
    margin-bottom: 10px;
}
.trend-line-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
    margin-bottom: 12px;
}
.trend-line-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}
.trend-line-grid--single {
    grid-template-columns: 1fr;
}
.trend-line-card {
    border: 1px solid #ebeef5;
}
.trend-line-card :deep(.el-card__body) {
    overflow: visible;
}
.trend-line-chart-inner {
    width: 100%;
    height: 340px;
    min-height: 280px;
    overflow: visible;
}
.trend-tab {
    margin-bottom: 10px;
}
.trend-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 10px;
}
.trend-card {
    border: 1px solid #ebeef5;
}
.trend-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
    color: #303133;
}
.trend-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.trend-row {
    display: grid;
    /* 日期列保持单行显示，避免窄屏下被挤压换行 */
    grid-template-columns: minmax(98px, auto) minmax(0, 1fr) 46px;
    align-items: center;
    gap: 8px;
}
.weekday {
    color: #000000;
    font-size: 14px;
    white-space: nowrap;
}
.trend-value {
    color: #606266;
    font-size: 14px;
    text-align: right;
    white-space: nowrap;
}
.trend-mark {
    font-size: 13px;
    color: #e6a23c;
}

.rank-range-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
    padding: 4px 2px 2px;
}
.rank-range-toolbar__label {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}
.rank-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}
.rank-card {
    border: 1px solid #ebeef5;
    border-radius: 10px;
}
.rank-head {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 20px;
    color: #000000;
    gap: 10px;
    margin-bottom: 10px;
}
.rank-head img {
    width: 36px;
    height: 36px;
    object-fit: contain;
    flex-shrink: 0;
}
.rank-item {
    padding: 12px 0;
    border-top: 1px dashed #ebeef5;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2px 10px;
}
.rank-main {
    color: #303133;
    font-size: 16px;
}
.rank-num {
    color: #409eff;
    font-weight: 600;
    font-size: 14px;
}
.rank-sub {
    grid-column: 1 / 3;
    color: #909399;
    font-size: 14px;
}
</style>
