<template>
    <page-content class="drama-play-stat-page operation-drama-page" :title="title">
        <template #bottom>
            <el-card class="drama-main-card" shadow="never">
                <el-tabs v-model="mainTab" class="play-stat-tabs" @tab-change="onMainTabChange">
                    <el-tab-pane v-if="canViewHourly24" label="实时概览" name="hourly24">
                        <el-form
                            inline
                            label-width="0"
                            class="search-form search-form--single-row play-stat-hourly24-search-form"
                        >
                            <el-form-item class="play-stat-hourly24-search-form__app-select">
                                <el-select
                                    v-model="hourly24PkgName"
                                    class="filter-select filter-select--top100-scope"
                                    placeholder="全部应用"
                                    aria-label="应用范围"
                                    filterable
                                    clearable
                                    :loading="playStatAppSelectLoading"
                                    @focus="onTop100AppSelectFocus"
                                    @change="onHourly24PkgChange"
                                >
                                    <el-option label="全部应用" value="" />
                                    <el-option
                                        v-for="opt in allPlayStatAppOptions"
                                        :key="opt.value"
                                        :label="opt.label"
                                        :value="opt.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item class="search-form__actions">
                                <el-button type="primary" class="btn-query" @click="loadHourly24Stats"
                                    >查询</el-button
                                >
                            </el-form-item>
                        </el-form>
                        <div class="play-stat-list-toolbar-row">
                            <div class="play-stat-list-summary" aria-live="polite">
                                <span class="play-stat-list-summary__pair">
                                    <span class="play-stat-list-summary__label">统计区间：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--daterange"
                                        >{{ hourly24RangeDisplay }}</span
                                    >
                                </span>
                                <span class="play-stat-list-summary__pair">
                                    <span class="play-stat-list-summary__label">总播放：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--times"
                                        >{{ hourly24SumPlaysDisplay }}</span
                                    >
                                </span>
                                <span class="play-stat-list-summary__pair">
                                    <span class="play-stat-list-summary__label">总喜欢：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--flux"
                                        >{{ hourly24SumLikesDisplay }}</span
                                    >
                                </span>
                                <span class="play-stat-list-summary__pair">
                                    <span class="play-stat-list-summary__label">总收藏：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--times"
                                        >{{ hourly24SumFavesDisplay }}</span
                                    >
                                </span>
                                <span class="play-stat-list-summary__pair">
                                    <span class="play-stat-list-summary__label">区间总流量：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--flux"
                                        >{{ hourly24TrafficTotalDisplay }}</span
                                    >
                                </span>
                            </div>
                            <div class="table-toolbar play-stat-list-toolbar-row__toolbar">
                                <span class="toolbar-actions">
                                    <el-icon class="toolbar-icon" @click="loadHourly24Stats"><Refresh /></el-icon>
                                </span>
                            </div>
                        </div>
                        <div class="drama-table-block" v-loading="hourly24Loading">
                            <el-table
                                class="drama-op-table play-stat-table--compact"
                                :data="hourly24DramaRowsPageSlice"
                                style="width: 100%"
                                empty-text="暂无数据"
                                max-height="360"
                            >
                                <el-table-column prop="dateTime" label="时段" min-width="168" align="center">
                                    <template #default="{ row }">{{ formatHourly24DateTimeCell(row.dateTime) }}</template>
                                </el-table-column>
                                <el-table-column label="播放次数" min-width="100" align="center">
                                    <template #default="{ row }">{{ formatCount(row.totalPlays) }}</template>
                                </el-table-column>
                                <el-table-column label="播放流量" min-width="120" align="center">
                                    <template #default="{ row }">{{
                                        formatHourly24TrafficDetailGb(hourly24FluxAtRow(row))
                                    }}</template>
                                </el-table-column>
                                <el-table-column label="喜欢" min-width="88" align="center">
                                    <template #default="{ row }">{{ formatCount(row.totalLikes) }}</template>
                                </el-table-column>
                                <el-table-column label="收藏" min-width="88" align="center">
                                    <template #default="{ row }">{{ formatCount(row.totalFaves) }}</template>
                                </el-table-column>
                            </el-table>
                        </div>
                        <div class="pagination-wrapper">
                            <el-pagination
                                v-model:current-page="hourly24CurrentPage"
                                v-model:page-size="hourly24PageSize"
                                :total="hourly24TableTotal"
                                :page-sizes="[10, 20, 50]"
                                layout="total, sizes, ->, prev, pager, next, jumper"
                                prev-text="上一页"
                                next-text="下一页"
                                @size-change="handleHourly24PageSizeChange"
                                @current-change="handleHourly24CurrentChange"
                            />
                        </div>
                        <div class="daily-video-chart-wrap" aria-label="24小时趋势">
                            <div
                                v-if="
                                    !hourly24Loading &&
                                    hourly24DramaRows.length === 0 &&
                                    hourly24TrafficList.length === 0
                                "
                                class="daily-video-chart-empty"
                            >
                                暂无趋势数据（请先查询或调整App包名）
                            </div>
                            <div
                                v-else-if="hourly24DramaRows.length > 0 || hourly24TrafficList.length > 0"
                                ref="hourly24TrendChartRef"
                                class="daily-video-chart"
                            />
                        </div>
                    </el-tab-pane>
                    <el-tab-pane v-if="canViewPlayStatList" label="播放统计列表" name="list">
                        <el-form
                            :model="searchForm"
                            inline
                            class="search-form search-form--single-row"
                        >
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
                                    placeholder="剧名"
                                    clearable
                                    @keyup.enter="handleSearch"
                                />
                            </el-form-item>
                            <el-form-item>
                                <el-select
                                    v-model="searchForm.copyrightCode"
                                    class="filter-select filter-select--copyright"
                                    placeholder="请选择版权方"
                                    clearable
                                    filterable
                                    :loading="copyrightOwnerLoading"
                                >
                                    <el-option
                                        v-for="opt in copyrightOwnerOptions"
                                        :key="opt.value"
                                        :label="opt.label"
                                        :value="opt.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item>
                                <el-select
                                    v-model="searchForm.appPkg"
                                    class="filter-select filter-select--top100-scope"
                                    placeholder="全部应用"
                                    aria-label="应用范围"
                                    filterable
                                    clearable
                                    :loading="playStatAppSelectLoading"
                                    @focus="onTop100AppSelectFocus"
                                    @change="onListAppPkgChange"
                                >
                                    <el-option label="全部应用" value="" />
                                    <el-option
                                        v-for="opt in allPlayStatAppOptions"
                                        :key="opt.value"
                                        :label="opt.label"
                                        :value="opt.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item>
                                <el-select
                                    v-model="searchForm.sortType"
                                    class="filter-select filter-select--sort-type"
                                    placeholder="排序方式"
                                >
                                    <el-option label="播放次数" :value="0" />
                                    <el-option label="播放流量" :value="1" />
                                </el-select>
                            </el-form-item>
                            <el-form-item>
                                <el-date-picker
                                    v-model="searchForm.dateRange"
                                    class="filter-date-range"
                                    type="daterange"
                                    range-separator="至"
                                    start-placeholder="开始日期"
                                    end-placeholder="结束日期"
                                    value-format="YYYY-MM-DD"
                                    clearable
                                    :default-value="searchDateRangeDefaultCalendar"
                                    :disabled-date="disableSearchDateRangeDate"
                                />
                            </el-form-item>
                            <el-form-item class="search-form__actions">
                                <el-button class="btn-query" type="primary" @click="handleSearch"
                                    >查询</el-button
                                >
                                <el-button class="btn-reset" @click="handleReset">重置</el-button>
                            </el-form-item>
                        </el-form>

                        <div class="play-stat-list-toolbar-row">
                            <div class="play-stat-list-summary" aria-live="polite">
                                <span class="play-stat-list-summary__pair">
                                    <span class="play-stat-list-summary__label">统计日期：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--daterange"
                                        >{{ listSearchStatDateRangeText }}</span
                                    >
                                </span>
                                <span
                                    v-if="listTableShowOptionalColumn('txPlayCount')"
                                    class="play-stat-list-summary__pair"
                                >
                                    <span class="play-stat-list-summary__label">总TX播放次数：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--times"
                                        >{{ listAggregatePlayTimesDisplay }}</span
                                    >
                                </span>
                                <span class="play-stat-list-summary__pair">
                                    <span class="play-stat-list-summary__label">总播放次数：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--times"
                                        >{{ listAggregateOwnerPlayTimesDisplay }}</span
                                    >
                                </span>
                                <span class="play-stat-list-summary__pair">
                                    <span class="play-stat-list-summary__label">总播放流量：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--flux"
                                        >{{ listAggregateFluxDisplay }}</span
                                    >
                                </span>
                            </div>
                            <div class="table-toolbar play-stat-list-toolbar-row__toolbar">
                                <span class="toolbar-actions">
                                    <el-icon class="toolbar-icon" @click="loadList"
                                        ><Refresh
                                    /></el-icon>
                                    <el-tooltip effect="dark" content="列设置" placement="top">
                                        <el-dropdown
                                            trigger="click"
                                            :hide-on-click="false"
                                            class="play-stat-detail-col-dropdown"
                                        >
                                            <el-icon class="toolbar-icon" aria-label="列设置"
                                                ><Setting
                                            /></el-icon>
                                            <template #dropdown>
                                                <el-dropdown-menu class="table-column-setting">
                                                    <div class="play-stat-detail-col-setting-panel">
                                                        <el-checkbox-group v-model="listOptionalTableColumnKeys">
                                                            <div class="play-stat-detail-col-setting-list">
                                                                <el-checkbox label="txPlayCount"
                                                                    >TX播放次数</el-checkbox
                                                                >
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
                                class="drama-op-table play-stat-table--compact"
                                :data="list"
                                style="width: 100%"
                                empty-text="暂无数据"
                            >
                                <el-table-column prop="vid" label="vid" min-width="36">
                                    <template #default="{ row }">
                                        <div class="copy-cell copy-cell--tight">
                                            <el-tooltip
                                                :content="row.vid"
                                                placement="top"
                                                :show-after="200"
                                                popper-class="play-stat-ellipsis-tooltip"
                                                :disabled="!isMiddleTruncated(row.vid, 10)"
                                            >
                                                <span class="play-stat-trunc">{{
                                                    truncateMiddle(row.vid || '--', 10)
                                                }}</span>
                                            </el-tooltip>
                                            <el-button
                                                v-if="row.vid"
                                                type="primary"
                                                link
                                                size="small"
                                                :icon="CopyDocument"
                                                class="episode-item__copy"
                                                @click.stop="copyText(row.vid, 'vid')"
                                            />
                                        </div>
                                    </template>
                                </el-table-column>
                                <el-table-column label="原始剧名" width="238" align="center">
                                    <template #default="{ row }">
                                        <div
                                            class="copy-cell copy-cell--tight copy-cell--play-stat-title"
                                            :class="{
                                                'copy-cell--play-stat-title--with-copy':
                                                    !!row.originTitle,
                                            }"
                                        >
                                            <div class="copy-cell__tail-main">
                                                <el-tooltip
                                                    :content="row.originTitle"
                                                    placement="top"
                                                    :show-after="200"
                                                    popper-class="play-stat-ellipsis-tooltip"
                                                    :disabled="!row.originTitle"
                                                >
                                                    <div class="copy-cell__tail-trigger">
                                                        <span
                                                            class="play-stat-trunc play-stat-trunc--tail"
                                                            >{{ row.originTitle || '--' }}</span
                                                        >
                                                    </div>
                                                </el-tooltip>
                                            </div>
                                            <el-button
                                                v-if="row.originTitle"
                                                type="primary"
                                                link
                                                size="small"
                                                :icon="CopyDocument"
                                                class="episode-item__copy copy-cell__corner-copy"
                                                @click.stop="copyText(row.originTitle, '原始剧名')"
                                            />
                                        </div>
                                    </template>
                                </el-table-column>
                                <el-table-column label="上线剧名" width="238" align="center">
                                    <template #default="{ row }">
                                        <div
                                            class="copy-cell copy-cell--tight copy-cell--play-stat-title"
                                            :class="{
                                                'copy-cell--play-stat-title--with-copy':
                                                    !!row.onlineTitle,
                                            }"
                                        >
                                            <div class="copy-cell__tail-main">
                                                <el-tooltip
                                                    :content="row.onlineTitle"
                                                    placement="top"
                                                    :show-after="200"
                                                    popper-class="play-stat-ellipsis-tooltip"
                                                    :disabled="!row.onlineTitle"
                                                >
                                                    <div class="copy-cell__tail-trigger">
                                                        <span
                                                            class="play-stat-trunc play-stat-trunc--tail"
                                                            >{{ row.onlineTitle || '--' }}</span
                                                        >
                                                    </div>
                                                </el-tooltip>
                                            </div>
                                            <el-button
                                                v-if="row.onlineTitle"
                                                type="primary"
                                                link
                                                size="small"
                                                :icon="CopyDocument"
                                                class="episode-item__copy copy-cell__corner-copy"
                                                @click.stop="copyText(row.onlineTitle, '上线剧名')"
                                            />
                                        </div>
                                    </template>
                                </el-table-column>
                                <el-table-column label="版权方" min-width="100" align="center">
                                    <template #default="{ row }">
                                        <el-tooltip
                                            :content="formatCopyrightLine(row)"
                                            placement="top"
                                            :show-after="200"
                                            popper-class="play-stat-ellipsis-tooltip"
                                            :disabled="formatCopyrightLine(row) === '--'"
                                        >
                                            <div
                                                class="copy-cell__tail-trigger copy-cell__tail-trigger--solo"
                                            >
                                                <span
                                                    class="play-stat-trunc play-stat-trunc--block play-stat-trunc--tail"
                                                    >{{ formatCopyrightLine(row) }}</span
                                                >
                                            </div>
                                        </el-tooltip>
                                    </template>
                                </el-table-column>
                                <el-table-column label="配音/字幕" width="120" align="center">
                                    <template #default="{ row }">
                                        {{ formatSubtitleDubCode(row) }}
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    v-if="listTableShowOptionalColumn('txPlayCount')"
                                    prop="playCount"
                                    width="120"
                                    align="center"
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
                                    width="120"
                                    align="center"
                                >
                                    <template #header>
                                        <span class="play-stat-detail-th-tip">
                                            播放次数
                                            <el-tooltip
                                                content="App上报统计的播放次数"
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
                                        {{ formatCount(row.ownerPlayTimes) }}
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    prop="playTraffic"
                                    label="播放流量"
                                    width="120"
                                    align="center"
                                >
                                    <template #default="{ row }">
                                        {{ formatTraffic(row.playTraffic) }}
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    label="操作"
                                    width="100"
                                    align="center"
                                    fixed="right"
                                >
                                    <template #default="{ row }">
                                        <el-button
                                            type="primary"
                                            link
                                            size="small"
                                            @click="openPlayStatDetail(row)"
                                        >
                                            查看详情
                                        </el-button>
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
                    </el-tab-pane>

                    <el-tab-pane v-if="canViewDailyVideo" label="日度趋势" name="dailyVideo">
                        <el-form
                            :model="dailyVideoSearchForm"
                            inline
                            class="search-form search-form--single-row"
                        >
                            <el-form-item>
                                <el-date-picker
                                    v-model="dailyVideoSearchForm.dateRange"
                                    class="filter-date-range"
                                    type="daterange"
                                    range-separator="至"
                                    start-placeholder="开始日期"
                                    end-placeholder="结束日期"
                                    value-format="YYYY-MM-DD"
                                    clearable
                                    :default-value="searchDateRangeDefaultCalendar"
                                    :disabled-date="disableSearchDateRangeDate"
                                />
                            </el-form-item>
                            <el-form-item class="search-form__actions">
                                <el-button class="btn-query" type="primary" @click="handleDailyVideoSearch"
                                    >查询</el-button
                                >
                                <el-button class="btn-reset" @click="handleDailyVideoReset">重置</el-button>
                            </el-form-item>
                        </el-form>
                        <div class="play-stat-list-toolbar-row">
                            <div class="play-stat-list-summary" aria-live="polite">
                                <span class="play-stat-list-summary__pair">
                                    <span class="play-stat-list-summary__label">统计日期：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--daterange"
                                        >{{ dailyVideoSearchStatDateRangeText }}</span
                                    >
                                </span>
                                <span
                                    v-if="dailyVideoTableShowOptionalColumn('txPlayCount')"
                                    class="play-stat-list-summary__pair"
                                >
                                    <span class="play-stat-list-summary__label">总TX播放次数：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--times"
                                        >{{ dailyVideoAggregatePlayTimesDisplay }}</span
                                    >
                                </span>
                                <span class="play-stat-list-summary__pair">
                                    <span class="play-stat-list-summary__label">总播放次数：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--times"
                                        >{{ dailyVideoAggregateOwnerPlayTimesDisplay }}</span
                                    >
                                </span>
                                <span class="play-stat-list-summary__pair">
                                    <span class="play-stat-list-summary__label">总播放流量：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--flux"
                                        >{{ dailyVideoAggregateFluxDisplay }}</span
                                    >
                                </span>
                                <span class="play-stat-list-summary__pair">
                                    <span class="play-stat-list-summary__label">总喜欢：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--flux"
                                        >{{ dailyVideoAggregateLikeDisplay }}</span
                                    >
                                </span>
                                <span class="play-stat-list-summary__pair">
                                    <span class="play-stat-list-summary__label">总收藏：</span>
                                    <span
                                        class="play-stat-list-summary__value play-stat-list-summary__value--times"
                                        >{{ dailyVideoAggregateFaveDisplay }}</span
                                    >
                                </span>
                            </div>
                            <div class="table-toolbar play-stat-list-toolbar-row__toolbar">
                                <span class="toolbar-actions">
                                    <el-icon class="toolbar-icon" @click="loadDailyVideoStats"
                                        ><Refresh
                                    /></el-icon>
                                    <el-tooltip effect="dark" content="列设置" placement="top">
                                        <el-dropdown
                                            trigger="click"
                                            :hide-on-click="false"
                                            class="play-stat-detail-col-dropdown"
                                        >
                                            <el-icon class="toolbar-icon" aria-label="列设置"
                                                ><Setting
                                            /></el-icon>
                                            <template #dropdown>
                                                <el-dropdown-menu class="table-column-setting">
                                                    <div class="play-stat-detail-col-setting-panel">
                                                        <el-checkbox-group v-model="dailyVideoOptionalTableColumnKeys">
                                                            <div class="play-stat-detail-col-setting-list">
                                                                <el-checkbox label="txPlayCount"
                                                                    >TX播放次数</el-checkbox
                                                                >
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
                        <div class="drama-table-block" v-loading="dailyVideoLoading">
                            <el-table
                                class="drama-op-table play-stat-table--compact"
                                :data="dailyVideoList"
                                style="width: 100%"
                                empty-text="暂无数据"
                            >
                                <el-table-column prop="date" label="日期" min-width="112" align="center" />
                                <el-table-column
                                    v-if="dailyVideoTableShowOptionalColumn('txPlayCount')"
                                    prop="playTimes"
                                    min-width="100"
                                    align="center"
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
                                        {{ formatCount(row.playTimes) }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="ownerPlayTimes" min-width="112" align="center">
                                    <template #header>
                                        <span class="play-stat-detail-th-tip">
                                            播放次数
                                            <el-tooltip
                                                content="App上报统计的播放次数"
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
                                        {{ formatCount(Number(row.ownerPlayTimes ?? 0)) }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="flux" label="播放流量" min-width="100" align="center">
                                    <template #default="{ row }">
                                        {{ formatTraffic(row.flux) }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="likes" label="喜欢" min-width="88" align="center">
                                    <template #default="{ row }">
                                        {{ formatCount(row.likes) }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="fave" label="收藏" min-width="88" align="center">
                                    <template #default="{ row }">
                                        {{ formatCount(row.fave) }}
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                        <div class="pagination-wrapper">
                            <el-pagination
                                v-model:current-page="dailyVideoCurrentPage"
                                v-model:page-size="dailyVideoPageSize"
                                :total="dailyVideoTotal"
                                :page-sizes="[10, 20, 50]"
                                layout="total, sizes, ->, prev, pager, next, jumper"
                                prev-text="上一页"
                                next-text="下一页"
                                @size-change="handleDailyVideoPageSizeChange"
                                @current-change="handleDailyVideoCurrentChange"
                            />
                        </div>

                        <div
                            class="daily-video-chart-wrap"
                            aria-label="每日视频统计趋势"
                        >
                            <div v-if="dailyVideoChartRecords.length === 0" class="daily-video-chart-empty">
                                暂无趋势数据（请先查询或调整日期范围）
                            </div>
                            <div
                                v-else
                                ref="dailyVideoTrendChartRef"
                                class="daily-video-chart"
                            />
                        </div>
                    </el-tab-pane>

                    <el-tab-pane v-if="canViewTop100" label="播放次数Top 100" name="topPlay">
                        <div class="top100-panel">
                            <el-form inline class="search-form search-form--single-row top100-form">
                                <el-form-item>
                                    <el-date-picker
                                        v-model="top100PlayForm.pickerDate"
                                        type="date"
                                        value-format="YYYY-MM-DD"
                                        placeholder="选择日期"
                                        clearable
                                        class="filter-date-single"
                                        :disabled-date="disableTodayAndFuture"
                                    />
                                </el-form-item>
                                <el-form-item>
                                    <el-select
                                        v-model="top100PlayForm.dataType"
                                        class="filter-select filter-select--top100-scope"
                                        placeholder="总览"
                                        filterable
                                        clearable
                                        @focus="onTop100AppSelectFocus"
                                    >
                                        <el-option label="总览" value="overview" />
                                        <el-option label="分览" value="detailedView" />
                                        <el-option
                                            v-for="opt in allPlayStatAppOptions"
                                            :key="opt.value"
                                            :label="opt.label"
                                            :value="opt.value"
                                        />
                                    </el-select>
                                </el-form-item>
                                <el-form-item class="search-form__actions">
                                    <el-button class="btn-query" type="primary" @click="loadTopPlay"
                                        >查询</el-button
                                    >
                                </el-form-item>
                            </el-form>
                            <div class="table-toolbar">
                                <span class="toolbar-actions">
                                    <el-icon class="toolbar-icon" @click="loadTopPlay"
                                        ><Refresh
                                    /></el-icon>
                                </span>
                            </div>
                            <div class="drama-table-block" v-loading="topPlayLoading">
                                <el-table
                                    class="drama-op-table play-stat-table--compact"
                                    :data="topPlayList"
                                    style="width: 100%"
                                    max-height="560"
                                    empty-text="暂无数据"
                                >
                                    <el-table-column
                                        type="index"
                                        label="排名"
                                        width="56"
                                        align="center"
                                    />
                                    <el-table-column
                                        prop="fileId"
                                        label="fileId"
                                        min-width="120"
                                        align="center"
                                    >
                                        <template #default="{ row }">
                                            <div class="copy-cell copy-cell--tight">
                                                <span class="play-stat-fileid-full">{{
                                                    row.fileId || '--'
                                                }}</span>
                                                <el-button
                                                    v-if="row.fileId"
                                                    type="primary"
                                                    link
                                                    size="small"
                                                    :icon="CopyDocument"
                                                    class="episode-item__copy"
                                                    @click.stop="copyText(row.fileId, 'fileId')"
                                                />
                                            </div>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="vid"
                                        label="vid"
                                        min-width="104"
                                        align="center"
                                    >
                                        <template #default="{ row }">
                                            <div
                                                class="copy-cell copy-cell--center copy-cell--tight"
                                            >
                                                <span class="play-stat-trunc">{{
                                                    row.vid || '--'
                                                }}</span>
                                                <el-button
                                                    v-if="row.vid"
                                                    type="primary"
                                                    link
                                                    size="small"
                                                    :icon="CopyDocument"
                                                    class="episode-item__copy"
                                                    @click.stop="copyText(row.vid, 'vid')"
                                                />
                                            </div>
                                        </template>
                                    </el-table-column>
                                    <!-- Top100 接口仅有 title，无 titleLanguage；不按列表拆原始/上线 -->
                                    <el-table-column label="剧名" min-width="140" align="center">
                                        <template #default="{ row }">
                                            <div
                                                class="copy-cell copy-cell--center copy-cell--tight"
                                            >
                                                <div class="copy-cell__tail-main">
                                                    <el-tooltip
                                                        :content="top100DramaTitle(row)"
                                                        placement="top"
                                                        :show-after="200"
                                                        popper-class="play-stat-ellipsis-tooltip"
                                                        :disabled="!top100DramaTitle(row)"
                                                    >
                                                        <div class="copy-cell__tail-trigger">
                                                            <span
                                                                class="play-stat-trunc play-stat-trunc--tail"
                                                                >{{
                                                                    top100DramaTitle(row) || '--'
                                                                }}</span
                                                            >
                                                        </div>
                                                    </el-tooltip>
                                                </div>
                                                <el-button
                                                    v-if="top100DramaTitle(row)"
                                                    type="primary"
                                                    link
                                                    size="small"
                                                    :icon="CopyDocument"
                                                    @click.stop="
                                                        copyText(top100DramaTitle(row), '剧名')
                                                    "
                                                />
                                            </div>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        v-if="topPlayTableDataType !== 'overview'"
                                        label="App名称"
                                        min-width="120"
                                        align="center"
                                    >
                                        <template #default="{ row }">
                                            <el-tooltip
                                                :content="formatAppLine(row)"
                                                placement="top"
                                                :show-after="200"
                                                popper-class="play-stat-ellipsis-tooltip"
                                                :disabled="formatAppLine(row) === '--'"
                                            >
                                                <div
                                                    class="copy-cell__tail-trigger copy-cell__tail-trigger--solo"
                                                >
                                                    <span
                                                        class="play-stat-trunc play-stat-trunc--block play-stat-trunc--tail"
                                                        >{{ formatAppLine(row) }}</span
                                                    >
                                                </div>
                                            </el-tooltip>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        v-if="topPlayTableDataType !== 'overview'"
                                        label="域名"
                                        min-width="100"
                                        align="center"
                                    >
                                        <template #default="{ row }">
                                            <div
                                                class="copy-cell copy-cell--center copy-cell--tight"
                                            >
                                                <div class="copy-cell__tail-main">
                                                    <el-tooltip
                                                        :content="row.hostName"
                                                        placement="top"
                                                        :show-after="200"
                                                        popper-class="play-stat-ellipsis-tooltip"
                                                        :disabled="row.hostName === '--'"
                                                    >
                                                        <div class="copy-cell__tail-trigger">
                                                            <span
                                                                class="play-stat-trunc play-stat-trunc--tail"
                                                                >{{ row.hostName || '--' }}</span
                                                            >
                                                        </div>
                                                    </el-tooltip>
                                                </div>
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
                                        prop="episodeNo"
                                        label="剧集"
                                        width="52"
                                        align="center"
                                    />
                                    <el-table-column
                                        prop="playCount"
                                        min-width="120"
                                        align="center"
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
                                        prop="playTraffic"
                                        label="播放流量"
                                        width="90"
                                        align="center"
                                    >
                                        <template #default="{ row }">
                                            {{ formatTraffic(row.playTraffic) }}
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="dateRangeText"
                                        label="日期"
                                        min-width="104"
                                        align="center"
                                    />
                                </el-table>
                            </div>
                        </div>
                    </el-tab-pane>

                    <el-tab-pane v-if="canViewTop100" label="播放流量Top 100" name="topFlux">
                        <div class="top100-panel">
                            <el-form inline class="search-form search-form--single-row top100-form">
                                <el-form-item>
                                    <el-date-picker
                                        v-model="top100FluxForm.pickerDate"
                                        type="date"
                                        value-format="YYYY-MM-DD"
                                        placeholder="选择日期"
                                        clearable
                                        class="filter-date-single"
                                        :disabled-date="disableTodayAndFuture"
                                    />
                                </el-form-item>
                                <el-form-item>
                                    <el-select
                                        v-model="top100FluxForm.dataType"
                                        class="filter-select filter-select--top100-scope"
                                        placeholder="总览"
                                        filterable
                                        clearable
                                        @focus="onTop100AppSelectFocus"
                                    >
                                        <el-option label="总览" value="overview" />
                                        <el-option label="分览" value="detailedView" />
                                        <el-option
                                            v-for="opt in allPlayStatAppOptions"
                                            :key="`flux-${opt.value}`"
                                            :label="opt.label"
                                            :value="opt.value"
                                        />
                                    </el-select>
                                </el-form-item>
                                <el-form-item class="search-form__actions">
                                    <el-button class="btn-query" type="primary" @click="loadTopFlux"
                                        >查询</el-button
                                    >
                                </el-form-item>
                            </el-form>
                            <div class="table-toolbar">
                                <span class="toolbar-actions">
                                    <el-icon class="toolbar-icon" @click="loadTopFlux"
                                        ><Refresh
                                    /></el-icon>
                                </span>
                            </div>
                            <div class="drama-table-block" v-loading="topFluxLoading">
                                <el-table
                                    class="drama-op-table play-stat-table--compact"
                                    :data="topFluxList"
                                    style="width: 100%"
                                    max-height="560"
                                    empty-text="暂无数据"
                                >
                                    <el-table-column
                                        type="index"
                                        label="排名"
                                        width="56"
                                        align="center"
                                    />
                                    <el-table-column
                                        prop="fileId"
                                        label="fileId"
                                        min-width="120"
                                        align="center"
                                    >
                                        <template #default="{ row }">
                                            <div class="copy-cell copy-cell--tight">
                                                <span class="play-stat-fileid-full">{{
                                                    row.fileId || '--'
                                                }}</span>
                                                <el-button
                                                    v-if="row.fileId"
                                                    type="primary"
                                                    link
                                                    size="small"
                                                    :icon="CopyDocument"
                                                    class="episode-item__copy"
                                                    @click.stop="copyText(row.fileId, 'fileId')"
                                                />
                                            </div>
                                        </template>
                                    </el-table-column>

                                    <el-table-column
                                        prop="vid"
                                        label="vid"
                                        min-width="104"
                                        align="center"
                                    >
                                        <template #default="{ row }">
                                            <div
                                                class="copy-cell copy-cell--center copy-cell--tight"
                                            >
                                                <span class="play-stat-trunc">{{
                                                    row.vid || '--'
                                                }}</span>
                                                <el-button
                                                    v-if="row.vid"
                                                    type="primary"
                                                    link
                                                    size="small"
                                                    :icon="CopyDocument"
                                                    class="episode-item__copy"
                                                    @click.stop="copyText(row.vid, 'vid')"
                                                />
                                            </div>
                                        </template>
                                    </el-table-column>
                                    <!-- Top100 接口仅有 title，无 titleLanguage；不按列表拆原始/上线 -->
                                    <el-table-column label="剧名" min-width="140" align="center">
                                        <template #default="{ row }">
                                            <div
                                                class="copy-cell copy-cell--center copy-cell--tight"
                                            >
                                                <div class="copy-cell__tail-main">
                                                    <el-tooltip
                                                        :content="top100DramaTitle(row)"
                                                        placement="top"
                                                        :show-after="200"
                                                        popper-class="play-stat-ellipsis-tooltip"
                                                        :disabled="!top100DramaTitle(row)"
                                                    >
                                                        <div class="copy-cell__tail-trigger">
                                                            <span
                                                                class="play-stat-trunc play-stat-trunc--tail"
                                                                >{{
                                                                    top100DramaTitle(row) || '--'
                                                                }}</span
                                                            >
                                                        </div>
                                                    </el-tooltip>
                                                </div>
                                                <el-button
                                                    v-if="top100DramaTitle(row)"
                                                    type="primary"
                                                    link
                                                    size="small"
                                                    :icon="CopyDocument"
                                                    @click.stop="
                                                        copyText(top100DramaTitle(row), '剧名')
                                                    "
                                                />
                                            </div>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        v-if="topFluxTableDataType !== 'overview'"
                                        label="App名称"
                                        min-width="120"
                                        align="center"
                                    >
                                        <template #default="{ row }">
                                            <el-tooltip
                                                :content="formatAppLine(row)"
                                                placement="top"
                                                :show-after="200"
                                                popper-class="play-stat-ellipsis-tooltip"
                                                :disabled="formatAppLine(row) === '--'"
                                            >
                                                <div
                                                    class="copy-cell__tail-trigger copy-cell__tail-trigger--solo"
                                                >
                                                    <span
                                                        class="play-stat-trunc play-stat-trunc--block play-stat-trunc--tail"
                                                        >{{ formatAppLine(row) }}</span
                                                    >
                                                </div>
                                            </el-tooltip>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        v-if="topFluxTableDataType !== 'overview'"
                                        label="域名"
                                        min-width="100"
                                        align="center"
                                    >
                                        <template #default="{ row }">
                                            <div
                                                class="copy-cell copy-cell--center copy-cell--tight"
                                            >
                                                <div class="copy-cell__tail-main">
                                                    <el-tooltip
                                                        :content="row.hostName"
                                                        placement="top"
                                                        :show-after="200"
                                                        popper-class="play-stat-ellipsis-tooltip"
                                                        :disabled="row.hostName === '--'"
                                                    >
                                                        <div class="copy-cell__tail-trigger">
                                                            <span
                                                                class="play-stat-trunc play-stat-trunc--tail"
                                                                >{{ row.hostName || '--' }}</span
                                                            >
                                                        </div>
                                                    </el-tooltip>
                                                </div>
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
                                        prop="episodeNo"
                                        label="剧集"
                                        width="52"
                                        align="center"
                                    />
                                    <el-table-column
                                        prop="playCount"
                                        min-width="120"
                                        align="center"
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
                                        prop="playTraffic"
                                        label="播放流量"
                                        width="90"
                                        align="center"
                                    >
                                        <template #default="{ row }">
                                            {{ formatTraffic(row.playTraffic) }}
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="dateRangeText"
                                        label="日期"
                                        min-width="104"
                                        align="center"
                                    />
                                </el-table>
                            </div>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </el-card>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import {
    computed,
    nextTick,
    onActivated,
    onMounted,
    onUnmounted,
    reactive,
    ref,
    watch,
    watchEffect,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CopyDocument, QuestionFilled, Refresh, Setting } from '@element-plus/icons-vue'
import { getSupportLanguagePage } from '@/api'
import { getAppList, getAppTrafficDetail } from '@/api/app'
import { getCopyrightSourceInfoList } from '@/api/copyright'
import {
    getDramaPlayStatisticsPage,
    getDramaStatsDailyPage,
    getVodPlayDailyTop100,
    postDramaUserActionStatsIncr,
    type DramaStatsDailyRecord,
    type DramaUserActionStatsIncrRow,
} from '@/api/drama'
import {
    hasPerm,
    PERM_COPYRIGHT_SOURCE,
    PERM_DRAMA_USER_ACTION_STATS_INCR,
    PERM_VOD_PLAY_DAILY_INFO,
    PERM_VOD_PLAY_DRAMA_DAILY_STATS,
    PERM_VOD_PLAY_TOP100,
} from '@/utils/permission'
import {
    formatAppLine,
    formatCopyrightLine,
    formatCount,
    formatTraffic,
    getPlayStatDetailRouteName,
    getPlayStatListSessionKey,
    getPlayStatPageTitle,
    mapGetAppListToSelectOptions,
    normalizePlayStatRow,
    resolvePlayStatDataType,
    type PlayStatRow,
} from './playStatUtils'

const route = useRoute()
const router = useRouter()

/**
 * 将本地 `Date` 转为接口/路由常用的 `yyyy-MM-dd`。
 * @param d 本地日期（建议已归一到日粒度）
 */
function formatYmd(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

/**
 * 取「昨天」的日历日期字符串（yyyy-MM-dd），用于列表默认日期范围、Top100 默认值等。
 * @returns 格式化的昨天日期
 */
function getYesterdayYmd() {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return formatYmd(d)
}

/** 每日视频统计默认区间：开始为「昨天」往前一个月，结束为「昨天」（与列表一致不含今天） */
function getDefaultDailyStatsDateRange(): string[] {
    const end = new Date()
    end.setDate(end.getDate() - 1)
    end.setHours(0, 0, 0, 0)
    const start = new Date(end)
    start.setMonth(start.getMonth() - 1)
    return [formatYmd(start), formatYmd(end)]
}

/**
 * Date -> ISO(带时区偏移)，与流量详情页一致，供 `/api/apps/traffic/detail` 使用。
 */
function formatToIsoWithOffset(date: Date) {
    const d = new Date(date)
    const pad = (v: number) => String(v).padStart(2, '0')
    const y = d.getFullYear()
    const m = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hh = pad(d.getHours())
    const mm = pad(d.getMinutes())
    const ss = pad(d.getSeconds())
    const offsetMin = -d.getTimezoneOffset()
    const sign = offsetMin >= 0 ? '+' : '-'
    const oh = pad(Math.floor(Math.abs(offsetMin) / 60))
    const om = pad(Math.abs(offsetMin) % 60)
    return `${y}-${m}-${day}T${hh}:${mm}:${ss}${sign}${oh}:${om}`
}

/** 归一到当前整点（本地） */
function floorDateToHour(d: Date) {
    const x = new Date(d)
    x.setMinutes(0, 0, 0)
    return x
}

/** 流量折线图 Y 轴：接口可能返回纯数字或带单位的字符串 */
function parseTrafficPointNumeric(v: unknown): number {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string') {
        const m = v.match(/-?\d+(?:\.\d+)?/)
        if (m) return parseFloat(m[0])
    }
    return 0
}

/**
 * `/api/apps/traffic/detail` 的 `dataList` 折线数值与「流量管理-详情」一致，为 **GB 量级**（非字节）。
 * 列表/概览里 `formatTraffic` 按字节换算，用在此处会导致 Y 轴与 tooltip 全是「0 MB」。
 */
function formatHourly24TrafficDetailGb(v: unknown): string {
    const n = Number(v ?? 0)
    if (!Number.isFinite(n)) return '--'
    if (Math.abs(n) >= 1000) {
        return `${(n / 1000).toLocaleString('zh-CN', { maximumFractionDigits: 2 })} TB`
    }
    return `${n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} GB`
}

const title = computed(() => getPlayStatPageTitle(route.path))

type MainTab = 'list' | 'hourly24' | 'topPlay' | 'topFlux' | 'dailyVideo'

const PLAY_STAT_TAB_ORDER: MainTab[] = ['hourly24', 'list', 'dailyVideo', 'topPlay', 'topFlux']

const canViewHourly24 = computed(() => hasPerm(PERM_DRAMA_USER_ACTION_STATS_INCR.list))
const canViewPlayStatList = computed(() => hasPerm(PERM_VOD_PLAY_DAILY_INFO.list))
const canViewDailyVideo = computed(() => hasPerm(PERM_VOD_PLAY_DRAMA_DAILY_STATS.list))
const canViewTop100 = computed(() => hasPerm(PERM_VOD_PLAY_TOP100.list))

function canViewPlayStatTab(tab: MainTab): boolean {
    switch (tab) {
        case 'hourly24':
            return canViewHourly24.value
        case 'list':
            return canViewPlayStatList.value
        case 'dailyVideo':
            return canViewDailyVideo.value
        case 'topPlay':
        case 'topFlux':
            return canViewTop100.value
        default:
            return false
    }
}

function firstAvailablePlayStatTab(): MainTab {
    return PLAY_STAT_TAB_ORDER.find((t) => canViewPlayStatTab(t)) ?? 'hourly24'
}

function resolvePlayStatMainTab(tab: MainTab): MainTab {
    if (canViewPlayStatTab(tab)) return tab
    return firstAvailablePlayStatTab()
}

const mainTab = ref<MainTab>('hourly24')

watchEffect(() => {
    const fixed = resolvePlayStatMainTab(mainTab.value)
    if (fixed !== mainTab.value) {
        mainTab.value = fixed
    }
})

/** 从详情返回时恢复列表筛选项与分页（sessionStorage）；运营管理与短剧管理分 key */
function playStatListSessionKey() {
    return getPlayStatListSessionKey(route.path)
}

type PlayStatListSessionPayload = {
    mainTab: MainTab
    searchForm: {
        languageCode: string
        vid: string
        title: string
        copyrightCode: string
        appPkg: string
        dateRange: string[]
        /** 列表仅 0/1；旧会话若存 2 则恢复时降为 0 */
        sortType: 0 | 1 | 2
    }
    currentPage: number
    pageSize: number
}

function persistPlayStatListStateForDetailReturn() {
    const payload: PlayStatListSessionPayload = {
        mainTab: mainTab.value,
        searchForm: {
            languageCode: String(searchForm.languageCode ?? ''),
            vid: String(searchForm.vid ?? ''),
            title: String(searchForm.title ?? ''),
            copyrightCode: String(searchForm.copyrightCode ?? ''),
            appPkg: String(searchForm.appPkg ?? ''),
            dateRange: Array.isArray(searchForm.dateRange) ? [...searchForm.dateRange] : [],
            sortType: searchForm.sortType,
        },
        currentPage: currentPage.value,
        pageSize: pageSize.value,
    }
    try {
        sessionStorage.setItem(playStatListSessionKey(), JSON.stringify(payload))
    } catch {
        /* 隐私模式等 */
    }
}

function restorePlayStatListStateFromSession(): boolean {
    try {
        const raw = sessionStorage.getItem(playStatListSessionKey())
        if (!raw) return false
        sessionStorage.removeItem(playStatListSessionKey())
        const data = JSON.parse(raw) as Partial<PlayStatListSessionPayload>
        const sf = data.searchForm
        if (!sf || typeof sf !== 'object') return false

        searchForm.languageCode = String(sf.languageCode ?? '')
        searchForm.vid = String(sf.vid ?? '')
        searchForm.title = String(sf.title ?? '')
        searchForm.copyrightCode = String(sf.copyrightCode ?? '')
        searchForm.appPkg = String(sf.appPkg ?? '')
        searchForm.dateRange = Array.isArray(sf.dateRange) ? [...sf.dateRange] : []
        const st = sf.sortType
        searchForm.sortType = st === 0 || st === 1 ? st : 0

        const cp = Number(data.currentPage)
        currentPage.value = Number.isFinite(cp) && cp >= 1 ? Math.floor(cp) : 1
        const ps = Number(data.pageSize)
        pageSize.value = ps === 10 || ps === 20 || ps === 50 ? ps : 10

        const mt = data.mainTab
        if (mt === 'list' || mt === 'hourly24' || mt === 'topPlay' || mt === 'topFlux' || mt === 'dailyVideo') {
            mainTab.value = resolvePlayStatMainTab(mt)
        }
        return true
    } catch {
        try {
            sessionStorage.removeItem(playStatListSessionKey())
        } catch {
            /* noop */
        }
        return false
    }
}

const loading = ref(false)
const list = ref<PlayStatRow[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

/** 列表可选列（默认不勾选：TX 播放次数） */
const listOptionalTableColumnKeys = ref<string[]>([])

function listTableShowOptionalColumn(key: string): boolean {
    return listOptionalTableColumnKeys.value.includes(key)
}

/** 列表接口 `data.totalPlayTimes`（TX）/ `data.totalOwnerPlayTimes`（播放）/ `data.totalFlux`，与当前筛选条件一致 */
const listAggregateTotalPlayTimes = ref<number | null>(null)
const listAggregateTotalOwnerPlayTimes = ref<number | null>(null)
const listAggregateTotalFlux = ref<number | null>(null)
const listAggregatePlayTimesDisplay = computed(() => {
    const v = listAggregateTotalPlayTimes.value
    if (v == null || !Number.isFinite(v)) return '--'
    return formatCount(v)
})
const listAggregateOwnerPlayTimesDisplay = computed(() => {
    const v = listAggregateTotalOwnerPlayTimes.value
    if (v == null || !Number.isFinite(v)) return '--'
    return formatCount(v)
})
const listAggregateFluxDisplay = computed(() => {
    const v = listAggregateTotalFlux.value
    if (v == null || !Number.isFinite(v)) return '--'
    return formatTraffic(v)
})

const searchForm = reactive({
    languageCode: '',
    vid: '',
    title: '',
    copyrightCode: '',
    /** 应用包名；空字符串为全部应用 */
    appPkg: '',
    /** 开始/结束日期（yyyy-MM-dd）；默认均为昨天，首次进入即按昨日区间请求 */
    dateRange: (() => {
        const y = getYesterdayYmd()
        return [y, y] as string[]
    })(),
    /** 0 播放次数（默认） / 1 播放流量 */
    sortType: 0 as 0 | 1,
})

/** 列表搜索日期范围：打开面板且无选中值时，左侧日历为上一个月、右侧为当月 */
const searchDateRangeDefaultCalendar = computed((): [Date, Date] => {
    const now = new Date()
    return [
        new Date(now.getFullYear(), now.getMonth() - 1, 1),
        new Date(now.getFullYear(), now.getMonth(), 1),
    ]
})

/** 汇总条「统计日期」文案，与搜索区日期范围一致；起止同一天只显示一个日期 */
const listSearchStatDateRangeText = computed(() => {
    const arr = Array.isArray(searchForm.dateRange) ? searchForm.dateRange : []
    const a = String(arr[0] ?? '').trim()
    const b = String(arr[1] ?? '').trim()
    if (a && b) return a === b ? a : `${a} 至 ${b}`
    if (a) return a
    if (b) return b
    return '--'
})

const languageOptionsLoading = ref(false)
const languageOptions = ref<{ languageCode: string; languageName: string; label: string }[]>([])

const canListCopyrightSource = computed(() => hasPerm(PERM_COPYRIGHT_SOURCE.list))
const copyrightOwnerOptions = ref<{ label: string; value: string }[]>([])
const copyrightOwnerLoading = ref(false)

/** Top100「数据范围」包名下拉数据源 */
const allPlayStatAppOptions = ref<{ value: string; label: string; raw?: any }[]>([])
const playStatAppSelectLoading = ref(false)

const top100PlayForm = reactive({
    pickerDate: '' as string,
    /** overview | detailedView | App 包名 */
    dataType: 'overview',
})
const top100FluxForm = reactive({
    pickerDate: '' as string,
    dataType: 'overview',
})
const topPlayList = ref<PlayStatRow[]>([])
const topFluxList = ref<PlayStatRow[]>([])
const topPlayLoading = ref(false)
const topFluxLoading = ref(false)

const dailyVideoLoading = ref(false)
const dailyVideoList = ref<DramaStatsDailyRecord[]>([])
const dailyVideoTotal = ref(0)
const dailyVideoCurrentPage = ref(1)
const dailyVideoPageSize = ref(10)
const dailyVideoSearchForm = reactive({
    dateRange: getDefaultDailyStatsDateRange() as string[],
})

/** 概览表可选列（默认不勾选：TX 播放次数）；汇总条与底部折线图与列勾选一致 */
const dailyVideoOptionalTableColumnKeys = ref<string[]>([])

function dailyVideoTableShowOptionalColumn(key: string): boolean {
    return dailyVideoOptionalTableColumnKeys.value.includes(key)
}

/** 概览接口汇总字段（与当前筛选日期范围一致） */
const dailyVideoAggregateTotalPlayTimes = ref<number | null>(null)
const dailyVideoAggregateTotalOwnerPlayTimes = ref<number | null>(null)
const dailyVideoAggregateTotalFlux = ref<number | null>(null)
const dailyVideoAggregateTotalLike = ref<number | null>(null)
const dailyVideoAggregateTotalFave = ref<number | null>(null)

const dailyVideoSearchStatDateRangeText = computed(() => {
    const arr = Array.isArray(dailyVideoSearchForm.dateRange) ? dailyVideoSearchForm.dateRange : []
    const a = String(arr[0] ?? '').trim()
    const b = String(arr[1] ?? '').trim()
    if (a && b) return a === b ? a : `${a} 至 ${b}`
    if (a) return a
    if (b) return b
    return '--'
})
const dailyVideoAggregatePlayTimesDisplay = computed(() => {
    const v = dailyVideoAggregateTotalPlayTimes.value
    if (v == null || !Number.isFinite(v)) return '--'
    return formatCount(v)
})
const dailyVideoAggregateOwnerPlayTimesDisplay = computed(() => {
    const v = dailyVideoAggregateTotalOwnerPlayTimes.value
    if (v == null || !Number.isFinite(v)) return '--'
    return formatCount(v)
})
const dailyVideoAggregateFluxDisplay = computed(() => {
    const v = dailyVideoAggregateTotalFlux.value
    if (v == null || !Number.isFinite(v)) return '--'
    return formatTraffic(v)
})
const dailyVideoAggregateLikeDisplay = computed(() => {
    const v = dailyVideoAggregateTotalLike.value
    if (v == null || !Number.isFinite(v)) return '--'
    return formatCount(v)
})
const dailyVideoAggregateFaveDisplay = computed(() => {
    const v = dailyVideoAggregateTotalFave.value
    if (v == null || !Number.isFinite(v)) return '--'
    return formatCount(v)
})

/** 当前筛选日期范围内全量日维度数据（单独分页拉取，供底部折线图） */
const dailyVideoChartRecords = ref<DramaStatsDailyRecord[]>([])
const dailyVideoTrendChartRef = ref<HTMLElement | null>(null)
let dailyVideoTrendChartInst: echarts.ECharts | null = null
let dailyVideoTrendChartResizeBound = false
let dailyVideoTrendChartLegendBound = false

function onDailyVideoTrendChartResize() {
    dailyVideoTrendChartInst?.resize()
}

function disposeDailyVideoTrendChart() {
    if (dailyVideoTrendChartInst) {
        dailyVideoTrendChartInst.off('legendselectchanged')
        dailyVideoTrendChartInst.dispose()
        dailyVideoTrendChartInst = null
    }
    if (dailyVideoTrendChartResizeBound) {
        window.removeEventListener('resize', onDailyVideoTrendChartResize)
        dailyVideoTrendChartResizeBound = false
    }
    dailyVideoTrendChartLegendBound = false
}

/** 日度趋势图例默认：喜欢、收藏默认不展示（与实时概览一致） */
function getDailyVideoLegendDefault(showTxPlay: boolean): Record<string, boolean> {
    return {
        播放次数: true,
        播放流量: true,
        喜欢: false,
        收藏: false,
        ...(showTxPlay ? { TX播放次数: true } : {}),
    }
}

function mergeDailyVideoLegendSelected(
    showTxPlay: boolean,
    override?: Record<string, boolean>,
) {
    return { ...getDailyVideoLegendDefault(showTxPlay), ...override }
}

function isDailyVideoLegendSeriesOn(
    selected: Record<string, boolean>,
    name: string,
    showTxPlay: boolean,
) {
    const defaults = getDailyVideoLegendDefault(showTxPlay)
    if (Object.prototype.hasOwnProperty.call(selected, name)) {
        return selected[name] !== false
    }
    return defaults[name] !== false
}

function dailyVideoChartGridRight(selected: Record<string, boolean>, showTxPlay: boolean) {
    const rightCount = [
        isDailyVideoLegendSeriesOn(selected, '播放流量', showTxPlay),
        isDailyVideoLegendSeriesOn(selected, '喜欢', showTxPlay),
        isDailyVideoLegendSeriesOn(selected, '收藏', showTxPlay),
    ].filter(Boolean).length
    if (rightCount >= 3) return 220
    if (rightCount === 2) return 140
    if (rightCount === 1) return 56
    return 24
}

function dailyVideoChartGridLeft(selected: Record<string, boolean>, showTxPlay: boolean) {
    const leftOn =
        isDailyVideoLegendSeriesOn(selected, '播放次数', showTxPlay) ||
        (showTxPlay && isDailyVideoLegendSeriesOn(selected, 'TX播放次数', showTxPlay))
    return leftOn ? 56 : 24
}

function buildDailyVideoYAxes(
    selected: Record<string, boolean>,
    showTxPlay: boolean,
    leftAxisName: string,
): EChartsOption['yAxis'] {
    const leftOn =
        isDailyVideoLegendSeriesOn(selected, '播放次数', showTxPlay) ||
        (showTxPlay && isDailyVideoLegendSeriesOn(selected, 'TX播放次数', showTxPlay))
    const fluxOn = isDailyVideoLegendSeriesOn(selected, '播放流量', showTxPlay)
    const likeOn = isDailyVideoLegendSeriesOn(selected, '喜欢', showTxPlay)
    const faveOn = isDailyVideoLegendSeriesOn(selected, '收藏', showTxPlay)

    const rightStep = 80
    let rightOffset = 0
    const fluxAxisOffset = fluxOn ? rightOffset : 0
    if (fluxOn) rightOffset += rightStep
    const likeAxisOffset = likeOn ? rightOffset : 0
    if (likeOn) rightOffset += rightStep
    const faveAxisOffset = faveOn ? rightOffset : 0

    return [
        {
            type: 'value',
            name: leftAxisName,
            position: 'left',
            scale: true,
            show: leftOn,
            axisLabel: { fontSize: 11 },
        },
        {
            type: 'value',
            name: '播放流量',
            position: 'right',
            offset: fluxAxisOffset,
            nameGap: 12,
            scale: true,
            show: fluxOn,
            axisLabel: {
                fontSize: 11,
                formatter: (val: number) => formatTraffic(val),
            },
        },
        {
            type: 'value',
            name: '喜欢',
            position: 'right',
            offset: likeAxisOffset,
            nameGap: 12,
            scale: true,
            show: likeOn,
            axisLabel: { fontSize: 11 },
        },
        {
            type: 'value',
            name: '收藏',
            position: 'right',
            offset: faveAxisOffset,
            nameGap: 12,
            scale: true,
            show: faveOn,
            axisLabel: { fontSize: 11 },
        },
    ]
}

function syncDailyVideoChartAxesVisibility(selected: Record<string, boolean>) {
    if (!dailyVideoTrendChartInst) return
    const showTxPlay = dailyVideoOptionalTableColumnKeys.value.includes('txPlayCount')
    const merged = mergeDailyVideoLegendSelected(showTxPlay, selected)
    const leftAxisName = showTxPlay ? '次数' : '播放次数'
    dailyVideoTrendChartInst.setOption(
        {
            grid: {
                left: dailyVideoChartGridLeft(merged, showTxPlay),
                right: dailyVideoChartGridRight(merged, showTxPlay),
            },
            yAxis: buildDailyVideoYAxes(merged, showTxPlay, leftAxisName),
        },
        false,
    )
}

function bindDailyVideoChartLegendSync() {
    if (!dailyVideoTrendChartInst || dailyVideoTrendChartLegendBound) return
    dailyVideoTrendChartLegendBound = true
    dailyVideoTrendChartInst.on('legendselectchanged', (e: { selected?: Record<string, boolean> }) => {
        syncDailyVideoChartAxesVisibility(e.selected ?? {})
    })
}

/** —— 24 小时播放概览 Tab —— */
/** 选具体包名时传接口；空字符串为全部应用 */
const hourly24PkgName = ref('')
const hourly24Loading = ref(false)
const hourly24DramaRows = ref<DramaUserActionStatsIncrRow[]>([])
const hourly24TrafficList = ref<{ time: string; value: number }[]>([])
const hourly24RangeDisplay = ref('--')
const hourly24TrafficTotalRaw = ref<unknown>(null)

/** 表格分页（接口一次返回近 24 小时全量，前端按页切片，与列表 / 概览分页样式一致） */
const hourly24CurrentPage = ref(1)
const hourly24PageSize = ref(10)

/** 列表倒序：最新时段在前 */
const hourly24DramaRowsSorted = computed(() => {
    const arr = [...hourly24DramaRows.value]
    arr.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    return arr
})

const hourly24TableTotal = computed(() => hourly24DramaRowsSorted.value.length)

const hourly24DramaRowsPageSlice = computed(() => {
    const all = hourly24DramaRowsSorted.value
    const size = hourly24PageSize.value
    const pageSizeSafe = size === 10 || size === 20 || size === 50 ? size : 10
    const maxPage = Math.max(1, Math.ceil(all.length / pageSizeSafe) || 1)
    const page = Math.min(Math.max(1, hourly24CurrentPage.value), maxPage)
    const start = (page - 1) * pageSizeSafe
    return all.slice(start, start + pageSizeSafe)
})

const hourly24SumPlaysDisplay = computed(() =>
    formatCount(hourly24DramaRows.value.reduce((s, r) => s + Number(r?.totalPlays ?? 0), 0)),
)
const hourly24SumLikesDisplay = computed(() =>
    formatCount(hourly24DramaRows.value.reduce((s, r) => s + Number(r?.totalLikes ?? 0), 0)),
)
const hourly24SumFavesDisplay = computed(() =>
    formatCount(hourly24DramaRows.value.reduce((s, r) => s + Number(r?.totalFaves ?? 0), 0)),
)

const hourly24TrafficTotalDisplay = computed(() => {
    const v = hourly24TrafficTotalRaw.value
    if (v == null || v === '') return '--'
    if (typeof v === 'number' && Number.isFinite(v)) return formatHourly24TrafficDetailGb(v)
    if (typeof v === 'string') {
        if (/gb|tb|mb|GB|TB|MB/i.test(v)) return v.trim()
        const n = Number(v.replace(/,/g, ''))
        if (Number.isFinite(n)) return formatHourly24TrafficDetailGb(n)
    }
    return String(v)
})

function formatHourly24RangeLabel(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:00`
}

function formatHourly24DateTimeCell(iso: string) {
    if (!iso) return '--'
    const t = new Date(iso).getTime()
    if (!Number.isFinite(t)) return iso
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:00`
}

function hourBucketMs(d: Date) {
    const x = new Date(d)
    x.setMinutes(0, 0, 0)
    return x.getTime()
}

/** 流量明细按本地整点聚合，与折线图、表格「播放流量」列共用 */
const hourly24TrafficByHourMs = computed(() => {
    const map = new Map<number, number>()
    for (const p of hourly24TrafficList.value) {
        const t = hourBucketMs(new Date(p.time))
        if (!Number.isFinite(t)) continue
        map.set(t, (map.get(t) ?? 0) + p.value)
    }
    return map
})

function hourly24FluxAtRow(row: DramaUserActionStatsIncrRow): number {
    const t = hourBucketMs(new Date(row.dateTime))
    if (!Number.isFinite(t)) return 0
    return hourly24TrafficByHourMs.value.get(t) ?? 0
}

function buildHourly24MergedChartSeries() {
    const dramaMap = new Map<number, { plays: number; likes: number; faves: number }>()
    for (const r of hourly24DramaRows.value) {
        const t = hourBucketMs(new Date(r.dateTime))
        if (!Number.isFinite(t)) continue
        const cur = dramaMap.get(t) ?? { plays: 0, likes: 0, faves: 0 }
        cur.plays += Number(r?.totalPlays ?? 0)
        cur.likes += Number(r?.totalLikes ?? 0)
        cur.faves += Number(r?.totalFaves ?? 0)
        dramaMap.set(t, cur)
    }
    const trafficMap = hourly24TrafficByHourMs.value
    const keys = new Set([...dramaMap.keys(), ...trafficMap.keys()])
    const sorted = [...keys].sort((a, b) => a - b)
    const categories = sorted.map((ms) => {
        const d = new Date(ms)
        const pad = (n: number) => String(n).padStart(2, '0')
        return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:00`
    })
    const playsData = sorted.map((ms) => dramaMap.get(ms)?.plays ?? 0)
    const fluxData = sorted.map((ms) => trafficMap.get(ms) ?? 0)
    const likesData = sorted.map((ms) => dramaMap.get(ms)?.likes ?? 0)
    const faveData = sorted.map((ms) => dramaMap.get(ms)?.faves ?? 0)
    return { categories, playsData, fluxData, likesData, faveData }
}

const hourly24TrendChartRef = ref<HTMLElement | null>(null)
let hourly24TrendChartInst: echarts.ECharts | null = null
let hourly24TrendChartResizeBound = false
let hourly24TrendChartLegendBound = false

/** 趋势图图例默认：喜欢、收藏不展示 */
const HOURLY24_CHART_LEGEND_DEFAULT: Record<string, boolean> = {
    播放次数: true,
    播放流量: true,
    喜欢: false,
    收藏: false,
}

function mergeHourly24LegendSelected(override?: Record<string, boolean>) {
    return { ...HOURLY24_CHART_LEGEND_DEFAULT, ...override }
}

function isHourly24LegendSeriesOn(
    selected: Record<string, boolean>,
    name: keyof typeof HOURLY24_CHART_LEGEND_DEFAULT,
) {
    if (Object.prototype.hasOwnProperty.call(selected, name)) {
        return selected[name] !== false
    }
    return HOURLY24_CHART_LEGEND_DEFAULT[name] !== false
}

function hourly24ChartGridRight(selected: Record<string, boolean>) {
    const rightCount = [
        isHourly24LegendSeriesOn(selected, '播放流量'),
        isHourly24LegendSeriesOn(selected, '喜欢'),
        isHourly24LegendSeriesOn(selected, '收藏'),
    ].filter(Boolean).length
    if (rightCount >= 3) return 220
    if (rightCount === 2) return 140
    if (rightCount === 1) return 56
    return 24
}

function hourly24ChartGridLeft(selected: Record<string, boolean>) {
    return isHourly24LegendSeriesOn(selected, '播放次数') ? 56 : 24
}

/** 右侧 Y 轴按当前可见项依次排布 offset，避免仅显示「收藏」时轴在 160 被裁切 */
function buildHourly24YAxes(selected: Record<string, boolean>): EChartsOption['yAxis'] {
    const playOn = isHourly24LegendSeriesOn(selected, '播放次数')
    const fluxOn = isHourly24LegendSeriesOn(selected, '播放流量')
    const likeOn = isHourly24LegendSeriesOn(selected, '喜欢')
    const faveOn = isHourly24LegendSeriesOn(selected, '收藏')

    const rightStep = 80
    let rightOffset = 0
    const fluxAxisOffset = fluxOn ? rightOffset : 0
    if (fluxOn) rightOffset += rightStep
    const likeAxisOffset = likeOn ? rightOffset : 0
    if (likeOn) rightOffset += rightStep
    const faveAxisOffset = faveOn ? rightOffset : 0

    return [
        {
            type: 'value',
            name: '播放次数',
            position: 'left',
            scale: true,
            show: playOn,
            axisLabel: { fontSize: 11 },
        },
        {
            type: 'value',
            name: '流量(GB)',
            position: 'right',
            offset: fluxAxisOffset,
            nameGap: 12,
            scale: true,
            show: fluxOn,
            axisLabel: {
                fontSize: 11,
                formatter: (val: number) =>
                    Number.isFinite(val)
                        ? val.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
                        : '--',
            },
        },
        {
            type: 'value',
            name: '喜欢',
            position: 'right',
            offset: likeAxisOffset,
            nameGap: 12,
            scale: true,
            show: likeOn,
            axisLabel: { fontSize: 11 },
        },
        {
            type: 'value',
            name: '收藏',
            position: 'right',
            offset: faveAxisOffset,
            nameGap: 12,
            scale: true,
            show: faveOn,
            axisLabel: { fontSize: 11 },
        },
    ]
}

function onHourly24TrendChartResize() {
    hourly24TrendChartInst?.resize()
}

function disposeHourly24TrendChart() {
    if (hourly24TrendChartInst) {
        hourly24TrendChartInst.off('legendselectchanged')
        hourly24TrendChartInst.dispose()
        hourly24TrendChartInst = null
    }
    if (hourly24TrendChartResizeBound) {
        window.removeEventListener('resize', onHourly24TrendChartResize)
        hourly24TrendChartResizeBound = false
    }
    hourly24TrendChartLegendBound = false
}

function syncHourly24ChartAxesVisibility(selected: Record<string, boolean>) {
    if (!hourly24TrendChartInst) return
    const merged = mergeHourly24LegendSelected(selected)
    hourly24TrendChartInst.setOption(
        {
            grid: {
                left: hourly24ChartGridLeft(merged),
                right: hourly24ChartGridRight(merged),
            },
            yAxis: buildHourly24YAxes(merged),
        },
        false,
    )
}

function bindHourly24ChartLegendSync() {
    if (!hourly24TrendChartInst || hourly24TrendChartLegendBound) return
    hourly24TrendChartLegendBound = true
    hourly24TrendChartInst.on('legendselectchanged', (e: { selected?: Record<string, boolean> }) => {
        syncHourly24ChartAxesVisibility(e.selected ?? {})
    })
}

function buildHourly24TrendChartOption(
    legendSelected?: Record<string, boolean>,
): EChartsOption {
    const selected = mergeHourly24LegendSelected(legendSelected)
    const { categories, playsData, fluxData, likesData, faveData } = buildHourly24MergedChartSeries()
    const n = categories.length
    const rotate = n > 14 ? 28 : 0
    const series: EChartsOption['series'] = [
        {
            name: '播放次数',
            type: 'line',
            yAxisIndex: 0,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            data: playsData,
            lineStyle: { color: '#0ea5e9', width: 2 },
            itemStyle: { color: '#0ea5e9' },
        },
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
            name: '喜欢',
            type: 'line',
            yAxisIndex: 2,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            data: likesData,
            lineStyle: { color: '#059669', width: 2 },
            itemStyle: { color: '#059669' },
        },
        {
            name: '收藏',
            type: 'line',
            yAxisIndex: 3,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            data: faveData,
            lineStyle: { color: '#7c3aed', width: 2 },
            itemStyle: { color: '#7c3aed' },
        },
    ]
    return {
        animation: true,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            formatter(params: unknown) {
                const arr = Array.isArray(params) ? params : []
                if (!arr.length) return ''
                const idx = Number((arr[0] as { dataIndex?: number }).dataIndex ?? 0)
                const day = categories[idx] ?? ''
                const lines = [day]
                for (const p of arr) {
                    const item = p as { seriesName?: string; value?: number }
                    const sn = item.seriesName ?? ''
                    const v = Number(item.value ?? 0)
                    if (sn === '播放次数' || sn === '喜欢' || sn === '收藏') lines.push(`${sn}：${formatCount(v)}`)
                    else if (sn === '播放流量') lines.push(`${sn}：${formatHourly24TrafficDetailGb(v)}`)
                }
                return lines.join('<br/>')
            },
        },
        legend: {
            data: ['播放次数', '播放流量', '喜欢', '收藏'],
            top: 0,
            selected,
        },
        grid: {
            left: hourly24ChartGridLeft(selected),
            right: hourly24ChartGridRight(selected),
            top: 44,
            bottom: rotate ? 56 : 44,
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            name: '时段',
            nameLocation: 'middle',
            nameGap: rotate ? 40 : 30,
            data: categories,
            axisLabel: { rotate, fontSize: 11 },
        } as EChartsOption['xAxis'],
        yAxis: buildHourly24YAxes(selected),
        series,
    }
}

async function waitForHourly24ChartEl(): Promise<HTMLElement | null> {
    for (let i = 0; i < 12; i++) {
        await nextTick()
        const el = hourly24TrendChartRef.value
        if (el) return el
        await new Promise<void>((r) => requestAnimationFrame(() => r()))
    }
    return hourly24TrendChartRef.value
}

async function refreshHourly24TrendChart() {
    if (mainTab.value !== 'hourly24') {
        disposeHourly24TrendChart()
        return
    }
    if (hourly24DramaRows.value.length === 0 && hourly24TrafficList.value.length === 0) {
        disposeHourly24TrendChart()
        return
    }
    const el = await waitForHourly24ChartEl()
    if (!el || mainTab.value !== 'hourly24') {
        disposeHourly24TrendChart()
        return
    }
    if (hourly24TrendChartInst && hourly24TrendChartInst.getDom() !== el) {
        disposeHourly24TrendChart()
    }
    if (!hourly24TrendChartInst) {
        hourly24TrendChartInst = echarts.init(el, undefined, {
            renderer: 'canvas',
        })
        window.addEventListener('resize', onHourly24TrendChartResize)
        hourly24TrendChartResizeBound = true
    }
    bindHourly24ChartLegendSync()
    hourly24TrendChartInst.setOption(buildHourly24TrendChartOption(), true)
    hourly24TrendChartInst.resize()
    requestAnimationFrame(() => hourly24TrendChartInst?.resize())
}

function onListAppPkgChange(v: unknown) {
    if (v === null || v === undefined) {
        searchForm.appPkg = ''
    }
}

function onHourly24PkgChange(v: unknown) {
    if (v === null || v === undefined) {
        hourly24PkgName.value = ''
    }
}

async function loadHourly24Stats() {
    const end = floorDateToHour(new Date())
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
    hourly24RangeDisplay.value = `${formatHourly24RangeLabel(start)} ~ ${formatHourly24RangeLabel(end)}`
    const startTime = formatToIsoWithOffset(start)
    const endTime = formatToIsoWithOffset(end)
    const pkg = String(hourly24PkgName.value ?? '').trim()
    hourly24Loading.value = true
    disposeHourly24TrendChart()
    try {
        const [dramaRes, trafficRes] = await Promise.all([
            postDramaUserActionStatsIncr(pkg ? { pkgName: pkg } : undefined),
            getAppTrafficDetail({
                appPkg: pkg,
                startTime,
                endTime,
                dataInterval: 60,
            }),
        ])
        const dramaBody: any = dramaRes?.data ?? {}
        const dramaOk = Number(dramaBody?.code) === 200
        const rows = dramaOk && Array.isArray(dramaBody.data) ? dramaBody.data : []
        hourly24DramaRows.value = rows as DramaUserActionStatsIncrRow[]

        const trafficWrap: any = trafficRes?.data?.data ?? trafficRes?.data ?? {}
        const tList = trafficWrap?.dataList
        hourly24TrafficList.value = Array.isArray(tList)
            ? tList.map((x: any) => ({
                  time: String(x?.time ?? ''),
                  value: parseTrafficPointNumeric(x?.value),
              }))
            : []
        hourly24TrafficTotalRaw.value = trafficWrap?.totalFlux ?? null

        if (!dramaOk && dramaBody?.message) {
            ElMessage.warning(String(dramaBody.message))
        }
        hourly24CurrentPage.value = 1
        await nextTick()
        await refreshHourly24TrendChart()
    } catch (e: any) {
        hourly24DramaRows.value = []
        hourly24TrafficList.value = []
        hourly24TrafficTotalRaw.value = null
        hourly24CurrentPage.value = 1
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '24 小时数据加载失败')
        await nextTick()
        disposeHourly24TrendChart()
    } finally {
        hourly24Loading.value = false
    }
}

function handleHourly24PageSizeChange() {
    hourly24CurrentPage.value = 1
}

function handleHourly24CurrentChange() {
    /* 前端分页，仅表格切片 */
}

/** 按日期聚合（同日多条则累加） */
function buildDailyVideoChartSeriesFromRecords(rows: DramaStatsDailyRecord[]) {
    const agg = new Map<
        string,
        { playTimes: number; ownerPlayTimes: number; flux: number; likes: number; fave: number }
    >()
    for (const r of rows) {
        const d = String(r?.date ?? '').trim()
        if (!d) continue
        const cur = agg.get(d) ?? { playTimes: 0, ownerPlayTimes: 0, flux: 0, likes: 0, fave: 0 }
        cur.playTimes += Number(r?.playTimes ?? 0)
        cur.ownerPlayTimes += Number(r?.ownerPlayTimes ?? 0)
        cur.flux += Number(r?.flux ?? 0)
        cur.likes += Number(r?.likes ?? 0)
        cur.fave += Number(r?.fave ?? 0)
        agg.set(d, cur)
    }
    const categories = [...agg.keys()].sort((a, b) => a.localeCompare(b))
    const playData = categories.map((k) => agg.get(k)!.playTimes)
    const ownerPlayData = categories.map((k) => agg.get(k)!.ownerPlayTimes)
    const fluxData = categories.map((k) => agg.get(k)!.flux)
    const likesData = categories.map((k) => agg.get(k)!.likes)
    const faveData = categories.map((k) => agg.get(k)!.fave)
    return { categories, playData, ownerPlayData, fluxData, likesData, faveData }
}

function buildDailyVideoTrendChartOption(
    legendSelected?: Record<string, boolean>,
): EChartsOption {
    const showTxPlay = dailyVideoOptionalTableColumnKeys.value.includes('txPlayCount')
    const selected = mergeDailyVideoLegendSelected(showTxPlay, legendSelected)
    const { categories, playData, ownerPlayData, fluxData, likesData, faveData } =
        buildDailyVideoChartSeriesFromRecords(dailyVideoChartRecords.value)
    const n = categories.length
    const rotate = n > 12 ? 28 : 0

    const legendData: string[] = ['播放次数', '播放流量', '喜欢', '收藏']
    if (showTxPlay) legendData.splice(1, 0, 'TX播放次数')

    const legendSelectedForChart: Record<string, boolean> = {}
    for (const name of legendData) {
        legendSelectedForChart[name] = isDailyVideoLegendSeriesOn(selected, name, showTxPlay)
    }

    const leftAxisName = showTxPlay ? '次数' : '播放次数'

    const series: EChartsOption['series'] = [
        {
            name: '播放次数',
            type: 'line',
            yAxisIndex: 0,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            data: ownerPlayData,
            lineStyle: {
                color: '#0ea5e9',
                width: 2,
                type: showTxPlay ? 'dashed' : 'solid',
            },
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
            data: playData,
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
            name: '喜欢',
            type: 'line',
            yAxisIndex: 2,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            data: likesData,
            lineStyle: { color: '#059669', width: 2 },
            itemStyle: { color: '#059669' },
        },
        {
            name: '收藏',
            type: 'line',
            yAxisIndex: 3,
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            data: faveData,
            lineStyle: { color: '#7c3aed', width: 2 },
            itemStyle: { color: '#7c3aed' },
        },
    )

    return {
        animation: true,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            formatter(params: unknown) {
                const arr = Array.isArray(params) ? params : []
                if (!arr.length) return ''
                const idx = Number((arr[0] as { dataIndex?: number }).dataIndex ?? 0)
                const day = categories[idx] ?? ''
                const lines = [day]
                for (const p of arr) {
                    const item = p as { seriesName?: string; value?: number }
                    const sn = item.seriesName ?? ''
                    const v = Number(item.value ?? 0)
                    if (sn === 'TX播放次数' || sn === '播放次数') lines.push(`${sn}：${formatCount(v)}`)
                    else if (sn === '播放流量') lines.push(`${sn}：${formatTraffic(v)}`)
                    else if (sn === '喜欢') lines.push(`${sn}：${formatCount(v)}`)
                    else if (sn === '收藏') lines.push(`${sn}：${formatCount(v)}`)
                }
                return lines.join('<br/>')
            },
        },
        legend: {
            data: legendData,
            top: 0,
            selected: legendSelectedForChart,
        },
        grid: {
            left: dailyVideoChartGridLeft(selected, showTxPlay),
            right: dailyVideoChartGridRight(selected, showTxPlay),
            top: 44,
            bottom: rotate ? 56 : 44,
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            name: '日期',
            nameLocation: 'middle',
            nameGap: rotate ? 40 : 30,
            data: categories,
            axisLabel: { rotate, fontSize: 11 },
        } as EChartsOption['xAxis'],
        yAxis: buildDailyVideoYAxes(selected, showTxPlay, leftAxisName),
        series,
    }
}

/** 有数据时等待 v-else 图表容器挂载（避免 setOption 跑到已销毁的 DOM 上） */
async function waitForDailyVideoChartEl(): Promise<HTMLElement | null> {
    for (let i = 0; i < 12; i++) {
        await nextTick()
        const el = dailyVideoTrendChartRef.value
        if (el) return el
        await new Promise<void>((r) => requestAnimationFrame(() => r()))
    }
    return dailyVideoTrendChartRef.value
}

async function refreshDailyVideoTrendChart() {
    if (mainTab.value !== 'dailyVideo') {
        disposeDailyVideoTrendChart()
        return
    }
    if (dailyVideoChartRecords.value.length === 0) {
        disposeDailyVideoTrendChart()
        return
    }
    const el = await waitForDailyVideoChartEl()
    if (!el || mainTab.value !== 'dailyVideo') {
        return
    }
    /** 容器被 v-if 切换重建后，旧实例必须丢弃再 init，否则画布不在当前 DOM 上 */
    if (dailyVideoTrendChartInst && dailyVideoTrendChartInst.getDom() !== el) {
        disposeDailyVideoTrendChart()
    }
    if (!dailyVideoTrendChartInst) {
        dailyVideoTrendChartInst = echarts.init(el, undefined, {
            renderer: 'canvas',
        })
        window.addEventListener('resize', onDailyVideoTrendChartResize)
        dailyVideoTrendChartResizeBound = true
    }
    bindDailyVideoChartLegendSync()
    dailyVideoTrendChartInst.setOption(buildDailyVideoTrendChartOption(), true)
    dailyVideoTrendChartInst.resize()
    requestAnimationFrame(() => dailyVideoTrendChartInst?.resize())
}

/** 按当前日期范围拉全量日数据供折线图（与表格分页独立） */
async function loadDailyVideoChartFullRange(startDate: string, endDate: string, total: number) {
    /** 先释放实例再清空数据，否则 v-else 卸载 DOM 后仍持有旧 canvas，setOption 无效 */
    disposeDailyVideoTrendChart()
    dailyVideoChartRecords.value = []
    if (!startDate || !endDate || total <= 0) {
        await refreshDailyVideoTrendChart()
        return
    }
    const size = Math.min(Math.max(total, 1), 2000)
    try {
        const res: any = await getDramaStatsDailyPage({
            current: 1,
            size,
            startDate,
            endDate,
        })
        const body = res?.data ?? res
        if (Number(body?.code) !== 200) {
            await refreshDailyVideoTrendChart()
            return
        }
        const records = body?.data?.records ?? []
        dailyVideoChartRecords.value = Array.isArray(records) ? records : []
    } catch {
        dailyVideoChartRecords.value = []
    }
    await refreshDailyVideoTrendChart()
}

/** 上次「播放次数 Top100」查询成功时使用的 dataType；总览时不展示 App/域名列，改筛选项后需再点查询才更新 */
const topPlayTableDataType = ref<string>('overview')
/** 上次「播放流量 Top100」查询成功时使用的 dataType */
const topFluxTableDataType = ref<string>('overview')

/** Top100「播放次数」Tab 当前选中的日期字符串（去空格），供请求与校验使用。 */
const top100PlayDate = computed(() => String(top100PlayForm.pickerDate ?? '').trim())
/** Top100「播放流量」Tab 当前选中的日期字符串。 */
const top100FluxDate = computed(() => String(top100FluxForm.pickerDate ?? '').trim())

/** Top100「数据范围」下拉聚焦时确保已拉取 App 注册列表，供选择包名。 */
function onTop100AppSelectFocus() {
    void loadPlayStatAppOptions()
}

/**
 * 播放统计列表搜索「日期范围」：可选区间为最近 60 天至昨天（与 Top100 单日一致：不含今天、不含 60 天之前）。
 * @param date 日历上的某一天
 * @returns true 表示该日不可选
 */
function disableSearchDateRangeDate(date: Date) {
    const target = new Date(date)
    target.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const earliest = new Date(today)
    earliest.setDate(earliest.getDate() - 60)
    earliest.setHours(0, 0, 0, 0)
    return target.getTime() >= today.getTime() || target.getTime() < earliest.getTime()
}

/**
 * Top100 日期选择器：`el-date-picker` 的 `disabled-date`。
 * 禁止选择今天及未来；最早可选为今天往前 60 天（与业务「只看历史统计」一致）。
 * @param date 日历上的某一天
 * @returns true 表示该日不可选
 */
function disableTodayAndFuture(date: Date) {
    const target = new Date(date)
    target.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const earliest = new Date(today)
    earliest.setDate(earliest.getDate() - 60)
    earliest.setHours(0, 0, 0, 0)
    // 可选范围： [今天-60天, 昨天]
    return target.getTime() >= today.getTime() || target.getTime() < earliest.getTime()
}

/**
 * 中间插入 `...` 的截断展示（仍用于部分列如 vid、日期等紧凑展示）。
 * @param s 原始字符串
 * @param maxLen 展示最大字符数（含省略号占用）
 */
function truncateMiddle(s: string, maxLen: number) {
    if (!s || s.length <= maxLen) return s
    const ellipsis = '...'
    if (maxLen <= ellipsis.length) return s.slice(0, maxLen)
    const avail = maxLen - ellipsis.length
    const leftLen = Math.ceil(avail / 2)
    const rightLen = Math.floor(avail / 2)
    return `${s.slice(0, leftLen)}${ellipsis}${s.slice(-rightLen)}`
}

/**
 * 判断经 {@link truncateMiddle} 后是否与原文不同（用于控制 tooltip：无截断则不弹层）。
 */
function isMiddleTruncated(raw: string, maxLen: number): boolean {
    const s = String(raw ?? '')
    if (!s) return false
    return truncateMiddle(s, maxLen) !== s
}

/**
 * Top100 行展示的「剧名」：接口常只给 `title`，已映射到 `originTitle`；无则回退 `onlineTitle`。
 */
function top100DramaTitle(row: PlayStatRow): string {
    return row.originTitle || row.onlineTitle
}

/** 配音/字幕仅展示编码（接口：subtitleLanguageCode 配音，languageCode 字幕），如 zh/en */
function formatSubtitleDubCode(row: PlayStatRow): string {
    const dub = String(row.subtitleLanguageCode ?? '').trim()
    const sub = String(row.languageCode ?? '').trim()
    if (!dub && !sub) return '--'
    return `${dub || '--'}/${sub || '--'}`
}

/**
 * 写入剪贴板并提示；用于表格内复制按钮。
 * @param text 待复制内容
 * @param label 业务名称（用于提示文案，如「vid」「域名」）
 */
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

/** 加载字幕语言下拉：`getSupportLanguagePage`，失败时置空选项。 */
async function loadLanguageOptions() {
    if (languageOptionsLoading.value) return
    languageOptionsLoading.value = true
    try {
        const res: any = await getSupportLanguagePage({ current: 1, size: 500 })
        const data = res?.data?.data ?? res?.data
        const records = data?.records ?? []
        languageOptions.value = records
            .map((record: { languageCode?: string; languageName?: string }) => ({
                languageCode: record.languageCode ?? '',
                languageName: record.languageName ?? record.languageCode ?? '',
                label: `${record.languageName ?? record.languageCode ?? ''} (${record.languageCode ?? ''})`,
            }))
            .filter((language: { languageCode: string }) => !!language.languageCode)
    } catch {
        languageOptions.value = []
    } finally {
        languageOptionsLoading.value = false
    }
}

/**
 * 从 Top100 接口响应中取出数组形态的记录列表（兼容 `data` / `data.records` / `data.list`）。
 * @param res axios 响应或已解包 body
 */
function extractTop100Records(res: any): any[] {
    const body = res?.data ?? res
    const data = body?.data
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.records)) return data.records
    if (Array.isArray(data?.list)) return data.list
    return []
}

/** 跳转该剧播放明细（按列表所选单日或行内日期）。 */
function openPlayStatDetail(row: PlayStatRow) {
    if (!canViewPlayStatList.value) {
        ElMessage.warning('暂无播放统计详情权限')
        return
    }
    const vid = String(row.vid ?? '').trim()
    if (!vid) {
        ElMessage.warning('vid 为空，无法查看详情')
        return
    }
    const [rangeStart, rangeEnd] = Array.isArray(searchForm.dateRange) ? searchForm.dateRange : []
    const rs = String(rangeStart ?? '').trim()
    const re = String(rangeEnd ?? '').trim()
    const y = getYesterdayYmd()
    const startTime = rs || y
    const endTime = (re || rs || y)
    persistPlayStatListStateForDetailReturn()
    router.push({
        name: getPlayStatDetailRouteName(route.path),
        params: { vid },
        query: {
            startTime,
            endTime,
            onlineTitle: row.onlineTitle || '',
            originTitle: row.originTitle || '',
            totalPlayCount: String(Number(row.playCount ?? 0)),
            totalOwnerPlayCount: String(Number(row.ownerPlayTimes ?? 0)),
            totalPlayTraffic: String(Number(row.playTraffic ?? 0)),
            ...(row.dramaCount != null && Number.isFinite(row.dramaCount)
                ? { dramaCount: String(row.dramaCount) }
                : {}),
        },
    })
}

/**
 * 加载「播放统计列表」分页数据：`getDramaPlayStatisticsPage`。
 */
async function loadList() {
    loading.value = true
    try {
        const [startTimeRaw, endTimeRaw] = Array.isArray(searchForm.dateRange)
            ? searchForm.dateRange
            : []
        const startTime = String(startTimeRaw ?? '').trim() || undefined
        const endTime = String(endTimeRaw ?? '').trim() || undefined
        const title = String(searchForm.title ?? '').trim()
        const languageCode = String(searchForm.languageCode ?? '').trim()
        const copyrightCode = String(searchForm.copyrightCode ?? '').trim()
        const vid = String(searchForm.vid ?? '').trim()
        const appPkg = String(searchForm.appPkg ?? '').trim()
        const res: any = await getDramaPlayStatisticsPage({
            current: currentPage.value,
            size: pageSize.value,
            startTime,
            endTime,
            vid: vid || undefined,
            title: title || undefined,
            languageCode: languageCode || undefined,
            copyrightCode: copyrightCode || undefined,
            appPkg,
            sortType: searchForm.sortType,
        })
        const body = res?.data ?? res
        const data = body?.data ?? {}
        const records = data?.records ?? data?.list ?? []
        list.value = Array.isArray(records) ? records.map(normalizePlayStatRow) : []
        total.value = Number(data?.total ?? list.value.length ?? 0)
        const rawTimes = data?.totalPlayTimes
        const rawOwnerTimes = data?.totalOwnerPlayTimes
        const rawFlux = data?.totalFlux
        const nTimes = Number(rawTimes)
        const nOwnerTimes = Number(rawOwnerTimes)
        const nFlux = Number(rawFlux)
        listAggregateTotalPlayTimes.value =
            rawTimes != null && rawTimes !== '' && Number.isFinite(nTimes) ? nTimes : null
        listAggregateTotalOwnerPlayTimes.value =
            rawOwnerTimes != null && rawOwnerTimes !== '' && Number.isFinite(nOwnerTimes)
                ? nOwnerTimes
                : null
        listAggregateTotalFlux.value =
            rawFlux != null && rawFlux !== '' && Number.isFinite(nFlux) ? nFlux : null
    } catch (e: any) {
        list.value = []
        total.value = 0
        listAggregateTotalPlayTimes.value = null
        listAggregateTotalOwnerPlayTimes.value = null
        listAggregateTotalFlux.value = null
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '播放统计列表加载失败')
    } finally {
        loading.value = false
    }
}

/**
 * 加载「播放次数 Top100」：`POST /api/vodPlayDailyInfo/top100`，`type=0`。
 * 成功时更新列表并同步 {@link topPlayTableDataType}（控制总览时隐藏 App/域名列）。
 */
async function loadTopPlay() {
    const date = top100PlayDate.value
    if (!date) {
        ElMessage.warning('请先选择日期')
        return
    }
    topPlayLoading.value = true
    try {
        const dataType = resolvePlayStatDataType(top100PlayForm.dataType)
        const res: any = await getVodPlayDailyTop100({ date, type: 0, dataType })
        const body = res?.data ?? res
        if (Number(body?.code) !== 200) {
            topPlayList.value = []
            ElMessage.warning(String(body?.message ?? 'Top100 接口返回异常'))
            return
        }
        const arr = extractTop100Records(res)
        topPlayList.value = arr.map(normalizePlayStatRow)
        topPlayTableDataType.value = dataType
    } catch {
        topPlayList.value = []
    } finally {
        topPlayLoading.value = false
    }
}

/**
 * 加载「播放流量 Top100」：同上接口，`type=1`。
 * 成功时更新 {@link topFluxTableDataType}。
 */
async function loadTopFlux() {
    const date = top100FluxDate.value
    if (!date) {
        ElMessage.warning('请先选择日期')
        return
    }
    topFluxLoading.value = true
    try {
        const dataType = resolvePlayStatDataType(top100FluxForm.dataType)
        const res: any = await getVodPlayDailyTop100({ date, type: 1, dataType })
        const body = res?.data ?? res
        if (Number(body?.code) !== 200) {
            topFluxList.value = []
            ElMessage.warning(String(body?.message ?? 'Top100 接口返回异常'))
            return
        }
        const arr = extractTop100Records(res)
        topFluxList.value = arr.map(normalizePlayStatRow)
        topFluxTableDataType.value = dataType
    } catch {
        topFluxList.value = []
    } finally {
        topFluxLoading.value = false
    }
}

/** 用户点击「查询」：重置到第 1 页并拉取列表。 */
function handleSearch() {
    currentPage.value = 1
    void loadList()
}

/** 用户点击「重置」：清空筛选、恢复进入页时的默认排序与昨日区间并重新加载列表。 */
function handleReset() {
    searchForm.languageCode = ''
    searchForm.vid = ''
    searchForm.title = ''
    searchForm.copyrightCode = ''
    searchForm.appPkg = ''
    const y = getYesterdayYmd()
    searchForm.dateRange = [y, y]
    searchForm.sortType = 0
    currentPage.value = 1
    pageSize.value = 10
    void loadList()
}

/** 分页「每页条数」变化：回到第 1 页再请求列表。 */
function handlePageSizeChange() {
    currentPage.value = 1
    void loadList()
}

/** 分页「当前页」变化：按新页码请求列表。 */
function handleCurrentChange() {
    void loadList()
}

function clearDailyVideoAggregates() {
    dailyVideoAggregateTotalPlayTimes.value = null
    dailyVideoAggregateTotalOwnerPlayTimes.value = null
    dailyVideoAggregateTotalFlux.value = null
    dailyVideoAggregateTotalLike.value = null
    dailyVideoAggregateTotalFave.value = null
}

/** 从概览分页接口 `data` 解析汇总字段（与播放统计列表 totalPlayTimes / totalFlux 一致） */
function assignDailyVideoAggregatesFromData(data: Record<string, unknown>) {
    const rawT = data?.totalPlayTimes
    const rawOwner = data?.totalOwnerPlayTimes
    const rawF = data?.totalFlux
    const rawL = data?.totalLike
    const rawFv = data?.totalFave
    const nT = Number(rawT)
    const nOwner = Number(rawOwner)
    const nF = Number(rawF)
    const nL = Number(rawL)
    const nFv = Number(rawFv)
    dailyVideoAggregateTotalPlayTimes.value =
        rawT != null && rawT !== '' && Number.isFinite(nT) ? nT : null
    dailyVideoAggregateTotalOwnerPlayTimes.value =
        rawOwner != null && rawOwner !== '' && Number.isFinite(nOwner) ? nOwner : null
    dailyVideoAggregateTotalFlux.value =
        rawF != null && rawF !== '' && Number.isFinite(nF) ? nF : null
    dailyVideoAggregateTotalLike.value =
        rawL != null && rawL !== '' && Number.isFinite(nL) ? nL : null
    dailyVideoAggregateTotalFave.value =
        rawFv != null && rawFv !== '' && Number.isFinite(nFv) ? nFv : null
}

/** 每日视频数据统计分页；`refreshChart` 为 false 时仅刷新表格（翻页），不重复拉折线图全量数据 */
async function loadDailyVideoStats(opts?: { refreshChart?: boolean }) {
    const refreshChart = opts?.refreshChart !== false
    const dr = dailyVideoSearchForm.dateRange
    const startDate = Array.isArray(dr) ? String(dr[0] ?? '').trim() : ''
    const endDate = Array.isArray(dr) ? String(dr[1] ?? '').trim() : ''
    if (!startDate || !endDate) {
        ElMessage.warning('请选择开始日期与结束日期')
        clearDailyVideoAggregates()
        return
    }
    dailyVideoLoading.value = true
    try {
        const res: any = await getDramaStatsDailyPage({
            current: dailyVideoCurrentPage.value,
            size: dailyVideoPageSize.value,
            startDate,
            endDate,
        })
        const body = res?.data ?? res
        if (Number(body?.code) !== 200) {
            dailyVideoList.value = []
            dailyVideoTotal.value = 0
            dailyVideoChartRecords.value = []
            clearDailyVideoAggregates()
            if (refreshChart) await refreshDailyVideoTrendChart()
            ElMessage.error(String(body?.message ?? '每日视频数据统计加载失败'))
            return
        }
        const data = body?.data ?? {}
        const records = data?.records ?? []
        dailyVideoList.value = Array.isArray(records) ? records : []
        dailyVideoTotal.value = Number(data?.total ?? 0)
        assignDailyVideoAggregatesFromData(data as Record<string, unknown>)
        if (refreshChart) {
            await loadDailyVideoChartFullRange(startDate, endDate, dailyVideoTotal.value)
        }
    } catch (e: any) {
        dailyVideoList.value = []
        dailyVideoTotal.value = 0
        dailyVideoChartRecords.value = []
        clearDailyVideoAggregates()
        if (refreshChart) await refreshDailyVideoTrendChart()
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '每日视频数据统计加载失败')
    } finally {
        dailyVideoLoading.value = false
    }
}

function handleDailyVideoSearch() {
    dailyVideoCurrentPage.value = 1
    void loadDailyVideoStats()
}

function handleDailyVideoReset() {
    dailyVideoSearchForm.dateRange = [...getDefaultDailyStatsDateRange()]
    dailyVideoCurrentPage.value = 1
    dailyVideoPageSize.value = 10
    void loadDailyVideoStats()
}

function handleDailyVideoPageSizeChange() {
    dailyVideoCurrentPage.value = 1
    void loadDailyVideoStats({ refreshChart: false })
}

function handleDailyVideoCurrentChange() {
    void loadDailyVideoStats({ refreshChart: false })
}

/**
 * Tab 切换：进入列表则刷新分页数据；进入 Top100 则补默认日期并拉对应 Top100。
 * @param name `el-tabs` 的 pane name
 */
function onMainTabChange(name: string | number) {
    const tab = resolvePlayStatMainTab(String(name) as MainTab)
    if (tab !== name) return

    if (tab === 'list') {
        void loadList()
        return
    }
    if (tab === 'topPlay') {
        if (!top100PlayForm.pickerDate) top100PlayForm.pickerDate = getYesterdayYmd()
        void loadTopPlay()
        return
    }
    if (tab === 'topFlux') {
        if (!top100FluxForm.pickerDate) top100FluxForm.pickerDate = getYesterdayYmd()
        void loadTopFlux()
        return
    }
    if (tab === 'hourly24') {
        void loadHourly24Stats()
        return
    }
    if (tab === 'dailyVideo') {
        void loadDailyVideoStats()
    }
}

function loadPlayStatByMainTab() {
    const tab = resolvePlayStatMainTab(mainTab.value)
    if (tab === 'list') {
        void loadList()
        return
    }
    if (tab === 'topPlay') {
        void loadTopPlay()
        return
    }
    if (tab === 'topFlux') {
        void loadTopFlux()
        return
    }
    if (tab === 'hourly24') {
        void loadHourly24Stats()
        return
    }
    if (tab === 'dailyVideo') {
        void loadDailyVideoStats()
    }
}

/** 同步 Tab 与日期：切到 Top100 且日期为空时自动填昨天（不主动发请求，由 `onMainTabChange` 等触发加载）。 */
watch(mainTab, (t) => {
    if (t !== 'dailyVideo') {
        disposeDailyVideoTrendChart()
    }
    if (t !== 'hourly24') {
        disposeHourly24TrendChart()
    }
    if (t === 'list') return
    if (t === 'topPlay' && !top100PlayForm.pickerDate) {
        top100PlayForm.pickerDate = getYesterdayYmd()
    }
    if (t === 'topFlux' && !top100FluxForm.pickerDate) {
        top100FluxForm.pickerDate = getYesterdayYmd()
    }
})

watch(
    () => [...dailyVideoOptionalTableColumnKeys.value].sort().join(','),
    () => {
        if (mainTab.value === 'dailyVideo' && dailyVideoChartRecords.value.length > 0) {
            void refreshDailyVideoTrendChart()
        }
    },
)

/**
 * GET /api/apps/getAppList 构建应用下拉。
 * 供实时概览 / 列表 / Top100「数据范围」等筛选共用。
 */
async function loadPlayStatAppOptions() {
    if (allPlayStatAppOptions.value.length > 0) return
    playStatAppSelectLoading.value = true
    try {
        const res: any = await getAppList()
        allPlayStatAppOptions.value = mapGetAppListToSelectOptions(res)
    } catch {
        allPlayStatAppOptions.value = []
    } finally {
        playStatAppSelectLoading.value = false
    }
}

/**
 * 加载版权方下拉选项：`GET /api/copyrightSourceInfo/list`（与内容列表同源）。
 * 无权限时清空选项并跳过后端请求。
 */
async function loadCopyrightOwnerOptions() {
    if (!canListCopyrightSource.value) {
        copyrightOwnerOptions.value = []
        copyrightOwnerLoading.value = false
        return
    }
    copyrightOwnerLoading.value = true
    try {
        const res: any = await getCopyrightSourceInfoList()
        const body = res?.data ?? res
        let list: any[] = []
        if (body?.code === 200 && body.data != null) {
            list = Array.isArray(body.data) ? body.data : []
        } else if (Array.isArray(body?.data)) {
            list = body.data
        } else if (Array.isArray(body)) {
            list = body
        }
        copyrightOwnerOptions.value = list
            .map((row) => {
                const name = String(row?.copyrightName ?? '').trim()
                const code = String(row?.copyrightCode ?? '').trim()
                const value = code || name
                const label = name && code ? `${name}（${code}）` : name || code || value
                return value ? { label, value } : null
            })
            .filter(Boolean) as { label: string; value: string }[]
    } catch {
        copyrightOwnerOptions.value = []
    } finally {
        copyrightOwnerLoading.value = false
    }
}

/**
 * 页面挂载：预加载语言 / 版权方 / App 选项；初始化 Top100 日期为昨天；
 * 按当前 Tab 触发首次列表或 Top100 加载。
 */
onMounted(() => {
    void loadLanguageOptions()
    void loadCopyrightOwnerOptions()
    void loadPlayStatAppOptions()
    top100PlayForm.pickerDate = getYesterdayYmd()
    top100FluxForm.pickerDate = getYesterdayYmd()
    restorePlayStatListStateFromSession()
    loadPlayStatByMainTab()
})

/** 若路由被 KeepAlive 包裹，从详情返回时走激活钩子恢复状态 */
onActivated(() => {
    if (!restorePlayStatListStateFromSession()) return
    loadPlayStatByMainTab()
})

onUnmounted(() => {
    disposeDailyVideoTrendChart()
    disposeHourly24TrendChart()
})
</script>

<style scoped>
.play-stat-tabs {
    margin-top: 4px;
}
.drama-main-card :deep(.search-form--single-row.el-form--inline .el-form-item) {
    margin-right: 12px;
}
.play-stat-tabs :deep(.el-tabs__header) {
    margin-bottom: 12px;
}

.top100-panel {
    padding-top: 4px;
}
.top100-hint {
    margin: 0 0 12px;
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
}
.top100-form :deep(.el-form-item__label) {
    font-size: 12px;
    color: #303133;
}
.filter-date-single {
    width: 132px;
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
.play-stat-list-summary__value--daterange {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.25;
    color: #0f766e;
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
.drama-table-block :deep(.el-loading-mask) {
    z-index: 2000;
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
/** 播放统计列表：原始/上线剧名固定宽约 16 个汉字；正文相对整格居中，复制按钮不参与占位 */
.copy-cell.copy-cell--play-stat-title {
    display: block;
    position: relative;
    width: 100%;
    box-sizing: border-box;
}
.copy-cell--play-stat-title--with-copy {
    padding-right: 8px;
}
.copy-cell--play-stat-title .copy-cell__tail-main {
    width: 16em;
    max-width: 16em;
    margin-left: auto;
    margin-right: auto;
    box-sizing: border-box;
}
.copy-cell--play-stat-title--with-copy .copy-cell__tail-main {
    width: min(16em, calc(100% - 36px));
    max-width: calc(100% - 36px);
}
.copy-cell--play-stat-title .copy-cell__corner-copy {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
}
.play-stat-fileid-full {
    flex: 1;
    min-width: 0;
    word-break: break-all;
    white-space: normal;
    line-height: 1.4;
    text-align: left;
}
.copy-cell__tail-main {
    flex: 1 1 0;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
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
.play-stat-table--compact :deep(.el-table__body .el-table__cell .cell) {
    padding-left: 4px;
    padding-right: 4px;
}
.copy-text {
    max-width: 170px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
}

.filter-date-range {
    width: 300px;
}
.filter-input--vid {
    width: 132px;
}
.filter-input--file-id {
    width: 152px;
}
.filter-input--episode {
    width: 88px;
}
.filter-input--title {
    width: 132px;
}
.filter-select--language-code {
    width: 132px;
}
.filter-select--copyright {
    width: 132px;
}
.filter-select--app-pkg {
    width: 196px;
}
.filter-select--top100-scope {
    width: 180px;
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
.filter-select--sort-type {
    width: 148px;
}
.drama-main-card :deep(.filter-date-range .el-input__wrapper),
.drama-main-card :deep(.filter-date-single .el-input__wrapper) {
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

/* 每日视频统计：底部趋势折线图（与播放统计详情页风格一致） */
.daily-video-chart-wrap {
    margin-top: 48px;
    padding: 12px 16px 8px;
    background: linear-gradient(152deg, #fafcff 0%, #f5f7fc 100%);
    border: 1px solid #e2e8f4;
    border-radius: 10px;
    box-sizing: border-box;
}
.daily-video-chart {
    width: 100%;
    height: 320px;
}
.daily-video-chart-empty {
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #909399;
}
.play-stat-hourly24-search-form :deep(.el-form-item__label) {
    display: none;
}
.play-stat-hourly24-search-form__app-select :deep(.el-form-item__content) {
    margin-left: 0 !important;
}
</style>

<style>
/* Tooltip 挂载到 body */
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

