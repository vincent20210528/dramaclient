<template>
    <page-content :title="title" class="episode-management-page play-stat-detail-wrap">
        <template #bottom>
            <el-card shadow="never" class="episode-card drama-main-card">
                <div class="play-stat-detail-tab-strip" role="tablist" aria-label="详情视图切换">
                    <button
                        type="button"
                        role="tab"
                        class="play-stat-detail-tab-strip__btn"
                        :class="{ 'is-active': detailMainTab === 'playData' }"
                        :aria-selected="detailMainTab === 'playData'"
                        @click="detailMainTab = 'playData'"
                    >
                        播放数据明细
                    </button>
                    <button
                        type="button"
                        role="tab"
                        class="play-stat-detail-tab-strip__btn"
                        :class="{ 'is-active': detailMainTab === 'retention' }"
                        :aria-selected="detailMainTab === 'retention'"
                        @click="detailMainTab = 'retention'"
                    >
                        集间留存分析
                    </button>
                </div>
                <div class="episode-header play-stat-detail-header">
                    <div class="episode-header__left play-stat-detail-header__row">
                        <div class="play-stat-detail-panel play-stat-detail-panel--row">
                            <div class="play-stat-detail-cluster play-stat-detail-cluster--left">
                                <el-button class="episode-back-btn" :icon="ArrowLeft" @click="goBack" />
                                <span
                                    v-show="detailMainTab === 'playData'"
                                    class="play-stat-detail-date-tag"
                                >
                                    <el-icon class="play-stat-detail-date-tag__icon"><Calendar /></el-icon>
                                    统计日期 · {{ listStatDateDisplay }}
                                </span>
                                <div class="play-stat-detail-title-pair">
                                    <div
                                        class="play-stat-detail-seg play-stat-detail-seg--title"
                                        :title="onlineTitleDisplay"
                                    >
                                        <span class="play-stat-detail-seg__k">上线剧名：</span>
                                        <span class="play-stat-detail-seg__v">{{ onlineTitleDisplay }}</span>
                                    </div>
                                    <span class="play-stat-detail-title-dot" aria-hidden="true" />
                                    <div
                                        class="play-stat-detail-seg play-stat-detail-seg--title"
                                        :title="originTitleDisplay"
                                    >
                                        <span class="play-stat-detail-seg__k">原始剧名：</span>
                                        <span class="play-stat-detail-seg__v play-stat-detail-seg__v--muted">{{
                                            originTitleDisplay
                                        }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="play-stat-detail-cluster play-stat-detail-cluster--metrics">
                                <div class="play-stat-detail-metric">
                                    <span class="play-stat-detail-metric__k">vid</span>
                                    <span
                                        class="play-stat-detail-metric__v play-stat-detail-metric__v--mono play-stat-detail-metric__v--vid-line"
                                        :title="vidDisplayFull"
                                        >{{ vidDisplayFull }}</span
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    v-show="detailMainTab === 'playData'"
                    class="play-stat-detail-pane play-stat-detail-pane--play"
                >
                <el-form :model="detailForm" inline class="search-form search-form--single-row">
                    <el-form-item>
                        <el-input
                            v-model="detailForm.fileId"
                            class="filter-input filter-input--file-id"
                            placeholder="fileId"
                            clearable
                            @keyup.enter="handleSearch"
                        />
                    </el-form-item>
                    <el-form-item>
                        <el-input
                            v-model="detailForm.seriesIndex"
                            class="filter-input filter-input--episode"
                            placeholder="剧集"
                            clearable
                            @keyup.enter="handleSearch"
                        />
                    </el-form-item>
                    <el-form-item>
                        <el-select
                            v-model="detailForm.dataType"
                            class="filter-select filter-select--top100-scope"
                            placeholder="全部应用"
                            filterable
                            clearable
                            :loading="detailAppLoading"
                            @focus="onDetailAppFocus"
                            @change="onDetailDataTypeChange"
                        >
                            <el-option label="全部应用" value="overview" />
                            <el-option
                                v-for="opt in detailAppOptions"
                                :key="opt.value"
                                :label="opt.label"
                                :value="opt.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-select
                            v-model="detailForm.sortType"
                            class="filter-select filter-select--sort-type"
                            placeholder="排序方式"
                        >
                            <el-option label="播放次数" :value="0" />
                            <el-option label="播放流量" :value="1" />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-date-picker
                            v-model="detailForm.dateRange"
                            class="filter-date-range"
                            type="daterange"
                            range-separator="至"
                            start-placeholder="开始日期"
                            end-placeholder="结束日期"
                            value-format="YYYY-MM-DD"
                            clearable
                            :default-value="detailSearchDateRangeDefaultCalendar"
                            :disabled-date="disableDetailSearchDateRangeDate"
                        />
                    </el-form-item>
                    <el-form-item class="search-form__actions">
                        <el-button class="btn-query" type="primary" @click="handleSearch">查询</el-button>
                        <el-button class="btn-reset" @click="handleReset">重置</el-button>
                    </el-form-item>
                </el-form>

                <div class="play-stat-list-toolbar-row">
                    <div class="play-stat-list-summary" aria-live="polite">
                        <span
                            v-if="detailTableShowOptionalColumn('txPlayCount')"
                            class="play-stat-list-summary__pair"
                        >
                            <span class="play-stat-list-summary__label">总TX播放次数：</span>
                            <span
                                class="play-stat-list-summary__value play-stat-list-summary__value--times"
                                >{{ totalPlayCountSummary }}</span
                            >
                        </span>
                        <span class="play-stat-list-summary__pair">
                            <span class="play-stat-list-summary__label">总播放次数：</span>
                            <span
                                class="play-stat-list-summary__value play-stat-list-summary__value--times"
                                >{{ totalOwnerPlayTimesSummary }}</span
                            >
                        </span>
                        <span class="play-stat-list-summary__pair">
                            <span class="play-stat-list-summary__label">总播放流量：</span>
                            <span
                                class="play-stat-list-summary__value play-stat-list-summary__value--flux"
                                >{{ totalPlayTrafficSummary }}</span
                            >
                        </span>
                    </div>
                    <div class="table-toolbar play-stat-list-toolbar-row__toolbar">
                        <span class="toolbar-actions">
                            <el-icon class="toolbar-icon" @click="loadDetailList"><Refresh /></el-icon>
                            <el-tooltip effect="dark" content="列设置" placement="top">
                                <el-dropdown trigger="click" :hide-on-click="false" class="play-stat-detail-col-dropdown">
                                    <el-icon class="toolbar-icon" aria-label="列设置"><Setting /></el-icon>
                                    <template #dropdown>
                                        <el-dropdown-menu class="table-column-setting">
                                            <div class="play-stat-detail-col-setting-panel">
                                                <el-checkbox-group v-model="detailOptionalTableColumnKeys">
                                                    <div class="play-stat-detail-col-setting-list">
                                                        <el-checkbox label="txPlayCount">TX播放次数</el-checkbox>
                                                        <el-checkbox label="avgTxPlayProgress">平均TX播放进度</el-checkbox>
                                                        <el-checkbox label="txPlayCountRatio">TX播放次数占比</el-checkbox>
                                                    </div>
                                                </el-checkbox-group>
                                            </div>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </el-tooltip>
                        </span>
                    </div>
                </div>

                <div class="drama-table-block" v-loading="loading">
                    <el-table
                        :key="showDetailAppHostColumns ? 'detail-app' : 'detail-overview'"
                        class="drama-op-table play-stat-table--compact"
                        :class="{ 'play-stat-detail-table--overview': !showDetailAppHostColumns }"
                        :data="detailTableDisplayRows"
                        style="width: 100%"
                        empty-text="暂无数据"
                    >
                        <el-table-column
                            prop="fileId"
                            label="fileId"
                            align="center"
                            :min-width="detailColMin.fileId"
                        >
                            <template #default="{ row }">
                                <div
                                    class="play-stat-detail-fileid-cell"
                                    :class="{ 'play-stat-detail-fileid-cell--with-copy': !!row.fileId }"
                                >
                                    <span class="play-stat-detail-fileid-text" :title="row.fileId || undefined">{{
                                        row.fileId || '--'
                                    }}</span>
                                    <el-button
                                        v-if="row.fileId"
                                        type="primary"
                                        link
                                        size="small"
                                        :icon="CopyDocument"
                                        class="episode-item__copy play-stat-detail-fileid-copy"
                                        @click.stop="copyText(row.fileId, 'fileId')"
                                    />
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column
                            prop="episodeNo"
                            label="剧集"
                            align="center"
                            :min-width="detailColMin.episodeNo"
                        />
                        <el-table-column
                            prop="fileSize"
                            label="文件大小"
                            align="center"
                            :min-width="detailColMin.fileSize"
                        >
                            <template #default="{ row }">
                                {{ formatFileSizeCell(row.fileSize) }}
                            </template>
                        </el-table-column>
                        <el-table-column
                            v-if="showDetailAppHostColumns"
                            label="App包名"
                            align="center"
                            :min-width="detailColMin.app"
                        >
                            <template #default="{ row }">
                                <el-tooltip
                                    :content="formatAppLine(row)"
                                    placement="top"
                                    :show-after="200"
                                    popper-class="play-stat-ellipsis-tooltip"
                                    :disabled="formatAppLine(row) === '--'"
                                >
                                    <div class="copy-cell__tail-trigger copy-cell__tail-trigger--solo">
                                        <span class="play-stat-trunc play-stat-trunc--block play-stat-trunc--tail">{{
                                            formatAppLine(row)
                                        }}</span>
                                    </div>
                                </el-tooltip>
                            </template>
                        </el-table-column>
                        <el-table-column
                            v-if="showDetailAppHostColumns"
                            label="域名"
                            align="center"
                            :min-width="detailColMin.host"
                        >
                            <template #default="{ row }">
                                <div class="copy-cell copy-cell--center copy-cell--tight">
                                    <el-tooltip
                                        :content="row.hostName"
                                        placement="top"
                                        :show-after="200"
                                        popper-class="play-stat-ellipsis-tooltip"
                                        :disabled="row.hostName === '--' || !isMiddleTruncated(row.hostName, 20)"
                                    >
                                        <span class="play-stat-trunc">{{ truncateMiddle(row.hostName || '--', 20) }}</span>
                                    </el-tooltip>
                                    <el-button
                                        v-if="row.hostName && row.hostName !== '--'"
                                        type="primary"
                                        link
                                        size="small"
                                        :icon="CopyDocument"
                                        class="episode-item__copy"
                                        @click.stop="copyText(row.hostName, '域名')"
                                    />
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column
                            v-if="detailTableShowOptionalColumn('txPlayCount')"
                            prop="playCount"
                            align="center"
                            :min-width="detailColMin.txPlay"
                        >
                            <template #header>
                                <span class="play-stat-detail-th-tip">
                                    TX播放次数
                                    <el-tooltip
                                        content="腾讯云点播统计的播放次数（访问M3U8 文件时以及缓存都会计算播放次数）"
                                        placement="top"
                                        :show-after="200"
                                    >
                                        <el-icon class="play-stat-detail-th-tip__icon" tabindex="0">
                                            <QuestionFilled />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <template #default="{ row }">
                                {{ formatCount(row.playCount) }}
                            </template>
                        </el-table-column>
                        <el-table-column
                            prop="ownerPlayTimes"
                            align="center"
                            :min-width="detailColMin.owner"
                        >
                            <template #header>
                                <span class="play-stat-detail-th-tip">
                                    播放次数
                                    <el-tooltip content="App上报统计的播放次数" placement="top" :show-after="200">
                                        <el-icon class="play-stat-detail-th-tip__icon" tabindex="0">
                                            <QuestionFilled />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <template #default="{ row }">
                                {{ formatCount(row.ownerPlayTimes) }}
                            </template>
                        </el-table-column>
                        <el-table-column
                            prop="playTraffic"
                            label="播放流量"
                            align="center"
                            :min-width="detailColMin.traffic"
                            show-overflow-tooltip
                        >
                            <template #default="{ row }">
                                {{ formatTraffic(row.playTraffic) }}
                            </template>
                        </el-table-column>
                        <el-table-column
                            align="center"
                            :min-width="detailColMin.avgOwner"
                        >
                            <template #header>
                                <span class="play-stat-detail-th-tip">
                                    平均播放进度
                                    <el-tooltip
                                        content="平均播放进度 = 播放流量 /(播放次数×文件大小)"
                                        placement="top"
                                        :show-after="200"
                                    >
                                        <el-icon class="play-stat-detail-th-tip__icon" tabindex="0">
                                            <QuestionFilled />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <template #default="{ row }">
                                {{ formatAvgPlayProgressByOwner(row) }}
                            </template>
                        </el-table-column>
                        <el-table-column
                            align="center"
                            :min-width="detailColMin.ownerRatio"
                        >
                            <template #header>
                                <span class="play-stat-detail-th-tip">
                                    播放次数占比
                                    <el-tooltip
                                        content="占比 = 本行播放次数 / 总播放次数"
                                        placement="top"
                                        :show-after="200"
                                    >
                                        <el-icon class="play-stat-detail-th-tip__icon" tabindex="0">
                                            <QuestionFilled />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <template #default="{ row }">
                                {{ formatDetailOwnerPlayCountRatio(row) }}
                            </template>
                        </el-table-column>
                        <el-table-column
                            v-if="detailTableShowOptionalColumn('avgTxPlayProgress')"
                            align="center"
                            :min-width="detailColMin.avgTx"
                        >
                            <template #header>
                                <span class="play-stat-detail-th-tip">
                                    平均TX播放进度
                                    <el-tooltip
                                        content="平均TX播放进度 = 播放流量 /(TX播放次数×文件大小)"
                                        placement="top"
                                        :show-after="200"
                                    >
                                        <el-icon class="play-stat-detail-th-tip__icon" tabindex="0">
                                            <QuestionFilled />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <template #default="{ row }">
                                {{ formatAvgPlayProgress(row) }}
                            </template>
                        </el-table-column>
                        <el-table-column
                            v-if="detailTableShowOptionalColumn('txPlayCountRatio')"
                            align="center"
                            :min-width="detailColMin.txRatio"
                        >
                            <template #header>
                                <span class="play-stat-detail-th-tip">
                                    TX播放次数占比
                                    <el-tooltip
                                        content="占比=TX播放次数/总TX播放次数"
                                        placement="top"
                                        :show-after="200"
                                    >
                                        <el-icon class="play-stat-detail-th-tip__icon" tabindex="0">
                                            <QuestionFilled />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <template #default="{ row }">
                                {{ formatDetailCountRatio(row) }}
                            </template>
                        </el-table-column>
                        <el-table-column
                            align="center"
                            :min-width="detailColMin.fluxRatio"
                        >
                            <template #header>
                                <span class="play-stat-detail-th-tip">
                                    播放流量占比
                                    <el-tooltip
                                        content="占比=播放流量/总播放流量"
                                        placement="top"
                                        :show-after="200"
                                    >
                                        <el-icon class="play-stat-detail-th-tip__icon" tabindex="0">
                                            <QuestionFilled />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <template #default="{ row }">
                                {{ formatDetailFluxRatio(row) }}
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

                <div
                    v-show="episodeChartVisible"
                    class="play-stat-detail-chart-wrap"
                    aria-label="按集播放趋势"
                >
                    <div ref="episodeTrendChartRef" class="play-stat-detail-chart" />
                </div>
                </div>
                <div
                    v-show="detailMainTab === 'retention'"
                    class="play-stat-detail-pane play-stat-detail-pane--retention"
                >
                        <el-form
                            inline
                            label-width="0"
                            class="search-form search-form--single-row play-stat-retention-form"
                        >
                            <el-form-item class="play-stat-retention-form__app-select">
                                <el-select
                                    v-model="retentionPkgName"
                                    class="filter-select filter-select--top100-scope"
                                    placeholder="全部应用"
                                    aria-label="应用范围"
                                    filterable
                                    clearable
                                    :loading="detailAppLoading"
                                    @focus="onDetailAppFocus"
                                    @change="onRetentionPkgChange"
                                >
                                    <el-option label="全部应用" value="" />
                                    <el-option
                                        v-for="opt in detailAppOptions"
                                        :key="opt.value"
                                        :label="opt.label"
                                        :value="opt.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item class="search-form__actions">
                                <el-button type="primary" class="btn-query" @click="loadRetentionUserAction"
                                    >查询</el-button
                                >
                            </el-form-item>
                        </el-form>
                        <div
                            v-if="retentionSummaryVisible"
                            class="play-stat-list-summary play-stat-retention-summary"
                            aria-live="polite"
                        >
                            <span class="play-stat-list-summary__pair">
                                <span class="play-stat-list-summary__label">总观看人数：</span>
                                <span
                                    class="play-stat-list-summary__value play-stat-list-summary__value--times"
                                    >{{ formatCount(retentionSummaryPlayUserCount ?? 0) }}</span
                                >
                            </span>
                            <span class="play-stat-list-summary__pair">
                                <span class="play-stat-list-summary__label">总观看次数：</span>
                                <span
                                    class="play-stat-list-summary__value play-stat-list-summary__value--times"
                                    >{{ formatCount(retentionSummaryPlayCount ?? 0) }}</span
                                >
                            </span>
                            <span class="play-stat-list-summary__pair">
                                <span class="play-stat-list-summary__label">平均观看次数：</span>
                                <span
                                    class="play-stat-list-summary__value play-stat-list-summary__value--times"
                                    >{{ retentionSummaryAvgPlaysDisplay }}</span
                                >
                            </span>
                        </div>
                        <div class="drama-table-block" v-loading="retentionLoading">
                            <el-table
                                class="drama-op-table play-stat-table--compact"
                                :data="retentionTableDisplayRows"
                                style="width: 100%"
                                empty-text="暂无数据"
                            >
                                <el-table-column
                                    prop="currentEpisode"
                                    label="剧集"
                                    min-width="88"
                                    align="center"
                                />
                                <el-table-column
                                    prop="totalUsers"
                                    label="观看人数"
                                    min-width="104"
                                    align="center"
                                >
                                    <template #default="{ row }">{{ formatCount(row.totalUsers) }}</template>
                                </el-table-column>
                                <el-table-column
                                    prop="totalPlays"
                                    label="总播放量"
                                    min-width="112"
                                    align="center"
                                >
                                    <template #default="{ row }">{{ formatCount(row.totalPlays) }}</template>
                                </el-table-column>
                                <el-table-column label="人均播放次数" min-width="120" align="center">
                                    <template #default="{ row }">{{
                                        formatRetentionAvgPlays(row)
                                    }}</template>
                                </el-table-column>
                                <el-table-column
                                    prop="nextEpisodeUsers"
                                    label="续看人数"
                                    min-width="124"
                                    align="center"
                                >
                                    <template #default="{ row }">{{
                                        formatCount(row.nextEpisodeUsers)
                                    }}</template>
                                </el-table-column>
                                <el-table-column
                                    prop="nextEpisodeUserPlayCount"
                                    label="续看总播放量"
                                    min-width="148"
                                    align="center"
                                >
                                    <template #default="{ row }">{{
                                        formatCount(row.nextEpisodeUserPlayCount)
                                    }}</template>
                                </el-table-column>
                                <el-table-column label="续看平均播放次数" min-width="140" align="center">
                                    <template #default="{ row }">{{
                                        formatRetentionContinueAvgPlays(row)
                                    }}</template>
                                </el-table-column>
                                <el-table-column label="续看留存率" min-width="96" align="center">
                                    <template #default="{ row }">{{
                                        formatRetentionRateDisplay(row.retentionRate)
                                    }}</template>
                                </el-table-column>
                            </el-table>
                        </div>
                        <div class="pagination-wrapper">
                            <el-pagination
                                v-model:current-page="retentionCurrentPage"
                                v-model:page-size="retentionPageSize"
                                :total="retentionTotal"
                                :page-sizes="[10, 20, 50]"
                                layout="total, sizes, ->, prev, pager, next, jumper"
                                prev-text="上一页"
                                next-text="下一页"
                                @size-change="handleRetentionPageSizeChange"
                            />
                        </div>
                        <div class="play-stat-retention-charts" aria-label="留存可视化">
                            <div
                                v-if="!retentionLoading && retentionRowsSorted.length === 0"
                                class="play-stat-retention-charts-empty"
                            >
                                暂无留存数据（请先查询或确认 vid）
                            </div>
                            <template v-else-if="retentionRowsSorted.length > 0">
                                <div class="play-stat-retention-trend-wrap">
                                    <div class="play-stat-retention-trend-head">
                                        <div class="play-stat-retention-trend-head-inner">
                                            <span class="play-stat-retention-trend-title">留存率趋势图</span>
                                            <el-tooltip
                                                content="用户分析流失严重的集数，目前的基准值是60%"
                                                placement="top"
                                            >
                                                <el-icon
                                                    class="play-stat-retention-trend-help"
                                                    :size="16"
                                                    aria-label="说明"
                                                >
                                                    <QuestionFilled />
                                                </el-icon>
                                            </el-tooltip>
                                        </div>
                                    </div>
                                    <div
                                        ref="retentionTrendChartRef"
                                        class="play-stat-retention-chart play-stat-retention-chart--trend"
                                    />
                                </div>
                                <div class="play-stat-retention-charts-split">
                                    <div class="play-stat-retention-chart-shell">
                                        <div class="play-stat-retention-trend-head">
                                            <div class="play-stat-retention-trend-head-inner">
                                                <span class="play-stat-retention-trend-title">观看人数双柱图</span>
                                                <el-tooltip
                                                    content="该图表分析每集的用户粘性，柱子高度相近，表示追剧意愿强，差距突然拉大，说明该集劝退了很多人"
                                                    placement="top"
                                                >
                                                    <el-icon
                                                        class="play-stat-retention-trend-help"
                                                        :size="16"
                                                        aria-label="说明"
                                                    >
                                                        <QuestionFilled />
                                                    </el-icon>
                                                </el-tooltip>
                                            </div>
                                        </div>
                                        <div
                                            ref="retentionBarChartRef"
                                            class="play-stat-retention-chart play-stat-retention-chart--split"
                                        />
                                    </div>
                                    <div class="play-stat-retention-chart-shell">
                                        <div class="play-stat-retention-trend-head">
                                            <div class="play-stat-retention-trend-head-inner">
                                                <span class="play-stat-retention-trend-title">人均播放次数趋势图</span>
                                                <el-tooltip
                                                    content="用来识别神集和问题集，远超基准线表示可能是用户反复观看的「高光集」，远低于基准线表示可能是用户看不下去的「劝退集」"
                                                    placement="top"
                                                >
                                                    <el-icon
                                                        class="play-stat-retention-trend-help"
                                                        :size="16"
                                                        aria-label="说明"
                                                    >
                                                        <QuestionFilled />
                                                    </el-icon>
                                                </el-tooltip>
                                            </div>
                                        </div>
                                        <div
                                            ref="retentionAvgPlaysChartRef"
                                            class="play-stat-retention-chart play-stat-retention-chart--split"
                                        />
                                    </div>
                                </div>
                                <div class="play-stat-retention-charts-split">
                                    <div class="play-stat-retention-chart-shell">
                                        <div class="play-stat-retention-trend-head">
                                            <div class="play-stat-retention-trend-head-inner">
                                                <span class="play-stat-retention-trend-title"
                                                    >留存率 vs 人均播放次数散点图</span
                                                >
                                            </div>
                                        </div>
                                        <div
                                            ref="retentionScatterChartRef"
                                            class="play-stat-retention-chart play-stat-retention-chart--split"
                                        />
                                    </div>
                                    <div class="play-stat-retention-chart-shell">
                                        <div class="play-stat-retention-trend-head">
                                            <div class="play-stat-retention-trend-head-inner">
                                                <span class="play-stat-retention-trend-title">留存率平滑趋势图</span>
                                                <el-tooltip
                                                    content="消除单集波动，看留存率整体趋势"
                                                    placement="top"
                                                >
                                                    <el-icon
                                                        class="play-stat-retention-trend-help"
                                                        :size="16"
                                                        aria-label="说明"
                                                    >
                                                        <QuestionFilled />
                                                    </el-icon>
                                                </el-tooltip>
                                            </div>
                                        </div>
                                        <div
                                            ref="retentionMaRetentionChartRef"
                                            class="play-stat-retention-chart play-stat-retention-chart--split"
                                        />
                                    </div>
                                </div>
                                <div class="play-stat-retention-charts-split play-stat-retention-charts-split--pie-only">
                                    <div
                                        ref="retentionPieChartRef"
                                        class="play-stat-retention-chart play-stat-retention-chart--split"
                                    />
                                </div>
                            </template>
                        </div>
                </div>
            </el-card>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import type { EChartsOption, SeriesOption } from 'echarts'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Calendar, CopyDocument, QuestionFilled, Refresh, Setting } from '@element-plus/icons-vue'
import { getAppList } from '@/api/app'
import {
    getVodPlayDailyInfoDetail,
    postVodPlayDailyUserActionPlay,
    type VodPlayUserActionPlayPayload,
    type VodPlayUserActionPlayRow,
} from '@/api/drama'
import {
    formatAppLine,
    formatCount,
    formatTraffic,
    normalizePlayStatRow,
    parseSeriesIndexForApi,
    getPlayStatListRouteName,
    mapGetAppListToSelectOptions,
    resolvePlayStatDataType,
    type PlayStatRow,
} from './playStatUtils'
import { hasPerm, PERM_VOD_PLAY_DAILY_INFO } from '@/utils/permission'

const route = useRoute()
const router = useRouter()

const canViewPlayStatDetail = computed(() => hasPerm(PERM_VOD_PLAY_DAILY_INFO.list))

/** 与剧集详情一致：不占用 PageContent 顶栏，标题放在卡片内 */
const title = computed(() => ({
    firstTitle: '',
    secondTitle: '',
}))

/** 上线剧名（主标题） */
const onlineTitleDisplay = computed(() => String(route.query.onlineTitle ?? '').trim() || '--')

/** 原始剧名（副标题） */
const originTitleDisplay = computed(() => String(route.query.originTitle ?? '').trim() || '--')

/** vid 展示：39980799 （共68集）；无 dramaCount 则仅 vid */
const vidDisplayFull = computed(() => {
    const vid = String(route.params.vid ?? '').trim() || '--'
    const n = parseQueryNumber('dramaCount')
    if (n == null || n < 0 || !Number.isFinite(n)) return vid
    return `${vid} （共${n}集）`
})

function parseQueryNumber(key: string): number | null {
    const raw = route.query[key]
    const s = String(Array.isArray(raw) ? raw[0] : raw ?? '').trim()
    if (!s) return null
    const n = Number(s)
    return Number.isFinite(n) ? n : null
}

/** 详情接口 `data.totalPlayTimes` / `data.totalOwnerPlayTimes` / `data.totalFlux`，用于汇总条与占比分母（优先于路由 query） */
const detailAggregateTotalPlayTimes = ref<number | null>(null)
const detailAggregateTotalOwnerPlayTimes = ref<number | null>(null)
const detailAggregateTotalFlux = ref<number | null>(null)

/** 汇总条总 TX 播放次数：接口 totalPlayTimes 优先，否则路由 totalPlayCount */
const totalPlayCountSummary = computed(() => {
    const api = detailAggregateTotalPlayTimes.value
    if (api != null && Number.isFinite(api)) return formatCount(api)
    const n = parseQueryNumber('totalPlayCount')
    return n != null ? formatCount(n) : '--'
})

/** 汇总条总播放次数：接口 totalOwnerPlayTimes 优先，否则路由 totalOwnerPlayCount */
const totalOwnerPlayTimesSummary = computed(() => {
    const api = detailAggregateTotalOwnerPlayTimes.value
    if (api != null && Number.isFinite(api)) return formatCount(api)
    const n = parseQueryNumber('totalOwnerPlayCount')
    return n != null ? formatCount(n) : '--'
})

/** 汇总条总播放流量：接口 totalFlux 优先，否则路由 totalPlayTraffic */
const totalPlayTrafficSummary = computed(() => {
    const api = detailAggregateTotalFlux.value
    if (api != null && Number.isFinite(api)) return formatTraffic(api)
    const n = parseQueryNumber('totalPlayTraffic')
    return n != null ? formatTraffic(n) : '--'
})

/** 占比分母：与汇总条一致，优先接口汇总 */
const dramaTotalPlayCount = computed(() => {
    const api = detailAggregateTotalPlayTimes.value
    if (api != null && Number.isFinite(api) && api > 0) return api
    return parseQueryNumber('totalPlayCount')
})
const dramaTotalPlayTraffic = computed(() => {
    const api = detailAggregateTotalFlux.value
    if (api != null && Number.isFinite(api) && api > 0) return api
    return parseQueryNumber('totalPlayTraffic')
})

/** 总播放次数分母（与汇总条「总播放次数」一致） */
const dramaTotalOwnerPlayCount = computed(() => {
    const api = detailAggregateTotalOwnerPlayTimes.value
    if (api != null && Number.isFinite(api) && api > 0) return api
    return parseQueryNumber('totalOwnerPlayCount')
})

/** 本行播放次数 / 总播放次数（与汇总条一致） */
function formatDetailOwnerPlayCountRatio(row: PlayStatRow): string {
    const denom = dramaTotalOwnerPlayCount.value
    const v = Number(row.ownerPlayTimes ?? 0)
    if (denom == null || denom <= 0 || !Number.isFinite(v)) return '--'
    return `${((v / denom) * 100).toFixed(2)}%`
}

/** 本行 TX 播放次数 / 该剧总 TX 播放次数 */
function formatDetailCountRatio(row: PlayStatRow): string {
    const denom = dramaTotalPlayCount.value
    const v = Number(row.playCount ?? 0)
    if (denom == null || denom <= 0 || !Number.isFinite(v)) return '--'
    return `${((v / denom) * 100).toFixed(2)}%`
}

/** 本行流量 / 该剧总流量 */
function formatDetailFluxRatio(row: PlayStatRow): string {
    const denom = dramaTotalPlayTraffic.value
    const v = Number(row.playTraffic ?? 0)
    if (denom == null || denom <= 0 || !Number.isFinite(v)) return '--'
    return `${((v / denom) * 100).toFixed(2)}%`
}

/** 单行文件大小（字节），与播放流量同一套 MB/GB 展示 */
function formatFileSizeCell(fileSize: number | null): string {
    if (fileSize == null || !Number.isFinite(Number(fileSize))) return '--'
    return formatTraffic(fileSize)
}

/** 平均TX播放进度百分比数值（播放流量/TX播放次数/文件大小×100），无效返回 null */
function episodeAvgProgressPercent(row: PlayStatRow): number | null {
    const flux = Number(row.playTraffic ?? 0)
    const cnt = Number(row.playCount ?? 0)
    const fsRaw = row.fileSize
    const fs = fsRaw != null ? Number(fsRaw) : NaN
    if (!Number.isFinite(cnt) || cnt <= 0) return null
    if (!Number.isFinite(flux) || flux < 0) return null
    if (!Number.isFinite(fs) || fs <= 0) return null
    const avgBytesPerPlay = flux / cnt
    const ratio = avgBytesPerPlay / fs
    if (!Number.isFinite(ratio)) return null
    return ratio * 100
}

/** 平均播放进度（按本列「播放次数」）：播放流量 /(播放次数×文件大小)×100 */
function episodeAvgProgressPercentByOwner(row: PlayStatRow): number | null {
    const flux = Number(row.playTraffic ?? 0)
    const cnt = Number(row.ownerPlayTimes ?? 0)
    const fsRaw = row.fileSize
    const fs = fsRaw != null ? Number(fsRaw) : NaN
    if (!Number.isFinite(cnt) || cnt <= 0) return null
    if (!Number.isFinite(flux) || flux < 0) return null
    if (!Number.isFinite(fs) || fs <= 0) return null
    const avgBytesPerPlay = flux / cnt
    const ratio = avgBytesPerPlay / fs
    if (!Number.isFinite(ratio)) return null
    return ratio * 100
}

function formatAvgPlayProgressByOwner(row: PlayStatRow): string {
    const pct = episodeAvgProgressPercentByOwner(row)
    if (pct == null || !Number.isFinite(pct)) return '--'
    return `${pct.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

/**
 * 平均TX播放进度：（播放流量 / TX播放次数）/ 文件大小（均为字节量级），结果按百分比展示。
 */
function formatAvgPlayProgress(row: PlayStatRow): string {
    const pct = episodeAvgProgressPercent(row)
    if (pct == null || !Number.isFinite(pct)) return '--'
    return `${pct.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

function getYesterdayYmd() {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

const loading = ref(false)
const list = ref<PlayStatRow[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

/** 详情表可选列（默认不勾选：TX 播放次数、平均TX播放进度、TX播放次数占比） */
const detailOptionalTableColumnKeys = ref<string[]>([])

function detailTableShowOptionalColumn(key: string): boolean {
    return detailOptionalTableColumnKeys.value.includes(key)
}

const detailForm = reactive({
    /** 与接口 startTime / endTime 对应，默认由列表页 query 同步 */
    dateRange: [] as string[],
    fileId: '',
    seriesIndex: '',
    /** overview=全部应用 | 具体包名（下拉不含「分览」；请求侧仍兼容 detailedView） */
    dataType: 'overview',
    /** 0 播放量 1 流量 */
    sortType: 0 as 0 | 1,
})

/** 从路由同步详情日期范围：startTime/endTime，兼容旧 statDate */
function syncDetailDateRangeFromRoute() {
    const st = String(route.query.startTime ?? '').trim()
    const et = String(route.query.endTime ?? '').trim()
    let a = st
    let b = et
    if (a && !b) b = a
    if (!a && b) a = b
    if (!a && !b) {
        const leg = String(route.query.statDate ?? '').trim()
        if (leg) {
            a = leg
            b = leg
        }
    }
    if (!a && !b) {
        const y = getYesterdayYmd()
        a = y
        b = y
    }
    detailForm.dateRange = [a, b]
}
syncDetailDateRangeFromRoute()

/** 详情搜索日期：打开面板且无选中值时，左上月、右当月 */
const detailSearchDateRangeDefaultCalendar = computed((): [Date, Date] => {
    const now = new Date()
    return [
        new Date(now.getFullYear(), now.getMonth() - 1, 1),
        new Date(now.getFullYear(), now.getMonth(), 1),
    ]
})

/** 与列表页一致：最近 60 天至昨天可选 */
function disableDetailSearchDateRangeDate(date: Date) {
    const target = new Date(date)
    target.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const earliest = new Date(today)
    earliest.setDate(earliest.getDate() - 60)
    earliest.setHours(0, 0, 0, 0)
    return target.getTime() >= today.getTime() || target.getTime() < earliest.getTime()
}

/** 顶部「统计日期」：与搜索区起止一致，同日只显示一天 */
const listStatDateDisplay = computed(() => {
    const arr = Array.isArray(detailForm.dateRange) ? detailForm.dateRange : []
    const a = String(arr[0] ?? '').trim()
    const b = String(arr[1] ?? '').trim()
    if (a && b) return a === b ? a : `${a} 至 ${b}`
    if (a) return a
    if (b) return b
    return '--'
})

/**
 * 折线图是否展示：仅在最近一次「查询/加载」成功后更新（不因输入框临时改动变化）。
 * 条件与原先一致：全部应用(overview)或选中 App、路由 dramaCount 有效、且本次请求未带 fileId/剧集筛选。
 */
const episodeChartVisible = ref(false)

function evaluateEpisodeChartVisibleAfterLoad(): boolean {
    const dt = detailForm.dataType
    const overview = dt === 'overview'
    const appPkg = dt !== 'overview' && dt !== 'detailedView' && String(dt).trim() !== ''
    const dc = parseQueryNumber('dramaCount')
    return (
        (overview || appPkg) &&
        dc != null &&
        dc > 0 &&
        !detailForm.fileId.trim() &&
        !String(detailForm.seriesIndex ?? '').trim()
    )
}

/** 全部应用或选中某一 App：接口一次拉满（size=dramaCount），表格仍按每页条数前端分页 */
function isFullEpisodeFetchMode(): boolean {
    const dc = parseQueryNumber('dramaCount')
    const dt = detailForm.dataType
    const overview = dt === 'overview'
    const appPkg = dt !== 'overview' && dt !== 'detailedView' && String(dt).trim() !== ''
    return (overview || appPkg) && dc != null && dc > 0
}

function resolveDetailRequestSize(): number {
    if (isFullEpisodeFetchMode()) {
        const dc = parseQueryNumber('dramaCount')!
        return Math.min(Math.floor(dc), 500)
    }
    return pageSize.value
}

/**
 * 上一次查询是否为「全部应用/App 一次拉满」：用于表格前端分页切片。
 * 切换分览等筛选但不点查询时仍为 true，列表数据与展示行数保持不变。
 */
const detailTableUsesClientSlice = ref(false)

/** 全量拉取成功后的表格：按当前页切片；服务端分页或切换条件未查询时整表展示 list */
const detailTableDisplayRows = computed(() => {
    if (!detailTableUsesClientSlice.value) return list.value
    const start = (currentPage.value - 1) * pageSize.value
    return list.value.slice(start, start + pageSize.value)
})

/** 详情主 Tab：剧集播放数据 | 剧集留存表现 */
const detailMainTab = ref<'playData' | 'retention'>('playData')

/** 留存接口：选具体包名时传 pkgName；空字符串为全部应用（不传 pkgName） */
const retentionPkgName = ref('')
const retentionList = ref<VodPlayUserActionPlayRow[]>([])
const retentionLoading = ref(false)
/** 留存接口全剧汇总（新版 data.totalPlayCount / totalPlayUserCount） */
const retentionSummaryPlayCount = ref<number | null>(null)
const retentionSummaryPlayUserCount = ref<number | null>(null)

function resetRetentionSummary() {
    retentionSummaryPlayCount.value = null
    retentionSummaryPlayUserCount.value = null
}

function parseUserActionPlayBodyData(raw: unknown): {
    records: VodPlayUserActionPlayRow[]
    totalPlayCount: number | null
    totalPlayUserCount: number | null
} {
    if (Array.isArray(raw)) {
        return {
            records: raw as VodPlayUserActionPlayRow[],
            totalPlayCount: null,
            totalPlayUserCount: null,
        }
    }
    if (raw && typeof raw === 'object') {
        const o = raw as VodPlayUserActionPlayPayload
        const rec = (o as { records?: unknown }).records
        const records = Array.isArray(rec) ? (rec as VodPlayUserActionPlayRow[]) : []
        const tpc = Number((o as { totalPlayCount?: unknown }).totalPlayCount)
        const tpuc = Number((o as { totalPlayUserCount?: unknown }).totalPlayUserCount)
        return {
            records,
            totalPlayCount: Number.isFinite(tpc) ? tpc : null,
            totalPlayUserCount: Number.isFinite(tpuc) ? tpuc : null,
        }
    }
    return { records: [], totalPlayCount: null, totalPlayUserCount: null }
}

const retentionSummaryVisible = computed(
    () =>
        retentionSummaryPlayCount.value != null &&
        retentionSummaryPlayUserCount.value != null,
)

const retentionSummaryAvgPlaysDisplay = computed(() => {
    const cnt = retentionSummaryPlayCount.value
    const users = retentionSummaryPlayUserCount.value
    if (cnt == null || users == null || users <= 0 || !Number.isFinite(cnt) || cnt < 0) return '--'
    const ratio = cnt / users
    return ratio.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
})

const retentionRowsSorted = computed(() =>
    [...retentionList.value].sort(
        (a, b) => Number(a.currentEpisode ?? 0) - Number(b.currentEpisode ?? 0),
    ),
)

/** 留存表：接口一次返回全集，表格与剧集播放数据一致做前端分页 */
const retentionCurrentPage = ref(1)
const retentionPageSize = ref(10)
const retentionTotal = computed(() => retentionRowsSorted.value.length)
const retentionTableDisplayRows = computed(() => {
    const rows = retentionRowsSorted.value
    const start = (retentionCurrentPage.value - 1) * retentionPageSize.value
    return rows.slice(start, start + retentionPageSize.value)
})

function handleRetentionPageSizeChange() {
    retentionCurrentPage.value = 1
}

function formatRetentionRateDisplay(v: unknown): string {
    const n = Number(v)
    if (!Number.isFinite(n)) return '--'
    return `${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

/** 人均播放次数 = 总播放量 / 观看人数（前端计算） */
function formatRetentionAvgPlays(row: VodPlayUserActionPlayRow): string {
    const tp = Number(row.totalPlays ?? 0)
    const u = Number(row.totalUsers ?? 0)
    if (!Number.isFinite(tp) || tp < 0 || !Number.isFinite(u) || u <= 0) return '--'
    const ratio = tp / u
    return ratio.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

/** 续看平均播放次数 = 续看总播放量 / 续看人数（前端计算） */
function formatRetentionContinueAvgPlays(row: VodPlayUserActionPlayRow): string {
    const cp = Number(row.nextEpisodeUserPlayCount ?? 0)
    const cu = Number(row.nextEpisodeUsers ?? 0)
    if (!Number.isFinite(cp) || cp < 0 || !Number.isFinite(cu) || cu <= 0) return '--'
    const ratio = cp / cu
    return ratio.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

/** 「其他」多集合并：Σ总播放量 / Σ观看人数 */
function formatRetentionAvgFromSums(sumTotalPlays: number, sumTotalUsers: number): string {
    const tp = Number(sumTotalPlays)
    const u = Number(sumTotalUsers)
    if (!Number.isFinite(tp) || tp < 0 || !Number.isFinite(u) || u <= 0) return '--'
    const ratio = tp / u
    return ratio.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

const retentionTrendChartRef = ref<HTMLElement | null>(null)
const retentionBarChartRef = ref<HTMLElement | null>(null)
const retentionAvgPlaysChartRef = ref<HTMLElement | null>(null)
const retentionScatterChartRef = ref<HTMLElement | null>(null)
const retentionMaRetentionChartRef = ref<HTMLElement | null>(null)
const retentionPieChartRef = ref<HTMLElement | null>(null)
let retentionTrendChartInst: echarts.ECharts | null = null
let retentionBarChartInst: echarts.ECharts | null = null
let retentionAvgPlaysChartInst: echarts.ECharts | null = null
let retentionScatterChartInst: echarts.ECharts | null = null
let retentionMaRetentionChartInst: echarts.ECharts | null = null
let retentionPieChartInst: echarts.ECharts | null = null
let retentionChartsResizeBound = false

function onRetentionChartsResize() {
    retentionTrendChartInst?.resize()
    retentionBarChartInst?.resize()
    retentionAvgPlaysChartInst?.resize()
    retentionScatterChartInst?.resize()
    retentionMaRetentionChartInst?.resize()
    retentionPieChartInst?.resize()
}

function disposeRetentionCharts() {
    retentionTrendChartInst?.dispose()
    retentionTrendChartInst = null
    retentionBarChartInst?.dispose()
    retentionBarChartInst = null
    retentionAvgPlaysChartInst?.dispose()
    retentionAvgPlaysChartInst = null
    retentionScatterChartInst?.dispose()
    retentionScatterChartInst = null
    retentionMaRetentionChartInst?.dispose()
    retentionMaRetentionChartInst = null
    retentionPieChartInst?.dispose()
    retentionPieChartInst = null
    if (retentionChartsResizeBound) {
        window.removeEventListener('resize', onRetentionChartsResize)
        retentionChartsResizeBound = false
    }
}

function retentionEpisodeCategoryLabels(rows: VodPlayUserActionPlayRow[]): string[] {
    return rows.map((r) => {
        const ep = Number(r.currentEpisode)
        return Number.isFinite(ep) ? String(ep) : '?'
    })
}

/** 左：观看人数 vs 续看人数，分组柱状图 */
function buildRetentionBarChartOption(rows: VodPlayUserActionPlayRow[]): EChartsOption {
    const sorted = [...rows].sort((a, b) => Number(a.currentEpisode ?? 0) - Number(b.currentEpisode ?? 0))
    const cats = retentionEpisodeCategoryLabels(sorted)
    const watchUsers = sorted.map((r) => Number(r.totalUsers ?? 0))
    const continueUsers = sorted.map((r) => Number(r.nextEpisodeUsers ?? 0))
    return {
        animation: true,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter(params: unknown) {
                const arr = Array.isArray(params) ? params : []
                if (!arr.length) return ''
                const idx = Number((arr[0] as { dataIndex?: number }).dataIndex ?? 0)
                const ep = cats[idx] ?? '—'
                const lines = [`集数：${ep}`]
                for (const p of arr) {
                    const s = p as { seriesName?: string; value?: number }
                    const v = Number(s.value)
                    const n = Number.isFinite(v) ? formatCount(Math.round(v)) : '—'
                    lines.push(`${s.seriesName ?? ''}：${n}`)
                }
                return lines.join('<br/>')
            },
        },
        legend: { data: ['观看人数', '续看人数'], top: 4 },
        grid: {
            left: 12,
            right: 12,
            top: 44,
            bottom: cats.length > 14 ? 56 : 48,
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: cats,
            name: '集数',
            nameLocation: 'middle',
            nameGap: 28,
            axisLabel: { rotate: cats.length > 14 ? 32 : 0, fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            name: '人数',
            scale: true,
            axisLabel: {
                fontSize: 11,
                formatter: (v: number) => formatCount(Math.round(Number(v))),
            },
        },
        series: [
            {
                name: '观看人数',
                type: 'bar',
                data: watchUsers,
                itemStyle: { color: '#3b82f6' },
                barMaxWidth: 22,
                barGap: '12%',
            },
            {
                name: '续看人数',
                type: 'bar',
                data: continueUsers,
                itemStyle: { color: '#f97316' },
                barMaxWidth: 22,
            },
        ],
    }
}

/** 右：人均播放次数柱状图 + 全剧基准线（有观看人数的各集人均相加 ÷ 有效集数） */
function buildRetentionAvgPlaysBarOption(rows: VodPlayUserActionPlayRow[]): EChartsOption {
    const sorted = [...rows].sort((a, b) => Number(a.currentEpisode ?? 0) - Number(b.currentEpisode ?? 0))
    const cats = retentionEpisodeCategoryLabels(sorted)
    let sumValidAvg = 0
    let validEpisodeCount = 0
    const perEpisodeAvg = sorted.map((r) => {
        const tp = Number(r.totalPlays ?? 0)
        const u = Number(r.totalUsers ?? 0)
        if (!Number.isFinite(tp) || !Number.isFinite(u) || u <= 0) return 0
        const avg = tp / u
        sumValidAvg += avg
        validEpisodeCount += 1
        return avg
    })
    const baseline =
        validEpisodeCount > 0 ? sumValidAvg / validEpisodeCount : 0
    const baselineStr = baseline.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
    })

    const barData = perEpisodeAvg.map((v) => {
        let color = '#5470c6'
        if (v > 1.5) color = '#f56c6c'
        else if (v < 1.1) color = '#94a3b8'
        return { value: v, itemStyle: { color } }
    })

    return {
        animation: true,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter(params: unknown) {
                const arr = Array.isArray(params) ? params : []
                if (!arr.length) return ''
                const idx = Number((arr[0] as { dataIndex?: number }).dataIndex ?? 0)
                const ep = cats[idx] ?? '—'
                const v = Number((arr[0] as { value?: number }).value)
                const valStr = Number.isFinite(v)
                    ? v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                    : '—'
                return `集数：${ep}<br/>人均播放次数：${valStr}<br/>全剧基准：${baselineStr}`
            },
        },
        grid: {
            left: 12,
            right: 28,
            top: 36,
            bottom: cats.length > 14 ? 56 : 48,
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: cats,
            name: '集数',
            nameLocation: 'middle',
            nameGap: 28,
            axisLabel: { rotate: cats.length > 14 ? 32 : 0, fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            name: '人均播放次数',
            scale: true,
            axisLabel: {
                fontSize: 11,
                formatter: (v: number) =>
                    Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 2 }),
            },
        },
        series: [
            {
                name: '人均播放次数',
                type: 'bar',
                data: barData,
                barMaxWidth: 26,
                markLine: {
                    symbol: 'none',
                    lineStyle: { color: '#e6a23c', width: 2, type: 'dashed' },
                    label: {
                        show: true,
                        position: 'start',
                        distance: 4,
                        formatter: `基准 ${baselineStr}`,
                        color: '#e6a23c',
                        fontSize: 11,
                        overflow: 'none',
                    },
                    data: [{ yAxis: baseline }],
                },
            },
        ],
    }
}

function medianOfNumbers(values: number[]): number | null {
    const v = values.filter((x) => Number.isFinite(x))
    if (v.length === 0) return null
    const s = [...v].sort((a, b) => a - b)
    const mid = Math.floor(s.length / 2)
    if (s.length % 2 === 1) return s[mid]
    return (s[mid - 1] + s[mid]) / 2
}

/** 尾部窗口移动平均（含当前集，窗口不足时按可用集数均分） */
function retentionTrailingMovingAverage(values: number[], window: number): number[] {
    const w = Math.max(1, Math.floor(window))
    return values.map((_, i) => {
        const start = Math.max(0, i - w + 1)
        let sum = 0
        let c = 0
        for (let j = start; j <= i; j++) {
            sum += values[j] ?? 0
            c++
        }
        return c > 0 ? sum / c : 0
    })
}

function scaleRetentionBubbleSize(users: number, uMax: number): number {
    if (!Number.isFinite(users) || users <= 0) return 8
    const d = Math.max(Number(uMax) || 1, 1)
    const t = Math.min(Math.max(users / d, 0), 1)
    return 10 + 36 * Math.sqrt(t)
}

/** 左下：留存率 × 人均播放次数气泡图，四象限以中位数划分；气泡大小=观看人数；透明散点承接象限空白区 tooltip */
function buildRetentionScatterBubbleOption(rows: VodPlayUserActionPlayRow[]): EChartsOption {
    const sorted = [...rows].sort((a, b) => Number(a.currentEpisode ?? 0) - Number(b.currentEpisode ?? 0))
    const usersArr = sorted.map((r) => Math.max(0, Number(r.totalUsers ?? 0)))
    const uMax = Math.max(...usersArr, 1)

    const retVals: number[] = []
    const avgVals: number[] = []
    const bubbleData = sorted.map((r) => {
        const ep = Number(r.currentEpisode)
        const ret = Number(r.retentionRate)
        const tp = Number(r.totalPlays ?? 0)
        const u = Number(r.totalUsers ?? 0)
        const retN = Number.isFinite(ret) ? ret : 0
        const avg = u > 0 && Number.isFinite(tp) ? tp / u : 0
        retVals.push(retN)
        avgVals.push(avg)
        const users = Math.max(0, Number(r.totalUsers ?? 0))
        return {
            name: Number.isFinite(ep) ? `第${ep}集` : '—',
            value: [retN, avg] as [number, number],
            symbolSize: scaleRetentionBubbleSize(users, uMax),
        }
    })

    const medianRet = medianOfNumbers(retVals)
    const medianAvg = medianOfNumbers(avgVals)
    const showQuad = sorted.length >= 2 && medianRet != null && medianAvg != null

    const xMin = Math.min(...retVals)
    const xMax = Math.max(...retVals)
    const yMin = Math.min(...avgVals)
    const yMax = Math.max(...avgVals)
    const mx = medianRet as number
    const my = medianAvg as number

    const markLineData: Array<
        | { xAxis: number; name: string; label?: Record<string, unknown> }
        | { yAxis: number; name: string; label?: Record<string, unknown> }
    > = []
    if (showQuad) {
        markLineData.push(
            {
                xAxis: mx,
                name: '留存中位',
                label: {
                    formatter: '留存中位',
                    position: 'middle',
                    distance: [-22, 0],
                    fontSize: 10,
                    color: '#606266',
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    borderColor: '#dcdfe6',
                    borderWidth: 1,
                    borderRadius: 2,
                    padding: [3, 6],
                },
            },
            {
                yAxis: my,
                name: '人均中位',
                label: {
                    formatter: '人均中位',
                    position: 'middle',
                    distance: [0, -14],
                    fontSize: 10,
                    color: '#606266',
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    borderColor: '#dcdfe6',
                    borderWidth: 1,
                    borderRadius: 2,
                    padding: [3, 6],
                },
            },
        )
    }

    const ghostSize = Math.min(220, Math.max(100, sorted.length * 14))
    const ghostSeries: SeriesOption[] = showQuad
        ? [
              {
                  name: '_quad_tl',
                  type: 'scatter',
                  data: [[(xMin + mx) / 2, (yMax + my) / 2]],
                  symbolSize: ghostSize,
                  itemStyle: { opacity: 0 },
                  emphasis: { disabled: true },
                  z: 1,
              },
              {
                  name: '_quad_tr',
                  type: 'scatter',
                  data: [[(mx + xMax) / 2, (yMax + my) / 2]],
                  symbolSize: ghostSize,
                  itemStyle: { opacity: 0 },
                  emphasis: { disabled: true },
                  z: 1,
              },
              {
                  name: '_quad_bl',
                  type: 'scatter',
                  data: [[(xMin + mx) / 2, (yMin + my) / 2]],
                  symbolSize: ghostSize,
                  itemStyle: { opacity: 0 },
                  emphasis: { disabled: true },
                  z: 1,
              },
              {
                  name: '_quad_br',
                  type: 'scatter',
                  data: [[(mx + xMax) / 2, (yMin + my) / 2]],
                  symbolSize: ghostSize,
                  itemStyle: { opacity: 0 },
                  emphasis: { disabled: true },
                  z: 1,
              },
          ]
        : []

    return {
        animation: true,
        tooltip: {
            trigger: 'item',
            confine: false,
            appendToBody: true,
            formatter(params: unknown) {
                const p = params as {
                    seriesName?: string
                    dataIndex?: number
                    name?: string
                    value?: [number, number] | number[]
                }
                if (p.seriesName === '_quad_tl') return '优化区：人均播放次数高，留存偏低'
                if (p.seriesName === '_quad_tr') return '神集区：可能有吸引用户的情节'
                if (p.seriesName === '_quad_bl') return '劝退区：人均播放次数和留存均不达标'
                if (p.seriesName === '_quad_br') return '正常区：数据表现正常'
                const idx = Number(p.dataIndex ?? -1)
                const v = p.value
                const ret = Array.isArray(v) ? Number(v[0]) : NaN
                const avg = Array.isArray(v) ? Number(v[1]) : NaN
                const epName = p.name ?? '—'
                const users = idx >= 0 && idx < usersArr.length ? usersArr[idx] : 0
                const retStr = Number.isFinite(ret)
                    ? `${ret.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                    : '—'
                const avgStr = Number.isFinite(avg)
                    ? avg.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                    : '—'
                return `${epName}<br/>续看留存率：${retStr}<br/>人均播放次数：${avgStr}<br/>观看人数：${formatCount(users)}`
            },
        },
        grid: {
            left: 22,
            right: 72,
            top: 48,
            bottom: 68,
            containLabel: true,
        },
        xAxis: {
            type: 'value',
            name: '续看留存率',
            nameLocation: 'middle',
            nameGap: 42,
            nameTextStyle: {
                fontSize: 12,
                color: '#606266',
                fontWeight: 500,
                lineHeight: 18,
            },
            scale: true,
            axisLabel: {
                fontSize: 11,
                margin: 12,
                hideOverlap: false,
                formatter: (v: number) =>
                    `${Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}%`,
            },
            splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.35 } },
        },
        yAxis: {
            type: 'value',
            name: '人均播放次数',
            nameLocation: 'middle',
            nameRotate: 90,
            nameGap: 56,
            nameTextStyle: {
                fontSize: 12,
                color: '#606266',
                fontWeight: 500,
            },
            scale: true,
            axisLabel: {
                fontSize: 11,
                margin: 8,
                formatter: (v: number) =>
                    Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 2 }),
            },
            splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.35 } },
        },
        series: [
            ...ghostSeries,
            {
                name: '剧集',
                type: 'scatter',
                data: bubbleData,
                clip: false,
                z: 10,
                itemStyle: { color: '#409eff', opacity: 0.72 },
                emphasis: { itemStyle: { borderColor: '#303133', borderWidth: 1 } },
                markLine: showQuad
                    ? {
                          silent: true,
                          symbol: 'none',
                          lineStyle: { color: '#909399', width: 1, type: 'dashed' },
                          label: { fontSize: 10, color: '#606266' },
                          data: markLineData,
                      }
                    : undefined,
            },
        ],
    }
}

/** 右下：留存率移动平均平滑曲线 + 原始留存率（半透明） */
function buildRetentionMaRetentionLineOption(rows: VodPlayUserActionPlayRow[]): EChartsOption {
    const sorted = [...rows].sort((a, b) => Number(a.currentEpisode ?? 0) - Number(b.currentEpisode ?? 0))
    const cats = retentionEpisodeCategoryLabels(sorted)
    const rawRates = sorted.map((r) => {
        const n = Number(r.retentionRate)
        return Number.isFinite(n) ? n : 0
    })
    const w = sorted.length >= 5 ? 5 : sorted.length >= 3 ? 3 : 1
    const maRates = retentionTrailingMovingAverage(rawRates, w)

    return {
        animation: true,
        tooltip: {
            trigger: 'axis',
            formatter(params: unknown) {
                const arr = Array.isArray(params) ? params : []
                if (!arr.length) return ''
                const idx = Number((arr[0] as { dataIndex?: number }).dataIndex ?? 0)
                const ep = cats[idx] ?? '—'
                const lines = [`集数：${ep}`]
                for (const p of arr) {
                    const s = p as { seriesName?: string; value?: number }
                    const n = Number(s.value)
                    const pct = Number.isFinite(n)
                        ? `${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                        : '—'
                    lines.push(`${s.seriesName ?? ''}：${pct}`)
                }
                return lines.join('<br/>')
            },
        },
        legend: {
            data: ['原始留存率', `留存率（${w}集移动平均）`],
            top: 4,
        },
        grid: {
            left: 12,
            right: 16,
            top: 44,
            bottom: cats.length > 14 ? 56 : 48,
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: cats,
            name: '集数',
            nameLocation: 'middle',
            nameGap: 28,
            axisLabel: { rotate: cats.length > 14 ? 32 : 0, fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            name: '留存率',
            scale: true,
            axisLabel: {
                fontSize: 11,
                formatter: (v: number) =>
                    `${Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}%`,
            },
        },
        series: [
            {
                name: '原始留存率',
                type: 'line',
                data: rawRates,
                smooth: false,
                showSymbol: sorted.length <= 24,
                symbolSize: 5,
                lineStyle: { width: 1.5, color: '#5470c6', opacity: 0.38 },
                itemStyle: { color: '#5470c6', opacity: 0.45 },
                z: 1,
            },
            {
                name: `留存率（${w}集移动平均）`,
                type: 'line',
                data: maRates,
                smooth: true,
                showSymbol: false,
                lineStyle: { width: 2.5, color: '#9333ea' },
                itemStyle: { color: '#9333ea' },
                z: 2,
            },
        ],
    }
}

function buildRetentionPieChartOption(rows: VodPlayUserActionPlayRow[]): EChartsOption {
    /** 按本集播放总数降序，取占比最大的前 6 集，其余合并为「其他」 */
    const RETENTION_PIE_TOP = 6
    const byPlaysDesc = [...rows].sort((a, b) => {
        const pa = Math.max(0, Number(a.totalPlays ?? 0))
        const pb = Math.max(0, Number(b.totalPlays ?? 0))
        if (pb !== pa) return pb - pa
        return Number(a.currentEpisode ?? 0) - Number(b.currentEpisode ?? 0)
    })
    const topRows = byPlaysDesc.slice(0, RETENTION_PIE_TOP)
    const restRows = byPlaysDesc.slice(RETENTION_PIE_TOP)

    const palette = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272']
    type PieDatum = {
        value: number
        name: string
        itemStyle: { color: string }
        retentionTotalPlays: number
        retentionTotalUsers: number
        retentionAvgPlaysDisplay: string
        retentionIsOther?: boolean
        retentionOtherEpisodeCount?: number
    }
    const data: PieDatum[] = []

    topRows.forEach((r, i) => {
        const ep = Number(r.currentEpisode)
        const epLabel = Number.isFinite(ep) ? String(ep) : '?'
        const tp = Math.max(0, Number(r.totalPlays ?? 0))
        data.push({
            name: `第${epLabel}集`,
            value: tp,
            itemStyle: { color: palette[i % palette.length] },
            retentionTotalPlays: tp,
            retentionTotalUsers: Math.max(0, Number(r.totalUsers ?? 0)),
            retentionAvgPlaysDisplay: formatRetentionAvgPlays(r),
        })
    })

    if (restRows.length > 0) {
        let sumTp = 0
        let sumUsers = 0
        for (const r of restRows) {
            sumTp += Math.max(0, Number(r.totalPlays ?? 0))
            sumUsers += Math.max(0, Number(r.totalUsers ?? 0))
        }
        if (sumTp > 0) {
            data.push({
                name: '其他',
                value: sumTp,
                itemStyle: { color: '#94a3b8' },
                retentionTotalPlays: sumTp,
                retentionTotalUsers: sumUsers,
                retentionAvgPlaysDisplay: formatRetentionAvgFromSums(sumTp, sumUsers),
                retentionIsOther: true,
                retentionOtherEpisodeCount: restRows.length,
            })
        }
    }

    return {
        animation: true,
        title: {
            text: '各集播放占比（前6名）',
            left: 'center',
            top: 4,
            textStyle: { fontSize: 13, fontWeight: 600, color: '#303133' },
            subtextStyle: { fontSize: 11, color: '#606266' },
        },
        tooltip: {
            trigger: 'item',
            formatter(params: unknown) {
                const p = params as {
                    name?: string
                    value?: number
                    percent?: number
                    data?: PieDatum
                }
                const d = p.data ?? ({} as PieDatum)
                const totalPlays = Number(
                    d.retentionTotalPlays != null ? d.retentionTotalPlays : (p.value ?? 0),
                )
                const users = Number(d.retentionTotalUsers ?? 0)
                const avgStr =
                    typeof d.retentionAvgPlaysDisplay === 'string' ? d.retentionAvgPlaysDisplay : '--'
                const pct = Number(p.percent)
                const pctStr = Number.isFinite(pct) ? `${pct.toFixed(2)}%` : '—'
                const title = p.name ?? '—'
                const lines = [title]
                if (d.retentionIsOther && d.retentionOtherEpisodeCount != null) {
                    lines.push(`（已合并其余 ${d.retentionOtherEpisodeCount} 集）`)
                }
                lines.push(
                    `本集播放总数：${formatCount(totalPlays)}`,
                    `平均播放次数：${avgStr}`,
                    `本集观看用户数：${formatCount(users)}`,
                    `占当前饼图播放占比：${pctStr}`,
                )
                return lines.join('<br/>')
            },
        },
        legend: { show: false },
        series: [
            {
                name: '按集播放',
                type: 'pie',
                radius: ['14%', '78%'],
                center: ['50%', '56%'],
                data,
                minAngle: 0.5,
                avoidLabelOverlap: true,
                label: { show: false },
                emphasis: {
                    scale: true,
                    scaleSize: 6,
                    label: {
                        show: true,
                        formatter: '{b}\n{c}（{d}%）',
                        fontSize: 11,
                        lineHeight: 16,
                    },
                },
                itemStyle: { borderColor: '#fff', borderWidth: 1 },
            },
        ],
    }
}

/** 留存率趋势：去掉最后一集（无下一集，续看留存恒为 0） */
const RETENTION_TREND_LOW_THRESHOLD = 60

function buildRetentionTrendChartRows(rows: VodPlayUserActionPlayRow[]): VodPlayUserActionPlayRow[] {
    const sorted = [...rows].sort((a, b) => Number(a.currentEpisode ?? 0) - Number(b.currentEpisode ?? 0))
    if (sorted.length <= 1) return []
    const lastEp = Number(sorted[sorted.length - 1]?.currentEpisode ?? 0)
    if (!Number.isFinite(lastEp)) return sorted.slice(0, -1)
    return sorted.filter((r) => Number(r.currentEpisode ?? 0) < lastEp)
}

/** 留存率趋势折线图（x：集数数字，y：续看留存率；留存率低于 60% 的集数用红点标注） */
function buildRetentionTrendLineChartOption(rows: VodPlayUserActionPlayRow[]): EChartsOption {
    const trendRows = buildRetentionTrendChartRows(rows)
    if (trendRows.length === 0) {
        return {
            animation: false,
            graphic: {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                    text: '暂无趋势数据（至少需要 2 集）',
                    fill: '#909399',
                    fontSize: 14,
                },
            },
            xAxis: { type: 'category', show: false, data: [] },
            yAxis: { type: 'value', show: false },
            series: [],
        }
    }
    const cats = trendRows.map((r) => {
        const ep = Number(r.currentEpisode)
        return Number.isFinite(ep) ? String(ep) : '?'
    })
    const rates = trendRows.map((r) => {
        const n = Number(r.retentionRate)
        return Number.isFinite(n) ? n : 0
    })
    const markPointData: { coord: [string, number]; name: string; value: string }[] = []
    trendRows.forEach((_, i) => {
        const rate = rates[i] ?? 0
        if (Number.isFinite(rate) && rate < RETENTION_TREND_LOW_THRESHOLD) {
            markPointData.push({
                coord: [cats[i], rate],
                name: `集${cats[i]}`,
                value: `${rate.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
            })
        }
    })
    return {
        animation: true,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'line' },
            formatter(params: unknown) {
                const arr = Array.isArray(params) ? params : []
                if (!arr.length) return ''
                const idx = Number((arr[0] as { dataIndex?: number }).dataIndex ?? 0)
                const epLabel = cats[idx] ?? '—'
                const v = (arr[0] as { value?: number }).value
                const n = Number(v)
                const pct = Number.isFinite(n)
                    ? `${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                    : '—'
                return `集数：${epLabel}<br/>续看留存率：${pct}`
            },
        },
        grid: {
            left: 16,
            right: 20,
            top: 36,
            bottom: cats.length > 14 ? 60 : 52,
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: cats,
            name: '集数',
            nameLocation: 'middle',
            nameGap: 30,
            axisLabel: { rotate: cats.length > 14 ? 32 : 0, fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            name: '续看留存率',
            nameLocation: 'middle',
            nameRotate: 90,
            nameGap: 40,
            nameTextStyle: { fontSize: 12, fontWeight: 500, color: '#606266' },
            scale: true,
            axisLabel: {
                fontSize: 11,
                formatter: (val: number) =>
                    `${Number(val).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}%`,
            },
        },
        series: [
            {
                name: '续看留存率',
                type: 'line',
                smooth: true,
                symbol: 'none',
                data: rates,
                lineStyle: { color: '#9333ea', width: 2 },
                markPoint:
                    markPointData.length > 0
                        ? {
                              symbol: 'circle',
                              symbolSize: 14,
                              itemStyle: { color: '#f56c6c', borderColor: '#fff', borderWidth: 1 },
                              label: { show: false },
                              data: markPointData,
                          }
                        : undefined,
            },
        ],
    }
}

async function refreshRetentionCharts() {
    await nextTick()
    await nextTick()
    if (detailMainTab.value !== 'retention' || retentionRowsSorted.value.length === 0) {
        disposeRetentionCharts()
        return
    }
    const trendEl = retentionTrendChartRef.value
    const barEl = retentionBarChartRef.value
    const avgEl = retentionAvgPlaysChartRef.value
    const scatterEl = retentionScatterChartRef.value
    const maRetEl = retentionMaRetentionChartRef.value
    const pieEl = retentionPieChartRef.value
    if (!trendEl || !barEl || !avgEl || !scatterEl || !maRetEl || !pieEl) return

    const rows = retentionRowsSorted.value
    if (!retentionTrendChartInst) {
        retentionTrendChartInst = echarts.init(trendEl, undefined, { renderer: 'canvas' })
    }
    if (!retentionBarChartInst) {
        retentionBarChartInst = echarts.init(barEl, undefined, { renderer: 'canvas' })
    }
    if (!retentionAvgPlaysChartInst) {
        retentionAvgPlaysChartInst = echarts.init(avgEl, undefined, { renderer: 'canvas' })
    }
    if (!retentionScatterChartInst) {
        retentionScatterChartInst = echarts.init(scatterEl, undefined, { renderer: 'canvas' })
    }
    if (!retentionMaRetentionChartInst) {
        retentionMaRetentionChartInst = echarts.init(maRetEl, undefined, { renderer: 'canvas' })
    }
    if (!retentionPieChartInst) {
        retentionPieChartInst = echarts.init(pieEl, undefined, { renderer: 'canvas' })
    }
    if (!retentionChartsResizeBound) {
        window.addEventListener('resize', onRetentionChartsResize)
        retentionChartsResizeBound = true
    }

    retentionTrendChartInst.setOption(buildRetentionTrendLineChartOption(rows), true)
    retentionBarChartInst.setOption(buildRetentionBarChartOption(rows), true)
    retentionAvgPlaysChartInst.setOption(buildRetentionAvgPlaysBarOption(rows), true)
    retentionScatterChartInst.setOption(buildRetentionScatterBubbleOption(rows), true)
    retentionMaRetentionChartInst.setOption(buildRetentionMaRetentionLineOption(rows), true)
    retentionPieChartInst.setOption(buildRetentionPieChartOption(rows), true)
    onRetentionChartsResize()
    requestAnimationFrame(() => onRetentionChartsResize())
}

async function loadRetentionUserAction() {
    const vid = String(route.params.vid ?? '').trim()
    if (!vid) {
        retentionList.value = []
        resetRetentionSummary()
        retentionCurrentPage.value = 1
        ElMessage.warning('缺少 vid，无法查询留存')
        disposeRetentionCharts()
        return
    }
    retentionLoading.value = true
    retentionCurrentPage.value = 1
    try {
        const pkg = String(retentionPkgName.value ?? '').trim()
        const res: any = await postVodPlayDailyUserActionPlay({
            vid,
            pkgName: pkg || undefined,
        })
        const body = res?.data ?? res
        if (Number(body?.code) !== 200) {
            retentionList.value = []
            resetRetentionSummary()
            retentionCurrentPage.value = 1
            ElMessage.error(
                body?.message && typeof body.message === 'string' ? body.message : '留存数据加载失败',
            )
            return
        }
        const parsed = parseUserActionPlayBodyData(body?.data)
        retentionList.value = parsed.records
        retentionSummaryPlayCount.value = parsed.totalPlayCount
        retentionSummaryPlayUserCount.value = parsed.totalPlayUserCount
    } catch (e: any) {
        retentionList.value = []
        resetRetentionSummary()
        retentionCurrentPage.value = 1
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '留存数据加载失败')
    } finally {
        retentionLoading.value = false
        await nextTick()
        if (detailMainTab.value === 'retention') await refreshRetentionCharts()
    }
}

const episodeTrendChartRef = ref<HTMLElement | null>(null)
let episodeTrendChartInst: echarts.ECharts | null = null
let episodeTrendChartResizeBound = false

function onEpisodeTrendChartResize() {
    episodeTrendChartInst?.resize()
}

function buildEpisodeTrendChartOption(): EChartsOption {
    const dc = parseQueryNumber('dramaCount') ?? 0
    const categories =
        dc > 0 ? Array.from({ length: Math.min(dc, 500) }, (_, i) => String(i + 1)) : []
    const showTxPlay = detailOptionalTableColumnKeys.value.includes('txPlayCount')
    const showTxAvg = detailOptionalTableColumnKeys.value.includes('avgTxPlayProgress')

    const byEp = new Map<
        number,
        {
            txPlay: number
            ownerPlay: number
            flux: number
            txProg: number | null
            ownerProg: number | null
        }
    >()
    for (const row of list.value) {
        const ep = Number(row.episodeNo)
        if (!Number.isFinite(ep) || ep < 1) continue
        byEp.set(ep, {
            txPlay: Number(row.playCount ?? 0),
            ownerPlay: Number(row.ownerPlayTimes ?? 0),
            flux: Number(row.playTraffic ?? 0),
            txProg: episodeAvgProgressPercent(row),
            ownerProg: episodeAvgProgressPercentByOwner(row),
        })
    }
    const ownerPlayData = categories.map((_, i) => byEp.get(i + 1)?.ownerPlay ?? 0)
    const txPlayData = categories.map((_, i) => byEp.get(i + 1)?.txPlay ?? 0)
    const fluxData = categories.map((_, i) => byEp.get(i + 1)?.flux ?? 0)
    /** 无有效数据时按 0 折线，避免断点；与表格列「--」可并存 */
    const ownerProgressData = categories.map((_, i) => {
        const p = byEp.get(i + 1)?.ownerProg
        return p != null && Number.isFinite(p) ? p : 0
    })
    const txProgressData = categories.map((_, i) => {
        const p = byEp.get(i + 1)?.txProg
        return p != null && Number.isFinite(p) ? p : 0
    })

    const legendData: string[] = ['播放次数', '播放流量', '平均播放进度']
    if (showTxPlay) legendData.splice(1, 0, 'TX播放次数')
    if (showTxAvg) legendData.push('平均TX播放进度')

    const formatProgressTooltip = (v: number | null | undefined) => {
        const num = Number(v)
        return Number.isFinite(num)
            ? `${num.toLocaleString('zh-CN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              })}%`
            : '—'
    }

    const leftAxisName = showTxPlay ? '次数' : '播放次数'
    const rightProgAxisName = showTxAvg ? '进度(%)' : '平均播放进度'

    const series: EChartsOption['series'] = [
        {
            name: '播放次数',
            type: 'line',
            yAxisIndex: 0,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            data: ownerPlayData,
            lineStyle: { color: '#0ea5e9', width: 2 },
            itemStyle: { color: '#0ea5e9' },
        },
    ]
    if (showTxPlay) {
        series.push({
            name: 'TX播放次数',
            type: 'line',
            yAxisIndex: 0,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            data: txPlayData,
            lineStyle: { color: '#2d53eb', width: 2 },
            itemStyle: { color: '#2d53eb' },
        })
    }
    series.push(
        {
            name: '播放流量',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            data: fluxData,
            lineStyle: { color: '#c45c12', width: 2 },
            itemStyle: { color: '#c45c12' },
        },
        {
            name: '平均播放进度',
            type: 'line',
            yAxisIndex: 2,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            data: ownerProgressData,
            lineStyle: { color: '#059669', width: 2 },
            itemStyle: { color: '#059669' },
        },
    )
    if (showTxAvg) {
        series.push({
            name: '平均TX播放进度',
            type: 'line',
            yAxisIndex: 2,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            data: txProgressData,
            lineStyle: { color: '#9333ea', width: 2 },
            itemStyle: { color: '#9333ea' },
        })
    }

    return {
        animation: true,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            formatter(params: unknown) {
                const arr = Array.isArray(params) ? params : []
                if (!arr.length) return ''
                const idx = Number((arr[0] as { dataIndex?: number }).dataIndex ?? 0)
                const ep = idx + 1
                const lines = [`第 ${ep} 集`]
                for (const p of arr) {
                    const item = p as { seriesName?: string; value?: number | null }
                    const sn = item.seriesName ?? ''
                    const v = item.value
                    if (sn === '播放次数' || sn === 'TX播放次数') {
                        lines.push(`${sn}：${formatCount(v ?? 0)}`)
                    } else if (sn === '播放流量') {
                        lines.push(`${sn}：${formatTraffic(v ?? 0)}`)
                    } else if (sn === '平均播放进度' || sn === '平均TX播放进度') {
                        lines.push(`${sn}：${formatProgressTooltip(v)}`)
                    }
                }
                return lines.join('<br/>')
            },
        },
        legend: {
            data: legendData,
            top: 0,
        },
        grid: { left: 56, right: 196, top: 44, bottom: 48 },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            name: '集数',
            nameLocation: 'middle',
            nameGap: 28,
            data: categories,
        },
        yAxis: [
            {
                type: 'value',
                name: leftAxisName,
                position: 'left',
                scale: false,
                axisLabel: { fontSize: 11 },
            },
            {
                type: 'value',
                name: '播放流量',
                position: 'right',
                nameGap: 12,
                scale: true,
                axisLabel: {
                    fontSize: 11,
                    formatter: (val: number) => formatTraffic(val),
                },
            },
            {
                type: 'value',
                name: rightProgAxisName,
                position: 'right',
                /** 与内侧「播放流量」轴错开，避免轴标题与刻度文字重叠 */
                offset: 92,
                nameGap: 12,
                scale: true,
                axisLabel: {
                    fontSize: 11,
                    formatter: (val: number) => `${val}%`,
                },
            },
        ],
        series,
    }
}

async function refreshEpisodeTrendChart() {
    await nextTick()
    if (!episodeChartVisible.value) {
        if (episodeTrendChartInst) {
            episodeTrendChartInst.dispose()
            episodeTrendChartInst = null
        }
        if (episodeTrendChartResizeBound) {
            window.removeEventListener('resize', onEpisodeTrendChartResize)
            episodeTrendChartResizeBound = false
        }
        return
    }
    if (!episodeTrendChartRef.value) return
    if (!episodeTrendChartInst) {
        episodeTrendChartInst = echarts.init(episodeTrendChartRef.value, undefined, {
            renderer: 'canvas',
        })
        window.addEventListener('resize', onEpisodeTrendChartResize)
        episodeTrendChartResizeBound = true
    }
    episodeTrendChartInst.setOption(buildEpisodeTrendChartOption(), true)
    episodeTrendChartInst.resize()
}

/** 上次查询成功时使用的 dataType；全部应用(overview)时不展示 App/域名列 */
const detailTableDataType = ref<string>('overview')

const showDetailAppHostColumns = computed(() => detailTableDataType.value !== 'overview')

/**
 * 详情表列最小宽度（px）。使用 min-width 而非百分比，避免 Element Plus 对 width 百分比解析异常导致列宽为 0、文字竖排。
 * 列多时总宽可能略大于视口，由表格区域横向滚动展示（布局正常优先）。
 */
const detailColMin = computed(() => {
    const app = showDetailAppHostColumns.value
    return {
        fileId: app ? 118 : 128,
        episodeNo: 52,
        fileSize: 72,
        app: 108,
        host: 108,
        txPlay: 92,
        owner: 84,
        traffic: 92,
        avgOwner: 104,
        ownerRatio: 100,
        avgTx: 112,
        txRatio: 104,
        fluxRatio: 100,
    }
})

const detailAppOptions = ref<{ value: string; label: string }[]>([])
const detailAppLoading = ref(false)

async function loadDetailAppOptions() {
    if (detailAppOptions.value.length > 0) return
    detailAppLoading.value = true
    try {
        const res: any = await getAppList()
        detailAppOptions.value = mapGetAppListToSelectOptions(res)
    } catch {
        detailAppOptions.value = []
    } finally {
        detailAppLoading.value = false
    }
}

function onRetentionPkgChange(v: unknown) {
    if (v === null || v === undefined) {
        retentionPkgName.value = ''
    }
}

function onDetailDataTypeChange(v: unknown) {
    if (v === '' || v === null || v === undefined) {
        detailForm.dataType = 'overview'
    }
}

function onDetailAppFocus() {
    void loadDetailAppOptions()
}

function goBack() {
    router.push({ name: getPlayStatListRouteName(route.path) })
}

function truncateMiddle(s: string, maxLen: number) {
    if (!s || s.length <= maxLen) return s
    const ellipsis = '...'
    if (maxLen <= ellipsis.length) return s.slice(0, maxLen)
    const avail = maxLen - ellipsis.length
    const leftLen = Math.ceil(avail / 2)
    const rightLen = Math.floor(avail / 2)
    return `${s.slice(0, leftLen)}${ellipsis}${s.slice(-rightLen)}`
}

function isMiddleTruncated(raw: string, maxLen: number): boolean {
    const s = String(raw ?? '')
    if (!s) return false
    return truncateMiddle(s, maxLen) !== s
}

async function copyText(text: string, label: string) {
    const content = String(text ?? '').trim()
    if (!content) {
        ElMessage.warning(`${label}为空`)
        return
    }
    try {
        await navigator.clipboard.writeText(content)
        ElMessage.success(`${label}已复制`)
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '复制失败')
    }
}

function validateDetailSeries(showMessage: boolean) {
    const raw = String(detailForm.seriesIndex ?? '').trim()
    if (!raw) return true
    const n = parseSeriesIndexForApi(detailForm.seriesIndex)
    if (n == null) {
        if (showMessage) ElMessage.warning('请输入有效的剧集（不小于 1 的正整数）')
        return false
    }
    return true
}

async function loadDetailList() {
    const vid = String(route.params.vid ?? '').trim()
    if (!vid) {
        list.value = []
        total.value = 0
        detailAggregateTotalPlayTimes.value = null
        detailAggregateTotalOwnerPlayTimes.value = null
        detailAggregateTotalFlux.value = null
        detailTableUsesClientSlice.value = false
        episodeChartVisible.value = false
        void refreshEpisodeTrendChart()
        return
    }
    if (!validateDetailSeries(false)) {
        list.value = []
        total.value = 0
        detailAggregateTotalPlayTimes.value = null
        detailAggregateTotalOwnerPlayTimes.value = null
        detailAggregateTotalFlux.value = null
        detailTableUsesClientSlice.value = false
        episodeChartVisible.value = false
        void refreshEpisodeTrendChart()
        return
    }
    loading.value = true
    try {
        const fullFetch = isFullEpisodeFetchMode()
        const requestSize = resolveDetailRequestSize()
        const arr = Array.isArray(detailForm.dateRange) ? detailForm.dateRange : []
        let startTime = String(arr[0] ?? '').trim()
        let endTime = String(arr[1] ?? '').trim()
        const y = getYesterdayYmd()
        if (!startTime && !endTime) {
            startTime = y
            endTime = y
        } else if (startTime && !endTime) {
            endTime = startTime
        } else if (!startTime && endTime) {
            startTime = endTime
        }
        const si = parseSeriesIndexForApi(detailForm.seriesIndex)
        const res: any = await getVodPlayDailyInfoDetail({
            current: fullFetch ? 1 : currentPage.value,
            size: requestSize,
            startTime,
            endTime,
            vid,
            seriesIndex: si != null ? String(si) : '',
            fileId: detailForm.fileId.trim(),
            sortType: detailForm.sortType,
            dataType: resolvePlayStatDataType(detailForm.dataType),
        })
        const body = res?.data ?? res
        const data = body?.data ?? {}
        const records = data?.records ?? data?.list ?? []
        list.value = Array.isArray(records) ? records.map(normalizePlayStatRow) : []
        total.value = fullFetch
            ? list.value.length
            : Number(data?.total ?? list.value.length ?? 0)
        const rawTimes = data?.totalPlayTimes
        const rawOwnerTimes = data?.totalOwnerPlayTimes
        const rawFlux = data?.totalFlux
        const nTimes = Number(rawTimes)
        const nOwnerTimes = Number(rawOwnerTimes)
        const nFlux = Number(rawFlux)
        detailAggregateTotalPlayTimes.value =
            rawTimes != null && rawTimes !== '' && Number.isFinite(nTimes) ? nTimes : null
        detailAggregateTotalOwnerPlayTimes.value =
            rawOwnerTimes != null && rawOwnerTimes !== '' && Number.isFinite(nOwnerTimes)
                ? nOwnerTimes
                : null
        detailAggregateTotalFlux.value =
            rawFlux != null && rawFlux !== '' && Number.isFinite(nFlux) ? nFlux : null
        detailTableUsesClientSlice.value = fullFetch
        detailTableDataType.value = resolvePlayStatDataType(detailForm.dataType)
        episodeChartVisible.value = evaluateEpisodeChartVisibleAfterLoad()
        await refreshEpisodeTrendChart()
    } catch (e: any) {
        list.value = []
        total.value = 0
        detailAggregateTotalPlayTimes.value = null
        detailAggregateTotalOwnerPlayTimes.value = null
        detailAggregateTotalFlux.value = null
        detailTableUsesClientSlice.value = false
        episodeChartVisible.value = false
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '播放统计详情加载失败')
        await refreshEpisodeTrendChart()
    } finally {
        loading.value = false
    }
}

function handleSearch() {
    if (!validateDetailSeries(true)) return
    currentPage.value = 1
    void loadDetailList()
}

function handleReset() {
    detailForm.fileId = ''
    detailForm.seriesIndex = ''
    detailForm.dataType = 'overview'
    detailForm.sortType = 0
    currentPage.value = 1
    pageSize.value = 10
    syncDetailDateRangeFromRoute()
    void loadDetailList()
}

function handlePageSizeChange() {
    currentPage.value = 1
    if (detailTableUsesClientSlice.value) return
    void loadDetailList()
}

function handleCurrentChange() {
    if (detailTableUsesClientSlice.value) return
    void loadDetailList()
}

watch(
    () => [
        route.params.vid,
        route.query.startTime,
        route.query.endTime,
        route.query.statDate,
    ],
    () => {
        currentPage.value = 1
        syncDetailDateRangeFromRoute()
        void loadDetailList()
        if (detailMainTab.value === 'retention') void loadRetentionUserAction()
    },
)

watch(detailMainTab, (t) => {
    if (t === 'retention') {
        void loadRetentionUserAction()
    } else {
        disposeRetentionCharts()
    }
})

watch(
    () => [...detailOptionalTableColumnKeys.value].sort().join(','),
    () => {
        if (episodeChartVisible.value) void refreshEpisodeTrendChart()
    },
)

onMounted(() => {
    if (!canViewPlayStatDetail.value) {
        ElMessage.warning('暂无播放统计详情权限')
        router.replace({ name: getPlayStatListRouteName(route.path) })
        return
    }
    void loadDetailAppOptions()
    void loadDetailList()
})

onUnmounted(() => {
    if (episodeTrendChartResizeBound) {
        window.removeEventListener('resize', onEpisodeTrendChartResize)
        episodeTrendChartResizeBound = false
    }
    episodeTrendChartInst?.dispose()
    episodeTrendChartInst = null
    disposeRetentionCharts()
})
</script>

<style scoped>
/* 与剧集详情页一致：隐藏 PageContent 顶部标题行 */
.episode-management-page :deep(.flex-center.justify-between) {
    display: none !important;
}

.play-stat-detail-wrap {
    min-height: 0;
}

.episode-card {
    min-height: 0;
}

.episode-header.play-stat-detail-header {
    align-items: center;
    justify-content: flex-start;
}
.episode-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 14px;
}
.play-stat-detail-header__row.episode-header__left {
    align-items: center;
    flex-wrap: nowrap;
    width: 100%;
    gap: 10px;
    justify-content: flex-start;
}
.play-stat-detail-panel {
    flex: 1;
    min-width: 0;
    width: 100%;
    max-width: 100%;
    border-radius: 12px;
    margin-top: 0;
    padding: 10px 14px;
    background: linear-gradient(152deg, #fafcff 0%, #f3f6fd 42%, #f7f8fb 100%);
    border: 1px solid #e2e8f4;
    box-shadow:
        0 2px 14px rgba(45, 83, 235, 0.07),
        0 1px 3px rgba(15, 23, 42, 0.05);
}
.play-stat-detail-panel--row {
    display: flex;
    margin-top: 0;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    justify-content: space-between;
    gap: 20px;
    width: 100%;
    min-height: 44px;
    box-sizing: border-box;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
}
.play-stat-detail-cluster--left {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
    gap: 12px;
    padding-right: 8px;
}
.play-stat-detail-title-pair {
    display: flex;
    flex-direction: row;
    align-items: center;
    min-width: 0;
    flex: 1 1 auto;
    gap: 4px;
}
.play-stat-detail-title-dot {
    flex-shrink: 0;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #c5cad6;
    opacity: 0.85;
}
.play-stat-detail-date-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 11px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: #2d53eb;
    letter-spacing: 0.02em;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(237, 242, 255, 0.9) 100%);
    border: 1px solid rgba(45, 83, 235, 0.22);
    box-shadow: 0 1px 2px rgba(45, 83, 235, 0.06);
    flex-shrink: 0;
    white-space: nowrap;
}
.play-stat-detail-date-tag__icon {
    font-size: 14px;
}
.play-stat-detail-seg {
    display: inline-flex;
    flex-direction: row;
    align-items: baseline;
    gap: 5px;
    min-width: 0;
    font-size: 13px;
    line-height: 1.35;
}
.play-stat-detail-seg--title {
    flex: 0 1 auto;
    min-width: 0;
    max-width: min(380px, 38vw);
}
.play-stat-detail-seg__v--muted {
    font-weight: 500;
    color: #606266;
}
.play-stat-detail-seg__k {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 500;
    color: #909399;
    white-space: nowrap;
}
.play-stat-detail-seg__v {
    min-width: 0;
    font-weight: 600;
    color: #1a1d26;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.play-stat-detail-cluster--metrics {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    flex: 0 0 auto;
    flex-shrink: 0;
    gap: 28px;
    padding-left: 12px;
}
.play-stat-detail-metric {
    display: inline-flex;
    flex-direction: row;
    align-items: baseline;
    flex-wrap: nowrap;
    gap: 8px 10px;
    padding: 8px 18px;
    min-width: 0;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid #e8ecf4;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.98);
}
.play-stat-detail-metric__k {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 500;
    color: #909399;
    white-space: nowrap;
}
.play-stat-detail-metric__v {
    font-size: 14px;
    font-weight: 700;
    color: #303133;
    white-space: nowrap;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
}
.play-stat-detail-metric__v--mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
}
.play-stat-detail-metric__v--vid-line {
    max-width: min(520px, 85vw);
}

.play-stat-detail-th-tip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    max-width: 100%;
    line-height: 1.35;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
}
.play-stat-detail-th-tip__icon {
    flex-shrink: 0;
    font-size: 13px;
    color: #909399;
    cursor: help;
    vertical-align: middle;
}
.play-stat-detail-th-tip__icon:hover,
.play-stat-detail-th-tip__icon:focus-visible {
    color: #409eff;
}

.episode-back-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: 10px;
    border: 1px solid #e3e8ef;
    background: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    align-self: center;
    flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}
.episode-back-btn :deep(.el-button__icon) {
    font-size: 18px;
    color: #909399;
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

/* 与播放统计列表页一致：汇总与刷新同一行 */
.play-stat-list-toolbar-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px 20px;
    margin-top: 10px;
    margin-bottom: 4px;
    padding: 12px 2px 8px;
    box-sizing: border-box;
}
.play-stat-list-summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 28px;
    flex: 1;
    min-width: 0;
    padding: 0;
}
.play-stat-list-toolbar-row__toolbar.table-toolbar {
    padding: 0;
    margin: 0;
    flex-shrink: 0;
}
.play-stat-list-summary__label {
    font-size: 14px;
    font-weight: 700;
    color: #303133;
}
.play-stat-list-summary__value {
    font-size: 21px;
    font-weight: 700;
    line-height: 1.25;
}
.play-stat-list-summary__value--times {
    color: #2d53eb;
}
.play-stat-list-summary__value--flux {
    color: #c45c12;
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
.play-stat-detail-col-setting-panel {
    width: 200px;
    padding: 10px 12px;
    max-height: 320px;
    overflow-y: auto;
}
.play-stat-detail-col-setting-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.play-stat-detail-col-setting-list :deep(.el-checkbox) {
    margin-right: 0;
    height: auto;
    white-space: normal;
    align-items: flex-start;
}

.drama-table-block {
    position: relative;
    width: 100%;
}
.copy-cell {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
}
.copy-cell--center {
    justify-content: center;
}
.copy-cell--tight {
    gap: 4px;
    min-width: 0;
}
/** fileId 列：文案相对单元格居中，复制按钮绝对定位不参与占位 */
.play-stat-detail-fileid-cell {
    position: relative;
    display: block;
    width: 100%;
    box-sizing: border-box;
}
.play-stat-detail-fileid-cell--with-copy {
    padding-right: 26px;
}
.play-stat-detail-fileid-text {
    display: block;
    width: 100%;
    max-width: 100%;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: normal;
    line-height: 1.4;
}
.play-stat-detail-fileid-copy {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
}
.copy-cell__tail-trigger {
    min-width: 0;
    max-width: 100%;
    width: 100%;
    overflow: hidden;
}
.copy-cell__tail-trigger--solo {
    display: block;
    width: 100%;
}
.play-stat-trunc {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    vertical-align: middle;
}
.play-stat-trunc--tail {
    display: block;
    width: 100%;
    min-width: 0;
    text-overflow: ellipsis;
}
.play-stat-trunc--block {
    display: block;
    width: 100%;
}
.play-stat-table--compact :deep(table) {
    table-layout: fixed;
    width: 100%;
}

/* 全部应用下列较少：自动列宽，在 min-width 约束下分配剩余空间 */
.play-stat-detail-table--overview.play-stat-table--compact :deep(table) {
    table-layout: auto;
    width: 100%;
    min-width: 100%;
}
.play-stat-detail-table--overview :deep(.el-table__inner-wrapper) {
    width: 100%;
}
.play-stat-detail-table--overview :deep(.el-table__body .el-table__cell .cell),
.play-stat-detail-table--overview :deep(.el-table__header th .cell) {
    padding-left: 6px;
    padding-right: 6px;
}
.play-stat-detail-table--overview :deep(.el-table__header-wrapper th.el-table__cell) {
    padding-top: 12px;
    padding-bottom: 12px;
}

.play-stat-detail-wrap .drama-table-block {
    min-width: 0;
    overflow-x: auto;
}
.play-stat-detail-wrap .drama-op-table :deep(.el-table__header .cell) {
    font-size: 12px;
    font-weight: 700;
    line-height: 1.35;
    padding-left: 6px;
    padding-right: 6px;
}
.play-stat-detail-wrap .drama-op-table :deep(.el-table__body .el-table__cell .cell) {
    padding-left: 6px;
    padding-right: 6px;
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
.drama-op-table :deep(.el-table__body .el-table__cell .cell) {
    font-size: 12px;
    color: #2f3542;
}

.drama-main-card :deep(.search-form--single-row.el-form--inline .el-form-item) {
    margin-right: 12px;
}

.filter-input--file-id {
    width: 152px;
}
.filter-input--episode {
    width: 120px;
}
.filter-select--top100-scope {
    width: 180px;
}
.filter-select--sort-type {
    width: 148px;
}
.filter-date-range {
    width: 300px;
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
.drama-main-card :deep(.filter-date-range .el-input__wrapper) {
    min-height: 34px;
    background-color: #edf1fc;
    border-radius: 8px;
    box-shadow: none;
    border: none;
}

.pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
}

.play-stat-detail-chart-wrap {
    margin-top: 80px;
    padding: 12px 16px 8px;
    background: linear-gradient(152deg, #fafcff 0%, #f5f7fc 100%);
    border: 1px solid #e2e8f4;
    border-radius: 10px;
    box-sizing: border-box;
}
.play-stat-detail-chart {
    width: 100%;
    height: 320px;
}

.play-stat-detail-tab-strip {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 0;
    margin: -4px -4px 0;
    padding: 0 4px;
    border-bottom: 1px solid #e4e7ed;
    min-width: 0;
}
.play-stat-detail-tab-strip__btn {
    position: relative;
    margin: 0 16px -1px 0;
    padding: 10px 4px 12px;
    border: none;
    background: transparent;
    font-size: 14px;
    font-weight: 500;
    color: #606266;
    cursor: pointer;
    outline: none;
    transition: color 0.2s;
}
.play-stat-detail-tab-strip__btn:hover {
    color: #409eff;
}
.play-stat-detail-tab-strip__btn.is-active {
    color: #409eff;
    font-weight: 600;
}
.play-stat-detail-tab-strip__btn.is-active::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: #409eff;
}
.play-stat-detail-tab-strip + .episode-header.play-stat-detail-header {
    margin-top: 12px;
}
.play-stat-detail-pane {
    min-width: 0;
}
.play-stat-retention-hint {
    margin: 0 0 12px;
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
}
.play-stat-retention-form {
    margin-bottom: 12px;
}
.play-stat-retention-form :deep(.el-form-item__label) {
    display: none;
}
.play-stat-retention-form__app-select :deep(.el-form-item__content) {
    margin-left: 0 !important;
}
.play-stat-retention-summary {
    margin: 0 0 12px;
    padding: 10px 2px 6px;
    flex-wrap: wrap;
    gap: 20px 28px;
}
.play-stat-retention-charts {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.play-stat-retention-charts-empty {
    text-align: center;
    color: #909399;
    padding: 24px;
    font-size: 14px;
    border: 1px dashed #e4e7ed;
    border-radius: 6px;
}
.play-stat-retention-trend-wrap {
    min-width: 0;
}
.play-stat-retention-trend-head {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 8px;
}
.play-stat-retention-trend-head-inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
.play-stat-retention-trend-title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
}
.play-stat-retention-trend-help {
    cursor: help;
    color: #909399;
}
.play-stat-retention-trend-help:hover {
    color: #409eff;
}
.play-stat-retention-chart-shell {
    min-width: 0;
}
.play-stat-retention-chart--trend {
    width: 100%;
    height: 300px;
    min-width: 0;
}
.play-stat-retention-charts-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    min-width: 0;
}
.play-stat-retention-charts-split--pie-only {
    grid-template-columns: 1fr;
}
.play-stat-retention-chart--split {
    width: 100%;
    height: 380px;
    min-width: 0;
}
@media (max-width: 900px) {
    .play-stat-retention-charts-split {
        grid-template-columns: 1fr;
    }
}
</style>

<style>
.play-stat-ellipsis-tooltip {
    max-width: min(520px, 92vw) !important;
    box-sizing: border-box;
}
.play-stat-ellipsis-tooltip .el-tooltip__content,
.play-stat-ellipsis-tooltip .el-popper__inner {
    word-break: break-all;
    white-space: normal;
    line-height: 1.5;
}
</style>
