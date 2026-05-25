<template>
    <div class="panel-wrap panel-register-wrap">
        <div class="filter-card">
            <el-form :model="searchForm" inline class="search-form">
                <el-form-item>
                    <el-input
                        v-model="searchForm.param"
                        class="filter-input"
                        placeholder="请输入版权方编码或名称"
                        clearable
                        @keyup.enter="handleSearch"
                    />
                </el-form-item>
                <el-form-item>
                    <el-select v-model="searchForm.status" class="filter-select" placeholder="状态" clearable>
                        <el-option label="启用" :value="1" />
                        <el-option label="禁用" :value="0" />
                    </el-select>
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
            :data="tableData"
            v-loading="loading"
            style="width: 100%"
            :scrollbar-always-on="true"
        >
            <el-table-column type="index" label="序号" width="88" min-width="88" align="center" fixed="left" />
            <el-table-column
                prop="copyrightCode"
                label="版权方编码"
                width="168"
                min-width="168"
                class-name="register-col-copyright-code"
                show-overflow-tooltip
                fixed="left"
            />
            <el-table-column prop="copyrightName" label="版权方名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="contact" label="联系人" width="100" show-overflow-tooltip />
            <el-table-column prop="phoneNumber" label="联系电话" width="120" show-overflow-tooltip />
            <el-table-column prop="email" label="邮箱" min-width="220" show-overflow-tooltip />
            <el-table-column prop="expiryDate" label="合同到期" width="120" />
            <el-table-column label="状态" width="90" align="center">
                <template #default="{ row }">
                    <el-tag :type="Number(row.status) === 1 ? 'success' : 'info'" size="small">
                        {{ Number(row.status) === 1 ? '启用' : '禁用' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column v-if="canEdit || canDelete" label="操作" width="260" align="center" fixed="right">
                <template #default="{ row }">
                    <div class="action-cell">
                        <el-button type="primary" link :icon="View" @click.stop="openViewDialog(row)">查看</el-button>
                        <el-button v-if="canEdit" type="primary" link :icon="Edit" @click.stop="openEditDialog(row)">编辑</el-button>
                        <el-button
                            v-if="canDelete"
                        type="danger"
                            link
                            :icon="Delete"
                            :loading="deletingId != null && deletingId === Number(row.id)"
                            @click.stop="handleDelete(row)"
                        >
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

        <el-dialog
            v-model="dialogVisible"
            :title="editingId != null ? '编辑版权方' : '新增'"
            width="760px"
            align-center
            destroy-on-close
            class="menu-add-dialog"
            @close="resetForm"
        >
            <el-form ref="formRef" :model="form" :rules="formRules" label-position="right" label-width="110px" class="add-form-menu">
                <el-divider content-position="left">版权方</el-divider>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="版权方编码" prop="copyrightCode">
                            <el-input v-model="form.copyrightCode" placeholder="请输入" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="版权方名称" prop="copyrightName">
                            <el-input v-model="form.copyrightName" placeholder="请输入" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="状态" prop="status">
                            <el-select v-model="form.status" placeholder="请选择">
                                <el-option label="启用" :value="1" />
                                <el-option label="禁用" :value="0" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-divider content-position="left">合同</el-divider>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="合同编号">
                            <el-input v-model="form.contractNo" placeholder="请输入" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="到期时间">
                            <el-date-picker
                                v-model="form.expiryDate"
                                type="date"
                                format="YYYY-MM-DD"
                                value-format="YYYY-MM-DD"
                                placeholder="请选择日期"
                                style="width: 100%"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-divider content-position="left">联系人信息</el-divider>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="名称">
                            <el-input v-model="form.contact" placeholder="请输入" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="电话">
                            <el-input v-model="form.phoneNumber" placeholder="请输入" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="邮箱">
                            <el-input v-model="form.email" placeholder="请输入" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="备注">
                            <el-input v-model="form.remarks" type="textarea" :rows="3" maxlength="200" show-word-limit />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
            </template>
        </el-dialog>
        <el-dialog
            v-model="viewVisible"
            title="查看详情"
            width="760px"
            align-center
            destroy-on-close
            class="menu-add-dialog menu-view-dialog"
        >
            <el-form label-position="right" label-width="110px" class="add-form-menu">
                <el-divider content-position="left">版权方</el-divider>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="版权方编码">
                            <el-input :model-value="viewRow.copyrightCode || '--'" readonly disabled />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="版权方名称">
                            <el-input :model-value="viewRow.copyrightName || '--'" readonly disabled />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="状态">
                            <el-input :model-value="Number(viewRow.status) === 1 ? '启用' : '禁用'" readonly disabled />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-divider content-position="left">合同</el-divider>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="合同编号">
                            <el-input :model-value="viewRow.contractNo || '--'" readonly disabled />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="到期时间">
                            <el-input :model-value="viewRow.expiryDate || '--'" readonly disabled />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-divider content-position="left">联系人信息</el-divider>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="名称">
                            <el-input :model-value="viewRow.contact || '--'" readonly disabled />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="电话">
                            <el-input :model-value="viewRow.phoneNumber || '--'" readonly disabled />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="邮箱">
                            <el-input :model-value="viewRow.email || '--'" readonly disabled />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="备注">
                            <el-input :model-value="viewRow.remarks || '--'" type="textarea" :rows="3" readonly disabled />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <template #footer>
                <el-button type="primary" @click="viewVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Refresh, Delete, Edit, View } from '@element-plus/icons-vue'
import '../panelRegisterList.css'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { hasPerm, PERM_COPYRIGHT_SOURCE } from '@/utils/permission'
import {
    addCopyrightSourceInfo,
    deleteCopyrightSourceInfo,
    getCopyrightSourceInfoPage,
    type CopyrightSourceForm,
    updateCopyrightSourceInfo,
} from '@/api/copyright'

const canList = computed(() => hasPerm(PERM_COPYRIGHT_SOURCE.list))
const canAdd = computed(() => hasPerm(PERM_COPYRIGHT_SOURCE.add))
const canEdit = computed(() => hasPerm(PERM_COPYRIGHT_SOURCE.edit))
const canDelete = computed(() => hasPerm(PERM_COPYRIGHT_SOURCE.delete))

const searchForm = reactive<{ param: string; status?: 0 | 1 }>({ param: '', status: undefined })
const tableData = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const viewVisible = ref(false)
const submitting = ref(false)
const deletingId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const emit = defineEmits<{ (e: 'count-change', count: number): void }>()

const form = reactive({
    copyrightCode: '',
    copyrightName: '',
    contact: '',
    phoneNumber: '',
    email: '',
    contractNo: '',
    expiryDate: '',
    status: 1 as 0 | 1,
    remarks: '',
})
const viewRow = reactive({
    copyrightCode: '',
    copyrightName: '',
    contact: '',
    phoneNumber: '',
    email: '',
    contractNo: '',
    expiryDate: '',
    status: 1 as 0 | 1,
    remarks: '',
})

const formRules: FormRules = {
    copyrightCode: [{ required: true, message: '请输入版权方编码', trigger: 'blur' }],
    copyrightName: [{ required: true, message: '请输入版权方名称', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

async function loadList() {
    if (!canList.value) {
        tableData.value = []
        total.value = 0
        return
    }
    loading.value = true
    try {
        const res: any = await getCopyrightSourceInfoPage({
            current: currentPage.value,
            size: pageSize.value,
            param: searchForm.param?.trim() || undefined,
            status: searchForm.status,
        })
        const body = res?.data ?? res
        if (body?.code !== 200) throw new Error(body?.message || '加载失败')
        const data = body?.data
        tableData.value = data?.records ?? []
        total.value = Number(data?.total ?? 0)
    } catch (e: any) {
        tableData.value = []
        total.value = 0
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '加载失败')
    } finally {
        loading.value = false
    }
}

function handleSearch() {
    currentPage.value = 1
    loadList()
}
function handleReset() {
    searchForm.param = ''
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

function openAddDialog() {
    if (!canAdd.value) return
    editingId.value = null
    resetForm()
    dialogVisible.value = true
}
function openEditDialog(row: any) {
    if (!canEdit.value) return
    editingId.value = Number(row.id)
    form.copyrightCode = String(row.copyrightCode ?? '')
    form.copyrightName = String(row.copyrightName ?? '')
    form.contact = String(row.contact ?? '')
    form.phoneNumber = String(row.phoneNumber ?? '')
    form.email = String(row.email ?? '')
    form.contractNo = String(row.contractNo ?? '')
    form.expiryDate = String(row.expiryDate ?? '')
    form.status = (Number(row.status) === 1 ? 1 : 0) as 0 | 1
    form.remarks = String(row.remarks ?? '')
    dialogVisible.value = true
}
function openViewDialog(row: any) {
    viewRow.copyrightCode = String(row.copyrightCode ?? '')
    viewRow.copyrightName = String(row.copyrightName ?? '')
    viewRow.contact = String(row.contact ?? '')
    viewRow.phoneNumber = String(row.phoneNumber ?? '')
    viewRow.email = String(row.email ?? '')
    viewRow.contractNo = String(row.contractNo ?? '')
    viewRow.expiryDate = String(row.expiryDate ?? '')
    viewRow.status = (Number(row.status) === 1 ? 1 : 0) as 0 | 1
    viewRow.remarks = String(row.remarks ?? '')
    viewVisible.value = true
}
function resetForm() {
    form.copyrightCode = ''
    form.copyrightName = ''
    form.contact = ''
    form.phoneNumber = ''
    form.email = ''
    form.contractNo = ''
    form.expiryDate = ''
    form.status = 1
    form.remarks = ''
    formRef.value?.resetFields()
}

async function submitForm() {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
        if (!valid) return
        if (editingId.value != null && !canEdit.value) return
        if (editingId.value == null && !canAdd.value) return
        submitting.value = true
        try {
            const payload: CopyrightSourceForm = {
                copyrightCode: form.copyrightCode.trim(),
                copyrightName: form.copyrightName.trim(),
                contact: form.contact.trim(),
                phoneNumber: form.phoneNumber.trim(),
                email: form.email.trim(),
                contractNo: form.contractNo.trim(),
                expiryDate: form.expiryDate || '',
                status: (Number(form.status) === 1 ? 1 : 0) as 0 | 1,
                remarks: form.remarks.trim(),
            }

            if (editingId.value != null) {
                const res: any = await updateCopyrightSourceInfo({ id: editingId.value, ...payload })
                const body = res?.data ?? res
                if (body?.code !== 200) throw new Error(body?.message || '保存失败')
                ElMessage.success('保存成功')
            } else {
                const res: any = await addCopyrightSourceInfo(payload)
                const body = res?.data ?? res
                if (body?.code !== 200) throw new Error(body?.message || '新增失败')
                ElMessage.success('新增成功')
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
    if (!canDelete.value) return
    if (deletingId.value != null) return
    try {
        await ElMessageBox.confirm('确定删除该版权方吗？', '提示', {
            type: 'warning',
            customClass: 'app-confirm-dialog',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showClose: true,
        })
        deletingId.value = Number(row.id)
        const res: any = await deleteCopyrightSourceInfo(Number(row.id))
        const body = res?.data ?? res
        if (body?.code !== 200) throw new Error(body?.message || '删除失败')
        ElMessage.success('删除成功')
        if (tableData.value.length === 1 && currentPage.value > 1) currentPage.value -= 1
        loadList()
    } catch (e: any) {
        if (e === 'cancel') return
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '删除失败')
    } finally {
        deletingId.value = null
    }
}

onMounted(() => {
    loadList()
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
.action-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-wrap: nowrap;
    white-space: nowrap;
}
</style>

