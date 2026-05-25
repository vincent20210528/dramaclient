<template>
    <page-content class="service-config-page" :title="title">
        <template #bottom>
            <el-card class="list-card" shadow="never">
                <div class="filter-card">
                    <el-form inline class="search-form">
                        <el-form-item v-if="canAdd" class="search-form__add">
                            <el-button
                                class="btn-add-app btn-add-app--wide"
                                type="primary"
                                :icon="Plus"
                                @click="openAddDialog"
                            >
                                新增服务配置
                            </el-button>
                        </el-form-item>
                    </el-form>
                </div>
                <div class="table-toolbar">
                    <span class="toolbar-actions">
                        <el-icon class="toolbar-icon" @click="loadList"><Refresh /></el-icon>
                    </span>
                </div>
                <el-table
                    class="service-config-table"
                    :data="list"
                    v-loading="loading"
                    style="width: 100%"
                >
                    <el-table-column type="index" label="序号" width="80" align="center" />
                    <el-table-column
                        prop="name"
                        label="配置名称"
                        min-width="120"
                        align="center"
                        show-overflow-tooltip
                    />
                    <el-table-column label="配置类型" width="120" align="center">
                        <template #default="{ row }">{{ servicePackageTypeLabel(row.type) || '--' }}</template>
                    </el-table-column>
                    <el-table-column prop="traffic" label="默认流量(GB)" width="130" align="center" />
                    <el-table-column prop="dramaCount" label="短剧数量" width="120" align="center" />
                    <el-table-column label="支持语言" min-width="200" align="center" show-overflow-tooltip>
                        <template #default="{ row }">{{ formatLangList(row.supportLanguageList) }}</template>
                    </el-table-column>
                    <el-table-column label="流量预警阈值" width="140" align="center">
                        <template #default="{ row }">{{ row.trafficWarningRate }}%</template>
                    </el-table-column>
                    <el-table-column label="超标停用阈值" width="140" align="center">
                        <template #default="{ row }">{{ row.exceedanceRate }}%</template>
                    </el-table-column>
                    <el-table-column label="创建时间" width="180" align="center" show-overflow-tooltip>
                        <template #default="{ row }">{{ row.createdAt ?? '--' }}</template>
                    </el-table-column>
                    <el-table-column
                        v-if="showActionColumn"
                        label="操作"
                        width="160"
                        align="center"
                        fixed="right"
                    >
                        <template #default="{ row }">
                            <div class="op-cell">
                                <el-button
                                    v-if="canEdit"
                                    class="op-btn op-btn--edit"
                                    link
                                    :icon="Edit"
                                    @click="openEditDialog(row)"
                                >
                                    编辑
                                </el-button>
                                <el-button
                                    v-if="canDelete"
                                    class="op-btn op-btn--delete"
                                    link
                                    @click="handleDelete(row)"
                                >
                                    删除
                                </el-button>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
            </el-card>

            <FormDialog
                v-model="addVisible"
                :title="editingId ? '编辑服务配置' : '新增服务配置'"
                detail-header
                width="760px"
                confirm-text="保存"
                :loading="submitting"
                @close="resetForm"
                @confirm="submitForm"
            >
                <el-form ref="formRef" :model="form" :rules="rules" label-width="135px" class="add-form-single-col">
                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">套餐参数配置</div>
                            <div class="add-form-section__desc">配置名称、类型、流量与语言等基础信息</div>
                        </div>

                        <el-form-item label="配置名称" prop="name">
                            <el-input v-model="form.name" placeholder="请输入配置名称" clearable />
                        </el-form-item>

                        <el-form-item label="配置类型" prop="type">
                            <el-select v-model="form.type" placeholder="请选择配置类型" style="width: 100%">
                                <el-option label="基础版 (A)" value="A" />
                                <el-option label="高级版 (B)" value="B" />
                                <el-option label="专业版 (C)" value="C" />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="默认流量(GB)" prop="traffic">
                            <el-input-number
                                v-model="form.traffic"
                                :min="0"
                                :step="1"
                                :precision="0"
                                style="width: 100%"
                            />
                        </el-form-item>

                        <el-form-item label="短剧数量" prop="dramaCount">
                            <el-input-number
                                v-model="form.dramaCount"
                                :min="0"
                                :step="1"
                                :precision="0"
                                style="width: 100%"
                            />
                        </el-form-item>

                        <el-form-item label="支持语言" prop="supportLanguageList">
                            <el-select
                                v-model="form.supportLanguageList"
                                multiple
                                filterable
                                clearable
                                collapse-tags
                                collapse-tags-tooltip
                                placeholder="请选择支持语言"
                                style="width: 100%"
                                :loading="languageLoading"
                            >
                                <el-option
                                    v-for="item in languageOptions"
                                    :key="item.languageCode"
                                    :label="`${item.languageName} (${item.languageCode})`"
                                    :value="item.languageCode"
                                />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="流量预警阈值(%)" prop="trafficWarningRate">
                            <el-input-number
                                v-model="form.trafficWarningRate"
                                :min="0"
                                :max="100"
                                :step="1"
                                :precision="0"
                                style="width: 100%"
                            />
                        </el-form-item>

                        <el-form-item label="超标停用阈值(%)" prop="exceedanceRate">
                            <el-input-number
                                v-model="form.exceedanceRate"
                                :min="0"
                                :step="1"
                                :precision="0"
                                style="width: 100%"
                            />
                        </el-form-item>
                    </div>
                </el-form>
            </FormDialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Edit, Plus, Refresh } from '@element-plus/icons-vue'
import { getSupportLanguagePage } from '@/api'
import {
    addServicePackageConfig,
    updateServicePackageConfig,
    getServicePackageConfigList,
    deleteServicePackageConfig,
    parseServicePackageType,
    servicePackageTypeLabel,
    type ServicePackageTypeCode,
} from '@/api/app'
import FormDialog from '@/components/FormDialog.vue'
import { hasPerm, PERM_SERVICE_PACKAGE_CONFIG } from '@/utils/permission'

const title = { firstTitle: 'App管理', secondTitle: '服务配置管理' }

const canAdd = computed(() => hasPerm(PERM_SERVICE_PACKAGE_CONFIG.add))
const canEdit = computed(() => hasPerm(PERM_SERVICE_PACKAGE_CONFIG.edit))
const canDelete = computed(() => hasPerm(PERM_SERVICE_PACKAGE_CONFIG.delete))
const showActionColumn = computed(() => canEdit.value || canDelete.value)

const loading = ref(false)
const list = ref<any[]>([])
const addVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const submitting = ref(false)
const languageLoading = ref(false)
const languageOptions = ref<{ languageCode: string; languageName: string }[]>([])

const form = reactive({
    name: '',
    type: 'A' as ServicePackageTypeCode,
    traffic: 100,
    dramaCount: 200,
    supportLanguageList: [] as string[],
    trafficWarningRate: 80,
    exceedanceRate: 10,
})

const rules: FormRules = {
    name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择配置类型', trigger: 'change' }],
    traffic: [{ required: true, message: '请输入默认流量', trigger: 'change' }],
    dramaCount: [{ required: true, message: '请输入短剧数量', trigger: 'change' }],
    supportLanguageList: [
        { required: true, type: 'array', min: 1, message: '请至少选择一种支持语言', trigger: 'change' },
    ],
    trafficWarningRate: [{ required: true, message: '请输入流量预警阈值', trigger: 'change' }],
    exceedanceRate: [{ required: true, message: '请输入超标停用阈值', trigger: 'change' }],
}

function formatLangList(value: string[] | string | null | undefined) {
    if (Array.isArray(value)) return value.filter(Boolean).join(', ') || '--'
    if (typeof value === 'string' && value.trim()) return value
    return '--'
}

/** 业务 code 非 200 时抛出，避免 HTTP 200 仍提示成功 */
function assertApiOk(res: any, fallback: string) {
    const body = res?.data ?? res
    const code = body?.code
    if (code === 200 || code === '200') return body
    const msg = body?.message || fallback
    throw Object.assign(new Error(msg), { response: { data: { message: msg } } })
}

async function loadLanguageOptions() {
    if (languageLoading.value) return
    languageLoading.value = true
    try {
        const res: any = await getSupportLanguagePage({ current: 1, size: 500 })
        const data = res?.data?.data ?? res?.data
        languageOptions.value = (data?.records ?? [])
            .map((item: any) => ({
                languageCode: String(item.languageCode ?? ''),
                languageName: String(item.languageName ?? item.languageCode ?? ''),
            }))
            .filter((item: any) => item.languageCode)
    } catch {
        languageOptions.value = []
    } finally {
        languageLoading.value = false
    }
}

async function loadList() {
    loading.value = true
    try {
        const res: any = await getServicePackageConfigList()
        const body = res?.data ?? res
        const data = body?.data
        list.value = Array.isArray(data) ? data : Array.isArray(data?.records) ? data.records : []
    } catch {
        list.value = []
        ElMessage.error('服务配置列表加载失败')
    } finally {
        loading.value = false
    }
}

function openAddDialog() {
    if (!canAdd.value) return
    editingId.value = null
    resetForm()
    addVisible.value = true
}

function openEditDialog(row: any) {
    if (!canEdit.value) return
    editingId.value = Number(row?.id)
    form.name = String(row?.name ?? '')
    form.type = parseServicePackageType(row?.type) ?? 'A'
    form.traffic = Number(row?.traffic ?? 0)
    form.dramaCount = Number(row?.dramaCount ?? 0)
    form.supportLanguageList = Array.isArray(row?.supportLanguageList)
        ? row.supportLanguageList.map((x: unknown) => String(x)).filter(Boolean)
        : typeof row?.supportLanguageList === 'string'
          ? row.supportLanguageList.split(',').map((x: string) => x.trim()).filter(Boolean)
          : []
    form.trafficWarningRate = Number(row?.trafficWarningRate ?? 0)
    form.exceedanceRate = Number(row?.exceedanceRate ?? 0)
    formRef.value?.clearValidate()
    addVisible.value = true
}

function resetForm() {
    editingId.value = null
    form.name = ''
    form.type = 'A'
    form.traffic = 100
    form.dramaCount = 200
    form.supportLanguageList = []
    form.trafficWarningRate = 80
    form.exceedanceRate = 10
    formRef.value?.clearValidate()
}

async function submitForm() {
    if (!formRef.value) return
    if (editingId.value ? !canEdit.value : !canAdd.value) {
        ElMessage.warning('暂无操作权限')
        return
    }
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
        const payload = {
            name: form.name.trim(),
            type: form.type,
            traffic: Number(form.traffic),
            dramaCount: Number(form.dramaCount),
            supportLanguageList: form.supportLanguageList,
            trafficWarningRate: Number(form.trafficWarningRate),
            exceedanceRate: Number(form.exceedanceRate),
        }
        const res: any = editingId.value
            ? await updateServicePackageConfig({ id: editingId.value, ...payload })
            : await addServicePackageConfig(payload)
        assertApiOk(res, '保存失败')
        ElMessage.success(editingId.value ? '服务配置编辑成功' : '服务配置新增成功')
        addVisible.value = false
        resetForm()
        loadList()
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '保存失败')
    } finally {
        submitting.value = false
    }
}

async function handleDelete(row: any) {
    if (!canDelete.value) {
        ElMessage.warning('暂无删除权限')
        return
    }
    const id = Number(row?.id)
    if (!id) return
    try {
        await ElMessageBox.confirm(`确定删除服务配置「${row?.name ?? ''}」吗？`, '提示', {
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showClose: true,
        })
        const res: any = await deleteServicePackageConfig(id)
        assertApiOk(res, '删除失败')
        ElMessage.success('删除成功')
        loadList()
    } catch (e: any) {
        if (e === 'cancel') return
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '删除失败')
    }
}

onMounted(() => {
    loadLanguageOptions()
    loadList()
})
</script>

<style scoped>
.service-config-page :deep(.page-content-body) {
    padding-top: 0;
}
:deep(.service-config-page.page-content) {
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

.search-form__add {
    margin-left: auto;
}

.btn-add-app {
    width: 120px;
    height: 34px;
    padding: 0 12px;
    border-radius: 10px;
    background-color: #2d53eb;
    border-color: #2d53eb;
}

.btn-add-app--wide {
    width: auto;
    min-width: 140px;
    padding: 0 14px;
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

.service-config-table {
    --el-table-border-color: #ebeef5;
    --el-table-fixed-right-column: none;
    --el-table-fixed-left-column: none;
}

.service-config-table :deep(.el-table__fixed-right),
.service-config-table :deep(.el-table__fixed-left) {
    box-shadow: none !important;
}

.service-config-table :deep(.el-table__inner-wrapper::before) {
    display: none;
}

.service-config-table :deep(.el-table__cell) {
    border-right: none !important;
    border-left: none !important;
    border-top: none !important;
}

.service-config-table :deep(thead th.el-table__cell),
.service-config-table :deep(tbody td.el-table__cell) {
    border-bottom: 1px solid #ebeef5 !important;
}

.service-config-table :deep(.el-table__header-wrapper) {
    border-radius: 8px;
    overflow: hidden;
}

.service-config-table :deep(thead th.el-table__cell:first-child) {
    border-top-left-radius: 8px;
}

.service-config-table :deep(thead th.el-table__cell:last-child) {
    border-top-right-radius: 8px;
}

.service-config-table :deep(.el-table__header-wrapper th.el-table__cell) {
    background-color: #edf1fc !important;
    padding: 10px 12px;
    box-sizing: border-box;
    vertical-align: middle;
}

.service-config-table :deep(.el-table__header .cell) {
    font-size: 13px;
    font-weight: 700;
    color: #000000;
    line-height: 18px;
}

.service-config-table :deep(.el-table__body .el-table__cell .cell) {
    font-size: 12px;
    color: #575757;
    line-height: 18px;
}

.service-config-table :deep(tbody td.el-table__cell) {
    font-size: 12px;
    color: #575757;
    box-sizing: border-box;
}

.service-config-table :deep(th.el-table__fixed-right-patch) {
    background-color: #edf1fc !important;
}

.service-config-table :deep(.el-table__body tr:hover > td.el-table__cell) {
    background-color: #fafafa !important;
}

.service-config-table :deep(.el-table__body .el-button.is-link) {
    font-size: 12px;
    line-height: 18px;
    vertical-align: baseline;
}

/* 编辑：与年费管理一致 */
.service-config-table :deep(.op-cell) {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: 2px;
    white-space: nowrap;
}

.service-config-table :deep(.op-btn) {
    font-size: 12px;
    padding: 4px 4px;
}

.service-config-table :deep(.op-btn--edit) {
    color: #409eff !important;
}
.service-config-table :deep(.op-btn--edit .el-icon),
.service-config-table :deep(.op-btn--edit svg) {
    color: #409eff;
}

.service-config-table :deep(.op-btn--delete) {
    color: #f56c6c !important;
}

.add-form-single-col .el-form-item .el-input,
.add-form-single-col .el-form-item .el-select,
.add-form-single-col .el-form-item .el-input-number {
    width: 100%;
}

.add-form-single-col :deep(.el-form-item__label) {
    white-space: nowrap;
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
