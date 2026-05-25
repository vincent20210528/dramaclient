<template>
    <page-content class="menu-management-page operation-drama-page" :title="title">
        <template v-slot:bottom>
            <el-card class="drama-main-card" shadow="never">
                <div class="table-toolbar">
                    <el-button
                        v-if="canAddMenu"
                        class="add-menu-btn"
                        type="warning"
                        :icon="Plus"
                        @click="openAddDialog"
                    >
                        新增
                    </el-button>
                    <span class="toolbar-actions">
                        <el-icon class="toolbar-icon" @click="loadList"><Refresh /></el-icon>
                    </span>
                </div>
                <div class="drama-table-block" v-loading="loading">
                <el-table
                    class="drama-op-table"
                    :data="menuTree"
                    row-key="id"
                    :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
                    style="width: 100%"
                    :scrollbar-always-on="true"
                >
                    <el-table-column prop="menuName" label="名称" min-width="180" show-overflow-tooltip />
                    <el-table-column prop="id" label="ID" width="80" align="center" />
                    <el-table-column prop="menuType" label="类型" width="90" align="center">
                        <template #default="{ row }">
                            {{ getMenuTypeText(row.menuType) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="icon" label="图标" width="80" align="center" show-overflow-tooltip />
                    <el-table-column prop="path" label="路由路径" min-width="120" show-overflow-tooltip />
                    <el-table-column prop="perms" label="权限标识" width="120" show-overflow-tooltip />
                    <el-table-column label="状态" width="90" align="center" class-name="col-status">
                        <template #default="{ row }">
                            <span
                                v-if="row.status === 1"
                                class="status-pill status-pill--ok"
                            >
                                正常
                            </span>
                            <span v-else class="status-pill status-pill--off">禁用</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="288" align="center" fixed="right">
                        <template #default="{ row }">
                            <div class="op-cell">
                                <el-button class="op-btn op-btn--view" link :icon="View" @click="handleView(row)">查看</el-button>
                                <el-button
                                    v-if="canEditMenu"
                                    class="op-btn op-btn--edit"
                                    link
                                    :icon="Edit"
                                    @click="handleEdit(row)"
                                >
                                    编辑
                                </el-button>
                                <el-button
                                    v-if="canDeleteMenu"
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
            </el-card>

            <!-- 新增/编辑菜单弹窗（共用同一表单样式） -->
            <el-dialog
                v-model="addDialogVisible"
                :title="dialogMode === 'edit' ? '编辑' : '新增'"
                width="760px"
                align-center
                destroy-on-close
                class="menu-add-dialog"
                @close="resetAddForm"
            >
                <el-form
                    ref="addFormRef"
                    :model="addForm"
                    :rules="addFormRules"
                    label-position="right"
                    label-width="110px"
                    class="add-form-menu"
                >
                    <el-form-item label="名称" prop="menuName">
                        <el-input v-model="addForm.menuName" placeholder="请输入菜单名称" clearable />
                    </el-form-item>
                    <el-form-item label="类型" prop="menuType">
                        <el-select v-model="addForm.menuType" placeholder="请选择" style="width: 100%">
                            <el-option label="目录" value="M" />
                            <el-option label="菜单" value="C" />
                            <el-option label="按钮" value="F" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="状态" prop="status">
                        <el-select v-model="addForm.status" placeholder="请选择" style="width: 100%">
                            <el-option label="启用" :value="1" />
                            <el-option label="禁用" :value="0" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="权限标识" prop="perms">
                        <el-input v-model="addForm.perms" placeholder="如 system:user.view" clearable />
                    </el-form-item>
                    <el-form-item label="父菜单" prop="parentIdPath">
                        <el-cascader
                            v-model="addForm.parentIdPath"
                            :options="parentCascaderOptions"
                            :props="{
                                value: 'value',
                                label: 'label',
                                emitPath: true,
                                checkStrictly: true,
                            }"
                            placeholder="请选择父菜单（各级均可选）"
                            clearable
                            style="width: 100%"
                            show-all-levels
                        />
                    </el-form-item>
                    <el-form-item label="路由路径" prop="path">
                        <el-input v-model="addForm.path" placeholder="如 /system/user" clearable />
                    </el-form-item>
                    <el-form-item label="层级顺序" prop="sort">
                        <el-input-number v-model="addForm.sort" :min="0" controls-position="right" style="width: 100%" />
                    </el-form-item>
                    <el-form-item label="图标" prop="icon">
                        <el-input v-model="addForm.icon" placeholder="如 user" clearable />
                    </el-form-item>
                    <el-form-item label="显示状态" prop="visible">
                        <el-select v-model="addForm.visible" placeholder="请选择" style="width: 100%">
                            <el-option label="显示" :value="1" />
                            <el-option label="隐藏" :value="0" />
                        </el-select>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="addDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleAddSubmit" :loading="addSubmitting">
                        {{ dialogMode === 'edit' ? '保存' : '新增' }}
                    </el-button>
                </template>
            </el-dialog>

            <!-- 查看详情：外壳与新增一致；header 仅标题 + X；底部「关闭」 -->
            <el-dialog
                v-model="viewDialogVisible"
                title="查看详情"
                width="640px"
                align-center
                destroy-on-close
                class="menu-add-dialog menu-view-dialog"
            >
                <el-descriptions v-if="viewRow" :column="2" border class="view-detail-desc view-detail-desc--panel">
                    <el-descriptions-item label="名称">{{ viewRow.menuName ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="ID">{{ viewRow.id ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="类型">{{ getMenuTypeText(viewRow.menuType) }}</el-descriptions-item>
                    <el-descriptions-item label="状态">
                        <el-tag :type="viewRow.status === 1 ? 'success' : 'info'">
                            {{ viewRow.status === 1 ? '正常' : '禁用' }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="路由路径">{{ viewRow.path ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="权限标识">{{ viewRow.perms ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="图标">{{ viewRow.icon ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="层级顺序">{{ viewRow.sort ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="是否为外链">{{ getIsFrameText(viewRow.isFrame) }}</el-descriptions-item>
                    <el-descriptions-item label="是否缓存">{{ getCacheText(viewRow.keepAlive) }}</el-descriptions-item>
                    <el-descriptions-item label="显示状态">{{ viewRow.visible === 1 ? '显示' : '隐藏' }}</el-descriptions-item>
                    <el-descriptions-item label="父菜单ID">{{ viewRow.parentId ?? 0 }}</el-descriptions-item>
                    <el-descriptions-item label="父菜单">{{ getParentMenuName(viewRow.parentId) }}</el-descriptions-item>
                </el-descriptions>
                <template #footer>
                    <el-button type="primary" @click="viewDialogVisible = false">关闭</el-button>
                </template>
            </el-dialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Plus, Refresh, View, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { getMenusTree, addMenuApi, updateMenuApi, deleteMenuApi } from '@/api'
import { hasPerm, PERM_MENU } from '@/utils/permission'

const title = {
    firstTitle: '菜单管理',
    secondTitle: '管理系统菜单与权限标识',
}

const canAddMenu = computed(() => hasPerm(PERM_MENU.add))
const canEditMenu = computed(() => hasPerm(PERM_MENU.edit))
const canDeleteMenu = computed(() => hasPerm(PERM_MENU.delete))

const loading = ref(false)
const menuTree = ref<any[]>([])

const addDialogVisible = ref(false)
const addFormRef = ref<FormInstance>()
const addSubmitting = ref(false)
/** 弹窗模式：新增 | 编辑，与新增共用同一表单 */
const dialogMode = ref<'add' | 'edit'>('add')

const viewDialogVisible = ref(false)
const viewRow = ref<any>(null)

const addForm = reactive({
    /** 编辑时存在 */
    id: undefined as number | undefined,
    /** 父菜单级联路径，如 [0] 表示顶层，[4, 5] 表示选中的节点 id 为 5 */
    parentIdPath: [] as number[],
    menuName: '',
    path: '',
    component: 'Layout',
    menuType: 'C',
    visible: 1,
    status: 1,
    perms: '',
    icon: '',
    sort: 0,
})

const addFormRules: FormRules = {
    menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
    menuType: [{ required: true, message: '请选择类型', trigger: 'change' }],
    path: [{ required: true, message: '请输入路由路径', trigger: 'blur' }],
    sort: [{ required: true, message: '请输入层级顺序', trigger: 'blur' }],
}

function getMenuTypeText(type: string) {
    const map: Record<string, string> = { M: '目录', C: '菜单', F: '按钮' }
    return map[type] ?? type ?? '--'
}

function getIsFrameText(isFrame: any) {
    if (isFrame === 1 || isFrame === true) return '是'
    return '否'
}

function getCacheText(keepAlive: any) {
    if (keepAlive === 0 || keepAlive === false) return '不缓存'
    return '缓存'
}

/** 在树中根据 id 查找菜单名称（用于详情父菜单展示） */
function findMenuNameById(nodes: any[], targetId: number): string | null {
    if (!nodes?.length || targetId == null || targetId === 0) return null
    for (const node of nodes) {
        if (node.id === targetId) return node.menuName ?? null
        const found = node.children?.length ? findMenuNameById(node.children, targetId) : null
        if (found) return found
    }
    return null
}

function getParentMenuName(parentId: number | undefined | null): string {
    if (parentId == null || parentId === 0) return '顶层'
    const name = findMenuNameById(menuTree.value, parentId)
    return name ?? '--'
}

/** 将菜单树转为级联选择器 options：{ value, label, children }，含顶层 */
function treeToCascaderOptions(nodes: any[]): { value: number; label: string; children?: any[] }[] {
    if (!nodes?.length) return []
    return nodes.map((node) => ({
        value: node.id,
        label: node.menuName,
        children: node.children?.length ? treeToCascaderOptions(node.children) : undefined,
    }))
}

const parentCascaderOptions = computed(() => [
    { value: 0, label: '顶层', children: undefined },
    ...treeToCascaderOptions(menuTree.value),
])

/** 在树中查找从根到目标节点 id 的路径（用于编辑时回填父级级联） */
function findPathToNodeId(nodes: any[], targetId: number, path: number[] = []): number[] | null {
    if (!nodes?.length) return null
    for (const node of nodes) {
        const currentPath = [...path, node.id]
        if (node.id === targetId) return currentPath
        const found = node.children?.length
            ? findPathToNodeId(node.children, targetId, currentPath)
            : null
        if (found) return found
    }
    return null
}

async function loadList() {
    loading.value = true
    try {
        const res: any = await getMenusTree()
        const data = res?.data?.data ?? res?.data
        menuTree.value = Array.isArray(data) ? data : []
    } catch {
        menuTree.value = []
        // 网络/服务异常由 request 全局拦截器统一 ElMessage 提示
    } finally {
        loading.value = false
    }
}

function openAddDialog() {
    dialogMode.value = 'add'
    addDialogVisible.value = true
}

function resetAddForm() {
    addForm.id = undefined
    addForm.parentIdPath = []
    addForm.menuName = ''
    addForm.path = ''
    addForm.component = 'Layout'
    addForm.menuType = 'C'
    addForm.visible = 1
    addForm.status = 1
    addForm.perms = ''
    addForm.icon = ''
    addForm.sort = 0
    dialogMode.value = 'add'
    addFormRef.value?.resetFields()
}

/** 打开编辑弹窗，复用新增表单样式并回填当前行数据 */
function handleEdit(row: any) {
    dialogMode.value = 'edit'
    addForm.id = row.id
    addForm.menuName = row.menuName ?? ''
    addForm.path = row.path ?? ''
    addForm.component = row.component ?? 'Layout'
    addForm.menuType = row.menuType ?? 'C'
    addForm.visible = row.visible ?? 1
    addForm.status = row.status ?? 1
    addForm.perms = row.perms ?? ''
    addForm.icon = row.icon ?? ''
    addForm.sort = row.sort ?? 0
    const parentId = row.parentId ?? 0
    addForm.parentIdPath = parentId === 0 ? [] : (findPathToNodeId(menuTree.value, parentId) ?? [])
    addDialogVisible.value = true
}

async function handleAddSubmit() {
    if (!addFormRef.value) return
    await addFormRef.value.validate(async (valid) => {
        if (!valid) return
        const parentId = addForm.parentIdPath?.length
            ? addForm.parentIdPath[addForm.parentIdPath.length - 1]
            : 0
        const payload = {
            parentId,
            menuName: addForm.menuName,
            path: addForm.path,
            component: addForm.component,
            menuType: addForm.menuType,
            visible: addForm.visible,
            status: addForm.status,
            perms: addForm.perms,
            icon: addForm.icon,
            sort: addForm.sort,
        }
        addSubmitting.value = true
        try {
            if (dialogMode.value === 'edit' && addForm.id != null) {
                await updateMenuApi({ id: addForm.id, ...payload })
                ElMessage.success('保存成功')
            } else {
                await addMenuApi(payload)
                ElMessage.success('新增成功')
            }
            addDialogVisible.value = false
            loadList()
        } catch (e: any) {
            const msg = e?.response?.data?.message
            const action = dialogMode.value === 'edit' ? '保存' : '新增'
            ElMessage.error(msg && typeof msg === 'string' ? msg : `${action}失败`)
        } finally {
            addSubmitting.value = false
        }
    })
}

function handleView(row: any) {
    viewRow.value = { ...row }
    viewDialogVisible.value = true
}

async function handleDelete(row: any) {
    try {
        await ElMessageBox.confirm(`确定要删除菜单「${row.menuName}」吗？`, '提示', {
            type: 'warning',
            customClass: 'app-confirm-dialog',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showClose: true,
        })
        const res: any = await deleteMenuApi(row.id)
        const code = res?.data?.code ?? res?.code
        const msg = res?.data?.message ?? res?.message
        if (code !== 200 && code !== '200') {
            throw Object.assign(new Error(msg || '删除失败'), { response: { data: { message: msg } } })
        }
        ElMessage.success('删除成功')
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
/* 本页 page-content：白底（圆角在 el-card 上） */
:deep(.menu-management-page.page-content) {
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

.add-menu-btn {
    width: 120px;
    height: 34px;
    padding: 0 12px;
    border-radius: 10px;
    background-color: #2d53eb;
    border-color: #2d53eb;
}

.add-menu-btn:hover,
.add-menu-btn:focus {
    background-color: #6280f7 !important;
    border-color: #3e64fa !important;
    color: #ffffff !important;
}

.table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0 8px;
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
.view-detail-desc :deep(.el-descriptions__label) {
    width: 110px;
    background: #fafafa;
}

/* 查看详情：描述表展示风格（两列与字段顺序不变） */
:deep(.menu-view-dialog .view-detail-desc--panel.el-descriptions) {
    width: 100%;
    margin: 0;
}

:deep(.menu-view-dialog .view-detail-desc--panel .el-descriptions__table) {
    border-radius: 10px;
    overflow: hidden;
    border-color: #e8ecf4 !important;
}

:deep(.menu-view-dialog .view-detail-desc--panel .el-descriptions__label) {
    width: 110px !important;
    min-width: 110px;
    background: #f4f7fc !important;
    color: #606266;
    font-weight: 500;
    font-size: 13px;
    border-color: #e8ecf4 !important;
}

:deep(.menu-view-dialog .view-detail-desc--panel .el-descriptions__content) {
    background: #ffffff !important;
    color: #303133;
    font-size: 12px;
    border-color: #e8ecf4 !important;
}

:deep(.menu-view-dialog .view-detail-desc--panel .el-descriptions__cell) {
    padding: 12px 14px !important;
}

/* 新增/编辑菜单弹窗：表头 #edf1fc、圆角、表单控件与底部按钮与确认框一致 */
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

/* 关闭图标贴 header 上侧，避免 top:50% 在部分布局下跑到视口中部 */
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

:deep(.menu-add-dialog .add-form-menu .el-form-item) {
    margin-bottom: 18px;
}

:deep(.menu-add-dialog .add-form-menu .el-form-item__label) {
    font-size: 13px;
    color: #303133;
}

:deep(.menu-add-dialog .add-form-menu .el-form-item.is-required .el-form-item__label::before) {
    color: #f56c6c;
}

:deep(.menu-add-dialog .add-form-menu .el-input),
:deep(.menu-add-dialog .add-form-menu .el-select),
:deep(.menu-add-dialog .add-form-menu .el-cascader),
:deep(.menu-add-dialog .add-form-menu .el-input-number) {
    width: 100%;
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

:deep(.menu-add-dialog .el-cascader .el-input__wrapper) {
    min-height: 40px;
    border-radius: 10px;
}

:deep(.menu-add-dialog .el-input-number .el-input__wrapper) {
    min-height: 40px;
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

.drama-table-block {
    position: relative;
    width: 100%;
}
.drama-table-block :deep(.el-loading-mask) {
    z-index: 2000;
}

/* 列表：与剧集管理 drama-op-table 一致字号与分隔 */
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

.drama-op-table :deep(.el-table__expand-icon) {
    color: #606266;
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
</style>
