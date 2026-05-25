<template>
    <div class="panel-wrap panel-register-wrap">
        <div class="filter-card">
            <el-form inline class="search-form">
                <el-form-item>
                    <el-select
                        v-model="searchLanguageCode"
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
                        v-model="keyword"
                        class="filter-input"
                        placeholder="按名称搜索"
                        clearable
                        @clear="handleSearch"
                        @keyup.enter="handleSearch"
                    />
                </el-form-item>
                <el-form-item class="search-form__actions">
                    <el-button class="btn-query" type="primary" @click="handleSearch">查询</el-button>
                    <el-button class="btn-reset" @click="handleReset">重置</el-button>
                </el-form-item>
                <el-form-item v-if="props.showAddButton && canAddCat" class="search-form__add">
                    <el-button class="btn-add-app" type="primary" :icon="Plus" @click="openAddDialog">
                        {{ props.addButtonText }}
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
            :scrollbar-always-on="true"
        >
            <el-table-column type="index" label="序号" width="88" min-width="88" align="center" />
            <el-table-column prop="categoryCode" label="分类编码" min-width="150" show-overflow-tooltip />
            <el-table-column prop="languageCode" label="字幕语言" width="150" show-overflow-tooltip />
            <el-table-column prop="categoryName" label="中文分类名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="categoryNameLanguage" label="国际化分类名" min-width="200" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="创建时间" width="200" align="center" />
            <el-table-column v-if="canEditCat || canDeleteCat" label="操作" width="200" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button v-if="canEditCat" type="primary" link :icon="Edit" @click="openEditDialog(row)">
                        编辑
                    </el-button>
                    <el-button v-if="canDeleteCat" type="danger" link :icon="Delete" @click="removeItem(Number(row.id))">
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
            :title="dialogMode === 'add' ? '新增' : '编辑类型标签'"
            width="760px"
            align-center
            destroy-on-close
            class="menu-add-dialog"
            @close="resetForm"
        >
            <el-form label-position="right" label-width="110px" class="add-form-menu">
                <el-form-item label="字幕语言" required>
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
                <el-form-item label="中文分类名称" required>
                    <el-input v-model="form.categoryName" placeholder="请输入中文分类名称" clearable />
                </el-form-item>
                <el-form-item label="国际化分类名" required>
                    <el-input v-model="form.categoryNameLanguage" placeholder="请输入国际化分类名" clearable />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="submitting" @click="saveDialog">保存</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue'
import '../panelRegisterList.css'
import { addCategoryInfo, deleteCategoryInfo, getCategoryInfoPage, getSupportLanguagePage, updateCategoryInfo } from '@/api'
import { hasPerm, PERM_DRAMA_CAT } from '@/utils/permission'

type CategoryItem = {
    id: number
    categoryCode?: string
    languageCode: string
    categoryName: string
    categoryNameLanguage?: string
    createdAt?: string
}

const emit = defineEmits<{ (e: 'count-change', count: number): void }>()

const props = withDefaults(
    defineProps<{
        showAddButton?: boolean
        addButtonText?: string
    }>(),
    {
        showAddButton: false,
        addButtonText: '添加类型标签',
    },
)

const keyword = ref('')
const searchLanguageCode = ref('')
const tableData = ref<CategoryItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const languageOptions = ref<{ languageCode: string; languageName: string }[]>([])
const languageOptionsLoading = ref(false)

const dialogVisible = ref(false)
const submitting = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingId = ref<number | null>(null)
const form = reactive({
    languageCode: '',
    categoryName: '',
    categoryNameLanguage: '',
})

const canAddCat = hasPerm(PERM_DRAMA_CAT.add)
const canEditCat = hasPerm(PERM_DRAMA_CAT.edit)
const canDeleteCat = hasPerm(PERM_DRAMA_CAT.delete)

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

async function loadList() {
    loading.value = true
    try {
        const res: any = await getCategoryInfoPage({
            current: currentPage.value,
            size: pageSize.value,
            languageCode: searchLanguageCode.value?.trim() ?? '',
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
    searchLanguageCode.value = ''
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
    form.languageCode = ''
    form.categoryName = ''
    form.categoryNameLanguage = ''
}

function openAddDialog() {
    if (!canAddCat) return
    dialogMode.value = 'add'
    editingId.value = null
    resetForm()
    dialogVisible.value = true
}

function openEditDialog(row: CategoryItem) {
    dialogMode.value = 'edit'
    editingId.value = Number(row.id)
    form.languageCode = row.languageCode || ''
    form.categoryName = row.categoryName || ''
    form.categoryNameLanguage = row.categoryNameLanguage || ''
    dialogVisible.value = true
}

async function saveDialog() {
    const languageCode = form.languageCode.trim()
    const categoryName = form.categoryName.trim()
    const categoryNameLanguage = form.categoryNameLanguage.trim()
    if (!languageCode) return ElMessage.warning('请选择字幕语言')
    if (!categoryName) return ElMessage.warning('请输入中文分类名称')
    if (!categoryNameLanguage) return ElMessage.warning('请输入国际化分类名')

    submitting.value = true
    try {
        if (dialogMode.value === 'add') {
            await addCategoryInfo({ languageCode, categoryName, categoryNameLanguage })
            ElMessage.success('添加成功')
        } else {
            if (editingId.value == null) return
            await updateCategoryInfo({ id: editingId.value, languageCode, categoryName, categoryNameLanguage })
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
        await deleteCategoryInfo(id)
        ElMessage.success('删除成功')
        loadList()
    } catch (e: any) {
        if (e === 'cancel') return
        const msg = e?.response?.data?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '删除失败')
    }
}

onMounted(async () => {
    await Promise.all([loadLanguageOptions(), loadList()])
})

watch(
    () => total.value,
    (count) => emit('count-change', Number(count || 0)),
    { immediate: true }
)

defineExpose({ openAddDialog })
</script>

<style scoped>
.panel-wrap { width: 100%; }
.panel-search { margin-bottom: 10px; }
.panel-add-btn { margin-left: auto; }
</style>

