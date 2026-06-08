<template>
    <page-content class="drama-video-page operation-drama-page" :title="title">
        <template #bottom>
            <el-card class="drama-main-card" shadow="never">
                <el-form :model="searchForm" inline class="search-form search-form--single-row">
                      <el-form-item>
                        <el-input
                            v-model="searchForm.fileId"
                            class="filter-input filter-input--file-id"
                            placeholder="fileId"
                            clearable
                            @keyup.enter="handleSearch"
                        />
                    </el-form-item>
                    <el-form-item>
                        <el-input
                            v-model="searchForm.vid"
                            class="filter-input filter-input--vid"
                            placeholder="vid"
                            clearable
                            @keyup.enter="handleSearch"
                        />
                    </el-form-item> 
                    <el-form-item>
                        <el-input
                            v-model="searchForm.title"
                            class="filter-input filter-input--title"
                            placeholder="上线剧名"
                            clearable
                            @keyup.enter="handleSearch"
                        />
                    </el-form-item>

                    <el-form-item>
                        <el-select
                            v-model="searchForm.languageCode"
                            class="filter-select filter-select--language-code"
                            placeholder="字幕语言"
                            clearable
                            filterable
                            :loading="languageOptionsLoading"
                        >
                            <el-option
                                v-for="opt in languageOptions"
                                :key="opt.languageCode"
                                :label="opt.label"
                                :value="opt.languageCode"
                            />
                        </el-select>
                    </el-form-item>

                    <el-form-item>
                        <el-select
                            v-model="searchForm.handleStatus"
                            class="filter-select filter-select--handle-status"
                            placeholder="处理状态"
                            clearable
                        >
                            <el-option label="上传错误" :value="-1" />
                            <el-option label="上传中" :value="0" />
                            <el-option label="处理中" :value="1" />
                            <el-option label="处理完成" :value="2" />
                        </el-select>
                    </el-form-item>

                    <el-form-item>
                        <el-select
                            v-model="searchForm.sortType"
                            class="filter-select filter-select--sort-type"
                            placeholder="排序方式"
                            clearable
                        >
                            <el-option label="创建时间" :value="0" />
                            <el-option label="修改时间" :value="1" />
                            <el-option label="文件大小" :value="2" />
                        </el-select>
                    </el-form-item>

                    <el-form-item>
                        <el-select
                            v-model="searchForm.hasYoutubeIdFilter"
                            class="filter-select filter-select--yvid"
                            placeholder="YVID"
                        >
                            <el-option label="全部" value="" />
                            <el-option label="有YVID" value="has" />
                            <el-option label="无YVID" value="none" />
                        </el-select>
                    </el-form-item>

                    <el-form-item class="search-form__actions">
                        <el-button class="btn-query" type="primary" @click="handleSearch">查询</el-button>
                        <el-button class="btn-reset" @click="handleReset">重置</el-button>
                    </el-form-item>
                </el-form>

                <div class="table-toolbar">
                    <span class="toolbar-actions">
                        <el-icon class="toolbar-icon" @click="loadList"><Refresh /></el-icon>
                        <el-dropdown trigger="click" :hide-on-click="false">
                            <el-icon class="toolbar-icon"><Setting /></el-icon>
                            <template #dropdown>
                                <el-dropdown-menu class="table-column-setting">
                                    <div class="video-mgmt-col-setting-panel">
                                        <el-checkbox-group v-model="showColumnKeys">
                                            <div class="video-mgmt-col-setting-list">
                                                <el-checkbox value="seriesName">剧集名</el-checkbox>
                                                <el-checkbox value="m3u8Url">播放地址(m3u8)</el-checkbox>
                                                <el-checkbox value="updatedAt">更新时间</el-checkbox>
                                            </div>
                                        </el-checkbox-group>
                                    </div>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </span>
                </div>

                <div class="drama-table-block" v-loading="loading">
                    <el-table
                        class="drama-op-table drama-op-table--compact"
                        :data="list"
                        style="width: 100%"
                        empty-text="暂无数据"
                    >
                        <el-table-column prop="fileId" label="fileId" min-width="120">
                            <template #default="{ row }">
                                <div class="copy-cell copy-cell--narrow">
                                    <span class="video-mgmt-fileid-full">{{ row.fileId || '—' }}</span>
                                    <el-button
                                        v-if="row.fileId"
                                        type="primary"
                                        link
                                        size="small"
                                        :icon="CopyDocument"
                                        class="episode-item__copy"
                                        @click.stop="copyFileId(row)"
                                    />
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="vid" label="vid" min-width="96">
                            <template #default="{ row }">
                                <div class="copy-cell copy-cell--narrow">
                                    <el-tooltip
                                        :content="String(row.vid ?? '')"
                                        placement="top"
                                        :show-after="200"
                                        popper-class="video-mgmt-ellipsis-tooltip"
                                        :disabled="!row.vid || !isMiddleTruncated(String(row.vid), 12)"
                                    >
                                        <span class="copy-text copy-text--vid">{{
                                            row.vid ? truncateMiddle(String(row.vid), 12) : '--'
                                        }}</span>
                                    </el-tooltip>
                                    <el-button
                                        v-if="row.vid"
                                        type="primary"
                                        link
                                        size="small"
                                        :icon="CopyDocument"
                                        class="episode-item__copy"
                                        @click.stop="copyVid(row)"
                                    />
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="title" label="上线剧名" min-width="118" align="center">
                            <template #default="{ row }">
                                <div class="copy-cell copy-cell--title">
                                    <div class="copy-cell__title-tail-main">
                                        <el-tooltip
                                            :content="String(row.title ?? '')"
                                            placement="top"
                                            :show-after="200"
                                            popper-class="video-mgmt-ellipsis-tooltip"
                                            :disabled="!row.title"
                                        >
                                            <div class="copy-cell__title-tail-trigger">
                                                <span class="video-title-tail-ellipsis">{{
                                                    row.title || '—'
                                                }}</span>
                                            </div>
                                        </el-tooltip>
                                    </div>
                                    <el-button
                                        v-if="row.title"
                                        type="primary"
                                        link
                                        size="small"
                                        :icon="CopyDocument"
                                        class="episode-item__copy"
                                        @click.stop="copyTitle(row)"
                                    />
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="seriesCount" label="第几集" width="60" align="center" />
                        <el-table-column
                            v-if="showColumnKeys.includes('seriesName')"
                            prop="seriesName"
                            label="剧集名"
                            min-width="84"
                            align="center"
                        >
                            <template #default="{ row }">
                                <el-tooltip
                                    :content="String(row.seriesName ?? '')"
                                    placement="top"
                                    :show-after="200"
                                    popper-class="video-mgmt-ellipsis-tooltip"
                                    :disabled="!isMiddleTruncated(String(row.seriesName ?? ''), 12)"
                                >
                                    <span class="cell-mid-ellipsis cell-mid-ellipsis--series">{{
                                        truncateMiddle(String(row.seriesName ?? ''), 12)
                                    }}</span>
                                </el-tooltip>
                            </template>
                        </el-table-column>
                        <el-table-column prop="duration" label="时长" width="72" align="center" />
                        <el-table-column prop="fileSize" label="文件大小" width="84" align="center">
                            <template #default="{ row }">
                                {{ formatFileSizeMB(row.fileSize) }}
                            </template>
                        </el-table-column>

                        <el-table-column prop="playUrl" label="播放地址(MP4)" min-width="118" align="center">
                            <template #default="{ row }">
                                <div class="copy-cell copy-cell--url">
                                    <el-tooltip
                                        :content="String(row.playUrl ?? '')"
                                        placement="top"
                                        :show-after="200"
                                        popper-class="video-mgmt-ellipsis-tooltip"
                                        :disabled="!isMiddleTruncated(String(row.playUrl ?? ''), 14)"
                                    >
                                        <span class="copy-text copy-text--url">
                                            {{ truncateMiddle(String(row.playUrl ?? ''), 14) }}
                                        </span>
                                    </el-tooltip>
                                    <el-button
                                        v-if="row.playUrl"
                                        type="primary"
                                        link
                                        size="small"
                                        :icon="CopyDocument"
                                        class="episode-item__copy"
                                        :loading="copyMp4LoadingMap[row.seresId]"
                                        @click.stop="copyMp4(row)"
                                    />
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column prop="youtubeId" label="YVID" min-width="96" align="center">
                            <template #default="{ row }">
                                <div class="copy-cell copy-cell--narrow">
                                    <el-tooltip
                                        :content="String(row.youtubeId ?? '')"
                                        placement="top"
                                        :show-after="200"
                                        popper-class="video-mgmt-ellipsis-tooltip"
                                        :disabled="!row.youtubeId || !isMiddleTruncated(String(row.youtubeId), 12)"
                                    >
                                        <span class="copy-text copy-text--vid">{{
                                            row.youtubeId ? truncateMiddle(String(row.youtubeId), 12) : '—'
                                        }}</span>
                                    </el-tooltip>
                                    <el-button
                                        v-if="row.youtubeId"
                                        type="primary"
                                        link
                                        size="small"
                                        :icon="CopyDocument"
                                        class="episode-item__copy"
                                        @click.stop="copyYoutubeId(row)"
                                    />
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column
                            v-if="showColumnKeys.includes('m3u8Url')"
                            label="播放地址(m3u8)"
                            min-width="118"
                            align="center"
                        >
                            <template #default="{ row }">
                                <div class="copy-cell copy-cell--url">
                                    <el-tooltip
                                        :content="String(row.m3u8Url ?? '')"
                                        placement="top"
                                        :show-after="200"
                                        popper-class="video-mgmt-ellipsis-tooltip"
                                        :disabled="!isMiddleTruncated(String(row.m3u8Url ?? ''), 14)"
                                    >
                                        <span class="copy-text copy-text--url">{{
                                            truncateMiddle(String(row.m3u8Url ?? ''), 14)
                                        }}</span>
                                    </el-tooltip>
                                    <el-button
                                        v-if="row.m3u8Url"
                                        type="primary"
                                        link
                                        size="small"
                                        :icon="CopyDocument"
                                        class="episode-item__copy"
                                        :loading="copyM3u8LoadingMap[row.seresId]"
                                        @click.stop="copyM3u8(row)"
                                    />
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column prop="handleStatus" label="处理状态" width="92" align="center">
                            <template #default="{ row }">
                                <el-tag :type="handleStatusTagType(row.handleStatus)" effect="light" size="small">
                                    {{ handleStatusLabel(row.handleStatus) }}
                                </el-tag>
                            </template>
                        </el-table-column>

                        <el-table-column prop="createdAt" label="创建时间" min-width="122" align="center">
                            <template #default="{ row }">
                                <el-tooltip
                                    :content="String(row.createdAt ?? '')"
                                    placement="top"
                                    :show-after="200"
                                    popper-class="video-mgmt-ellipsis-tooltip"
                                    :disabled="!isMiddleTruncated(String(row.createdAt ?? ''), 19)"
                                >
                                    <span class="cell-mid-ellipsis cell-mid-ellipsis--time">{{
                                        truncateMiddle(String(row.createdAt ?? ''), 19)
                                    }}</span>
                                </el-tooltip>
                            </template>
                        </el-table-column>
                        <el-table-column
                            v-if="showColumnKeys.includes('updatedAt')"
                            prop="updatedAt"
                            label="更新时间"
                            min-width="122"
                            align="center"
                        >
                            <template #default="{ row }">
                                <el-tooltip
                                    :content="String(row.updatedAt ?? '')"
                                    placement="top"
                                    :show-after="200"
                                    popper-class="video-mgmt-ellipsis-tooltip"
                                    :disabled="!isMiddleTruncated(String(row.updatedAt ?? ''), 19)"
                                >
                                    <span class="cell-mid-ellipsis cell-mid-ellipsis--time">{{
                                        truncateMiddle(String(row.updatedAt ?? ''), 19)
                                    }}</span>
                                </el-tooltip>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>

                <div class="pagination-wrapper">
                    <el-pagination
                        v-model:current-page="currentPage"
                        v-model:page-size="pageSize"
                        :total="total"
                        :page-sizes="[10, 20, 50]"
                        layout="total, sizes, ->, prev, pager, next, jumper"
                        prev-text="上一页"
                        next-text="下一页"
                        @size-change="handlePageSizeChange"
                        @current-change="handleCurrentChange"
                    />
                </div>
            </el-card>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, Refresh, Setting } from '@element-plus/icons-vue'
import { getSupportLanguagePage } from '@/api'
import {
    getDramaSeriesInfoPage,
    getDramaSeriesInfoPlayUrl,
    type DramaSeriesInfoPlayUrlType,
    type DramaSeriesInfoPageRecord,
} from '@/api/drama'

const title = {
    firstTitle: '短剧管理',
    secondTitle: '视频管理',
}

const searchForm = reactive({
    vid: '',
    fileId: '',
    title: '',
    languageCode: '',
    handleStatus: '' as '' | -1 | 0 | 1 | 2,
    sortType: 0 as 0 | 1 | 2,
    /** 全部不传 hasYoutubeId；有/无对应 true/false */
    hasYoutubeIdFilter: '' as '' | 'has' | 'none',
})

/** 默认不展示：剧集名、m3u8、更新时间 */
const showColumnKeys = ref<string[]>([])

const languageOptionsLoading = ref(false)
const languageOptions = ref<Array<{ languageCode: string; languageName: string; label: string }>>([])

async function loadLanguageOptions() {
    if (languageOptionsLoading.value) return
    languageOptionsLoading.value = true
    try {
        const res: any = await getSupportLanguagePage({ current: 1, size: 500 })
        const data = res?.data?.data ?? res?.data
        const records = data?.records ?? []
        languageOptions.value = records
            .map((r: any) => {
                const languageCode = r?.languageCode ?? ''
                const languageName = r?.languageName ?? r?.languageCode ?? ''
                return {
                    languageCode,
                    languageName,
                    label: `${languageName} (${languageCode})`,
                }
            })
            .filter((x: any) => x.languageCode)
    } catch {
        languageOptions.value = []
    } finally {
        languageOptionsLoading.value = false
    }
}

const loading = ref(false)
const list = ref<DramaSeriesInfoPageRecord[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

function resolveHasYoutubeIdParam(): boolean | undefined {
    if (searchForm.hasYoutubeIdFilter === 'has') return true
    if (searchForm.hasYoutubeIdFilter === 'none') return false
    return undefined
}

async function loadList() {
    loading.value = true
    try {
        const res: any = await getDramaSeriesInfoPage({
            current: currentPage.value,
            size: pageSize.value,
            vid: searchForm.vid,
            fileId: searchForm.fileId,
            title: searchForm.title,
            languageCode: searchForm.languageCode,
            handleStatus: searchForm.handleStatus === '' ? undefined : searchForm.handleStatus,
            sortType: searchForm.sortType,
            hasYoutubeId: resolveHasYoutubeIdParam(),
        })
        const body = res?.data ?? res
        const pageData = body?.data ?? body
        list.value = (pageData?.records ?? []) as DramaSeriesInfoPageRecord[]
        total.value = Number(pageData?.total ?? 0)
        currentPage.value = Number(pageData?.current ?? currentPage.value)
        pageSize.value = Number(pageData?.size ?? pageSize.value)
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '加载失败')
    } finally {
        loading.value = false
    }
}

function handleSearch() {
    currentPage.value = 1
    void loadList()
}

function handleReset() {
    searchForm.vid = ''
    searchForm.fileId = ''
    searchForm.title = ''
    searchForm.languageCode = ''
    searchForm.handleStatus = ''
    searchForm.sortType = 0
    searchForm.hasYoutubeIdFilter = ''
    currentPage.value = 1
    pageSize.value = 10
    void loadList()
}

function handlePageSizeChange() {
    currentPage.value = 1
    void loadList()
}

function handleCurrentChange() {
    void loadList()
}

// 中间省略（仅中间一段 ...，避免 CSS 末尾再出现省略号）
function truncateMiddle(s: string, maxLen: number) {
    if (!s || s.length <= maxLen) return s
    const ellipsis = '...'
    if (maxLen <= ellipsis.length) return s.slice(0, maxLen)
    const avail = maxLen - ellipsis.length
    const leftLen = Math.ceil(avail / 2)
    const rightLen = Math.floor(avail / 2)
    return `${s.slice(0, leftLen)}${ellipsis}${s.slice(-rightLen)}`
}

/** 是否与 truncateMiddle 展示不一致（用于悬停展示全文、无省略时不弹出 tooltip） */
function isMiddleTruncated(raw: string, maxLen: number): boolean {
    const s = String(raw ?? '')
    if (!s) return false
    return truncateMiddle(s, maxLen) !== s
}

function handleStatusLabel(h: any): string {
    const n = Number(h)
    if (n === -1) return '上传错误'
    if (n === 0) return '上传中'
    if (n === 1) return '处理中'
    if (n === 2) return '处理完成'
    return '--'
}

function handleStatusTagType(h: any): 'danger' | 'warning' | 'primary' | 'success' | 'info' {
    const n = Number(h)
    if (n === -1) return 'danger'
    if (n === 0) return 'warning'
    if (n === 1) return 'primary'
    if (n === 2) return 'success'
    return 'info'
}

function formatFileSizeMB(v: any): string {
    if (v == null || v === '') return '—'
    const bytes = Number(v)
    if (!Number.isFinite(bytes)) return '—'
    const mb = bytes / 1000 / 1000
    return `${mb.toFixed(2)}MB`
}

const copyMp4LoadingMap = reactive<Record<number, boolean>>({})
const copyM3u8LoadingMap = reactive<Record<number, boolean>>({})

async function copyFileId(row: DramaSeriesInfoPageRecord) {
    if (!row.fileId) {
        ElMessage.error('fileId为空')
        return
    }
    try {
        await navigator.clipboard.writeText(row.fileId)
        ElMessage.success('fileId已复制')
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '复制失败')
    }
}

async function copyVid(row: DramaSeriesInfoPageRecord) {
    if (!row.vid) {
        ElMessage.error('vid为空')
        return
    }
    try {
        await navigator.clipboard.writeText(row.vid)
        ElMessage.success('vid已复制')
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '复制失败')
    }
}

async function copyYoutubeId(row: DramaSeriesInfoPageRecord) {
    const id = row.youtubeId != null ? String(row.youtubeId).trim() : ''
    if (!id) {
        ElMessage.error('YVID为空')
        return
    }
    try {
        await navigator.clipboard.writeText(id)
        ElMessage.success('YVID已复制')
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '复制失败')
    }
}

async function copyTitle(row: DramaSeriesInfoPageRecord) {
    const t = row.title != null ? String(row.title) : ''
    if (!t.trim()) {
        ElMessage.error('上线剧名为空')
        return
    }
    try {
        await navigator.clipboard.writeText(t)
        ElMessage.success('上线剧名已复制')
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '复制失败')
    }
}

async function copyMp4(row: DramaSeriesInfoPageRecord) {
    if (!row.seresId) return
    if (copyMp4LoadingMap[row.seresId]) return
    if (!row.playUrl) {
        ElMessage.error('MP4播放地址为空')
        return
    }
    const seresId = row.seresId
    copyMp4LoadingMap[seresId] = true
    try {
        await navigator.clipboard.writeText(row.playUrl)
        ElMessage.success('MP4地址已复制')
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '复制失败')
    } finally {
        copyMp4LoadingMap[seresId] = false
    }
}

async function copyM3u8(row: DramaSeriesInfoPageRecord) {
    if (!row.seresId) return
    if (copyM3u8LoadingMap[row.seresId]) return
    const seresId = row.seresId
    copyM3u8LoadingMap[seresId] = true
    try {
        const res: any = await getDramaSeriesInfoPlayUrl({
            seresId,
            type: 'm3u8' as DramaSeriesInfoPlayUrlType,
        })
        const body = res?.data ?? res
        const playUrl = body?.data?.playUrl ?? ''
        if (!playUrl || typeof playUrl !== 'string') {
            ElMessage.error('获取可播放地址失败')
            return
        }
        await navigator.clipboard.writeText(playUrl)
        ElMessage.success('m3u8地址已复制')
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '复制失败')
    } finally {
        copyM3u8LoadingMap[seresId] = false
    }
}

onMounted(async () => {
    await loadLanguageOptions()
    void loadList()
})
</script>

<style scoped>
.operation-drama-page :deep(.page-content-body) {
    padding-top: 0;
}

.drama-main-card {
    margin-top: 12px;
    border-radius: 20px;
    overflow: hidden;
}
.drama-main-card :deep(.el-card__body) {
    padding: 12px 20px 20px;
    box-sizing: border-box;
}

.search-form {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px 10px;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
}
.search-form--single-row > :deep(.el-form-item) {
    flex-shrink: 0;
}
.search-form :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 0;
}

.pagination-wrapper {
    margin-top: 14px;
    display: flex;
    justify-content: flex-end;
}

.table-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 12px 0 8px;
    margin-top: 0;
}
.toolbar-actions {
    display: flex;
    gap: 8px;
    margin-right: 10px;
}
.toolbar-icon {
    font-size: 16px;
    color: #909399;
    cursor: pointer;
}
.toolbar-icon:hover {
    color: #409eff;
}

.drama-table-block {
    position: relative;
    width: 100%;
}
.drama-table-block :deep(.el-loading-mask) {
    z-index: 2000;
}

.drama-op-table {
    --el-table-border-color: #ebeef5;
}
.drama-op-table :deep(.el-table__fixed-right),
.drama-op-table :deep(.el-table__fixed-left) {
    box-shadow: none !important;
}
.drama-op-table :deep(.el-table__inner-wrapper::before) {
    display: none;
}
.drama-op-table :deep(.el-table__cell) {
    border-right: none !important;
    border-left: none !important;
    border-top: none !important;
}
.drama-op-table :deep(thead th.el-table__cell),
.drama-op-table :deep(tbody td.el-table__cell) {
    border-bottom: 1px solid #ebeef5 !important;
}
.drama-op-table :deep(.el-table__header-wrapper) {
    border-radius: 8px;
    overflow: hidden;
}
.drama-op-table :deep(thead th.el-table__cell:first-child) {
    border-top-left-radius: 8px;
}
.drama-op-table :deep(thead th.el-table__cell:last-child) {
    border-top-right-radius: 8px;
}
.drama-op-table :deep(.el-table__header-wrapper th.el-table__cell) {
    background-color: #edf1fc !important;
    padding-top: 10px;
    padding-bottom: 10px;
    box-sizing: border-box;
    vertical-align: middle;
}
.drama-op-table :deep(.el-table__header .cell) {
    font-size: 13px;
    font-weight: 700;
    color: #000000;
    line-height: 18px;
}
.drama-op-table :deep(thead th.el-table__cell > .cell) {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    overflow-wrap: normal;
    word-break: keep-all;
    gap: 2px;
}
.drama-op-table :deep(thead th.el-table__cell .caret-wrapper) {
    flex-shrink: 0;
}
.drama-op-table :deep(.el-table__body .el-table__cell .cell) {
    font-size: 12px;
    color: #2f3542;
    line-height: 18px;
}
.drama-op-table :deep(.el-table__body .el-button.is-link) {
    font-size: 12px;
    line-height: 18px;
}
.drama-op-table :deep(.el-table__fixed-right-patch) {
    background-color: #edf1fc;
}

.drama-main-card :deep(.filter-input .el-input__wrapper) {
    min-height: 34px;
    padding: 0 10px;
    background-color: #edf1fc;
    border-radius: 8px;
    box-shadow: none;
    border: none;
}
.drama-main-card :deep(.filter-input .el-input__wrapper:hover),
.drama-main-card :deep(.filter-input .el-input__wrapper.is-focus) {
    box-shadow: none;
}
.drama-main-card :deep(.filter-input .el-input__inner) {
    height: 34px;
    line-height: 34px;
    font-size: 12px;
    color: #303133;
}
.drama-main-card :deep(.filter-select .el-select__wrapper) {
    min-height: 34px;
    padding: 0 10px;
    background-color: #edf1fc;
    border-radius: 8px;
    box-shadow: none !important;
    font-size: 12px;
}
.drama-main-card :deep(.filter-select .el-select__wrapper:hover),
.drama-main-card :deep(.filter-select .el-select__wrapper.is-focused) {
    box-shadow: none !important;
}
.filter-input--vid {
    width: 132px;
}
.filter-input--file-id {
    width: 180px;
}
.filter-input--title {
    width: 180px;
}
.filter-select--language-code {
    width: 180px;
}
.filter-select--handle-status {
    width: 130px;
}
.filter-select--sort-type {
    width: 150px;
}
.filter-select--yvid {
    width: 120px;
}

.video-mgmt-col-setting-panel {
    width: 180px;
    padding: 10px;
    max-height: 350px;
    overflow-y: auto;
}
.video-mgmt-col-setting-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.btn-query {
    min-width: 64px;
    height: 34px;
    padding: 0 12px;
    border-radius: 8px;
    font-size: 12px;
    background-color: #2d53eb;
    border-color: #2d53eb;
}
.btn-query:hover,
.btn-query:focus {
    background-color: #2447d4;
    border-color: #2447d4;
}
.btn-reset {
    min-width: 64px;
    height: 34px;
    padding: 0 12px;
    border-radius: 8px;
    font-size: 12px;
    background-color: #eef1fe;
    border: 1px solid #2d53eb;
    color: #2d53eb;
}
.btn-reset:hover,
.btn-reset:focus {
    background-color: #e4e9fc;
    border-color: #2d53eb;
    color: #2d53eb;
}

.copy-cell {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    min-width: 0;
}
.copy-cell--narrow {
    justify-content: flex-start;
}
.copy-cell--url {
    justify-content: center;
    width: 100%;
}
.copy-cell--title {
    justify-content: center;
    width: 100%;
}
.video-mgmt-fileid-full {
    flex: 1;
    min-width: 0;
    word-break: break-all;
    white-space: normal;
    line-height: 1.4;
    text-align: left;
}
.copy-cell__title-tail-main {
    flex: 1 1 0;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}
.copy-cell__title-tail-trigger {
    min-width: 0;
    max-width: 100%;
    width: 100%;
    overflow: hidden;
}
.video-title-tail-ellipsis {
    display: block;
    width: 100%;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: center;
}
.copy-text {
    min-width: 0;
    max-width: 92px;
    overflow: hidden;
    white-space: nowrap;
    /* 不使用 text-overflow: ellipsis，省略仅由 truncateMiddle 在中间插入 ... */
}
.copy-text--vid {
    max-width: 76px;
}
.copy-text--url {
    max-width: 88px;
}

/* 剧集名 / 时间：中间 ...；上线剧名使用尾部省略 video-title-tail-ellipsis */
.cell-mid-ellipsis {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    vertical-align: middle;
}
.cell-mid-ellipsis--series {
    max-width: 76px;
}
.cell-mid-ellipsis--time {
    max-width: 100%;
}

.drama-op-table--compact :deep(table) {
    table-layout: fixed;
    width: 100%;
}
.drama-op-table--compact :deep(.el-table__body .el-table__cell .cell) {
    padding-left: 4px;
    padding-right: 4px;
}
.drama-op-table--compact :deep(.el-tag--small) {
    padding: 0 6px;
}
</style>

<style>
/* Tooltip 挂载到 body，需非 scoped；长 URL / 剧名自动换行 */
.video-mgmt-ellipsis-tooltip {
    max-width: min(560px, 92vw) !important;
    box-sizing: border-box;
}
.video-mgmt-ellipsis-tooltip .el-tooltip__content,
.video-mgmt-ellipsis-tooltip .el-popper__inner {
    word-break: break-all;
    white-space: normal;
    line-height: 1.5;
}
</style>

