<template>
    <div class="empty-page">
        <div class="loading-container">
            <el-icon class="loading-icon" :size="48">
                <Loading />
            </el-icon>
            <p class="loading-text">{{ loadingText }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElIcon } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { handleLoginCheck } from '@/utils/loginChecker'
import { getDefaultRedirectPath } from '@/utils/loginChecker'
import { usePermissStore } from '@/store/permiss'
import { isTokenValid } from '@/utils/index'

const router = useRouter()
const permiss = usePermissStore()
const isChecking = ref(true)
const loadingText = ref('正在检测登录状态...')
const hasStartedCheck = ref(false) // 防止重复执行
const hasRedirected = ref(false) // 防止重复跳转

// 销毁当前实例的页面元素
const destroyCurrentInstance = () => {
    const emptyPageElement = document.querySelector('.empty-page')
    if (emptyPageElement) {
        emptyPageElement.remove()
        console.log('销毁当前实例的页面元素')
    }
}

// 创建响应式的 localStorage 监听
const localStorageState = ref({
    token: localStorage.getItem('agent_token'),
    userInfo: localStorage.getItem('agent_user_info'),
})

// 监听 localStorage 变化
const checkLocalStorage = () => {
    const newToken = localStorage.getItem('agent_token')
    const newUserInfo = localStorage.getItem('agent_user_info')

    // 检查是否有变化
    if (
        newToken !== localStorageState.value.token ||
        newUserInfo !== localStorageState.value.userInfo
    ) {
        localStorageState.value = {
            token: newToken,
            userInfo: newUserInfo,
        }
    }
}

// 使用 watch 监听 localStorage 状态变化
watch(
    localStorageState,
    async (newState) => {
        if (hasRedirected.value) return // 防止重复跳转

        console.log('localStorage 状态变化:', newState)

        // 检查是否有有效的 token 和 user_info
        if (isTokenValid()) {
            const redirectPath = getDefaultRedirectPath()
            console.log('检测到有效的 token 和 user_info，立即跳转到:', redirectPath)
            hasRedirected.value = true
            loadingText.value = '正在跳转...'

            try {
                // 确保权限获取完成
                if (permiss.allowedPaths.length === 0) {
                    console.log('等待权限获取完成...')
                    await permiss.fetchMenuPermissions()
                }

                // 确保基本权限存在
                permiss.ensureBasicPermissions()

                // 延迟一下确保权限数据已更新
                await nextTick()
                setTimeout(() => {
                    router.push(redirectPath)
                }, 100)
            } catch (error) {
                console.error('权限获取失败:', error)
                // 即使权限获取失败，也按当前登录态可解析的默认页跳转
                router.push(redirectPath)
            }
        }
    },
    { deep: true, immediate: true }
)

// 设置定时器定期检查 localStorage
let localStorageCheckInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
    // 防止重复执行
    if (hasStartedCheck.value) {
        console.log('登录检测已开始，跳过重复执行')
        return
    }

    hasStartedCheck.value = true

    // 启动 localStorage 监听
    localStorageCheckInterval = setInterval(checkLocalStorage, 100) // 每100ms检查一次

    try {
        console.log('开始检测登录状态...')

        // 使用统一的登录检测工具
        const result = await handleLoginCheck()

        if (result.success) {
            console.log('登录检测成功，跳转到:', result.redirectPath)
            router.push(result.redirectPath)
        } else {
            console.log('登录检测失败，跳转到:', result.redirectPath)
            router.push(result.redirectPath)
        }
    } catch (error) {
        console.error('登录状态检测失败:', error)
        router.push('/login')
    } finally {
        isChecking.value = false
    }
})

// 组件卸载时重置状态
onUnmounted(() => {
    hasStartedCheck.value = false
    isChecking.value = true
    hasRedirected.value = false

    // 清除定时器
    if (localStorageCheckInterval) {
        clearInterval(localStorageCheckInterval)
        localStorageCheckInterval = null
    }
})
</script>

<style scoped>
.empty-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    opacity: 0;
}

.loading-container {
    text-align: center;
    color: white;
}

.loading-icon {
    animation: rotate 2s linear infinite;
    margin-bottom: 20px;
}

.loading-text {
    font-size: 18px;
    margin: 0;
    opacity: 0.9;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>
