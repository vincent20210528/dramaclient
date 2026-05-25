<template>
    <page-content :title="title">
        <template #bottom>
            <el-card class="search-card" shadow="never">
                <el-form :model="searchForm" inline class="search-form">
                    <el-form-item>
                        <el-select
                            v-model="searchForm.languageCode"
                            placeholder="请选择字幕语言"
                            clearable
                            filterable
                            style="width: 220px"
                            :loading="languageOptionsLoading"
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
                        <el-input
                            v-model="searchForm.tagName"
                            placeholder="请输入标签名称"
                            clearable
                            style="width: 240px"
                            @keyup.enter="handleSearch"
                        />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
                        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
                    </el-form-item>
                    <el-form-item class="add-btn-wrap">
                        <el-button type="warning" :icon="Plus" @click="openAddDialog">添加标签</el-button>
                    </el-form-item>
                </el-form>
            </el-card>

            <el-card class="table-card" shadow="never">
                <div class="table-toolbar">
                    <span class="table-title">情节标签列表</span>
                    <span class="toolbar-actions">
                        <el-icon class="toolbar-icon" @click="loadList"><Refresh /></el-icon>
                    </span>
                </div>

                <el-table
                    :data="tagList"
                    v-loading="loading"
                    size="small"
                    stripe
                    border
                    style="width: 100%"
                    :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
                    :scrollbar-always-on="true"
                >
                    <el-table-column type="index" label="序号" width="60" align="center" />
                    <el-table-column prop="languageCode" label="语言" width="100" />
                    <el-table-column prop="tagNameLanguage" label="国际化标签名" min-width="140" show-overflow-tooltip />
                    <el-table-column prop="tagName" label="中文标签名" min-width="120" show-overflow-tooltip />
                    <el-table-column prop="createdAt" label="创建时间" width="160" show-overflow-tooltip />
                    <el-table-column prop="updatedAt" label="更新时间" width="160" show-overflow-tooltip />
                    <el-table-column label="操作" width="130" align="center" fixed="right">
                        <template #default="{ row }">
                            <el-button type="primary" link :icon="Edit" @click.stop="openEditDialog(row)">编辑</el-button>
                            <el-button
                                type="danger"
                                link
                                :icon="Delete"
                                :loading="deletingId != null && deletingId === Number(row.id)"
                                @click.stop="handleDelete(row)"
                            >
                                删除
                            </el-button>
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
            </el-card>

            <FormDialog
                v-model="dialogVisible"
                :title="dialogTitle"
                width="500px"
                :loading="submitting"
                @close="resetForm"
                @confirm="handleSubmit"
            >
                <el-form ref="formRef" :model="form" :rules="formRules" label-width="120px">
                    <el-form-item v-if="editingId != null" label="标签编码">
                        <el-input v-model="form.tagCode" disabled />
                    </el-form-item>
                    <el-form-item label="语言" prop="languageCode">
                        <el-select
                            v-model="form.languageCode"
                            placeholder="请选择语言"
                            clearable
                            filterable
                            :loading="languageOptionsLoading"
                            style="width: 100%"
                        >
                            <el-option
                                v-for="item in languageOptions"
                                :key="item.languageCode"
                                :label="`${item.languageName} (${item.languageCode})`"
                                :value="item.languageCode"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="中文标签名" prop="tagName">
                        <el-input v-model="form.tagName" placeholder="请输入中文标签名" clearable />
                    </el-form-item>
                    <el-form-item label="国际化标签名" prop="tagNameLanguage">
                        <el-input v-model="form.tagNameLanguage" placeholder="请输入国际化标签名" clearable />
                    </el-form-item>
                </el-form>
            </FormDialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { hasPerm, PERM_DRAMA_CAT } from '@/utils/permission'
import { Search, Refresh, Plus, Delete, Edit } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import FormDialog from '@/components/FormDialog.vue'
import {
    addTagInfo,
    deleteTagInfo,
    getSupportLanguagePage,
    getTagInfoPage,
    updateTagInfo,
} from '@/api'

const title = {
    firstTitle: '情节标签',
    secondTitle: '管理短剧情节标签，支持多国际化标签名',
}

const canAddTag = computed(() => hasPerm(PERM_DRAMA_CAT.add))
const canEditTag = computed(() => hasPerm(PERM_DRAMA_CAT.edit))
const canDeleteTag = computed(() => hasPerm(PERM_DRAMA_CAT.delete))

const searchForm = reactive<{ languageCode: string; tagName: string }>({
    languageCode: '',
    tagName: '',
})
const tagList = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const dialogTitle = ref('添加标签')
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const submitting = ref(false)
const deletingId = ref<number | null>(null)

const languageOptions = ref<{ languageCode: string; languageName: string }[]>([])
const languageOptionsLoading = ref(false)

const form = reactive({
    tagCode: '',
    languageCode: '',
    tagNameLanguage: '',
    tagName: '',
})

const formRules: FormRules = {
    languageCode: [{ required: true, message: '请选择语言', trigger: 'change' }],
    tagNameLanguage: [{ required: true, message: '请输入国际化标签名', trigger: 'blur' }],
    tagName: [{ required: true, message: '请输入中文标签名', trigger: 'blur' }],
}

async function loadList() {
    loading.value = true
    try {
        const res: any = await getTagInfoPage({
            current: currentPage.value,
            size: pageSize.value,
            languageCode: searchForm.languageCode?.trim() ?? '',
            tagName: searchForm.tagName?.trim() ?? '',
        })
        const body = res?.data ?? res
        if (body?.code !== 200) {
            throw new Error(body?.message || '加载失败')
        }
        const data = body?.data
        if (data?.records) {
            tagList.value = data.records
            total.value = Number(data.total ?? 0)
        } else {
            tagList.value = []
            total.value = 0
        }
    } catch (e: any) {
        tagList.value = []
        total.value = 0
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '加载失败')
    } finally {
        loading.value = false
    }
}

async function loadLanguageOptions() {
    if (languageOptionsLoading.value) return
    languageOptionsLoading.value = true
    try {
        const res: any = await getSupportLanguagePage({ current: 1, size: 500 })
        const data = res?.data?.data ?? res?.data
        languageOptions.value = data?.records ?? []
    } catch {
        languageOptions.value = []
    } finally {
        languageOptionsLoading.value = false
    }
}

function handleSearch() {
    currentPage.value = 1
    loadList()
}

function handleReset() {
    searchForm.languageCode = ''
    searchForm.tagName = ''
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

function openAddDialog() {
    if (!canAddTag.value) return
    dialogTitle.value = '添加标签'
    editingId.value = null
    form.tagCode = ''
    form.languageCode = ''
    form.tagNameLanguage = ''
    form.tagName = ''
    dialogVisible.value = true
    if (languageOptions.value.length === 0) loadLanguageOptions()
}

function openEditDialog(row: any) {
    if (!canEditTag.value) return
    dialogTitle.value = '编辑标签'
    editingId.value = Number(row.id)
    form.tagCode = String(row.tagCode ?? '')
    form.languageCode = String(row.languageCode ?? '')
    form.tagNameLanguage = String(row.tagNameLanguage ?? '')
    form.tagName = String(row.tagName ?? '')
    dialogVisible.value = true
    if (languageOptions.value.length === 0) loadLanguageOptions()
}

function resetForm() {
    dialogTitle.value = '添加标签'
    editingId.value = null
    form.tagCode = ''
    form.languageCode = ''
    form.tagNameLanguage = ''
    form.tagName = ''
    formRef.value?.resetFields()
}

async function handleSubmit() {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
        if (!valid) return
        const id = editingId.value
        submitting.value = true
        try {
            if (id != null) {
                const res: any = await updateTagInfo({
                    id,
                    tagCode: form.tagCode,
                    languageCode: form.languageCode,
                    tagNameLanguage: form.tagNameLanguage.trim(),
                    tagName: form.tagName.trim(),
                })
                const body = res?.data ?? res
                if (body?.code !== 200) {
                    throw new Error(body?.message || '保存失败')
                }
                ElMessage.success('保存成功')
            } else {
                const res: any = await addTagInfo({
                    languageCode: form.languageCode,
                    tagNameLanguage: form.tagNameLanguage.trim(),
                    tagName: form.tagName.trim(),
                })
                const body = res?.data ?? res
                if (body?.code !== 200) {
                    throw new Error(body?.message || '添加失败')
                }
                ElMessage.success('添加成功')
            }
            dialogVisible.value = false
            loadList()
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? e?.message
            ElMessage.error(msg && typeof msg === 'string' ? msg : (id != null ? '保存失败' : '添加失败'))
        } finally {
            submitting.value = false
        }
    })
}

async function handleDelete(row: any) {
    if (!canDeleteTag.value || deletingId.value != null) return
    const id = Number(row.id)
    try {
        await ElMessageBox.confirm('确定要删除该标签吗？', '提示', { type: 'warning' })
        deletingId.value = id
        const res: any = await deleteTagInfo(id)
        const body = res?.data ?? res
        if (body?.code !== 200) {
            throw new Error(body?.message || '删除失败')
        }
        ElMessage.success('删除成功')
        if (tagList.value.length === 1 && currentPage.value > 1) currentPage.value -= 1
        loadList()
    } catch (e: any) {
        if (e === 'cancel') return
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '删除失败')
    } finally {
        deletingId.value = null
    }
}

onMounted(async () => {
    await Promise.all([loadLanguageOptions(), loadList()])
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
.add-btn-wrap {
    margin-left: auto;
}
.table-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}
.table-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}
.toolbar-actions {
    display: inline-flex;
    align-items: center;
}
.toolbar-icon {
    cursor: pointer;
    font-size: 16px;
    color: #606266;
}
.toolbar-icon:hover {
    color: #409eff;
}
</style>
