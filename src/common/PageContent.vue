<template>
    <div class="page-content">
        <div class="flex-center justify-between">
            <div v-if="props.showTitle && (title.firstTitle || title.secondTitle)" class="h-[60px] mb-[20px]">
                <div class="h-[32px] font-bold text-2xl">{{ title.firstTitle }}</div>
                <div class="mt-[4px]">{{ title.secondTitle }}</div>
            </div>
            <slot name="top"></slot>
        </div>

        <div class="page-content-body">
            <slot name="bottom"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    title: {
        type: Object,
        default: {
            firstTitle: '',
            secondTitle: '',
        },
    },
    // 默认不展示面包屑标题（由具体页面自行决定是否需要）。
    showTitle: {
        type: Boolean,
        default: false,
    },
})
</script>

<style lang="scss">
.page-content {
    padding: 12px;
    background-color: #f9fafb;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
}

/* 内容区可滚动，避免表格/列表过多时页面被裁切无法滚动 */
.page-content-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: auto;
}

/* 全局让列表表格更紧凑，降低横向滚动概率 */
.page-content .el-table__cell,
.page-content .el-table th {
    font-size: 12px;
    padding: 6px 8px;
}

.page-content .el-table .el-button {
    padding: 6px 10px;
}
</style>
