<template>
    <div class="sidebar" :class="{ collapsed: sidebar.collapse }">
        <!-- 显示菜单内容 -->
        <el-menu class="sidebar-el-menu" :default-active="onRoutes" :collapse="sidebar.collapse"
            :background-color="sidebar.bgColor" :text-color="sidebar.textColor" router>
            <template v-for="item in computedMenuData" :key="item.id">
                <template v-if="item.children">
                    <el-sub-menu :index="item.index" v-memo="[item.id, item.children.length]">
                        <template #title>
                            <el-icon class="menu-icon">
                                <component :is="item.icon || 'Menu'"></component>
                            </el-icon>
                            <span class="menu-text">{{ item.title }}</span>
                        </template>
                        <template v-for="subItem in item.children" :key="subItem.id">
                            <el-sub-menu v-if="subItem.children" :index="subItem.index"
                                v-memo="[subItem.id, subItem.children.length]">
                                <template #title>
                                    <el-icon class="menu-icon">
                                        <component :is="subItem.icon || item.icon || 'Menu'"></component>
                                    </el-icon>
                                    <span class="menu-text">{{ subItem.title }}</span>
                                </template>
                                <el-menu-item v-for="(threeItem, i) in subItem.children" :key="threeItem.id || i"
                                    :index="threeItem.index">
                                    <el-icon class="menu-icon">
                                        <component :is="threeItem.icon || subItem.icon || item.icon || 'Menu'"></component>
                                    </el-icon>
                                    <span class="menu-text">{{ threeItem.title }}</span>
                                </el-menu-item>
                            </el-sub-menu>
                            <el-menu-item v-else :index="subItem.index" v-memo="[subItem.id]">
                                <el-icon class="menu-icon">
                                    <component :is="subItem.icon || item.icon || 'Menu'"></component>
                                </el-icon>
                                <span class="menu-text">{{ subItem.title }}</span>
                            </el-menu-item>
                        </template>
                    </el-sub-menu>
                </template>
                <template v-else>
                    <el-menu-item :index="item.index" v-memo="[item.id]">
                        <el-icon class="menu-icon">
                            <component :is="item.icon || 'Menu'"></component>
                        </el-icon>
                        <span class="menu-text">{{ item.title }}</span>
                    </el-menu-item>
                </template>
            </template>
        </el-menu>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useSidebarStore } from '../store/sidebar';
import { usePermissStore } from '../store/permiss';
import { useRoute } from 'vue-router';
import { getFilteredMenuData, resolveSidebarActiveIndex } from './menu';
import { getUserInfo } from '@/utils';

const route = useRoute();
const sidebar = useSidebarStore();
const permiss = usePermissStore();

// 根据登录返回的 perms 过滤后的菜单（path 匹配则显示，子显示则父必显示）
const computedMenuData = computed(() => {
    const userInfo = getUserInfo();
    const perms = userInfo?.perms;
    return getFilteredMenuData(perms ?? null);
});

// 计算当前激活的菜单项：最长路径前缀匹配，保证子路由（如 .../episodes/:id）仍能对应到菜单 index
const onRoutes = computed(() => {
    const pathOnly = route.path;
    const menuTree = computedMenuData.value;
    const resolved = resolveSidebarActiveIndex(pathOnly, menuTree);
    return resolved || pathOnly;
});

// 初始化菜单数据
const initMenuData = async () => {
    // 如果权限数据为空且不在获取中，主动获取
    if ((!permiss.menuData || permiss.menuData.length === 0) && !permiss.isFetching) {
        await permiss.fetchMenuPermissions();
    }
};

onMounted(() => {
    initMenuData();
});
</script>

<style scoped>
.sidebar {
    display: block;
    position: absolute;
    left: 0;
    top: 60px;
    bottom: 0;
    overflow-y: auto;
    overflow-x: hidden;
    /* 避免展开/收起子菜单时滚动条出现导致横向跳动 */
    scrollbar-gutter: stable;
    /* 避免展开/收起时浏览器滚动锚定造成的“上移一下” */
    overflow-anchor: none;
    z-index: 1000;
    background-color: #fff;
    border-right: 1px solid #e6e6e6;
    width: 250px;
    transition: width 0.3s ease-in-out;
}

/* 部分浏览器会对内部节点做锚定，导致动画结束后二次上移 */
.sidebar :deep(.el-menu),
.sidebar :deep(.el-sub-menu),
.sidebar :deep(.el-sub-menu__title),
.sidebar :deep(.el-menu-item) {
    overflow-anchor: none;
}

.sidebar.collapsed {
    width: 64px;
}

.sidebar::-webkit-scrollbar {
    width: 6px;
}
.sidebar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 999px;
}
.sidebar::-webkit-scrollbar-track {
    background: transparent;
}

.sidebar-el-menu:not(.el-menu--collapse) {
    width: 100%;
}

.sidebar-el-menu.el-menu--collapse {
    width: 100%;
}

.sidebar-el-menu {
    min-height: 100%;
    border-right: none;
    width: 100%;
    padding: 10px 10px 14px;
    box-sizing: border-box;
    overflow-x: hidden;
}

.menu-icon {
    font-size: 18px;
    color: #8c8c8c;
}
.menu-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 确保菜单项可见（Element Plus 内部 DOM 需用 :deep 生效） */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
    color: #303133 !important;
    background-color: transparent !important;
    border-radius: 10px;
    /* 避免子菜单高度动画结束后二次跳动：不要用 margin 参与高度计算 */
    margin: 0;
    padding-left: 14px !important;
    padding-right: 14px !important;
    height: 44px;
    line-height: 44px;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
    background-color: #f7f7f7 !important;
}

/* 选中状态的样式 */
:deep(.el-menu-item.is-active) {
    background-color: #EDF1FC !important;
    color: #1C53D9 !important;
}

:deep(.el-menu-item.is-active:hover) {
    background-color: #EDF1FC !important;
}

/* 子菜单项选中时：仅当该父级在激活路径上（.is-active）才高亮；不要用 .is-opened（仅表示展开，会导致切换后仍误高亮） */
:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: #1C53D9 !important;
    background-color: #EDF1FC !important;
}

/* 父级高亮时 hover 保持同套配色，避免闪回灰底 */
:deep(.el-sub-menu.is-active > .el-sub-menu__title:hover) {
    color: #1C53D9 !important;
    background-color: #EDF1FC !important;
}

/* 确保菜单正常显示 */
:deep(.el-menu) {
    border-right: none;
}

/* 子菜单缩进（用单个 :deep 选择器更稳定） */
:deep(.el-sub-menu .el-menu-item) {
    padding-left: 36px !important;
}
/* 三级菜单再缩进一些 */
:deep(.el-sub-menu .el-sub-menu .el-menu-item) {
    padding-left: 52px !important;
}

/* 用菜单容器的 padding 提供“行间距”，不影响高度过渡 */
.sidebar-el-menu {
    padding: 10px 10px 14px;
    box-sizing: border-box;
}
.sidebar-el-menu :deep(.el-menu) {
    padding: 4px 0;
}
.sidebar-el-menu :deep(.el-sub-menu .el-menu) {
    padding: 4px 0 6px;
}

/* 子项之间的间距用 padding-top/bottom 模拟 */
.sidebar-el-menu :deep(.el-menu-item),
.sidebar-el-menu :deep(.el-sub-menu__title) {
    margin: 0;
}
.sidebar-el-menu :deep(.el-menu-item) {
    padding-top: 2px;
    padding-bottom: 2px;
}

/* 选中时图标更深 */
:deep(.el-menu-item.is-active) .menu-icon,
:deep(.el-sub-menu.is-active > .el-sub-menu__title) .menu-icon {
    color: #1C53D9;
}

/* 菜单动画效果 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
    transition: background-color 0.18s ease, color 0.18s ease;
}
</style>
