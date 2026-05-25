<template>
    <page-content class="user-management-page operation-drama-page" :title="title">
        <template v-slot:bottom>
            <el-card class="drama-main-card" shadow="never">
                <el-form :model="searchForm" inline class="search-form search-form--single-row">
                    <el-form-item>
                        <el-input
                            v-model="searchForm.keyword"
                            class="filter-input filter-input--keyword"
                            placeholder="请输入用户账号搜索"
                            clearable
                            @keyup.enter="handleSearch"
                        />
                    </el-form-item>
                    <el-form-item class="search-form__actions">
                        <el-button class="btn-query" type="primary" @click="handleSearch">查询</el-button>
                        <el-button class="btn-reset" @click="handleReset">重置</el-button>
                    </el-form-item>
                    <el-form-item class="search-form__add">
                        <el-button class="add-menu-btn" type="primary" :icon="Plus" @click="handleAddMember">添加成员</el-button>
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
                        :data="userList"
                        style="width: 100%"
                        :scrollbar-always-on="true"
                    >
                    <el-table-column type="index" label="序号" width="80" align="center" />
                    <el-table-column prop="userName" label="用户账号" width="130" show-overflow-tooltip />
                    <el-table-column prop="phonenumber" label="手机号码" width="130" show-overflow-tooltip />
                    <el-table-column prop="nickName" label="成员姓名" width="110" show-overflow-tooltip />
                    <el-table-column label="用户角色" width="110" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ getRoleName(row) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="email" label="用户邮箱" min-width="140" show-overflow-tooltip />
                    <el-table-column prop="createTime" label="加入时间" width="170" show-overflow-tooltip />
                    <el-table-column label="账号状态" width="132" min-width="132" align="center" class-name="col-status">
                        <template #default="{ row }">
                            <span v-if="isListStatusNormal(row)" class="status-pill status-pill--ok">正常</span>
                            <span v-else class="status-pill status-pill--off">停用</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="220" align="center" fixed="right">
                        <template #default="{ row }">
                            <div class="op-cell">
                                <el-button class="op-btn op-btn--view" link :icon="View" @click="handleView(row)">查看</el-button>
                                <el-button class="op-btn op-btn--edit" link :icon="Edit" @click="handleEdit(row)">编辑</el-button>
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

            <!-- 查看用户详情：外壳与角色/菜单查看一致 -->
            <el-dialog
                v-model="viewDialogVisible"
                title="用户详情"
                width="640px"
                align-center
                destroy-on-close
                class="menu-add-dialog menu-view-dialog"
            >
                <el-descriptions :column="1" border class="view-detail-desc view-detail-desc--panel" v-if="viewUser">
                    <el-descriptions-item label="用户名称">{{ viewUser.userName ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="昵称">{{ viewUser.nickName ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="角色">{{ getRoleName(viewUser) }}</el-descriptions-item>
                    <el-descriptions-item label="邮箱">{{ viewUser.email ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="手机号">{{ viewUser.phoneNumber ?? viewUser.phonenumber ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="性别">{{ viewUser.sex ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="头像">
                        <template v-if="viewUser.avatar">
                            <el-image :src="viewUser.avatar" style="width: 48px; height: 48px; border-radius: 4px" fit="cover" />
                        </template>
                        <span v-else>--</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="状态">
                        <el-tag :type="getViewStatusType(viewUser)">{{ getViewStatusText(viewUser) }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="创建人名称">{{ viewUser.createBy ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{ viewUser.createTime ?? viewUser.createAt ?? viewUser.createdAt ?? '--' }}</el-descriptions-item>
                    <el-descriptions-item label="更新时间">{{ viewUser.updatedAt ?? viewUser.updateAt ?? '--' }}</el-descriptions-item>
                </el-descriptions>
                <template #footer>
                    <el-button type="primary" @click="viewDialogVisible = false">关闭</el-button>
                </template>
            </el-dialog>

            <!-- 新增/编辑用户：外壳与角色管理弹窗一致 -->
            <el-dialog
                v-model="addDialogVisible"
                :title="dialogMode === 'edit' ? '编辑' : '添加成员'"
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
                    label-width="100px"
                    class="user-dialog-form"
                    autocomplete="off"
                >
                    <el-form-item label="用户账号" prop="userName">
                        <el-input
                            v-model="addForm.userName"
                            placeholder="请输入用户账号"
                            clearable
                            :disabled="dialogMode === 'edit'"
                        />
                    </el-form-item>
                    <el-form-item label="用户姓名" prop="nickName">
                        <el-input v-model="addForm.nickName" placeholder="请输入用户姓名" clearable />
                    </el-form-item>
                    <el-form-item label="手机号" prop="phoneNumber">
                        <el-input v-model="addForm.phoneNumber" placeholder="请输入手机号" clearable />
                    </el-form-item>
                    <el-form-item label="邮箱" prop="email">
                        <el-input
                            v-model="addForm.email"
                            placeholder="请输入邮箱"
                            clearable
                            autocomplete="off"
                            name="user-email-new"
                        />
                    </el-form-item>
                    <el-form-item v-if="dialogMode !== 'edit'" label="密码" prop="password">
                        <el-input
                            v-model="addForm.password"
                            type="password"
                            placeholder="不填则默认与用户账号相同"
                            show-password
                            clearable
                            autocomplete="new-password"
                            name="user-password-new"
                        />
                    </el-form-item>
                    <el-form-item label="用户性别" prop="sex">
                        <el-select v-model="addForm.sex" placeholder="请选择" clearable style="width: 100%">
                            <el-option label="男" value="男" />
                            <el-option label="女" value="女" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="角色" prop="roleId">
                        <el-select v-model="addForm.roleId" placeholder="请选择" clearable style="width: 100%">
                            <el-option v-for="r in roleList" :key="r.id ?? r.roleId" :label="r.roleName ?? r.name" :value="r.id ?? r.roleId" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="账号状态" prop="status">
                        <el-select v-model="addForm.status" placeholder="请选择" clearable style="width: 100%">
                            <el-option label="正常" value="1" />
                            <el-option label="停用" value="0" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="用户头像" prop="avatar" class="form-item-avatar">
                        <div class="avatar-field">
                            <el-upload
                                :auto-upload="false"
                                :limit="1"
                                :on-change="onAddAvatarChange"
                                :on-remove="onAddAvatarRemove"
                                :file-list="addAvatarFileList"
                                :show-file-list="false"
                                accept=".png,.jpg,.jpeg,.webp"
                            >
                                <el-button type="primary" class="user-avatar-pick-btn">选择图片</el-button>
                            </el-upload>
                            <div class="avatar-preview-side">
                                <template v-if="addAvatarPreviewUrl">
                                    <img :src="addAvatarPreviewUrl" class="avatar-preview-img" alt="头像预览" />
                                    <el-button type="danger" size="small" link @click="onAddAvatarRemove">移除</el-button>
                                </template>
                            </div>
                        </div>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="addDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleAddSubmit" :loading="addSubmitting">
                        {{ dialogMode === 'edit' ? '保存' : '确定' }}
                    </el-button>
                </template>
            </el-dialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'
import { Refresh, Plus, View, Edit } from '@element-plus/icons-vue'
import { getUsersPage, addUser, updateUserApi, getRolesPage, getRolesList } from '@/api'
import { uploadToObs, getFileExtension } from '@/utils/obsUpload'

const title = {
    firstTitle: '用户管理',
    secondTitle: '管理系统用户与成员',
}

/** 列表行状态：normalizeUserRow 后「0」表示正常 */
function isListStatusNormal(row: any) {
    return row.status === '0'
}

const searchForm = reactive({
    keyword: '',
})

const userList = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const viewDialogVisible = ref(false)
const viewUser = ref<any>(null)

const addDialogVisible = ref(false)
const addFormRef = ref<FormInstance>()
const addSubmitting = ref(false)
/** 弹窗模式：新增 | 编辑，与新增共用同一表单，编辑时用户账号不可编辑 */
const dialogMode = ref<'add' | 'edit'>('add')
const roleList = ref<any[]>([])
const addAvatarFileList = ref<UploadFiles>([])
const addAvatarFile = ref<File | null>(null)
const addAvatarPreviewUrl = ref('')

const AVATAR_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']
function isAllowedAvatarFile(file: File) {
    return AVATAR_EXTENSIONS.includes(getFileExtension(file.name) as any)
}

const addForm = reactive({
    /** 编辑时存在 */
    id: undefined as number | undefined,
    userName: '',
    nickName: '',
    phoneNumber: '',
    email: '',
    password: '',
    sex: '' as string,
    roleId: undefined as number | string | undefined,
    status: '1',
})

const addFormRules: FormRules = {
    userName: [
        { required: true, message: '请输入用户账号', trigger: 'blur' },
        { pattern: /^[^\u4e00-\u9fa5]+$/, message: '用户账号不可以包含中文', trigger: 'blur' },
    ],
    roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
    status: [{ required: true, message: '请选择账号状态', trigger: 'change' }],
    sex: [{ required: true, message: '请选择用户性别', trigger: 'change' }],
}

/** 列表/详情角色显示：优先单角色 role.roleName，兼容多角色 roles */
function getRoleName(row: any) {
    if (row.role?.roleName) return row.role.roleName
    if (row.roles && row.roles.length > 0) {
        return row.roles.map((r: any) => r.roleName).join('、')
    }
    return row.roleName ?? '--'
}

async function loadList() {
    loading.value = true
    try {
        const res: any = await getUsersPage({
            current: currentPage.value,
            size: pageSize.value,
            userName: searchForm.keyword?.trim() || undefined,
        })
        const data = res?.data?.data
        if (data?.records) {
            userList.value = (data.records as any[]).map(normalizeUserRow)
            total.value = data.total ?? 0
        } else {
            userList.value = []
            total.value = 0
        }
    } catch (e) {
        userList.value = []
        total.value = 0
    } finally {
        loading.value = false
    }
}

/** 将接口返回的字段名映射为列表页使用的字段（保留 role 单角色，兼容 roles） */
function normalizeUserRow(row: any) {
    return {
        ...row,
        userId: row.userId ?? row.id,
        phonenumber: row.phonenumber ?? row.phoneNumber,
        createTime: row.createTime ?? row.createdAt,
        status: row.status === 1 || row.status === '1' ? '0' : '1',
    }
}

function getViewStatusType(row: any) {
    const s = row?.status
    if (s === 1 || s === '1' || s === '0') return 'success'
    return 'danger'
}

function getViewStatusText(row: any) {
    const s = row?.status
    if (s === 1 || s === '1' || s === '0') return '正常'
    return '停用'
}

function handleSearch() {
    currentPage.value = 1
    loadList()
}

function handleReset() {
    searchForm.keyword = ''
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

async function openAddDialog() {
    // 每次点击“添加成员”都强制重置，避免带入上一次编辑数据
    resetAddForm()
    dialogMode.value = 'add'
    addDialogVisible.value = true
    await loadRoleList()
}

async function loadRoleList() {
    try {
        const res: any = await getRolesList()
        roleList.value = res?.data?.data ?? res?.data
    } catch {
        roleList.value = []
    }
}

function onAddAvatarChange(_file: UploadFile, files: UploadFiles) {
    if (addAvatarPreviewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(addAvatarPreviewUrl.value)
    addAvatarFileList.value = files
    const raw = files[0]?.raw as File | undefined
    addAvatarFile.value = raw ?? null
    addAvatarPreviewUrl.value = raw && raw.type.startsWith('image/') ? URL.createObjectURL(raw) : ''
}

function onAddAvatarRemove() {
    if (addAvatarPreviewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(addAvatarPreviewUrl.value)
    addAvatarPreviewUrl.value = ''
    addAvatarFileList.value = []
    addAvatarFile.value = null
}

function resetAddForm() {
    addForm.id = undefined
    addForm.userName = ''
    addForm.nickName = ''
    addForm.phoneNumber = ''
    addForm.email = ''
    addForm.password = ''
    addForm.sex = ''
    addForm.roleId = undefined
    addForm.status = '1'
    if (addAvatarPreviewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(addAvatarPreviewUrl.value)
    addAvatarPreviewUrl.value = ''
    addAvatarFileList.value = []
    addAvatarFile.value = null
    dialogMode.value = 'add'
    addFormRef.value?.resetFields()
}

async function handleAddSubmit() {
    if (!addFormRef.value) return
    await addFormRef.value.validate(async (valid) => {
        if (!valid) return
        if (addAvatarFile.value && !isAllowedAvatarFile(addAvatarFile.value)) {
            ElMessage.error('头像仅支持 png、jpg、jpeg、webp 格式')
            return
        }
        addSubmitting.value = true
        try {
            if (dialogMode.value === 'edit' && addForm.id != null) {
                let avatarUrl: string | undefined
                if (addAvatarFile.value) {
                    avatarUrl = await uploadToObs(addAvatarFile.value, 'avatar', 'put')
                } else if (addAvatarPreviewUrl.value) {
                    avatarUrl = addAvatarPreviewUrl.value
                } else {
                    avatarUrl = ''
                }
                await updateUserApi({
                    id: addForm.id,
                    userName: addForm.userName,
                    nickName: addForm.nickName || undefined,
                    email: addForm.email || undefined,
                    phoneNumber: addForm.phoneNumber || undefined,
                    sex: addForm.sex || undefined,
                    avatar: avatarUrl,
                    status: addForm.status === '1' ? 1 : 0,
                    roleId: addForm.roleId != null ? Number(addForm.roleId) : undefined,
                })
                ElMessage.success('保存成功')
            } else {
                let avatarUrl: string | undefined
                if (addAvatarFile.value) {
                    avatarUrl = await uploadToObs(addAvatarFile.value, 'avatar', 'put')
                }
                await addUser({
                    userName: addForm.userName,
                    nickName: addForm.nickName || undefined,
                    phoneNumber: addForm.phoneNumber || undefined,
                    email: addForm.email || undefined,
                    sex: addForm.sex || undefined,
                    avatar: avatarUrl,
                    password: addForm.password || undefined,
                    status: addForm.status === '1' ? 1 : 0,
                    roleId: addForm.roleId != null ? Number(addForm.roleId) : undefined,
                })
                ElMessage.success('新增成功')
            }
            addDialogVisible.value = false
            loadList()
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? e?.message
            const action = dialogMode.value === 'edit' ? '保存' : '新增'
            ElMessage.error(msg && typeof msg === 'string' ? msg : `${action}失败`)
        } finally {
            addSubmitting.value = false
        }
    })
}

function handleAddMember() {
    void openAddDialog()
}

function handleView(row: any) {
    viewUser.value = { ...row }
    viewDialogVisible.value = true
}

/** 打开编辑弹窗，复用新增表单样式并回填数据；用户账号不可编辑；头像有修改则保存时上传 */
async function handleEdit(row: any) {
    dialogMode.value = 'edit'
    const id = row.userId ?? row.id
    addForm.id = id
    addForm.userName = row.userName ?? ''
    addForm.nickName = row.nickName ?? ''
    addForm.phoneNumber = row.phoneNumber ?? row.phonenumber ?? ''
    addForm.email = row.email ?? ''
    addForm.sex = row.sex ?? ''
    addForm.roleId = row.role?.id ?? row.roleId ?? row.roles?.[0]?.id ?? row.roles?.[0]?.roleId
    addForm.status = row.status === '0' ? '1' : '0'
    addAvatarFile.value = null
    addAvatarFileList.value = []
    if (addAvatarPreviewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(addAvatarPreviewUrl.value)
    addAvatarPreviewUrl.value = row.avatar ? String(row.avatar) : ''
    addDialogVisible.value = true
    await loadRoleList()
}

onMounted(() => {
    loadList()
})
</script>

<style scoped>
:deep(.user-management-page.page-content) {
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

.filter-input--keyword {
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

.drama-table-block {
    position: relative;
    width: 100%;
}
.drama-table-block :deep(.el-loading-mask) {
    z-index: 2000;
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

.drama-table-block :deep(th.col-status),
.drama-table-block :deep(td.col-status) {
    min-width: 132px;
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

.upload-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
}
/* 用户头像行固定高度，避免选图后纵向抖动；标签与内容区垂直居中 */
:deep(.menu-add-dialog .form-item-avatar.el-form-item) {
    align-items: center;
}

:deep(.menu-add-dialog .form-item-avatar .el-form-item__label) {
    align-self: center;
    height: auto;
    line-height: 1.4;
    padding-top: 0;
    padding-bottom: 0;
}

:deep(.menu-add-dialog .form-item-avatar .el-form-item__content) {
    min-height: 72px;
    display: flex;
    align-items: center;
}

.avatar-field {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    height: 72px;
    min-height: 72px;
    box-sizing: border-box;
}

.user-avatar-pick-btn {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    width: 104px !important;
    height: 27px !important;
    min-height: 27px !important;
    padding: 0 !important;
    font-size: 12px !important;
    line-height: 1 !important;
    border-radius: 6px !important;
    background-color: #2d53eb !important;
    border-color: #2d53eb !important;
    color: #ffffff !important;
}

.user-avatar-pick-btn:hover,
.user-avatar-pick-btn:focus {
    background-color: #2447d4 !important;
    border-color: #2447d4 !important;
    color: #ffffff !important;
}

.avatar-preview-side {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
    height: 64px;
    min-height: 64px;
    box-sizing: border-box;
}

.avatar-preview-img {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid var(--el-border-color);
}

/* 查看用户：描述表样式（与菜单查看 panel 一致，单列排布不变） */
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
    width: 120px !important;
    min-width: 120px;
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

/* 弹窗外壳与角色管理 menu-add-dialog 一致 */
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

:deep(.menu-add-dialog .user-dialog-form .el-form-item) {
    margin-bottom: 18px;
}

:deep(.menu-add-dialog .user-dialog-form .el-form-item__label) {
    font-size: 13px;
    color: #303133;
}

:deep(.menu-add-dialog .user-dialog-form .el-input),
:deep(.menu-add-dialog .user-dialog-form .el-select) {
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
</style>
