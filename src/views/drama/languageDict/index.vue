<template>
    <page-content :title="title">
        <template #bottom>
            <ContentLanguagePanel :show-add-button="true" />
        </template>
    </page-content>
</template>

<script setup lang="ts">
import ContentLanguagePanel from '../contentConfig/components/ContentLanguagePanel.vue'

const title = {
    firstTitle: '语言字典管理',
    secondTitle: '管理短剧内容支持的语言类型',
}
</script>

