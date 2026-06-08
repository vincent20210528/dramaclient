<template>
    <div class="login-bg" :style="{ '--ui-scale': uiScale }">
        <img
            class="login-bg-svg"
            src="@/assets/img/login-overseas-drama-bg.svg"
            alt=""
            aria-hidden="true"
        />
        <div class="login-container">
            <div class="login-header">
                <img class="login-icon" src="@/assets/img/logo_240.webp" alt="HuntShorts" />
                <div class="login-title">| 短剧管理平台</div>
            </div>
            <el-form :model="param" :rules="rules" ref="login" size="large">
                <el-form-item prop="userName">
                    <el-input v-model="param.userName" placeholder="请输入账号">
                        <template #prefix>
                            <img class="input-icon" src="@/assets/svg/login_account.svg" alt="" />
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item prop="password">
                    <el-input
                        :type="passwordVisible ? 'text' : 'password'"
                        placeholder="请输入密码"
                        v-model="param.password"
                        @keyup.enter="submitForm(login)"
                    >
                        <template #prefix>
                            <img class="input-icon" src="@/assets/svg/login_psw.svg" alt="" />
                        </template>
                        <template #suffix>
                            <el-icon class="cursor-pointer" @click="togglePasswordVisibility">
                                <View v-if="!passwordVisible" />
                                <Hide v-else />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                <el-button class="login-btn" type="primary" size="large" @click="submitForm(login)">登录</el-button>
                <div class="pwd-tips">
                    <el-checkbox class="pwd-checkbox" v-model="checked" label="记住密码" />
                </div>
            </el-form>
        </div>

        <div class="features-list">
            <div class="feature-item">
                <img class="feature-icon" src="@/assets/svg/login_bottom_1.svg" alt="" />
                <div class="feature-content">
                    <div class="feature-title">内容接入</div>
                    <div class="feature-desc">高效便捷的内容接入</div>
                </div>
            </div>
            <div class="feature-item">
                <img class="feature-icon" src="@/assets/svg/login_bottom_2.svg" alt="" />
                <div class="feature-content">
                    <div class="feature-title">短剧分发</div>
                    <div class="feature-desc">一站式短剧发布</div>
                </div>
            </div>
            <div class="feature-item">
                <img class="feature-icon" src="@/assets/svg/login_bottom_3.svg" alt="" />
                <div class="feature-content">
                    <div class="feature-title">数据统计</div>
                    <div class="feature-desc">多维度数据分析</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useTabsStore } from '@/store/tabs'
import { usePermissStore } from '@/store/permiss'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { loginApi } from '@/api'
import { setUserRoleId, startTokenCheck } from '@/utils'
import { useAutoLogin } from '@/utils/autoLogin'
import { getDefaultRedirectPath } from '@/utils/loginChecker'
import { getUserInfo, UserInfo } from '../../utils/remoteBridge'
import { View, Hide } from '@element-plus/icons-vue'

interface LoginInfo {
    userName: string
    password: string
}

const lgStr = localStorage.getItem('login-param')
const defParam = lgStr ? JSON.parse(lgStr) : null
const checked = ref(lgStr ? true : false)

const router = useRouter()
const param = reactive<LoginInfo>({
    userName: defParam ? (defParam.userName || defParam.phone) : '',
    password: defParam ? defParam.password : '',
})

const rules: FormRules = {
    userName: [
        {
            required: true,
            message: '请输入用户名',
            trigger: 'blur',
        },
    ],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}
const permiss = usePermissStore()
const login = ref<FormInstance>()

// 密码可见性控制
const passwordVisible = ref(false)

// UI 等比缩放（以 1920*1080 为基准）
const uiScale = ref(1)
const updateUiScale = () => {
    const baseW = 1920
    const baseH = 1080
    const w = window.innerWidth || baseW
    const h = window.innerHeight || baseH
    uiScale.value = Math.min(w / baseW, h / baseH)
}

// 切换密码可见性
const togglePasswordVisibility = () => {
    passwordVisible.value = !passwordVisible.value
}

onMounted(async () => {
    // 引入外部JS文件
    // const script = document.createElement('script');
    // script.src = 'https://lingdi-oss-develop.ld3.xyz/remoteBridge.js';
    // script.onload = () => {
    //     console.log('remoteBridge.js 加载成功');
    //     // 可以在这里使用 remoteBridge
    //     if (window.remoteBridge) {
    //         console.log('remoteBridge 可用:', window.remoteBridge);
    //         window.remoteBridge.getUserInfo().then(userInfo => {
    //             console.log('用户信息:', userInfo);
    //         }).catch(error => {
    //             console.error('获取用户信息失败:', error);
    //         });
    //     }
    // };

    updateUiScale()
    window.addEventListener('resize', updateUiScale, { passive: true })
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateUiScale)
})

const submitForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return
    formEl.validate((valid: boolean) => {
        if (!valid) {
            ElMessage.error('登录失败')
            return
        }

        const getLoginData = async () => {
            try {
                // 登录前清除旧的token，避免使用过期token
                localStorage.removeItem('agent_token')

                const res = await loginApi(param)
                if (res.status === 200 && res.data?.code === 200) {
                    ElMessage.success('登录成功')
                    console.log('手动登录成功...')
                    // 保存token
                    console.log('111', res.data.data)
                    localStorage.setItem('agent_token', res.data.data.token)

                    // 存储token过期时间（如果后端返回了的话）
                    if (res.data.data.expireTime) {
                        localStorage.setItem(
                            'token_expire_time',
                            res.data.data.expireTime.toString()
                        )
                    }

                    // 保存完整的用户信息（含 perms 权限列表，用于菜单与路由权限）
                    if (res.data.data.userInfo) {
                        localStorage.setItem(
                            'agent_user_info',
                            JSON.stringify(res.data.data.userInfo)
                        )
                        // 同步权限路径到 store，供路由守卫与其它逻辑使用
                        usePermissStore().setAllowedPathsFromPerms(res.data.data.userInfo.perms)
                    }

                    // 存储用户角色ID
                    if (
                        res.data.data.userInfo &&
                        res.data.data.userInfo.roles &&
                        res.data.data.userInfo.roles.length > 0
                    ) {
                        const roleId = res.data.data.userInfo.roles[0].roleId
                        setUserRoleId(roleId)
                    }

                    // 登录成功后获取菜单权限
                    try {
                        // console.log('手动登录成功...获取菜单权限')
                        // await permiss.fetchMenuPermissions()
                        // console.log('手动登录成功...获取菜单权限')
                        // 启动token检查

                        startTokenCheck()
                        router.push(getDefaultRedirectPath())
                    } catch (menuError) {
                        // console.error('获取菜单权限失败:', menuError)
                        // 如果获取菜单权限失败，仍然允许用户进入系统
                        startTokenCheck()
                        router.push(getDefaultRedirectPath())
                    }
                } else {
                    ElMessage.error('登录失败: ', res.data.data?.msg)
                }

                if (checked.value) {
                    localStorage.setItem('login-param', JSON.stringify(param))
                } else {
                    localStorage.removeItem('login-param')
                }
            } catch (error) {
                console.error('登录失败:', error)
                ElMessage.error('登录失败，请检查用户名和密码')
            }
        }

        getLoginData()
    })
}


const tabs = useTabsStore()
tabs.clearTabs()
</script>

<style scoped>
.login-bg {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100vh;
    padding: 0 24px;
    background: #0a1628;
    overflow: hidden;
}

.login-bg-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    z-index: 0;
}

.features-list {
    position: absolute;
    left: 50%;
    bottom: calc(130px * var(--ui-scale, 1));
    transform: translateX(-50%);
    display: flex;
    gap: 28px;
    align-items: center;
    z-index: 2;
}

.feature-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: calc(134px * var(--ui-scale, 1));
    height: calc(46px * var(--ui-scale, 1));
}

.feature-icon {
    flex-shrink: 0;
    width: calc(34px * var(--ui-scale, 1));
    height: calc(34px * var(--ui-scale, 1));
    display: inline-block;
}

.feature-content {
    width: 120px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
}

.feature-title {
    font-size: calc(22px * var(--ui-scale, 1));
    font-weight: 700;
    color: #5daaff;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
}

.feature-desc {
    font-size: calc(12px * var(--ui-scale, 1));
    color: #88bffc;
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
}

.login-header {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: 0;
    margin-bottom: calc(42px * var(--ui-scale, 1));
    width: 100%;
}

.login-icon {
    height: calc(70.65px * var(--ui-scale, 1));
    width: auto;
    max-width: calc(210.46px * var(--ui-scale, 1));
    object-fit: contain;
    display: block;
    margin: 0;
    padding: 0;
    flex-shrink: 0;
}

.login-title {
    width: auto;
    height: auto;
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    font-family: 'Resource Han Rounded CN-Bold', 'Source Han Sans CN', 'Microsoft YaHei', sans-serif;
    font-size: calc(24px * var(--ui-scale, 1));
    line-height: 1;
    white-space: nowrap;
    color: #2a2f3a;
    font-weight: 700;
    flex-shrink: 0;
}

.login-container {
    position: relative;
    z-index: 2;
    flex: 0 0 auto;
    width: calc(620px * var(--ui-scale, 1));
    height: calc(580px * var(--ui-scale, 1));
    border-radius: calc(20px * var(--ui-scale, 1));
    background: #fff;
    padding: calc(68px * var(--ui-scale, 1)) calc(60px * var(--ui-scale, 1)) calc(48px * var(--ui-scale, 1));
    box-sizing: border-box;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.login-container :deep(.el-form) {
    width: calc(471px * var(--ui-scale, 1));
}

.login-container :deep(.el-form-item) {
    margin-bottom: calc(33px * var(--ui-scale, 1));
}

.login-container :deep(.el-form-item:last-of-type) {
    margin-bottom: calc(52px * var(--ui-scale, 1));
}

.login-container :deep(.el-form-item__content) {
    width: 100%;
}

.login-container :deep(.el-input) {
    width: 100%;
}

.login-container :deep(.el-input__wrapper) {
    height: calc(80px * var(--ui-scale, 1));
    border-radius: calc(20px * var(--ui-scale, 1));
    padding: 0 calc(24px * var(--ui-scale, 1));
}

.login-container :deep(.el-input__inner) {
    height: 100%;
    line-height: calc(80px * var(--ui-scale, 1));
    font-size: calc(28px * var(--ui-scale, 1));
}

.login-container :deep(.el-input__prefix) {
    margin-right: calc(8px * var(--ui-scale, 1));
}

.pwd-tips {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    font-size: calc(28px * var(--ui-scale, 1));
    margin: calc(24px * var(--ui-scale, 1)) 0 0;
    color: #787878;
    width: 100%;
}

.pwd-checkbox {
    height: auto;
}

.login-btn {
    display: block;
    width: calc(471px * var(--ui-scale, 1));
    height: calc(80px * var(--ui-scale, 1));
    margin: 0 auto;
    border-radius: calc(20px * var(--ui-scale, 1));
    border: none;
    background: linear-gradient(90deg, #509bff 0%, #697dfc 50%, #9072ff 100%);
}

.login-text {
    display: flex;
    align-items: center;
    margin-top: 20px;
    font-size: 14px;
    color: #787878;
}

.cursor-pointer {
    cursor: pointer;
}

.input-icon {
    width: calc(32px * var(--ui-scale, 1));
    height: calc(32px * var(--ui-scale, 1));
    display: inline-block;
}

@media (max-width: 480px) {
    .login-container {
        width: 92vw;
        padding: 36px 22px 28px;
    }
    .features-list {
        gap: 14px;
        bottom: 16px;
    }
    .feature-content {
        width: 100px;
    }
}

</style>
