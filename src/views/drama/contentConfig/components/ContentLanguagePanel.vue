<template>
    <div class="panel-wrap panel-register-wrap">
        <div class="filter-card">
            <el-form inline class="search-form">
                <el-form-item>
                    <el-input
                        v-model="keyword"
                        class="filter-input"
                        placeholder="按语言名称和代码搜索"
                        clearable
                        @clear="handleSearch"
                        @keyup.enter="handleSearch"
                    />
                </el-form-item>
                <el-form-item class="search-form__actions">
                    <el-button class="btn-query" type="primary" @click="handleSearch">查询</el-button>
                    <el-button class="btn-reset" @click="handleReset">重置</el-button>
                </el-form-item>
                <el-form-item v-if="props.showAddButton && canAddLang" class="search-form__add">
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
            <el-table-column type="index" label="序号" width="100" align="center" />
            <el-table-column prop="languageCode" label="语言代码" width="200" show-overflow-tooltip />
            <el-table-column prop="languageName" label="语言名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="创建时间" width="200" show-overflow-tooltip />
            <el-table-column prop="updatedAt" label="更新时间" width="200" show-overflow-tooltip />
            <el-table-column v-if="canEditLang || canDeleteLang" label="操作" width="200" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button
                        v-if="canEditLang"
                        type="primary"
                        link
                        :icon="Edit"
                        @click="openEditDialog(row)"
                    >
                        编辑
                    </el-button>
                    <el-button
                        v-if="canDeleteLang"
                        type="danger"
                        link
                        :icon="Delete"
                        @click="removeItem(Number(row.id))"
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
            :title="dialogMode === 'add' ? '新增' : '编辑内容语言'"
            width="760px"
            align-center
            destroy-on-close
            class="menu-add-dialog"
        >
            <el-form label-position="right" label-width="110px" class="add-form-menu">
                <el-form-item label="语言代码" required>
                    <el-input v-model="form.languageCode" placeholder="请输入语言代码，如 zh-CN、en-US" clearable :disabled="dialogMode === 'edit'" />
                </el-form-item>
                <el-form-item label="语言名称" required>
                    <el-input v-model="form.languageName" placeholder="请输入语言名称（中文名称）" clearable />
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
import { addSupportLanguage, deleteSupportLanguage, getSupportLanguagePage, updateSupportLanguage } from '@/api'
import { hasPerm, PERM_DRAMA_LANGUAGE } from '@/utils/permission'

type LanguageItem = { id: number; languageCode: string; languageName: string; createdAt?: string; updatedAt?: string }
const emit = defineEmits<{ (e: 'count-change', count: number): void }>()

const props = withDefaults(
    defineProps<{
        showAddButton?: boolean
        addButtonText?: string
    }>(),
    {
        showAddButton: false,
        addButtonText: '添加语言',
    },
)

const keyword = ref('')
const tableData = ref<LanguageItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const dialogVisible = ref(false)
const submitting = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingId = ref<number | null>(null)
const form = reactive({ languageCode: '', languageName: '' })

const canAddLang = hasPerm(PERM_DRAMA_LANGUAGE.add)
const canEditLang = hasPerm(PERM_DRAMA_LANGUAGE.edit)
const canDeleteLang = hasPerm(PERM_DRAMA_LANGUAGE.delete)

async function loadList() {
    loading.value = true
    try {
        const res: any = await getSupportLanguagePage({
            current: currentPage.value,
            size: pageSize.value,
            param: keyword.value?.trim() || undefined,
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
function handleSearch() { currentPage.value = 1; loadList() }
function handleReset() { keyword.value = ''; currentPage.value = 1; loadList() }
function handleSizeChange() { currentPage.value = 1; loadList() }
function handleCurrentChange() { loadList() }

function openAddDialog() {
    if (!canAddLang) return
    dialogMode.value = 'add'
    editingId.value = null
    form.languageCode = ''
    form.languageName = ''
    dialogVisible.value = true
}
function openEditDialog(row: LanguageItem) {
    dialogMode.value = 'edit'
    editingId.value = Number(row.id)
    form.languageCode = row.languageCode || ''
    form.languageName = row.languageName || ''
    dialogVisible.value = true
}
async function saveDialog() {
    const languageCode = form.languageCode.trim()
    const languageName = form.languageName.trim()
    if (!languageCode) return ElMessage.warning('请输入语言代码')
    if (!languageName) return ElMessage.warning('请输入语言名称')
    submitting.value = true
    try {
        if (dialogMode.value === 'add') {
            await addSupportLanguage({ languageCode, languageName })
            ElMessage.success('添加成功')
        } else {
            if (editingId.value == null) return
            await updateSupportLanguage({ id: editingId.value, languageName })
            ElMessage.success('修改成功')
        }
        dialogVisible.value = false
        loadList()
    } catch {
        ElMessage.error('操作失败')
    } finally {
        submitting.value = false
    }
}
async function removeItem(id: number) {
    try {
        await ElMessageBox.confirm('确定要删除该语言吗？', '提示', {
            type: 'warning',
            customClass: 'app-confirm-dialog',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showClose: true,
        })
        await deleteSupportLanguage(id)
        ElMessage.success('删除成功')
        loadList()
    } catch (e: any) {
        if (e === 'cancel') return
        const msg = e?.response?.data?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '删除失败')
    }
}

onMounted(loadList)
watch(() => total.value, (count) => emit('count-change', Number(count || 0)), { immediate: true })
defineExpose({ openAddDialog })
</script>

<style scoped>
.panel-wrap { width: 100%; }
</style>

