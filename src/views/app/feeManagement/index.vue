<template>
    <page-content :title="title" class="fee-management-page">
        <template v-slot:bottom>
            <el-card class="list-card" shadow="never">
                <div class="filter-card">
                    <el-form :model="searchForm" inline class="search-form">
                        <el-form-item>
                            <el-input
                                v-model="searchForm.appName"
                                class="filter-input"
                                placeholder="请输入应用名称"
                                clearable
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-select
                                v-model="searchForm.appPkg"
                                class="filter-select"
                                filterable
                                remote
                                reserve-keyword
                                clearable
                                placeholder="请选择App包名"
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
                        <el-form-item class="search-form__actions">
                            <el-button class="btn-query" type="primary" @click="handleSearch">查询</el-button>
                            <el-button class="btn-reset" @click="handleResetSearch">重置</el-button>
                        </el-form-item>
                        <el-form-item v-if="canAddFee" class="search-form__add">
                            <el-button class="btn-add-app btn-add-app--wide" type="primary" :icon="Plus" @click="openAddDialog">新增年费记录</el-button>
                        </el-form-item>
                    </el-form>
                </div>
                <div class="table-toolbar">
                    <span class="toolbar-actions">
                        <el-icon class="toolbar-icon" @click="loadList"><Refresh /></el-icon>
                    </span>
                </div>
                <el-table class="fee-table" :data="list" v-loading="loading" style="width: 100%">
                    <el-table-column type="index" label="序号" width="80" align="center" :index="indexMethod" />
                    <el-table-column prop="appName" label="App名称" min-width="120" align="center" show-overflow-tooltip />
                    <el-table-column prop="appPkg" label="App包名" min-width="150" align="center" show-overflow-tooltip />
                    <el-table-column label="费用" width="150" align="right">
                        <template #default="{ row }">{{ formatFee(row.feePaid) }}</template>
                    </el-table-column>
                    <el-table-column label="有效期" width="250" align="center" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ formatValidity(row.validityPeriodStart, row.validityPeriodEnd) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="状态" width="150" align="center">
                        <template #default="{ row }">
                            <el-tag :type="getStatusTagType(row)">{{ getStatusText(row) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="创建时间" width="180" align="center" show-overflow-tooltip>
                        <template #default="{ row }">{{ row.createdAt ?? '--' }}</template>
                    </el-table-column>
                    <el-table-column label="更新时间" width="180" align="center" show-overflow-tooltip>
                        <template #default="{ row }">{{ row.updatedAt ?? '--' }}</template>
                    </el-table-column>
                    <el-table-column label="操作" width="200" align="center" fixed="right">
                        <template #default="{ row }">
                            <div class="op-cell">
                                <el-button class="op-btn op-btn--view" link :icon="View" @click="handleView(row)">查看</el-button>
                                <el-button v-if="canEditFee" class="op-btn op-btn--edit" link :icon="Edit" @click="handleEdit(row)">编辑</el-button>
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

            <!-- 查看详情弹窗 -->
            <FormDialog
                v-model="viewVisible"
                title="年费详情"
                detail-header
                width="560px"
                :show-cancel="false"
                confirm-text="关闭"
                @confirm="viewVisible = false"
            >
                <el-descriptions v-if="viewRow" :column="1" border>
                    <el-descriptions-item label="App名称">{{ viewRow.appName ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="App包名">{{ viewRow.appPkg ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="费用">{{ formatFee(viewRow.feePaid) }}</el-descriptions-item>
                    <el-descriptions-item label="有效期开始">{{ viewRow.validityPeriodStart ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="有效期结束">{{ viewRow.validityPeriodEnd ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="状态">
                        <el-tag :type="getStatusTagType(viewRow)">{{ getStatusText(viewRow) }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{ viewRow.createdAt ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="更新时间">{{ viewRow.updatedAt ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="缴费凭证">
                        <template v-if="viewRow.paidFileUrl">
                            <el-link :href="viewRow.paidFileUrl" target="_blank" type="primary">打开链接</el-link>
                            <span class="ml-2">或</span>
                            <el-image
                                v-if="isImageUrl(viewRow.paidFileUrl)"
                                class="voucher-preview"
                                :src="viewRow.paidFileUrl"
                                :preview-src-list="[viewRow.paidFileUrl]"
                                fit="contain"
                            />
                        </template>
                        <span v-else>--</span>
                    </el-descriptions-item>
                </el-descriptions>
            </FormDialog>

            <!-- 新增年费记录弹窗 -->
            <FormDialog
                v-model="addVisible"
                title="新增年费记录"
                detail-header
                width="760px"
                confirm-text="确定"
                :loading="addSubmitting"
                @close="resetAddForm"
                @confirm="submitAdd"
            >
                <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="120px" class="add-form-single-col">
                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">签约App</div>
                            <div class="add-form-section__desc">选择App、App名称、App包名</div>
                        </div>
                        <el-form-item label="选择App" prop="appPkg">
                            <el-select
                                v-model="addForm.appPkg"
                                filterable
                                remote
                                reserve-keyword
                                placeholder="请搜索并选择应用（输入应用名称搜索）"
                                style="width: 100%"
                                :remote-method="remoteSearchApp"
                                :loading="appSelectLoading"
                                @focus="onAppSelectFocus"
                                @change="onAddAppChange"
                            >
                                <el-option
                                    v-for="item in appOptions"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value"
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
                            <div class="add-form-section__title">签约信息</div>
                            <div class="add-form-section__desc">费用、有效期起止时间、状态、缴费凭证</div>
                        </div>
                        <el-form-item label="费用" prop="feePaid">
                            <el-input-number v-model="addForm.feePaid" :min="0" :precision="2" placeholder="元" style="width: 100%" />
                        </el-form-item>
                        <el-form-item label="有效期" prop="validityPeriodStart" class="validity-range-item">
                            <div class="validity-range">
                                <el-date-picker
                                    v-model="addForm.validityPeriodStart"
                                    type="date"
                                    value-format="YYYY-MM-DD"
                                    placeholder="开始日期"
                                    style="width: 100%"
                                />
                                <span class="validity-range__sep">至</span>
                                <el-date-picker
                                    v-model="addForm.validityPeriodEnd"
                                    type="date"
                                    value-format="YYYY-MM-DD"
                                    placeholder="结束日期"
                                    @change="addFormRef?.validateField?.('validityPeriodStart')"
                                    style="width: 100%"
                                />
                            </div>
                        </el-form-item>
                        <el-form-item label="状态" prop="status">
                            <el-select v-model="addForm.status" placeholder="请选择" style="width: 100%">
                                <el-option label="待生效" :value="0" />
                                <el-option label="生效中" :value="1" />
                                <el-option label="已过期" :value="-1" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="缴费凭证" prop="paidFileUrl">
                            <div class="upload-field">
                                <div class="upload-actions">
                                    <el-upload
                                        ref="addUploadRef"
                                        v-model:file-list="addPaidFileList"
                                        :auto-upload="false"
                                        :show-file-list="true"
                                        :limit="1"
                                        accept="image/*,.pdf,application/pdf"
                                        :on-change="onAddPaidFileChange"
                                        :on-remove="onAddPaidFileRemove"
                                        :on-exceed="onAddPaidFileExceed"
                                    >
                                        <el-button type="primary" size="small">选择文件</el-button>
                                    </el-upload>
                                </div>
                                <div v-if="addPaidPreviewUrl" class="upload-preview">
                                    <el-image
                                        v-if="addPaidPreviewUrl"
                                        class="voucher-preview"
                                        :src="addPaidPreviewUrl"
                                        :preview-src-list="[addPaidPreviewUrl]"
                                        fit="contain"
                                    />
                                </div>
                                <div v-if="!addPaidPreviewUrl && addForm.paidFileUrl" class="upload-tip">已选择：{{ addForm.paidFileUrl }}</div>
                            </div>
                        </el-form-item>
                    </div>
                </el-form>
            </FormDialog>

            <!-- 编辑弹窗 -->
            <FormDialog
                v-model="editVisible"
                title="编辑年费记录"
                detail-header
                width="650px"
                confirm-text="保存"
                :loading="editSubmitting"
                @close="cancelEdit"
                @confirm="submitEdit"
            >
                <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="120px">
                    <el-form-item label="App名称" prop="appName">
                        <el-input v-model="editForm.appName" />
                    </el-form-item>
                    <el-form-item label="App包名">
                        <el-input v-model="editForm.appPkg" readonly />
                    </el-form-item>
                    <el-form-item label="有效期开始时间" prop="validityPeriodStart">
                        <el-date-picker
                            v-model="editForm.validityPeriodStart"
                            type="date"
                            value-format="YYYY-MM-DD"
                            placeholder="选择日期"
                            style="width: 100%"
                        />
                    </el-form-item>
                    <el-form-item label="有效期结束时间" prop="validityPeriodEnd">
                        <el-date-picker
                            v-model="editForm.validityPeriodEnd"
                            type="date"
                            value-format="YYYY-MM-DD"
                            placeholder="选择日期"
                            style="width: 100%"
                        />
                    </el-form-item>
                    <el-form-item label="费用" prop="feePaid">
                        <el-input-number v-model="editForm.feePaid" :min="0" :precision="2" style="width: 100%" />
                    </el-form-item>
                    <el-form-item label="状态" prop="status">
                        <el-select v-model="editForm.status" placeholder="请选择" style="width: 100%">
                            <el-option label="待生效" :value="0" />
                            <el-option label="生效中" :value="1" />
                            <el-option label="已过期" :value="-1" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="缴费凭证" prop="paidFileUrl">
                        <div class="upload-field">
                            <div class="upload-actions">
                                <el-upload
                                    ref="editUploadRef"
                                    v-model:file-list="editPaidFileList"
                                    :auto-upload="false"
                                    :show-file-list="true"
                                    :limit="1"
                                    accept="image/*,.pdf,application/pdf"
                                    :on-change="onEditPaidFileChange"
                                    :on-remove="onEditPaidFileRemove"
                                    :on-exceed="onEditPaidFileExceed"
                                >
                                    <el-button type="primary" size="small">选择文件</el-button>
                                </el-upload>
                            </div>
                            <div v-if="editPaidPreviewUrl" class="upload-preview">
                                <el-image
                                    v-if="editPaidPreviewUrl"
                                    class="voucher-preview"
                                    :src="editPaidPreviewUrl"
                                    :preview-src-list="[editPaidPreviewUrl]"
                                    fit="contain"
                                />
                            </div>
                            <div v-else-if="editForm.paidFileUrl" class="upload-tip">
                                <span class="upload-tip__label">当前已有缴费凭证</span>
                                <el-link :href="editForm.paidFileUrl" target="_blank" type="primary">打开链接</el-link>
                                <template v-if="isImageUrl(editForm.paidFileUrl)">
                                    <span class="ml-2">或预览图片</span>
                                </template>
                            </div>
                        </div>
                    </el-form-item>
                </el-form>
            </FormDialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { hasPerm, PERM_APPFEE } from '@/utils/permission'
import { Plus, Refresh, View, Edit } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
    getFeeInfoPage,
    addFeeInfo,
    updateFeeInfo,
    getAppList,
} from '@/api/app'
import { mapGetAppListToSelectOptions } from '@/utils/appSelectOptions'
import { uploadByPut, getFileExtension } from '@/utils/obsUpload'
import FormDialog from '@/components/FormDialog.vue'

const title = { firstTitle: '年费管理', secondTitle: '缴费信息列表' }

const canAddFee = computed(() => hasPerm(PERM_APPFEE.add))
const canEditFee = computed(() => hasPerm(PERM_APPFEE.edit))

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

function indexMethod(index: number) {
    return (currentPage.value - 1) * pageSize.value + index + 1
}

function formatFee(val: any) {
    if (val == null || val === '') return '--'
    const n = Number(val)
    if (Number.isNaN(n)) return '--'
    return `¥${n.toFixed(2)}`
}

function formatValidity(start: string | null | undefined, end: string | null | undefined) {
    if (!start && !end) return '--'
    if (start && end) return `${start} 至 ${end}`
    return (start || end) ?? '--'
}

function getStatusTagType(row: any) {
    const s = Number(row?.status)
    if (s === 1) return 'success' // 生效中
    if (s === 0) return 'warning' // 待生效
    if (s === -1) return 'info' // 已过期
    return 'info'
}

function getStatusText(row: any) {
    const s = Number(row?.status)
    if (s === 1) return '生效中'
    if (s === 0) return '待生效'
    if (s === -1) return '已过期'
    return '未知'
}

function isImageUrl(url: string) {
    if (!url) return false
    const u = url.toLowerCase()
    return /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(u) || u.includes('image')
}

const viewVisible = ref(false)
const viewRow = ref<any>(null)

const addVisible = ref(false)
const addFormRef = ref<FormInstance>()
const addSubmitting = ref(false)
const appOptions = ref<{ value: string; label: string; raw?: any }[]>([])
const appSelectLoading = ref(false)
const allAppOptions = ref<{ value: string; label: string; raw?: any }[]>([])

const addForm = reactive({
    appPkg: '',
    appPkgDisplay: '',
    appName: '',
    validityPeriodStart: '',
    validityPeriodEnd: '',
    feePaid: undefined as number | undefined,
    paidFileUrl: '',
    status:0
})

const addPaidFile = ref<File | null>(null)
const addPaidFileList = ref<{ name: string; url?: string; raw?: File; uid?: number }[]>([])
const addUploadRef = ref<{ clearFiles?: () => void } | null>(null)
const addPaidPreviewUrl = ref<string>('')

const addRules: FormRules = {
    appPkg: [{ required: true, message: '请选择应用', trigger: 'change' }],
    validityPeriodStart: [{ required: true, message: '请选择有效期开始时间', trigger: 'change' }],
    validityPeriodEnd: [{ required: true, message: '请选择有效期结束时间', trigger: 'change' }],
    feePaid: [{ required: true, message: '请输入费用', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const editVisible = ref(false)
const editFormRef = ref<FormInstance>()
const editSubmitting = ref(false)
const editingId = ref<string | number | null>(null)

const editForm = reactive({
    appName: '',
    appPkg: '',
    validityPeriodStart: '',
    validityPeriodEnd: '',
    feePaid: undefined as number | undefined,
    paidFileUrl: '',
    status:0,
})

const editPaidFile = ref<File | null>(null)
const editPaidFileList = ref<{ name: string; url?: string; raw?: File; uid?: number }[]>([])
const editUploadRef = ref<{ clearFiles?: () => void } | null>(null)
const editPaidPreviewUrl = ref<string>('')

const editRules: FormRules = {
    validityPeriodStart: [{ required: true, message: '请选择有效期开始时间', trigger: 'change' }],
    validityPeriodEnd: [{ required: true, message: '请选择有效期结束时间', trigger: 'change' }],
    feePaid: [{ required: true, message: '请输入费用', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

async function loadAppOptions() {
    if (allAppOptions.value.length > 0) {
        appOptions.value = [...allAppOptions.value]
        return
    }
    appSelectLoading.value = true
    try {
        const res: any = await getAppList()
        const mapped = mapGetAppListToSelectOptions(res)
        allAppOptions.value = mapped
        appOptions.value = [...mapped]
        searchAppOptions.value = [...mapped]
    } catch {
        allAppOptions.value = []
        appOptions.value = []
        searchAppOptions.value = []
    } finally {
        appSelectLoading.value = false
    }
}

function filterAppOptions(keyword?: string) {
    const q = keyword?.trim().toLowerCase()
    if (!q) return [...allAppOptions.value]
    return allAppOptions.value.filter((x) => x.label.toLowerCase().includes(q) || x.value.toLowerCase().includes(q))
}

function onSearchAppSelectFocus() {
    if (searchAppOptions.value.length === 0) {
        searchAppOptions.value = filterAppOptions()
    }
}

function remoteSearchAppForSearch(query: string) {
    searchAppOptions.value = filterAppOptions(query)
}

function onAppSelectFocus() {
    if (appOptions.value.length === 0) {
        appOptions.value = filterAppOptions()
    }
}

function remoteSearchApp(query: string) {
    appOptions.value = filterAppOptions(query)
}

function onAddAppChange(val: string) {
    const opt = appOptions.value.find((o) => o.value === val)
    if (opt?.raw) {
        addForm.appName = opt.raw.appName ?? ''
        addForm.appPkgDisplay = opt.raw.appPkg ?? ''
    } else {
        addForm.appName = ''
        addForm.appPkgDisplay = val
    }
}

function isImageFileName(name: string | undefined) {
    if (!name) return false
    const ext = getFileExtension(name)
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(ext)
}

function beforePaidFileUpload(file: File) {
    const ext = getFileExtension(file.name).toLowerCase()
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(ext)
    const isPdf = ext === '.pdf'
    if (!isImage && !isPdf) {
        ElMessage.error('仅支持上传图片或 PDF 文件')
        return false
    }
    return true
}

function onAddPaidFileChange(uploadFile: { raw?: File; name?: string }, fileList: { raw?: File; name?: string }[]) {
    const raw = (fileList?.length ? fileList[fileList.length - 1]?.raw : uploadFile?.raw) || uploadFile?.raw
    if (!raw) return
    if (!beforePaidFileUpload(raw)) {
        addPaidFile.value = null
        addPaidFileList.value = []
        addPaidPreviewUrl.value = ''
        addForm.paidFileUrl = ''
        addUploadRef.value?.clearFiles?.()
        return
    }
    addPaidFile.value = raw
    addForm.paidFileUrl = raw.name
    if (isImageFileName(raw.name)) {
        if (addPaidPreviewUrl.value && addPaidPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(addPaidPreviewUrl.value)
        addPaidPreviewUrl.value = URL.createObjectURL(raw)
        addPaidFileList.value = [{ name: raw.name, url: addPaidPreviewUrl.value, raw, uid: Date.now() }]
    } else {
        addPaidPreviewUrl.value = ''
        addPaidFileList.value = [{ name: raw.name, uid: Date.now(), raw }]
    }
}

function onAddPaidFileExceed(files: File[]) {
    const raw = files?.[0]
    if (!raw) return
    if (!beforePaidFileUpload(raw)) {
        addUploadRef.value?.clearFiles?.()
        return
    }
    onAddPaidFileChange({ raw }, [{ raw }])
}

function onAddPaidFileRemove() {
    if (addPaidPreviewUrl.value && addPaidPreviewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(addPaidPreviewUrl.value)
    }
    addPaidPreviewUrl.value = ''
    addPaidFile.value = null
    addPaidFileList.value = []
    addForm.paidFileUrl = ''
    addUploadRef.value?.clearFiles?.()
}

function onEditPaidFileChange(uploadFile: { raw?: File; name?: string }, fileList: { raw?: File; name?: string }[]) {
    const raw = (fileList?.length ? fileList[fileList.length - 1]?.raw : uploadFile?.raw) || uploadFile?.raw
    if (!raw) return
    if (!beforePaidFileUpload(raw)) {
        editPaidFile.value = null
        editPaidFileList.value = []
        editPaidPreviewUrl.value = ''
        editForm.paidFileUrl = ''
        editUploadRef.value?.clearFiles?.()
        return
    }
    editPaidFile.value = raw
    editForm.paidFileUrl = raw.name
    if (isImageFileName(raw.name)) {
        if (editPaidPreviewUrl.value && editPaidPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(editPaidPreviewUrl.value)
        editPaidPreviewUrl.value = URL.createObjectURL(raw)
        editPaidFileList.value = [{ name: raw.name, url: editPaidPreviewUrl.value, raw, uid: Date.now() }]
    } else {
        editPaidPreviewUrl.value = ''
        editPaidFileList.value = [{ name: raw.name, uid: Date.now(), raw }]
    }
}

function onEditPaidFileExceed(files: File[]) {
    const raw = files?.[0]
    if (!raw) return
    if (!beforePaidFileUpload(raw)) {
        editUploadRef.value?.clearFiles?.()
        return
    }
    onEditPaidFileChange({ raw }, [{ raw }])
}

function onEditPaidFileRemove() {
    if (editPaidPreviewUrl.value && editPaidPreviewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(editPaidPreviewUrl.value)
    }
    editPaidPreviewUrl.value = ''
    editPaidFile.value = null
    editPaidFileList.value = []
    editForm.paidFileUrl = ''
    editUploadRef.value?.clearFiles?.()
}

async function loadList() {
    loading.value = true
    try {
        const body: any = { current: currentPage.value, size: pageSize.value }
        if (searchForm.appName?.trim()) body.appName = searchForm.appName.trim()
        if (searchForm.appPkg?.trim()) body.appPkg = searchForm.appPkg.trim()

        const res: any = await getFeeInfoPage(body)
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
    searchForm.appPkg = ''
    searchAppOptions.value = filterAppOptions()
    currentPage.value = 1
    loadList()
}

function handleView(row: any) {
    viewRow.value = { ...row }
    viewVisible.value = true
}

function handleEdit(row: any) {
    editingId.value = row.id
    editForm.appName = row.appName ?? ''
    editForm.appPkg = row.appPkg ?? ''
    editForm.validityPeriodStart = row.validityPeriodStart ?? ''
    editForm.validityPeriodEnd = row.validityPeriodEnd ?? ''
    editForm.feePaid = row.feePaid != null ? Number(row.feePaid) : undefined
    editForm.paidFileUrl = row.paidFileUrl ?? ''
    ;(editForm as any).status = Number(row.status ?? 0)
    // 初始化编辑上传状态：已有凭证时作为一条虚拟记录展示
    editPaidFile.value = null
    editPaidPreviewUrl.value = ''
    editPaidFileList.value = editForm.paidFileUrl
        ? [{ name: '当前凭证', url: editForm.paidFileUrl, uid: -1 }]
        : []
    editVisible.value = true
}

function cancelEdit() {
    editingId.value = null
}

function openAddDialog() {
    addVisible.value = true
}

function resetAddForm() {
    addForm.appPkg = ''
    addForm.appPkgDisplay = ''
    addForm.appName = ''
    addForm.validityPeriodStart = ''
    addForm.validityPeriodEnd = ''
    addForm.feePaid = undefined
    addForm.paidFileUrl = ''
    // 清空新增上传状态
    if (addPaidPreviewUrl.value && addPaidPreviewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(addPaidPreviewUrl.value)
    }
    addPaidPreviewUrl.value = ''
    addPaidFile.value = null
    addPaidFileList.value = []
    addUploadRef.value?.clearFiles?.()
    appOptions.value = filterAppOptions()
    addFormRef.value?.resetFields()
}

async function submitAdd() {
    if (!addFormRef.value) return
    await addFormRef.value.validate(async (valid) => {
        if (!valid) return
        if (addForm.feePaid == null || addForm.feePaid < 0) {
            ElMessage.warning('请输入有效费用')
            return
        }
        addSubmitting.value = true
        try {
            let paidFileUrl = addForm.paidFileUrl || ''
            if (addPaidFile.value) {
                paidFileUrl = await uploadByPut(addPaidFile.value, 'apps/fee')
            }
            await addFeeInfo({
                appPkg: addForm.appPkg,
                feePaid: addForm.feePaid,
                paidFileUrl: paidFileUrl || undefined,
                validityPeriodStart: addForm.validityPeriodStart,
                validityPeriodEnd: addForm.validityPeriodEnd,
                status: (addForm as any).status ?? 0,
            })
            ElMessage.success('新增成功')
            addVisible.value = false
            loadList()
        } catch (e) {
            ElMessage.error('新增失败')
        } finally {
            addSubmitting.value = false
        }
    })
}

async function submitEdit() {
    if (!editFormRef.value || editingId.value == null) return
    await editFormRef.value.validate(async (valid) => {
        if (!valid) return
        if (editForm.feePaid == null || editForm.feePaid < 0) {
            ElMessage.warning('请输入有效费用')
            return
        }
        editSubmitting.value = true
        try {
            let paidFileUrl = editForm.paidFileUrl || ''
            if (editPaidFile.value) {
                paidFileUrl = await uploadByPut(editPaidFile.value, 'apps/fee')
            }         
            await updateFeeInfo({
                id: editingId.value,
                validityPeriodStart: editForm.validityPeriodStart,
                validityPeriodEnd: editForm.validityPeriodEnd,
                feePaid: editForm.feePaid,
                paidFileUrl: paidFileUrl || undefined,
                status: (editForm as any).status ?? 0,
            })
            ElMessage.success('保存成功')
            editVisible.value = false
            loadList()
        } catch (e) {
            ElMessage.error('保存失败')
        } finally {
            editSubmitting.value = false
        }
    })
}

onMounted(() => {
    void loadAppOptions()
    loadList()
})
</script>

<style scoped>
.fee-management-page :deep(.page-content-body) {
    padding-top: 0;
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
.filter-select {
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
.filter-card :deep(.filter-select .el-select__wrapper) {
    min-height: 34px;
    padding: 0 10px;
    background-color: #edf1fc;
    border-radius: 8px;
    box-shadow: none !important;
}
.filter-card :deep(.filter-select .el-select__wrapper:hover),
.filter-card :deep(.filter-select .el-select__wrapper.is-focused) {
    box-shadow: none !important;
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
.btn-add-app--wide {
    width: auto;
    min-width: 160px;
    padding: 0 14px;
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
.fee-table {
    --el-table-border-color: #ebeef5;
    --el-table-fixed-right-column: none;
    --el-table-fixed-left-column: none;
}
.fee-table :deep(.el-table__fixed-right),
.fee-table :deep(.el-table__fixed-left) {
    box-shadow: none !important;
}
.fee-table :deep(.el-table__inner-wrapper::before) {
    display: none;
}
.fee-table :deep(.el-table__cell) {
    border-right: none !important;
    border-left: none !important;
    border-top: none !important;
}
.fee-table :deep(thead th.el-table__cell),
.fee-table :deep(tbody td.el-table__cell) {
    border-bottom: 1px solid #ebeef5 !important;
}
.fee-table :deep(.el-table__header-wrapper) {
    border-radius: 8px;
    overflow: hidden;
}
.fee-table :deep(thead th.el-table__cell:first-child) {
    border-top-left-radius: 8px;
}
.fee-table :deep(thead th.el-table__cell:last-child) {
    border-top-right-radius: 8px;
}
 .fee-table :deep(.el-table__header-wrapper th.el-table__cell) {
    background-color: #edf1fc !important;
    padding: 10px 12px;
    box-sizing: border-box;
    vertical-align: middle;
}
.fee-table :deep(.el-table__header .cell) {
    font-size: 13px;
    font-weight: 700;
    color: #000000;
    line-height: 18px;
}
.fee-table :deep(.el-table__body .el-table__cell .cell) {
    font-size: 12px;
    color: #575757;
    line-height: 18px;
}
.fee-table :deep(tbody td.el-table__cell) {
    font-size: 12px;
    color: #575757;
    box-sizing: border-box;
}
.fee-table :deep(.el-table__body .el-button.is-link) {
    font-size: 12px;
    line-height: 18px;
    vertical-align: baseline;
}
.fee-table :deep(.el-table__body .el-button.is-link.el-button--primary) {
    color: #2d53eb !important;
}
.fee-table :deep(.el-table__body .el-button.is-link.el-button--primary .el-icon) {
    color: #2d53eb !important;
}

/* 查看 / 编辑：与用户管理一致（有 icon，不同颜色） */
.fee-table :deep(.op-cell) {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: 2px;
    white-space: nowrap;
}

.fee-table :deep(.op-btn) {
    font-size: 12px;
    padding: 4px 4px;
}

.fee-table :deep(.op-btn--view) {
    color: #ff9900 !important;
}
.fee-table :deep(.op-btn--view .el-icon),
.fee-table :deep(.op-btn--view svg) {
    color: #ff9900;
}

.fee-table :deep(.op-btn--edit) {
    color: #409eff !important;
}
.fee-table :deep(.op-btn--edit .el-icon),
.fee-table :deep(.op-btn--edit svg) {
    color: #409eff;
}

.fee-table :deep(.el-table__fixed-right-patch) {
    background-color: #edf1fc;
}
.add-form-single-col .el-form-item .el-input,
.add-form-single-col .el-form-item .el-select,
.add-form-single-col .el-form-item .el-input-number {
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
.validity-range {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}
.validity-range__sep {
    color: #909399;
    flex-shrink: 0;
}
.upload-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
}
.voucher-preview {
    width: 120px;
    height: 120px;
    margin-top: 8px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
}
.ml-2 {
    margin-left: 8px;
}
</style>
