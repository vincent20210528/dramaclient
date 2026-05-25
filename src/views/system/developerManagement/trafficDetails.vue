<template>
    <page-content class="developer-management-page" :title="title">
        <template #bottom>
            <div class="traffic-detail-toolbar">
                <el-button class="btn-search-reset" @click="goBack">返回上一页</el-button>
            </div>

            <el-card class="summary-card" shadow="never">
                <div class="summary-title">流量包余额</div>
                <div class="summary-value-row">
                    <span class="summary-value">{{ totalFluxGb }}GB</span>
                    <el-tooltip content="流量包余额数据每小时更新一次" placement="top">
                        <span class="summary-hint-wrap" tabindex="-1">
                            <el-icon class="summary-hint-icon"><InfoFilled /></el-icon>
                        </span>
                    </el-tooltip>
                </div>
                <div class="summary-meta">数据更新时间：{{ updatedAtNow }}</div>
            </el-card>

            <el-card class="search-card" shadow="never">
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

            <el-card class="list-card" shadow="never">
                <div class="detail-header">
                    <div class="detail-title">流量包充值明细</div>
                </div>
                <div class="table-toolbar">
                    <span />
                    <span v-if="canShowList" class="toolbar-actions">
                        <el-tooltip content="刷新数据" placement="top">
                            <el-icon class="toolbar-icon" @click="mockRefresh"><Refresh /></el-icon>
                        </el-tooltip>
                    </span>
                </div>

                <el-table
                    class="dev-table"
                    :data="pagedList"
                    style="width: 100%"
                    :header-cell-style="headerCellStyle"
                >
                    <el-table-column prop="fluxGb" label="流量包" min-width="140" align="center" show-overflow-tooltip>
                        <template #default="{ row }">{{ row.fluxGb }}GB</template>
                    </el-table-column>
                    <el-table-column prop="statusText" label="性质" min-width="140" align="center" show-overflow-tooltip />
                    <el-table-column
                        prop="topUpTime"
                        label="充值时间"
                        min-width="180"
                        align="center"
                        show-overflow-tooltip
                    />
                </el-table>

                <div class="pagination-wrapper">
                    <el-pagination
                        v-model:current-page="currentPage"
                        v-model:page-size="pageSize"
                        :total="totalCount"
                        :page-sizes="[10, 20, 50]"
                        layout="total, sizes, ->, prev, pager, next, jumper"
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled, Refresh } from '@element-plus/icons-vue'
import { getDeveloperTopUpList } from '@/api/developer'
import { hasPerm, PERM_TRAFFICE_DETAIL } from '@/utils/permission'
const route = useRoute()
const router = useRouter()

const canShowList = computed(() => hasPerm(PERM_TRAFFICE_DETAIL.list))

const headerCellStyle = () => ({
    background: '#edf1fc',
    color: '#303133',
    fontWeight: '600',
})
const title = computed(() => {
    const userName = String(route.query.userName ?? '')
    return {
        firstTitle: '开发者管理',
        secondTitle: userName ? `流量包详情 - ${userName}` : '流量包详情',
    }
})

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
// 列表行数据：用于表格渲染（充值记录）
const topUpRows = ref<TopUpRow[]>([])
const totalCount = ref(0)

/** 充值时间筛选，与 topUpList 入参一致：YYYY-MM-DD */
const range = ref<[string, string] | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)

// 后端负责日期过滤与分页：topUpRows 即当前页数据
const pagedList = computed(() => topUpRows.value)

const totalFluxGb = computed(() => {
    return topUpRows.value
        .reduce((sum, x) => sum + (Number(x.fluxGb) || 0), 0)
        .toLocaleString('en-US', { maximumFractionDigits: 2 })
})

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

function goBack() {
    // 优先返回上一页；若没有历史记录则回到开发者管理列表
    if (window.history.length > 1) router.back()
    else router.push({ path: '/system/developerManagement' })
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
    const userId = route.query.userId
    const idNum = Number(userId)
    if (!Number.isFinite(idNum) || idNum <= 0) {
        topUpRows.value = []
        totalCount.value = 0
        updatedAtNow.value = formatNow()
        return
    }
    const startTime = range.value?.[0] || undefined
    const endTime = range.value?.[1] || undefined
    try {
        const res: any = await getDeveloperTopUpList({
            userId: idNum,
            current: currentPage.value,
            size: pageSize.value,
            startTime,
            endTime,
        })
        const body = res?.data
        const topUpRecords = body.data.records
        totalCount.value = Number(body.data.total)

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

        // 按需求：数据更新时间取当前时间
        updatedAtNow.value = formatNow()
    } catch (e: any) {
        topUpRows.value = []
        totalCount.value = 0
        updatedAtNow.value = formatNow()
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '加载失败')
    }
}

function formatNow() {
    const d = new Date()
    return d.toISOString().slice(0, 19).replace('T', ' ')
}
</script>

<style scoped>
:deep(.developer-management-page.page-content) {
    background-color: #ffffff;
}

.traffic-detail-toolbar {
    margin-bottom: 16px;
}

.search-card,
.list-card,
.summary-card {
    border-radius: 20px;
    overflow: hidden;
}

.summary-card {
    margin-bottom: 16px;
}

.summary-card :deep(.el-card__body) {
    padding: 20px 20px 16px;
}

.summary-title {
    font-size: 14px;
    color: #303133;
    margin-bottom: 8px;
}

.summary-value-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.summary-value {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    line-height: 1.2;
}

.summary-hint-wrap {
    display: inline-flex;
    align-items: center;
    cursor: default;
    outline: none;
}

.summary-hint-icon {
    font-size: 18px;
    color: #909399;
    vertical-align: middle;
}

.summary-hint-icon:hover {
    color: #1c53d9;
}

.summary-meta {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
}

.search-card {
    min-height: auto;
    margin-bottom: 16px;
    box-sizing: border-box;
}

.search-card :deep(.el-card__body) {
    padding: 14px 20px;
    display: flex;
    align-items: center;
    box-sizing: border-box;
}

/* 与 App管理 → 流量管理（detail.vue）preset-row 内时间控件一致 */
.traffic-search-form {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0;
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

.list-card :deep(.el-card__body) {
    padding: 0 20px 16px;
}

.detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0 4px;
}

.detail-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
}

.toolbar-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
}

.toolbar-icon {
    font-size: 18px;
    color: #909399;
    cursor: pointer;
}

.toolbar-icon:hover {
    color: #409eff;
}

.pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 16px 0 4px;
    flex-wrap: wrap;
    gap: 12px;
}

.pagination-wrapper :deep(.el-pagination) {
    flex-wrap: wrap;
}

.dev-table {
    --el-table-border-color: transparent;
    --el-table-header-bg-color: #edf1fc;
}

.dev-table :deep(.el-table__header) {
    background-color: #edf1fc;
    border-radius: 10px;
    overflow: hidden;
}

.dev-table :deep(.el-table__header-wrapper) {
    border-radius: 10px;
    overflow: hidden;
    background-color: #edf1fc;
}

.dev-table :deep(th.el-table__fixed-right-patch) {
    background-color: #edf1fc !important;
}

.dev-table :deep(.el-table__inner-wrapper::before) {
    display: none;
}

.dev-table :deep(thead th.el-table__cell) {
    background-color: #edf1fc !important;
    border-bottom: 1px solid #e8ecf4;
    height: 80px;
    box-sizing: border-box;
    vertical-align: middle;
    font-size: 15px;
    padding: 0 12px;
    border-right: none !important;
}

.dev-table :deep(thead th.el-table__cell .cell) {
    white-space: nowrap;
}

.dev-table :deep(thead th.el-table__cell:first-child) {
    border-top-left-radius: 10px;
}

.dev-table :deep(thead th.el-table__cell:last-child) {
    border-top-right-radius: 10px;
}

.dev-table :deep(tbody td.el-table__cell) {
    background: #ffffff !important;
    border-right: none !important;
    border-bottom: 1px solid #ebeef5;
    font-size: 15px;
    color: #303133;
    padding: 14px 12px;
}

.dev-table :deep(.el-table__body tr:hover > td.el-table__cell) {
    background-color: #fafafa !important;
}
</style>

<!-- 与 app/trafficManagement/detail.vue 一致：弹层左对齐输入框 -->
<style>
.traffic-detail-datetime-popper {
    transform-origin: left top;
}
</style>
