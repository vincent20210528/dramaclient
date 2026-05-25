<template>
    <div class="panel-wrap panel-register-wrap">
        <div class="filter-card">
            <el-form :model="searchForm" inline class="search-form">
                <el-form-item>
                    <el-select
                        v-model="searchForm.languageCode"
                        class="filter-select"
                        placeholder="请选择字幕语言"
                        clearable
                        filterable
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
                        class="filter-input"
                        placeholder="请输入标签名称"
                        clearable
                        @keyup.enter="handleSearch"
                    />
                </el-form-item>
                <el-form-item class="search-form__actions">
                    <el-button class="btn-query" type="primary" @click="handleSearch">查询</el-button>
                    <el-button class="btn-reset" @click="handleReset">重置</el-button>
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
            :data="tagList"
            v-loading="loading"
            style="width: 100%"
            :scrollbar-always-on="true"
        >
            <el-table-column type="index" label="序号" width="88" min-width="88" align="center" />
            <el-table-column prop="tagCode" label="标签编码" min-width="160" show-overflow-tooltip />
            <el-table-column prop="languageCode" label="字幕语言" width="100" />
            <el-table-column prop="tagName" label="中文标签名" min-width="120" show-overflow-tooltip />
            <el-table-column prop="tagNameLanguage" label="国际化标签名" min-width="140" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="创建时间" width="200" show-overflow-tooltip />
            <el-table-column prop="updatedAt" label="更新时间" width="200" show-overflow-tooltip />
            <el-table-column v-if="canEditTag || canDeleteTag" label="操作" width="200" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button v-if="canEditTag" type="primary" link :icon="Edit" @click.stop="openEditDialog(row)">编辑</el-button>
                    <el-button
                        v-if="canDeleteTag"
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

        <el-dialog
            v-model="dialogVisible"
            :title="dialogTitle"
            width="760px"
            align-center
            destroy-on-close
            class="menu-add-dialog"
            @close="resetForm"
        >
            <el-form ref="formRef" :model="form" :rules="formRules" label-position="right" label-width="110px" class="add-form-menu">
                <el-form-item v-if="editingId != null" label="标签编码">
                    <el-input v-model="form.tagCode" disabled />
                </el-form-item>
                <el-form-item label="字幕语言" prop="languageCode">
                    <el-select
                        v-model="form.languageCode"
                        placeholder="请选择字幕语言"
                        clearable
                        filterable
                        :loading="languageOptionsLoading"
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
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { hasPerm, PERM_DRAMA_TAG } from '@/utils/permission'
import { Refresh, Delete, Edit } from '@element-plus/icons-vue'
import '../panelRegisterList.css'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { addTagInfo, deleteTagInfo, getSupportLanguagePage, getTagInfoPage, updateTagInfo } from '@/api'

const canAddTag = computed(() => hasPerm(PERM_DRAMA_TAG.add))
const canEditTag = computed(() => hasPerm(PERM_DRAMA_TAG.edit))
const canDeleteTag = computed(() => hasPerm(PERM_DRAMA_TAG.delete))

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
const dialogTitle = ref('新增')
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const submitting = ref(false)
const deletingId = ref<number | null>(null)

const languageOptions = ref<{ languageCode: string; languageName: string }[]>([])
const languageOptionsLoading = ref(false)
const emit = defineEmits<{ (e: 'count-change', count: number): void }>()

const form = reactive({
    tagCode: '',
    languageCode: '',
    tagNameLanguage: '',
    tagName: '',
})

const formRules: FormRules = {
    languageCode: [{ required: true, message: '请选择字幕语言', trigger: 'change' }],
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
        if (body?.code !== 200) throw new Error(body?.message || '加载失败')
        const data = body?.data
        tagList.value = data?.records ?? []
        total.value = Number(data?.total ?? 0)
    } catch (e: any) {
        tagList.value = []
        total.value = 0
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '加载失败')
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
    dialogTitle.value = '新增'
    editingId.value = null
    form.tagCode = ''
    form.languageCode = ''
    form.tagNameLanguage = ''
    form.tagName = ''
    dialogVisible.value = true
    if (languageOptions.value.length === 0) loadLanguageOptions()
}
function openEditDialog(row: any) {
    dialogTitle.value = '编辑情节标签'
    editingId.value = Number(row.id)
    form.tagCode = String(row.tagCode ?? '')
    form.languageCode = String(row.languageCode ?? '')
    form.tagNameLanguage = String(row.tagNameLanguage ?? '')
    form.tagName = String(row.tagName ?? '')
    dialogVisible.value = true
    if (languageOptions.value.length === 0) loadLanguageOptions()
}
function resetForm() {
    dialogTitle.value = '新增'
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
        submitting.value = true
        try {
            if (editingId.value != null) {
                const res: any = await updateTagInfo({
                    id: editingId.value,
                    tagCode: form.tagCode,
                    languageCode: form.languageCode,
                    tagNameLanguage: form.tagNameLanguage.trim(),
                    tagName: form.tagName.trim(),
                })
                const body = res?.data ?? res
                if (body?.code !== 200) throw new Error(body?.message || '保存失败')
                ElMessage.success('保存成功')
            } else {
                const res: any = await addTagInfo({
                    languageCode: form.languageCode,
                    tagNameLanguage: form.tagNameLanguage.trim(),
                    tagName: form.tagName.trim(),
                })
                const body = res?.data ?? res
                if (body?.code !== 200) throw new Error(body?.message || '添加失败')
                ElMessage.success('添加成功')
            }
            dialogVisible.value = false
            loadList()
        } catch (e: any) {
            ElMessage.error(e?.response?.data?.message ?? e?.message ?? '操作失败')
        } finally {
            submitting.value = false
        }
    })
}

async function handleDelete(row: any) {
    if (deletingId.value != null) return
    try {
        await ElMessageBox.confirm('确定要删除该标签吗？', '提示', {
            type: 'warning',
            customClass: 'app-confirm-dialog',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showClose: true,
        })
        deletingId.value = Number(row.id)
        const res: any = await deleteTagInfo(Number(row.id))
        const body = res?.data ?? res
        if (body?.code !== 200) throw new Error(body?.message || '删除失败')
        ElMessage.success('删除成功')
        if (tagList.value.length === 1 && currentPage.value > 1) currentPage.value -= 1
        loadList()
    } catch (e: any) {
        if (e === 'cancel') return
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '删除失败')
    } finally {
        deletingId.value = null
    }
}

onMounted(async () => {
    await Promise.all([loadLanguageOptions(), loadList()])
})

watch(
    () => total.value,
    (count) => {
        emit('count-change', Number(count || 0))
    },
    { immediate: true }
)

defineExpose({
    openAddDialog,
})
</script>

<style scoped>
.panel-wrap { width: 100%; }
</style>

