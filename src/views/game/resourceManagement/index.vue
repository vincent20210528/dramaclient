<template>
    <page-content class="game-resource-page" :title="title">
        <template #bottom>
            <el-card class="list-card" shadow="never">
                <div class="panel-wrap panel-register-wrap">
                    <div class="filter-card">
                        <el-form inline class="search-form">
                            <el-form-item>
                                <el-input
                                    v-model="searchForm.gameName"
                                    class="filter-input"
                                    placeholder="游戏名称"
                                    clearable
                                    @keyup.enter="handleSearch"
                                />
                            </el-form-item>
                            <el-form-item>
                                <el-select
                                    v-model="searchForm.categoryCode"
                                    class="filter-select"
                                    placeholder="游戏分类"
                                    clearable
                                    filterable
                                    :loading="categoryLoading"
                                    @change="handleSearch"
                                >
                                    <el-option
                                        v-for="item in categoryOptions"
                                        :key="item.categoryCode"
                                        :label="item.categoryName"
                                        :value="item.categoryCode"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item>
                                <el-select
                                    v-model="searchForm.languageCode"
                                    class="filter-select"
                                    placeholder="语言"
                                    clearable
                                    filterable
                                    :loading="languageLoading"
                                    @change="handleSearch"
                                >
                                    <el-option
                                        v-for="item in languageOptions"
                                        :key="item.languageCode"
                                        :label="`${item.languageName} (${item.languageCode})`"
                                        :value="item.languageCode"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item>
                                <el-select
                                    v-model="searchForm.status"
                                    class="filter-select filter-select--sm"
                                    placeholder="状态"
                                    clearable
                                    @change="handleSearch"
                                >
                                    <el-option label="上线" :value="1" />
                                    <el-option label="下线" :value="0" />
                                </el-select>
                            </el-form-item>
                            <el-form-item class="search-form__actions">
                                <el-button class="btn-query" type="primary" @click="handleSearch">查询</el-button>
                                <el-button class="btn-reset" @click="handleReset">重置</el-button>
                            </el-form-item>
                            <el-form-item v-if="canAdd" class="search-form__add">
                                <el-button class="btn-add-app" type="primary" :icon="Plus" @click="openAddDialog">
                                    添加游戏
                                </el-button>
                            </el-form-item>
                        </el-form>
                    </div>

                    <div class="table-toolbar">
                        <span class="toolbar-actions">
                            <el-icon class="toolbar-icon" @click="loadList"><Refresh /></el-icon>
                        </span>
                    </div>

                    <el-table class="register-table" :data="tableData" v-loading="loading" style="width: 100%">
                        <el-table-column type="index" label="序号" width="70" align="center" :index="indexMethod" />
                        <el-table-column prop="gameId" label="游戏ID" width="110" align="center" show-overflow-tooltip />
                        <el-table-column prop="gameName" label="游戏名称" min-width="140" align="center" show-overflow-tooltip />
                        <el-table-column label="图标" width="80" align="center">
                            <template #default="{ row }">
                                <el-image
                                    v-if="row.iconUrl"
                                    :src="row.iconUrl"
                                    :preview-src-list="[row.iconUrl]"
                                    fit="cover"
                                    class="game-icon"
                                    preview-teleported
                                />
                                <span v-else class="text-muted">—</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="分类" min-width="120" align="center" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ getCategoryName(row.categoryCode) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="languageCode" label="语言" width="90" align="center" />
                        <el-table-column label="状态" width="90" align="center">
                            <template #default="{ row }">
                                <span :class="['status-pill', row.status === 1 ? 'status-pill--ok' : 'status-pill--off']">
                                    {{ row.status === 1 ? '上线' : '下线' }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="rating" label="评分" width="70" align="center" />
                        <el-table-column prop="downloadCount" label="下载量" width="90" align="center" />
                        <el-table-column prop="version" label="版本" width="70" align="center" />
                        <el-table-column label="横竖屏" width="80" align="center">
                            <template #default="{ row }">
                                {{ row.orientation === 1 ? '竖屏' : '横屏' }}
                            </template>
                        </el-table-column>
                        <el-table-column
                            v-if="canEdit || canDelete || canList"
                            label="操作"
                            width="240"
                            align="center"
                            fixed="right"
                        >
                            <template #default="{ row }">
                                <div class="op-cell">
                                    <el-button
                                        v-if="canList && row.resourceUrl"
                                        type="primary"
                                        link
                                        :icon="Download"
                                        @click="handleDownload(row)"
                                    >
                                        下载
                                    </el-button>
                                    <el-button v-if="canEdit" type="primary" link :icon="Edit" @click="openEditDialog(row)">
                                        编辑
                                    </el-button>
                                    <el-button v-if="canDelete" type="danger" link :icon="Delete" @click="removeItem(Number(row.id))">
                                        删除
                                    </el-button>
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
                            @size-change="handleSizeChange"
                            @current-change="handleCurrentChange"
                        />
                    </div>
                </div>
            </el-card>

            <el-dialog
                v-model="dialogVisible"
                :title="dialogMode === 'add' ? '添加游戏' : '编辑游戏'"
                width="760px"
                align-center
                destroy-on-close
                class="menu-add-dialog game-form-dialog"
                @close="resetForm"
            >
                <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px" class="game-form">
                    <el-form-item v-if="dialogMode === 'edit'" label="游戏ID">
                        <el-input v-model="form.gameId" disabled />
                    </el-form-item>
                    <el-form-item label="游戏名称" prop="gameName">
                        <el-input v-model="form.gameName" placeholder="请输入游戏名称" clearable />
                    </el-form-item>
                    <el-form-item label="游戏分类" prop="categoryCode">
                        <el-select v-model="form.categoryCode" placeholder="请选择分类" filterable style="width: 100%">
                            <el-option
                                v-for="item in categoryOptions"
                                :key="item.categoryCode"
                                :label="item.categoryName"
                                :value="item.categoryCode"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="语言" prop="languageCode">
                        <el-select v-model="form.languageCode" placeholder="请选择语言" filterable style="width: 100%">
                            <el-option
                                v-for="item in languageOptions"
                                :key="item.languageCode"
                                :label="`${item.languageName} (${item.languageCode})`"
                                :value="item.languageCode"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="描述">
                        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述（可选）" />
                    </el-form-item>
                    <el-form-item label="游戏图标" prop="iconUrl">
                        <div class="upload-field">
                            <el-upload
                                :auto-upload="false"
                                :show-file-list="false"
                                accept=".png,.jpg,.jpeg,.webp,.gif,.bmp"
                                :on-change="(f) => onFilePick(f, 'icon')"
                            >
                                <el-button type="primary">选择图标</el-button>
                            </el-upload>
                            <el-image
                                v-if="form.iconUrl"
                                :src="form.iconUrl"
                                fit="cover"
                                class="preview-thumb"
                                :preview-src-list="[form.iconUrl]"
                                preview-teleported
                            />
                        </div>
                    </el-form-item>
                    <el-form-item label="Banner图">
                        <div class="upload-field">
                            <el-upload
                                :auto-upload="false"
                                :show-file-list="false"
                                accept=".png,.jpg,.jpeg,.webp,.gif,.bmp"
                                :on-change="(f) => onFilePick(f, 'banner')"
                            >
                                <el-button>选择 Banner</el-button>
                            </el-upload>
                            <el-image
                                v-if="form.bannerUrl"
                                :src="form.bannerUrl"
                                fit="cover"
                                class="preview-thumb preview-thumb--wide"
                                :preview-src-list="[form.bannerUrl]"
                                preview-teleported
                            />
                        </div>
                    </el-form-item>
                    <el-form-item label="介绍视频">
                        <div class="upload-field">
                            <el-upload
                                :auto-upload="false"
                                :show-file-list="false"
                                accept=".mp4,.webm,.mov"
                                :on-change="(f) => onFilePick(f, 'video')"
                            >
                                <el-button>选择视频</el-button>
                            </el-upload>
                            <span v-if="form.videoUrl" class="file-name">{{ getFileName(form.videoUrl) }}</span>
                        </div>
                    </el-form-item>
                    <el-form-item label="详情图">
                        <div class="upload-field upload-field--column">
                            <el-upload
                                :auto-upload="false"
                                :show-file-list="false"
                                accept=".png,.jpg,.jpeg,.webp,.gif,.bmp"
                                :on-change="(f) => onFilePick(f, 'detail')"
                            >
                                <el-button>添加详情图</el-button>
                            </el-upload>
                            <div v-if="detailImageList.length" class="detail-images">
                                <div v-for="(url, idx) in detailImageList" :key="url + idx" class="detail-images__item">
                                    <el-image :src="url" fit="cover" class="preview-thumb" :preview-src-list="detailImageList" preview-teleported />
                                    <el-button type="danger" link size="small" @click="removeDetailImage(idx)">移除</el-button>
                                </div>
                            </div>
                        </div>
                    </el-form-item>
                    <el-form-item label="资源包">
                        <div class="upload-field upload-field--column">
                            <el-upload
                                :auto-upload="false"
                                :show-file-list="false"
                                accept=".zip"
                                :on-change="(f) => onFilePick(f, 'resource')"
                            >
                                <el-button>选择 ZIP 资源</el-button>
                            </el-upload>
                            <span v-if="resourceFileName || form.resourceUrl" class="file-name">
                                {{ resourceFileName || getFileName(form.resourceUrl) }}
                                <template v-if="form.resourceSize">（{{ formatBytes(form.resourceSize) }}）</template>
                            </span>
                        </div>
                    </el-form-item>
                    <el-row :gutter="16">
                        <el-col :span="12">
                            <el-form-item label="上线状态" prop="status">
                                <el-radio-group v-model="form.status">
                                    <el-radio :value="1">上线</el-radio>
                                    <el-radio :value="0">下线</el-radio>
                                </el-radio-group>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="横竖屏" prop="orientation">
                                <el-radio-group v-model="form.orientation">
                                    <el-radio :value="0">横屏</el-radio>
                                    <el-radio :value="1">竖屏</el-radio>
                                </el-radio-group>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="16">
                        <el-col :span="12">
                            <el-form-item label="管理端评分" prop="rating">
                                <el-rate v-model="form.rating" :max="5" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="热度值">
                                <el-input-number v-model="form.popularityScore" :min="0" :max="999999" controls-position="right" style="width: 100%" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="16">
                        <el-col :span="12">
                            <el-form-item label="Banner置顶">
                                <el-switch v-model="form.bannerPin" :active-value="1" :inactive-value="0" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="热门位置">
                                <el-switch v-model="form.hotPosition" :active-value="1" :inactive-value="0" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
                <template #footer>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="submitting" @click="saveDialog">保存</el-button>
                </template>
            </el-dialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { Delete, Download, Edit, Plus, Refresh } from '@element-plus/icons-vue'
import '@/views/drama/contentConfig/panelRegisterList.css'
import { getSupportLanguagePage } from '@/api'
import {
    addGameInfo,
    deleteGameInfo,
    downloadGameResource,
    getGameCategoryList,
    getGameInfoDetail,
    getGameInfoPage,
    replaceGameResource,
    updateGameInfo,
    uploadGameFile,
    type GameCategoryItem,
    type GameFileType,
    type GameInfoItem,
} from '@/api/game'
import { hasPerm, PERM_GAME } from '@/utils/permission'

const title = {
    firstTitle: '游戏资源管理',
    secondTitle: '管理休闲游戏资源，支持按名称、分类、语言、状态筛选',
}

const searchForm = reactive({
    gameName: '',
    categoryCode: '',
    languageCode: '',
    status: undefined as number | undefined,
})

const tableData = ref<GameInfoItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const categoryOptions = ref<GameCategoryItem[]>([])
const categoryLoading = ref(false)
const languageOptions = ref<{ languageCode: string; languageName: string }[]>([])
const languageLoading = ref(false)

const dialogVisible = ref(false)
const submitting = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const pendingFiles = reactive<Partial<Record<GameFileType, File>>>({})
const resourceFileName = ref('')
const resourceChanged = ref(false)

const form = reactive({
    gameId: '',
    gameName: '',
    categoryCode: '',
    languageCode: '',
    description: '',
    iconUrl: '',
    bannerUrl: '',
    videoUrl: '',
    detailImages: '',
    resourceUrl: '',
    resourceSize: 0 as number,
    status: 0 as 0 | 1,
    orientation: 0 as 0 | 1,
    rating: 3,
    bannerPin: 0 as 0 | 1,
    hotPosition: 0 as 0 | 1,
    popularityScore: 0,
})

const formRules: FormRules = {
    gameName: [{ required: true, message: '请输入游戏名称', trigger: 'blur' }],
    categoryCode: [{ required: true, message: '请选择游戏分类', trigger: 'change' }],
    languageCode: [{ required: true, message: '请选择语言', trigger: 'change' }],
    iconUrl: [{ required: true, message: '请上传游戏图标', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
    orientation: [{ required: true, message: '请选择横竖屏', trigger: 'change' }],
    rating: [{ required: true, message: '请设置评分', trigger: 'change' }],
}

const canAdd = hasPerm(PERM_GAME.add)
const canEdit = hasPerm(PERM_GAME.edit)
const canDelete = hasPerm(PERM_GAME.delete)
const canList = hasPerm(PERM_GAME.list)

const detailImageList = computed(() =>
    form.detailImages
        ? form.detailImages.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
)

const categoryNameMap = computed(() => {
    const map = new Map<string, string>()
    categoryOptions.value.forEach((item) => {
        if (item.categoryCode) map.set(item.categoryCode, item.categoryName)
    })
    return map
})

function indexMethod(index: number) {
    return (currentPage.value - 1) * pageSize.value + index + 1
}

function getCategoryName(code?: string) {
    if (!code) return '—'
    return categoryNameMap.value.get(code) || code
}

function getFileName(url?: string) {
    if (!url) return ''
    try {
        const pathname = new URL(url).pathname
        return decodeURIComponent(pathname.split('/').pop() || url)
    } catch {
        return url.split('/').pop() || url
    }
}

function formatBytes(bytes?: number) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

async function loadCategoryOptions() {
    categoryLoading.value = true
    try {
        const res: any = await getGameCategoryList()
        const data = res?.data?.data ?? res?.data
        categoryOptions.value = Array.isArray(data) ? data : data?.records ?? []
    } catch {
        categoryOptions.value = []
    } finally {
        categoryLoading.value = false
    }
}

async function loadLanguageOptions() {
    languageLoading.value = true
    try {
        const res: any = await getSupportLanguagePage({ current: 1, size: 500 })
        const data = res?.data?.data ?? res?.data
        languageOptions.value = (data?.records ?? [])
            .map((item: any) => ({
                languageCode: String(item.languageCode ?? ''),
                languageName: String(item.languageName ?? item.languageCode ?? ''),
            }))
            .filter((item: { languageCode: string }) => item.languageCode)
    } catch {
        languageOptions.value = []
    } finally {
        languageLoading.value = false
    }
}

async function loadList() {
    loading.value = true
    try {
        const res: any = await getGameInfoPage({
            current: currentPage.value,
            size: pageSize.value,
            gameName: searchForm.gameName,
            categoryCode: searchForm.categoryCode,
            languageCode: searchForm.languageCode,
            status: searchForm.status,
        })
        const data = res?.data?.data ?? res?.data
        tableData.value = data?.records ?? []
        total.value = Number(data?.total ?? 0)
    } catch {
        tableData.value = []
        total.value = 0
    } finally {
        loading.value = false
    }
}

function handleSearch() {
    currentPage.value = 1
    loadList()
}

function handleReset() {
    searchForm.gameName = ''
    searchForm.categoryCode = ''
    searchForm.languageCode = ''
    searchForm.status = undefined
    currentPage.value = 1
    loadList()
}

function handleSizeChange() {
    currentPage.value = 1
    loadList()
}

function handleCurrentChange() {
    loadList()
}

function clearPendingFiles() {
    Object.keys(pendingFiles).forEach((key) => delete pendingFiles[key as GameFileType])
    resourceFileName.value = ''
    resourceChanged.value = false
}

function resetForm() {
    editingId.value = null
    form.gameId = ''
    form.gameName = ''
    form.categoryCode = ''
    form.languageCode = ''
    form.description = ''
    form.iconUrl = ''
    form.bannerUrl = ''
    form.videoUrl = ''
    form.detailImages = ''
    form.resourceUrl = ''
    form.resourceSize = 0
    form.status = 0
    form.orientation = 0
    form.rating = 3
    form.bannerPin = 0
    form.hotPosition = 0
    form.popularityScore = 0
    clearPendingFiles()
    formRef.value?.resetFields()
}

function openAddDialog() {
    if (!canAdd) return
    dialogMode.value = 'add'
    resetForm()
    dialogVisible.value = true
}

async function openEditDialog(row: GameInfoItem) {
    dialogMode.value = 'edit'
    resetForm()
    editingId.value = Number(row.id)
    try {
        const res: any = await getGameInfoDetail(row.id)
        const detail = res?.data?.data ?? res?.data ?? row
        form.gameId = detail.gameId ?? ''
        form.gameName = detail.gameName ?? ''
        form.categoryCode = detail.categoryCode ?? ''
        form.languageCode = detail.languageCode ?? ''
        form.description = detail.description ?? ''
        form.iconUrl = detail.iconUrl ?? ''
        form.bannerUrl = detail.bannerUrl ?? ''
        form.videoUrl = detail.videoUrl ?? ''
        form.detailImages = detail.detailImages ?? ''
        form.resourceUrl = detail.resourceUrl ?? ''
        form.resourceSize = Number(detail.resourceSize ?? 0)
        form.status = detail.status === 1 ? 1 : 0
        form.orientation = detail.orientation === 1 ? 1 : 0
        form.rating = Number(detail.rating ?? 3)
        form.bannerPin = detail.bannerPin === 1 ? 1 : 0
        form.hotPosition = detail.hotPosition === 1 ? 1 : 0
        form.popularityScore = Number(detail.popularityScore ?? 0)
        dialogVisible.value = true
    } catch (e: any) {
        const msg = e?.response?.data?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '获取详情失败')
    }
}

function onFilePick(file: UploadFile, type: GameFileType) {
    const raw = file?.raw
    if (!raw) return
    if (type === 'resource') {
        pendingFiles.resource = raw
        resourceFileName.value = raw.name
        form.resourceSize = raw.size
        resourceChanged.value = true
        return
    }
    if (type === 'detail') {
        void uploadDetailImage(raw)
        return
    }
    void uploadSingleFile(type, raw)
}

async function uploadSingleFile(type: GameFileType, file: File) {
    try {
        const url = await uploadGameFile(file, type)
        if (type === 'icon') form.iconUrl = url
        if (type === 'banner') form.bannerUrl = url
        if (type === 'video') form.videoUrl = url
        delete pendingFiles[type]
        if (type === 'icon') formRef.value?.validateField('iconUrl')
        ElMessage.success('上传成功')
    } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '上传失败')
    }
}

async function uploadDetailImage(file: File) {
    try {
        const url = await uploadGameFile(file, 'detail')
        const list = detailImageList.value.slice()
        list.push(url)
        form.detailImages = list.join(',')
        delete pendingFiles.detail
        ElMessage.success('详情图上传成功')
    } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '上传失败')
    }
}

function removeDetailImage(index: number) {
    const list = detailImageList.value.slice()
    list.splice(index, 1)
    form.detailImages = list.join(',')
}

function buildPayload() {
    return {
        gameName: form.gameName.trim(),
        categoryCode: form.categoryCode,
        languageCode: form.languageCode,
        iconUrl: form.iconUrl,
        description: form.description.trim() || undefined,
        status: form.status,
        bannerUrl: form.bannerUrl || undefined,
        videoUrl: form.videoUrl || undefined,
        detailImages: form.detailImages || undefined,
        rating: form.rating,
        orientation: form.orientation,
        bannerPin: form.bannerPin,
        hotPosition: form.hotPosition,
        popularityScore: form.popularityScore,
        ...(form.resourceUrl && {
            resourceUrl: form.resourceUrl,
            resourceSize: form.resourceSize,
        }),
    }
}

async function saveDialog() {
    if (!formRef.value) return
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    if (pendingFiles.resource) {
        try {
            form.resourceUrl = await uploadGameFile(pendingFiles.resource, 'resource')
            form.resourceSize = pendingFiles.resource.size
            delete pendingFiles.resource
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? e?.message
            ElMessage.error(msg && typeof msg === 'string' ? msg : '资源包上传失败')
            return
        }
    }

    submitting.value = true
    try {
        const payload = buildPayload()
        if (dialogMode.value === 'add') {
            await addGameInfo(payload)
            ElMessage.success('添加成功')
        } else {
            if (editingId.value == null) return
            await updateGameInfo({ id: editingId.value, ...payload })
            if (resourceChanged.value && form.resourceUrl) {
                await replaceGameResource({
                    id: editingId.value,
                    resourceUrl: form.resourceUrl,
                    resourceSize: form.resourceSize,
                })
            }
            ElMessage.success('保存成功')
        }
        dialogVisible.value = false
        loadList()
    } catch (e: any) {
        const msg = e?.response?.data?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '操作失败')
    } finally {
        submitting.value = false
    }
}

async function removeItem(id: number) {
    try {
        await ElMessageBox.confirm('确定要删除该游戏吗？', '提示', {
            type: 'warning',
            customClass: 'app-confirm-dialog',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showClose: true,
        })
        await deleteGameInfo(id)
        ElMessage.success('删除成功')
        loadList()
    } catch (e: any) {
        if (e === 'cancel') return
        const msg = e?.response?.data?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '删除失败')
    }
}

async function handleDownload(row: GameInfoItem) {
    try {
        const res: any = await downloadGameResource(row.id)
        const url = res?.data?.data ?? res?.data
        if (typeof url === 'string' && url) {
            window.open(url, '_blank')
            return
        }
        if (url?.url) {
            window.open(url.url, '_blank')
            return
        }
        ElMessage.error('获取下载地址失败')
    } catch (e: any) {
        const msg = e?.response?.data?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '下载失败')
    }
}

onMounted(async () => {
    await Promise.all([loadCategoryOptions(), loadLanguageOptions()])
    loadList()
})
</script>

<style scoped>
.game-resource-page :deep(.page-content-body) {
    padding-top: 0;
}
:deep(.game-resource-page.page-content) {
    background-color: #ffffff;
}

.list-card {
    border-radius: 20px;
    overflow: hidden;
}
.list-card :deep(.el-card__body) {
    padding: 12px 20px 20px;
    box-sizing: border-box;
}

.filter-select--sm {
    width: 120px;
}

.game-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
}

.text-muted {
    color: #c0c4cc;
    font-size: 12px;
}

.status-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 52px;
    height: 22px;
    padding: 0 8px;
    font-size: 12px;
    border-radius: 8px;
}
.status-pill--ok {
    background: #dfffd9;
    color: #16a34a;
}
.status-pill--off {
    background: #f4f4f5;
    border: 1px solid #dcdfe6;
    color: #909399;
}

.register-table :deep(.op-cell) {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: 2px;
    white-space: nowrap;
}
.register-table :deep(.op-cell .el-button.is-link) {
    font-size: 12px;
    padding: 4px;
}

.game-form-dialog :deep(.el-dialog__body) {
    max-height: 68vh;
    overflow-y: auto;
}

.upload-field {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
}
.upload-field--column {
    flex-direction: column;
}

.preview-thumb {
    width: 64px;
    height: 64px;
    border-radius: 8px;
}
.preview-thumb--wide {
    width: 120px;
    height: 64px;
}

.file-name {
    font-size: 12px;
    color: #606266;
    line-height: 32px;
    word-break: break-all;
}

.detail-images {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}
.detail-images__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}
</style>
