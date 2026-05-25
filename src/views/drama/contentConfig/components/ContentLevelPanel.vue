<template>
    <div class="panel-wrap panel-register-wrap">
        <div class="filter-card">
            <el-form inline class="search-form">
                <el-form-item>
                    <el-input
                        v-model="keyword"
                        class="filter-input"
                        placeholder="搜索等级名/编码"
                        clearable
                        @clear="handleSearch"
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
            :data="filteredList"
            v-loading="loading"
            style="width: 100%"
            :scrollbar-always-on="true"
        >
            <el-table-column type="index" label="序号" width="88" min-width="88" align="center" />
            <el-table-column prop="ratingName" label="等级名称" min-width="140" show-overflow-tooltip>
                <template #default="{ row }">
                    <span class="level-tag">{{ row.ratingName }}</span>
                </template>
            </el-table-column>
            <el-table-column prop="ratingCode" label="等级编码" width="120" align="center" />
            <el-table-column prop="ratingValue" label="等级值" width="120" align="center" />
            <el-table-column prop="createdAt" label="创建时间" width="170" align="center" />
            <el-table-column prop="updatedAt" label="更新时间" width="170" align="center" />
            <el-table-column v-if="canEdit || canDelete" label="操作" width="250" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button v-if="canEdit" type="primary" link :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
                    <el-button v-if="canDelete" type="danger" link :icon="Delete" @click="removeItem(row.id)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-dialog
            v-model="dialogVisible"
            :title="dialogMode === 'add' ? '新增' : '编辑内容等级'"
            width="760px"
            align-center
            destroy-on-close
            class="menu-add-dialog"
        >
            <el-form ref="formRef" :model="form" :rules="formRules" label-position="right" label-width="110px" class="add-form-menu">
                <el-form-item label="等级名称" prop="ratingName">
                    <el-input v-model="form.ratingName" placeholder="请输入等级名称" maxlength="30" show-word-limit />
                </el-form-item>
                <el-form-item label="等级编码" prop="ratingCode">
                    <el-input v-model="form.ratingCode" placeholder="请输入等级编码" maxlength="10" />
                </el-form-item>
                <el-form-item label="等级值" prop="ratingValue">
                    <el-input-number v-model="form.ratingValue" :min="0" :step="1" style="width: 100%" />
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Delete, Edit, Refresh } from '@element-plus/icons-vue'
import '../panelRegisterList.css'
import { hasPerm, PERM_CONTENT_RATING } from '@/utils/permission'
import {
    addContentRating,
    deleteContentRating,
    getContentRatingList,
    updateContentRating,
} from '@/api'

type LevelItem = {
    id: number
    ratingName: string
    ratingCode: string
    ratingValue: number
    createdAt?: string
    updatedAt?: string
}
const emit = defineEmits<{ (e: 'count-change', count: number): void }>()

const keyword = ref('')
const queryKeyword = ref('')
const list = ref<LevelItem[]>([])
const loading = ref(false)
const canList = computed(() => hasPerm(PERM_CONTENT_RATING.list))
const canAdd = computed(() => hasPerm(PERM_CONTENT_RATING.add))
const canEdit = computed(() => hasPerm(PERM_CONTENT_RATING.edit))
const canDelete = computed(() => hasPerm(PERM_CONTENT_RATING.delete))

const filteredList = computed(() => {
    const k = queryKeyword.value.trim().toLowerCase()
    if (!k) return list.value
    return list.value.filter(
        (item) =>
            String(item.ratingName || '').toLowerCase().includes(k) ||
            String(item.ratingCode || '').toLowerCase().includes(k),
    )
})

const dialogVisible = ref(false)
const submitting = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({
    ratingName: '',
    ratingCode: '',
    ratingValue: 0,
})
const formRules: FormRules = {
    ratingName: [{ required: true, message: '请输入等级名称', trigger: 'blur' }],
    ratingCode: [{ required: true, message: '请输入等级编码', trigger: 'blur' }],
    ratingValue: [{ required: true, message: '请输入等级值', trigger: 'change' }],
}

function handleSearch() { queryKeyword.value = keyword.value }
function handleReset() { keyword.value = ''; queryKeyword.value = '' }

function resetForm() {
    form.ratingName = ''
    form.ratingCode = ''
    form.ratingValue = 0
    formRef.value?.clearValidate?.()
}

async function loadList() {
    if (!canList.value) {
        list.value = []
        return
    }
    loading.value = true
    try {
        const res: any = await getContentRatingList()
        const body = res?.data ?? res
        if (body?.code !== 200) throw new Error(body?.message || '加载失败')
        const rows = Array.isArray(body?.data) ? body.data : []
        list.value = rows.map((row: any) => ({
            id: Number(row?.id),
            ratingName: String(row?.ratingName ?? ''),
            ratingCode: String(row?.ratingCode ?? ''),
            ratingValue: Number(row?.ratingValue ?? 0),
            createdAt: row?.createdAt ? String(row.createdAt) : '',
            updatedAt: row?.updatedAt ? String(row.updatedAt) : '',
        }))
    } catch (e: any) {
        list.value = []
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '加载失败')
    } finally {
        loading.value = false
    }
}

function openAddDialog() {
    if (!canAdd.value) return
    dialogMode.value = 'add'
    editingId.value = null
    resetForm()
    dialogVisible.value = true
}
function openEditDialog(row: LevelItem) {
    if (!canEdit.value) return
    dialogMode.value = 'edit'
    editingId.value = row.id
    form.ratingName = row.ratingName
    form.ratingCode = row.ratingCode
    form.ratingValue = Number(row.ratingValue ?? 0)
    dialogVisible.value = true
}
async function saveDialog() {
    if (!formRef.value) return
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
    if (dialogMode.value === 'add' && !canAdd.value) return
    if (dialogMode.value === 'edit' && !canEdit.value) return

    const ratingName = form.ratingName.trim()
    const ratingCode = form.ratingCode.trim()
    const ratingValue = Number(form.ratingValue)
    if (!Number.isFinite(ratingValue)) return ElMessage.warning('请输入有效等级值')
    submitting.value = true
    try {
        if (dialogMode.value === 'add') {
            const res: any = await addContentRating({ ratingName, ratingCode, ratingValue })
            const body = res?.data ?? res
            if (body?.code !== 200) throw new Error(body?.message || '新增失败')
            ElMessage.success('新增成功')
        } else {
            if (editingId.value == null) return
            const res: any = await updateContentRating({
                id: editingId.value,
                ratingName,
                ratingCode,
                ratingValue,
            })
            const body = res?.data ?? res
            if (body?.code !== 200) throw new Error(body?.message || '保存失败')
            ElMessage.success('保存成功')
        }
        dialogVisible.value = false
        await loadList()
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '操作失败')
    } finally {
        submitting.value = false
    }
}
async function removeItem(id: number) {
    if (!canDelete.value) return
    try {
        await ElMessageBox.confirm('确认删除当前配置项吗？', '提示', {
            type: 'warning',
            customClass: 'app-confirm-dialog',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showClose: true,
        })
        const res: any = await deleteContentRating(id)
        const body = res?.data ?? res
        if (body?.code !== 200) throw new Error(body?.message || '删除失败')
        ElMessage.success('删除成功')
        await loadList()
    } catch (e: any) {
        if (e === 'cancel') return
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '删除失败')
    }
}

onMounted(() => {
    loadList()
})

watch(() => filteredList.value.length, (count) => emit('count-change', Number(count || 0)), { immediate: true })
defineExpose({ openAddDialog })
</script>

<style scoped>
.panel-wrap { width: 100%; }
.level-tag { padding: 4px 10px; border-radius: 8px; background: #f4f4f5; color: #606266; font-size: 12px; }
</style>

