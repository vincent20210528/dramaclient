<template>
    <div>
        <div class="user-container">
            <el-card class="user-profile" shadow="hover" :body-style="{ padding: '0px' }">
                <div class="user-profile-bg"></div>
                <div class="user-avatar-wrap">
                    <el-avatar class="user-avatar" :size="120" fit="cover" :src="userAvatarSrc" />
                </div>
                <div class="user-info">
                    <div class="info-name">{{ name }}</div>
                </div>
            </el-card>
            <el-card
                class="user-content"
                shadow="hover"
                :body-style="{ padding: '20px 50px', height: '100%', boxSizing: 'border-box' }"
            >
                <el-tabs tab-position="left" v-model="activeName">
                    <el-tab-pane v-if="false" name="label1" label="消息通知" class="user-tabpane">
                        <TabsComp />
                    </el-tab-pane>
                    <el-tab-pane v-if="false" name="label2" label="我的头像" class="user-tabpane">
                        <div class="crop-wrap" v-if="activeName === 'label2'">
                            <vueCropper
                                ref="cropper"
                                :img="imgSrc"
                                :autoCrop="true"
                                :centerBox="true"
                                :full="true"
                                mode="contain"
                            >
                            </vueCropper>
                        </div>
                        <el-button class="crop-demo-btn" type="primary"
                            >选择图片
                            <input class="crop-input" type="file" name="image" accept="image/*" @change="setImage" />
                        </el-button>
                        <el-button type="success" @click="saveAvatar">上传并保存</el-button>
                    </el-tab-pane>
                    <el-tab-pane name="label3" label="修改密码" class="user-tabpane">
                        <el-form
                            ref="pwdFormRef"
                            class="w500"
                            label-position="top"
                            :model="form"
                            :rules="pwdRules"
                        >
                            <el-form-item label="旧密码" prop="old">
                                <el-input
                                    v-model="form.old"
                                    type="password"
                                    placeholder="请输入旧密码"
                                    show-password
                                    clearable
                                    autocomplete="off"
                                />
                            </el-form-item>
                            <el-form-item label="新密码" prop="new">
                                <el-input
                                    v-model="form.new"
                                    type="password"
                                    placeholder="请输入新密码"
                                    show-password
                                    clearable
                                    autocomplete="off"
                                />
                            </el-form-item>
                            <el-form-item label="确认新密码" prop="new1">
                                <el-input
                                    v-model="form.new1"
                                    type="password"
                                    placeholder="请再次输入新密码"
                                    show-password
                                    clearable
                                    autocomplete="off"
                                />
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" :loading="pwdSubmitting" @click="onSubmit">
                                    保存
                                </el-button>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>
                </el-tabs>
            </el-card>
        </div>
    </div>
</template>

<script setup lang="ts" name="ucenter">
import { reactive, ref, computed } from 'vue'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import TabsComp from '../element/tabs.vue'
import { getUserInfo } from '@/utils'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { updatePassword } from '@/api'

const defaultAvatar = 'https://dramares.huntshorts.ai/imgs/img.jpg'
// 登录后 userInfo.userName（与后端字段一致）
const name = computed(() => {
    const userInfo = getUserInfo()
    const v = userInfo?.userName ?? userInfo?.username ?? userInfo?.name
    return v != null && String(v).trim() !== '' ? String(v).trim() : '用户'
})

// 左侧头像：与主界面一致，有用户头像 URL 则用，否则默认图
const userAvatarSrc = computed(() => {
    const userInfo = getUserInfo()
    const url = userInfo?.avatar
    return url && typeof url === 'string' && url.trim() ? url.trim() : defaultAvatar
})

const form = reactive({
    old: '',
    new: '',
    new1: '',
})
const pwdFormRef = ref<FormInstance>()
const pwdSubmitting = ref(false)

const validateConfirm = (_rule: any, value: string, callback: (e?: Error) => void) => {
    if (value !== form.new) callback(new Error('两次输入的新密码不一致'))
    else callback()
}

const pwdRules: FormRules = {
    old: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
    new: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '新密码长度至少 6 位', trigger: 'blur' },
    ],
    new1: [
        { required: true, message: '请再次输入新密码', trigger: 'blur' },
        { validator: validateConfirm, trigger: 'blur' },
    ],
}

async function onSubmit() {
    if (!pwdFormRef.value) return
    await pwdFormRef.value.validate(async (valid) => {
        if (!valid) return
        pwdSubmitting.value = true
        try {
            await updatePassword({
                oldPassword: form.old,
                newPassword: form.new,
                confirmPassword: form.new1,
            })
            ElMessage.success('密码修改成功，请使用新密码重新登录')
            form.old = ''
            form.new = ''
            form.new1 = ''
            pwdFormRef.value?.resetFields()
        } catch (e: any) {
            const msg = e?.response?.data?.message
            ElMessage.error(msg && typeof msg === 'string' ? msg : '修改失败')
        } finally {
            pwdSubmitting.value = false
        }
    })
}

const activeName = ref('label3');

const imgSrc = ref(defaultAvatar);
const cropImg = ref('');
const cropper: any = ref();

const setImage = (e: any) => {
    const file = e.target.files[0];
    if (!file.type.includes('image/')) {
        return;
    }
    const reader = new FileReader();
    reader.onload = (event: any) => {
        imgSrc.value = event.target.result;
        cropper.value && cropper.value.replace(event.target.result);
    };
    reader.readAsDataURL(file);
};

const cropImage = () => {
    cropImg.value = cropper.value?.getCroppedCanvas().toDataURL();
};

const saveAvatar = () => {
    cropImage();
    // 持久化需对接上传接口并回写 agent_user_info.avatar
};
</script>

<style scoped>
.user-container {
    display: flex;
}

.user-profile {
    position: relative;
}

.user-profile-bg {
    width: 100%;
    height: 200px;
    background-image: url('https://dramares.huntshorts.ai/imgs/ucenter-bg.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

.user-profile {
    width: 500px;
    margin-right: 20px;
    flex: 0 0 auto;
    align-self: flex-start;
}

.user-avatar-wrap {
    position: absolute;
    top: 135px;
    width: 100%;
    text-align: center;
}

.user-avatar {
    border: 5px solid #fff;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 7px 12px 0 rgba(62, 57, 107, 0.16);
}

.user-avatar :deep(img) {
    object-fit: cover;
}

.user-info {
    text-align: center;
    padding: 80px 0 30px;
}

.info-name {
    margin: 0 0 20px;
    font-size: 22px;
    font-weight: 500;
    color: #373a3c;
}

.info-desc {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 5px;
}

.info-desc,
.info-desc a {
    font-size: 18px;
    color: #55595c;
}

.info-icon {
    margin-top: 10px;
}

.info-icon i {
    font-size: 30px;
    margin: 0 10px;
    color: #343434;
}

.user-content {
    flex: 1;
}

.user-tabpane {
    padding: 10px 20px;
}

.crop-wrap {
    width: 600px;
    height: 350px;
    margin-bottom: 20px;
}

.crop-demo-btn {
    position: relative;
}

.crop-input {
    position: absolute;
    width: 100px;
    height: 40px;
    left: 0;
    top: 0;
    opacity: 0;
    cursor: pointer;
}

.w500 {
    width: 500px;
}

.user-footer {
    display: flex;
    border-top: 1px solid rgba(83, 70, 134, 0.1);
}

.user-footer-item {
    padding: 20px 0;
    width: 33.3333333333%;
    text-align: center;
}

.user-footer > div + div {
    border-left: 1px solid rgba(83, 70, 134, 0.1);
}
</style>

<style>
.el-tabs.el-tabs--left {
    height: 100%;
}
</style>
