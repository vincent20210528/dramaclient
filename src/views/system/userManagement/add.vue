<template>
    <page-content :title="title">
        <template v-slot:bottom>
            <el-card shadow="never">
                <el-form
                    ref="formRef"
                    :model="form"
                    :rules="rules"
                    label-width="100px"
                    style="max-width: 560px"
                    autocomplete="off"
                >
                    <el-form-item label="用户账号" prop="userName">
                        <el-input v-model="form.userName" placeholder="请输入登录账号" clearable />
                    </el-form-item>
                    <el-form-item label="用户姓名" prop="nickName">
                        <el-input v-model="form.nickName" placeholder="请输入用户姓名" clearable />
                    </el-form-item>
                    <el-form-item label="手机号码" prop="phoneNumber">
                        <el-input v-model="form.phoneNumber" placeholder="请输入手机号码" clearable />
                    </el-form-item>
                    <el-form-item label="用户邮箱" prop="email">
                        <el-input
                            v-model="form.email"
                            placeholder="请输入邮箱"
                            clearable
                            autocomplete="off"
                            name="user-email-new"
                        />
                    </el-form-item>
                    <el-form-item label="性别" prop="sex">
                        <el-select v-model="form.sex" placeholder="请选择" clearable style="width: 100%">
                            <el-option label="男" value="男" />
                            <el-option label="女" value="女" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="用户头像" prop="avatar">
                        <el-upload
                            :auto-upload="false"
                            :limit="1"
                            :on-change="onAvatarChange"
                            :on-remove="onAvatarRemove"
                            :file-list="avatarFileList"
                            accept=".png,.jpg,.jpeg,.webp"
                        >
                            <el-button type="primary" size="small">选择图片</el-button>
                        </el-upload>
                        <div v-if="avatarFileList.length" class="upload-tip">
                            已选：{{ avatarFileList[0]?.name }}，提交时将上传并创建用户
                        </div>
                    </el-form-item>
                    <el-form-item label="用户角色" prop="roleId">
                        <el-select
                            v-model="form.roleId"
                            placeholder="请选择角色"
                            clearable
                            style="width: 100%"
                        >
                            <el-option
                                v-for="r in roleList"
                                :key="r.id"
                                :label="r.roleName"
                                :value="r.id"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="登录密码" prop="password">
                        <el-input
                            v-model="form.password"
                            type="password"
                            placeholder="不填则默认与用户账号相同"
                            show-password
                            clearable
                            autocomplete="new-password"
                            name="user-password-new"
                        />
                    </el-form-item>
                    <el-form-item label="账号状态" prop="status">
                        <el-radio-group v-model="form.status">
                            <el-radio :value="1">正常</el-radio>
                            <el-radio :value="0">停用</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="handleSubmit" :loading="submitting">提交</el-button>
                        <el-button @click="goBack">取消</el-button>
                    </el-form-item>
                </el-form>
            </el-card>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'
import { addUser, getRolesPage } from '@/api'
import { uploadToObs, getFileExtension } from '@/utils/obsUpload'

const AVATAR_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

function isAllowedAvatarFile(file: File): boolean {
    return AVATAR_EXTENSIONS.includes(getFileExtension(file.name) as any)
}

const router = useRouter()

const title = {
    firstTitle: '添加成员',
    secondTitle: '',
}

const formRef = ref<FormInstance>()
const roleList = ref<any[]>([])
const submitting = ref(false)
const avatarFileList = ref<UploadFiles>([])
const avatarFile = ref<File | null>(null)

const form = reactive({
    userName: '',
    nickName: '',
    phoneNumber: '',
    email: '',
    sex: '' as string,
    avatar: '',
    password: '',
    roleId: undefined as number | undefined,
    status: 1 as number,
})

const rules: FormRules = {
    userName: [{ required: true, message: '请输入用户账号', trigger: 'blur' }],
    nickName: [{ required: true, message: '请输入用户姓名', trigger: 'blur' }],
}

function onAvatarChange(_file: UploadFile, files: UploadFiles) {
    avatarFileList.value = files
    avatarFile.value = files[0]?.raw ? (files[0].raw as File) : null
}

function onAvatarRemove() {
    avatarFileList.value = []
    avatarFile.value = null
}

async function loadRoles() {
    try {
        const res: any = await getRolesPage({ current: 1, size: 500 })
        const data = res?.data?.data ?? res?.data
        if (data?.records) {
            roleList.value = data.records
        } else {
            roleList.value = []
        }
    } catch {
        roleList.value = []
    }
}

async function handleSubmit() {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
        if (!valid) return
        if (avatarFile.value && !isAllowedAvatarFile(avatarFile.value)) {
            ElMessage.error('头像仅支持 png、jpg、jpeg、webp 格式')
            return
        }
        submitting.value = true
        try {
            let avatarUrl: string | undefined = form.avatar || undefined
            if (avatarFile.value) {
                avatarUrl = await uploadToObs(avatarFile.value, 'avatar', 'put')
            }
            await addUser({
                userName: form.userName,
                nickName: form.nickName || undefined,
                email: form.email || undefined,
                phoneNumber: form.phoneNumber || undefined,
                sex: form.sex || undefined,
                avatar: avatarUrl,
                password: form.password || undefined,
                status: form.status,
                roleId: form.roleId,
            })
            ElMessage.success('添加成功')
            router.push({ path: '/system/userManagement' })
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? e?.message
            ElMessage.error(msg && typeof msg === 'string' ? msg : '添加失败')
        } finally {
            submitting.value = false
        }
    })
}

function goBack() {
    router.push({ path: '/system/userManagement' })
}

onMounted(() => {
    loadRoles()
})
</script>

<style scoped>
.upload-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
}
</style>
