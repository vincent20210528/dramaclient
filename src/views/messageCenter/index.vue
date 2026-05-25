<template>
    <page-content class="message-center-page operation-drama-page" :title="title">
        <template #bottom>
            <el-card class="drama-main-card message-main-card" shadow="never">
                <div class="message-topbar">
                    <div class="config-tabs-wrap message-tabs-wrap">
                        <el-tabs v-model="activeTab" class="config-tabs message-filter-tabs" @tab-change="handleTabChange">
                            <el-tab-pane label="全部消息" name="all" />
                            <el-tab-pane label="未读消息" name="unread" />
                            <el-tab-pane label="已读消息" name="read" />
                            <el-tab-pane label="系统消息" name="system" />
                            <el-tab-pane label="业务消息" name="business" />
                        </el-tabs>
                        <div class="message-topbar-actions">
                            <div v-if="messageStore.unreadCount > 0" class="unread-message-info">
                                <span class="unread-count-number">{{ messageStore.unreadCount }}</span>
                                <span class="unread-count-text">条未读消息</span>
                            </div>
                            <el-button
                                type="primary"
                                plain
                                :loading="markAllReadLoading"
                                :disabled="messageStore.unreadCount === 0"
                                @click="handleMarkAllAsRead"
                            >
                                全部标记为已读
                            </el-button>
                        </div>
                    </div>
                </div>

                <div class="message-list-container" ref="messageListRef">
                    <div v-loading="loading" class="message-list" ref="scrollContainerRef">
                        <div
                            v-for="message in messageList"
                            :key="message.id"
                            class="message-item"
                            :class="[
                                messageLevelItemClass(message.messageLevel),
                                { 'message-unread': !message.isRead, 'message-read': message.isRead },
                            ]"
                            @click="handleArrowClick(message)"
                        >
                            <div class="message-content">
                                <div class="message-icon" :class="messageIconItemClass(message)">
                                    <el-icon :size="24">
                                        <component :is="getMessageListIcon(message)" />
                                    </el-icon>
                                </div>
                                <div class="message-info">
                                    <div class="message-header">
                                        <div class="message-title-wrapper">
                                            <span class="message-title">{{ message.title }}</span>
                                            <!-- 未读消息红点 -->
                                            <span v-if="!message.isRead" class="unread-dot"></span>
                                        </div>
                                    </div>
                                    <div class="message-text">{{ message.content }}</div>
                                    <div class="message-footer">
                                        <el-tag
                                            v-if="messageLevelBadgeText(message.messageLevel)"
                                            type="danger"
                                            size="small"
                                            class="message-tag message-level-tag"
                                            effect="light"
                                        >
                                            {{ messageLevelBadgeText(message.messageLevel) }}
                                        </el-tag>
                                        <el-tag :type="getTagType(message.type)" size="small" class="message-tag">
                                            {{ getTagText(message.type) }}
                                        </el-tag>
                                        <span v-if="message.date" class="message-date">{{ message.date }}</span>
                                    </div>
                                </div>
                                <div class="message-actions">
                                    <el-icon class="arrow-icon">
                                        <ArrowRight />
                                    </el-icon>
                                    <div class="message-action-btn-wrapper">
                                        <el-button
                                            :type="message.isRead ? 'info' : 'primary'"
                                            size="small"
                                            class="message-action-btn"
                                            :class="{ 'message-action-btn--read': message.isRead }"
                                            :disabled="message.isRead"
                                            @click.stop="handleMarkAsRead(message)"
                                        >
                                            {{ message.isRead ? '已读' : '标记已读' }}
                                        </el-button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <el-empty v-if="!loading && messageList.length === 0" description="暂无消息" />
                    </div>
                </div>

                <div class="pagination-wrapper">
                    <el-pagination
                        v-model:current-page="pagination.pageNum"
                        v-model:page-size="pagination.pageSize"
                        :page-sizes="[10, 20, 50]"
                        :total="pagination.total"
                        layout="total, sizes, ->, prev, pager, next, jumper"
                        prev-text="上一页"
                        next-text="下一页"
                        @size-change="handleSizeChange"
                        @current-change="handlePageChange"
                    />
                </div>
            </el-card>

            <MessageDetail
                v-model="detailVisible"
                :message="currentMessage"
                :action-type="currentActionType"
                @close="handleDetailClose"
            />
        </template>
    </page-content>
</template>

<script setup lang="ts" name="messageCenter">
import { ref, watch, nextTick, onActivated, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import { getMessageList, markAllMessagesAsRead, markMessageAsRead } from '@/api/message'
import type { MessageItem, MessageListParams } from '@/types/message'
import MessageDetail from '@/components/MessageDetail.vue'
import { ElMessage } from 'element-plus'
import { useMessageStore } from '@/store/message'
import {
    getMessageListIcon,
    messageIconItemClass,
    messageLevelBadgeText,
    messageLevelItemClass,
} from '@/utils/messageDisplay'

const title = {
    firstTitle: '',
    secondTitle: '',
}

const activeTab = ref<'all' | 'unread' | 'read' | 'system' | 'business'>('all')
const loading = ref(false)
const markAllReadLoading = ref(false)
const messageList = ref<MessageItem[]>([])
const messageListRef = ref<HTMLElement>()
const scrollContainerRef = ref<HTMLElement>()

const pagination = ref({
    pageNum: 1,
    pageSize: 10,
    total: 0,
})

// 数据缓存：存储每个类型的完整状态（最后一次操作的状态）
const dataCache = ref<
    Record<
        string,
        {
            list: MessageItem[]
            total: number
            pageNum: number
            pageSize: number
        }
    >
>({})

const detailVisible = ref(false)
const currentMessage = ref<MessageItem | null>(null)
const currentActionType = ref<string>('')
/** 区分首次挂载与 keep-alive 激活，避免 unReadCount 与列表重复刷新 */
const pageMounted = ref(false)

const messageStore = useMessageStore()
const route = useRoute()
const router = useRouter()

// 重置消息中心状态
const resetMessageCenter = () => {
    // 重置tab为全部消息
    activeTab.value = 'all'
    // 清空数据缓存
    dataCache.value = {}
    // 重置分页
    pagination.value = {
        pageNum: 1,
        pageSize: 10,
        total: 0,
    }
    // 清空消息列表
    messageList.value = []
    // 清空详情
    currentMessage.value = null
    currentActionType.value = ''
    detailVisible.value = false
}

// 获取消息列表
const fetchMessageList = async (forceRefresh = false) => {
    const currentType = activeTab.value
    const cacheKey = currentType

    // 如果不是强制刷新，且已有缓存数据，恢复该类型的最后状态
    if (!forceRefresh && dataCache.value[cacheKey]) {
        const cached = dataCache.value[cacheKey]
        // 恢复分页状态
        pagination.value.pageNum = cached.pageNum
        pagination.value.pageSize = cached.pageSize
        pagination.value.total = cached.total
        // 恢复列表数据
        messageList.value = [...cached.list] // 深拷贝

        // 自动滚动到顶部
        nextTick(() => {
            scrollToTop()
        })
        return
    }

    // 如果是第一次加载该类型，使用默认值（第一页）
    if (!dataCache.value[cacheKey]) {
        pagination.value.pageNum = 1
    }

    loading.value = true
    try {
        const params: MessageListParams = {
            pageNum: pagination.value.pageNum,
            pageSize: pagination.value.pageSize,
            type: currentType,
        }

        // 调用API获取消息列表
        const res = await getMessageList(params)
        if (res && res.data) {
            const list = res.data.list || []
            const total = res.data.total || 0

            messageList.value = list
            pagination.value.total = total

            // 缓存当前类型的完整状态（最后一次操作的状态）
            dataCache.value[cacheKey] = {
                list: [...list], // 深拷贝
                total: total,
                pageNum: pagination.value.pageNum,
                pageSize: pagination.value.pageSize,
            }
        } else {
            messageList.value = []
            pagination.value.total = 0
            // 即使没有数据，也缓存状态
            dataCache.value[cacheKey] = {
                list: [],
                total: 0,
                pageNum: pagination.value.pageNum,
                pageSize: pagination.value.pageSize,
            }
        }

        // 自动滚动到顶部
        nextTick(() => {
            scrollToTop()
        })
    } catch (error) {
        ElMessage.error('获取消息列表失败')
        console.error(error)
    } finally {
        loading.value = false
    }
}

// 标签切换
const handleTabChange = () => {
    // 切换页签时，恢复该类型的最后状态（包括页码），如果有缓存则使用缓存，否则调用API
    fetchMessageList(false)
}

// 分页大小改变
const handleSizeChange = (size: number) => {
    pagination.value.pageSize = size
    pagination.value.pageNum = 1
    // 分页改变时强制刷新，并更新缓存
    fetchMessageList(true)
}

// 页码改变
const handlePageChange = (page: number) => {
    pagination.value.pageNum = page
    // 页码改变时强制刷新，并更新缓存
    fetchMessageList(true)
}

// 滚动到顶部
const scrollToTop = () => {
    if (scrollContainerRef.value) {
        scrollContainerRef.value.scrollTop = 0
    }
}

const getTagType = (type: string) => {
    const typeMap: Record<string, string> = {
        system: 'info',
        business: 'success',
    }
    return typeMap[type] || 'info'
}

const getTagText = (type: string) => {
    const textMap: Record<string, string> = {
        system: '系统消息',
        business: '业务消息',
    }
    return textMap[type] || '消息'
}

// 点击箭头打开详情
const handleArrowClick = (message: MessageItem) => {
    currentMessage.value = message
    currentActionType.value = message.actionType || 'detail'
    detailVisible.value = true
}

// 全部标记为已读
const handleMarkAllAsRead = async () => {
    if (messageStore.unreadCount === 0) {
        ElMessage.info('暂无未读消息')
        return
    }
    markAllReadLoading.value = true
    try {
        const res = await markAllMessagesAsRead()
        if (res?.data?.code === 200) {
            messageList.value.forEach((m) => {
                m.isRead = true
            })
            Object.keys(dataCache.value).forEach((key) => {
                const cached = dataCache.value[key]
                if (cached) {
                    cached.list.forEach((m) => {
                        m.isRead = true
                    })
                }
            })
            messageStore.setUnreadCount(0)
            await messageStore.fetchUnreadCount()
            dataCache.value = {}
            await fetchMessageList(true)
            ElMessage.success('已全部标记为已读')
        } else {
            const msg = res?.data?.message
            ElMessage.error(msg && typeof msg === 'string' ? msg : '全部标记已读失败，请稍后重试')
        }
    } catch (error) {
        console.error('全部标记已读失败', error)
        ElMessage.error('全部标记已读失败，请稍后重试')
    } finally {
        markAllReadLoading.value = false
    }
}

// 标记已读
const handleMarkAsRead = async (message: MessageItem) => {
    // 如果已读，直接返回
    if (message.isRead) {
        ElMessage.info('该消息已标记为已读')
        return
    }

    try {
        const res = await markMessageAsRead(message.id)

        // 只有接口调用成功时才更新状态
        if (res?.data?.code === 200) {
            message.isRead = true
            messageStore.decreaseUnreadCount()
            await messageStore.fetchUnreadCount()
            ElMessage.success('标记已读成功')
        } else {
            ElMessage.error('标记已读失败，请稍后重试')
        }
    } catch (error) {
        console.error('标记已读失败', error)
        ElMessage.error('标记已读失败，请稍后重试')
        // 接口调用失败，不更新状态
    }
}

// 关闭详情
const handleDetailClose = async () => {
    // 如果消息未读，自动标记为已读
    if (currentMessage.value && !currentMessage.value.isRead) {
        try {
            const res = await markMessageAsRead(currentMessage.value.id)

            // 只有接口调用成功时才更新状态
            if (res?.data?.code === 200) {
                // 更新消息列表中的已读状态
                const messageInList = messageList.value.find((msg) => msg.id === currentMessage.value?.id)
                if (messageInList) {
                    messageInList.isRead = true
                }
                // 更新当前消息的已读状态
                currentMessage.value.isRead = true
                // 更新未读消息数量
                messageStore.decreaseUnreadCount()
                // 重新获取未读消息数量（确保与服务器同步）
                await messageStore.fetchUnreadCount()
            }
            // 接口调用失败时不更新状态，但继续关闭弹窗
        } catch (error) {
            console.error('标记已读失败', error)
            // 接口调用失败，不更新状态，但继续关闭弹窗
        }
    }

    // 清空消息数据，避免闪现
    currentMessage.value = null
    currentActionType.value = ''
}

// 监听路由变化，检查是否需要重置
watch(
    () => route.query,
    (newQuery) => {
        if (newQuery.reset === 'true') {
            resetMessageCenter()
            // 如果有指定tab，切换到指定tab
            if (newQuery.tab) {
                activeTab.value = newQuery.tab as any
            }
            // 移除重置参数，避免重复触发
            router.replace({ path: route.path, query: {} })
            fetchMessageList()
            if (pageMounted.value) {
                void messageStore.fetchUnreadCount()
            }
        }
    },
    { immediate: true }
)

// 初始化加载
onMounted(() => {
    pageMounted.value = true
    if (route.query.reset === 'true') {
        resetMessageCenter()
        if (route.query.tab) {
            activeTab.value = route.query.tab as any
        }
        router.replace({ path: route.path, query: {} })
    }
    fetchMessageList()
    void messageStore.fetchUnreadCount()
})

onActivated(() => {
    if (route.query.reset === 'true') return
    fetchMessageList()
})
</script>

<style lang="scss" scoped>
.message-center-page.operation-drama-page {
    background-color: #ffffff;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

.message-center-page.operation-drama-page :deep(.page-content-body) {
    padding-top: 0;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.message-main-card {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    margin-top: 12px;
    border-radius: 20px;
    overflow: hidden;
}
.message-main-card :deep(.el-card__body) {
    padding: 12px 20px 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.message-topbar {
    flex-shrink: 0;
    margin-bottom: 16px;
}

.config-tabs-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
}

.message-tabs-wrap .message-topbar-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
}

.config-tabs :deep(.el-tabs__header) {
    margin: 0;
    border-bottom: none;
}

.config-tabs :deep(.el-tabs__nav-wrap::after) {
    display: none;
}

.config-tabs :deep(.el-tabs__nav) {
    display: flex;
    gap: 10px;
}

.config-tabs :deep(.el-tabs__active-bar) {
    display: none;
}

.config-tabs :deep(.el-tabs__item) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: 34px;
    line-height: 34px;
    min-width: 96px;
    padding: 0 16px !important;
    text-align: center !important;
    border-radius: 8px;
    border: 1px solid transparent;
    color: #606266;
    font-size: 14px;
    font-weight: 500;
    background: #fff;
    transition: all 0.2s ease;
}

.config-tabs :deep(.el-tabs__item:hover) {
    color: #d9a23a;
}

.config-tabs :deep(.el-tabs__item.is-active) {
    color: #d9a23a;
    border-color: #f3d490;
    background: #fff8e8;
    box-shadow: 0 1px 3px rgba(217, 162, 58, 0.18);
}

.message-list-container {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.message-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 10px;
    min-height: 0;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;

        &:hover {
            background: #a8a8a8;
        }
    }
}



.message-item {
    padding: 16px;
    margin-bottom: 20px;
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        border-color: #409eff;
    }

    &.message-read {
        background: #fafafa;
    }

    &.message-unread.message-level--low {
        background: #f0f9eb;
        border-left-width: 3px;
        border-left-style: solid;
        border-left-color: #95d475;
    }

    &.message-unread.message-level--medium {
        background: #fdf6ec;
        border-left-width: 3px;
        border-left-style: solid;
        border-left-color: #e6a23c;
    }

    &.message-unread.message-level--high {
        background: #fef0f0;
        border-left-width: 3px;
        border-left-style: solid;
        border-left-color: #f56c6c;
    }

    &.message-read.message-level--low {
        border-left: 3px solid #c2e7b0;
    }

    &.message-read.message-level--medium {
        border-left: 3px solid #f3d19e;
    }

    &.message-read.message-level--high {
        border-left: 3px solid #fab6b6;
    }
}

.message-action-btn--read {
    cursor: not-allowed;
}

.message-level-tag {
    font-weight: 600;
}

.message-content {
    display: flex;
    gap: 12px;
    position: relative;
}

.message-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f2f5;
    border-radius: 50%;
    color: #409eff;
}

.message-icon--system {
    background: #edf1fc;
    color: #2d53eb;
}

.message-icon--business {
    background: #fdf6ec;
    color: #e6a23c;
}

.message-info {
    flex: 1;
    min-width: 0;
}

.message-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.message-title-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.message-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.unread-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #f56c6c;
    flex-shrink: 0;
}

.important-tag {
    flex-shrink: 0;
}

.message-text {
    font-size: 14px;
    color: #606266;
    line-height: 1.6;
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.message-footer {
    display: flex;
    align-items: center;
    gap: 16px;
}

.message-date {
    font-size: 12px;
    color: #909399;
}

.message-tag {
    flex-shrink: 0;
}

// 自定义通知类型标签样式，匹配图片中的颜色
:deep(.message-tag) {
    &.el-tag--info {
        // 系统通知 - 浅蓝色
        background-color: #e1f3ff;
        border-color: #b3d8ff;
        color: #409eff;
    }

    &.el-tag--success {
        // 业务通知 - 绿色
        background-color: #f0f9ff;
        border-color: #b3e5fc;
        color: #67c23a;
    }

    &.el-tag--warning {
        // 财务通知 - 橙色
        background-color: #fdf6ec;
        border-color: #faecd8;
        color: #e6a23c;
    }

    &.el-tag--primary {
        // 活动通知 - 深蓝色/紫色调
        background-color: #f0e7ff;
        border-color: #d9b3ff;
        color: #722ed1;
    }
}

.message-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-start;
    gap: 8px;
    flex-shrink: 0;
    min-height: 100%;
}

.arrow-icon {
    color: #c0c4cc;
    transition: color 0.3s;
    margin-top: 4px;
    font-size: 27px; // 18px * 1.5 = 27px

    &:hover {
        color: #409eff;
    }
}

.message-action-btn-wrapper {
    margin-top: auto;
    align-self: flex-end;
}

.message-action-btn {
    white-space: nowrap;
}

.pagination-wrapper {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 12px 0 0;
    margin-top: 16px;
    border-top: 1px solid #ebeef5;
    background: #fff;
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

.unread-message-info {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    background-color: #ffeef0;
    border-radius: 12px;
    white-space: nowrap;
}

.unread-count-number {
    font-size: 14px;
    font-weight: 600;
    color: #c41d1f;
    margin-right: 2px;
}

.unread-count-text {
    font-size: 14px;
    color: #8b1a1a;
    font-weight: 400;
}
</style>

