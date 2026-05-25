<template>
    <div class="header" :class="{ 'is-collapsed': sidebar.collapse }">
        <!-- 折叠按钮 -->
        <div class="header-left">
            <img class="logo" :src="logoNew" alt="HuntShorts" />
            <div class="web-title" v-show="!sidebar.collapse">| 短剧管理平台</div>
        </div>
        <div class="header-right">
            <div class="header-right-main">
                <div class="collapse-btn" @click="collapseChage">
                    <el-icon v-if="sidebar.collapse" color="#2a2f3a">
                        <Expand />
                    </el-icon>
                    <el-icon v-else color="#2a2f3a">
                        <Fold />
                    </el-icon>
                </div>
                <nav v-if="breadcrumb.current" class="header-breadcrumb" aria-label="当前位置">
                    <template v-if="breadcrumb.parent">
                        <span class="breadcrumb-parent">{{ breadcrumb.parent }}</span>
                        <span class="breadcrumb-sep"> / </span>
                    </template>
                    <span class="breadcrumb-current">{{ breadcrumb.current }}</span>
                </nav>
            </div>
            <div class="header-user-con">
                <!-- 隐藏设置主题按钮 -->
                <!-- <div class="btn-icon" @click="router.push('/theme')">
                    <el-tooltip effect="dark" content="设置主题" placement="bottom">
                        <i class="el-icon-lx-skin"></i>
                    </el-tooltip>
                </div> -->
                <!-- 隐藏消息提醒按钮 -->
                <!-- <div class="btn-icon" @click="router.push('/ucenter')">
                    <el-tooltip effect="dark" :content="message ? `有${message}条未读消息` : `消息中心`" placement="bottom">
                        <i class="el-icon-lx-notice"></i>
                    </el-tooltip>
                    <span class="btn-bell-badge" v-if="message"></span>
                </div> -->
                <!-- 隐藏全屏按钮 -->
                <!-- <div class="btn-icon" @click="setFullScreen">
                    <el-tooltip effect="dark" content="全屏" placement="bottom">
                        <i class="el-icon-lx-full"></i>
                    </el-tooltip>
                </div> -->
                <div class="bell-wrapper" @click="openMessageCenter">
                    <el-tooltip
                        effect="dark"
                        :content="unreadCount > 0 ? unreadText : '消息中心'"
                        placement="bottom"
                    >
                        <el-badge
                            :value="unreadCount"
                            :max="99"
                            :hidden="unreadCount <= 0"
                            class="cursor-pointer bell-notify"
                        >
                            <Bell class="bell-icon" />
                        </el-badge>
                    </el-tooltip>
                </div>
                <!-- 用户头像：优先使用用户头像地址，无则使用默认图 -->
                <el-avatar class="user-avator" :size="30" :src="userAvatar" />

                <!-- 用户名下拉菜单 -->
                <el-dropdown class="user-name" trigger="click" @command="handleCommand">
                    <span class="el-dropdown-link">
                        {{ username }}
                        <el-icon class="el-icon--right">
                            <arrow-down />
                        </el-icon>
                    </span>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <!-- <a href="https://github.com/lin-xin/vue-manage-system" target="_blank">
                                <el-dropdown-item>项目仓库</el-dropdown-item>
                            </a>
                            <a href="https://lin-xin.gitee.io/example/vuems-doc/" target="_blank">
                                <el-dropdown-item>官方文档</el-dropdown-item>
                            </a> -->
                            <el-dropdown-item command="user">个人中心</el-dropdown-item>
                            <el-dropdown-item divided command="loginout">退出登录</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useSidebarStore } from '../store/sidebar'
import { usePermissStore } from '../store/permiss'
import { useRoute, useRouter } from 'vue-router'
import { getMenuBreadcrumb } from './menu'
import { Bell } from '@element-plus/icons-vue'
import { removeUserRoleId, stopTokenCheck, getUserInfo, clearUserData } from '../utils'
import { useMessageStore } from '../store/message'
import { logoutApi } from '../api'
import logoNew from '@/assets/img/logo_new.png'

const defaultAvatar = 'https://dramares.huntshorts.ai/imgs/img.jpg'
const messageStore = useMessageStore()

// 从用户信息中获取用户名（响应式）
const username = computed(() => {
    const userInfo = getUserInfo()
    return userInfo?.username || userInfo?.name || '用户'
})

// 用户头像：有则用用户头像地址，无则用默认图
const userAvatar = computed(() => {
    const userInfo = getUserInfo()
    const url = userInfo?.avatar
    return (url && typeof url === 'string' && url.trim()) ? url.trim() : defaultAvatar
})

// 未读消息数量（响应式）
const unreadCount = computed(() => messageStore.unreadCount)
const unreadText = computed(() => messageStore.unreadText)

const sidebar = useSidebarStore()
const permiss = usePermissStore()
const router = useRouter()
const route = useRoute()

const breadcrumb = computed(() => {
    const fromMenu = getMenuBreadcrumb(route.path)
    if (fromMenu.current) return fromMenu
    const t = (route.meta?.title as string) || ''
    return { current: t }
})

// 侧边栏折叠
const collapseChage = () => {
    sidebar.handleCollapse()
}

onMounted(() => {
    if (document.body.clientWidth < 1500) {
        collapseChage()
    }
    messageStore.fetchUnreadCount()

})

// 打开消息中心（未读数由消息中心页 onMounted / reset 时拉取，避免与顶栏重复请求）
const openMessageCenter = () => {
    router.push({
        path: '/messageCenter',
        query: {
            reset: 'true',
            tab: 'all',
        },
    })
}

// 用户名下拉菜单选择事件
const handleCommand = async (command: string) => {
    if (command === 'loginout') {
        // 先本地登出并跳转，接口登出放后台，避免网络慢导致“登出卡顿”
        const tokenSnapshot = localStorage.getItem('token') || localStorage.getItem('agent_token')
        logoutApi(tokenSnapshot).catch(() => {
            // 接口失败也不影响前端登出
        })
        permiss.clearPermissions()
        stopTokenCheck()
        clearUserData()
        localStorage.removeItem('agent_token')
        localStorage.removeItem('agent_user_info')
        removeUserRoleId()
        router.replace('/login')
    } else if (command === 'user') {
        router.push('/ucenter')
    }
}

const setFullScreen = () => {
    if (document.fullscreenElement) {
        document.exitFullscreen()
    } else {
        document.body.requestFullscreen.call(document.body)
    }
}
</script>
<style scoped lang="scss">
.header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    height: 60px;
    /* color: var(--header-text-color);
    background-color: var(--header-bg-color); */
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
    background: transparent;
}

.header-left {
    display: flex;
    align-items: center;
    width: 250px;
    min-width: 250px;
    padding-left: 20px;
    height: 100%;
    transition: width 0.3s ease-in-out, min-width 0.3s ease-in-out, padding-left 0.3s ease-in-out;
    background: #f5f6f8;
    border-radius: 10px 0 0 0;
    border-right: 1px solid #e8eaed;
}

.logo {
    height: 32px;
    width: auto;
    max-width: min(155px, 100%);
    object-fit: contain;
    display: block;
    flex-shrink: 0;
}

.header.is-collapsed .logo {
    height: 26px;
    max-width: 40px;
}

.web-title {
    margin: 0 18px 0 10px;
    font-size: 13px;
    color: #2a2f3a;
    font-weight: 600;
    height: 100%;
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.collapse-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 0 10px;
    cursor: pointer;
    opacity: 0.85;
    font-size: 22px;
    flex-shrink: 0;
    transition: padding 0.3s ease-in-out, font-size 0.3s ease-in-out;
}

.collapse-btn:hover {
    opacity: 1;
}

.header-right {
    flex: 1;
    min-width: 0;
    padding-right: 50px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: #ffffff;
    border-radius: 0 10px 0 0;
}

.header-right-main {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    padding-left: 16px;
    gap: 12px;
}

.header-breadcrumb {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 16px;
}

.breadcrumb-parent,
.breadcrumb-sep {
    color: #999999;
}

.breadcrumb-current {
    color: #2a2f3a;
    font-weight: 600;
}

.header-user-con {
    display: flex;
    height: 100%;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    .bell-wrapper {
        display: flex;
        align-items: center;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.3s;
        &:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }
    }
    .bell-notify {
        &:hover {
            color: var(--header-bg-color);
        }
        :deep(.el-badge__content) {
            min-width: 16px;
            height: 16px;
            padding: 0 4px;
            font-size: 11px;
            line-height: 16px;
            border: none;
        }
    }
}

.bell-icon {
    width: 18px;
    height: 18px;
    margin-right: 8px;
    color: #1c53d9;
}

.btn-fullscreen {
    transform: rotate(45deg);
    margin-right: 5px;
    font-size: 24px;
}

.btn-icon {
    position: relative;
    width: 30px;
    height: 30px;
    text-align: center;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: var(--header-text-color);
    margin: 0 5px;
    font-size: 20px;
}

.btn-bell-badge {
    position: absolute;
    right: 4px;
    top: 0px;
    width: 8px;
    height: 8px;
    border-radius: 4px;
    background: #f56c6c;
    color: var(--header-text-color);
}

.user-avator {
    margin: 0 10px 0 20px;
}

.el-dropdown-link {
    /* color: var(--header-text-color); */
    cursor: pointer;
    display: flex;
    align-items: center;
    color: #2a2f3a;
}

.el-dropdown-menu__item {
    text-align: center;
}

.header.is-collapsed .header-left {
    width: 64px;
    min-width: 64px;
    padding-left: 12px;
}

.header.is-collapsed .collapse-btn {
    padding: 0 6px;
    font-size: 18px;
}
</style>
