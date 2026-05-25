<template>
    <div class="wrapper">
        <v-header />
        <v-sidebar v-if="sidebarReady" />
        <div
            class="content-box"
            :class="{ 'content-collapse': sidebar.collapse }"
        >
            <div class="content">
                <router-view v-slot="{ Component }">
                    <transition name="move" mode="out-in">
                        <keep-alive :include="tabs.nameList">
                            <component :is="Component"></component>
                        </keep-alive>
                    </transition>
                </router-view>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useSidebarStore } from '@/store/sidebar'
import { useTabsStore } from '@/store/tabs'
import { usePermissStore } from '@/store/permiss'
import vHeader from '@/components/header.vue'
import vSidebar from '@/components/sidebar.vue'

const sidebar = useSidebarStore()
const tabs = useTabsStore()
const permiss = usePermissStore()
const route = useRoute()

/** 同步 keep-alive 缓存列表（原 tabs 组件逻辑） */
const setTags = (r: RouteLocationNormalizedLoaded) => {
    if (r.meta?.noTab === true) return
    const isExist = tabs.list.some((item) => item.path === r.fullPath)
    if (!isExist && r.meta?.title) {
        tabs.setTabsItem({
            name: String(r.name ?? ''),
            title: r.meta.title as string,
            path: r.fullPath,
        })
    }
}

watch(
    () => route.fullPath,
    () => setTags(route),
    { immediate: true }
)

// 侧边栏准备状态
const sidebarReady = ref(false)

// 组件挂载时
onMounted(async () => {

    // 检查是否需要清除权限数据（用户切换场景）
    const currentUserInfo = localStorage.getItem('agent_user_info')
    if (currentUserInfo) {
        try {
            const userInfo = JSON.parse(currentUserInfo)
            const lastUserId = localStorage.getItem('last_user_id')
            const currentUserId = userInfo.id || userInfo.userId

            // 如果用户ID发生变化，说明是用户切换，需要清除权限数据
            if (lastUserId && lastUserId !== currentUserId.toString()) {
                // permiss.clearPermissions();
            }

            // 更新最后登录的用户ID
            localStorage.setItem('last_user_id', currentUserId.toString())
        } catch (error) {
            console.error('解析用户信息失败:', error)
        }
    }

    // 直接显示侧边栏，让侧边栏自己负责获取权限数据
    sidebarReady.value = true
})
</script>

<style>
.wrapper {
    height: 100vh;
    overflow: hidden;
}

.content-box {
    position: absolute;
    left: 250px;
    right: 0;
    top: 60px;
    bottom: 0;
    padding-bottom: 0;
    display: flex;
    flex-direction: column;
    -webkit-transition: left 0.3s ease-in-out;
    transition: left 0.3s ease-in-out;
    background: #f9fafb;
    overflow: hidden;
}

.content {
    width: auto;
    flex: 1;
    overflow-y: auto;
    box-sizing: border-box;
    padding-bottom: 30px;
}

.content::-webkit-scrollbar {
    width: 0;
}

.content-collapse {
    left: 64px;
}

</style>
