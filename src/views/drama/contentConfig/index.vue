<template>
    <page-content class="content-config-page" :title="title">
        <template #bottom>
            <el-card class="config-card" shadow="never">
                <div class="config-topbar">
                    <div class="config-tabs-wrap panel-register-wrap">
                        <el-tabs v-model="activeTab" class="config-tabs">
                            <el-tab-pane
                                v-for="tab in visibleTabs"
                                :key="tab.key"
                                :label="tab.label"
                                :name="tab.key"
                            />
                        </el-tabs>
                        <el-button v-if="canShowAddButton" class="btn-add-app" type="primary" :icon="Plus" @click="openAddDialog">
                            新增{{ tabLabelMap[activeTab] }}
                        </el-button>
                    </div>
                </div>

                <div class="embedded-count-row">
                    <div class="list-count">
                        当前{{ tabLabelMap[activeTab] }}数量：
                        <span class="count-number">{{ currentCount }}</span>
                    </div>
                </div>

                <!-- 统一复用：内容配置页只负责外层布局与入口，具体 CRUD 在对应组件内 -->
                <div class="embedded-panel">
                    <TypeTagPanel
                        v-if="activeTab === 'typeTag' && canListTypeTag"
                        ref="typeTagPanelRef"
                        @count-change="(n:number) => onCountChange('typeTag', n)"
                    />
                    <PlotTagPanel
                        v-else-if="activeTab === 'plotTag' && canListPlotTag"
                        ref="plotTagPanelRef"
                        @count-change="(n:number) => onCountChange('plotTag', n)"
                    />
                    <ContentLanguagePanel
                        v-else-if="activeTab === 'contentLanguage' && canListContentLanguage"
                        ref="contentLanguagePanelRef"
                        @count-change="(n:number) => onCountChange('contentLanguage', n)"
                    />
                    <CopyrightSourcePanel
                        v-else-if="activeTab === 'copyrightSource' && canListCopyrightSource"
                        ref="copyrightSourcePanelRef"
                        @count-change="(n:number) => onCountChange('copyrightSource', n)"
                    />
                    <ContentLevelPanel
                        v-else-if="activeTab === 'contentLevel' && canListContentLevel"
                        ref="contentLevelPanelRef"
                        @count-change="(n:number) => onCountChange('contentLevel', n)"
                    />
                    <el-empty v-else description="暂无内容配置查询权限" />
                </div>
            </el-card>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import {
    hasPerm,
    PERM_CONTENT_RATING,
    PERM_COPYRIGHT_SOURCE,
    PERM_DRAMA_CAT,
    PERM_DRAMA_LANGUAGE,
    PERM_DRAMA_TAG,
} from '@/utils/permission'
import TypeTagPanel from './components/TypeTagPanel.vue'
import PlotTagPanel from './components/PlotTagPanel.vue'
import ContentLanguagePanel from './components/ContentLanguagePanel.vue'
import CopyrightSourcePanel from './components/CopyrightSourcePanel.vue'
import ContentLevelPanel from './components/ContentLevelPanel.vue'
import './panelRegisterList.css'

type TabKey = 'contentLanguage' | 'typeTag' | 'plotTag' | 'contentLevel' | 'copyrightSource'
type PanelExpose = { openAddDialog: () => void }

const title = { firstTitle: '', secondTitle: '' }

const tabLabelMap: Record<TabKey, string> = {
    contentLanguage: '内容语言',
    typeTag: '类型标签',
    plotTag: '情节标签',
    contentLevel: '内容等级',
    copyrightSource: '版权来源',
}

const activeTab = ref<TabKey>('typeTag')
const counts = reactive<Record<TabKey, number>>({
    contentLanguage: 0,
    typeTag: 0,
    plotTag: 0,
    contentLevel: 0,
    copyrightSource: 0,
})

const typeTagPanelRef = ref<PanelExpose | null>(null)
const plotTagPanelRef = ref<PanelExpose | null>(null)
const contentLanguagePanelRef = ref<PanelExpose | null>(null)
const copyrightSourcePanelRef = ref<PanelExpose | null>(null)
const contentLevelPanelRef = ref<PanelExpose | null>(null)

const currentCount = computed(() => counts[activeTab.value] || 0)
const canListTypeTag = computed(() => hasPerm(PERM_DRAMA_CAT.list))
const canListPlotTag = computed(() => hasPerm(PERM_DRAMA_TAG.list))
const canListContentLanguage = computed(() => hasPerm(PERM_DRAMA_LANGUAGE.list))
const canListCopyrightSource = computed(() => hasPerm(PERM_COPYRIGHT_SOURCE.list))
const canListContentLevel = computed(() => hasPerm(PERM_CONTENT_RATING.list))
const canAddPlotTag = computed(() => hasPerm(PERM_DRAMA_TAG.add))
const canAddCopyrightSource = computed(() => hasPerm(PERM_COPYRIGHT_SOURCE.add))
const canAddContentRating = computed(() => hasPerm(PERM_CONTENT_RATING.add))
const visibleTabs = computed(() =>
    ([
        { key: 'typeTag', label: tabLabelMap.typeTag, visible: canListTypeTag.value },
        { key: 'plotTag', label: tabLabelMap.plotTag, visible: canListPlotTag.value },
        { key: 'contentLanguage', label: tabLabelMap.contentLanguage, visible: canListContentLanguage.value },
        { key: 'copyrightSource', label: tabLabelMap.copyrightSource, visible: canListCopyrightSource.value },
        { key: 'contentLevel', label: tabLabelMap.contentLevel, visible: canListContentLevel.value },
    ] as Array<{ key: TabKey; label: string; visible: boolean }>).filter((item) => item.visible),
)
const canShowAddButton = computed(() => {
    if (activeTab.value === 'typeTag') return hasPerm(PERM_DRAMA_CAT.add)
    if (activeTab.value === 'plotTag') return canAddPlotTag.value
    if (activeTab.value === 'contentLanguage') return hasPerm(PERM_DRAMA_LANGUAGE.add)
    if (activeTab.value === 'copyrightSource') return canAddCopyrightSource.value
    if (activeTab.value === 'contentLevel') return canAddContentRating.value
    return true
})

watchEffect(() => {
    const firstVisibleTab = visibleTabs.value[0]?.key
    if (!firstVisibleTab) return
    const isActiveVisible = visibleTabs.value.some((tab) => tab.key === activeTab.value)
    if (!isActiveVisible) activeTab.value = firstVisibleTab
})

function onCountChange(tab: TabKey, count: number) {
    counts[tab] = Number(count || 0)
}

function openAddDialog() {
    if (activeTab.value === 'typeTag') return typeTagPanelRef.value?.openAddDialog()
    if (activeTab.value === 'plotTag') return plotTagPanelRef.value?.openAddDialog()
    if (activeTab.value === 'contentLanguage') return contentLanguagePanelRef.value?.openAddDialog()
    if (activeTab.value === 'copyrightSource') return copyrightSourcePanelRef.value?.openAddDialog()
    return contentLevelPanelRef.value?.openAddDialog()
}
</script>

<style scoped>
.content-config-page :deep(.flex-center.justify-between) {
    display: none;
}

.config-card {
    min-height: 520px;
    border-radius: 12px;
}

.embedded-panel {
    padding: 0 12px 12px;
}

.embedded-count-row {
    margin: 2px 0 10px;
    padding: 0 12px;
}

.config-topbar {
    margin-bottom: 16px;
    padding: 0 12px;
}

.config-tabs-wrap {
    padding: 10px 12px;
    background: #fafbfc;
    border: 1px solid #f0f2f5;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.config-tabs-wrap .btn-add-app {
    margin-left: 16px;
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
    width: 96px;
    min-width: 96px;
    padding: 0 !important;
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

.list-count {
    color: #606266;
    font-size: 14px;
}

.count-number {
    color: #e6a23c;
    font-size: 24px;
    font-weight: 600;
    line-height: 1;
    margin-left: 4px;
}
</style>

