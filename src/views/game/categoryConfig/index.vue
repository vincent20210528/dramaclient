<template>
    <page-content class="game-category-page" :title="title">
        <template #bottom>
            <el-card class="list-card" shadow="never">
                <div class="panel-wrap panel-register-wrap">
                    <div class="filter-card">
                        <el-form inline class="search-form">
                            <el-form-item>
                                <el-input
                                    v-model="keyword"
                                    class="filter-input"
                                    placeholder="按分类名称搜索"
                                    clearable
                                    @clear="handleSearch"
                                    @keyup.enter="handleSearch"
                                />
                            </el-form-item>
                            <el-form-item class="search-form__actions">
                                <el-button class="btn-query" type="primary" @click="handleSearch">查询</el-button>
                                <el-button class="btn-reset" @click="handleReset">重置</el-button>
                            </el-form-item>
                            <el-form-item v-if="canAdd" class="search-form__add">
                                <el-button class="btn-add-app" type="primary" :icon="Plus" @click="openAddDialog">
                                    添加分类
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
                        class="register-table"
                        :data="tableData"
                        v-loading="loading"
                        style="width: 100%"
                    >
                        <el-table-column type="index" label="序号" width="80" align="center" :index="indexMethod" />
                        <el-table-column prop="categoryCode" label="分类编码" min-width="150" align="center" show-overflow-tooltip />
                        <el-table-column prop="categoryName" label="分类名称" min-width="180" align="center" show-overflow-tooltip />
                        <el-table-column label="分类图片" width="120" align="center">
                            <template #default="{ row }">
                                <el-image
                                    v-if="row.imageUrl"
                                    :src="row.imageUrl"
                                    :preview-src-list="[row.imageUrl]"
                                    fit="cover"
                                    class="category-image"
                                    preview-teleported
                                />
                                <span v-else class="category-image-empty">—</span>
                            </template>
                        </el-table-column>
                        <el-table-column v-if="canEdit || canDelete" label="操作" width="200" align="center" fixed="right">
                            <template #default="{ row }">
                                <div class="op-cell">
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
                :title="dialogMode === 'add' ? '添加分类' : '编辑分类'"
                width="560px"
                align-center
                destroy-on-close
                class="menu-add-dialog"
                @close="resetForm"
            >
                <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px" class="category-form">
                    <el-form-item label="分类名称" prop="categoryName">
                        <el-input v-model="form.categoryName" placeholder="请输入分类名称" clearable />
                    </el-form-item>
                    <el-form-item label="分类图片">
                        <div class="image-field">
                            <el-upload
                                ref="imageUploadRef"
                                v-model:file-list="imageFileList"
                                :auto-upload="false"
                                :show-file-list="false"
                                :limit="1"
                                accept=".png,.jpg,.jpeg,.webp,.gif,.bmp"
                                :before-upload="beforeImageUpload"
                                :on-change="onImageChange"
                                :on-remove="onImageRemove"
                                :on-exceed="onImageExceed"
                            >
                                <el-button type="primary">选择图片</el-button>
                            </el-upload>
                            <div class="image-preview-side">
                                <template v-if="imagePreviewUrl">
                                    <el-image
                                        :src="imagePreviewUrl"
                                        fit="cover"
                                        class="image-preview"
                                        :preview-src-list="[imagePreviewUrl]"
                                        preview-teleported
                                    />
                                    <el-button type="danger" size="small" link @click="onImageRemove">移除</el-button>
                                </template>
                            </div>
                        </div>
                    </el-form-item>
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue'
import '@/views/drama/contentConfig/panelRegisterList.css'
import {
    addGameCategory,
    deleteGameCategory,
    getGameCategoryPage,
    updateGameCategory,
    type GameCategoryItem,
} from '@/api/game'
import { hasPerm, PERM_GAME_CAT } from '@/utils/permission'
import { uploadByPut } from '@/utils/obsUpload'

const title = {
    firstTitle: '游戏分类配置',
    secondTitle: '管理休闲游戏分类，支持按名称搜索',
}

const keyword = ref('')
const tableData = ref<GameCategoryItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const dialogVisible = ref(false)
const submitting = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
    categoryName: '',
})

const formRules: FormRules = {
    categoryName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

const canAdd = hasPerm(PERM_GAME_CAT.add)
const canEdit = hasPerm(PERM_GAME_CAT.edit)
const canDelete = hasPerm(PERM_GAME_CAT.delete)

const imageUploadRef = ref<{ clearFiles?: () => void } | null>(null)
const imageFileList = ref<UploadFile[]>([])
const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref('')
const existingImageUrl = ref('')

function indexMethod(index: number) {
    return (currentPage.value - 1) * pageSize.value + index + 1
}

function isAllowedImage(file: File) {
    return /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)
}

function beforeImageUpload(file: File) {
    if (!isAllowedImage(file)) {
        ElMessage.error('请选择图片文件（png/jpg/jpeg/webp/gif/bmp）')
        return false
    }
    return true
}

function revokeImagePreview() {
    if (imagePreviewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = ''
}

function onImageChange(file: UploadFile) {
    const raw = file?.raw
    if (!raw) return
    if (!beforeImageUpload(raw)) {
        onImageRemove()
        return
    }
    imageFile.value = raw
    revokeImagePreview()
    imagePreviewUrl.value = URL.createObjectURL(raw)
}

function onImageRemove() {
    imageFile.value = null
    imageFileList.value = []
    revokeImagePreview()
    if (dialogMode.value === 'edit' && existingImageUrl.value) {
        existingImageUrl.value = ''
    }
    imageUploadRef.value?.clearFiles?.()
}

function onImageExceed() {
    ElMessage.warning('仅支持上传一张图片，请先移除当前图片')
}

async function loadList() {
    loading.value = true
    try {
        const res: any = await getGameCategoryPage({
            current: currentPage.value,
            size: pageSize.value,
            categoryName: keyword.value?.trim() ?? '',
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
    keyword.value = ''
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

function resetForm() {
    form.categoryName = ''
    editingId.value = null
    existingImageUrl.value = ''
    onImageRemove()
    formRef.value?.resetFields()
}

function openAddDialog() {
    if (!canAdd) return
    dialogMode.value = 'add'
    resetForm()
    dialogVisible.value = true
}

function openEditDialog(row: GameCategoryItem) {
    dialogMode.value = 'edit'
    editingId.value = Number(row.id)
    form.categoryName = row.categoryName || ''
    existingImageUrl.value = row.imageUrl || ''
    imageFile.value = null
    imageFileList.value = []
    revokeImagePreview()
    if (row.imageUrl) {
        imagePreviewUrl.value = row.imageUrl
    }
    dialogVisible.value = true
}

async function resolveImageUrl(): Promise<string> {
    if (imageFile.value) {
        return uploadByPut(imageFile.value, 'game/category')
    }
    return existingImageUrl.value
}

async function saveDialog() {
    if (!formRef.value) return
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
        const categoryName = form.categoryName.trim()
        const imageUrl = await resolveImageUrl()

        if (dialogMode.value === 'add') {
            await addGameCategory({
                categoryName,
                ...(imageUrl && { imageUrl }),
            })
            ElMessage.success('添加成功')
        } else {
            if (editingId.value == null) return
            await updateGameCategory({
                id: editingId.value,
                categoryName,
                imageUrl,
            })
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
        await ElMessageBox.confirm('确定要删除该分类吗？', '提示', {
            type: 'warning',
            customClass: 'app-confirm-dialog',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showClose: true,
        })
        await deleteGameCategory(id)
        ElMessage.success('删除成功')
        loadList()
    } catch (e: any) {
        if (e === 'cancel') return
        const msg = e?.response?.data?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '删除失败')
    }
}

onMounted(() => {
    loadList()
})
</script>

<style scoped>
.game-category-page :deep(.page-content-body) {
    padding-top: 0;
}
:deep(.game-category-page.page-content) {
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

.category-image {
    width: 48px;
    height: 48px;
    border-radius: 8px;
}

.category-image-empty {
    color: #c0c4cc;
    font-size: 12px;
}

.image-field {
    display: flex;
    align-items: flex-start;
    gap: 16px;
}

.image-preview-side {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
}

.image-preview {
    width: 80px;
    height: 80px;
    border-radius: 8px;
}

.category-form :deep(.el-input) {
    width: 100%;
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
</style>
