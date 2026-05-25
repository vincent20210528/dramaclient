<template>
    <page-content class="role-management-page operation-drama-page" :title="title">
        <template v-slot:bottom>
            <el-card class="drama-main-card" shadow="never">
                <el-form :model="searchForm" inline class="search-form search-form--single-row">
                    <el-form-item>
                        <el-input
                            v-model="searchForm.roleName"
                            class="filter-input filter-input--role"
                            placeholder="请输入角色名称"
                            clearable
                            @keyup.enter="handleSearch"
                        />
                    </el-form-item>
                    <el-form-item class="search-form__actions">
                        <el-button class="btn-query" type="primary" @click="handleSearch">查询</el-button>
                        <el-button class="btn-reset" @click="handleReset">重置</el-button>
                    </el-form-item>
                    <el-form-item class="search-form__add">
                        <el-button
                            v-if="canAddRole"
                            class="add-menu-btn"
                            type="primary"
                            :icon="Plus"
                            @click="openAddDialog"
                        >
                            新增
                        </el-button>
                    </el-form-item>
                </el-form>

                <div class="table-toolbar">
                    <span class="toolbar-actions">
                        <el-icon class="toolbar-icon" @click="loadList"><Refresh /></el-icon>
                    </span>
                </div>

                <div class="drama-table-block" v-loading="loading">
                <el-table
                    class="drama-op-table"
                    :data="roleList"
                    style="width: 100%"
                    :scrollbar-always-on="true"
                >
                    <el-table-column type="index" label="序号" width="80" align="center" />
                    <el-table-column prop="id" label="角色ID" width="120" align="center" />
                    <el-table-column prop="roleName" label="角色名称" min-width="96" show-overflow-tooltip />
                    <el-table-column prop="roleCode" label="角色编号" width="120" show-overflow-tooltip />
                    <el-table-column prop="createTime" label="创建时间" width="180" show-overflow-tooltip />
                    <el-table-column label="状态" width="100" align="center" class-name="col-status">
                        <template #default="{ row }">
                            <span v-if="isStatusNormal(row)" class="status-pill status-pill--ok">正常</span>
                            <span v-else class="status-pill status-pill--off">{{ getStatusText(row) }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="288" align="center" fixed="right">
                        <template #default="{ row }">
                            <div class="op-cell">
                                <el-button class="op-btn op-btn--view" link :icon="View" @click="handleView(row)">查看</el-button>
                                <el-button
                                    v-if="canEditRole"
                                    class="op-btn op-btn--edit"
                                    link
                                    :icon="Edit"
                                    @click="handleEdit(row)"
                                >
                                    编辑
                                </el-button>
                                <el-button
                                    v-if="canDeleteRole"
                                    class="op-btn op-btn--del"
                                    link
                                    :icon="Delete"
                                    @click="handleDelete(row)"
                                >
                                    删除
                                </el-button>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
                </div>

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

            <!-- 新增/查看/编辑 弹窗：外壳与菜单管理一致（menu-add-dialog）；查看时 menu-view-dialog -->
            <el-dialog
                v-model="dialogVisible"
                :title="dialogTitle"
                width="760px"
                align-center
                destroy-on-close
                class="menu-add-dialog"
                :class="{ 'menu-view-dialog': isView }"
                @close="resetForm"
            >
                <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px" class="role-dialog-form">
                    <el-form-item v-if="isView" label="角色ID">
                        <el-input v-model="form.roleId" readonly />
                    </el-form-item>
                    <el-form-item label="角色名称" prop="roleName">
                        <el-input v-model="form.roleName" placeholder="请输入角色名称" clearable :readonly="isView" />
                    </el-form-item>
                    <el-form-item label="角色标识" prop="roleCode">
                        <el-input v-model="form.roleCode" placeholder="请输入角色标识" clearable :readonly="isView" />
                    </el-form-item>
                    <el-form-item label="角色排序" prop="roleSort">
                        <el-input-number v-model="form.roleSort" :min="0" controls-position="right" style="width: 100%" :disabled="isView" />
                    </el-form-item>
                    <el-form-item label="状态" prop="status">
                        <el-select v-model="form.status" placeholder="请选择" style="width: 100%" :disabled="isView">
                            <el-option label="正常" :value="1" />
                            <el-option label="停用" :value="0" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="备注" prop="description">
                        <el-input
                            v-model="form.description"
                            type="textarea"
                            :rows="2"
                            placeholder="请输入备注"
                            :readonly="isView"
                        />
                    </el-form-item>
                    <!-- 菜单权限：查看时仅展示已赋权菜单树，编辑时可勾选/取消 -->
                    <template v-if="isView || isEdit">
                        <div class="role-menu-permission-block">
                            <el-divider content-position="left">菜单权限</el-divider>
                            <el-tree
                                ref="menuTreeRef"
                                :data="menuTreeData"
                                :props="{ label: 'menuName', children: 'children' }"
                                node-key="id"
                                show-checkbox
                                check-strictly
                                :default-checked-keys="[]"
                                :disabled="isView"
                                default-expand-all
                                class="menu-permission-tree"
                            />
                        </div>
                    </template>
                </el-form>
                <template #footer>
                    <template v-if="isView">
                        <el-button type="primary" @click="dialogVisible = false">关闭</el-button>
                    </template>
                    <template v-else>
                        <el-button @click="dialogVisible = false">取消</el-button>
                        <el-button type="primary" @click="handleSubmit" :loading="submitting">{{ isEdit ? '保存' : '确定' }}</el-button>
                    </template>
                </template>
            </el-dialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { hasPerm, PERM_ROLE } from '@/utils/permission'
import { Refresh, Plus, View, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { getRolesPage, addRole, updateRoleApi, getRoleMenuTreeSelect, deleteRole } from '@/api'

const title = {
    firstTitle: '角色管理',
    secondTitle: '管理系统角色与权限',
}

const canAddRole = computed(() => hasPerm(PERM_ROLE.add))
const canEditRole = computed(() => hasPerm(PERM_ROLE.edit))
const canDeleteRole = computed(() => hasPerm(PERM_ROLE.delete))

const searchForm = reactive({ roleName: '' })
const roleList = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const dialogTitle = ref('新增角色')
const formRef = ref<FormInstance>()
const submitting = ref(false)
const isEdit = ref(false)
const isView = ref(false)
const editingId = ref<number | null>(null)

const menuTreeRef = ref<any>(null)
const menuTreeData = ref<any[]>([])
const checkedKeys = ref<number[]>([])

const form = reactive({
    roleId: '' as string | number,
    roleName: '',
    roleCode: '',
    roleSort: 0,
    status: 1 as number,
    description: '',
})

const formRules: FormRules = {
    roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
    roleCode: [{ required: true, message: '请输入角色标识', trigger: 'blur' }],
    roleSort: [{ required: true, message: '请输入角色排序', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

function isStatusNormal(row: any) {
    const s = row.status
    return s === 1 || s === '1'
}

function getStatusText(row: any) {
    return isStatusNormal(row) ? '正常' : '停用'
}

function normalizeRow(row: any) {
    return {
        ...row,
        roleName: row.roleName ?? row.name,
        roleCode: row.roleCode ?? row.roleKey ?? row.code,
        description: row.description ?? row.remark ?? row.roleDescription,
        roleSort: row.roleSort ?? row.sort ?? 0,
        status: row.status ?? 1,
        createTime: row.createTime ?? row.createdAt,
    }
}

async function loadList() {
    loading.value = true
    try {
        const res: any = await getRolesPage({
            current: currentPage.value,
            size: pageSize.value,
            roleName: searchForm.roleName?.trim() || undefined,
        })
        const data = res?.data?.data ?? res?.data
        if (data?.records) {
            roleList.value = (data.records as any[]).map(normalizeRow)
            total.value = data.total ?? 0
        } else if (data?.rows) {
            roleList.value = (data.rows as any[]).map(normalizeRow)
            total.value = data.total ?? 0
        } else {
            roleList.value = []
            total.value = 0
        }
    } catch (e) {
        roleList.value = []
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
    searchForm.roleName = ''
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
    // 每次点击“新增”都强制重置，避免带入上一次编辑/查看数据
    resetForm()
    isEdit.value = false
    isView.value = false
    editingId.value = null
    dialogTitle.value = '新增角色'
    menuTreeData.value = []
    checkedKeys.value = []
    dialogVisible.value = true
}

async function handleView(row: any) {
    isEdit.value = false
    isView.value = true
    const id = row.id ?? row.roleId
    editingId.value = id
    dialogTitle.value = '查看角色'
    form.roleId = id ?? ''
    form.roleName = row.roleName ?? ''
    form.roleCode = row.roleCode ?? ''
    form.roleSort = row.roleSort ?? row.sort ?? 0
    form.status = row.status === 0 || row.status === '0' ? 0 : 1
    form.description = row.description ?? row.remark ?? ''
    dialogVisible.value = true
    await loadRoleMenuTree(Number(id))
}

async function handleEdit(row: any) {
    isEdit.value = true
    isView.value = false
    const id = row.id ?? row.roleId
    editingId.value = id
    dialogTitle.value = '编辑'
    form.roleId = id ?? ''
    form.roleName = row.roleName ?? ''
    form.roleCode = row.roleCode ?? ''
    form.roleSort = row.roleSort ?? row.sort ?? 0
    form.status = row.status === 0 || row.status === '0' ? 0 : 1
    form.description = row.description ?? row.remark ?? ''
    dialogVisible.value = true
    await loadRoleMenuTree(Number(id))
}

function normalizeMenuIds(keys: unknown[]): number[] {
    const out: number[] = []
    for (const k of keys) {
        const n = typeof k === 'string' ? Number(k) : typeof k === 'number' ? k : NaN
        if (!Number.isNaN(n)) out.push(n)
    }
    return out
}

async function loadRoleMenuTree(roleId: number) {
    menuTreeData.value = []
    checkedKeys.value = []
    try {
        const res: any = await getRoleMenuTreeSelect(roleId)
        const data = res?.data?.data ?? res?.data
        if (data?.menus) {
            menuTreeData.value = Array.isArray(data.menus) ? data.menus : []
        }
        if (data?.checkedKeys && Array.isArray(data.checkedKeys)) {
            checkedKeys.value = normalizeMenuIds(data.checkedKeys)
        }
        // 父子不联动（check-strictly）下，必须用 setCheckedKeys 应用后端返回的 keys；
        // 若仅用 default-checked-keys + 非 strict，父节点勾选会级联勾选全部子节点，造成「未在 checkedKeys 中的也被勾选」
        await nextTick()
        await nextTick()
        menuTreeRef.value?.setCheckedKeys?.(checkedKeys.value, false)
    } catch {
        menuTreeData.value = []
        checkedKeys.value = []
    }
}

function resetForm() {
    form.roleId = ''
    form.roleName = ''
    form.roleCode = ''
    form.roleSort = 0
    form.status = 1
    form.description = ''
    menuTreeData.value = []
    checkedKeys.value = []
    formRef.value?.resetFields()
}

async function handleSubmit() {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
        if (!valid) return
        submitting.value = true
        try {
            if (isEdit.value && editingId.value != null) {
                const menuIds: number[] = []
                if (menuTreeRef.value) {
                    // check-strictly 下无半选联动，仅提交实际勾选的节点 id
                    const checked = menuTreeRef.value.getCheckedKeys(false) ?? []
                    menuIds.push(...checked)
                }
                await updateRoleApi({
                    role: {
                        id: editingId.value,
                        roleName: form.roleName,
                        roleCode: form.roleCode,
                        description: form.description ?? '',
                    },
                    menuIds,
                })
                ElMessage.success('保存成功')
            } else {
                await addRole({
                    roleName: form.roleName,
                    roleCode: form.roleCode,
                    description: form.description,
                })
                ElMessage.success('新增成功')
            }
            dialogVisible.value = false
            loadList()
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? e?.message
            ElMessage.error(msg && typeof msg === 'string' ? msg : (isEdit.value ? '保存失败' : '新增失败'))
        } finally {
            submitting.value = false
        }
    })
}

async function handleDelete(row: any) {
    const id = row.id ?? row.roleId
    const name = row.roleName || row.roleCode || ''
    const msg = name ? `确定删除角色「${name}」吗？` : '确定要删除该角色吗？'
    try {
        await ElMessageBox.confirm(msg, '提示', {
            type: 'warning',
            customClass: 'app-confirm-dialog',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showClose: true,
        })
        await deleteRole(Number(id))
        ElMessage.success('删除成功')
        loadList()
    } catch (e) {
        if (e !== 'cancel') ElMessage.error('删除失败')
    }
}

onMounted(() => {
    loadList()
})
</script>

<style scoped>
:deep(.role-management-page.page-content) {
    background-color: #ffffff;
}

.operation-drama-page :deep(.page-content-body) {
    padding-top: 0;
}

.drama-main-card {
    margin-top: 12px;
    border-radius: 20px;
    overflow: hidden;
}
.drama-main-card :deep(.el-card__body) {
    padding: 12px 20px 20px;
    box-sizing: border-box;
}

.search-form {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px 10px;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
}
.search-form--single-row > :deep(.el-form-item) {
    flex-shrink: 0;
}
.search-form :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 0;
}

.filter-input--role {
    width: 220px;
}

.drama-main-card :deep(.filter-input .el-input__wrapper) {
    min-height: 34px;
    padding: 0 10px;
    background-color: #edf1fc;
    border-radius: 8px;
    box-shadow: none;
    border: none;
}
.drama-main-card :deep(.filter-input .el-input__wrapper:hover),
.drama-main-card :deep(.filter-input .el-input__wrapper.is-focus) {
    box-shadow: none;
}
.drama-main-card :deep(.filter-input .el-input__inner) {
    height: 34px;
    line-height: 34px;
    font-size: 12px;
    color: #303133;
}

.search-form__actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.search-form__add {
    margin-left: auto;
}

.btn-query {
    min-width: 64px;
    height: 34px;
    padding: 0 12px;
    border-radius: 8px;
    font-size: 12px;
    background-color: #2d53eb;
    border-color: #2d53eb;
}
.btn-query:hover,
.btn-query:focus {
    background-color: #2447d4;
    border-color: #2447d4;
}
.btn-reset {
    min-width: 64px;
    height: 34px;
    padding: 0 12px;
    border-radius: 8px;
    font-size: 12px;
    background-color: #eef1fe;
    border: 1px solid #2d53eb;
    color: #2d53eb;
}
.btn-reset:hover,
.btn-reset:focus {
    background-color: #e4e9fc;
    border-color: #2d53eb;
    color: #2d53eb;
}

.add-menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 34px;
    padding: 0;
    background-color: #2d53eb !important;
    border-color: #2d53eb !important;
    border-radius: 10px;
    color: #ffffff !important;
}

.add-menu-btn:hover,
.add-menu-btn:focus {
    background-color: #2447d4 !important;
    border-color: #2447d4 !important;
    color: #ffffff !important;
}

.table-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 12px 0 8px;
    margin-top: 16px;
}

.toolbar-actions {
    display: flex;
    gap: 8px;
}

.toolbar-icon {
    font-size: 16px;
    color: #909399;
    cursor: pointer;
}

.toolbar-icon:hover {
    color: #409eff;
}

.pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 12px 0 0;
}
.pagination-wrapper :deep(.el-pagination) {
    font-size: 12px;
    flex-wrap: wrap;
    row-gap: 8px;
}
.pagination-wrapper :deep(.el-pagination__total),
.pagination-wrapper :deep(.el-pagination__sizes) {
    font-size: 12px;
}

.drama-table-block {
    position: relative;
    width: 100%;
}
.drama-table-block :deep(.el-loading-mask) {
    z-index: 2000;
}

.drama-op-table {
    --el-table-border-color: #ebeef5;
}
.drama-op-table :deep(.el-table__fixed-right),
.drama-op-table :deep(.el-table__fixed-left) {
    box-shadow: none !important;
}
.drama-op-table :deep(.el-table__inner-wrapper::before) {
    display: none;
}
.drama-op-table :deep(.el-table__cell) {
    border-right: none !important;
    border-left: none !important;
    border-top: none !important;
}
.drama-op-table :deep(thead th.el-table__cell),
.drama-op-table :deep(tbody td.el-table__cell) {
    border-bottom: 1px solid #ebeef5 !important;
}
.drama-op-table :deep(.el-table__header-wrapper) {
    border-radius: 8px;
    overflow: hidden;
}
.drama-op-table :deep(thead th.el-table__cell:first-child) {
    border-top-left-radius: 8px;
}
.drama-op-table :deep(thead th.el-table__cell:last-child) {
    border-top-right-radius: 8px;
}
.drama-op-table :deep(.el-table__header-wrapper th.el-table__cell) {
    background-color: #edf1fc !important;
    padding-top: 10px;
    padding-bottom: 10px;
    box-sizing: border-box;
    vertical-align: middle;
}
.drama-op-table :deep(.el-table__header .cell) {
    font-size: 13px;
    font-weight: 700;
    color: #000000;
    line-height: 18px;
}
.drama-op-table :deep(thead th.el-table__cell > .cell) {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    overflow-wrap: normal;
    word-break: keep-all;
    gap: 2px;
}
.drama-op-table :deep(thead th.el-table__cell .caret-wrapper) {
    flex-shrink: 0;
}
.drama-op-table :deep(.el-table__body .el-table__cell .cell) {
    font-size: 12px;
    color: #575757;
    line-height: 18px;
}
.drama-op-table :deep(.el-table__body .el-button.is-link) {
    font-size: 12px;
    line-height: 18px;
}
.drama-op-table :deep(th.el-table__fixed-right-patch) {
    background-color: #edf1fc;
}

.drama-op-table :deep(.el-table__body tr:hover > td.el-table__cell) {
    background-color: #fafafa !important;
}

.drama-op-table :deep(td.col-status .cell) {
    overflow: visible;
    text-overflow: clip;
}

.status-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    font-size: 12px;
    line-height: 1.2;
    min-width: 52px;
    padding: 0 8px;
    width: auto;
}

.status-pill--ok {
    height: 22px;
    background: #dfffd9;
    border-radius: 8px;
    border: none;
    color: #16a34a;
}

.status-pill--off {
    height: 22px;
    border-radius: 8px;
    background: #f4f4f5;
    border: 1px solid #dcdfe6;
    color: #909399;
}

.op-cell {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: 2px;
    white-space: nowrap;
}

.op-btn {
    font-size: 12px;
    padding: 4px 4px;
}

.op-btn--view {
    color: #ff9900 !important;
}

.op-btn--view :deep(.el-icon) {
    color: #ff9900;
}

.op-btn--edit {
    color: #409eff !important;
}

.op-btn--edit :deep(.el-icon) {
    color: #409eff;
}

.op-btn--del {
    color: #f56c6c !important;
}

.op-btn--del :deep(.el-icon) {
    color: #f56c6c;
}

/* 「菜单权限」标题与下方树列表间距（查看/编辑共用） */
:deep(.role-menu-permission-block .el-divider--horizontal) {
    margin: 12px 0 18px;
    border-color: #e8ecf4;
}

:deep(.role-menu-permission-block .menu-permission-tree) {
    margin-top: 4px;
}

.menu-permission-tree {
    max-height: 320px;
    overflow-y: auto;
    padding: 8px 0;
}

/* 弹窗外壳与菜单管理 menu-add-dialog 一致 */
:deep(.menu-add-dialog.el-dialog) {
    padding: 0;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

:deep(.menu-add-dialog .el-dialog__header) {
    position: relative;
    margin: 0;
    padding: 0 44px 0 20px;
    height: 68px;
    min-height: 68px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    background-color: #edf1fc;
    border-bottom: none;
}

:deep(.menu-add-dialog .el-dialog__headerbtn) {
    top: 16px;
    right: 16px;
    transform: none;
    margin: 0;
    width: 36px;
    height: 36px;
}

:deep(.menu-add-dialog .el-dialog__headerbtn .el-dialog__close) {
    color: #909399;
}

:deep(.menu-add-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
    color: #606266;
}

:deep(.menu-add-dialog .el-dialog__title) {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    line-height: 1.3;
}

:deep(.menu-add-dialog .el-dialog__body) {
    padding: 20px 20px 8px;
    background-color: #ffffff;
}

:deep(.menu-add-dialog .role-dialog-form .el-form-item) {
    margin-bottom: 18px;
}

:deep(.menu-add-dialog .role-dialog-form .el-form-item__label) {
    font-size: 13px;
    color: #303133;
}

:deep(.menu-add-dialog .el-input__wrapper) {
    min-height: 40px;
    border-radius: 10px;
    box-sizing: border-box;
}

:deep(.menu-add-dialog .el-select .el-select__wrapper) {
    min-height: 40px;
    border-radius: 10px;
    box-sizing: border-box;
}

:deep(.menu-add-dialog .el-input-number .el-input__wrapper) {
    min-height: 40px;
    border-radius: 10px;
}

:deep(.menu-add-dialog .el-textarea__inner) {
    border-radius: 10px;
}

:deep(.menu-add-dialog .el-dialog__footer) {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    padding: 16px 20px 20px;
    border-top: none;
    background-color: #ffffff;
}

:deep(.menu-add-dialog .el-dialog__footer .el-button) {
    min-width: 88px;
    height: 40px;
    border-radius: 10px;
    padding: 0 18px;
}

:deep(.menu-add-dialog .el-dialog__footer .el-button:not(.el-button--primary)) {
    background-color: #edf1fc;
    border-color: #d8e0f5;
    color: #303133;
}

:deep(.menu-add-dialog .el-dialog__footer .el-button:not(.el-button--primary):hover) {
    background-color: #e0e8f8;
    border-color: #d8e0f5;
    color: #303133;
}

:deep(.menu-add-dialog .el-dialog__footer .el-button--primary) {
    background-color: #1c53d9;
    border-color: #1c53d9;
}

:deep(.menu-add-dialog .el-dialog__footer .el-button--primary:hover) {
    background-color: #1748c4;
    border-color: #1748c4;
}

/* 查看模式：与菜单「查看详情」内容区风格接近 */
:deep(.menu-view-dialog .el-input__wrapper) {
    background-color: #fafbfc;
}

:deep(.menu-view-dialog .el-textarea__inner) {
    background-color: #fafbfc;
}

:deep(.menu-view-dialog .el-select .el-select__wrapper) {
    background-color: #fafbfc;
}

:deep(.menu-view-dialog .el-input-number.is-disabled .el-input__wrapper) {
    background-color: #fafbfc;
}

/* 查看模式：菜单树外框（分割线间距由 .role-menu-permission-block 统一控制） */
:deep(.menu-view-dialog .role-menu-permission-block .menu-permission-tree) {
    border: 1px solid #e8ecf4;
    border-radius: 10px;
    padding: 12px 14px;
    background: #fafbfc;
}
</style>
