<template>
    <page-content class="traffic-management-page operation-drama-page" :title="title">
        <template #bottom>
            <!-- 总概览数据：与账户信息「基本信息」同一套卡片样式 -->
            <div class="account-stat-card__body">
                <div class="account-stat-card__content">
                    <div class="account-stat-card__label">总概览数据</div>
                    <div class="account-stat-card__hint">统计周期内总流量</div>
                    <div class="account-stat-card__value">{{ displayTrafficGb(overview.periodTotalFlux) }}</div>
                </div>
            </div>

            <!-- 流量明细：独立卡片（筛选 + 趋势） -->
            <el-card class="drama-main-card account-apps-card" shadow="never">
                <div class="detail-header">
                    <div class="detail-title">流量明细</div>
                </div>

                <!-- 时间预设 + 时间范围 -->
                <div class="preset-row">
                    <el-button-group class="preset-group">
                        <el-button size="small" class="preset-btn" :class="{ active: activePreset === 'near6hours' }" @click="applyPreset('near6hours')">
                            近6小时
                        </el-button>
                        <el-button size="small" class="preset-btn" :class="{ active: activePreset === 'today' }" @click="applyPreset('today')">
                            今日
                        </el-button>
                        <el-button size="small" class="preset-btn" :class="{ active: activePreset === 'yesterday' }" @click="applyPreset('yesterday')">
                            昨天
                        </el-button>
                        <el-button size="small" class="preset-btn" :class="{ active: activePreset === 'last7days' }" @click="applyPreset('last7days')">
                            近7天
                        </el-button>
                        <el-button size="small" class="preset-btn" :class="{ active: activePreset === 'thisMonth' }" @click="applyPreset('thisMonth')">
                            本月
                        </el-button>
                        <el-button size="small" class="preset-btn" :class="{ active: activePreset === 'lastMonth' }" @click="applyPreset('lastMonth')">
                            上月
                        </el-button>
                    </el-button-group>

                    <el-date-picker
                        v-model="range"
                        type="datetimerange"
                        size="small"
                        popper-class="traffic-detail-datetime-popper"
                        placement="bottom-start"
                        range-separator="至"
                        start-placeholder="开始时间"
                        end-placeholder="结束时间"
                        style="width: 280px"
                        @change="loadDetail"
                    />
                </div>

                <div class="detail-filter">
                    <span class="filter-label">选择应用</span>
                    <el-select
                        v-model="fixedAppPkg"
                        filterable
                        clearable
                        placeholder="全部应用"
                        style="width: 320px"
                        @change="onAppChange"
                        @clear="onAppClear"
                    >
                        <el-option label="全部应用" value="" />
                        <el-option
                            v-for="opt in appOptions"
                            :key="opt.value"
                            :label="opt.label"
                            :value="opt.value"
                        />
                    </el-select>
                </div>

                <div class="chart-wrap" v-loading="loading">
                    <div ref="chartDomRef" class="chart-echarts" v-show="dataList.length > 0" />
                    <el-empty v-if="dataList.length === 0" description="暂无明细数据" />
                </div>
            </el-card>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAppTrafficDetail } from '@/api/app'
import * as echarts from 'echarts'
import { getAppList } from '@/api/app'
import { mapGetAppListToSelectOptions } from '@/utils/appSelectOptions'

const route = useRoute()
const router = useRouter()

/** 详情展示：流量为 GB，统一带单位（已含 GB 则原样） */
function displayTrafficGb(v: unknown) {
    if (v == null || v === '') return '--'
    const s = String(v).trim()
    if (/gb/i.test(s)) return s
    const n = typeof v === 'number' ? v : Number(s.replace(/,/g, ''))
    if (Number.isFinite(n)) {
        const text = Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(4)))
        return `${text} GB`
    }
    return `${s} GB`
}

/**
 * 折线图 Y 轴需要数值：接口若仍返回纯数字则直接用；若为「1.23 GB」等字符串则抽取首个数字。
 */
function parseNumericForChart(v: unknown): number {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string') {
        const m = v.match(/-?\d+(?:\.\d+)?/)
        if (m) return parseFloat(m[0])
    }
    return 0
}

/**
 * 页面标题：跟随选中的 app。
 */
const selectedAppName = ref(String(route.query.appName ?? '全部应用'))
const selectedAppPkg = ref(String(route.query.appPkg ?? ''))
const title = computed(() => ({
    firstTitle: '流量管理',
    secondTitle: selectedAppName.value ? `流量详情 - ${selectedAppName.value}` : '流量详情',
}))

/**
 * 当前筛选条件：
 * - dataInterval: 时间粒度（分钟）
 */
const form = reactive({
    dataInterval: 1440 as 60 | 1440,
})

/**
 * 时间预设类型：用于一键设置 range。
 */
const activePreset = ref<'near6hours' | 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth'>('near6hours')

const range = ref<[Date, Date] | []>([])
const loading = ref(false)
const totalFlux = ref<string | number>('--')
const dataList = ref<Array<{ time: string; value: number; valueLabel: string }>>([])
const overview = reactive({
    periodTotalFlux: '--' as string | number,
})
const fixedAppPkg = ref(String(route.query.appPkg ?? ''))
const appOptions = ref<Array<{ value: string; label: string; appName?: string }>>([])

async function loadAppOptions() {
    try {
        const res: any = await getAppList()
        appOptions.value = mapGetAppListToSelectOptions(res).map((o) => ({
            value: o.value,
            label: o.label,
            appName: o.raw?.appName,
        }))
    } catch {
        appOptions.value = []
    }
}

function syncSelectedLabelsByPkg(pkg: string) {
    const v = String(pkg ?? '')
    if (!v) {
        selectedAppName.value = '全部应用'
        selectedAppPkg.value = ''
        return
    }
    const matched = appOptions.value.find((x) => x.value === v)
    selectedAppName.value = matched?.appName || '已选择应用'
    selectedAppPkg.value = v
}

async function onAppChange(val: unknown) {
    const v = String(val ?? '')
    fixedAppPkg.value = v
    syncSelectedLabelsByPkg(v)
    await loadDetail()
}

async function onAppClear() {
    fixedAppPkg.value = ''
    syncSelectedLabelsByPkg('')
    await loadDetail()
}
const chartDomRef = ref<HTMLDivElement | null>(null)
// 兼容旧 SVG tooltip 代码中的变量引用（目前模板已切换到 ECharts，不再直接使用）
const chartInnerRef = chartDomRef
let chartInstance: echarts.ECharts | null = null
let isPageUnmounted = false
function resizeChart() {
    chartInstance?.resize()
}
let resizeTimer: number | null = null
function onResize() {
    // 简单 debounce：避免 resize 过程中频繁触发重绘
    if (resizeTimer != null) window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
        resizeTimer = null
        resizeChart()
    }, 100)
}

// 当前 hover 点位索引：用于放大圆点
const hoverIndex = ref<number | null>(null)

// tooltip：悬停信息卡片（时间 + 使用流量）
const tooltip = reactive({
    visible: false,
    left: 0,
    top: 0,
    timeLabel: '',
    valueLabel: '',
})

function toStartOfDay(d: Date) {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
}

function toEndOfDay(d: Date) {
    const x = new Date(d)
    x.setHours(23, 59, 59, 0)
    return x
}

/**
 * 默认区间：最近 7 天（从今天起往前推 6 天，范围内直接覆盖小时/分钟）。
 */
function defaultRange() {
    const end = new Date()
    const start = toStartOfDay(new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000))
    return [start, end] as [Date, Date]
}

/**
 * 日期归一化：将 Date 对齐到整点（分钟/秒归零）。
 * 目的：让“近6小时”的 x 轴从整点开始
 */
function floorToHour(d: Date) {
    const x = new Date(d)
    x.setMinutes(0, 0, 0)
    return x
}

/**
 * Date -> ISO(带时区偏移)：
 * 后端示例要求类似 2026-03-23T23:59:59+08:00。
 */
function formatToIsoWithOffset(date: Date) {
    const d = new Date(date)
    const pad = (v: number) => String(v).padStart(2, '0')
    const y = d.getFullYear()
    const m = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hh = pad(d.getHours())
    const mm = pad(d.getMinutes())
    const ss = pad(d.getSeconds())
    const offsetMin = -d.getTimezoneOffset()
    const sign = offsetMin >= 0 ? '+' : '-'
    const oh = pad(Math.floor(Math.abs(offsetMin) / 60))
    const om = pad(Math.abs(offsetMin) % 60)
    return `${y}-${m}-${day}T${hh}:${mm}:${ss}${sign}${oh}:${om}`
}

/**
 * 时间轴标签格式化：ISO 截取到分钟。
 */
function formatTimeLabel(iso: string) {
    if (!iso) return '--'
    const idx = iso.indexOf('T')
    if (idx < 0) return iso
    return iso.slice(0, 16).replace('T', ' ')
}

/**
 * 计算折线图点位。
 * 画布固定区间：
 * - x: 40~980
 * - y: 20~320
 */
const points = computed(() => {
    const items = dataList.value
    if (!items.length) return []
    const minX = 40
    const maxX = 980
    const minY = 20
    const maxY = 320
    const maxVal = Math.max(...items.map((x) => x.value), 1)
    return items.map((item, idx) => {
        const x = minX + ((maxX - minX) * idx) / Math.max(items.length - 1, 1)
        const y = maxY - (item.value / maxVal) * (maxY - minY)
        return { x, y, key: `${item.time}-${idx}` }
    })
})

const polylinePoints = computed(() => points.value.map((p) => `${p.x},${p.y}`).join(' '))

/**
 * 目标刻度数（用于抽取 x 轴标签），让不同区间显示数量：
 * - 近6小时 / 今日 / 昨日：按小时显示，最多 7 个刻度
 * - 近7天：按天显示，7 个刻度
 * - 本月 / 上月：按天显示，最多 10 个刻度
 */
function tickTargetCount(preset: typeof activePreset.value, itemsLength: number) {
    if (itemsLength <= 1) return itemsLength
    if (preset === 'near6hours') return Math.min(itemsLength, 7)
    if (preset === 'today') return itemsLength <= 8 ? itemsLength : 7
    if (preset === 'yesterday') return Math.min(itemsLength, 7)
    // 近7日折线更密集：x 轴刻度数量要更多
    if (preset === 'last7days') return Math.min(itemsLength, 14)
    // 月度区间：刻度少一些，避免文字堆叠
    return Math.min(itemsLength, 12)
}

/**
 * 计算 x 轴要展示的标签集合（关键刻度）。
 * 使用 points 的 x 值定位到 viewBox（宽度 1000），转成百分比用于 CSS absolute。
 */
const xAxisLabels = computed(() => {
    const items = dataList.value
    const ps = points.value
    if (!items.length || !ps.length) return []

    const target = tickTargetCount(activePreset.value, items.length)
    // 抽取时确保包含首尾
    const step = target <= 1 ? 1 : Math.ceil((items.length - 1) / (target - 1))

    const indices: number[] = []
    for (let i = 0; i < items.length; i += step) indices.push(i)
    if (indices[indices.length - 1] !== items.length - 1) indices.push(items.length - 1)

    const formatHourly = (iso: string) => {
        // iso: 2026-03-23T09:00:00+08:00
        const month = iso.slice(5, 7)
        const day = iso.slice(8, 10)
        const hour = iso.slice(11, 13)
        // 示例要求：3.23 9:00
        return `${Number(month)}.${Number(day)} ${Number(hour)}:00`
    }

    const formatDaily = (iso: string) => {
        const month = iso.slice(5, 7)
        const day = iso.slice(8, 10)
        return `${Number(month)}.${Number(day)}`
    }

    const formatLabel = (iso: string) => {
        if (activePreset.value === 'near6hours' || activePreset.value === 'today' || activePreset.value === 'yesterday') {
            return formatHourly(iso)
        }
        return formatDaily(iso)
    }

    return indices
        .map((idx) => {
            const p = ps[idx]
            if (!p) return null
            return {
                key: `${items[idx].time}-${idx}`,
                label: formatLabel(items[idx].time),
                leftPct: (p.x / 1000) * 100,
            }
        })
        .filter(Boolean) as Array<{ key: string; label: string; leftPct: number }>
})

/**
 * ECharts 折线图渲染：
 * - x 轴只在关键刻度处显示文字（其余刻度留空）
 * - tooltip 展示 x 轴时间 + 接口返回的流量展示文案
 */
function formatXAxisLabelForECharts(iso: string, preset: typeof activePreset.value) {
    // iso: 2026-03-23T09:00:00+08:00
    const month = iso.slice(5, 7)
    const day = iso.slice(8, 10)
    const hour = iso.slice(11, 13)

    // 优先按粒度决定是否展示小时（用户也可手动切换 dataInterval）
    const useHourly = form.dataInterval === 60

    if (useHourly) {
        if (preset === 'near6hours' || preset === 'today' || preset === 'yesterday') {
            // 示例：3.23 9:00
            return `${Number(month)}.${Number(day)} ${Number(hour)}:00`
        }

        // 其他场景（例如近7日小时粒度、或用户手动选了每小时）
        return `${month}-${day} ${Number(hour)}:00`
    }

    // 月度区间：只展示日期
    return `${month}-${day}`
}

function buildEchartsOption() {
    const items = dataList.value
    const len = items.length
    const preset = activePreset.value

    const xAxisData = items.map((x) => x.time)
    const seriesData = items.map((x) => ({
        value: x.value,
        rawTime: x.time,
        valueLabel: x.valueLabel,
    }))

    let indicesSet = new Set<number>()
    if (len > 0) {
        const target = tickTargetCount(preset, len)
        const step = target <= 1 ? 1 : Math.ceil((len - 1) / (target - 1))
        const indices: number[] = []
        for (let i = 0; i < len; i += step) indices.push(i)
        if (indices[indices.length - 1] !== len - 1) indices.push(len - 1)
        indicesSet = new Set<number>(indices)
    }

    return {
        // containLabel + 更大的右侧留白，避免 GB 与最右点被截断
        grid: { left: 56, right: 34, top: 28, bottom: 56, containLabel: true },
        animation: false,
        tooltip: {
            trigger: 'item',
            confine: true,
            backgroundColor: '#fff',
            borderColor: '#ebeef5',
            borderWidth: 1,
            textStyle: { color: '#303133' },
            extraCssText: 'box-shadow: 0 6px 20px rgba(0,0,0,0.08);border-radius:6px;',
            formatter: (params: any) => {
                const rawTime = params?.data?.rawTime as string
                const timeLabel = formatXAxisLabelForECharts(rawTime, preset)
                const fluxLabel =
                    (params?.data?.valueLabel as string | undefined) ?? displayTrafficGb(params?.value)
                return `
                    <div style="min-width:140px">
                        <div style="font-size:12px;color:#303133;margin-bottom:4px">${timeLabel}</div>
                        <div style="font-size:14px;color:#409eff;font-weight:600">${fluxLabel}</div>
                    </div>
                `
            },
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: xAxisData,
            axisLabel: {
                interval: 0,
                color: '#909399',
                fontSize: 12,
                formatter: (value: string, index: number) => {
                    if (!indicesSet.has(index)) return ''
                    return formatXAxisLabelForECharts(String(value), preset)
                },
            },
            axisLine: { show: false },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            name: 'GB',
            nameTextStyle: { color: '#909399', fontSize: 12, padding: [0, 0, 0, 8] },
            axisLabel: {
                color: '#909399',
                fontSize: 12,
                formatter: (v: number) => (Number.isFinite(v) ? v.toFixed(2) : '--'),
            },
            splitLine: { lineStyle: { color: '#ebeef5' } },
        },
        series: [
            {
                type: 'line',
                name: '使用流量',
                data: seriesData,
                smooth: true,
                clip: false,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: { color: '#409EFF', width: 2 },
                // 空心圆：白色填充 + 蓝色描边
                itemStyle: { color: '#fff', borderColor: '#409EFF', borderWidth: 1.5 },
                emphasis: {
                    scale: true,
                    itemStyle: { color: '#fff', borderColor: '#409EFF', borderWidth: 2 },
                },
            },
        ],
    }
}

function initChart() {
    if (!chartDomRef.value) return
    if (chartInstance) return

    chartInstance = echarts.init(chartDomRef.value, undefined, { renderer: 'canvas' })
    chartInstance.setOption({ animation: false })
    window.addEventListener('resize', onResize)
}

function updateChart() {
    if (!chartInstance) return
    // v-show 会影响容器尺寸，先 resize 让 canvas 获取到正确宽高
    chartInstance.resize()
    const option = buildEchartsOption()
    chartInstance.setOption(option, true)
}

/**
 * tooltip/hover 事件：显示“时间 + 使用流量数字”。
 */
function onPointEnter(e: MouseEvent, idx: number) {
    hoverIndex.value = idx
    onPointMove(e, idx)
}

function onPointMove(e: MouseEvent, idx: number) {
    const inner = chartInnerRef.value
    if (!inner) return
    const rect = inner.getBoundingClientRect()
    const point = dataList.value[idx]
    if (!point) return

    const iso = point.time
    const hour = iso.slice(11, 13)

    tooltip.left = e.clientX - rect.left + 12
    tooltip.top = e.clientY - rect.top - 26
    tooltip.visible = true

    // 时间文案
    tooltip.timeLabel = `${Number(hour)}点的数据`

    tooltip.valueLabel = point.valueLabel
}

function onPointLeave() {
    hoverIndex.value = null
    tooltip.visible = false
}

/**
 * 拉取详情数据并刷新折线图。
 * 关键点：
 * - 校验 range
 * - 时间转换为 ISO(带时区偏移)
 * - 流量展示由后端换算；折线 Y 轴用 parseNumericForChart 抽数
 */
async function loadDetail() {
    const r = range.value
    if (!Array.isArray(r) || r.length !== 2) {
        ElMessage.warning('请选择开始与结束时间')
        return
    }
    loading.value = true
    try {
        const res: any = await getAppTrafficDetail({
            // appPkg 为空：按接口约定查全部
            appPkg: fixedAppPkg.value?.trim() || '',
            startTime: formatToIsoWithOffset(r[0]),
            endTime: formatToIsoWithOffset(r[1]),
            dataInterval: form.dataInterval,
        })
        const data = res?.data?.data ?? res?.data ?? {}
        totalFlux.value = data.totalFlux ?? '--'
        overview.periodTotalFlux = data.totalFlux ?? '--'
        dataList.value = Array.isArray(data.dataList)
            ? data.dataList.map((x: any) => {
                  const raw = x.value
                  return {
                      time: String(x.time ?? ''),
                      value: parseNumericForChart(raw),
                      valueLabel: displayTrafficGb(raw),
                  }
              })
            : []
        await nextTick()
        if (!isPageUnmounted) updateChart()
    } catch {
        totalFlux.value = '--'
        overview.periodTotalFlux = '--'
        dataList.value = []
        await nextTick()
        if (!isPageUnmounted) updateChart()
        ElMessage.error('加载详情失败')
    } finally {
        if (!isPageUnmounted) loading.value = false
    }
}

/**
 * 应用“时间预设”：
 * - 修改 range
 * - 同步触发查询
 */
async function applyPreset(preset: typeof activePreset.value) {
    activePreset.value = preset
    const now = new Date()
    // 预设不仅要设置 range，还要同步设置后端 dataInterval（否则 x 轴刻度格式会不一致）
    if (preset === 'near6hours') {
        form.dataInterval = 60
        // 对齐到整点：保证 x 轴展示从“9:00/10:00”这种整点开始
        const end = floorToHour(now)
        const start = new Date(end.getTime() - 6 * 60 * 60 * 1000)
        range.value = [start, end]
    } else if (preset === 'today') {
        form.dataInterval = 60
        range.value = [toStartOfDay(now), floorToHour(now)]
    } else if (preset === 'yesterday') {
        form.dataInterval = 60
        const y = new Date(now)
        y.setDate(now.getDate() - 1)
        const end = new Date(y)
        end.setHours(23, 0, 0, 0)
        range.value = [toStartOfDay(y), end]
    } else if (preset === 'last7days') {
        // 近7日按小时粒度展示（x 轴包含“xx-xx hh:00”）
        form.dataInterval = 60
        const end = floorToHour(now)
        const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000)
        range.value = [start, end]
    } else if (preset === 'thisMonth') {
        form.dataInterval = 1440
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        range.value = [start, now]
    } else {
        // lastMonth
        form.dataInterval = 1440
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        range.value = [firstDayLastMonth, toEndOfDay(lastDayLastMonth)]
    }
    await loadDetail()
}

onMounted(() => {
    initChart()
    // 列表跳转已改为默认查全部，因此不再依赖 query 透传概览数值
    void loadAppOptions().then(() => syncSelectedLabelsByPkg(fixedAppPkg.value))
    // 默认先展示“近6小时”
    applyPreset('near6hours')
})

onBeforeUnmount(() => {
    // 释放 echarts 实例，避免切页面后仍占用 canvas 内存
    isPageUnmounted = true
    if (chartInstance) chartInstance.dispose()
    chartInstance = null
    window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
:deep(.traffic-management-page.page-content) {
    background-color: #ffffff;
}

.operation-drama-page :deep(.page-content-body) {
    padding-top: 0;
}

.drama-main-card {
    border-radius: 20px;
    overflow: hidden;
}
.account-apps-card {
    margin-top: 20px;
}
.account-apps-card.drama-main-card :deep(.el-card__body) {
    padding: 12px 20px 20px;
    box-sizing: border-box;
}

/* 总概览数据：与账户信息「基本信息」一致 */
.account-stat-card__body {
    margin-top: 12px;
    box-sizing: border-box;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px 18px 24px;
    background: #ffffff;
    border-radius: 20px;
    border: 1px solid #ebeef5;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    position: relative;
    overflow: hidden;
}

.account-stat-card__body::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 15px;
    background: #2d53eb;
    border-radius: 20px 0 0 20px;
}

.account-stat-card__content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    flex: 1;
}

.account-stat-card__label {
    font-size: 14px;
    font-weight: 400;
    color: #303133;
    line-height: 1.4;
}

.account-stat-card__hint {
    font-size: 12px;
    color: #909399;
    line-height: 1.4;
}

.account-stat-card__value {
    font-size: 22px;
    font-weight: 700;
    color: #303133;
    line-height: 1.3;
    word-break: break-all;
}

.detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 0;
    margin-bottom: 16px;
}

.detail-title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
}

.detail-filter {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin: 6px 0 12px;
}
.filter-label {
    font-size: 12px;
    color: #606266;
    flex-shrink: 0;
}
.preset-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
}
.preset-group {
    display: inline-flex;
    align-items: center;
}
.preset-btn {
    margin: 0 !important;
    min-height: 30px;
    padding: 0 14px !important;
}
.preset-btn.active {
    color: #409eff !important;
    border-color: #a0cfff !important;
    background-color: #ecf5ff !important;
}
.preset-row :deep(.el-range-editor.el-input__wrapper) {
    min-height: 30px;
    width: 320px !important;
    max-width: 320px !important;
}
.preset-row :deep(.el-date-editor--datetimerange) {
    width: 320px !important;
    max-width: 320px !important;
}

/* 兜底：确保弹层左对齐输入框（Popper bottom-start） */
:global(.traffic-detail-datetime-popper) {
    transform-origin: left top;
}
.detail-title .name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}
.detail-title .pkg {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
}
.chart-wrap {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 12px;
    background: #fff;
}
.chart-echarts {
    width: 100%;
    height: 340px;
}
.axis-line {
    stroke: #dcdfe6;
    stroke-width: 1;
}
.chart-line {
    fill: none;
    stroke: #409eff;
    stroke-width: 2;
}
.chart-dot {
    fill: #409eff;
}

.chart-inner {
    position: relative;
}

/* x 轴关键刻度标签（按 points.x 抽取后 absolute 定位到 svg 下方） */
.x-axis-labels {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 8px;
    height: 24px;
    pointer-events: none;
}
.x-axis-label {
    position: absolute;
    transform: translateX(-50%);
    font-size: 12px;
    color: #909399;
    white-space: nowrap;
}

/* tooltip：白底、轻阴影、小卡片 */
.chart-tooltip {
    position: absolute;
    z-index: 10;
    min-width: 130px;
    padding: 6px 10px;
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    pointer-events: none;
}
.tooltip-time {
    font-size: 12px;
    color: #303133;
    margin-bottom: 4px;
}
.tooltip-value {
    font-size: 14px;
    color: #409eff;
    font-weight: 600;
}
</style>
