<template>
    <page-content class="developer-management-page operation-drama-page" :title="title">
        <template #bottom>
            <el-card class="drama-main-card" shadow="never">
                <el-form :model="searchForm" inline class="search-form search-form--single-row">
                    <el-form-item>
                        <el-select
                            v-model="searchForm.appPkg"
                            class="filter-select filter-select--app-pkg"
                            placeholder="全部应用"
                            aria-label="应用范围"
                            clearable
                            filterable
                            :loading="appOptionsLoading"
                            @focus="loadAppOptions"
                            @change="onSearchAppPkgChange"
                        >
                            <el-option label="全部应用" value="" />
                            <el-option
                                v-for="opt in allAppOptions"
                                :key="opt.value"
                                :label="opt.label"
                                :value="opt.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item class="search-form__actions">
                        <el-button v-if="canShowList" class="btn-query" type="primary" @click="handleSearch">查询</el-button>
                        <el-button class="btn-reset" @click="handleReset">重置</el-button>
                    </el-form-item>
                    <el-form-item class="search-form__add">
                        <el-button
                            v-if="canAddDeveloper"
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
                        :data="list"
                        style="width: 100%"
                        :scrollbar-always-on="true"
                    >
                    <el-table-column label="序号" width="80" align="center">
                        <template #default="{ $index }">
                            {{ (currentPage - 1) * pageSize + $index + 1 }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="phoneNumber" label="手机号码" min-width="130" show-overflow-tooltip />
                    <el-table-column prop="userName" label="开发者账号" min-width="140" show-overflow-tooltip />
                    <el-table-column label="关联的包名" min-width="200" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ Array.isArray(row.appPkgList) && row.appPkgList.length > 0 ? row.appPkgList.join('，') : '--' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="服务配置" min-width="180" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ formatServiceConfig(row) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="总流量配额" min-width="120" align="center" show-overflow-tooltip>
                        <template #default="{ row }">{{ formatFluxGbDisplay(row.totalFlux) }}</template>
                    </el-table-column>
                    <el-table-column label="已消耗流量" min-width="120" align="center" show-overflow-tooltip>
                        <template #default="{ row }">{{ formatFluxGbDisplay(row.usedFlux) }}</template>
                    </el-table-column>
                    <el-table-column label="流量余额" min-width="120" align="center" show-overflow-tooltip>
                        <template #default="{ row }">{{ formatFluxGbDisplay(getDeveloperRemainFluxGb(row)) }}</template>
                    </el-table-column>
                    <el-table-column label="操作" width="380" align="center" fixed="right">
                        <template #default="{ row }">
                            <div class="op-cell">
                                <el-button
                                    v-if="canAddTraffic"
                                    class="op-btn op-btn--edit"
                                    link
                                    @click="openAddFluxDialog(row)"
                                >
                                    添加流量包
                                </el-button>
                                <el-button class="op-btn op-btn--view" link @click="goTrafficDetails(row)">流量包详情</el-button>
                                <el-button
                                    v-if="canEditDeveloper"
                                    class="op-btn op-btn--edit"
                                    link
                                    @click="openEditDialog(row)"
                                >
                                    编辑
                                </el-button>
                                <el-button
                                    v-if="canDeleteDeveloper"
                                    class="op-btn op-btn--del"
                                    link
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
                        @size-change="handlePageSizeChange"
                        @current-change="handleCurrentChange"
                    />
                </div>
            </el-card>

            <!-- 新增/编辑开发者：与用户管理添加成员弹窗风格一致 -->
            <el-dialog
                v-model="devDialogVisible"
                :title="devDialogTitle"
                width="760px"
                align-center
                destroy-on-close
                class="menu-add-dialog"
                @close="resetDevForm"
            >
                <el-form ref="devFormRef" :model="devForm" :rules="devRules" label-width="100px" class="user-dialog-form">
                    <el-form-item label="包名" prop="appPkgList">
                        <el-select
                            v-model="devForm.appPkgList"
                            placeholder="请选择"
                            clearable
                            filterable
                            :loading="appOptionsLoading"
                            style="width: 100%"
                            multiple
                            collapse-tags
                            collapse-tags-tooltip
                        >
                            <el-option
                                v-for="opt in allAppOptions"
                                :key="opt.value"
                                :label="opt.label"
                                :value="opt.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="服务配置" prop="serviceId">
                        <el-select
                            v-model="devForm.serviceId"
                            placeholder="请选择服务配置"
                            clearable
                            filterable
                            :loading="serviceConfigLoading"
                            style="width: 100%"
                        >
                            <el-option
                                v-for="opt in serviceConfigOptions"
                                :key="opt.id"
                                :label="serviceConfigOptionLabel(opt)"
                                :value="opt.id"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="用户账号" prop="userName">
                        <el-input
                            v-model="devForm.userName"
                            placeholder="仅字母与数字"
                            clearable
                            :disabled="editingDevId != null"
                            @input="onUserNameInput"
                        />
                    </el-form-item>
                    <el-form-item label="用户昵称" prop="nickName">
                        <el-input v-model="devForm.nickName" placeholder="请输入" clearable />
                    </el-form-item>
                    <el-form-item label="手机号" prop="phoneNumber">
                        <el-input v-model="devForm.phoneNumber" placeholder="请输入" clearable />
                    </el-form-item>
                    <el-form-item label="邮箱" prop="email">
                        <el-input v-model="devForm.email" placeholder="请输入" clearable />
                    </el-form-item>
                    <el-form-item label="性别" prop="sex">
                        <el-select v-model="devForm.sex" placeholder="请选择" clearable style="width: 100%">
                            <el-option label="男" value="男" />
                            <el-option label="女" value="女" />
                        </el-select>
                    </el-form-item>
                    <el-form-item v-if="editingDevId == null" label="登录密码" prop="password">
                        <el-input v-model="devForm.password" type="password" show-password placeholder="不填则默认与用户账号相同" clearable />
                    </el-form-item>
                    <el-form-item label="账号状态" prop="status">
                        <el-radio-group v-model="devForm.status">
                            <el-radio :value="1">正常</el-radio>
                            <el-radio :value="0">停用</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="用户头像" prop="avatar" class="form-item-avatar">
                        <div class="avatar-field">
                            <el-upload
                                ref="avatarUploadRef"
                                v-model:file-list="avatarFileList"
                                :auto-upload="false"
                                :show-file-list="false"
                                :limit="1"
                                accept=".png,.jpg,.jpeg,.webp,.gif,.bmp"
                                :before-upload="beforeAvatarUpload"
                                :on-change="onAvatarChange"
                                :on-remove="onAvatarRemove"
                                :on-exceed="onAvatarExceed"
                            >
                                <el-button type="primary" class="user-avatar-pick-btn">选择图片</el-button>
                            </el-upload>
                            <div class="avatar-preview-side">
                                <template v-if="avatarPreviewUrl">
                                    <img :src="avatarPreviewUrl" class="avatar-preview-img" alt="头像预览" />
                                    <el-button type="danger" size="small" link @click="onAvatarRemove">移除</el-button>
                                </template>
                            </div>
                        </div>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="devDialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="devSubmitting" @click="submitDev">
                        {{ editingDevId != null ? '保存' : '确定' }}
                    </el-button>
                </template>
            </el-dialog>

            <!-- 添加流量包：与新增弹窗 menu-add-dialog 风格一致 -->
            <el-dialog
                v-model="fluxDialogVisible"
                title="添加流量包"
                width="760px"
                align-center
                destroy-on-close
                class="menu-add-dialog"
                @close="resetFluxForm"
            >
                <el-form
                    ref="fluxFormRef"
                    :model="fluxForm"
                    :rules="fluxRules"
                    label-width="100px"
                    class="user-dialog-form flux-add-form"
                >
                    <el-form-item label="开发者账号">
                        <el-input :model-value="fluxTarget?.userName ?? ''" readonly />
                    </el-form-item>
                    <el-form-item label="总流量配额">
                        <div class="flux-balance">
                            {{ fluxTotalGb }} GB
                        </div>
                    </el-form-item>
                    <el-form-item label="已消耗流量">
                        <div class="flux-balance">
                            {{ fluxUsedGb }} GB
                        </div>
                    </el-form-item>
                    <el-form-item label="流量余额">
                        <div class="flux-balance">
                            {{ fluxRemainGb }} GB
                        </div>
                    </el-form-item>
                    <el-form-item label="流量性质" prop="fluxType">
                        <el-radio-group v-model="fluxForm.fluxType">
                            <el-radio :value="1">付费流量</el-radio>
                            <el-radio :value="0">赠送流量</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="流量包(GB)" prop="fluxGb">
                        <el-input-number
                            v-model="fluxForm.fluxGb"
                            :min="0.01"
                            :step="1"
                            controls-position="right"
                            style="width: 100%"
                        />
                    </el-form-item>
                    <el-form-item label="快捷档位">
                        <el-button-group class="tier-group">
                            <el-button :type="fluxForm.fluxGb === 100 ? 'primary' : ''" @click="selectTier(100)">100G</el-button>
                            <el-button :type="fluxForm.fluxGb === 500 ? 'primary' : ''" @click="selectTier(500)">500G</el-button>
                            <el-button :type="fluxForm.fluxGb === 1000 ? 'primary' : ''" @click="selectTier(1000)">1T</el-button>
                            <el-button :type="fluxForm.fluxGb === 5000 ? 'primary' : ''" @click="selectTier(5000)">5T</el-button>
                            <el-button :type="fluxForm.fluxGb === 10000 ? 'primary' : ''" @click="selectTier(10000)">10T</el-button>
                        </el-button-group>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="fluxDialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="fluxSubmitting" @click="submitAddFlux">确定</el-button>
                </template>
            </el-dialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
    getAppList,
    getServicePackageConfigList,
    parseServicePackageType,
    servicePackageTypeLabel,
    type ServicePackageTypeCode,
} from '@/api/app'
import { addDeveloperAccount, deleteDeveloperAccount, getDevelopersPage, topUpDeveloperFlux, updateDeveloperAccount } from '@/api/developer'
import { uploadByPut } from '@/utils/obsUpload'
import { mapGetAppListToSelectOptions } from '@/utils/appSelectOptions'
import { hasPerm, PERM_DEVELOPER } from '@/utils/permission'

const canAddDeveloper = computed(() => hasPerm(PERM_DEVELOPER.add))
const canShowList = computed(() => hasPerm(PERM_DEVELOPER.list))
const canEditDeveloper = computed(() => hasPerm(PERM_DEVELOPER.edit))
const canDeleteDeveloper = computed(() => hasPerm(PERM_DEVELOPER.delete))
const canAddTraffic = computed(() => hasPerm(PERM_DEVELOPER.addAppTraffic))


type DevRow = {
    id: number
    phoneNumber: string
    userName: string
    appPkgList: string[]
    serviceId?: number
    servicePackageConfig?: {
        id?: number
        name?: string
        type?: ServicePackageTypeCode
    }
    nickName?: string
    email?: string
    sex?: string
    avatar?: string
    status?: number
    /** 已消耗流量（GB），用于计算剩余流量 */
    usedFlux?: number
    /** 总流量配额（GB），用于计算剩余流量 */
    totalFlux?: number
}

const router = useRouter()

const title = {
    firstTitle: '开发者管理',
    secondTitle: '管理开发者账号与流量包',
}

// ========== App 包名下拉（GET /api/apps/getAppList，进入页面即请求一次） ==========
const appOptionsLoading = ref(false)
const allAppOptions = ref<{ value: string; label: string; raw?: any }[]>([])

async function loadAppOptions() {
    if (allAppOptions.value.length > 0) return
    appOptionsLoading.value = true
    try {
        const res: any = await getAppList()
        allAppOptions.value = mapGetAppListToSelectOptions(res)
    } catch {
        allAppOptions.value = []
    } finally {
        appOptionsLoading.value = false
    }
}

/** 清空筛选时与播放统计一致：空字符串表示全部应用 */
function onSearchAppPkgChange(v: unknown) {
    if (v === null || v === undefined) {
        searchForm.appPkg = ''
    }
    handleSearch()
}

// ========== 开发者列表数据（来自 /api/developer/page） ==========
const list = ref<DevRow[]>([])
const loading = ref(false)
const total = ref(0)

const searchForm = reactive({
    /** 应用包名；空字符串为全部应用 */
    appPkg: '',
})

const currentPage = ref(1)
const pageSize = ref(10)

function handleSearch() {
    currentPage.value = 1
    void loadList()
}

function handleReset() {
    searchForm.appPkg = ''
    currentPage.value = 1
    void loadList()
}

function parseDeveloperFluxGb(v: unknown): number {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0
    if (typeof v === 'string') {
        const s = v.replace(/,/g, '')
        const match = s.match(/-?\d+(?:\.\d+)?/)
        if (match) {
            const n = Number(match[0])
            return Number.isFinite(n) ? n : 0
        }
    }
    return 0
}

function formatFluxGbDisplay(v: number | undefined): string {
    const n = Number(v ?? 0)
    if (!Number.isFinite(n)) return '--'
    return `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} GB`
}

function getDeveloperRemainFluxGb(row: DevRow): number {
    return Math.max(Number(row.totalFlux ?? 0) - Number(row.usedFlux ?? 0), 0)
}

function normalizeDeveloperRow(record: any): DevRow {
    const appPkgList: string[] = Array.isArray(record?.appPkgList)
        ? record.appPkgList
        : record?.appPkg
          ? [record.appPkg]
          : []
    const servicePackageConfig = record?.servicePackageConfig
    const nestedServiceId = Number(servicePackageConfig?.id)
    const nestedServiceType = parseServicePackageType(servicePackageConfig?.type)
    return {
        id: Number(record?.id ?? record?.developerId ?? Date.now()),
        phoneNumber: String(record?.phoneNumber ?? record?.phone ?? ''),
        userName: String(record?.userName ?? record?.developerUserName ?? ''),
        appPkgList,
        serviceId: Number.isFinite(nestedServiceId) && nestedServiceId > 0 ? nestedServiceId : undefined,
        servicePackageConfig: servicePackageConfig
            ? {
                id: Number.isFinite(nestedServiceId) && nestedServiceId > 0 ? nestedServiceId : undefined,
                name: servicePackageConfig?.name ? String(servicePackageConfig.name) : undefined,
                type: nestedServiceType,
            }
            : undefined,
        nickName: record?.nickName ?? record?.nick ?? undefined,
        email: record?.email ?? undefined,
        sex: record?.sex ?? undefined,
        avatar: record?.avatar ?? undefined,
        status: Number(record?.status ?? 1),
        usedFlux: parseDeveloperFluxGb(record?.usedFlux ?? record?.usedFluxGb),
        totalFlux: parseDeveloperFluxGb(record?.totalFlux ?? record?.totalFluxGb),
    }
}

async function loadList() {
    loading.value = true
    try {
        const res: any = await getDevelopersPage({
            current: currentPage.value,
            size: pageSize.value,
            appPkg: searchForm.appPkg?.trim() || undefined,
        })
        const data = res?.data?.data ?? res?.data ?? res
        const records = data?.records ?? data?.list ?? []
        list.value = (Array.isArray(records) ? records : []).map(normalizeDeveloperRow)
        total.value = Number(data?.total ?? list.value.length ?? 0)
    } catch {
        list.value = []
        total.value = 0
    } finally {
        loading.value = false
    }
}

function handlePageSizeChange() {
    currentPage.value = 1
    void loadList()
}

function handleCurrentChange() {
    void loadList()
}

// ========== 新增/编辑开发者 ==========
const devDialogVisible = ref(false)
const devSubmitting = ref(false)
const devFormRef = ref<FormInstance>()
const editingDevId = ref<number | null>(null)
/** 与用户管理一致：新增 / 编辑 */
const devDialogTitle = computed(() => (editingDevId.value == null ? '新增' : '编辑'))

const devForm = reactive({
    appPkgList: [] as string[],
    /** 仅新增时提交，对应服务配置 id */
    serviceId: undefined as number | undefined,
    userName: '',
    nickName: '',
    email: '',
    phoneNumber: '',
    sex: '',
    password: '',
    status: 1,
})

const serviceConfigOptions = ref<{ id: number; name: string; type?: ServicePackageTypeCode }[]>([])
const serviceConfigLoading = ref(false)

function serviceConfigOptionLabel(opt: { id: number; name: string; type?: ServicePackageTypeCode }) {
    const t = opt.type != null ? servicePackageTypeLabel(opt.type) : ''
    return t ? `${opt.name}（${t}）#${opt.id}` : `${opt.name} #${opt.id}`
}

function formatServiceConfig(row: DevRow) {
    const nestedId = Number(row.servicePackageConfig?.id)
    const sid = Number.isFinite(nestedId) && nestedId > 0 ? nestedId : undefined
    if (!sid) return '--'
    const matched = serviceConfigOptions.value.find((opt) => opt.id === sid)
    if (matched) return serviceConfigOptionLabel(matched)
    const name = row.servicePackageConfig?.name?.trim()
    const configType = row.servicePackageConfig?.type
    const typeText = configType ? servicePackageTypeLabel(configType) : ''
    if (name && typeText) return `${name}（${typeText}）#${sid}`
    if (name) return `${name} #${sid}`
    return `#${sid}`
}

async function loadServiceConfigOptions() {
    serviceConfigLoading.value = true
    try {
        const res: any = await getServicePackageConfigList()
        const body = res?.data ?? res
        const data = body?.data
        const raw = Array.isArray(data) ? data : Array.isArray(data?.records) ? data.records : []
        serviceConfigOptions.value = (raw as any[])
            .map((r: any) => ({
                id: Number(r?.id),
                name: String(r?.name ?? ''),
                type: parseServicePackageType(r?.type),
            }))
            .filter((x) => x.id > 0 && x.name)
    } catch {
        serviceConfigOptions.value = []
        ElMessage.error('服务配置列表加载失败')
    } finally {
        serviceConfigLoading.value = false
    }
}

const devRules: FormRules = {
    appPkgList: [{ required: true, message: '请选择包名', trigger: 'change' }],
    // serviceId: [
    //     {
    //         validator: (_rule, value, callback) => {
    //             if (editingDevId.value != null) {
    //                 callback()
    //                 return
    //             }
    //             const n = Number(value)
    //             if (value == null || value === '' || !Number.isFinite(n) || n < 1) {
    //                 callback(new Error('请选择服务配置'))
    //                 return
    //             }
    //             callback()
    //         },
    //         trigger: 'change',
    //     },
    // ],
    userName: [
        { required: true, message: '请输入用户账号', trigger: 'blur' },
        {
            pattern: /^[!-~]+$/,
            message: '用户账号只能由英文、数字及特殊字符组成（不含空格）',
            trigger: 'blur',
        },
    ],
}

function onUserNameInput(val: string) {
    // 允许英文/数字/特殊字符：仅保留可见 ASCII 字符（0x21-0x7E），过滤掉空格等不可见字符
    devForm.userName = String(val ?? '').replace(/[^!-~]/g, '')
}

const avatarUploadRef = ref<{ clearFiles?: () => void } | null>(null)
const avatarFileList = ref<Array<{ name: string; uid: number; url?: string }>>([])
const avatarFile = ref<File | null>(null)
const avatarPreviewUrl = ref('')

function isAllowedAvatarImage(file: File) {
    return /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)
}

function beforeAvatarUpload(file: File) {
    if (!isAllowedAvatarImage(file)) {
        ElMessage.error('请选择图片文件（png/jpg/jpeg/webp/gif/bmp）')
        return false
    }
    return true
}

function revokeAvatarPreview() {
    if (avatarPreviewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(avatarPreviewUrl.value)
    avatarPreviewUrl.value = ''
}

function onAvatarChange(file: any) {
    const raw: File | undefined = file?.raw
    if (!raw) return
    if (!beforeAvatarUpload(raw)) {
        avatarFile.value = null
        avatarFileList.value = []
        revokeAvatarPreview()
        avatarUploadRef.value?.clearFiles && avatarUploadRef.value.clearFiles()
        return
    }
    revokeAvatarPreview()
    avatarFile.value = raw
    avatarPreviewUrl.value = URL.createObjectURL(raw)
    avatarFileList.value = [{ name: raw.name, uid: (file?.uid ?? Date.now()) as number }]
    nextTick(() => {
        avatarFileList.value = [{ name: raw.name, uid: Date.now() }]
    })
}

function onAvatarExceed(files: File[]) {
    const raw = files?.[0]
    if (!raw) return
    if (!beforeAvatarUpload(raw)) return
    revokeAvatarPreview()
    avatarFile.value = raw
    avatarPreviewUrl.value = URL.createObjectURL(raw)
    avatarFileList.value = [{ name: raw.name, uid: Date.now() }]
}

function onAvatarRemove() {
    avatarFile.value = null
    avatarFileList.value = []
    revokeAvatarPreview()
    avatarUploadRef.value?.clearFiles && avatarUploadRef.value.clearFiles()
}

function resetDevForm() {
    editingDevId.value = null
    devForm.appPkgList = []
    devForm.serviceId = undefined
    devForm.userName = ''
    devForm.nickName = ''
    devForm.email = ''
    devForm.phoneNumber = ''
    devForm.sex = ''
    devForm.password = ''
    devForm.status = 1
    avatarFile.value = null
    avatarFileList.value = []
    revokeAvatarPreview()
    avatarUploadRef.value?.clearFiles && avatarUploadRef.value.clearFiles()
    devFormRef.value?.resetFields()
}

function openAddDialog() {
    resetDevForm()
    void loadServiceConfigOptions()
    devDialogVisible.value = true
}

function openEditDialog(row: DevRow) {
    resetDevForm()
    void loadServiceConfigOptions()
    editingDevId.value = row.id
    devForm.appPkgList = Array.isArray(row.appPkgList) ? [...row.appPkgList] : []
    devForm.serviceId = row.serviceId
    devForm.userName = row.userName
    devForm.nickName = row.nickName ?? ''
    devForm.email = row.email ?? ''
    devForm.phoneNumber = row.phoneNumber ?? ''
    devForm.sex = row.sex ?? ''
    devForm.password = ''
    devForm.status = row.status ?? 1

    // 回显已有头像：仅用于展示，不参与提交时上传
    if (row.avatar) {
        avatarPreviewUrl.value = row.avatar
        avatarFile.value = null
        avatarFileList.value = [{ name: '当前头像', uid: -1, url: row.avatar }]
    }

    devDialogVisible.value = true
}

async function submitDev() {
    if (!devFormRef.value) return
    const valid = await devFormRef.value.validate().catch(() => false)
    if (!valid) return
    devSubmitting.value = true
    try {
        let avatarUrl: string | undefined = undefined
        if (avatarFile.value) {
            avatarUrl = await uploadByPut(avatarFile.value, 'avatar')
        }

        // 新增：调用后端创建账号；编辑：当前仅做前端静态更新（后端更新接口未给出）
        if (editingDevId.value == null) {
            await addDeveloperAccount({
                userName: devForm.userName.trim(),
                nickName: devForm.nickName.trim() || undefined,
                email: devForm.email.trim() || undefined,
                phoneNumber: devForm.phoneNumber.trim() || undefined,
                sex: devForm.sex || undefined,
                avatar: avatarUrl,
                password: devForm.password || undefined,
                status: Number(devForm.status),
                appPkgList: devForm.appPkgList.map((s) => String(s).trim()).filter(Boolean),
                serviceId: Number(devForm.serviceId),
            })
            // 新增接口已给出：新增后刷新列表
            await loadList()
            ElMessage.success('新增成功')
        } else {
            await updateDeveloperAccount({
                id: editingDevId.value,
                userName: devForm.userName.trim(),
                nickName: devForm.nickName.trim() || undefined,
                email: devForm.email.trim() || undefined,
                phoneNumber: devForm.phoneNumber.trim() || undefined,
                sex: devForm.sex || undefined,
                avatar: avatarUrl,
                status: Number(devForm.status),
                appPkgList: devForm.appPkgList.map((s) => String(s).trim()).filter(Boolean),
                serviceId: devForm.serviceId ? Number(devForm.serviceId) : undefined,
            })
            await loadList()
            ElMessage.success('保存成功')
        }
        devDialogVisible.value = false
    } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '操作失败')
    } finally {
        devSubmitting.value = false
    }
}

// ========== 操作列 ==========
async function handleDelete(row: DevRow) {
    try {
        await ElMessageBox.confirm(`确定删除开发者账号「${row.userName}」吗？`, '提示', {
            type: 'warning',
            customClass: 'app-confirm-dialog',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showClose: true,
        })
    } catch {
        return
    }
    try {
        await deleteDeveloperAccount(row.id)
        await loadList()
        ElMessage.success('删除成功')
    } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '删除失败')
    }
}

function goTrafficDetails(row: DevRow) {
    router.push({
        name: 'developerTrafficDetails',
        query: {
            userName: row.userName,
            userId: row.id,
            appPkg: Array.isArray(row.appPkgList) ? row.appPkgList[0] : '',
        },
    })
}

// “添加流量包”先做占位弹窗（接口未给出）
const fluxDialogVisible = ref(false)
const fluxTarget = ref<DevRow | null>(null)
const fluxFormRef = ref<FormInstance>()
const fluxRemainGb = ref<number>(0)
const fluxTotalGb = ref<number>(0)
const fluxUsedGb = ref<number>(0)
const fluxSubmitting = ref(false)
const fluxForm = reactive({
    fluxType: 1,
    fluxGb: 1,
})
const fluxRules: FormRules = {
    fluxType: [{ required: true, message: '请选择流量性质', trigger: 'change' }],
    fluxGb: [{ required: true, message: '请输入流量包(GB)', trigger: 'change' }],
}

function resetFluxForm() {
    fluxTarget.value = null
    fluxRemainGb.value = 0
    fluxTotalGb.value = 0
    fluxUsedGb.value = 0
    fluxForm.fluxType = 1
    fluxForm.fluxGb = 1
    fluxFormRef.value?.resetFields()
}

function openAddFluxDialog(row: DevRow) {
    resetFluxForm()
    fluxTarget.value = row
    fluxTotalGb.value = Number(row.totalFlux ?? 0) || 0
    fluxUsedGb.value = Number(row.usedFlux ?? 0) || 0
    fluxRemainGb.value = Math.max(fluxTotalGb.value - fluxUsedGb.value, 0)
    fluxDialogVisible.value = true
}

function submitAddFlux() {
    if (!fluxTarget.value) return
    if (!fluxForm.fluxGb || fluxForm.fluxGb <= 0) {
        ElMessage.warning('请输入大于 0 的流量包')
        return
    }
    // 1=付费，2=赠送（后端）
    const type: 1 | 2 = fluxForm.fluxType === 1 ? 1 : 2
    const topUpFlux = Number(fluxForm.fluxGb)
    const topUpTime = formatDateTime(new Date())
    fluxSubmitting.value = true
    void topUpDeveloperFlux({
        userId: fluxTarget.value.id,
        topUpFlux,
        type,
        topUpTime,
    })
        .then(() => {
            ElMessage.success('充值成功')
            fluxDialogVisible.value = false
            void loadList()
        })
        .catch((e: any) => {
            const msg = e?.response?.data?.message ?? e?.message
            ElMessage.error(msg && typeof msg === 'string' ? msg : '充值失败')
        })
        .finally(() => {
            fluxSubmitting.value = false
        })
}

function formatDateTime(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    const ss = pad(d.getSeconds())
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

function selectTier(gb: number) {
    // 档位点击直接覆盖输入值，单位统一为 GB
    fluxForm.fluxGb = gb
}

onMounted(() => {
    void loadAppOptions()
    loadList()
})

onBeforeUnmount(() => {
    revokeAvatarPreview()
})
</script>

<style scoped>
:deep(.developer-management-page.page-content) {
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

.filter-select--app-pkg {
    width: 220px;
}

.drama-main-card :deep(.filter-select .el-select__wrapper) {
    min-height: 34px;
    padding: 0 10px;
    background-color: #edf1fc;
    border-radius: 8px;
    box-shadow: none !important;
    font-size: 12px;
}
.drama-main-card :deep(.filter-select .el-select__wrapper:hover),
.drama-main-card :deep(.filter-select .el-select__wrapper.is-focused) {
    box-shadow: none !important;
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

/* 与用户管理「添加成员」弹窗：头像行 + menu-add-dialog 外壳 */
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
    font-size: 14px;
    color: #303133;
}

:deep(.menu-add-dialog .user-dialog-form .el-input),
:deep(.menu-add-dialog .user-dialog-form .el-select) {
    width: 100%;
}

:deep(.menu-add-dialog .user-dialog-form .el-radio-group) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
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

/* 添加流量包：表单项标签与内容区上下居中 */
:deep(.menu-add-dialog .flux-add-form.el-form .el-form-item) {
    align-items: center;
}

:deep(.menu-add-dialog .flux-add-form .el-form-item__label) {
    align-self: center;
    height: auto;
    line-height: 1.4;
    padding-top: 0;
    padding-bottom: 0;
}

:deep(.menu-add-dialog .flux-add-form .el-form-item__content) {
    display: flex;
    align-items: center;
}

.tier-group {
    flex-wrap: wrap;
    gap: 8px;
}

.flux-balance {
    display: flex;
    align-items: center;
    min-height: 40px;
    box-sizing: border-box;
    font-size: 14px;
    color: #303133;
    font-weight: 600;
}
</style>

