<template>
    <page-content :title="title">
        <template #bottom>
            <el-card class="search-card" shadow="never">
                <el-form :model="searchForm" inline class="search-form">
                    <el-form-item label="编码/名称">
                        <el-input
                            v-model="searchForm.param"
                            placeholder="请输入版权方编码或名称"
                            clearable
                            style="width: 220px"
                            @keyup.enter="handleSearch"
                        />
                    </el-form-item>
                    <el-form-item label="状态">
                        <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 140px">
                            <el-option label="启用" :value="1" />
                            <el-option label="禁用" :value="0" />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="handleSearch">查询</el-button>
                        <el-button @click="handleResetSearch">重置</el-button>
                    </el-form-item>
                    <el-form-item class="toolbar-item">
                        <el-button v-if="canAdd" type="primary" :icon="Plus" @click="openAddDialog">新增版权方</el-button>
                    </el-form-item>
                </el-form>
            </el-card>

            <el-card class="table-card" shadow="never">
                <el-table
                    :data="list"
                    v-loading="loading"
                    size="small"
                    stripe
                    border
                    style="width: 100%"
                    :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
                    :scrollbar-always-on="true"
                >
                    <el-table-column type="index" label="序号" width="60" :index="indexMethod" />
                    <el-table-column prop="copyrightCode" label="版权方编码" min-width="120" show-overflow-tooltip />
                    <el-table-column prop="copyrightName" label="版权方名称" min-width="140" show-overflow-tooltip />
                    <el-table-column prop="contact" label="联系人" min-width="90" show-overflow-tooltip />
                    <el-table-column prop="phoneNumber" label="联系电话" min-width="120" show-overflow-tooltip />
                    <el-table-column prop="email" label="邮箱" min-width="140" show-overflow-tooltip />
                    <el-table-column prop="contractNo" label="合同编号" min-width="120" show-overflow-tooltip />
                    <el-table-column prop="expiryDate" label="合同到期时间" width="120" />
                    <el-table-column label="状态" width="90" align="center">
                        <template #default="{ row }">
                            <el-tag :type="row.status === 1 ? 'success' : 'info'">
                                {{ row.status === 1 ? '启用' : '禁用' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="remarks" label="备注" min-width="140" show-overflow-tooltip />
                    <el-table-column prop="createdAt" label="创建时间" width="150" show-overflow-tooltip />
                    <el-table-column prop="updatedAt" label="更新时间" width="150" show-overflow-tooltip />
                    <el-table-column v-if="canEdit || canDelete" label="操作" width="120" align="center" fixed="right">
                        <template #default="{ row }">
                            <el-button v-if="canEdit" type="primary" link @click="openEditDialog(row)">编辑</el-button>
                            <el-button v-if="canDelete" type="danger" link @click="handleDelete(row)">删除</el-button>
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

            <FormDialog
                v-model="dialogVisible"
                :title="dialogTitle"
                width="620px"
                :loading="submitLoading"
                @close="resetForm"
                @confirm="submitForm"
            >
                <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="版权方编码" prop="copyrightCode">
                                <el-input v-model="form.copyrightCode" placeholder="请输入编码" clearable />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="版权方名称" prop="copyrightName">
                                <el-input v-model="form.copyrightName" placeholder="请输入名称" clearable />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="联系人" prop="contact">
                                <el-input v-model="form.contact" placeholder="请输入联系人" clearable />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="联系电话" prop="phoneNumber">
                                <el-input v-model="form.phoneNumber" placeholder="请输入联系电话" clearable />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="邮箱" prop="email">
                                <el-input v-model="form.email" placeholder="请输入邮箱" clearable />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="合同编号" prop="contractNo">
                                <el-input v-model="form.contractNo" placeholder="请输入合同编号" clearable />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="合同到期时间" prop="expiryDate">
                                <el-date-picker
                                    v-model="form.expiryDate"
                                    type="date"
                                    value-format="YYYY-MM-DD"
                                    placeholder="选择日期"
                                    style="width: 100%"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="状态" prop="status">
                                <el-select v-model="form.status" placeholder="请选择" style="width: 100%">
                                    <el-option label="启用" :value="1" />
                                    <el-option label="禁用" :value="0" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-form-item label="备注" prop="remarks">
                        <el-input v-model="form.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
                    </el-form-item>
                </el-form>
            </FormDialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import FormDialog from '@/components/FormDialog.vue'
import { hasPerm, PERM_COPYRIGHT_SOURCE } from '@/utils/permission'
import {
    addCopyrightSourceInfo,
    type CopyrightSourceForm,
    deleteCopyrightSourceInfo,
    getCopyrightSourceInfoPage,
    updateCopyrightSourceInfo,
} from '@/api/copyright'

const title = { firstTitle: '版权管理', secondTitle: '版权方信息管理' }

const searchForm = reactive<{
    param: string
    status: 0 | 1 | undefined
}>({
    param: '',
    status: undefined,
})

const list = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const dialogTitle = ref('新增版权方')
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)

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

const rules: FormRules = {
    copyrightCode: [{ required: true, message: '请输入版权方编码', trigger: 'blur' }],
    copyrightName: [{ required: true, message: '请输入版权方名称', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const canList = computed(() => hasPerm(PERM_COPYRIGHT_SOURCE.list))
const canAdd = computed(() => hasPerm(PERM_COPYRIGHT_SOURCE.add))
const canEdit = computed(() => hasPerm(PERM_COPYRIGHT_SOURCE.edit))
const canDelete = computed(() => hasPerm(PERM_COPYRIGHT_SOURCE.delete))

function indexMethod(index: number) {
    return (currentPage.value - 1) * pageSize.value + index + 1
}

async function loadList() {
    if (!canList.value) {
        list.value = []
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
        const data = res?.data?.data ?? res?.data
        if (data?.records) {
            list.value = data.records
            total.value = Number(data.total ?? 0)
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
    searchForm.param = ''
    searchForm.status = undefined
    currentPage.value = 1
    loadList()
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
    editingId.value = null
    formRef.value?.resetFields()
}

function openAddDialog() {
    if (!canAdd.value) return
    dialogTitle.value = '新增版权方'
    dialogVisible.value = true
}

function openEditDialog(row: any) {
    if (!canEdit.value) return
    dialogTitle.value = '编辑版权方'
    editingId.value = Number(row.id)
    form.copyrightCode = String(row.copyrightCode ?? '')
    form.copyrightName = String(row.copyrightName ?? '')
    form.contact = String(row.contact ?? '')
    form.phoneNumber = String(row.phoneNumber ?? '')
    form.email = String(row.email ?? '')
    form.contractNo = String(row.contractNo ?? '')
    form.expiryDate = String(row.expiryDate ?? '')
    form.status = Number(row.status) === 1 ? 1 : 0
    form.remarks = String(row.remarks ?? '')
    dialogVisible.value = true
}

async function submitForm() {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
        if (!valid) return
        if (editingId.value != null && !canEdit.value) return
        if (editingId.value == null && !canAdd.value) return
        submitLoading.value = true
        try {
            const payload: CopyrightSourceForm = {
                copyrightCode: form.copyrightCode.trim(),
                copyrightName: form.copyrightName.trim(),
                contact: form.contact.trim(),
                phoneNumber: form.phoneNumber.trim(),
                email: form.email.trim(),
                contractNo: form.contractNo.trim(),
                expiryDate: form.expiryDate,
                status: (Number(form.status) === 1 ? 1 : 0) as 0 | 1,
                remarks: form.remarks.trim(),
            }

            if (editingId.value != null) {
                const res: any = await updateCopyrightSourceInfo({
                    id: editingId.value,
                    ...payload,
                })
                const body = res?.data
                if (body?.code !== 200) {
                    throw new Error(body?.message || '保存失败')
                }
                ElMessage.success('保存成功')
            } else {
                const res: any = await addCopyrightSourceInfo(payload)
                const body = res?.data
                if (body?.code !== 200) {
                    throw new Error(body?.message || '新增失败')
                }
                ElMessage.success('新增成功')
            }
            dialogVisible.value = false
            loadList()
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? err?.message
            ElMessage.error(msg && typeof msg === 'string' ? msg : '操作失败')
        } finally {
            submitLoading.value = false
        }
    })
}

async function handleDelete(row: any) {
    if (!canDelete.value) return
    try {
        await ElMessageBox.confirm('确定要删除该版权方吗？', '提示', {
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
        })
        const res: any = await deleteCopyrightSourceInfo(row.id)
        const body = res?.data
        if (body?.code !== 200) {
            throw new Error(body?.message || '删除失败')
        }
        ElMessage.success('删除成功')
        if (list.value.length === 1 && currentPage.value > 1) currentPage.value -= 1
        loadList()
    } catch (e: any) {
        if (e === 'cancel') return
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '删除失败')
    }
}

onMounted(() => {
    loadList()
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
.toolbar-item {
    margin-left: auto;
}
</style>

