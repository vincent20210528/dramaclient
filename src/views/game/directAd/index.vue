<template>
    <page-content class="game-direct-ad-page" :title="title">
        <template #bottom>
            <el-card class="list-card" shadow="never">
                <div class="panel-wrap panel-register-wrap">
                    <div class="filter-card">
                        <el-form inline class="search-form">
                            <el-form-item>
                                <el-input
                                    v-model="keyword"
                                    class="filter-input"
                                    placeholder="按标题搜索"
                                    clearable
                                    @clear="handleSearch"
                                    @keyup.enter="handleSearch"
                                />
                            </el-form-item>
                            <el-form-item>
                                <el-select v-model="filterAdType" clearable placeholder="广告类型" style="width: 140px">
                                    <el-option label="开屏" :value="1" />
                                    <el-option label="插屏" :value="2" />
                                    <el-option label="激励" :value="3" />
                                </el-select>
                            </el-form-item>
                            <el-form-item>
                                <el-select v-model="filterStatus" clearable placeholder="状态" style="width: 120px">
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
                                    添加广告
                                </el-button>
                            </el-form-item>
                        </el-form>
                    </div>

                    <div class="table-toolbar">
                        <span class="toolbar-tip">权重 1-10，客户端按权重概率随机选择打底广告</span>
                        <span class="toolbar-actions">
                            <el-icon class="toolbar-icon" @click="loadList"><Refresh /></el-icon>
                        </span>
                    </div>

                    <el-table class="register-table" :data="tableData" v-loading="loading" style="width: 100%">
                        <el-table-column type="index" label="序号" width="70" align="center" :index="indexMethod" />
                        <el-table-column prop="title" label="标题" min-width="140" align="center" show-overflow-tooltip />
                        <el-table-column label="图标" width="80" align="center">
                            <template #default="{ row }">
                                <el-image
                                    v-if="row.iconUrl"
                                    :src="row.iconUrl"
                                    :preview-src-list="[row.iconUrl]"
                                    fit="cover"
                                    class="thumb"
                                    preview-teleported
                                />
                                <span v-else class="muted">—</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="类型" width="90" align="center">
                            <template #default="{ row }">{{ adTypeLabel(row.adType) }}</template>
                        </el-table-column>
                        <el-table-column label="行为" width="100" align="center">
                            <template #default="{ row }">{{ actionTypeLabel(row.actionType) }}</template>
                        </el-table-column>
                        <el-table-column prop="weight" label="权重" width="80" align="center" />
                        <el-table-column label="状态" width="110" align="center">
                            <template #default="{ row }">
                                <el-switch
                                    v-if="canEdit"
                                    :model-value="row.status"
                                    :active-value="1"
                                    :inactive-value="0"
                                    inline-prompt
                                    active-text="上线"
                                    inactive-text="下线"
                                    :loading="statusLoadingId === row.id"
                                    @change="(v: string | number | boolean) => toggleStatus(row, Number(v))"
                                />
                                <el-tag v-else :type="row.status === 1 ? 'success' : 'info'" size="small">
                                    {{ row.status === 1 ? '上线' : '下线' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="updatedAt" label="更新时间" min-width="160" align="center" show-overflow-tooltip />
                        <el-table-column label="操作" width="220" align="center" fixed="right">
                            <template #default="{ row }">
                                <div class="op-cell">
                                    <el-button type="primary" link :icon="View" @click="openViewDialog(row)">查看</el-button>
                                    <el-button v-if="canEdit" type="primary" link :icon="Edit" @click="openEditDialog(row)">
                                        编辑
                                    </el-button>
                                    <el-button v-if="canDelete" type="danger" link :icon="Delete" @click="removeItem(row.id)">
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
                :title="dialogTitle"
                width="720px"
                align-center
                destroy-on-close
                class="menu-add-dialog"
                @close="resetForm"
            >
                <el-form
                    ref="formRef"
                    :model="form"
                    :rules="formRules"
                    label-width="140px"
                    class="ad-form"
                    :disabled="dialogMode === 'view'"
                >
                    <el-form-item label="标题" prop="title">
                        <el-input v-model="form.title" maxlength="128" show-word-limit placeholder="请输入广告标题" />
                    </el-form-item>
                    <el-form-item label="简介">
                        <el-input
                            v-model="form.description"
                            type="textarea"
                            :rows="2"
                            maxlength="512"
                            show-word-limit
                            placeholder="可选"
                        />
                    </el-form-item>
                    <el-form-item label="广告类型" prop="adType">
                        <el-radio-group v-model="form.adType">
                            <el-radio :value="1">开屏</el-radio>
                            <el-radio :value="2">插屏</el-radio>
                            <el-radio :value="3">激励</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="广告行为" prop="actionType">
                        <el-radio-group v-model="form.actionType">
                            <el-radio :value="1">安装</el-radio>
                            <el-radio :value="2">查看详情</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="落地页地址" prop="landingUrl">
                        <el-input v-model="form.landingUrl" placeholder="https://..." />
                    </el-form-item>
                    <el-form-item label="广告图标">
                        <div class="media-field">
                            <el-upload
                                v-if="dialogMode !== 'view'"
                                :auto-upload="false"
                                :show-file-list="false"
                                :limit="1"
                                accept=".png,.jpg,.jpeg,.webp,.gif,.bmp"
                                :on-change="(f) => onMediaChange('icon', f)"
                            >
                                <el-button type="primary">选择图片</el-button>
                            </el-upload>
                            <div class="media-preview-side">
                                <template v-if="iconPreview">
                                    <el-image
                                        :src="iconPreview"
                                        fit="cover"
                                        class="media-preview"
                                        :preview-src-list="[iconPreview]"
                                        preview-teleported
                                    />
                                    <el-button v-if="dialogMode !== 'view'" type="danger" size="small" link @click="clearMedia('icon')">
                                        移除
                                    </el-button>
                                </template>
                                <span v-else class="muted">未上传</span>
                            </div>
                        </div>
                    </el-form-item>
                    <el-form-item label="广告大图">
                        <div class="media-field">
                            <el-upload
                                v-if="dialogMode !== 'view'"
                                :auto-upload="false"
                                :show-file-list="false"
                                :limit="1"
                                accept=".png,.jpg,.jpeg,.webp,.gif,.bmp"
                                :on-change="(f) => onMediaChange('image', f)"
                            >
                                <el-button type="primary">选择图片</el-button>
                            </el-upload>
                            <div class="media-preview-side">
                                <template v-if="imagePreview">
                                    <el-image
                                        :src="imagePreview"
                                        fit="cover"
                                        class="media-preview"
                                        :preview-src-list="[imagePreview]"
                                        preview-teleported
                                    />
                                    <el-button v-if="dialogMode !== 'view'" type="danger" size="small" link @click="clearMedia('image')">
                                        移除
                                    </el-button>
                                </template>
                                <span v-else class="muted">未上传</span>
                            </div>
                        </div>
                    </el-form-item>
                    <el-form-item label="广告视频">
                        <div class="media-field">
                            <el-upload
                                v-if="dialogMode !== 'view'"
                                :auto-upload="false"
                                :show-file-list="false"
                                :limit="1"
                                accept=".mp4,.webm,.mov,.avi,.mkv"
                                :on-change="(f) => onMediaChange('video', f)"
                            >
                                <el-button type="primary">选择视频</el-button>
                            </el-upload>
                            <div class="media-preview-side">
                                <template v-if="videoPreview">
                                    <video class="media-preview video" :src="videoPreview" controls />
                                    <el-button v-if="dialogMode !== 'view'" type="danger" size="small" link @click="clearMedia('video')">
                                        移除
                                    </el-button>
                                </template>
                                <span v-else class="muted">未上传</span>
                            </div>
                        </div>
                    </el-form-item>
                    <template v-if="form.adType === 3">
                        <el-form-item label="观看倒计时(秒)" prop="rewardCountdownSec">
                            <el-input-number v-model="form.rewardCountdownSec" :min="1" :max="120" style="width: 100%" />
                        </el-form-item>
                        <el-form-item label="点击提前获奖励">
                            <el-switch
                                v-model="form.rewardClickEarly"
                                :active-value="1"
                                :inactive-value="0"
                                active-text="支持"
                                inactive-text="不支持"
                            />
                        </el-form-item>
                    </template>
                    <el-form-item label="权重" prop="weight">
                        <el-input-number v-model="form.weight" :min="1" :max="10" style="width: 100%" />
                    </el-form-item>
                    <el-form-item label="状态">
                        <el-switch
                            v-model="form.status"
                            :active-value="1"
                            :inactive-value="0"
                            active-text="上线"
                            inactive-text="下线"
                        />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="dialogVisible = false">{{ dialogMode === 'view' ? '关闭' : '取消' }}</el-button>
                    <el-button v-if="dialogMode !== 'view'" type="primary" :loading="submitting" @click="saveDialog">
                        保存
                    </el-button>
                </template>
            </el-dialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { Delete, Edit, Plus, Refresh, View } from '@element-plus/icons-vue'
import '@/views/drama/contentConfig/panelRegisterList.css'
import {
    addGameDirectAd,
    deleteGameDirectAd,
    getGameDirectAdPage,
    updateGameDirectAd,
    updateGameDirectAdStatus,
    type GameDirectAdItem,
} from '@/api/game'
import { hasPerm, PERM_GAME_DIRECT_AD } from '@/utils/permission'
import { uploadByPut } from '@/utils/obsUpload'

const title = {
    firstTitle: '直客广告',
    secondTitle: '管理开屏 / 插屏 / 激励直客广告，支持按权重打底',
}

const keyword = ref('')
const filterAdType = ref<number | undefined>()
const filterStatus = ref<number | undefined>()
const tableData = ref<GameDirectAdItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const statusLoadingId = ref<number | null>(null)

const canAdd = hasPerm(PERM_GAME_DIRECT_AD.add)
const canEdit = hasPerm(PERM_GAME_DIRECT_AD.edit)
const canDelete = hasPerm(PERM_GAME_DIRECT_AD.delete)

const dialogVisible = ref(false)
const submitting = ref(false)
const dialogMode = ref<'add' | 'edit' | 'view'>('add')
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
    title: '',
    description: '',
    adType: 1,
    actionType: 2,
    landingUrl: '',
    rewardCountdownSec: 15 as number | undefined,
    rewardClickEarly: 0,
    weight: 5,
    status: 0,
})

const formRules = computed<FormRules>(() => ({
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    adType: [{ required: true, message: '请选择广告类型', trigger: 'change' }],
    actionType: [{ required: true, message: '请选择广告行为', trigger: 'change' }],
    landingUrl: [{ required: true, message: '请填写落地页地址', trigger: 'blur' }],
    weight: [{ required: true, message: '请设置权重', trigger: 'change' }],
    rewardCountdownSec:
        form.adType === 3
            ? [{ required: true, message: '请设置观看倒计时', trigger: 'change' }]
            : [],
}))

const dialogTitle = computed(() => {
    if (dialogMode.value === 'add') return '添加直客广告'
    if (dialogMode.value === 'edit') return '编辑直客广告'
    return '查看直客广告'
})

type MediaKey = 'icon' | 'image' | 'video'
const mediaFiles = reactive<Record<MediaKey, File | null>>({ icon: null, image: null, video: null })
const mediaExisting = reactive<Record<MediaKey, string>>({ icon: '', image: '', video: '' })
const iconPreview = ref('')
const imagePreview = ref('')
const videoPreview = ref('')
const previewMap: Record<MediaKey, typeof iconPreview> = {
    icon: iconPreview,
    image: imagePreview,
    video: videoPreview,
}

function adTypeLabel(t: number) {
    return t === 1 ? '开屏' : t === 2 ? '插屏' : t === 3 ? '激励' : '—'
}

function actionTypeLabel(t: number) {
    return t === 1 ? '安装' : t === 2 ? '查看详情' : '—'
}

function indexMethod(index: number) {
    return (currentPage.value - 1) * pageSize.value + index + 1
}

function onMediaChange(key: MediaKey, uploadFile: UploadFile) {
    const raw = uploadFile.raw as File | undefined
    if (!raw) return
    mediaFiles[key] = raw
    previewMap[key].value = URL.createObjectURL(raw)
}

function clearMedia(key: MediaKey) {
    mediaFiles[key] = null
    mediaExisting[key] = ''
    previewMap[key].value = ''
}

async function loadList() {
    loading.value = true
    try {
        const res: any = await getGameDirectAdPage({
            current: currentPage.value,
            size: pageSize.value,
            title: keyword.value,
            adType: filterAdType.value,
            status: filterStatus.value,
        })
        const page = res?.data ?? res
        tableData.value = page?.records || []
        total.value = Number(page?.total || 0)
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message || '加载失败')
    } finally {
        loading.value = false
    }
}

function handleSearch() {
    currentPage.value = 1
    loadList()
}

function handleReset() {
    keyword.value = ''
    filterAdType.value = undefined
    filterStatus.value = undefined
    handleSearch()
}

function handleSizeChange() {
    currentPage.value = 1
    loadList()
}

function handleCurrentChange() {
    loadList()
}

function resetForm() {
    editingId.value = null
    form.title = ''
    form.description = ''
    form.adType = 1
    form.actionType = 2
    form.landingUrl = ''
    form.rewardCountdownSec = 15
    form.rewardClickEarly = 0
    form.weight = 5
    form.status = 0
    ;(['icon', 'image', 'video'] as MediaKey[]).forEach(clearMedia)
    formRef.value?.resetFields()
}

function fillForm(row: GameDirectAdItem) {
    form.title = row.title || ''
    form.description = row.description || ''
    form.adType = Number(row.adType) || 1
    form.actionType = Number(row.actionType) || 2
    form.landingUrl = row.landingUrl || ''
    form.rewardCountdownSec = row.rewardCountdownSec ?? 15
    form.rewardClickEarly = row.rewardClickEarly ?? 0
    form.weight = row.weight ?? 5
    form.status = row.status ?? 0
    mediaExisting.icon = row.iconUrl || ''
    mediaExisting.image = row.imageUrl || ''
    mediaExisting.video = row.videoUrl || ''
    mediaFiles.icon = null
    mediaFiles.image = null
    mediaFiles.video = null
    iconPreview.value = row.iconUrl || ''
    imagePreview.value = row.imageUrl || ''
    videoPreview.value = row.videoUrl || ''
}

function openAddDialog() {
    if (!canAdd) return
    dialogMode.value = 'add'
    resetForm()
    dialogVisible.value = true
}

function openEditDialog(row: GameDirectAdItem) {
    dialogMode.value = 'edit'
    editingId.value = Number(row.id)
    fillForm(row)
    dialogVisible.value = true
}

function openViewDialog(row: GameDirectAdItem) {
    dialogMode.value = 'view'
    editingId.value = Number(row.id)
    fillForm(row)
    dialogVisible.value = true
}

async function resolveUrl(key: MediaKey, dir: string) {
    if (mediaFiles[key]) return uploadByPut(mediaFiles[key]!, dir)
    return mediaExisting[key] || ''
}

async function saveDialog() {
    if (!formRef.value) return
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
    submitting.value = true
    try {
        const [iconUrl, imageUrl, videoUrl] = await Promise.all([
            resolveUrl('icon', 'game/direct-ad/icon'),
            resolveUrl('image', 'game/direct-ad/image'),
            resolveUrl('video', 'game/direct-ad/video'),
        ])
        const payload = {
            title: form.title.trim(),
            description: form.description.trim(),
            iconUrl,
            imageUrl,
            videoUrl,
            actionType: form.actionType,
            landingUrl: form.landingUrl.trim(),
            adType: form.adType,
            rewardCountdownSec: form.adType === 3 ? form.rewardCountdownSec : null,
            rewardClickEarly: form.adType === 3 ? form.rewardClickEarly : 0,
            weight: form.weight,
            status: form.status,
        }
        if (dialogMode.value === 'add') {
            await addGameDirectAd(payload)
            ElMessage.success('添加成功')
        } else if (editingId.value != null) {
            await updateGameDirectAd({ id: editingId.value, ...payload })
            ElMessage.success('保存成功')
        }
        dialogVisible.value = false
        loadList()
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message || '保存失败')
    } finally {
        submitting.value = false
    }
}

async function toggleStatus(row: GameDirectAdItem, status: number) {
    statusLoadingId.value = row.id
    try {
        await updateGameDirectAdStatus({ id: row.id, status })
        row.status = status
        ElMessage.success(status === 1 ? '已上线' : '已下线')
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message || '状态更新失败')
    } finally {
        statusLoadingId.value = null
    }
}

async function removeItem(id: number) {
    try {
        await ElMessageBox.confirm('确定删除该直客广告吗？', '提示', {
            type: 'warning',
            customClass: 'app-confirm-dialog',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
        })
        await deleteGameDirectAd(id)
        ElMessage.success('删除成功')
        loadList()
    } catch (e: any) {
        if (e === 'cancel') return
        ElMessage.error(e?.response?.data?.message || '删除失败')
    }
}

onMounted(() => {
    loadList()
})
</script>

<style scoped>
.game-direct-ad-page :deep(.page-content-body) {
    padding-top: 0;
}
:deep(.game-direct-ad-page.page-content) {
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
.toolbar-tip {
    color: #909399;
    font-size: 13px;
}
.thumb {
    width: 40px;
    height: 40px;
    border-radius: 8px;
}
.muted {
    color: #c0c4cc;
    font-size: 12px;
}
.op-cell {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: 2px;
}
.media-field {
    display: flex;
    align-items: flex-start;
    gap: 16px;
}
.media-preview-side {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
}
.media-preview {
    width: 80px;
    height: 80px;
    border-radius: 8px;
}
.media-preview.video {
    width: 160px;
    height: 90px;
    background: #000;
}
.ad-form :deep(.el-input),
.ad-form :deep(.el-textarea) {
    width: 100%;
}
</style>
