<template>
    <page-content :title="title">
        <template #bottom>
            <el-card class="search-card" shadow="never">
                <el-form :model="searchForm" inline class="search-form">
                    <el-form-item label="应用名称">
                        <el-input v-model="searchForm.appName" placeholder="请输入" clearable style="width: 180px" />
                    </el-form-item>
                    <el-form-item label="包名">
                        <el-select
                            v-model="searchForm.appPkg"
                            filterable
                            remote
                            reserve-keyword
                            clearable
                            placeholder="请选择App包名"
                            style="width: 240px"
                            :remote-method="remoteSearchAppForSearch"
                            :loading="searchAppSelectLoading"
                            @focus="onSearchAppSelectFocus"
                        >
                            <el-option
                                v-for="item in searchAppOptions"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="handleSearch">查询</el-button>
                        <el-button @click="handleResetSearch">重置</el-button>
                    </el-form-item>
                    <el-form-item v-if="canAddTraffic" class="toolbar-item">
                        <el-button type="primary" :icon="Plus" @click="openAddDialog">添加APP流量</el-button>
                    </el-form-item>
                </el-form>
            </el-card>

            <el-card class="table-card" shadow="never">
                <el-table
                    :data="list"
                    v-loading="loading"
                    stripe
                    border
                    style="width: 100%"
                    :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
                >
                    <el-table-column prop="appName" label="APP名称" min-width="140" show-overflow-tooltip />
                    <el-table-column prop="appPkg" label="包名" min-width="180" show-overflow-tooltip />
                    <el-table-column label="总消耗" width="140" align="right">
                        <template #default="{ row }">{{ displayTrafficGb(row.usedFlux) }}</template>
                    </el-table-column>
                    <el-table-column label="剩余流量" width="140" align="right">
                        <template #default="{ row }">{{ displayTrafficGb(row.remainFlux) }}</template>
                    </el-table-column>
                    <el-table-column label="总配额" width="140" align="right">
                        <template #default="{ row }">{{ displayTrafficGb(row.totalFlux) }}</template>
                    </el-table-column>
                    <el-table-column label="使用率" width="140">
                        <template #default="{ row }">
                            <div class="rate-cell">
                                <span>{{ formatPercent(row.usedRate) }}</span>
                                <el-progress :percentage="clampRate(row.usedRate)" :stroke-width="6" :show-text="false" />
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="状态" width="100" align="center">
                        <template #default="{ row }">
                            <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column v-if="showActionColumn" label="操作" width="160" align="center" fixed="right">
                        <template #default="{ row }">
                            <el-button v-if="canTrafficDetail" type="primary" link @click="goDetail(row)">查看详情</el-button>
                            <el-button v-if="canTrafficDelete" type="danger" link @click="handleDelete(row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <div class="pagination-wrapper">
                    <el-pagination
                        v-model:current-page="currentPage"
                        v-model:page-size="pageSize"
                        :total="total"
                        :page-sizes="[10, 20, 50]"
                        layout="total, sizes, ->, prev, pager, next, jumper"
                        prev-text="上一页"
                        next-text="下一页"
                        @size-change="loadList"
                        @current-change="loadList"
                    />
                </div>
            </el-card>

            <FormDialog
                v-model="addVisible"
                title="添加APP流量"
                width="650px"
                confirm-text="确定"
                :loading="addSubmitting"
                @close="resetAddForm"
                @confirm="submitAdd"
            >
                <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="120px">
                    <el-form-item label="选择App" prop="appPkg">
                        <el-select
                            v-model="addForm.appPkg"
                            filterable
                            remote
                            reserve-keyword
                            placeholder="请搜索并选择应用（输入应用名称搜索）"
                            style="width: 100%"
                            :remote-method="remoteSearchAppForAdd"
                            :loading="addAppSelectLoading"
                            @focus="onAddAppSelectFocus"
                            @change="onAddAppChange"
                        >
                            <el-option
                                v-for="item in addAppOptions"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="应用名称">
                        <el-input v-model="addForm.appName" placeholder="选择应用后自动填充" readonly />
                    </el-form-item>
                    <el-form-item label="App包名">
                        <el-input v-model="addForm.appPkgDisplay" placeholder="选择应用后自动填充" readonly />
                    </el-form-item>
                    <el-form-item label="总配额(GB)" prop="totalFluxGB">
                        <el-input-number v-model="addForm.totalFluxGB" :min="0.01" :precision="2" :step="1" style="width: 100%" />
                    </el-form-item>
                    <el-form-item label="状态" prop="status">
                        <el-select v-model="addForm.status" style="width: 100%">
                            <el-option label="正常" :value="1" />
                            <el-option label="停用" :value="0" />
                        </el-select>
                    </el-form-item>
                </el-form>
            </FormDialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { hasPerm, PERM_APP_TRAFFIC } from '@/utils/permission'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { addAppTraffic, deleteAppTraffic, getAppList, getAppTrafficPage } from '@/api/app'
import FormDialog from '@/components/FormDialog.vue'
import { mapGetAppListToSelectOptions } from '@/utils/appSelectOptions'

const title = { firstTitle: '流量管理', secondTitle: '查看与配置应用流量' }
const router = useRouter()

const canAddTraffic = computed(() => hasPerm(PERM_APP_TRAFFIC.add))
const canTrafficDetail = computed(() => hasPerm(PERM_APP_TRAFFIC.detail))
const canTrafficDelete = computed(() => hasPerm(PERM_APP_TRAFFIC.delete))
const showActionColumn = computed(() => canTrafficDetail.value || canTrafficDelete.value)

/** 列表展示：后端为 GB 数值或可读字符串，统一带上单位 GB（已含 GB 则原样） */
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

/** 将后端的 GB 值（数字或字符串）转换为 number，供前端计算剩余流量与使用率 */
function parseTrafficGbNumber(v: unknown): number {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0
    if (typeof v === 'string') {
        const match = v.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
        if (match) {
            const n = Number(match[0])
            return Number.isFinite(n) ? n : 0
        }
    }
    return 0
}

const searchForm = reactive({
    appName: '',
    appPkg: '',
})
const searchAppOptions = ref<{ value: string; label: string; raw?: any }[]>([])
const searchAppSelectLoading = ref(false)

const list = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

/**
 * 将后端返回的流量记录做统一字段归一化，兼容不同命名。
 * 流量数值已由后端换算为可读格式，前端不再做字节换算。
 */
function normalizeTrafficRow(row: any) {
    const totalFluxNum = parseTrafficGbNumber(row?.totalFlux)
    const usedFluxNum = parseTrafficGbNumber(row?.usedFlux)
    const remainFluxNum = Math.max(totalFluxNum - usedFluxNum, 0)
    const usedRateNum = row?.usedRate != null ? Number(row.usedRate) : totalFluxNum > 0 ? (usedFluxNum / totalFluxNum) * 100 : 0

    return {
        ...row,
        id: row?.id ?? row?.trafficId,
        appName: row?.appName ?? '--',
        appPkg: row?.appPkg ?? row?.packageName ?? '--',
        totalFlux: row?.totalFlux ?? '--',
        usedFlux: row?.usedFlux ?? '--',
        remainFlux: remainFluxNum,
        usedRate: Number.isFinite(usedRateNum) ? usedRateNum : 0,
        status: Number(row?.status ?? 1),
    }
}

/**
 * 使用率进度条值限制在 0~100，避免异常值撑爆 UI。
 */
function clampRate(rate: number | string | null | undefined) {
    const n = Number(rate ?? 0)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(100, Number(n.toFixed(2))))
}

/**
 * 使用率文案格式化。
 */
function formatPercent(rate: number | string | null | undefined) {
    const n = Number(rate ?? 0)
    if (!Number.isFinite(n)) return '--'
    return `${n.toFixed(2)}%`
}

/**
 * 状态码转文案。
 */
function statusText(status: number) {
    return Number(status) === 1 ? '正常' : '停用'
}

/**
 * 状态码转标签颜色。
 */
function statusTag(status: number) {
    return Number(status) === 1 ? 'success' : 'info'
}

/**
 * 加载流量分页列表。
 * - 使用查询条件 + 分页参数请求
 * - 成功后做 normalize 统一字段
 * - 失败时兜底空列表
 */
async function loadList() {
    loading.value = true
    try {
        const res: any = await getAppTrafficPage({
            current: currentPage.value,
            size: pageSize.value,
            appName: searchForm.appName?.trim() || undefined,
            appPkg: searchForm.appPkg?.trim() || undefined,
        })
        // 兼容后端 data 包装层差异：res.data.data / res.data
        const data = res?.data?.data ?? res?.data
        if (data?.records) {
            list.value = (data.records as any[]).map(normalizeTrafficRow)
            total.value = Number(data.total ?? 0)
        } else {
            list.value = []
            total.value = 0
        }
    } catch {
        list.value = []
        total.value = 0
    } finally {
        loading.value = false
    }
}

/** 页面初始化时一次性加载 App 下拉；后续筛选/新增只做本地过滤 */
async function loadAppOptions() {
    if (allAppOptions.value.length > 0) {
        searchAppOptions.value = [...allAppOptions.value]
        addAppOptions.value = [...allAppOptions.value]
        return
    }
    searchAppSelectLoading.value = true
    addAppSelectLoading.value = true
    try {
        const res: any = await getAppList()
        const mapped = mapGetAppListToSelectOptions(res)
        allAppOptions.value = mapped
        searchAppOptions.value = [...mapped]
        addAppOptions.value = [...mapped]
    } catch {
        allAppOptions.value = []
        searchAppOptions.value = []
        addAppOptions.value = []
    } finally {
        searchAppSelectLoading.value = false
        addAppSelectLoading.value = false
    }
}

/** 从已预加载的 App 下拉中本地筛选 */
function filterAppOptions(query?: string) {
    const keyword = query?.trim().toLowerCase()
    if (!keyword) return [...allAppOptions.value]
    return allAppOptions.value.filter((x) => x.label.toLowerCase().includes(keyword) || x.value.toLowerCase().includes(keyword))
}

/**
 * 搜索下拉聚焦时懒加载一次，减少页面初始请求数。
 */
function onSearchAppSelectFocus() {
    if (searchAppOptions.value.length === 0) searchAppOptions.value = filterAppOptions()
}

/**
 * 搜索下拉远程搜索回调。
 */
function remoteSearchAppForSearch(query: string) {
    searchAppOptions.value = filterAppOptions(query)
}

/**
 * 点击查询：重置页码并刷新列表。
 */
function handleSearch() {
    currentPage.value = 1
    loadList()
}

/**
 * 点击重置：清空搜索条件和下拉缓存并刷新列表。
 */
function handleResetSearch() {
    searchForm.appName = ''
    searchForm.appPkg = ''
    searchAppOptions.value = filterAppOptions()
    currentPage.value = 1
    loadList()
}

const addVisible = ref(false)
const addSubmitting = ref(false)
const addFormRef = ref<FormInstance>()
const addAppOptions = ref<{ value: string; label: string; raw?: any }[]>([])
const addAppSelectLoading = ref(false)
const allAppOptions = ref<{ value: string; label: string; raw?: any }[]>([])

const addForm = reactive({
    appPkg: '',
    appPkgDisplay: '',
    appName: '',
    totalFluxGB: 1 as number | undefined,
    status: 1,
})

const addRules: FormRules = {
    appPkg: [{ required: true, message: '请选择应用', trigger: 'change' }],
    totalFluxGB: [{ required: true, message: '请输入总配额(GB)', trigger: 'change' }],
}

/**
 * 新增下拉聚焦时懒加载一次候选项。
 */
function onAddAppSelectFocus() {
    if (addAppOptions.value.length === 0) addAppOptions.value = filterAppOptions()
}

/**
 * 新增下拉远程搜索回调。
 */
function remoteSearchAppForAdd(query: string) {
    addAppOptions.value = filterAppOptions(query)
}

/**
 * 选择 App 后同步回填「应用名称」「包名展示」字段。
 */
function onAddAppChange(val: string) {
    const opt = addAppOptions.value.find((o) => o.value === val)
    if (opt?.raw) {
        addForm.appName = opt.raw.appName ?? ''
        addForm.appPkgDisplay = opt.raw.appPkg ?? opt.raw.packageName ?? ''
    } else {
        addForm.appName = ''
        addForm.appPkgDisplay = val
    }
}

/**
 * 打开新增弹窗。
 */
function openAddDialog() {
    addVisible.value = true
}

/**
 * 重置新增表单和下拉缓存。
 */
function resetAddForm() {
    addForm.appPkg = ''
    addForm.appPkgDisplay = ''
    addForm.appName = ''
    addForm.totalFluxGB = 1
    addForm.status = 1
    addAppOptions.value = filterAppOptions()
    addFormRef.value?.resetFields()
}

/**
 * 提交新增流量配置：totalFlux 按 GB 数值提交（如 3 表示 3GB）。
 */
async function submitAdd() {
    if (!addFormRef.value) return
    await addFormRef.value.validate(async (valid) => {
        if (!valid) return
        if (!addForm.totalFluxGB || addForm.totalFluxGB <= 0) {
            ElMessage.warning('总配额必须大于0')
            return
        }
        addSubmitting.value = true
        try {
            await addAppTraffic({
                // 包名和应用名去除首尾空格，避免无效空格入库
                appPkg: addForm.appPkg.trim(),
                appName: addForm.appName.trim(),
                totalFlux: Number(addForm.totalFluxGB),
                status: Number(addForm.status),
            })
            ElMessage.success('添加成功')
            addVisible.value = false
            loadList()
        } catch {
            ElMessage.error('添加失败')
        } finally {
            addSubmitting.value = false
        }
    })
}

/**
 * 跳转详情页（不再弹窗），通过 query 传入当前行上下文。
 */
function goDetail(row: any) {
    router.push({
        name: 'appTrafficDetail',
        query: {
            // appPkg 传空：按接口约定查询全部应用
            appName: '',
            appPkg: '',
        },
    })
}

/**
 * 删除一条流量配置：DELETE /api/apps/traffic/delete/{id}
 */
async function handleDelete(row: any) {
    const id = row?.id
    if (id == null || id === '') {
        ElMessage.warning('缺少记录 id，无法删除')
        return
    }
    try {
        await ElMessageBox.confirm('确定删除该流量配置吗？', '提示', { type: 'warning' })
    } catch {
        return
    }
    try {
        await deleteAppTraffic(id)
        ElMessage.success('删除成功')
        loadList()
    } catch {
        ElMessage.error('删除失败')
    }
}

/**
 * 页面首次进入加载列表数据。
 */
onMounted(() => {
    // 页面进入即预加载包名下拉（筛选区 + 新增弹窗）
    void loadAppOptions()
    loadList()
})
</script>

<style scoped>
.search-card {
    margin-bottom: 12px;
}
.search-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
}
.toolbar-item {
    margin-left: auto;
}
.rate-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
</style>
