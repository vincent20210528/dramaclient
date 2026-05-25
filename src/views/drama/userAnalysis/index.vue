<template>
    <page-content class="user-analysis-page operation-drama-page" :title="title">
        <template #bottom>
            <el-card class="drama-main-card" shadow="never">
                <el-tabs v-model="mainTab" class="user-analysis-tabs" @tab-change="onMainTabChange">
                    <!-- 区域分析 -->
                    <el-tab-pane label="区域分析" name="region">
                        <el-form :model="regionSearch" inline class="search-form search-form--single-row">
                            <el-form-item class="region-date-filter">
                                <div class="region-date-filter__inner">
                                    <el-button-group class="region-date-preset-group">
                                        <el-button
                                            size="small"
                                            class="region-date-preset-btn"
                                            :class="{ active: regionDatePreset === 'day' }"
                                            @click="applyRegionDatePreset('day')"
                                        >
                                            日
                                        </el-button>
                                        <el-button
                                            size="small"
                                            class="region-date-preset-btn"
                                            :class="{ active: regionDatePreset === 'week' }"
                                            @click="applyRegionDatePreset('week')"
                                        >
                                            周
                                        </el-button>
                                        <el-button
                                            size="small"
                                            class="region-date-preset-btn"
                                            :class="{ active: regionDatePreset === 'month' }"
                                            @click="applyRegionDatePreset('month')"
                                        >
                                            月
                                        </el-button>
                                    </el-button-group>
                                    <el-date-picker
                                        v-model="regionSearch.dateRange"
                                        class="filter-date-range"
                                        type="daterange"
                                        range-separator="至"
                                        start-placeholder="开始日期"
                                        end-placeholder="结束日期"
                                        value-format="YYYY-MM-DD"
                                        :disabled-date="disableFutureDate"
                                        clearable
                                        @change="onRegionDateRangeChange"
                                    />
                                </div>
                            </el-form-item>
                            <el-form-item>
                                <el-select
                                    v-model="regionSearch.appPkg"
                                    class="filter-select filter-select--app"
                                    placeholder="全部应用"
                                    aria-label="AppID"
                                    filterable
                                    clearable
                                    :loading="appSelectLoading"
                                    @focus="loadAppOptions"
                                >
                                    <el-option label="全部应用" value="" />
                                    <el-option
                                        v-for="opt in allAppOptions"
                                        :key="opt.value"
                                        :label="opt.label"
                                        :value="opt.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item>
                                <el-input
                                    v-model="regionSearch.vid"
                                    class="filter-input filter-input--vid"
                                    placeholder="vid"
                                    clearable
                                    @keyup.enter="handleRegionSearch"
                                />
                            </el-form-item>
                            <el-form-item class="search-form__actions">
                                <el-button class="btn-query" type="primary" @click="handleRegionSearch">查询</el-button>
                                <el-button class="btn-reset" @click="handleRegionReset">重置</el-button>
                            </el-form-item>
                        </el-form>

                        <div class="drama-table-block" v-loading="regionLoading">
                            <el-table
                                class="drama-op-table drama-op-table--compact"
                                :data="regionTableRows"
                                style="width: 100%"
                                :scrollbar-always-on="true"
                                empty-text="暂无数据"
                            >
                                <el-table-column prop="country" label="国家" min-width="120" align="center" show-overflow-tooltip />
                                <el-table-column label="独立用户数" min-width="110" align="center">
                                    <template #default="{ row }">{{ formatCount(row.uniqueUserCount) }}</template>
                                </el-table-column>
                                <el-table-column label="访问总次数" min-width="110" align="center">
                                    <template #default="{ row }">{{ formatCount(row.visitCount) }}</template>
                                </el-table-column>
                                <el-table-column label="用户占比" min-width="100" align="center">
                                    <template #default="{ row }">{{ formatSharePercent(row.userRatio) }}</template>
                                </el-table-column>
                                <el-table-column label="用户环比" min-width="100" align="center">
                                    <template #default="{ row }">
                                        <span :class="momTrendClass(row.userMom)">{{ formatMom(row.userMom) }}</span>
                                    </template>
                                </el-table-column>
                                <el-table-column label="访问次数占比" min-width="120" align="center">
                                    <template #default="{ row }">{{ formatSharePercent(row.visitRatio) }}</template>
                                </el-table-column>
                                <el-table-column label="访问次数环比" min-width="120" align="center">
                                    <template #default="{ row }">
                                        <span :class="momTrendClass(row.visitMom)">{{ formatMom(row.visitMom) }}</span>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>

                        <div class="pagination-wrapper">
                            <el-pagination
                                v-model:current-page="regionCurrentPage"
                                v-model:page-size="regionPageSize"
                                :total="regionTotal"
                                :page-sizes="[10, 20, 50]"
                                layout="total, sizes, ->, prev, pager, next, jumper"
                                prev-text="上一页"
                                next-text="下一页"
                                @size-change="handleRegionPageSizeChange"
                            />
                        </div>

                        <div class="user-analysis-chart-block">
                            <div class="user-analysis-chart-title">区域分布（按独立用户数）</div>
                            <div
                                v-show="regionListAll.length > 0"
                                ref="regionPieChartRef"
                                class="user-analysis-pie-chart"
                            />
                            <el-empty v-if="!regionLoading && regionListAll.length === 0" description="暂无图表数据" />
                        </div>
                    </el-tab-pane>

                    <!-- 用户活跃与留存 -->
                    <el-tab-pane label="用户活跃与留存" name="retention">
                        <el-form :model="retentionSearch" inline class="search-form search-form--single-row">
                            <el-form-item>
                                <el-select
                                    v-model="retentionSearch.countryCode"
                                    class="filter-select filter-select--country"
                                    placeholder="全部国家"
                                    filterable
                                    clearable
                                    :loading="countryListLoading"
                                    @focus="loadCountryList"
                                >
                                    <el-option label="全部国家" value="" />
                                    <el-option
                                        v-for="c in countryOptions"
                                        :key="c.countryCode"
                                        :label="formatCountrySelectLabel(c)"
                                        :value="c.countryCode"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item>
                                <el-select
                                    v-model="retentionSearch.appPkg"
                                    class="filter-select filter-select--app"
                                    placeholder="全部应用"
                                    aria-label="AppID"
                                    filterable
                                    clearable
                                    :loading="appSelectLoading"
                                    @focus="loadAppOptions"
                                >
                                    <el-option label="全部应用" value="" />
                                    <el-option
                                        v-for="opt in allAppOptions"
                                        :key="`ret-${opt.value}`"
                                        :label="opt.label"
                                        :value="opt.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item class="search-form__actions">
                                <el-button class="btn-query" type="primary" @click="handleRetentionSearch">查询</el-button>
                                <el-button class="btn-reset" @click="handleRetentionReset">重置</el-button>
                            </el-form-item>
                        </el-form>

                        <div class="drama-table-block" v-loading="retentionLoading">
                            <el-table
                                class="drama-op-table drama-op-table--compact"
                                :data="retentionTableRows"
                                style="width: 100%"
                                :scrollbar-always-on="true"
                                empty-text="暂无数据"
                            >
                                <el-table-column prop="statDate" label="日期" min-width="120" align="center" show-overflow-tooltip />
                                <el-table-column label="日活" min-width="100" align="center">
                                    <template #default="{ row }">{{ formatCount(row.dau) }}</template>
                                </el-table-column>
                                <el-table-column label="近七日活跃" min-width="110" align="center">
                                    <template #default="{ row }">{{ formatCount(row.active7d) }}</template>
                                </el-table-column>
                                <el-table-column label="近30天活跃" min-width="110" align="center">
                                    <template #default="{ row }">{{ formatCount(row.active30d) }}</template>
                                </el-table-column>
                                <el-table-column label="次留" min-width="90" align="center">
                                    <template #default="{ row }">{{ formatRetentionRate(row.retention1d) }}</template>
                                </el-table-column>
                                <el-table-column label="3日留存" min-width="100" align="center">
                                    <template #default="{ row }">{{ formatRetentionRate(row.retention3d) }}</template>
                                </el-table-column>
                                <el-table-column label="7日留存" min-width="100" align="center">
                                    <template #default="{ row }">{{ formatRetentionRate(row.retention7d) }}</template>
                                </el-table-column>
                            </el-table>
                        </div>

                        <div class="pagination-wrapper">
                            <el-pagination
                                v-model:current-page="retentionCurrentPage"
                                v-model:page-size="retentionPageSize"
                                :total="retentionTotal"
                                :page-sizes="[10, 20, 50]"
                                layout="total, sizes, ->, prev, pager, next, jumper"
                                prev-text="上一页"
                                next-text="下一页"
                                @size-change="handleRetentionPageSizeChange"
                            />
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </el-card>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { ElMessage } from 'element-plus'
import { getAppList } from '@/api/app'
import { getCountryList, postCountryStats, postUserActive } from '@/api/userAnalysis'
import { mapGetAppListToSelectOptions } from '@/utils/appSelectOptions'
import {
    detectRegionDatePreset,
    disableFutureDate,
    getRegionDateRangeByPreset,
    formatCount,
    formatMom,
    formatSharePercent,
    formatCountrySelectLabel,
    formatRetentionRate,
    getDefaultRegionDateRange,
    momTrendClass,
    normalizeRegionRow,
    normalizeRetentionRow,
    parseCountryListResponse,
    pickApiRecords,
    pickApiTotal,
    sliceTablePage,
    type CountryListItem,
    type RegionAnalysisRow,
    type RegionDatePreset,
    type UserRetentionRow,
} from './userAnalysisUtils'

const title = { firstTitle: '短剧管理', secondTitle: '用户分析' }

const mainTab = ref<'region' | 'retention'>('region')

const regionDatePreset = computed(() => detectRegionDatePreset(regionSearch.dateRange))

const appSelectLoading = ref(false)
const allAppOptions = ref<ReturnType<typeof mapGetAppListToSelectOptions>>([])
const countryOptions = ref<CountryListItem[]>([])
const countryListLoading = ref(false)

const regionSearch = reactive({
    dateRange: getDefaultRegionDateRange() as [string, string] | null,
    appPkg: '',
    vid: '',
})

const retentionSearch = reactive({
    countryCode: '',
    appPkg: '',
})

const regionLoading = ref(false)
const retentionLoading = ref(false)
const regionListAll = ref<RegionAnalysisRow[]>([])
const retentionListAll = ref<UserRetentionRow[]>([])

const regionCurrentPage = ref(1)
const regionPageSize = ref(10)
const retentionCurrentPage = ref(1)
const retentionPageSize = ref(10)

const regionTotal = computed(() => regionListAll.value.length)
const retentionTotal = computed(() => retentionListAll.value.length)

const regionTableRows = computed(() =>
    sliceTablePage(regionListAll.value, regionCurrentPage.value, regionPageSize.value).rows,
)
const retentionTableRows = computed(() =>
    sliceTablePage(retentionListAll.value, retentionCurrentPage.value, retentionPageSize.value).rows,
)

const regionPieChartRef = ref<HTMLElement | null>(null)
let regionPieChartInst: echarts.ECharts | null = null

async function loadAppOptions() {
    if (allAppOptions.value.length > 0) return
    appSelectLoading.value = true
    try {
        const res: any = await getAppList()
        allAppOptions.value = mapGetAppListToSelectOptions(res)
    } catch {
        allAppOptions.value = []
    } finally {
        appSelectLoading.value = false
    }
}

async function loadCountryList() {
    if (countryOptions.value.length > 0) return
    countryListLoading.value = true
    try {
        const res: any = await getCountryList()
        const code = Number(res?.data?.code ?? res?.code)
        if (code !== 200 && code !== 0 && res?.data?.code != null) {
            ElMessage.error(res?.data?.message ?? '国家列表加载失败')
            countryOptions.value = []
            return
        }
        countryOptions.value = parseCountryListResponse(res)
    } catch {
        countryOptions.value = []
    } finally {
        countryListLoading.value = false
    }
}

function buildRegionPieOption(rows: RegionAnalysisRow[]): EChartsOption {
    const TOP_N = 5
    const palette = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4']
    const sorted = [...rows].sort((a, b) => b.uniqueUserCount - a.uniqueUserCount)
    const topRows = sorted.slice(0, TOP_N)
    const restRows = sorted.slice(TOP_N)

    type PieDatum = {
        name: string
        value: number
        itemStyle: { color: string }
        otherCountryCount?: number
    }
    const data: PieDatum[] = topRows.map((r, i) => ({
        name: r.country,
        value: r.uniqueUserCount,
        itemStyle: { color: palette[i % palette.length] },
    }))
    if (restRows.length > 0) {
        const otherValue = restRows.reduce((s, r) => s + r.uniqueUserCount, 0)
        if (otherValue > 0) {
            data.push({
                name: '其他',
                value: otherValue,
                itemStyle: { color: '#94a3b8' },
                otherCountryCount: restRows.length,
            })
        }
    }

    return {
        tooltip: {
            trigger: 'item',
            formatter: (p: any) => {
                const pct = Number.isFinite(p.percent) ? `${p.percent.toFixed(2)}%` : '—'
                const d = p.data as PieDatum | undefined
                const lines = [`${p.name}`, `独立用户数：${formatCount(p.value)}`, `占比：${pct}`]
                if (d?.otherCountryCount != null && d.otherCountryCount > 0) {
                    lines.splice(1, 0, `（已合并其余 ${d.otherCountryCount} 个国家/地区）`)
                }
                return lines.join('<br/>')
            },
        },
        legend: { type: 'scroll', bottom: 0, left: 'center' },
        series: [
            {
                type: 'pie',
                radius: ['36%', '68%'],
                center: ['50%', '46%'],
                data,
                label: { formatter: '{b}\n{d}%', fontSize: 11 },
                emphasis: { scale: true, scaleSize: 6 },
            },
        ],
    }
}

function renderRegionPieChart() {
    const el = regionPieChartRef.value
    if (!el || regionListAll.value.length === 0) {
        regionPieChartInst?.dispose()
        regionPieChartInst = null
        return
    }
    if (!regionPieChartInst) {
        regionPieChartInst = echarts.init(el, undefined, { renderer: 'canvas' })
    }
    regionPieChartInst.setOption(buildRegionPieOption(regionListAll.value), true)
    regionPieChartInst.resize()
}

function onRegionChartResize() {
    regionPieChartInst?.resize()
}

async function loadRegionList() {
    const range = regionSearch.dateRange
    if (!range || range.length !== 2 || !range[0] || !range[1]) {
        ElMessage.warning('请选择日期范围')
        return
    }
    regionCurrentPage.value = 1
    regionLoading.value = true
    try {
        const res: any = await postCountryStats({
            startDate: range[0],
            endDate: range[1],
            appPkg: regionSearch.appPkg?.trim() ?? '',
            vid: regionSearch.vid?.trim() ?? '',
        })
        const code = Number(res?.data?.code ?? res?.code)
        if (code !== 200 && code !== 0 && res?.data?.code != null) {
            ElMessage.error(res?.data?.message ?? '国家分布加载失败')
            regionListAll.value = []
            return
        }
        const rawList = pickApiRecords(res)
        let totalUsers = pickApiTotal(res, ['totalUniqueUsers', 'totalUserCount', 'totalUv', 'totalUsers'])
        let totalVisits = pickApiTotal(res, ['totalVisitCount', 'totalVisits', 'totalPv', 'totalAccessCount'])
        if (totalUsers <= 0) {
            totalUsers = rawList.reduce((s, r) => s + Number(r?.independentUsers ?? r?.independentUserCount ?? 0), 0)
        }
        if (totalVisits <= 0) {
            totalVisits = rawList.reduce((s, r) => s + Number(r?.totalVisits ?? r?.totalVisitCount ?? 0), 0)
        }
        const totals = { totalUsers, totalVisits }
        regionListAll.value = rawList.map((r) => normalizeRegionRow(r, totals))
        await nextTick()
        renderRegionPieChart()
    } catch (e: any) {
        regionListAll.value = []
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(typeof msg === 'string' && msg ? msg : '国家分布加载失败')
        regionPieChartInst?.dispose()
        regionPieChartInst = null
    } finally {
        regionLoading.value = false
    }
}

async function loadRetentionList() {
    retentionCurrentPage.value = 1
    retentionLoading.value = true
    try {
        const res: any = await postUserActive({
            appPkg: retentionSearch.appPkg?.trim() ?? '',
            countryCode: retentionSearch.countryCode?.trim() ?? '',
        })
        const code = Number(res?.data?.code ?? res?.code)
        if (code !== 200 && code !== 0 && res?.data?.code != null) {
            ElMessage.error(res?.data?.message ?? '用户活跃与留存加载失败')
            retentionListAll.value = []
            return
        }
        const rows = pickApiRecords(res).map(normalizeRetentionRow)
        rows.sort((a, b) => String(b.statDate).localeCompare(String(a.statDate)))
        retentionListAll.value = rows
    } catch (e: any) {
        retentionListAll.value = []
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(typeof msg === 'string' && msg ? msg : '用户活跃与留存加载失败')
    } finally {
        retentionLoading.value = false
    }
}

function handleRegionPageSizeChange() {
    regionCurrentPage.value = 1
}

function handleRetentionPageSizeChange() {
    retentionCurrentPage.value = 1
}

function applyRegionDatePreset(preset: RegionDatePreset) {
    regionSearch.dateRange = getRegionDateRangeByPreset(preset)
    void loadRegionList()
}

function onRegionDateRangeChange(val: unknown) {
    if (val == null || (Array.isArray(val) && val.length === 0)) {
        regionSearch.dateRange = null
    }
}

function handleRegionSearch() {
    void loadRegionList()
}

function handleRegionReset() {
    regionSearch.dateRange = getDefaultRegionDateRange()
    regionSearch.appPkg = ''
    regionSearch.vid = ''
    void loadRegionList()
}

function handleRetentionSearch() {
    void loadRetentionList()
}

function handleRetentionReset() {
    retentionSearch.countryCode = ''
    retentionSearch.appPkg = ''
    void loadRetentionList()
}

const retentionTabLoaded = ref(false)

function onMainTabChange(name: string | number) {
    if (name === 'region') {
        nextTick(() => renderRegionPieChart())
    }
}

watch(mainTab, (tab) => {
    if (tab === 'retention' && !retentionTabLoaded.value) {
        retentionTabLoaded.value = true
        void loadCountryList()
        void loadRetentionList()
    }
})

onMounted(() => {
    void loadAppOptions()
    void loadRegionList()
    window.addEventListener('resize', onRegionChartResize)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', onRegionChartResize)
    regionPieChartInst?.dispose()
    regionPieChartInst = null
})
</script>

<style scoped lang="scss">
.user-analysis-page :deep(.page-content__bottom) {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.user-analysis-tabs :deep(.el-tabs__header) {
    margin-bottom: 12px;
}

.search-form--single-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin-bottom: 12px;
}
.search-form--single-row > :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 0;
}

.region-date-filter__inner {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.region-date-preset-group {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
}
.region-date-preset-btn {
    margin: 0 !important;
    min-width: 40px;
    min-height: 34px;
    padding: 0 14px !important;
    font-size: 12px;
    border-radius: 8px;
}
.region-date-preset-btn.active {
    color: #2d53eb !important;
    border-color: #a0cfff !important;
    background-color: #eef1fe !important;
    font-weight: 600;
    z-index: 1;
}
.filter-date-range {
    width: 280px;
}
.filter-select--app,
.filter-input--vid {
    width: 220px;
}
.filter-select--country {
    width: 160px;
}

.drama-main-card :deep(.filter-select .el-select__wrapper),
.drama-main-card :deep(.filter-date-range .el-input__wrapper),
.drama-main-card :deep(.filter-input--vid .el-input__wrapper) {
    min-height: 34px;
    padding: 0 10px;
    background-color: #edf1fc;
    border-radius: 8px;
    box-shadow: none !important;
    border: none;
    font-size: 12px;
}
.drama-main-card :deep(.filter-select .el-select__wrapper:hover),
.drama-main-card :deep(.filter-select .el-select__wrapper.is-focused),
.drama-main-card :deep(.filter-input--vid .el-input__wrapper:hover),
.drama-main-card :deep(.filter-input--vid .el-input__wrapper.is-focus) {
    box-shadow: none !important;
}
.drama-main-card :deep(.filter-input--vid .el-input__inner) {
    height: 34px;
    line-height: 34px;
    font-size: 12px;
    color: #303133;
}

.search-form__actions {
    display: inline-flex;
    gap: 8px;
}

.drama-table-block {
    margin-bottom: 0;
}

.pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    margin-bottom: 16px;
}

.user-analysis-chart-block {
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
}
.user-analysis-chart-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
    text-align: center;
}
.user-analysis-pie-chart {
    width: 100%;
    height: 360px;
}

.ua-mom--up {
    color: #e6a23c;
}
.ua-mom--down {
    color: #67c23a;
}

.btn-query {
    min-width: 64px;
    height: 34px;
    padding: 0 12px;
    border-radius: 8px;
    font-size: 12px;
    background-color: #2d53eb;
    border-color: #2d53eb;
}
.btn-query:hover,
.btn-query:focus {
    background-color: #2447d4;
    border-color: #2447d4;
}
.btn-reset {
    min-width: 64px;
    height: 34px;
    padding: 0 12px;
    border-radius: 8px;
    font-size: 12px;
    background-color: #eef1fe;
    border: 1px solid #2d53eb;
    color: #2d53eb;
}
.btn-reset:hover,
.btn-reset:focus {
    background-color: #e4e9fc;
    border-color: #2d53eb;
    color: #2d53eb;
}
</style>
