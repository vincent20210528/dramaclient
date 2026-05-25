<template>
    <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="640px"
        align-center
        append-to-body
        destroy-on-close
        :close-on-click-modal="false"
        class="menu-add-dialog menu-view-dialog message-detail-dialog"
        @closed="handleClosed"
    >
        <div v-if="message" class="message-detail-panel">
            <div class="message-detail-meta">
                <el-tag
                    v-if="messageLevelBadgeText(message.messageLevel)"
                    type="danger"
                    size="small"
                    effect="light"
                    class="message-detail-tag message-level-tag"
                >
                    {{ messageLevelBadgeText(message.messageLevel) }}
                </el-tag>
                <el-tag :type="getTagType(message.type)" size="small" class="message-detail-tag">
                    {{ getTagText(message.type) }}
                </el-tag>
                <span v-if="message.date" class="message-detail-date">{{ message.date }}</span>
            </div>
            <div class="message-detail-body">
                <p class="message-detail-content">{{ message.content || '--' }}</p>
            </div>
        </div>
        <el-empty v-else description="暂无消息内容" />

        <template #footer>
            <el-button type="primary" @click="dialogVisible = false">关闭</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MessageItem } from '@/types/message'
import { messageLevelBadgeText } from '@/utils/messageDisplay'

const props = defineProps<{
    modelValue: boolean
    message: MessageItem | null
    actionType: string
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    close: []
}>()

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
})

const dialogTitle = computed(() => {
    if (props.message?.title) {
        return props.message.title
    }
    return '消息详情'
})

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

const handleClosed = () => {
    emit('close')
}
</script>

<style lang="scss" scoped>
.message-detail-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.message-detail-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
}

.message-detail-date {
    font-size: 13px;
    color: #909399;
}

.message-detail-body {
    min-height: 80px;
}

.message-detail-content {
    margin: 0;
    font-size: 14px;
    color: #606266;
    line-height: 1.8;
    white-space: pre-wrap;
    word-break: break-word;
}

.message-level-tag {
    font-weight: 600;
}

:deep(.message-detail-tag.el-tag--info) {
    background-color: #e1f3ff;
    border-color: #b3d8ff;
    color: #409eff;
}

:deep(.message-detail-tag.el-tag--success) {
    background-color: #f0f9ff;
    border-color: #b3e5fc;
    color: #67c23a;
}
</style>
