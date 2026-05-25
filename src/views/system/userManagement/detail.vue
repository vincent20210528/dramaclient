<template>
    <page-content :title="pageTitle">
        <template v-slot:bottom>
            <el-card v-loading="loading" shadow="never">
                <template v-if="!user">
                    <el-empty description="用户不存在或已删除" />
                </template>
                <template v-else>
                    <!-- 查看模式 -->
                    <template v-if="!isEdit">
                        <el-descriptions :column="2" border>
                            <el-descriptions-item label="用户账号">{{ user.userName }}</el-descriptions-item>
                            <el-descriptions-item label="用户昵称">{{ user.nickName }}</el-descriptions-item>
                            <el-descriptions-item label="手机号码">{{ user.phonenumber }}</el-descriptions-item>
                            <el-descriptions-item label="用户邮箱">{{ user.email || '--' }}</el-descriptions-item>
                            <el-descriptions-item label="用户角色">{{ getRoleName(user) }}</el-descriptions-item>
                            <el-descriptions-item label="账号状态">
                                <el-tag :type="user.status === '0' ? 'success' : 'danger'">
                                    {{ user.status === '0' ? '正常' : '停用' }}
                                </el-tag>
                            </el-descriptions-item>
                            <el-descriptions-item label="加入时间" :span="2">{{ user.createTime || '--' }}</el-descriptions-item>
                        </el-descriptions>
                        <div class="form-actions">
                            <el-button @click="goBack">返回</el-button>
                            <el-button type="primary" @click="isEdit = true">编辑</el-button>
                        </div>
                    </template>
                    <!-- 编辑模式 -->
                    <el-form v-else ref="formRef" :model="editForm" :rules="editRules" label-width="100px" style="max-width: 560px">
                        <el-form-item label="用户账号">
                            <el-input v-model="editForm.userName" disabled />
                        </el-form-item>
                        <el-form-item label="用户昵称" prop="nickName">
                            <el-input v-model="editForm.nickName" placeholder="请输入成员姓名/昵称" clearable />
                        </el-form-item>
                        <el-form-item label="手机号码" prop="phonenumber">
                            <el-input v-model="editForm.phonenumber" placeholder="请输入手机号码" clearable />
                        </el-form-item>
                        <el-form-item label="用户邮箱" prop="email">
                            <el-input v-model="editForm.email" placeholder="请输入邮箱" clearable />
                        </el-form-item>
                        <el-form-item label="用户角色" prop="roleIds">
                            <el-select v-model="editForm.roleIds" placeholder="请选择角色" clearable multiple style="width: 100%">
                                <el-option v-for="r in roleList" :key="r.roleId" :label="r.roleName" :value="r.roleId" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="账号状态" prop="status">
                            <el-radio-group v-model="editForm.status">
                                <el-radio value="0">正常</el-radio>
                                <el-radio value="1">停用</el-radio>
                            </el-radio-group>
                        </el-form-item>
                        <div class="form-actions">
                            <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
                            <el-button @click="cancelEdit">取消</el-button>
                        </div>
                    </el-form>
                </template>
            </el-card>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getUserDetail, updateUser, getRoleList } from '@/api'

const route = useRoute()
const router = useRouter()

const pageTitle = ref({ firstTitle: '用户详情', secondTitle: '' })
const user = ref<any>(null)
const loading = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const roleList = ref<any[]>([])

const editForm = reactive({
    userId: undefined as any,
    userName: '',
    nickName: '',
    phonenumber: '',
    email: '',
    roleIds: [] as number[],
    status: '0',
})

const editRules: FormRules = {
    nickName: [{ required: true, message: '请输入用户昵称', trigger: 'blur' }],
    phonenumber: [{ required: true, message: '请输入手机号码', trigger: 'blur' }],
}

const mode = computed(() => (route.query.mode as string) || 'view')

function getRoleName(row: any) {
    if (row.roles && row.roles.length > 0) {
        return row.roles.map((r: any) => r.roleName).join('、')
    }
    return row.roleName || '--'
}

function syncEditForm() {
    if (!user.value) return
    const u = user.value
    editForm.userId = u.userId
    editForm.userName = u.userName
    editForm.nickName = u.nickName ?? ''
    editForm.phonenumber = u.phonenumber ?? ''
    editForm.email = u.email ?? ''
    editForm.status = u.status ?? '0'
    if (u.roles && u.roles.length) {
        editForm.roleIds = u.roles.map((r: any) => r.roleId)
    } else {
        editForm.roleIds = u.roleIds ? (Array.isArray(u.roleIds) ? u.roleIds : [u.roleIds]) : []
    }
}

async function loadRoles() {
    try {
        const res: any = await getRoleList({ pageNum: 1, pageSize: 500 })
        const data = res?.data
        if (data?.rows) roleList.value = data.rows
        else if (data?.data?.list) roleList.value = data.data.list
        else roleList.value = []
    } catch {
        roleList.value = []
    }
}

async function loadUser() {
    const id = route.query.id
    if (!id) {
        user.value = null
        return
    }
    loading.value = true
    try {
        const res: any = await getUserDetail(Number(id))
        const data = res?.data
        user.value = data?.data ?? data ?? null
        if (user.value) {
            syncEditForm()
            isEdit.value = mode.value === 'edit'
        }
    } catch (e) {
        user.value = null
    } finally {
        loading.value = false
    }
}

function cancelEdit() {
    isEdit.value = false
    syncEditForm()
}

async function handleSave() {
    if (!formRef.value || !user.value) return
    await formRef.value.validate(async (valid) => {
        if (!valid) return
        saving.value = true
        try {
            await updateUser({
                ...user.value,
                ...editForm,
                roleIds: editForm.roleIds,
            })
            ElMessage.success('保存成功')
            isEdit.value = false
            loadUser()
        } catch (e) {
            ElMessage.error('保存失败')
        } finally {
            saving.value = false
        }
    })
}

function goBack() {
    router.push({ path: '/system/userManagement' })
}

watch(() => route.query.id, loadUser, { immediate: true })
onMounted(() => {
    loadRoles()
    if (!route.query.id) goBack()
})
</script>

<style scoped>
.form-actions {
    margin-top: 24px;
}
</style>
