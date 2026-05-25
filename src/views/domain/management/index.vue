<template>
    <page-content class="domain-management-page" :title="title">
        <template #bottom>
            <el-card class="list-card" shadow="never">
                <div class="filter-card">
                    <el-form :model="searchForm" inline class="search-form">
                        <el-form-item>
                            <el-input
                                v-model="searchForm.appName"
                                class="filter-input"
                                placeholder="请输入App名称"
                                clearable
                                @keyup.enter="handleSearch"
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-input
                                v-model="searchForm.cdnDomain"
                                class="filter-input"
                                placeholder="请输入域名"
                                clearable
                                @keyup.enter="handleSearch"
                            />
                        </el-form-item>
                        <el-form-item class="search-form__actions">
                            <el-button class="btn-query" type="primary" @click="handleSearch">查询</el-button>
                            <el-button class="btn-reset" @click="handleResetSearch">重置</el-button>
                        </el-form-item>
                        <el-form-item v-if="canAddCdn" class="search-form__add">
                            <el-button class="btn-add-app" type="primary" :icon="Plus" @click="openAddDialog">新增域名</el-button>
                        </el-form-item>
                    </el-form>
                </div>
                <div class="table-toolbar">
                    <span class="toolbar-actions">
                        <el-icon class="toolbar-icon" @click="loadList"><Refresh /></el-icon>
                    </span>
                </div>
                <el-table class="domain-table" :data="list" v-loading="loading" style="width: 100%">
                    <el-table-column type="index" label="序号" width="80" align="center" :index="indexMethod" />
                    <el-table-column prop="appName" label="App名称" min-width="160" align="center" show-overflow-tooltip />
                    <el-table-column prop="appPkg" label="App包名" min-width="200" align="center" show-overflow-tooltip />
                    <el-table-column prop="cdnDomain" label="CDN域名" min-width="220" align="center" show-overflow-tooltip />
                    <el-table-column prop="cdnServiceName" label="CDN服务商" min-width="160" align="center" show-overflow-tooltip />
                    <el-table-column label="状态" width="132" min-width="132" align="center" class-name="col-status">
                        <template #default="{ row }">
                            <span v-if="row.status === 1" class="status-pill status-pill--ok">启用</span>
                            <span v-else class="status-pill status-pill--off">禁用</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="createdAt" label="创建时间" width="180" align="center" show-overflow-tooltip />
                    <el-table-column prop="updatedAt" label="更新时间" width="180" align="center" show-overflow-tooltip />
                    <el-table-column v-if="showActionColumn" label="操作" width="160" align="center" fixed="right">
                        <template #default="{ row }">
                            <div v-if="canEditCdn" class="op-cell">
                                <el-button class="op-btn op-btn--edit" link :icon="Edit" @click="handleEdit(row)">编辑</el-button>
                            </div>
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

            <!-- 新增域名弹窗 -->
            <FormDialog
                v-model="addVisible"
                title="新增域名"
                detail-header
                width="760px"
                :loading="addSubmitting"
                @close="resetAddForm"
                @confirm="submitAdd"
            >
                <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="120px" class="add-form-single-col">
                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">App信息</div>
                            <div class="add-form-section__desc">选择App、App名称、App包名</div>
                        </div>
                        <el-form-item label="选择App" prop="appPkg">
                            <el-select
                                v-model="addForm.appPkg"
                                placeholder="请选择App"
                                filterable
                                :loading="appSelectLoading"
                                style="width: 100%"
                                @change="onAddAppChange"
                            >
                                <el-option
                                    v-for="opt in appOptions"
                                    :key="opt.value"
                                    :label="opt.label"
                                    :value="opt.value"
                                />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="App名称">
                            <el-input v-model="addForm.appName" placeholder="选择应用后自动填充" readonly />
                        </el-form-item>
                        <el-form-item label="App包名">
                            <el-input v-model="addForm.appPkgDisplay" placeholder="选择应用后自动填充" readonly />
                        </el-form-item>
                    </div>

                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">域名信息</div>
                            <div class="add-form-section__desc">CDN域名、CDN服务商</div>
                        </div>
                        <el-form-item label="CDN域名" prop="cdnDomain">
                            <el-input v-model="addForm.cdnDomain" placeholder="例如 cdn.example.com" clearable />
                        </el-form-item>
                        <el-form-item label="CDN服务商" prop="cdnServiceName">
                            <el-input v-model="addForm.cdnServiceName" placeholder="例如 阿里云CDN" clearable />
                        </el-form-item>
                    </div>
                </el-form>
            </FormDialog>

            <!-- 编辑域名弹窗 -->
            <FormDialog
                v-model="editVisible"
                title="编辑域名"
                detail-header
                width="560px"
                :loading="editSubmitting"
                @close="cancelEdit"
                @confirm="submitEdit"
            >
                <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="120px">
                    <el-form-item label="App名称">
                        <el-input v-model="editForm.appName" disabled />
                    </el-form-item>
                    <el-form-item label="App包名">
                        <el-input v-model="editForm.appPkg" disabled />
                    </el-form-item>
                    <el-form-item label="CDN域名" prop="cdnDomain">
                        <el-input v-model="editForm.cdnDomain" placeholder="例如 cdn.example.com" clearable />
                    </el-form-item>
                    <el-form-item label="CDN服务商" prop="cdnServiceName">
                        <el-input v-model="editForm.cdnServiceName" placeholder="例如 阿里云CDN" clearable />
                    </el-form-item>
                    <el-form-item label="状态" prop="status">
                        <el-select v-model="editForm.status" placeholder="请选择" style="width: 100%">
                            <el-option label="启用" :value="1" />
                            <el-option label="禁用" :value="0" />
                        </el-select>
                    </el-form-item>
                </el-form>
            </FormDialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { hasPerm, PERM_APPCDN } from '@/utils/permission'
import { Plus, Refresh, Edit } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import FormDialog from '@/components/FormDialog.vue'
import { addCdnInfo, getAppList, getCdnInfoPage, updateCdnInfo } from '@/api/app'
import { mapGetAppListToSelectOptions } from '@/utils/appSelectOptions'

const title = { firstTitle: '域名管理', secondTitle: 'CDN 域名配置列表' }

const canAddCdn = computed(() => hasPerm(PERM_APPCDN.add))
const canEditCdn = computed(() => hasPerm(PERM_APPCDN.edit))
const showActionColumn = computed(() => canEditCdn.value)

const searchForm = reactive({
    appName: '',
    cdnDomain: '',
})

const list = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

function indexMethod(index: number) {
    return (currentPage.value - 1) * pageSize.value + index + 1
}

const addVisible = ref(false)
const addFormRef = ref<FormInstance>()
const addSubmitting = ref(false)

const editVisible = ref(false)
const editFormRef = ref<FormInstance>()
const editSubmitting = ref(false)
const editingId = ref<number | null>(null)

const addForm = reactive({
    appPkg: '',
    appName: '',
    appPkgDisplay: '',
    cdnDomain: '',
    cdnServiceName: '',
})

const appOptions = ref<Array<{ value: string; label: string; raw?: any }>>([])
const appSelectLoading = ref(false)

async function loadAppOptions() {
    if (appSelectLoading.value) return
    appSelectLoading.value = true
    try {
        const res: any = await getAppList()
        appOptions.value = mapGetAppListToSelectOptions(res)
    } catch {
        appOptions.value = []
    } finally {
        appSelectLoading.value = false
    }
}

const editForm = reactive({
    appName: '',
    appPkg: '',
    cdnDomain: '',
    cdnServiceName: '',
    status: 1 as 0 | 1,
})

const addRules: FormRules = {
    appPkg: [{ required: true, message: '请选择App', trigger: 'change' }],
    cdnDomain: [{ required: true, message: '请输入CDN域名', trigger: 'blur' }],
    cdnServiceName: [{ required: true, message: '请输入CDN服务商', trigger: 'blur' }],
}

const editRules: FormRules = {
    cdnDomain: [{ required: true, message: '请输入CDN域名', trigger: 'blur' }],
    cdnServiceName: [{ required: true, message: '请输入CDN服务商', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

async function loadList() {
    loading.value = true
    try {
        const res: any = await getCdnInfoPage({
            current: currentPage.value,
            size: pageSize.value,
            appName: searchForm.appName?.trim() || undefined,
            cdnDomain: searchForm.cdnDomain?.trim() || undefined,
        })
        const data = res?.data?.data ?? res?.data
        if (data?.records) {
            list.value = data.records
            total.value = data.total ?? 0
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

function handleSearch() {
    currentPage.value = 1
    loadList()
}

function handleResetSearch() {
    searchForm.appName = ''
    searchForm.cdnDomain = ''
    currentPage.value = 1
    loadList()
}

function openAddDialog() {
    addVisible.value = true
}

function resetAddForm() {
    addForm.appPkg = ''
    addForm.appName = ''
    addForm.appPkgDisplay = ''
    addForm.cdnDomain = ''
    addForm.cdnServiceName = ''
    addFormRef.value?.resetFields()
}

function onAddAppChange(val: string) {
    const opt = appOptions.value.find((o) => o.value === val)
    addForm.appName = opt?.raw?.appName ?? ''
    addForm.appPkgDisplay = opt?.raw?.appPkg ?? val
}

async function submitAdd() {
    if (!addFormRef.value) return
    await addFormRef.value.validate(async (valid) => {
        if (!valid) return
        addSubmitting.value = true
        try {
            await addCdnInfo({
                appPkg: addForm.appPkg.trim(),
                cdnDomain: addForm.cdnDomain.trim(),
                cdnServiceName: addForm.cdnServiceName.trim(),
            })
            ElMessage.success('新增成功')
            addVisible.value = false
            loadList()
        } catch (e: any) {
            const msg = e?.response?.data?.message
            ElMessage.error(msg && typeof msg === 'string' ? msg : '新增失败')
        } finally {
            addSubmitting.value = false
        }
    })
}

function handleEdit(row: any) {
    editingId.value = row.id
    editForm.appName = row.appName ?? ''
    editForm.appPkg = row.appPkg ?? ''
    editForm.cdnDomain = row.cdnDomain ?? ''
    editForm.cdnServiceName = row.cdnServiceName ?? ''
    editForm.status = (row.status === 1 || row.status === '1') ? 1 : 0
    editVisible.value = true
}

function cancelEdit() {
    editingId.value = null
}

async function submitEdit() {
    if (!editFormRef.value || editingId.value == null) return
    await editFormRef.value.validate(async (valid) => {
        if (!valid) return
        editSubmitting.value = true
        try {
            await updateCdnInfo({
                id: editingId.value,
                cdnDomain: editForm.cdnDomain.trim(),
                cdnServiceName: editForm.cdnServiceName.trim(),
                status: editForm.status,
            })
            ElMessage.success('保存成功')
            editVisible.value = false
            loadList()
        } catch (e: any) {
            const msg = e?.response?.data?.message
            ElMessage.error(msg && typeof msg === 'string' ? msg : '保存失败')
        } finally {
            editSubmitting.value = false
        }
    })
}

onMounted(() => {
    // 页面进入即准备好新增弹窗需要的 App 下拉
    void loadAppOptions()
    loadList()
})
</script>

<style scoped>
.domain-management-page :deep(.page-content-body) {
    padding-top: 0;
}
:deep(.domain-management-page.page-content) {
    background-color: #ffffff;
}

.filter-card {
    margin-top: 0;
    margin-bottom: 0;
    border-radius: 0;
    overflow: visible;
    padding: 0;
    box-sizing: border-box;
}
.filter-card :deep(.el-card__body) {
    padding: 16px 20px;
}
.search-form {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px 10px;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
}
.search-form :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 0;
}
.filter-input {
    width: 200px;
}
.filter-card :deep(.filter-input .el-input__wrapper) {
    width: 200px;
    min-height: 34px;
    padding: 0 10px;
    background-color: #edf1fc;
    border-radius: 8px;
    box-shadow: none;
    border: none;
}
.filter-card :deep(.filter-input .el-input__wrapper:hover),
.filter-card :deep(.filter-input .el-input__wrapper.is-focus) {
    box-shadow: none;
}
.filter-card :deep(.filter-input .el-input__inner) {
    height: 34px;
    line-height: 34px;
    font-size: 12px;
    color: #303133;
}
.search-form__actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}
.search-form__add {
    margin-left: auto;
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
.btn-add-app {
    width: 120px;
    height: 34px;
    padding: 0 12px;
    border-radius: 10px;
    background-color: #2d53eb;
    border-color: #2d53eb;
}
.btn-add-app:hover,
.btn-add-app:focus {
    background-color: #2447d4;
    border-color: #2447d4;
}

.list-card {
    border-radius: 20px;
    overflow: hidden;
}
.list-card :deep(.el-card__body) {
    padding: 12px 20px 20px;
    box-sizing: border-box;
}

.table-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 12px 0 8px;
    margin-top: 16px;
}

.toolbar-actions {
    display: flex;
    gap: 12px;
}

.toolbar-icon {
    font-size: 18px;
    color: #909399;
    cursor: pointer;
}

.toolbar-icon:hover {
    color: #409eff;
}

.domain-table {
    --el-table-border-color: #ebeef5;
    --el-table-fixed-right-column: none;
    --el-table-fixed-left-column: none;
}
.domain-table :deep(.el-table__fixed-right),
.domain-table :deep(.el-table__fixed-left) {
    box-shadow: none !important;
}
.domain-table :deep(.el-table__inner-wrapper::before) {
    display: none;
}
.domain-table :deep(.el-table__cell) {
    border-right: none !important;
    border-left: none !important;
    border-top: none !important;
}
.domain-table :deep(thead th.el-table__cell),
.domain-table :deep(tbody td.el-table__cell) {
    border-bottom: 1px solid #ebeef5 !important;
}
.domain-table :deep(.el-table__header-wrapper) {
    border-radius: 8px;
    overflow: hidden;
}
.domain-table :deep(thead th.el-table__cell:first-child) {
    border-top-left-radius: 8px;
}
.domain-table :deep(thead th.el-table__cell:last-child) {
    border-top-right-radius: 8px;
}
.domain-table :deep(.el-table__header-wrapper th.el-table__cell) {
    background-color: #edf1fc !important;
    padding: 10px 12px;
    box-sizing: border-box;
    vertical-align: middle;
}
.domain-table :deep(.el-table__header .cell) {
    font-size: 13px;
    font-weight: 700;
    color: #000000;
    line-height: 18px;
}
.domain-table :deep(.el-table__body .el-table__cell .cell) {
    font-size: 12px;
    color: #575757;
    line-height: 18px;
}
.domain-table :deep(tbody td.el-table__cell) {
    font-size: 12px;
    color: #575757;
    box-sizing: border-box;
}
.domain-table :deep(th.el-table__fixed-right-patch) {
    background-color: #edf1fc !important;
}
.domain-table :deep(.el-table__body tr:hover > td.el-table__cell) {
    background-color: #fafafa !important;
}

.domain-table :deep(.el-table__body .el-button.is-link) {
    font-size: 12px;
    line-height: 18px;
    vertical-align: baseline;
}

/* 编辑：与其他模块一致 */
.domain-table :deep(.op-cell) {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: 2px;
    white-space: nowrap;
}

.domain-table :deep(.op-btn) {
    font-size: 12px;
    padding: 4px 4px;
}

.domain-table :deep(.op-btn--edit) {
    color: #409eff !important;
}
.domain-table :deep(.op-btn--edit .el-icon),
.domain-table :deep(.op-btn--edit svg) {
    color: #409eff;
}

.domain-table :deep(th.col-status),
.domain-table :deep(td.col-status) {
    min-width: 132px;
}

.domain-table :deep(td.col-status .cell),
.domain-table :deep(th.col-status .cell) {
    overflow: visible;
    text-overflow: clip;
}

.status-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    font-size: 12px;
    line-height: 1.2;
    min-width: 52px;
    padding: 0 8px;
    width: auto;
}

.status-pill--ok {
    height: 22px;
    background: #dfffd9;
    border-radius: 8px;
    border: none;
    color: #16a34a;
}

.status-pill--off {
    height: 22px;
    border-radius: 8px;
    background: #f4f4f5;
    border: 1px solid #dcdfe6;
    color: #909399;
}

.add-form-single-col .el-form-item .el-input,
.add-form-single-col .el-form-item .el-select {
    width: 100%;
}
.add-form-section {
    padding: 14px 16px 6px;
    border: 1px solid #e4e7ed;
    border-radius: 12px;
    background: linear-gradient(165deg, #f8fbff 0%, #ffffff 55%);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.add-form-section + .add-form-section {
    margin-top: 14px;
}
.add-form-section__head {
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f2f5;
}
.add-form-section__title {
    position: relative;
    padding-left: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}
.add-form-section__title::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #409eff;
    transform: translateY(-50%);
}
.add-form-section__desc {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
}
</style>
