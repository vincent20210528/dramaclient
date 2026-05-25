<template>
    <div class="welcome-container">
        <div class="welcome-content">
            <div class="logo-container">
                <img src="https://dramares.huntshorts.ai/imgs/logo_240.webp" alt="Logo" class="welcome-logo" />
            </div>
            <div class="title-container">
                <h1 class="welcome-title">HuntShorts</h1>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts" name="welcome">
import { onMounted } from 'vue'
import { usePermissStore } from '@/store/permiss'

const permiss = usePermissStore()

// 首页相关逻辑已注释，用户登录后默认进入统计概览页面
// onMounted(() => {
//     // 测试权限检查功能
//     if (permiss.allowedPaths.length > 0) {
//         const testPaths = [
//             '/welcome',
//             '/channel',
//             '/finance',
//             '/system/user',
//             'channel',
//             'finance',
//             'user',
//         ]

//         testPaths.forEach((testPath) => {
//             const hasPermission = permiss.hasPermission(testPath)
//         })
//     }
// })
</script>

<style scoped>
.welcome-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
}

.welcome-content {
    text-align: center;
    padding: 40px;
}

.logo-container {
    margin-bottom: 30px;
}

.welcome-logo {
    width: 200px;
    height: 200px;
    object-fit: contain;
}

.title-container {
    margin-top: 20px;
}

.welcome-title {
    display: inline-block;
    font-size: 61.5px;
    font-weight: 700;
    white-space: nowrap;
}
</style>
