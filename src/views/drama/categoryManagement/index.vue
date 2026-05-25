<template>
    <page-content :title="title">
        <template #bottom>
            <TypeTagPanel :show-add-button="true" />
        </template>
    </page-content>
</template>

<script setup lang="ts">
import TypeTagPanel from '../contentConfig/components/TypeTagPanel.vue'

const title = {
    firstTitle: '分类管理',
    secondTitle: '管理短剧分类，同语言下分类名称唯一',
}
</script>

