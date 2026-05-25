<template>
    <el-drawer
        v-model="visible"
        title="消息中心"
        :size="600"
        :with-header="true"
        direction="rtl"
        @close="handleClose"
    >
        <!-- 筛选标签 -->
        <div class="message-tabs">
            <el-tabs v-model="activeTab" @tab-change="handleTabChange">
                <el-tab-pane label="全部消息" name="all" />
                <el-tab-pane label="未读消息" name="unread" />
                <el-tab-pane label="已读消息" name="read" />
                <el-tab-pane label="系统消息" name="system" />
                <el-tab-pane label="业务消息" name="business" />
            </el-tabs>
        </div>

        <!-- 消息列表 -->
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
                    @click="openMessageDetail(message)"
                >
                    <div class="message-content">
                        <div class="message-icon" :class="messageIconItemClass(message)">
                            <el-icon :size="24">
                                <component :is="getMessageListIcon(message)" />
                            </el-icon>
                        </div>
                        <div class="message-info">
                            <div class="message-header">
                                <span class="message-title">{{ message.title }}</span>
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
                                    @click.stop="handleMarkAsReadClick(message)"
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

        <!-- 分页 -->
        <div class="message-pagination">
            <el-pagination
                v-model:current-page="pagination.pageNum"
                v-model:page-size="pagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="pagination.total"
                layout="total, sizes, ->, prev, pager, next, jumper"
                prev-text="上一页"
                next-text="下一页"
                @size-change="handleSizeChange"
                @current-change="handlePageChange"
            />
        </div>
    </el-drawer>

    <!-- 消息详情/通知界面 -->
    <MessageDetail
        v-model="detailVisible"
        :message="currentMessage"
        :action-type="currentActionType"
        @close="handleDetailClose"
    />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import { getMessageList, markMessageAsRead } from '@/api/message'
import type { MessageItem, MessageListParams } from '@/types/message'
import MessageDetail from '@/components/MessageDetail.vue'
import { ElMessage } from 'element-plus'
import {
    getMessageListIcon,
    messageIconItemClass,
    messageLevelBadgeText,
    messageLevelItemClass,
} from '@/utils/messageDisplay'

const props = defineProps<{
    modelValue: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
})

const activeTab = ref<'all' | 'unread' | 'read' | 'system' | 'business'>('all')
const loading = ref(false)
const messageList = ref<MessageItem[]>([])
const messageListRef = ref<HTMLElement>()
const scrollContainerRef = ref<HTMLElement>()

const pagination = ref({
    pageNum: 1,
    pageSize: 10,
    total: 0,
})

const detailVisible = ref(false)
const currentMessage = ref<MessageItem | null>(null)
const currentActionType = ref<string>('')

// 获取消息列表
const fetchMessageList = async () => {
    loading.value = true
    try {
        const params: MessageListParams = {
            pageNum: pagination.value.pageNum,
            pageSize: pagination.value.pageSize,
            type: activeTab.value,
        }

        // 调用API获取消息列表
        const res = await getMessageList(params)
        if (res && res.data) {
            messageList.value = res.data.list || []
            pagination.value.total = res.data.total || 0
        } else {
            messageList.value = []
            pagination.value.total = 0
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
    pagination.value.pageNum = 1
    fetchMessageList()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
    pagination.value.pageSize = size
    pagination.value.pageNum = 1
    fetchMessageList()
}

// 页码改变
const handlePageChange = (page: number) => {
    pagination.value.pageNum = page
    fetchMessageList()
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

function openMessageDetail(message: MessageItem) {
    currentMessage.value = message
    currentActionType.value = message.actionType || 'detail'
    detailVisible.value = true
}

const handleMarkAsReadClick = async (message: MessageItem) => {
    if (message.isRead) return
    try {
        const res = await markMessageAsRead(message.id)
        if (res?.data?.code === 200) {
            message.isRead = true
            ElMessage.success('标记已读成功')
        } else {
            ElMessage.error('标记已读失败，请稍后重试')
        }
    } catch (error) {
        console.error('标记已读失败', error)
        ElMessage.error('标记已读失败，请稍后重试')
    }
}

// 关闭抽屉
const handleClose = () => {
    emit('update:modelValue', false)
}

// 关闭详情
const handleDetailClose = () => {
    detailVisible.value = false
    currentMessage.value = null
    currentActionType.value = ''
}

// 监听visible变化
watch(
    () => props.modelValue,
    (newVal) => {
        if (newVal) {
            fetchMessageList()
        }
    },
    { immediate: true }
)
</script>

<style lang="scss" scoped>
.drawer-header {
    .drawer-title {
        margin: 0;
        font-size: 20px;
        font-weight: bold;
    }

    .drawer-subtitle {
        margin: 8px 0 0 0;
        font-size: 14px;
        color: #909399;
    }
}

.message-tabs {
    margin-bottom: 20px;
    border-bottom: 1px solid #ebeef5;
}

.message-list-container {
    flex: 1;
    overflow: hidden;
    min-height: 400px;
    max-height: calc(100vh - 350px);
}

.message-list {
    height: 100%;
    overflow-y: auto;
    padding-right: 10px;

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
    margin-bottom: 12px;
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    transition: all 0.3s;

    &:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        border-color: #409eff;
    }

    &.message-read {
        background: #fafafa;
    }

    &.message-unread.message-level--low {
        background: #f0f9eb;
        border-left: 3px solid #95d475;
    }

    &.message-read.message-level--low {
        border-left: 3px solid #c2e7b0;
    }

    &.message-unread.message-level--medium {
        background: #fdf6ec;
        border-left: 3px solid #e6a23c;
    }

    &.message-unread.message-level--high {
        background: #fef0f0;
        border-left: 3px solid #f56c6c;
    }
}

.message-date {
    font-size: 12px;
    color: #909399;
}

.message-action-btn--read {
    cursor: not-allowed;
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

.message-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
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
    justify-content: space-between;
    gap: 12px;
}

.message-date {
    font-size: 12px;
    color: #909399;
}

.message-tag {
    flex-shrink: 0;
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
    cursor: pointer;
    transition: color 0.3s;
    margin-top: 4px;

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

.message-pagination {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
    display: flex;
    justify-content: center;
}

:deep(.el-drawer__body) {
    display: flex;
    flex-direction: column;
    padding: 20px;
    height: 100%;
    overflow: hidden;
}

:deep(.el-tabs__item) {
    padding: 0 20px;
}
</style>

