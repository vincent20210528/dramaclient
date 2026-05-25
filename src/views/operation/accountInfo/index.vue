<template>
    <page-content class="account-info-page operation-drama-page" :title="title">
        <template #bottom>
            <!-- 基本信息：单层 account-stat-card__body -->
            <div class="account-stat-card__body">
                <div class="account-stat-card__content">
                    <div class="account-stat-card__label">基本信息</div>
                    <div class="account-stat-card__hint">当前登录账号名称</div>
                    <div class="account-stat-card__value">{{ loginUserName }}</div>
                </div>
                <div v-if="canUpdatePassword" class="account-stat-card__aside">
                    <el-button type="primary" class="btn-query" @click="pwdDialogVisible = true"
                        >修改密码</el-button
                    >
                </div>
            </div>

            <!-- 应用列表：独立卡片 -->
            <el-card class="drama-main-card account-apps-card" shadow="never">
                <div class="detail-header">
                    <div class="detail-title">应用列表</div>
                </div>
                <div class="table-toolbar table-toolbar--solo">
                    <span />
                    <span class="toolbar-actions">
                        <el-icon class="toolbar-icon" @click="loadApps"><Refresh /></el-icon>
                    </span>
                </div>
                <div class="drama-table-block" v-loading="appsLoading">
                    <el-table
                        class="drama-op-table"
                        :data="apps"
                        style="width: 100%"
                        :scrollbar-always-on="true"
                    >
                        <el-table-column prop="appName" label="应用名称" min-width="160" align="center" show-overflow-tooltip />
                        <el-table-column prop="appPkg" label="包名" min-width="160" align="center" show-overflow-tooltip />
                        <el-table-column label="APPID" min-width="180" align="center" show-overflow-tooltip>
                            <template #default="{ row }">
                                <div class="secret-cell">
                                    <span class="secret-text" :title="row.appId">{{ row.appId }}</span>
                                    <el-button
                                        v-if="row.appId"
                                        link
                                        type="primary"
                                        :icon="CopyDocument"
                                        class="secret-copy-btn"
                                        @click="copyContent(row.appId)"
                                    />
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column label="APPSecret" min-width="220" align="center">
                            <template #default="{ row }">
                                <div class="secret-cell">
                                    <span class="secret-text" :title="row.appSecret">{{ row.appSecret }}</span>
                                    <el-button
                                        v-if="row.appSecretRaw"
                                        link
                                        type="primary"
                                        :icon="CopyDocument"
                                        class="secret-copy-btn"
                                        @click="copyContent(row.appSecretRaw)"
                                    />
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column label="licenseUrl" min-width="220" align="center">
                            <template #default="{ row }">
                                <div class="secret-cell">
                                    <span class="secret-text" :title="row.licenseUrl">{{ maskLicense(row.licenseUrl) }}</span>
                                    <el-button
                                        v-if="row.licenseUrl"
                                        link
                                        type="primary"
                                        :icon="CopyDocument"
                                        class="secret-copy-btn"
                                        @click="copyContent(row.licenseUrl)"
                                    />
                                </div>
                            </template>
                        </el-table-column>

                         <el-table-column label="licenseKey" min-width="220" align="center">
                            <template #default="{ row }">
                                <div class="secret-cell">
                                    <span class="secret-text" :title="row.licenseKey">{{ maskLicense(row.licenseKey,'key') }}</span>
                                    <el-button
                                        v-if="row.licenseKey"
                                        link
                                        type="primary"
                                        :icon="CopyDocument"
                                        class="secret-copy-btn"
                                        @click="copyContent(row.licenseKey)"
                                    />
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </el-card>

            <el-dialog
                v-model="pwdDialogVisible"
                title="修改密码"
                width="760px"
                align-center
                destroy-on-close
                class="menu-add-dialog"
                @close="resetPwdForm"
            >
                <el-form
                    ref="pwdFormRef"
                    :model="pwdForm"
                    :rules="pwdRules"
                    label-width="100px"
                    class="user-dialog-form"
                >
                    <el-form-item label="旧密码" prop="oldPassword">
                        <el-input
                            v-model="pwdForm.oldPassword"
                            type="password"
                            show-password
                            placeholder="请输入旧密码"
                            autocomplete="off"
                            clearable
                        />
                    </el-form-item>
                    <el-form-item label="新密码" prop="newPassword">
                        <el-input
                            v-model="pwdForm.newPassword"
                            type="password"
                            show-password
                            placeholder="请输入新密码"
                            autocomplete="off"
                            clearable
                        />
                    </el-form-item>
                    <el-form-item label="确认新密码" prop="confirmPassword">
                        <el-input
                            v-model="pwdForm.confirmPassword"
                            type="password"
                            show-password
                            placeholder="请再次输入新密码"
                            autocomplete="off"
                            clearable
                        />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="pwdDialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="pwdSubmitting" @click="onSubmitPwd">保存</el-button>
                </template>
            </el-dialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { CopyDocument, Refresh } from '@element-plus/icons-vue'
import { updatePassword } from '@/api'
import { getUserInfo } from '@/utils'
import { getDeveloperAppList } from '@/api/developer'
import { hasPerm, PERM_ACCOUNT } from '@/utils/permission'

const title = { firstTitle: '运营管理', secondTitle: '账户信息' }
const canUpdatePassword = computed(() => hasPerm(PERM_ACCOUNT.edit))

const userInfo = getUserInfo() as Record<string, unknown> | null | undefined

/** 基本信息大号展示：优先登录接口返回的 user_name */
const loginUserName = computed(() => {
    if (!userInfo) return '—'
    const u = userInfo as Record<string, unknown>
    const v = u.user_name ?? u.userName ?? u.username
    if (v === undefined || v === null || v === '') return '—'
    return String(v)
})

type AppRow = {
    appName: string
    appId: string
    appPkg: string
    /** 脱敏展示 */
    appSecret: string
    /** 完整密钥，用于复制 */
    appSecretRaw: string
    /**licenseUrl */
    licenseUrl: string
    licenseKey: string
}

const apps = ref<AppRow[]>([])
const appsLoading = ref(false)

function maskSecret(secret: string) {
    const s = String(secret ?? '')
    if (!s) return '--'
    if (s.length <= 8) return `${s.slice(0, 2)}***${s.slice(-2)}`
    return `${s.slice(0, 3)}***${s.slice(-3)}`
}

/**
 * 通用掩码工具
 * @param value  原始值：License链接 或 LicenseKey
 * @param type   'url'=许可证链接 | 'key'=许可证密钥
 */
function maskLicense(value: string | null | undefined, type: 'url' | 'key' ='url'): string {
  // 空值统一返回 --
  if (!value) return '--'

  // 1. 处理 License 链接
  if (type === 'url') {
    const match = value.match(/(https?:\/\/[^.]+)\..*(\.license)$/i)
    return match ? `${match[1]}.******${match[2]}` : value
  }

  // 2. 处理 License Key：前两位 + 掩码 + 后两位
  if (type === 'key') {
    // 长度不足4位，全部掩码中间部分
    if (value.length <= 4) {
      return value.slice(0, 2) + '*'.repeat(value.length - 2)
    }
    // 正常长度：前2位 + ******** + 后2位
    return value.slice(0, 2) + '********' + value.slice(-2)
  }

  return value
}

async function copyContent(raw: string) {
    const text = String(raw ?? '').trim()
    if (!text) {
        ElMessage.warning('暂无可复制内容')
        return
    }
    try {
        await navigator.clipboard.writeText(text)
        ElMessage.success('APPSecret 已复制')
    } catch {
        ElMessage.error('复制失败')
    }
}

const pwdDialogVisible = ref(false)
const pwdFormRef = ref<FormInstance>()
const pwdSubmitting = ref(false)

const pwdForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
})

const validateConfirm = (_rule: any, value: string, callback: (e?: Error) => void) => {
    if (value !== pwdForm.newPassword) callback(new Error('两次输入的新密码不一致'))
    else callback()
}

const pwdRules: FormRules = {
    oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '新密码长度至少 6 位', trigger: 'blur' },
    ],
    confirmPassword: [
        { required: true, message: '请再次输入新密码', trigger: 'blur' },
        { validator: validateConfirm, trigger: 'blur' },
    ],
}

function resetPwdForm() {
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
    pwdFormRef.value?.resetFields()
}

async function onSubmitPwd() {
    if (!pwdFormRef.value) return
    await pwdFormRef.value.validate(async (valid) => {
        if (!valid) return
        pwdSubmitting.value = true
        try {
            await updatePassword({
                oldPassword: pwdForm.oldPassword,
                newPassword: pwdForm.newPassword,
                confirmPassword: pwdForm.confirmPassword,
            })
            ElMessage.success('密码修改成功，请使用新密码重新登录')
            pwdDialogVisible.value = false
            resetPwdForm()
        } catch (e: any) {
            const msg = e?.response?.data?.message
            ElMessage.error(msg && typeof msg === 'string' ? msg : '修改失败')
        } finally {
            pwdSubmitting.value = false
        }
    })
}

async function loadApps() {
    appsLoading.value = true
    try {
        const res: any = await getDeveloperAppList()
        const records = res?.data?.data ?? []
        apps.value = (records as any[]).map((r: any): AppRow => {
            const raw = String(r?.appSecret ?? '')
            return {
                appName: String(r?.appName ?? '--'),
                appId: String(r?.appId ?? '--'),
                appPkg: String(r?.appPkg ?? '--'),
                appSecret: maskSecret(raw),
                appSecretRaw: raw,
                licenseUrl:String(r?.licenseUrl ?? '--'),
                licenseKey:String(r?.licenseKey ?? '--'),
            }
        })
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '加载应用列表失败')
        apps.value = []
    } finally {
        appsLoading.value = false
    }
}

onMounted(() => {
    void loadApps()
})
</script>

<style scoped>
:deep(.account-info-page.page-content) {
    background-color: #ffffff;
}

.operation-drama-page :deep(.page-content-body) {
    padding-top: 0;
}

.drama-main-card {
    border-radius: 20px;
    overflow: hidden;
}
.account-apps-card {
    margin-top: 20px;
}
.account-apps-card.drama-main-card :deep(.el-card__body) {
    padding: 12px 20px 20px;
    box-sizing: border-box;
}

/* 基本信息：单层卡片，左侧蓝色条 */
.account-stat-card__body {
    margin-top: 12px;
    box-sizing: border-box;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px 18px 24px;
    background: #ffffff;
    border-radius: 20px;
    border: 1px solid #ebeef5;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    position: relative;
    overflow: hidden;
}

.account-stat-card__body::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 15px;
    background: #2d53eb;
    border-radius: 20px 0 0 20px;
}

.account-stat-card__content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    flex: 1;
}

.account-stat-card__label {
    font-size: 14px;
    font-weight: 400;
    color: #303133;
    line-height: 1.4;
}

.account-stat-card__hint {
    font-size: 12px;
    color: #909399;
    line-height: 1.4;
}

.account-stat-card__value {
    font-size: 22px;
    font-weight: 700;
    color: #303133;
    line-height: 1.3;
    word-break: break-all;
}

.account-stat-card__aside {
    flex-shrink: 0;
    padding-top: 2px;
}

.btn-query {
    min-width: 88px;
    height: 34px;
    padding: 0 14px;
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

.detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 0;
}

.detail-title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
}

.table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0 8px;
    margin-top: 8px;
}

.table-toolbar--solo {
    padding-top: 0;
    margin-top: 4px;
}

.toolbar-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
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

.secret-cell {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    max-width: 100%;
}

.secret-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: #575757;
}

.secret-copy-btn {
    flex-shrink: 0;
    padding: 4px !important;
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

/* 与用户管理「添加成员」弹窗一致 */
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

:deep(.menu-add-dialog .user-dialog-form .el-input) {
    width: 100%;
}

:deep(.menu-add-dialog .el-input__wrapper) {
    min-height: 40px;
    border-radius: 10px;
    box-sizing: border-box;
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
