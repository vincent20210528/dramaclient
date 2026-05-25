<template>
    <page-content class="traffic-packet-page operation-drama-page" :title="title">
        <template #bottom>
            <!-- 与账户信息「基本信息」同一套卡片样式 -->
            <div class="account-stat-card__body">
                <div class="account-stat-card__content">
                    <div class="account-stat-card__label">流量包余额</div>
                    <div class="traffic-stat-value-row">
                        <span class="account-stat-card__value">{{ remainFluxGb }}GB</span>
                        <el-tooltip content="流量包余额数据每小时更新一次" placement="top">
                            <span class="summary-hint-wrap" tabindex="-1">
                                <el-icon class="summary-hint-icon"><InfoFilled /></el-icon>
                            </span>
                        </el-tooltip>
                    </div>
                    <div class="traffic-stat-footer-row">
                        <div class="traffic-stat-extra">
                            <span>已消耗：{{ usedFluxGb }}GB</span>
                            <span>总配额：{{ totalQuotaGb }}GB</span>
                        </div>
                        <div class="traffic-stat-meta">数据更新时间：{{ updatedAtNow }}</div>
                    </div>
                </div>
            </div>

            <!-- 充值时间筛选 -->
            <el-card class="drama-main-card traffic-search-card" shadow="never">
                <div class="traffic-search-form">
                    <span class="filter-label">充值时间</span>
                    <div class="traffic-date-picker-wrap">
                        <el-date-picker
                            v-model="range"
                            type="daterange"
                            size="small"
                            popper-class="traffic-detail-datetime-popper"
                            placement="bottom-start"
                            range-separator="至"
                            start-placeholder="开始日期"
                            end-placeholder="结束日期"
                            format="YYYY-MM-DD"
                            value-format="YYYY-MM-DD"
                            class="charge-range-picker"
                        />
                    </div>
                    <el-button v-if="canShowList" class="btn-search-query btn-search-inline" @click="handleSearch"
                        >查询</el-button
                    >
                    <el-button class="btn-search-reset btn-search-inline" @click="handleReset">重置</el-button>
                </div>
            </el-card>

            <!-- 流量包充值明细：与账户信息「应用列表」同一套 -->
            <el-card class="drama-main-card account-apps-card" shadow="never">
                <div class="detail-header">
                    <div class="detail-title">流量包充值明细</div>
                </div>
                <div class="table-toolbar table-toolbar--solo">
                    <span />
                    <span v-if="canShowList" class="toolbar-actions">
                        <el-tooltip content="刷新数据" placement="top">
                            <el-icon class="toolbar-icon" @click="mockRefresh"><Refresh /></el-icon>
                        </el-tooltip>
                    </span>
                </div>
                <div class="drama-table-block" v-loading="listLoading">
                    <el-table
                        class="drama-op-table"
                        :data="pagedList"
                        style="width: 100%"
                        :scrollbar-always-on="true"
                    >
                        <el-table-column prop="fluxGb" label="流量包" min-width="140" align="center" show-overflow-tooltip>
                            <template #default="{ row }">{{ row.fluxGb }}GB</template>
                        </el-table-column>
                        <el-table-column
                            prop="statusText"
                            label="性质"
                            min-width="140"
                            align="center"
                            show-overflow-tooltip
                        />
                        <el-table-column
                            prop="topUpTime"
                            label="充值时间"
                            min-width="180"
                            align="center"
                            show-overflow-tooltip
                        />
                    </el-table>
                </div>
                <div class="pagination-wrapper">
                    <span class="total-text">共{{ totalCount }}条</span>
                    <el-pagination
                        v-model:current-page="currentPage"
                        v-model:page-size="pageSize"
                        :total="totalCount"
                        :page-sizes="[10, 20, 50]"
                        layout="total, total, sizes, ->, prev, pager, next, jumper, jumper"
                        prev-text="上一页"
                        next-text="下一页"
                        @size-change="handlePageSizeChange"
                        @current-change="handleCurrentChange"
                    />
                </div>
            </el-card>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled, Refresh } from '@element-plus/icons-vue'
import { getDeveloperDetail, getDeveloperTopUpList } from '@/api/developer'
import { hasPerm, PERM_TRAFFICE_DETAIL } from '@/utils/permission'
import { getUserInfo } from '@/utils'

const route = useRoute()

const canShowList = computed(() => hasPerm(PERM_TRAFFICE_DETAIL.list))

const listLoading = ref(false)

const title = computed(() => ({
    firstTitle: '运营管理',
    secondTitle: '流量包管理',
}))

type TopUpType = 0 | 1
type TopUpRow = {
    id: number
    fluxGb: number
    type: TopUpType
    statusText: string
    topUpTime: string
    createdAt: string
    updatedAt: string
}

const updatedAtNow = ref('')
const topUpRows = ref<TopUpRow[]>([])
const totalCount = ref(0)

/** 充值时间筛选，与 topUpList 入参一致：YYYY-MM-DD */
const range = ref<[string, string] | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)

const pagedList = computed(() => topUpRows.value)

const totalQuota = ref(0)
const usedFlux = ref(0)
const remainFlux = computed(() => Math.max(totalQuota.value - usedFlux.value, 0))

function formatGb(v: number) {
    return Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const totalQuotaGb = computed(() => formatGb(totalQuota.value))
const usedFluxGb = computed(() => formatGb(usedFlux.value))
const remainFluxGb = computed(() => formatGb(remainFlux.value))

function handleSearch() {
    currentPage.value = 1
    void fetchList()
}

function handleReset() {
    range.value = null
    currentPage.value = 1
    void fetchList()
}

function handlePageSizeChange() {
    currentPage.value = 1
    void fetchList()
}

function handleCurrentChange() {
    void fetchList()
}

function mockRefresh() {
    void fetchList()
    ElMessage.success('已刷新')
}

onMounted(() => {
    void fetchList()
})

watch(
    () => route.query.userId,
    () => {
        void fetchList()
    }
)

function typeText(type: TopUpType) {
    return type === 1 ? '付费流量' : '赠送流量'
}

async function fetchList() {
    const userId = getUserInfo()?.id ?? route.query.id
    const idNum = Number(userId)
    if (!Number.isFinite(idNum) || idNum <= 0) {
        topUpRows.value = []
        totalCount.value = 0
        totalQuota.value = 0
        usedFlux.value = 0
        updatedAtNow.value = '--'
        return
    }
    const startTime = range.value?.[0] || undefined
    const endTime = range.value?.[1] || undefined
    listLoading.value = true
    try {
        const [detailRes, listRes]: any[] = await Promise.all([
            getDeveloperDetail(idNum),
            getDeveloperTopUpList({
                userId: idNum,
                current: currentPage.value,
                size: pageSize.value,
                startTime,
                endTime,
            }),
        ])

        const detailBody = detailRes?.data
        const detailData = detailBody?.data ?? detailBody
        totalQuota.value = Number(detailData?.totalFlux ?? 0)
        usedFlux.value = Number(detailData?.usedFlux ?? 0)
        updatedAtNow.value = formatSyncTime(detailData?.syncTime)

        const listBody = listRes?.data
        const topUpRecords = listBody.data.records
        totalCount.value = Number(listBody.data.total)

        topUpRows.value = topUpRecords.map((record: any): TopUpRow => {
            const rawType = Number(record?.type)
            const type: TopUpType = rawType === 1 ? 1 : 0
            return {
                id: Number(record?.id ?? 0),
                fluxGb: Number(record?.topUpFlux ?? 0),
                type,
                statusText: typeText(type),
                topUpTime: String(record?.topUpTime ?? ''),
                createdAt: String(record?.createdAt ?? ''),
                updatedAt: String(record?.updatedAt ?? ''),
            }
        })

    } catch (e: any) {
        topUpRows.value = []
        totalCount.value = 0
        totalQuota.value = 0
        usedFlux.value = 0
        updatedAtNow.value = '--'
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '加载失败')
    } finally {
        listLoading.value = false
    }
}

function formatSyncTime(syncTime: unknown) {
    const text = String(syncTime ?? '').trim()
    return text || '--'
}
</script>

<style scoped>
:deep(.traffic-packet-page.page-content) {
    background-color: #ffffff;
}

.operation-drama-page :deep(.page-content-body) {
    padding-top: 0;
}

.drama-main-card {
    border-radius: 20px;
    overflow: hidden;
}

.traffic-search-card {
    margin-top: 20px;
    min-height: auto;
    box-sizing: border-box;
}

.traffic-search-card.drama-main-card :deep(.el-card__body) {
    padding: 14px 20px;
    display: flex;
    align-items: center;
    box-sizing: border-box;
}

.account-apps-card {
    margin-top: 20px;
}

.account-apps-card.drama-main-card :deep(.el-card__body) {
    padding: 12px 20px 20px;
    box-sizing: border-box;
}

.detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 0;
}

.detail-title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
}

.table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0 8px;
    margin-top: 8px;
}

.table-toolbar--solo {
    padding-top: 0;
    margin-top: 4px;
}

.toolbar-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
}

.toolbar-icon {
    font-size: 16px;
    color: #909399;
    cursor: pointer;
}

.toolbar-icon:hover {
    color: #409eff;
}

.drama-table-block {
    position: relative;
    width: 100%;
}

.drama-table-block :deep(.el-loading-mask) {
    z-index: 2000;
}

.drama-op-table {
    --el-table-border-color: #ebeef5;
}

.drama-op-table :deep(.el-table__fixed-right),
.drama-op-table :deep(.el-table__fixed-left) {
    box-shadow: none !important;
}

.drama-op-table :deep(.el-table__inner-wrapper::before) {
    display: none;
}

.drama-op-table :deep(.el-table__cell) {
    border-right: none !important;
    border-left: none !important;
    border-top: none !important;
}

.drama-op-table :deep(thead th.el-table__cell),
.drama-op-table :deep(tbody td.el-table__cell) {
    border-bottom: 1px solid #ebeef5 !important;
}

.drama-op-table :deep(.el-table__header-wrapper) {
    border-radius: 8px;
    overflow: hidden;
}

.drama-op-table :deep(thead th.el-table__cell:first-child) {
    border-top-left-radius: 8px;
}

.drama-op-table :deep(thead th.el-table__cell:last-child) {
    border-top-right-radius: 8px;
}

.drama-op-table :deep(.el-table__header-wrapper th.el-table__cell) {
    background-color: #edf1fc !important;
    padding-top: 10px;
    padding-bottom: 10px;
    box-sizing: border-box;
    vertical-align: middle;
}

.drama-op-table :deep(.el-table__header .cell) {
    font-size: 13px;
    font-weight: 700;
    color: #000000;
    line-height: 18px;
}

.drama-op-table :deep(thead th.el-table__cell > .cell) {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    overflow-wrap: normal;
    word-break: keep-all;
    gap: 2px;
}

.drama-op-table :deep(.el-table__body .el-table__cell .cell) {
    font-size: 12px;
    color: #575757;
    line-height: 18px;
}

.drama-op-table :deep(.el-table__body .el-button.is-link) {
    font-size: 12px;
    line-height: 18px;
}

.drama-op-table :deep(th.el-table__fixed-right-patch) {
    background-color: #edf1fc;
}

.drama-op-table :deep(.el-table__body tr:hover > td.el-table__cell) {
    background-color: #fafafa !important;
}

.pagination-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0 0;
    flex-wrap: wrap;
    gap: 12px;
}

.pagination-wrapper :deep(.el-pagination) {
    flex-wrap: wrap;
}

.total-text {
    color: #606266;
    font-size: 14px;
}

/* 与账户信息「基本信息」一致 */
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

.account-stat-card__value {
    font-size: 22px;
    font-weight: 700;
    color: #303133;
    line-height: 1.3;
    word-break: break-all;
}

.traffic-stat-value-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.traffic-stat-footer-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px 16px;
    margin-top: 2px;
    width: 100%;
}

.traffic-stat-extra {
    font-size: 13px;
    color: #606266;
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    min-width: 0;
}

.traffic-stat-meta {
    font-size: 12px;
    color: #909399;
    justify-self: end;
    text-align: right;
    white-space: nowrap;
}

.summary-hint-wrap {
    display: inline-flex;
    align-items: center;
    cursor: default;
    outline: none;
}

.summary-hint-icon {
    font-size: 16px;
    color: #909399;
    vertical-align: middle;
}

.summary-hint-icon:hover {
    color: #2d53eb;
}

.traffic-search-form {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
}

.filter-label {
    font-size: 12px;
    color: #606266;
    white-space: nowrap;
    flex-shrink: 0;
}

.traffic-date-picker-wrap {
    flex: 0 0 320px;
    width: 320px;
    max-width: min(320px, 100%);
    box-sizing: border-box;
    min-width: 0;
}

@media (max-width: 520px) {
    .traffic-date-picker-wrap {
        flex-basis: 100%;
        max-width: 100%;
    }
}

.charge-range-picker {
    display: block;
    width: 100%;
}

.traffic-search-form :deep(.el-range-editor.el-input__wrapper) {
    min-height: 30px;
    width: 320px !important;
    max-width: 320px !important;
}

.traffic-search-form :deep(.el-date-editor--datetimerange) {
    width: 320px !important;
    max-width: 320px !important;
}

.btn-search-query {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100px;
    height: 50px;
    padding: 0;
    border-radius: 10px;
    background-color: #1c53d9 !important;
    border-color: #1c53d9 !important;
    color: #ffffff !important;
}

.btn-search-query:hover,
.btn-search-query:focus {
    background-color: #1748c4 !important;
    border-color: #1748c4 !important;
    color: #ffffff !important;
}

.btn-search-reset {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100px;
    height: 50px;
    padding: 0;
    border-radius: 10px;
    background-color: #edf1fc !important;
    border-color: #d8e0f5 !important;
    color: #303133 !important;
}

.btn-search-reset:hover,
.btn-search-reset:focus {
    background-color: #e0e8f8 !important;
    border-color: #d8e0f5 !important;
    color: #303133 !important;
}

.btn-search-inline {
    position: relative;
    z-index: 2;
    flex-shrink: 0;
    width: 72px !important;
    min-height: 30px !important;
    height: 30px !important;
    padding: 0 10px !important;
    border-radius: 4px !important;
    font-size: 12px !important;
}
</style>

<style>
.traffic-detail-datetime-popper {
    transform-origin: left top;
}
</style>
