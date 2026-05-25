<template>
    <page-content :title="title" class="operation-drama-page">
        <template #bottom>
            <el-card class="drama-main-card" shadow="never">
                <input
                    ref="listCoverFileInputRef"
                    type="file"
                    class="cover-list-file-input"
                    accept=".png,.jpg,.jpeg,.webp,.gif,.bmp"
                    @change="onListCoverFileSelected"
                />
                <el-form :model="searchForm" inline class="search-form search-form--single-row">
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
                            placeholder="版权方"
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
                            v-model="searchForm.languageCode"
                            class="filter-select filter-select--language"
                            placeholder="字幕语言"
                            clearable
                            filterable
                            :loading="languageOptionsLoading"
                            @change="onSearchLanguageChange"
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
                            v-model="searchForm.dramaCategoriesCodes"
                            class="filter-select filter-select--tags"
                            placeholder="分类标签(先选字幕语言)"
                            clearable
                            multiple
                            collapse-tags
                            collapse-tags-tooltip
                            :max-collapse-tags="1"
                            :disabled="!searchForm.languageCode"
                            @visible-change="onCategoryDropdownVisible"
                        >
                            <el-option
                                v-for="opt in categoryOptions"
                                :key="opt.value"
                                :label="opt.label"
                                :value="opt.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-select
                            v-model="searchForm.dramaTagsCodes"
                            class="filter-select filter-select--tags"
                            placeholder="情节标签(先选字幕语言)"
                            clearable
                            multiple
                            collapse-tags
                            collapse-tags-tooltip
                            :max-collapse-tags="1"
                            :disabled="!searchForm.languageCode"
                            @visible-change="onPlotTagDropdownVisible"
                        >
                            <el-option
                                v-for="opt in plotTagOptions"
                                :key="opt.value"
                                :label="opt.label"
                                :value="opt.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-select
                            v-model="searchForm.status"
                            class="filter-select filter-select--status"
                            placeholder="上线状态"
                            clearable
                        >
                            <el-option
                                v-for="opt in statusOptions"
                                :key="String(opt.value)"
                                :label="opt.label"
                                :value="opt.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-select
                            v-model="searchForm.pin"
                            class="filter-select filter-select--pin"
                            placeholder="置顶状态"
                            clearable
                        >
                            <el-option label="全部" value="" />
                            <el-option label="置顶" :value="1" />
                            <el-option label="未置顶" :value="0" />
                        </el-select>
                    </el-form-item>
                    <el-form-item class="search-form__actions">
                        <el-button class="btn-query" type="primary" @click="throttledHandleSearch"
                            >查询</el-button
                        >
                        <el-button class="btn-reset" @click="throttledHandleReset">重置</el-button>
                    </el-form-item>
                    <el-form-item class="search-form__add">
                        <div class="search-form__add-btns">
                            <el-button
                                v-if="canAddDrama"
                                class="add-menu-btn"
                                type="warning"
                                :icon="Plus"
                                @click="throttledHandleAdd"
                            >
                                添加短剧
                            </el-button>
                            <el-button
                                v-if="canAddDrama"
                                class="add-menu-btn add-menu-btn--batch"
                                type="success"
                                @click="openBatchAddDialog"
                            >
                                批量添加
                            </el-button>
                        </div>
                    </el-form-item>
                </el-form>

                <div class="table-toolbar">
                    <span class="toolbar-actions">
                        <el-icon class="toolbar-icon" @click="throttledLoadList"
                            ><Refresh
                        /></el-icon>
                    </span>
                    <!-- 列选择下拉面板 -->
                    <el-dropdown trigger="click">
                    <!-- 列设置按钮（放在 table 上面） -->
                     <el-icon class="toolbar-icon"  @click="columnSettingVisible = !columnSettingVisible"
                            ><Setting
                        /></el-icon>
                    <template #dropdown>
                        <el-dropdown-menu class="table-column-setting">
                        <div style="width: 180px; padding: 10px; max-height: 350px; overflow-y: auto;">
                            <el-checkbox-group v-model="showColumnKeys">
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <el-checkbox value="vid">vid</el-checkbox>
                                <el-checkbox value="title">原始剧名</el-checkbox>
                                <el-checkbox value="titleLanguage">上线剧名</el-checkbox>
                                <el-checkbox value="coverImg">封面图</el-checkbox>
                                <el-checkbox value="dramaCategories">类型标签</el-checkbox>
                                <el-checkbox value="plotTags">情节标签</el-checkbox>
                                <el-checkbox value="languageName">配音/字幕</el-checkbox>
                                <el-checkbox value="dramaCount">剧集数</el-checkbox>
                                <el-checkbox value="totalLikesCount">点赞</el-checkbox>
                                <el-checkbox value="totalCollectCount">收藏</el-checkbox>
                                <el-checkbox value="totalPlayCount">播放</el-checkbox>
                                <el-checkbox value="copyrightSourceInfo">版权方</el-checkbox>
                                <el-checkbox value="status">状态</el-checkbox>
                                <el-checkbox value="action">操作</el-checkbox>
                                <el-checkbox value="contentRating">内容等级</el-checkbox>
                                <el-checkbox value="createdAt">创建时间</el-checkbox>
                                <el-checkbox value="sex">性别</el-checkbox>
                                <el-checkbox value="popularityScore">热度值</el-checkbox>
                                <el-checkbox value="pin">置顶状态</el-checkbox>
                            </div>
                            </el-checkbox-group>
                        </div>
                        </el-dropdown-menu>
                    </template>
                    </el-dropdown>
                </div>

                <div class="drama-table-block" v-loading="loading">

                    <el-table
                        class="drama-op-table"
                        :data="tableData"
                        style="width: 100%"
                        :scrollbar-always-on="true"
                        :default-sort="
                            sortProp && sortOrder ? { prop: sortProp, order: sortOrder } : undefined
                        "
                        @sort-change="handleSortChange"
                    >
                        <!-- vid -->
                        <el-table-column
                            label="vid"
                            min-width="100"
                            align="center"
                            v-if="showColumnKeys.includes('vid')"
                        >
                            <template #default="{ row }">
                                <div class="copy-cell copy-cell--center copy-cell--tight">
                                    <el-tooltip
                                        :content="String(row.vid ?? '')"
                                        placement="top"
                                        :show-after="200"
                                        popper-class="drama-content-title-tooltip"
                                        :disabled="!String(row.vid ?? '').trim() || !isTitleMiddleTruncated(String(row.vid), 10)"
                                    >
                                        <span class="drama-title-mid-ellipsis">{{
                                            truncateMiddleTitle(String(row.vid ?? '').trim() || '—', 10)
                                        }}</span>
                                    </el-tooltip>
                                    <el-button
                                        v-if="String(row.vid ?? '').trim()"
                                        type="primary"
                                        link
                                        size="small"
                                        :icon="CopyDocument"
                                        class="drama-table-copy-btn"
                                        @click.stop="copyCellText(row.vid, 'vid')"
                                    />
                                </div>
                            </template>
                        </el-table-column>
                        <!-- 原始剧名：尾部 ... 省略，悬停看全文 -->
                        <el-table-column
                            label="原始剧名"
                            min-width="128"
                            align="center"
                            v-if="showColumnKeys.includes('title')"
                        >
                            <template #default="{ row }">
                                <div class="copy-cell copy-cell--center copy-cell--tight copy-cell--title-col">
                                    <div class="copy-cell__title-main">
                                        <el-tooltip
                                            :content="row.title"
                                            placement="top"
                                            :show-after="200"
                                            popper-class="drama-content-title-tooltip"
                                            :disabled="!row.title"
                                        >
                                            <div class="copy-cell__title-trigger">
                                                <span class="drama-title-tail-ellipsis">{{
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
                                        class="drama-table-copy-btn"
                                        @click.stop="copyCellText(row.title, '原始剧名')"
                                    />
                                </div>
                            </template>
                        </el-table-column>

                        <!-- 上线剧名：尾部 ... 省略，悬停看全文 -->
                        <el-table-column
                            label="上线剧名"
                            min-width="128"
                            align="center"
                            v-if="showColumnKeys.includes('titleLanguage')"
                        >
                            <template #default="{ row }">
                                <div class="copy-cell copy-cell--center copy-cell--tight copy-cell--title-col">
                                    <div class="copy-cell__title-main">
                                        <el-tooltip
                                            :content="row.titleLanguage"
                                            placement="top"
                                            :show-after="200"
                                            popper-class="drama-content-title-tooltip"
                                            :disabled="!row.titleLanguage"
                                        >
                                            <div class="copy-cell__title-trigger">
                                                <span class="drama-title-tail-ellipsis">{{
                                                    row.titleLanguage || '—'
                                                }}</span>
                                            </div>
                                        </el-tooltip>
                                    </div>
                                    <el-button
                                        v-if="row.titleLanguage"
                                        type="primary"
                                        link
                                        size="small"
                                        :icon="CopyDocument"
                                        class="drama-table-copy-btn"
                                        @click.stop="copyCellText(row.titleLanguage, '上线剧名')"
                                    />
                                </div>
                            </template>
                        </el-table-column>

                        <!-- 封面图（悬停预览大图） -->
                        <el-table-column
                            label="封面图"
                            width="90"
                            align="center"
                            v-if="showColumnKeys.includes('coverImg')"
                        >
                            <template #default="{ row }">
                                <div class="cover-cell">
                                    <template v-if="coverImageSrc(row.coverImg)">
                                        <el-popover
                                            placement="right-start"
                                            trigger="hover"
                                            width="auto"
                                        >
                                            <template #reference>
                                                <el-image
                                                    class="cover"
                                                    :src="coverImageSrc(row.coverImg)"
                                                    fit="cover"
                                                >
                                                    <template #error>
                                                        <div class="cover--error">无图</div>
                                                    </template>
                                                </el-image>
                                            </template>
                                            <div class="cover-preview-wrap">
                                                <el-image
                                                    v-if="coverImageSrc(row.coverImg)"
                                                    class="cover-preview"
                                                    :src="coverImageSrc(row.coverImg)"
                                                    fit="cover"
                                                />
                                                <div v-else class="cover-preview--empty">
                                                    暂无封面
                                                </div>
                                            </div>
                                        </el-popover>
                                    </template>
                                    <template v-else>
                                        <div
                                            v-if="canEditDrama"
                                            class="cover-upload-placeholder"
                                            :class="{
                                                'cover-upload-placeholder--busy':
                                                    coverListUploadingId === row.id,
                                            }"
                                            title="上传封面"
                                            @click.stop="triggerListCoverUpload(row)"
                                        >
                                            <el-icon
                                                v-if="coverListUploadingId === row.id"
                                                class="cover-upload-placeholder__icon is-loading"
                                            >
                                                <Loading />
                                            </el-icon>
                                            <span v-else class="cover-upload-placeholder__text"
                                                >上传</span
                                            >
                                        </div>
                                        <div v-else class="cover--error">无图</div>
                                    </template>
                                </div>
                            </template>
                        </el-table-column>

                        <!-- 类型（类型标签）：单行省略，悬停看全部 -->
                        <el-table-column
                            label="类型标签"
                            min-width="120"
                            align="center"
                            v-if="showColumnKeys.includes('dramaCategories')"
                        >
                            <template #default="{ row }">
                                <div v-if="tagsLineText(row.dramaCategories)" class="tag-line-cell">
                                    <el-tooltip
                                        :content="tagsLineText(row.dramaCategories)"
                                        placement="top"
                                    >
                                        <span
                                            class="tag-line-ellipsis tag-line-ellipsis--primary"
                                            >{{ tagsLineText(row.dramaCategories) }}</span
                                        >
                                    </el-tooltip>
                                </div>
                                <span v-else class="tag-empty">—</span>
                            </template>
                        </el-table-column>

                        <!-- 情节标签：单行省略，悬停看全部 -->
                        <el-table-column
                            label="情节标签"
                            min-width="120"
                            align="center"
                            v-if="showColumnKeys.includes('plotTags')"
                        >
                            <template #default="{ row }">
                                <div v-if="tagsLineText(row.plotTags)" class="tag-line-cell">
                                    <el-tooltip
                                        :content="tagsLineText(row.plotTags)"
                                        placement="top"
                                    >
                                        <span
                                            class="tag-line-ellipsis tag-line-ellipsis--warning"
                                            >{{ tagsLineText(row.plotTags) }}</span
                                        >
                                    </el-tooltip>
                                </div>
                                <span v-else class="tag-empty">—</span>
                            </template>
                        </el-table-column>

                        <!-- 配音 / 字幕：单行省略，悬停看全部（无表头排序） -->
                        <el-table-column
                            label="配音/字幕"
                            min-width="108"
                            align="center"
                            prop="languageName"
                            v-if="showColumnKeys.includes('languageName')"
                        >
                            <template #default="{ row }">
                                <div v-if="dubSubtitleLineText(row)" class="tag-line-cell">
                                    <el-tooltip :content="dubSubtitleLineText(row)" placement="top">
                                        <span class="dub-sub-ellipsis">{{
                                            dubSubtitleLineText(row)
                                        }}</span>
                                    </el-tooltip>
                                </div>
                                <span v-else class="tag-empty">—</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="性别" width="70" align="center"  v-if="showColumnKeys.includes('sex')">
                            <template #default="{ row }">
                                {{ row.sex === 0 ? '全部' : row.sex === 1 ? '男频': row.sex === 2 ? '女频' : '--' }}
                            </template>
                        </el-table-column>
                        <el-table-column
                            prop="dramaCount"
                            label="剧集数"
                            min-width="92"
                            align="center"
                            sortable="custom"
                            v-if="showColumnKeys.includes('dramaCount')"
                        >
                            <template #default="{ row }">
                                <el-tooltip
                                    v-if="episodeProgressTooltip(row)"
                                    :content="episodeProgressTooltip(row)"
                                    placement="top"
                                >
                                    <span
                                        class="episode-ratio"
                                        :class="{
                                            'episode-ratio--processing':
                                                isEpisodeRatioProcessing(row),
                                        }"
                                    >
                                        {{ formatDramaEpisodeRatio(row) }}
                                    </span>
                                </el-tooltip>
                                <span
                                    v-else
                                    class="episode-ratio"
                                    :class="{
                                        'episode-ratio--processing': isEpisodeRatioProcessing(row),
                                    }"
                                >
                                    {{ formatDramaEpisodeRatio(row) }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column
                            prop="totalLikesCount"
                            label="点赞"
                            width="76"
                            align="center"
                            sortable="custom"
                            v-if="showColumnKeys.includes('totalLikesCount')"
                        >
                            <template #default="{ row }">
                                <span>{{
                                    typeof row.totalLikesCount === 'number'
                                        ? row.totalLikesCount
                                        : '--'
                                }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column
                            prop="totalCollectCount"
                            label="收藏"
                            width="76"
                            align="center"
                            sortable="custom"
                            v-if="showColumnKeys.includes('totalCollectCount')"
                        >
                            <template #default="{ row }">
                                <span>{{
                                    typeof row.totalCollectCount === 'number'
                                        ? row.totalCollectCount
                                        : '--'
                                }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column
                            prop="totalPlayCount"
                            label="播放"
                            width="76"
                            align="center"
                            sortable="custom"
                            v-if="showColumnKeys.includes('totalPlayCount')"
                        >
                            <template #default="{ row }">
                                <span>{{
                                    typeof row.totalPlayCount === 'number'
                                        ? row.totalPlayCount
                                        : '--'
                                }}</span>
                            </template>
                        </el-table-column>

                        <!-- 版权方 / 来源 -->
                        <el-table-column label="版权方" width="110" align="center" show-overflow-tooltip v-if="showColumnKeys.includes('copyrightSourceInfo')">
                            <template #default="{ row }">
                                <span>{{ row.copyrightSourceInfo?.copyrightName || '—' }}</span>
                            </template>
                        </el-table-column>

                        <!-- 内容等级 -->
                        <el-table-column label="内容等级" width="110" align="center" show-overflow-tooltip v-if="showColumnKeys.includes('contentRating')">
                            <template #default="{ row }">
                                <span>{{ row.contentRating?.ratingName || '—' }}</span>
                            </template>
                        </el-table-column>

                        <!-- 热度值 -->
                        <el-table-column
                            prop="popularityScore"
                            label="热度值"
                            min-width="120"
                            align="center"
                            show-overflow-tooltip
                            sortable="custom"
                            v-if="showColumnKeys.includes('popularityScore')"
                        />

                        <!-- 创建时间 -->
                        <el-table-column
                            prop="createdAt"
                            label="创建时间"
                            min-width="120"
                            show-overflow-tooltip
                            sortable="custom"
                            v-if="showColumnKeys.includes('createdAt')"
                        />

                        <!-- 状态：0 下线 1 上线 -->
                        <el-table-column
                            prop="status"
                            label="状态"
                            width="90"
                            align="center"
                            v-if="showColumnKeys.includes('status')"
                        >
                            <template #default="{ row }">
                                <el-switch
                                    v-if="canEditDrama"
                                    v-model="row.statusEnabled"
                                    size="small"
                                    active-text="上线"
                                    inactive-text="下线"
                                    inline-prompt
                                    @change="() => throttledHandleToggle('status', row)"
                                />
                                <el-tag
                                    v-else
                                    :type="row.status === 1 ? 'success' : 'info'"
                                    size="small"
                                >
                                    {{ row.status === 1 ? '上线' : '下线' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <!-- 置顶：0 未置顶  1 置顶 -->
                        <el-table-column
                            prop="pin"
                            label="置顶"
                            width="90"
                            align="center"
                            v-if="showColumnKeys.includes('pin')"
                        >
                            <template #default="{ row }">
                                <el-switch
                                    v-if="canEditDrama"
                                    v-model="row.stickyEnabled"
                                    size="small"
                                    active-text="置顶"
                                    inactive-text="未置顶"
                                    inline-prompt
                                    @change="() => throttledHandleSticky('pin', row)"
                                />
                                <el-tag
                                    v-else
                                    :type="row.pin === 1 ? 'success' : 'info'"
                                    size="small"
                                >
                                    {{ row.pin === 1 ? '置顶' : '未置顶' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column
                            v-if="showActionColumn && showColumnKeys.includes('action')"
                            label="操作"
                            width="150"
                            align="center"
                            fixed="right"
                        >
                            <template #default="{ row }">
                                <div class="action-buttons">
                                    <el-tooltip
                                        v-if="canDramaEpisodeList"
                                        content="查看内容"
                                        placement="top"
                                    >
                                        <el-button
                                            class="action-btn action-preview"
                                            circle
                                            @click.stop="openDramaContentDialog(row)"
                                        >
                                            <el-icon><Document /></el-icon>
                                        </el-button>
                                    </el-tooltip>
                                    <el-tooltip
                                        v-if="canDramaEpisodeList"
                                        content="剧集管理"
                                        placement="top"
                                    >
                                        <el-button
                                            class="action-btn action-add"
                                            circle
                                            @click.stop="throttledOpenEpisodeManage(row)"
                                        >
                                            <el-icon><View /></el-icon>
                                        </el-button>
                                    </el-tooltip>
                                    <el-tooltip
                                        v-if="canEditDrama || canDeleteDrama"
                                        content="更多"
                                        placement="top"
                                    >
                                        <el-dropdown trigger="click">
                                            <el-button class="action-btn action-more" circle>
                                                <el-icon><MoreFilled /></el-icon>
                                            </el-button>
                                            <template #dropdown>
                                                <el-dropdown-menu>
                                                    <el-dropdown-item
                                                        v-if="canEditDrama"
                                                        @click.stop="throttledHandleEdit(row)"
                                                    >
                                                        编辑
                                                    </el-dropdown-item>
                                                    <el-dropdown-item
                                                        v-if="canDeleteDrama"
                                                        @click.stop="throttledHandleDelete(row)"
                                                    >
                                                        删除
                                                    </el-dropdown-item>
                                                </el-dropdown-menu>
                                            </template>
                                        </el-dropdown>
                                    </el-tooltip>
                                </div>
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
                        @size-change="handleSizeChange"
                        @current-change="handleCurrentChange"
                    />
                </div>
            </el-card>

            <!-- 编辑/新增短剧对话框（与内容配置「新增版权来源」：menu-add-dialog + add-form-menu + 分区线） -->
            <el-dialog
                v-model="editDialogVisible"
                :title="editDialogTitle"
                width="760px"
                align-center
                destroy-on-close
                append-to-body
                :close-on-click-modal="false"
                class="menu-add-dialog menu-add-dialog--section-gap"
                @close="resetEditForm"
            >
                <el-form
                    ref="editFormRef"
                    :model="editForm"
                    :rules="editFormRules"
                    label-position="right"
                    label-width="110px"
                    class="add-form-menu drama-add-form"
                >
                    <el-divider content-position="left">基础信息</el-divider>
                    <el-form-item label="原始剧名" prop="title">
                        <el-input v-model="editForm.title" placeholder="请输入原始剧名" clearable />
                    </el-form-item>
                    <el-form-item label="上线剧名" prop="titleLanguage">
                        <el-input
                            v-model="editForm.titleLanguage"
                            placeholder="请输入上线展示剧名"
                            clearable
                        />
                    </el-form-item>
                    <el-form-item label="剧集数目" prop="dramaCount">
                        <el-input-number
                            v-model="editForm.dramaCount"
                            :min="1"
                            :max="9999"
                            controls-position="right"
                            style="width: 100%"
                        />
                    </el-form-item>
                    <el-form-item label="字幕语言" prop="languageCode">
                        <el-select
                            v-model="editForm.languageCode"
                            placeholder="请选择"
                            style="width: 100%"
                            clearable
                            @change="onEditFormLanguageChange"
                        >
                            <el-option
                                v-for="opt in subtitleLanguageOptions"
                                :key="opt.languageCode"
                                :label="opt.label"
                                :value="opt.languageCode"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="配音语言" prop="subtitleLanguageCode">
                        <el-select
                            v-model="editForm.subtitleLanguageCode"
                            placeholder="请选择"
                            style="width: 100%"
                            clearable
                            @change="onEditFormSubtitleLanguageChange"
                        >
                            <el-option
                                v-for="opt in subtitleLanguageOptions"
                                :key="opt.languageCode"
                                :label="opt.label"
                                :value="opt.languageCode"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="性别" prop="sex">
                        <el-select
                            v-model="editForm.sex"
                            placeholder="请选择"
                            style="width: 100%"
                            clearable
                        >
                            <el-option
                                v-for="opt in sexOptions"
                                :key="opt.value"
                                :label="opt.label"
                                :value="opt.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="内容等级" prop="contentCode">
                        <el-select
                            v-model="editForm.contentCode"
                            placeholder="请选择内容等级"
                            clearable
                            filterable
                            style="width: 100%"
                            :loading="contentRatingLoading"
                        >
                            <el-option
                                v-for="opt in contentRatingOptions"
                                :key="opt.value"
                                :label="opt.label"
                                :value="opt.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="发布时间">
                        <el-date-picker
                            v-model="editForm.publishTime"
                            type="date"
                            value-format="YYYY-MM-DD"
                            placeholder="选择发布时间"
                            style="width: 100%"
                        />
                    </el-form-item>
                    <el-form-item label="过期时间">
                        <el-date-picker
                            v-model="editForm.expiryDate"
                            type="date"
                            value-format="YYYY-MM-DD"
                            placeholder="选择过期时间"
                            style="width: 100%"
                        />
                    </el-form-item>

                    <el-divider content-position="left" class="drama-section-divider--top-loose"
                        >标签信息</el-divider
                    >
                    <el-form-item label="类型标签" prop="dramaCategories">
                        <div
                            class="tag-picker-trigger"
                            :class="{ 'is-disabled': !editForm.languageCode }"
                            @click="openTagPickerDialog('category')"
                        >
                            <template v-if="editForm.dramaCategories.length">
                                <el-tag
                                    v-for="value in editForm.dramaCategories"
                                    :key="value"
                                    size="small"
                                    type="primary"
                                    effect="light"
                                    class="tag-picker-trigger__tag"
                                >
                                    {{ getTagOptionLabel('category', value) }}
                                </el-tag>
                            </template>
                            <span v-else class="tag-picker-trigger__placeholder">
                                {{ editForm.languageCode ? '点击选择类型标签' : '请先选择字幕语言后再选分类' }}
                            </span>
                        </div>
                    </el-form-item>
                    <el-form-item label="情节标签" prop="dramaTags">
                        <div
                            class="tag-picker-trigger"
                            :class="{ 'is-disabled': !editForm.languageCode }"
                            @click="openTagPickerDialog('plot')"
                        >
                            <template v-if="editForm.dramaTags.length">
                                <el-tag
                                    v-for="value in editForm.dramaTags"
                                    :key="value"
                                    size="small"
                                    type="primary"
                                    effect="light"
                                    class="tag-picker-trigger__tag"
                                >
                                    {{ getTagOptionLabel('plot', value) }}
                                </el-tag>
                            </template>
                            <span v-else class="tag-picker-trigger__placeholder">
                                {{ editForm.languageCode ? '点击选择情节标签' : '请先选择字幕语言后再选情节标签' }}
                            </span>
                        </div>
                    </el-form-item>

                    <el-divider content-position="left" class="drama-section-divider--top-loose"
                        >版权信息</el-divider
                    >
                    <el-form-item label="版权方" prop="copyrightCode">
                        <el-select
                            v-model="editForm.copyrightCode"
                            placeholder="请选择版权方"
                            clearable
                            filterable
                            style="width: 100%"
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

                    <el-divider content-position="left" class="drama-section-divider--top-loose"
                        >状态信息</el-divider
                    >
                    <el-form-item label="完结状态">
                        <el-tag type="success" size="large">已完结</el-tag>
                    </el-form-item>
                    <el-form-item label="上线状态" prop="status">
                        <el-tag :type="editForm.status === 1 ? 'success' : 'info'" size="large">
                            {{ editForm.status === 1 ? '上线' : '下线' }}
                        </el-tag>
                        <span class="form-readonly-tip">请在列表中用开关调整</span>
                    </el-form-item>
                      <el-form-item label="置顶状态" prop="pin">
                        <el-tag :type="editForm.pin === 1 ? 'success' : 'info'" size="large">
                            {{ editForm.pin === 1 ? '置顶' : '未置顶' }}
                        </el-tag>
                        <span class="form-readonly-tip">请在列表中用开关调整</span>
                    </el-form-item>

                    <el-divider content-position="left" class="drama-section-divider--top-loose"
                        >展示信息</el-divider
                    >
                    <el-row :gutter="12">
                        <el-col :span="24">
                            <el-form-item
                                label="剧情简介"
                                prop="description"
                                class="form-item-description"
                            >
                                <el-input
                                    v-model="editForm.description"
                                    type="textarea"
                                    :rows="4"
                                    placeholder="请输入剧情简介"
                                />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="12">
                        <el-col :span="24">
                            <el-form-item label="封面图" prop="coverImg" class="form-item-cover">
                                <div class="cover-pick-wrap">
                                    <div class="cover-pick-field">
                                        <el-upload
                                            ref="dramaCoverUploadRef"
                                            :file-list="dramaCoverFileList"
                                            :auto-upload="false"
                                            :limit="1"
                                            :show-file-list="false"
                                            accept=".png,.jpg,.jpeg,.webp,.gif,.bmp"
                                            @change="onDramaCoverFileChange"
                                            @remove="onDramaCoverRemove"
                                            @exceed="onDramaCoverExceed"
                                        >
                                            <el-button type="primary" class="user-avatar-pick-btn"
                                                >选择图片</el-button
                                            >
                                        </el-upload>
                                        <div class="cover-preview-side">
                                            <template v-if="dramaCoverPreviewSrc">
                                                <img
                                                    :src="dramaCoverPreviewSrc"
                                                    class="cover-preview-img"
                                                    alt="封面预览"
                                                />
                                                <el-button
                                                    type="danger"
                                                    size="small"
                                                    link
                                                    @click="handleDramaCoverPickRemove"
                                                >
                                                    移除
                                                </el-button>
                                            </template>
                                        </div>
                                    </div>
                                    <span class="upload-tip">{{ DRAMA_COVER_UPLOAD_HINT }}</span>
                                    <span
                                        v-if="
                                            dramaCoverFileList.length === 0 && existingDramaCoverUrl
                                        "
                                        class="upload-tip"
                                    >
                                        当前已有封面，选择新文件将替换
                                    </span>
                                </div>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
                <template #footer>
                    <el-button @click="editDialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="editSubmitLoading" @click="submitEdit"
                        >保存</el-button
                    >
                </template>
            </el-dialog>
            <el-dialog
                v-model="tagPickerDialogVisible"
                width="1120px"
                align-center
                append-to-body
                :close-on-click-modal="false"
                :show-close="false"
                class="tag-picker-dialog menu-add-dialog"
            >
                <template #header>
                    <div class="tag-picker-dialog__title">
                        <span class="tag-picker-dialog__title-dot"></span>
                        {{ tagPickerType === 'category' ? '类型标签' : '情节标签' }}
                    </div>
                </template>
                <div class="tag-picker-panel" @click="handleTagPickerPanelClick">
                    <el-input
                        v-model="tagPickerKeyword"
                        class="tag-picker-search"
                        placeholder="请输入标签关键词搜索"
                        clearable
                    />
                    <div v-if="isEditMode && tagPickerPersistedOptions.length" class="tag-picker-selected">
                        <div class="tag-picker-selected__list">
                            <div
                                v-for="item in tagPickerPersistedOptions"
                                :key="item.value"
                                class="tag-picker-selected__item"
                            >
                                <span>{{ item.label }}</span>
                                <img
                                    class="tag-picker-selected__remove"
                                    src="@/assets/svg/tagDialog_close.svg"
                                    alt="移除"
                                    @click.stop="removeTagPickerValue(item.value)"
                                />
                            </div>
                        </div>
                    </div>
                    <div class="tag-picker-options">
                        <button
                            v-for="item in filteredTagPickerOptions"
                            :key="item.value"
                            type="button"
                            class="tag-picker-option"
                            :class="{ 'is-checked': tagPickerTempSelected.includes(item.value) }"
                            @click="toggleTagPickerValue(item.value)"
                        >
                            <span class="tag-picker-option__label">{{ item.label }}</span>
                            <span class="tag-picker-option__check">
                                <img
                                    v-if="tagPickerTempSelected.includes(item.value)"
                                    src="@/assets/svg/tagDialog_checked.svg"
                                    alt="已选中"
                                />
                            </span>
                        </button>
                        <button type="button" class="tag-picker-add-option" @click.stop="toggleTagPickerInlineAdd">
                            <el-icon><Plus /></el-icon>
                        </button>
                        <div v-if="tagPickerInlineAddVisible" class="tag-picker-inline-add-anchor">
                            <el-input
                                v-model="tagPickerInlineAddForm.zhName"
                                size="small"
                                class="tag-picker-inline-input"
                                placeholder="中文标签名"
                                clearable
                            />
                            <el-input
                                v-model="tagPickerInlineAddForm.intlName"
                                size="small"
                                class="tag-picker-inline-input"
                                placeholder="国际化标签名"
                                clearable
                            />
                            <el-button
                                size="small"
                                type="primary"
                                :loading="tagPickerInlineAddSubmitting"
                                @click="submitTagPickerInlineAdd"
                            >
                                保存
                            </el-button>
                        </div>
                    </div>
                    <el-empty
                        v-if="!filteredTagPickerOptions.length && !tagPickerInlineAddVisible"
                        class="tag-picker-empty"
                        :description="tagPickerKeyword && tagPickerOptions.length ? '未找到匹配标签' : '暂无可选标签'"
                    />
                </div>
                <template #footer>
                    <el-button class="tag-picker-btn-cancel" @click="tagPickerDialogVisible = false">取消</el-button>
                    <el-button class="tag-picker-btn-primary" type="primary" @click="confirmTagPickerDialog">保存</el-button>
                </template>
            </el-dialog>

            <!-- 批量添加短剧：多行录入 -->
            <el-dialog
                v-model="batchAddDialogVisible"
                title="批量添加短剧"
                width="min(1580px, 98vw)"
                align-center
                destroy-on-close
                append-to-body
                :close-on-click-modal="false"
                class="menu-add-dialog batch-add-drama-dialog"
                @close="onBatchAddDialogClose"
            >
                <div class="batch-add-toolbar">
                    <span class="batch-add-tip">简介、图片为选填；请先选字幕语言再选类型/情节标签。</span>
                </div>
                <div class="batch-add-table-wrap">
                    <el-table
                        ref="batchAddTableRef"
                        :data="batchAddRows"
                        border
                        stripe
                        row-key="_id"
                        size="small"
                        class="batch-add-el-table batch-add-plain-table"
                        max-height="520"
                    >
                        <el-table-column label="序号" width="58" align="center">
                            <template #default="{ $index }">
                                {{ $index + 1 }}
                            </template>
                        </el-table-column>
                        <el-table-column label="原始剧名" min-width="110">
                            <template #default="{ row }">
                                <el-input
                                    v-model="row.title"
                                    class="batch-add-plain-field"
                                    placeholder="必填"
                                    clearable
                                    size="small"
                                />
                            </template>
                        </el-table-column>
                        <el-table-column label="上线剧名" min-width="110">
                            <template #default="{ row }">
                                <el-input
                                    v-model="row.titleLanguage"
                                    class="batch-add-plain-field"
                                    placeholder="必填"
                                    clearable
                                    size="small"
                                />
                            </template>
                        </el-table-column>
                        <el-table-column label="简介" min-width="100">
                            <template #default="{ row }">
                                <el-input
                                    v-model="row.description"
                                    class="batch-add-plain-field"
                                    placeholder="选填"
                                    clearable
                                    size="small"
                                />
                            </template>
                        </el-table-column>
                        <el-table-column label="图片" min-width="128" align="left">
                            <template #default="{ row }">
                                <div class="batch-cover-inline">
                                    <el-upload
                                        class="batch-cover-upload-inline"
                                        :show-file-list="false"
                                        :auto-upload="false"
                                        :limit="1"
                                        accept=".png,.jpg,.jpeg,.webp,.gif,.bmp"
                                        @change="(uf, fl) => onBatchCoverFileChange(row, uf, fl)"
                                        @exceed="(files) => onBatchCoverExceed(row, files)"
                                    >
                                        <div class="batch-cover-trigger-inline" title="选择图片">
                                            <img
                                                v-if="row.coverPreview"
                                                :src="row.coverPreview"
                                                class="batch-cover-thumb-inline"
                                                alt=""
                                            />
                                            <span v-else class="batch-cover-text-inline">选择</span>
                                        </div>
                                    </el-upload>
                                    <el-button
                                        v-if="row.coverPreview || row.coverRaw"
                                        type="danger"
                                        link
                                        size="small"
                                        class="batch-cover-clear-inline"
                                        @click.stop="clearBatchRowCover(row)"
                                    >
                                        清除
                                    </el-button>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column label="字幕" width="138">
                            <template #default="{ row }">
                                <el-select
                                    v-model="row.languageCode"
                                    class="batch-add-plain-field"
                                    placeholder="必填"
                                    filterable
                                    clearable
                                    size="small"
                                    style="width: 100%"
                                    @change="() => onBatchRowLanguageChange(row)"
                                >
                                    <el-option
                                        v-for="opt in subtitleLanguageOptions"
                                        :key="opt.languageCode"
                                        :label="opt.label"
                                        :value="opt.languageCode"
                                    />
                                </el-select>
                            </template>
                        </el-table-column>
                        <el-table-column label="配音" width="138">
                            <template #default="{ row }">
                                <el-select
                                    v-model="row.subtitleLanguageCode"
                                    class="batch-add-plain-field"
                                    placeholder="必填"
                                    filterable
                                    clearable
                                    size="small"
                                    style="width: 100%"
                                >
                                    <el-option
                                        v-for="opt in subtitleLanguageOptions"
                                        :key="`dub-${opt.languageCode}`"
                                        :label="opt.label"
                                        :value="opt.languageCode"
                                    />
                                </el-select>
                            </template>
                        </el-table-column>
                        <el-table-column label="类型标签" min-width="170">
                            <template #default="{ row }">
                                <el-select
                                    v-model="row.dramaCategories"
                                    class="batch-add-tag-select batch-add-plain-field"
                                    placeholder="先选字幕"
                                    multiple
                                    collapse-tags
                                    collapse-tags-tooltip
                                    :max-collapse-tags="1"
                                    :disabled="!row.languageCode"
                                    filterable
                                    size="small"
                                    style="width: 100%"
                                >
                                    <el-option
                                        v-for="opt in buildCategoryOptionsForLanguage(row.languageCode)"
                                        :key="opt.value"
                                        :label="opt.label"
                                        :value="opt.value"
                                    />
                                </el-select>
                            </template>
                        </el-table-column>
                        <el-table-column label="情节标签" min-width="170">
                            <template #default="{ row }">
                                <el-select
                                    v-model="row.dramaTags"
                                    class="batch-add-tag-select batch-add-plain-field"
                                    placeholder="先选字幕"
                                    multiple
                                    collapse-tags
                                    collapse-tags-tooltip
                                    :max-collapse-tags="1"
                                    :disabled="!row.languageCode"
                                    filterable
                                    size="small"
                                    style="width: 100%"
                                >
                                    <el-option
                                        v-for="opt in buildPlotOptionsForLanguage(row.languageCode)"
                                        :key="opt.value"
                                        :label="opt.label"
                                        :value="opt.value"
                                    />
                                </el-select>
                            </template>
                        </el-table-column>
                        <el-table-column label="剧集" width="88" align="center">
                            <template #default="{ row }">
                                <el-input-number
                                    v-model="row.dramaCount"
                                    class="batch-add-plain-num"
                                    :min="1"
                                    :max="9999"
                                    controls-position="right"
                                    size="small"
                                    style="width: 100%"
                                />
                            </template>
                        </el-table-column>
                        <el-table-column label="版权方" min-width="120">
                            <template #default="{ row }">
                                <el-select
                                    v-model="row.copyrightCode"
                                    class="batch-add-plain-field"
                                    placeholder="必填"
                                    filterable
                                    clearable
                                    size="small"
                                    style="width: 100%"
                                    :loading="copyrightOwnerLoading"
                                >
                                    <el-option
                                        v-for="opt in copyrightOwnerOptions"
                                        :key="opt.value"
                                        :label="opt.label"
                                        :value="opt.value"
                                    />
                                </el-select>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="72" align="center" fixed="right">
                            <template #default="{ $index }">
                                <el-button type="danger" link size="small" @click="removeBatchAddRow($index)">
                                    删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <!-- 紧贴表格最后一行下方左侧：仅图标增加一行 -->
                    <div class="batch-table-append-row">
                        <el-button
                            type="primary"
                            circle
                            size="small"
                            :icon="Plus"
                            title="增加一行"
                            @click="appendBatchAddRow"
                        />
                    </div>
                </div>
                <template #footer>
                    <el-button @click="batchAddDialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="batchAddSubmitLoading" @click="submitBatchAdd">
                        提交全部
                    </el-button>
                </template>
            </el-dialog>

            <!-- 查看短剧内容对话框（外壳与菜单管理「查看详情」一致） -->
            <el-dialog
                v-model="contentDialogVisible"
                title="查看详情"
                width="960px"
                align-center
                destroy-on-close
                class="menu-add-dialog menu-view-dialog"
                @close="resetDramaContentDialog"
            >
                <div v-if="contentDialogRow" class="drama-content-dialog">
                    <div class="dialog-top">
                        <div class="dialog-cover">
                            <el-image
                                class="dialog-cover-img"
                                :src="coverImageSrc(contentDialogRow.coverImg)"
                                fit="cover"
                                :preview-src-list="
                                    coverImageSrc(contentDialogRow.coverImg)
                                        ? [coverImageSrc(contentDialogRow.coverImg)]
                                        : []
                                "
                            />
                        </div>
                        <div class="dialog-main">
                            <div class="dialog-title">
                                <div class="dialog-title__line">
                                    {{ contentDialogRow.titleLanguage || contentDialogRow.title }}
                                </div>
                                <div v-if="contentDialogRow.title" class="dialog-title__sub">
                                    {{ contentDialogRow.title }}
                                </div>
                            </div>
                            <div class="dialog-tag-row">
                                <span class="dialog-tag-label">类型标签：</span>
                                <el-tag
                                    v-for="(t, i) in splitCommaList(
                                        contentDialogRow.dramaCategories
                                    )"
                                    :key="`dlg-cat-${i}`"
                                    type="primary"
                                    size="small"
                                    effect="light"
                                >
                                    {{ t }}
                                </el-tag>
                                <span
                                    v-if="!splitCommaList(contentDialogRow.dramaCategories).length"
                                    class="tag-empty"
                                    >—</span
                                >
                            </div>
                            <div class="dialog-tag-row">
                                <span class="dialog-tag-label">情节标签：</span>
                                <el-tag
                                    v-for="(t, i) in splitCommaList(contentDialogRow.plotTags)"
                                    :key="`dlg-plot-${i}`"
                                    type="warning"
                                    size="small"
                                    effect="light"
                                >
                                    {{ t }}
                                </el-tag>
                                <span
                                    v-if="!splitCommaList(contentDialogRow.plotTags).length"
                                    class="tag-empty"
                                    >—</span
                                >
                            </div>
                            <div class="dialog-desc">
                                <span class="dialog-desc__label">简介：</span
                                ><span class="dialog-desc__text">{{
                                    contentDialogRow.description || '—'
                                }}</span>
                            </div>
                        </div>
                    </div>

                    <el-divider />

                    <div class="dialog-grid">
                        <el-card
                            class="dialog-card"
                            shadow="never"
                            :body-style="{ padding: '12px 14px' }"
                        >
                            <template #header>
                                <div class="dialog-card__header">基础信息</div>
                            </template>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">短剧vid</div>
                                <div class="dialog-info-value">
                                    {{ contentDialogRow.vid || '—' }}
                                </div>
                            </div>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">播放器ID</div>
                                <div class="dialog-info-value">
                                    {{ contentDialogRow.vodSubAppId ?? '—' }}
                                </div>
                            </div>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">已上传集数</div>
                                <div class="dialog-info-value">
                                    {{ contentDialogRow.uploadedDramaCount ?? '—' }}
                                </div>
                            </div>

                            <div class="dialog-info-row">
                                <div class="dialog-info-label">总集数</div>
                                <div class="dialog-info-value">
                                    {{ contentDialogRow.dramaCount ?? '—' }}
                                </div>
                            </div>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">字幕语言</div>
                                <div class="dialog-info-value">
                                    {{
                                        contentDialogRow.languageName ||
                                        contentDialogRow.languageCode ||
                                        '—'
                                    }}
                                </div>
                            </div>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">配音语言</div>
                                <div class="dialog-info-value">
                                    {{
                                        contentDialogRow.subtitleLanguageName ||
                                        contentDialogRow.subtitleLanguageCode ||
                                        '—'
                                    }}
                                </div>
                            </div>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">性别</div>
                                <div class="dialog-info-value">
                                    {{
                                        contentDialogRow.sex === 0
                                            ? '全部'
                                            : contentDialogRow.sex === 1
                                              ? '男频'
                                              : '女频'
                                    }}
                                </div>
                            </div>

                            <div class="dialog-info-row">
                                <div class="dialog-info-label">内容等级</div>
                                <div class="dialog-info-value">
                                    {{ contentDialogRow.contentRating.ratingName ?? '—' }}
                                </div>
                            </div>

                            <div class="dialog-info-row">
                                <div class="dialog-info-label">热度值</div>
                                <div class="dialog-info-value">
                                    {{ contentDialogRow.popularityScore ?? '—' }}
                                </div>
                            </div>
                        </el-card>

                        <!-- 版权信息：版权编码、版权方、合同过期时间 -->
                        <el-card
                            class="dialog-card"
                            shadow="never"
                            :body-style="{ padding: '12px 14px' }"
                        >
                            <template #header>
                                <div class="dialog-card__header">版权信息</div>
                            </template>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">版权编码</div>
                                <div class="dialog-info-value">
                                    {{
                                        contentDialogRow.copyrightSourceInfo?.copyrightCode ||
                                        contentDialogRow.copyrightCode ||
                                        '—'
                                    }}
                                </div>
                            </div>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">版权方</div>
                                <div class="dialog-info-value">
                                    {{ contentDialogRow.copyrightSourceInfo?.copyrightName || '—' }}
                                </div>
                            </div>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">合同过期时间</div>
                                <div class="dialog-info-value">{{ expiryTimeText }}</div>
                            </div>
                        </el-card>

                        <!-- 状态信息：完结、上线、置顶、发布时间、创建时间、更新时间 -->
                        <el-card
                            class="dialog-card"
                            shadow="never"
                            :body-style="{ padding: '12px 14px' }"
                        >
                            <template #header>
                                <div class="dialog-card__header">状态信息</div>
                            </template>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">完结状态</div>
                                <div class="dialog-info-value">
                                    <el-tag
                                        :type="
                                            contentDialogRow.seriesStatus === 1 ? 'success' : 'info'
                                        "
                                        size="small"
                                    >
                                        {{
                                            contentDialogRow.seriesStatus === 1
                                                ? '已完结'
                                                : '未完结'
                                        }}
                                    </el-tag>
                                </div>
                            </div>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">上线状态</div>
                                <div class="dialog-info-value">
                                    <el-tag
                                        :type="contentDialogRow.status === 1 ? 'success' : 'info'"
                                        size="small"
                                    >
                                        {{ contentDialogRow.status === 1 ? '上线' : '下线' }}
                                    </el-tag>
                                </div>
                            </div>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">置顶状态</div>
                                <div class="dialog-info-value">
                                    <el-tag
                                        :type="contentDialogRow.pin === 1 ? 'success' : 'info'"
                                        size="small"
                                    >
                                        {{ contentDialogRow.pin === 1 ? '置顶' : '未置顶' }}
                                    </el-tag>
                                </div>
                            </div>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">发布时间</div>
                                <div class="dialog-info-value">
                                    {{ contentDialogRow.publishTime || '—' }}
                                </div>
                            </div>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">创建时间</div>
                                <div class="dialog-info-value">
                                    {{ contentDialogRow.createdAt || '—' }}
                                </div>
                            </div>
                            <div class="dialog-info-row">
                                <div class="dialog-info-label">更新时间</div>
                                <div class="dialog-info-value">
                                    {{ contentDialogRow.updatedAt || '—' }}
                                </div>
                            </div>
                        </el-card>
                    </div>
                </div>
                <div v-else class="drama-content-dialog--empty">加载中...</div>
                <template #footer>
                    <el-button type="primary" @click="contentDialogVisible = false">关闭</el-button>
                </template>
            </el-dialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
// 短剧内容管理：筛选 + 列表 + 短剧编辑 + 剧集管理/预览跳转
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter, useRoute  } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
    CopyDocument,
    Delete,
    Document,
    Edit,
    Loading,
    MoreFilled,
    Plus,
    Refresh,
    View,
} from '@element-plus/icons-vue'
import {
    addDrama,
    batchAddDrama,
    deleteDrama,
    getDramaPage,
    type AddDramaParams,
    type BatchAddDramaItem,
    editDramaPin,
    type UpdateDramaParams,
    updateDrama,
    updateDramaCoverImg,
    updateDramaStatus,
} from '@/api/drama'
import {
    addCategoryInfo,
    addTagInfo,
    getCategoryInfoList,
    getSupportLanguagePage,
    getTagInfoList,
    getContentRatingList,
} from '@/api'
import { getCopyrightSourceInfoList } from '@/api/copyright'
import { throttle } from '@/utils/throttle'
import { uploadByPut, isAllowedFile } from '@/utils/obsUpload'
import {
    DRAMA_COVER_UPLOAD_HINT,
    getDramaCoverImageValidationError,
} from '@/utils/dramaCoverImage'
import { hasPerm, PERM_COPYRIGHT_SOURCE, PERM_DRAMA, PERM_CONTENT_RATING } from '@/utils/permission'

// 短剧整体状态（与接口 status 对应：0 下线，1 上线）
type DramaStatusNum = 0 | 1
// 短剧完结状态：0 未完结，1 已完结
type SeriesStatusNum = 0 | 1
// 性别：0 全部，1 男，2 女频
type SexNum = 0 | 1 | 2
// 短剧置顶状态：0 未置顶，1 置顶
type PinStatusNum = 0 | 1

// 列显示控制
const columnSettingVisible = ref(false)
const showColumnKeys = ref([
  'vid',
  'title',
  'titleLanguage',
  'coverImg',
  'dramaCategories',
  'plotTags',
  'languageName',
//   'sex',  //默认不展示
  'dramaCount',
  'totalLikesCount',
  'totalCollectCount',
  'totalPlayCount',
  'copyrightSourceInfo',
//   'contentRating', //默认不展示
//   'createdAt', //默认不展示
  'status',
  'pin',
  'action',
//   'popularityScore' // 默认不展示
])

// 列表里一行短剧的信息（与接口字段一致）
type DramaRecord = {
    /** 后端主键，编辑时必传 */
    id: number
    /** 短剧 vid（分页接口返回，列表第一列展示，编辑时必传） */
    vid: string
    /** 原始剧 Id（列表第二列、编辑用主键） */
    originVid: string
    /** 字幕语言名称，如「英语」 */
    languageName: string
    /** 字幕语言编码，如 en */
    languageCode: string
    /** 配音语言名称，如「中文」 */
    subtitleLanguageName?: string
    /** 配音语言编码，如 zh */
    subtitleLanguageCode?: string
    /** 原始剧名 */
    title: string
    /** 上线剧名 */
    titleLanguage: string
    /** 封面图 URL */
    coverImg: string
    /** 短剧简介 */
    description: string
    /** 性别：0 全部 1 男频 2 女频 */
    sex: SexNum
    /** 剧集数（分集总数） */
    dramaCount: number
    /** 已上传剧集数 */
    uploadedDramaCount: number
    /** 处理中剧集数 */
    processingDramaCount?: number | null
    /** 上传中剧集数 */
    uploadingDramaCount?: number | null
    /** 上传失败剧集数 */
    failProcessedDramaCount?: number | null
    /** 点赞数 */
    totalLikesCount?: number | null
    /** 收藏数 */
    totalCollectCount?: number | null
    /** 播放数 */
    totalPlayCount?: number | null
    /** 类型标签，逗号分隔，如 Drama,Romance */
    dramaCategories: string
    /** 情节标签展示（逗号分隔或后端直接返回展示名） */
    plotTags: string
    /** 类型标签对应的语言列表，逗号分隔，如 English,Chinese */
    dramaLanguageCategories?: string
    /** 版权方编码（接口若有） */
    copyrightCode?: string
    /** 版权来源详情（分页接口返回） */
    copyrightSourceInfo?: {
        id?: number
        copyrightCode?: string
        copyrightName?: string
        expiryDate?: string | null
    }
    /** 情节标签编码串（接口若有） */
    dramaTagsCodes?: string
    /** 发布时间，格式如 2026-03-03 */
    publishTime?: string
    /** 创建时间 */
    createdAt?: string
    /** 更新时间 */
    updatedAt?: string
    /** 过期时间（接口字段 expiryDate） */
    expiryDate?: string
    /** 腾讯云播放器子应用 ID */
    vodSubAppId?: number
    /** 状态：0 下线 1 上线 */
    status: DramaStatusNum
    /** 短剧完结状态：0 未完结 1 已完结 */
    seriesStatus: SeriesStatusNum
    /** 仅用于开关：status === 1 */
    statusEnabled?: boolean
    /** 内容等级 */
    contentRating: {
        id: number,
        ratingName: string,
        ratingCode: string,
        ratingValue: number,
        createdAt: string,
        updatedAt: string
    },
    /** 仅用于开关：pin === 1 */
    stickyEnabled: boolean
    /** 是否置顶 0 未置顶 1置顶 */
    pin: PinStatusNum
    /** 热度值 */
    popularityScore: number
}

// 短剧封面预上传：用 el-upload 的 file-list 管理，保存时才 uploadByPut
type DramaCoverUploadItem = { name: string; url: string; raw?: File; uid?: number }
const dramaCoverFileList = ref<DramaCoverUploadItem[]>([])
// 编辑时已有的封面 URL（未重新选择时保存接口用）
const existingDramaCoverUrl = ref<string>('')
// 短剧封面上传组件实例
const dramaCoverUploadRef = ref<{ clearFiles?: () => void } | null>(null)
// 悬停预览用：本地所选封面的 blob URL
const dramaCoverPreviewUrl = ref<string>('')
const dramaCoverPreviewSrc = computed(
    () => dramaCoverPreviewUrl.value || existingDramaCoverUrl.value || ''
)

// 顶部面包屑标题（短剧列表页默认不展示）
const title = {
    firstTitle: '',
    secondTitle: '',
}

const canAddDrama = computed(() => hasPerm(PERM_DRAMA.add))
const canEditDrama = computed(() => hasPerm(PERM_DRAMA.edit))
/** 列表无封面时点击上传：隐藏 file 与当前行 */
const listCoverFileInputRef = ref<HTMLInputElement | null>(null)
const listCoverUploadRow = ref<DramaRecord | null>(null)
const coverListUploadingId = ref<number | null>(null)

function triggerListCoverUpload(row: DramaRecord) {
    if (!canEditDrama.value) return
    if (coverImageSrc(row.coverImg)) return
    if (coverListUploadingId.value != null) return
    listCoverUploadRow.value = row
    listCoverFileInputRef.value?.click()
}

async function onListCoverFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    const row = listCoverUploadRow.value
    listCoverUploadRow.value = null
    if (!file || !row) return
    if (!isAllowedFile(file)) {
        ElMessage.error('不支持的图片格式')
        return
    }
    const coverErr = await getDramaCoverImageValidationError(file)
    if (coverErr) {
        ElMessage.error(coverErr)
        return
    }
    coverListUploadingId.value = row.id
    try {
        const coverImgUrl = await uploadByPut(file, 'drama/cover')
        const res = await updateDramaCoverImg({ id: row.id, coverImg: coverImgUrl })
        const data = res.data
        if (Number(data?.code) === 200 && data?.data !== false) {
            row.coverImg = coverImgUrl
            ElMessage.success(data?.message?.trim() || '封面已更新')
        } else {
            ElMessage.error(data?.message ?? '保存封面失败')
        }
    } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '封面上传或保存失败')
    } finally {
        coverListUploadingId.value = null
    }
}

const canDeleteDrama = computed(() => hasPerm(PERM_DRAMA.delete))
const canDramaEpisodeList = computed(() => hasPerm(PERM_DRAMA.list))
const canListCopyrightSource = computed(() => hasPerm(PERM_COPYRIGHT_SOURCE.list))
const canListContentRating = computed(() => hasPerm(PERM_CONTENT_RATING.list))
const showActionColumn = computed(
    () => canEditDrama.value || canDramaEpisodeList.value || canDeleteDrama.value
)

// 顶部筛选表单（字段与接口一致，便于后续对接）
const searchForm = reactive({
    vid: '',
    title: '',
    copyrightCode: '',
    languageCode: '' as string,
    dramaCategoriesCodes: [] as string[],
    dramaTagsCodes: [] as string[],
    status: '' as '' | number,
    pin: '' as '' | 0 | 1,
})

const DICT_CACHE_TTL = {
    language: 10 * 60 * 1000,
    copyright: 10 * 60 * 1000,
    contentRating: 30 * 60 * 1000,
} as const

/** 页面级内存缓存：减少短时间内重复加载基础字典 */
const dictCache = {
    language: { expiresAt: 0, data: [] as { languageCode: string; languageName: string; label: string }[] },
    copyright: { expiresAt: 0, data: [] as { label: string; value: string }[] },
    contentRating: { expiresAt: 0, data: [] as { label: string; value: string }[] },
}

function isCacheValid(expiresAt: number) {
    return expiresAt > Date.now()
}

// 语言下拉：来自接口 /api/supportLanguage/page
const languageOptions = ref<{ languageCode: string; languageName: string; label: string }[]>([])
const languageOptionsLoading = ref(false)

/**
 * 加载语言下拉选项（筛选区 + 编辑表单共用）
 * 第一步：调用 getSupportLanguagePage 拉取支持语言列表
 * 第二步：映射为 { languageCode, languageName } 并过滤空 code
 * 第三步：同步到 subtitleLanguageOptions 供编辑弹窗使用
 * @returns 无返回值，结果写入 languageOptions / subtitleLanguageOptions
 */
async function loadLanguageOptions(force = false) {
    if (languageOptionsLoading.value) return
    // 命中缓存直接回填；force=true 时强制走接口刷新缓存
    if (!force && isCacheValid(dictCache.language.expiresAt) && dictCache.language.data.length > 0) {
        languageOptions.value = [...dictCache.language.data]
        subtitleLanguageOptions.value = dictCache.language.data.map((language) => ({
            languageName: language.languageName,
            languageCode: language.languageCode,
            label: language.label,
        }))
        return
    }
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
            .filter((language) => language.languageCode)
        dictCache.language.data = [...languageOptions.value]
        dictCache.language.expiresAt = Date.now() + DICT_CACHE_TTL.language
        subtitleLanguageOptions.value = languageOptions.value.map(
            (language: { languageCode?: string; languageName?: string; label?: string }) => ({
                languageName: language.languageName,
                languageCode: language.languageCode,
                label: language.label,
            })
        )
    } catch {
        languageOptions.value = []
        subtitleLanguageOptions.value = []
    } finally {
        languageOptionsLoading.value = false
    }
}

// 类型（类型标签）下拉：根据当前筛选的语言加载该语言下的分类
const categoryOptions = ref<{ label: string; value: string }[]>([])
const allCategoryRecords = ref<
    Array<{
        languageCode?: string
        categoryName?: string
        categoryCode?: string
        categoryNameLanguage?: string
    }>
>([])
const allCategoryLoaded = ref(false)
const allCategoryLoading = ref(false)

/** 页面初始化时一次性拉取分类数据，后续筛选/新增/编辑都只做本地过滤 */
async function loadAllCategoryData() {
    if (allCategoryLoading.value) return
    allCategoryLoading.value = true
    try {
        const res: any = await getCategoryInfoList()
        const body = res?.data ?? res
        let list: any[] = []
        const raw = body?.data
        if (body?.code === 200 && raw != null) {
            if (Array.isArray(raw)) list = raw
            else if (Array.isArray(raw.records)) list = raw.records
        } else if (Array.isArray(body?.data)) {
            list = body.data
        } else if (Array.isArray(body)) {
            list = body
        }
        allCategoryRecords.value = list.map((r) => ({
            languageCode: r?.languageCode,
            categoryName: r?.categoryName != null ? String(r.categoryName) : '',
            categoryCode: r?.categoryCode != null ? String(r.categoryCode) : '',
            categoryNameLanguage:
                r?.categoryNameLanguage != null ? String(r.categoryNameLanguage) : '',
        }))
        allCategoryLoaded.value = true
    } catch {
        allCategoryRecords.value = []
    } finally {
        allCategoryLoading.value = false
    }
}

function filterCategoriesByLanguage(languageCode: string | undefined) {
    const lang = languageCode?.trim()
    return lang
        ? allCategoryRecords.value.filter(
              (record) => !record.languageCode || record.languageCode === lang
          )
        : allCategoryRecords.value
}

/**
 * 根据当前筛选语言从已预加载数据生成筛选区分类下拉
 */
function loadCategoryOptions(languageCode: string | undefined) {
    categoryOptions.value = filterCategoriesByLanguage(languageCode)
        .map((record) => {
            const code = (record.categoryCode ?? '').trim()
            const name = (record.categoryName ?? '').trim()
            const intlName = (record.categoryNameLanguage ?? '').trim()
            const value = code || name
            const label =
                name && intlName && name !== intlName
                    ? `${name}（${intlName}）`
                    : name || intlName || code || value
            return value ? { label, value } : null
        })
        .filter(Boolean) as { label: string; value: string }[]
}

// 编辑/新增短剧弹窗内的类型标签下拉：根据表单所选语言加载，含 categoryCode 和国际化分类名称（categoryNameLanguage）
const editFormCategoryOptions = ref<
    { label: string; value: string; code: string; intlName: string }[]
>([])
/** 编辑弹窗内「情节标签」下拉（随字幕语言过滤） */
const editFormPlotTagOptions = ref<{ label: string; value: string }[]>([])
const tagPickerDialogVisible = ref(false)
const tagPickerType = ref<'category' | 'plot'>('category')
const tagPickerTempSelected = ref<string[]>([])
const tagPickerKeyword = ref('')
const persistedCategoryValues = ref<string[]>([])
const persistedPlotTagValues = ref<string[]>([])
const isEditMode = computed(() => editingRowId.value != null)
const tagPickerInlineAddVisible = ref(false)
const tagPickerInlineAddSubmitting = ref(false)
const tagPickerInlineAddForm = reactive({
    zhName: '',
    intlName: '',
})

const tagPickerOptions = computed(() =>
    (
        tagPickerType.value === 'category'
            ? editFormCategoryOptions.value.map((item) => ({ label: item.label, value: item.value }))
            : editFormPlotTagOptions.value
    ).filter((item) => !tagPickerPersistedValues.value.includes(item.value))
)
const filteredTagPickerOptions = computed(() => {
    const keyword = tagPickerKeyword.value.trim().toLowerCase()
    if (!keyword) return tagPickerOptions.value
    return tagPickerOptions.value.filter((item) => item.label.toLowerCase().includes(keyword))
})
const tagPickerPersistedValues = computed(() =>
    tagPickerType.value === 'category' ? persistedCategoryValues.value : persistedPlotTagValues.value
)
const tagPickerPersistedOptions = computed(() =>
    tagPickerPersistedValues.value.map((value) => ({
        value,
        label: getTagOptionLabel(tagPickerType.value, value),
    }))
)

/** 按语言生成分类下拉选项（编辑弹窗与批量添加表格共用） */
function buildCategoryOptionsForLanguage(languageCode: string | undefined) {
    const lang = languageCode?.trim()
    if (!lang) return [] as { label: string; value: string; code: string; intlName: string }[]
    return filterCategoriesByLanguage(lang)
        .map((record) => {
            const name = (record.categoryName ?? '').trim()
            const intlName = (record.categoryNameLanguage ?? '').trim()
            const code = (record.categoryCode ?? '').trim()
            const label =
                name && intlName && name !== intlName
                    ? `${name}（${intlName}）`
                    : name || intlName || code
            return {
                label,
                value: name || code,
                code: code || name,
                intlName: intlName || name || code,
            }
        })
        .filter((category) => category.value)
}

/** 根据编辑表单语言从已预加载数据生成弹窗分类下拉 */
function loadEditFormCategoryOptions(languageCode: string | undefined) {
    editFormCategoryOptions.value = buildCategoryOptionsForLanguage(languageCode)
}

function getTagOptionLabel(type: 'category' | 'plot', value: string) {
    const options =
        type === 'category'
            ? editFormCategoryOptions.value.map((item) => ({ label: item.label, value: item.value }))
            : editFormPlotTagOptions.value
    const matched = options.find((item) => item.value === value)
    return matched?.label ?? value
}

function openTagPickerDialog(type: 'category' | 'plot') {
    if (!editForm.languageCode) {
        ElMessage.warning('请先选择字幕语言')
        return
    }
    tagPickerType.value = type
    tagPickerKeyword.value = ''
    resetTagPickerInlineAddForm()
    tagPickerTempSelected.value =
        type === 'category' ? [...editForm.dramaCategories] : [...editForm.dramaTags]
    tagPickerDialogVisible.value = true
}

function resetTagPickerInlineAddForm() {
    tagPickerInlineAddVisible.value = false
    tagPickerInlineAddForm.zhName = ''
    tagPickerInlineAddForm.intlName = ''
}

function toggleTagPickerInlineAdd() {
    tagPickerInlineAddVisible.value = !tagPickerInlineAddVisible.value
    if (!tagPickerInlineAddVisible.value) {
        tagPickerInlineAddForm.zhName = ''
        tagPickerInlineAddForm.intlName = ''
    }
}

function handleTagPickerPanelClick(event: MouseEvent) {
    if (!tagPickerInlineAddVisible.value) return
    if (tagPickerInlineAddForm.zhName.trim() || tagPickerInlineAddForm.intlName.trim()) return
    const target = event.target as HTMLElement | null
    if (!target) return
    if (target.closest('.tag-picker-inline-add-anchor') || target.closest('.tag-picker-add-option')) return
    tagPickerInlineAddVisible.value = false
}

function handleTagPickerGlobalPointerDown(event: MouseEvent) {
    if (!tagPickerDialogVisible.value || !tagPickerInlineAddVisible.value) return
    if (tagPickerInlineAddForm.zhName.trim() || tagPickerInlineAddForm.intlName.trim()) return
    const target = event.target as HTMLElement | null
    if (!target) return
    if (target.closest('.tag-picker-inline-add-anchor') || target.closest('.tag-picker-add-option')) return
    tagPickerInlineAddVisible.value = false
}

async function submitTagPickerInlineAdd() {
    if (!editForm.languageCode) {
        ElMessage.warning('请先选择字幕语言')
        return
    }
    const zhName = tagPickerInlineAddForm.zhName.trim()
    const intlName = tagPickerInlineAddForm.intlName.trim()
    if (!zhName) {
        ElMessage.warning('请输入中文标签名')
        return
    }
    if (!intlName) {
        ElMessage.warning('请输入国际化标签名')
        return
    }
    tagPickerInlineAddSubmitting.value = true
    try {
        if (tagPickerType.value === 'category') {
            const res: any = await addCategoryInfo({
                categoryName: zhName,
                categoryNameLanguage: intlName,
                languageCode: editForm.languageCode,
            })
            const body = res?.data ?? res
            if (Number(body?.code) !== 200) {
                ElMessage.error(body?.message ?? '添加类型标签失败')
                return
            }
            await loadAllCategoryData()
            loadEditFormCategoryOptions(editForm.languageCode || undefined)
            const createdCategory = editFormCategoryOptions.value.find((item) => {
                const label = String(item.label ?? '').trim()
                const value = String(item.value ?? '').trim()
                const code = String(item.code ?? '').trim()
                const intl = String(item.intlName ?? '').trim()
                return (
                    value === zhName ||
                    value === intlName ||
                    label === zhName ||
                    label === intlName ||
                    code === zhName ||
                    code === intlName ||
                    intl === zhName ||
                    intl === intlName ||
                    label.includes(zhName) ||
                    label.includes(intlName)
                )
            })
            const pickedValue = createdCategory?.value ?? zhName
            if (!tagPickerTempSelected.value.includes(pickedValue)) {
                tagPickerTempSelected.value.push(pickedValue)
            }
            tagPickerKeyword.value = ''
            ElMessage.success(body?.message?.trim() || '添加类型标签成功')
        } else {
            const res: any = await addTagInfo({
                tagName: zhName,
                tagNameLanguage: intlName,
                languageCode: editForm.languageCode,
            })
            const body = res?.data ?? res
            if (Number(body?.code) !== 200) {
                ElMessage.error(body?.message ?? '添加情节标签失败')
                return
            }
            await loadAllTagData()
            loadEditFormPlotTagOptions(editForm.languageCode || undefined)
            const createdPlotTag = editFormPlotTagOptions.value.find((item) => {
                const label = String(item.label ?? '').trim()
                const value = String(item.value ?? '').trim()
                return (
                    value === zhName ||
                    value === intlName ||
                    label === zhName ||
                    label === intlName ||
                    label.includes(zhName) ||
                    label.includes(intlName)
                )
            })
            const pickedValue = createdPlotTag?.value ?? (editFormPlotTagOptions.value?.[0]?.value ?? zhName)
            if (!tagPickerTempSelected.value.includes(pickedValue)) {
                tagPickerTempSelected.value.push(pickedValue)
            }
            tagPickerKeyword.value = ''
            ElMessage.success(body?.message?.trim() || '添加情节标签成功')
        }
        resetTagPickerInlineAddForm()
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '保存失败')
    } finally {
        tagPickerInlineAddSubmitting.value = false
    }
}

function toggleTagPickerValue(value: string) {
    const index = tagPickerTempSelected.value.indexOf(value)
    if (index > -1) tagPickerTempSelected.value.splice(index, 1)
    else tagPickerTempSelected.value.push(value)
}

function removeTagPickerValue(value: string) {
    tagPickerTempSelected.value = tagPickerTempSelected.value.filter((item) => item !== value)
    if (tagPickerType.value === 'category') {
        persistedCategoryValues.value = persistedCategoryValues.value.filter((item) => item !== value)
    } else {
        persistedPlotTagValues.value = persistedPlotTagValues.value.filter((item) => item !== value)
    }
}

function confirmTagPickerDialog() {
    if (tagPickerType.value === 'category') {
        editForm.dramaCategories = [...tagPickerTempSelected.value]
        editFormRef.value?.validateField?.('dramaCategories')
    } else {
        editForm.dramaTags = [...tagPickerTempSelected.value]
    }
    tagPickerKeyword.value = ''
    resetTagPickerInlineAddForm()
    tagPickerDialogVisible.value = false
}

/**
 * 编辑表单「字幕语言」变更时：回填 languageName、清空类型标签、重新拉取该语言下的分类选项
 */
function onEditFormLanguageChange() {
    const matchedLanguage = subtitleLanguageOptions.value.find(
        (language) => language.languageCode === editForm.languageCode
    )
    editForm.languageName = matchedLanguage?.languageName ?? ''
    editForm.dramaCategories = []
    editForm.dramaTags = []
    persistedCategoryValues.value = []
    persistedPlotTagValues.value = []
    loadEditFormCategoryOptions(editForm.languageCode || undefined)
    loadEditFormPlotTagOptions(editForm.languageCode || undefined)
    resetTagPickerInlineAddForm()
}

/**
 * 编辑表单「配音语言」变更时：回填 subtitleLanguageName（供提交后端使用）
 */
function onEditFormSubtitleLanguageChange() {
    const matched = subtitleLanguageOptions.value.find(
        (language) => language.languageCode === editForm.subtitleLanguageCode
    )
    editForm.subtitleLanguageName = matched?.languageName ?? ''
}

/**
 * 筛选区「语言」变更时：清空已选类型、重新拉取该语言下的分类选项（筛选区「类型」下拉）
 */
async function onSearchLanguageChange() {
    searchForm.dramaCategoriesCodes = []
    searchForm.dramaTagsCodes = []
    await ensureTagAndCategoryLoaded()
    loadCategoryOptions(searchForm.languageCode || undefined)
    loadPlotTagOptions(searchForm.languageCode || undefined)
}

// 状态：0 下线，1 上线
const statusOptions = [
    { label: '下线', value: 0 as DramaStatusNum },
    { label: '上线', value: 1 as DramaStatusNum },
]

/** 版权方下拉：GET /api/copyrightSourceInfo/list */
const copyrightOwnerOptions = ref<{ label: string; value: string }[]>([])
const copyrightOwnerLoading = ref(false)

async function loadCopyrightOwnerOptions(force = false) {
    if (!canListCopyrightSource.value) {
        copyrightOwnerOptions.value = []
        copyrightOwnerLoading.value = false
        return
    }
    // 版权方基础字典缓存（避免首屏和弹窗重复请求）
    if (!force && isCacheValid(dictCache.copyright.expiresAt) && dictCache.copyright.data.length > 0) {
        copyrightOwnerOptions.value = [...dictCache.copyright.data]
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
        dictCache.copyright.data = [...copyrightOwnerOptions.value]
        dictCache.copyright.expiresAt = Date.now() + DICT_CACHE_TTL.copyright
    } catch {
        copyrightOwnerOptions.value = []
    } finally {
        copyrightOwnerLoading.value = false
    }
}


/** 内容等级下拉 选项、loading */
const contentRatingOptions = ref<{ label: string; value: string }[]>([])
const contentRatingLoading = ref(false)

async function loadContentRatingOptions(force = false) {
    if (!canListContentRating.value) { // 如果没有 list 权限，不加载内容等级下拉列表
        contentRatingOptions.value = []
        contentRatingLoading.value = false
        return
    }
    // 内容等级基础字典缓存（变更频率低，可用较长 TTL）
    if (!force && isCacheValid(dictCache.contentRating.expiresAt) && dictCache.contentRating.data.length > 0) {
        contentRatingOptions.value = [...dictCache.contentRating.data]
        return
    }
    contentRatingLoading.value = true
    try {
        const res: any = await getContentRatingList()
        const body = res?.data ?? res
        let list: any[] = []
        if (body?.code === 200 && body.data != null) {
            list = Array.isArray(body.data) ? body.data : []
        } else if (Array.isArray(body?.data)) {
            list = body.data
        } else if (Array.isArray(body)) {
            list = body
        }
        contentRatingOptions.value = list
            .map((row) => {
                const name = String(row?.ratingName ?? '').trim()
                const code = String(row?.ratingCode ?? '').trim()
                const value = code || name
                const label = name && code ? `${name}（${code}）` : name || code || value
                return value ? { label, value } : null
            })
            .filter(Boolean) as { label: string; value: string }[]
        dictCache.contentRating.data = [...contentRatingOptions.value]
        dictCache.contentRating.expiresAt = Date.now() + DICT_CACHE_TTL.contentRating
    } catch {
        contentRatingOptions.value = []
    } finally {
        contentRatingLoading.value = false
    }
}


// 情节标签下拉：GET /api/tagInfo/list，按语言过滤（与类型标签一致）
const allTagRecords = ref<
    Array<{ languageCode?: string; tagCode?: string; tagName?: string; tagNameLanguage?: string }>
>([])
const allTagLoaded = ref(false)
const allTagLoading = ref(false)
const plotTagOptions = ref<{ label: string; value: string }[]>([])

async function loadAllTagData() {
    if (allTagLoading.value) return
    allTagLoading.value = true
    try {
        const res: any = await getTagInfoList()
        const body = res?.data ?? res
        let list: any[] = []
        if (body?.code === 200 && body.data != null) {
            list = Array.isArray(body.data) ? body.data : []
        } else if (Array.isArray(body?.data)) {
            list = body.data
        } else if (Array.isArray(body)) {
            list = body
        }
        allTagRecords.value = list.map((r) => ({
            languageCode: r?.languageCode,
            tagCode: r?.tagCode != null ? String(r.tagCode) : '',
            tagName: r?.tagName != null ? String(r.tagName) : '',
            tagNameLanguage: r?.tagNameLanguage != null ? String(r.tagNameLanguage) : '',
        }))
        allTagLoaded.value = true
    } catch {
        allTagRecords.value = []
    } finally {
        allTagLoading.value = false
    }
}

function filterPlotTagsByLanguage(languageCode: string | undefined) {
    const lang = languageCode?.trim()
    if (!lang) return []
    return allTagRecords.value.filter(
        (record) => !record.languageCode || record.languageCode === lang
    )
}

function buildPlotOptionsForLanguage(languageCode: string | undefined) {
    const lang = languageCode?.trim()
    if (!lang) return [] as { label: string; value: string }[]
    return filterPlotTagsByLanguage(lang)
        .map((record) => {
            const value = record.tagCode || record.tagName || ''
            const tagName = (record.tagName ?? '').trim()
            const tagIntlName = (record.tagNameLanguage ?? '').trim()
            const label =
                tagName && tagIntlName && tagName !== tagIntlName
                    ? `${tagName}（${tagIntlName}）`
                    : tagName || tagIntlName || record.tagCode || value
            return value ? { label, value } : null
        })
        .filter(Boolean) as { label: string; value: string }[]
}

function loadPlotTagOptions(languageCode: string | undefined) {
    plotTagOptions.value = buildPlotOptionsForLanguage(languageCode)
}

function loadEditFormPlotTagOptions(languageCode: string | undefined) {
    editFormPlotTagOptions.value = buildPlotOptionsForLanguage(languageCode)
}

async function ensureTagAndCategoryLoaded() {
    // 懒加载：只有真正需要类型/情节数据时才请求
    const tasks: Promise<any>[] = []
    if (!allCategoryLoaded.value) tasks.push(loadAllCategoryData())
    if (!allTagLoaded.value) tasks.push(loadAllTagData())
    if (tasks.length) await Promise.allSettled(tasks)
}

async function ensureDialogDictionariesLoaded() {
    // 弹窗依赖字典（语言/版权方/内容等级/标签）按需加载
    await Promise.allSettled([
        loadLanguageOptions(),
        loadCopyrightOwnerOptions(),
        loadContentRatingOptions(),
        ensureTagAndCategoryLoaded(),
    ])
}

async function onCategoryDropdownVisible(visible: boolean) {
    if (!visible) return
    // 用户展开筛选下拉时再加载重字典，减少首屏阻塞
    await ensureTagAndCategoryLoaded()
    loadCategoryOptions(searchForm.languageCode || undefined)
}

async function onPlotTagDropdownVisible(visible: boolean) {
    if (!visible) return
    // 用户展开筛选下拉时再加载重字典，减少首屏阻塞
    await ensureTagAndCategoryLoaded()
    loadPlotTagOptions(searchForm.languageCode || undefined)
}

/** 列表展示：接口可能返回逗号串或字符串数组 → 标签文案数组 */
function splitCommaList(tagSource: string | string[] | undefined | null): string[] {
    if (tagSource == null || tagSource === '') return []
    if (Array.isArray(tagSource))
        return tagSource.map((tagItem) => String(tagItem).trim()).filter(Boolean)
    if (typeof tagSource !== 'string') return []
    return tagSource
        .split(',')
        .map((tagItem) => tagItem.trim())
        .filter(Boolean)
}

/** 列表格：标签单行展示用，顿号连接 */
function tagsLineText(tagSource: string | string[] | undefined | null): string {
    return splitCommaList(tagSource).join('、')
}

/** 列表「配音/字幕」：subtitleLanguageName+subtitleLanguageCode 为配音；languageName+languageCode 为字幕；示例：id / en */
function formatLangNameCode(name?: string | null, code?: string | null): string {
    const c = String(code ?? '').trim()
    if (!c) return ' -- '
    return c ? ` ${c} ` : ''
}

function dubSubtitleLineText(row: DramaRecord): string {
    const dub = formatLangNameCode(row.subtitleLanguageName, row.subtitleLanguageCode)
    const sub = formatLangNameCode(row.languageName, row.languageCode)
    if (!dub && !sub) return ''
    if (dub && sub) return `${dub}/${sub}`
    return dub || sub
}

function truncateMiddleTitle(s: string, maxLen: number) {
    const t = String(s ?? '')
    if (!t || t === '—') return t || '—'
    if (t.length <= maxLen) return t
    const ellipsis = '...'
    if (maxLen <= ellipsis.length) return t.slice(0, maxLen)
    const avail = maxLen - ellipsis.length
    const leftLen = Math.ceil(avail / 2)
    const rightLen = Math.floor(avail / 2)
    return `${t.slice(0, leftLen)}${ellipsis}${t.slice(-rightLen)}`
}

function isTitleMiddleTruncated(raw: string, maxLen: number): boolean {
    const s = String(raw ?? '').trim()
    if (!s) return false
    return truncateMiddleTitle(s, maxLen) !== s
}

async function copyCellText(text: string | number | null | undefined, label: string) {
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

/** 剧集数列：已上传/总数，排序仍用 prop=dramaCount（总集数） */
function formatDramaEpisodeRatio(row: DramaRecord): string {
    const total = row.dramaCount
    const up = row.uploadedDramaCount
    const tStr = typeof total === 'number' && Number.isFinite(total) ? String(total) : '--'
    const uStr = typeof up === 'number' && Number.isFinite(up) ? String(up) : '--'
    return `${uStr}/${tStr}`
}

function safeEpisodeCount(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 0
    return Math.max(0, Math.floor(value))
}

function isEpisodeRatioProcessing(row: DramaRecord): boolean {
    const total = row.dramaCount
    const uploaded = row.uploadedDramaCount
    if (typeof total !== 'number' || !Number.isFinite(total)) return false
    if (typeof uploaded !== 'number' || !Number.isFinite(uploaded)) return false
    return uploaded < total
}

function episodeProgressTooltip(row: DramaRecord): string {
    if (!isEpisodeRatioProcessing(row)) return ''
    const total = safeEpisodeCount(row.dramaCount)
    const processed = safeEpisodeCount(row.uploadedDramaCount)
    const processing = safeEpisodeCount(row.processingDramaCount)
    const uploading = safeEpisodeCount(row.uploadingDramaCount)
    const fail = safeEpisodeCount(row.failProcessedDramaCount)
    const pending = Math.max(0, total - processed - processing - uploading)
    return `处理完成: ${processed} | 处理中: ${processing} | 上传中: ${uploading} | 待上传: ${pending}（其中上传失败: ${fail}）`
}

// 编辑/新增短剧对话框（共用同一表单）
const editDialogVisible = ref(false)
const editDialogTitle = ref('编辑短剧')
const editFormRef = ref<FormInstance>()
const editSubmitLoading = ref(false)
const editingRowId = ref<string | null>(null)

// 查看短剧内容对话框
const contentDialogVisible = ref(false)
const contentDialogRow = ref<DramaRecord | null>(null)

function openDramaContentDialog(row: DramaRecord) {
    contentDialogRow.value = row
    contentDialogVisible.value = true
}

function resetDramaContentDialog() {
    contentDialogRow.value = null
}

const expiryTimeText = computed(() => {
    const currentDrama = contentDialogRow.value as any
    return (
        currentDrama?.copyrightSourceInfo?.expiryDate ??
        currentDrama?.expiryDate ??
        currentDrama?.expiryTime ??
        currentDrama?.expireTime ??
        currentDrama?.expirationDate ??
        currentDrama?.expireDate ??
        '—'
    )
})

// 编辑表单内语言下拉：与筛选共用接口，若已加载则用 languageOptions，否则可单独请求
const subtitleLanguageOptions = ref<
    { languageName: string; languageCode: string; label: string }[]
>([])


const sexOptions = [
    { label: '全部', value: 0 as SexNum },
    { label: '男频', value: 1 as SexNum },
    { label: '女频', value: 2 as SexNum },
]

const dramaStatusOptions = [
    { label: '下线', value: 0 as DramaStatusNum },
    { label: '上线', value: 1 as DramaStatusNum },
]

/**
 * 短剧封面选择变更（el-upload @change）
 * 第一步：校验扩展名为图片（png/jpg/webp/gif/bmp），否则清空并提示
 * 第二步：revoke 上一项及 dramaCoverPreviewUrl 的 blob
 * 第三步：创建新 blob URL 写入 dramaCoverPreviewUrl，并写入 dramaCoverFileList（含 raw 供保存时上传）
 */
async function onDramaCoverFileChange(
    uploadFile: { raw?: File; name?: string },
    fileList: { raw?: File; name?: string }[]
) {
    const raw =
        (fileList?.length ? fileList[fileList.length - 1]?.raw : uploadFile?.raw) || uploadFile?.raw
    if (!raw) return
    const coverErr = await getDramaCoverImageValidationError(raw)
    if (coverErr) {
        ElMessage.error(coverErr)
        dramaCoverFileList.value = []
        dramaCoverUploadRef.value?.clearFiles?.()
        return
    }
    const prev = dramaCoverFileList.value[0]
    if (prev?.url && prev.url.startsWith('blob:')) URL.revokeObjectURL(prev.url)
    if (dramaCoverPreviewUrl.value && dramaCoverPreviewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(dramaCoverPreviewUrl.value)
    }
    dramaCoverPreviewUrl.value = URL.createObjectURL(raw)
    dramaCoverFileList.value = [
        { name: raw.name, url: dramaCoverPreviewUrl.value, raw, uid: Date.now() },
    ]
}

/**
 * 短剧封面已达 limit=1 时再次选择文件（@exceed）：用新文件替换原封面
 */
async function onDramaCoverExceed(files: File[]) {
    const raw = files?.[0]
    if (!raw) return
    const coverErr = await getDramaCoverImageValidationError(raw)
    if (coverErr) {
        ElMessage.error(coverErr)
        return
    }
    const prev = dramaCoverFileList.value[0]
    if (prev?.url && prev.url.startsWith('blob:')) URL.revokeObjectURL(prev.url)
    if (dramaCoverPreviewUrl.value && dramaCoverPreviewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(dramaCoverPreviewUrl.value)
    }
    dramaCoverPreviewUrl.value = URL.createObjectURL(raw)
    dramaCoverFileList.value = [
        { name: raw.name, url: dramaCoverPreviewUrl.value, raw, uid: Date.now() },
    ]
}

/**
 * 删除所选短剧封面（el-upload @remove）
 * 释放 blob、清空 dramaCoverPreviewUrl；若删除的是「当前封面」虚拟项（无 raw）则清空 existingDramaCoverUrl
 */
function onDramaCoverRemove(file: DramaCoverUploadItem) {
    if (file?.url && file.url.startsWith('blob:')) URL.revokeObjectURL(file.url)
    if (dramaCoverPreviewUrl.value && dramaCoverPreviewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(dramaCoverPreviewUrl.value)
    }
    dramaCoverPreviewUrl.value = ''
    if (!file?.raw) {
        existingDramaCoverUrl.value = ''
        editForm.coverImg = ''
    }
}

/** 与用户管理选图一致：侧栏「移除」清空已选/当前封面 */
function handleDramaCoverPickRemove() {
    dramaCoverFileList.value.forEach((f) => {
        if (f?.url && f.url.startsWith('blob:')) URL.revokeObjectURL(f.url)
    })
    if (dramaCoverPreviewUrl.value?.startsWith('blob:'))
        URL.revokeObjectURL(dramaCoverPreviewUrl.value)
    dramaCoverPreviewUrl.value = ''
    existingDramaCoverUrl.value = ''
    editForm.coverImg = ''
    dramaCoverFileList.value = []
    dramaCoverUploadRef.value?.clearFiles?.()
}

const editForm = reactive({
    originVid: '',
    title: '',
    titleLanguage: '',
    languageName: '',
    languageCode: '' as string,
    subtitleLanguageName: '',
    subtitleLanguageCode: '' as string,
    coverImg: '',
    description: '',
    sex: 0 as SexNum,
    dramaCount: 0,
    dramaCategories: [] as string[],
    dramaTags: [] as string[],
    copyrightCode: '' as string,
    dramaLanguageCategories: '' as string,
    publishTime: '' as string,
    expiryDate: '' as string,
    status: 1 as DramaStatusNum,
    contentCode: '', /** 内容等级编码 */
    pin: 0 as PinStatusNum
})

const editFormRules: FormRules = {
    title: [{ required: true, message: '请输入原始剧名', trigger: 'blur' }],
    titleLanguage: [{ required: true, message: '请输入上线剧名', trigger: 'blur' }],
    languageCode: [{ required: true, message: '请选择字幕语言', trigger: 'change' }],
    subtitleLanguageCode: [{ required: true, message: '请选择配音语言', trigger: 'change' }],
    dramaCategories: [
        { required: true, message: '请选择类型标签', trigger: 'change' },
        {
            type: 'array',
            min: 1,
            message: '请至少选择一个类型标签',
            trigger: 'change',
        },
    ],
    dramaCount: [
        { required: true, message: '请输入剧集数', trigger: 'blur' },
        { type: 'number', min: 1, max: 9999, message: '剧集数为 1-9999', trigger: 'blur' },
    ],
    copyrightCode: [{ required: true, message: '请选择版权方', trigger: 'change' }],
}

/**
 * 重置编辑/新增短剧表单：清空所有字段、清空 editingRowId、恢复弹窗标题为「编辑短剧」、调用 resetFields
 */
function resetEditForm() {
    tagPickerDialogVisible.value = false
    tagPickerTempSelected.value = []
    tagPickerKeyword.value = ''
    persistedCategoryValues.value = []
    persistedPlotTagValues.value = []
    resetTagPickerInlineAddForm()
    editForm.originVid = ''
    editForm.title = ''
    editForm.titleLanguage = ''
    editForm.languageName = ''
    editForm.languageCode = ''
    editForm.subtitleLanguageName = ''
    editForm.subtitleLanguageCode = ''
    editForm.coverImg = ''
    editForm.description = ''
    editForm.sex = 0
    editForm.dramaCount = 0
    editForm.dramaCategories = []
    editForm.dramaTags = []
    editForm.copyrightCode = ''
    editForm.dramaLanguageCategories = ''
    editForm.publishTime = ''
    editForm.expiryDate = ''
    editForm.status = 1
    editForm.pin = 0
    editForm.contentCode = 'S'
    // 清空封面上传状态
    dramaCoverFileList.value.forEach((f) => {
        if (f.url && f.url.startsWith('blob:')) URL.revokeObjectURL(f.url)
    })
    dramaCoverFileList.value = []
    dramaCoverPreviewUrl.value = ''
    existingDramaCoverUrl.value = ''
    dramaCoverUploadRef.value?.clearFiles?.()
    editingRowId.value = null
    editDialogTitle.value = '编辑短剧'
    editFormRef.value?.resetFields()
}

/**
 * 打开「新增短剧」弹窗
 * 第一步：设置标题为「新增短剧」、editingRowId 置空
 * 第二步：表单赋默认值（语言取 languageOptions 首项、版权方取首项、来源 "Original"、剧集数 1 等）
 * 第三步：显示弹窗并拉取当前语言下的类型标签选项
 */
async function openAddDramaDialog() {
    // 懒加载：仅在打开弹窗时保证字典齐全
    await ensureDialogDictionariesLoaded()
    editDialogTitle.value = '新增短剧'
    editingRowId.value = null
    editForm.originVid = ''
    editForm.title = ''
    editForm.titleLanguage = ''
    editForm.languageName = languageOptions.value[0]?.languageName ?? ''
    editForm.languageCode = languageOptions.value[0]?.languageCode ?? ''
    editForm.subtitleLanguageName = languageOptions.value[0]?.languageName ?? ''
    editForm.subtitleLanguageCode = languageOptions.value[0]?.languageCode ?? ''
    editForm.coverImg = ''
    editForm.description = ''
    editForm.sex = 0
    editForm.dramaCount = 1
    editForm.dramaCategories = []
    editForm.dramaTags = []
    persistedCategoryValues.value = []
    persistedPlotTagValues.value = []
    resetTagPickerInlineAddForm()
    editForm.copyrightCode = copyrightOwnerOptions.value[0]?.value ?? ''
    editForm.dramaLanguageCategories = ''
    editForm.publishTime = ''
    editForm.expiryDate = ''
    editForm.status = 0
    // 新增时无已有封面，清空上传状态
    dramaCoverFileList.value = []
    dramaCoverPreviewUrl.value = ''
    existingDramaCoverUrl.value = ''
    dramaCoverUploadRef.value?.clearFiles?.()
    editDialogVisible.value = true
    loadEditFormCategoryOptions(editForm.languageCode || undefined)
    loadEditFormPlotTagOptions(editForm.languageCode || undefined)
}

/**
 * 打开「编辑短剧」弹窗并回填当前行数据
 * 第一步：设置标题、editingRowId 为 row.id
 * 第二步：将 row 各字段写入 editForm（dramaCategories 按逗号拆成数组）
 * 第三步：显示弹窗并拉取该语言下的类型标签选项
 * @param row 列表当前行短剧数据
 */
async function openEditDialog(row: DramaRecord) {
    // 懒加载：仅在打开弹窗时保证字典齐全
    await ensureDialogDictionariesLoaded()
    editDialogTitle.value = '编辑短剧'
    editingRowId.value = String(row.id)
    editForm.originVid = row.originVid
    editForm.title = row.title
    editForm.titleLanguage = row.titleLanguage ?? ''
    editForm.languageName = row.languageName
    editForm.languageCode = row.languageCode
    editForm.subtitleLanguageName = row.subtitleLanguageName ?? row.languageName ?? ''
    editForm.subtitleLanguageCode = row.subtitleLanguageCode ?? row.languageCode ?? ''
    // 保留原始封面 URL 供提交时回退使用
    editForm.coverImg = row.coverImg ?? ''
    existingDramaCoverUrl.value = row.coverImg ?? ''
    dramaCoverFileList.value.forEach((f) => {
        if (f.url && f.url.startsWith('blob:')) URL.revokeObjectURL(f.url)
    })
    dramaCoverFileList.value = existingDramaCoverUrl.value
        ? [{ name: '当前封面', url: existingDramaCoverUrl.value, uid: -1 }]
        : []
    dramaCoverPreviewUrl.value = ''
    editForm.description = row.description ?? ''
    editForm.sex = row.sex
    editForm.dramaCount = row.dramaCount
    editForm.dramaCategories = splitCommaList(
        row.dramaCategories as unknown as string | string[] | undefined
    )
    editForm.copyrightCode = (row.copyrightSourceInfo?.copyrightCode ?? '').trim()
    editForm.dramaTags = row.dramaTagsCodes ? splitCommaList(row.dramaTagsCodes) : []
    persistedCategoryValues.value = [...editForm.dramaCategories]
    persistedPlotTagValues.value = [...editForm.dramaTags]
    resetTagPickerInlineAddForm()
    editForm.dramaLanguageCategories = row.dramaLanguageCategories ?? ''
    editForm.publishTime = row.publishTime ?? ''
    editForm.expiryDate = row.expiryDate ?? ''
    editForm.status = row.status
    editForm.pin = row.pin
    editForm.contentCode = (row.contentRating?.ratingCode ?? '').trim()
    editDialogVisible.value = true
    loadEditFormCategoryOptions(editForm.languageCode || undefined)
    loadEditFormPlotTagOptions(editForm.languageCode || undefined)
}

/**
 * 提交编辑/新增短剧
 * 第一步：表单校验，不通过则 return
 * 第二步：若有本次所选封面，则先 uploadByPut 获取封面 URL；编辑时以 existingDramaCoverUrl 为准（移除后为空串）
 * 第三步：根据 editingRowId 判断新增或编辑；组装 payload（dramaCategories 转逗号字符串等）
 * 第四步：调用 addDrama 或 updateDrama；成功则关闭弹窗并刷新列表，失败则提示
 * @throws 接口异常时在 catch 中提示「操作失败」
 */
async function submitEdit() {
    if (!editFormRef.value) return
    const valid = await editFormRef.value.validate().catch(() => false)
    if (!valid) return
    editSubmitLoading.value = true
    try {
        const isAdd = editingRowId.value == null

        // 处理封面：新文件则 uploadByPut；编辑时仅以 existingDramaCoverUrl / 文件列表为准，
        // 勿用 editForm.coverImg 作回退（移除封面后 editForm.coverImg 仍可能是打开弹窗时的旧值）
        let coverImgUrl = ''
        const coverRaw = dramaCoverFileList.value[0]?.raw
        if (coverRaw) {
            try {
                coverImgUrl = await uploadByPut(coverRaw, 'drama/cover')
            } catch (e: any) {
                ElMessage.error(e?.message ?? '封面上传失败')
                return
            }
        } else if (!isAdd) {
            coverImgUrl = existingDramaCoverUrl.value || ''
        } else {
            coverImgUrl = editForm.coverImg || ''
        }

        // 根据所选分类（value）从选项中取 categoryCode
        const dramaCategoriesCodeStr = Array.isArray(editForm.dramaCategories)
            ? editForm.dramaCategories
                  .map((categoryValue) => {
                      const matchedCategory = editFormCategoryOptions.value.find(
                          (category) => category.value === categoryValue
                      )
                      return matchedCategory?.code ?? ''
                  })
                  .filter(Boolean)
                  .join(',')
            : ''
        const dramaTagsCodesStr = Array.isArray(editForm.dramaTags)
            ? editForm.dramaTags.filter(Boolean).join(',')
            : ''

        if (isAdd) {
            const payload: AddDramaParams = {
                originVid: editForm.originVid || '',
                languageCode: editForm.languageCode,
                title: editForm.title,
                titleLanguage: editForm.titleLanguage,
                coverImg: coverImgUrl,
                description: editForm.description,
                sex: editForm.sex,
                dramaCount: editForm.dramaCount,
                copyrightCode: editForm.copyrightCode,
                status: editForm.status,
                seriesStatus: 1 as SeriesStatusNum,
                publishTime: editForm.publishTime || undefined,
                dramaTagsCodes: dramaTagsCodesStr,
                dramaCategoriesCodes: dramaCategoriesCodeStr || '',
                subtitleLanguageCode: editForm.subtitleLanguageCode,
            }
            const addRes = await addDrama(payload)
            const data = addRes.data
            if (Number(data?.code) === 200) {
                ElMessage.success('新增成功')
                editDialogVisible.value = false
                loadList()
            } else {
                ElMessage.error(data?.message ?? '新增失败')
            }
        } else {
            const row = sourceList.value.find((r) => String(r.id) === editingRowId.value)
            if (!row) {
                ElMessage.error('未找到当前短剧')
                return
            }
            const payload: UpdateDramaParams = {
                id: row.id,
                originVid: editForm.originVid ?? '',
                languageCode: editForm.languageCode,
                title: editForm.title,
                titleLanguage: editForm.titleLanguage,
                coverImg: coverImgUrl ?? '',
                description: editForm.description ?? '',
                sex: editForm.sex,
                dramaCount: editForm.dramaCount,
                copyrightCode: editForm.copyrightCode,
                status: editForm.status,
                seriesStatus: 1 as SeriesStatusNum,
                publishTime: editForm.publishTime || undefined,
                dramaTagsCodes: dramaTagsCodesStr,
                dramaCategoriesCodes: dramaCategoriesCodeStr || '',
                subtitleLanguageCode: editForm.subtitleLanguageCode,
                pin: editForm.pin, //置顶
                contentCode: editForm.contentCode, //内容等级编码
            }
            const updateRes = await updateDrama(payload)
            const data = updateRes.data
            if (Number(data?.code) === 200 && data?.data !== false) {
                ElMessage.success(data?.message?.trim() || '保存成功')
                editDialogVisible.value = false
                loadList()
            } else {
                ElMessage.error(data?.message ?? '保存失败')
            }
        }
    } catch (error) {
        console.error('短剧保存失败', error)
        ElMessage.error('操作失败')
    } finally {
        editSubmitLoading.value = false
    }
}

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
/** 当前列表请求控制器：用于取消未完成请求 */
let listAbortController: AbortController | null = null
/** 请求序号：仅允许最后一次请求回写结果 */
let latestListRequestId = 0
/** 防抖计时器：合并短时间内连续筛选动作 */
let listDebounceTimer: ReturnType<typeof setTimeout> | null = null

// 表头排序状态（点击切换 升序/降序）
const sortProp = ref<string>('')
const sortOrder = ref<'ascending' | 'descending' | null>(null)

const router = useRouter()
const route = useRoute() 
const sourceList = ref<DramaRecord[]>([])
const total = ref(0)

/**
 * 将分页接口返回的单条记录转为列表使用的 DramaRecord
 * 含 statusEnabled（status === 1）供表格开关绑定
 * @param r 分页接口单条记录
 * @returns 列表行数据结构 DramaRecord
 */
function mapPageRecordToDramaRecord(record: import('@/api/drama').DramaPageRecord): DramaRecord {
    const ext = record as import('@/api/drama').DramaPageRecord & Record<string, unknown>
    const catRaw = ext.dramaCategories
    let dramaCategoriesStr = ''
    if (Array.isArray(catRaw)) {
        dramaCategoriesStr = catRaw
            .map((x) => String(x).trim())
            .filter(Boolean)
            .join(',')
    } else if (typeof catRaw === 'string') {
        dramaCategoriesStr = catRaw
    }
    const plotRaw =
        ext.plotTags ?? ext.dramaTags ?? (ext as any).dramaPlotTags ?? (ext as any).tagNames
    let plotTagsStr = ''
    if (Array.isArray(plotRaw)) {
        plotTagsStr = plotRaw
            .map((x) => String(x))
            .filter(Boolean)
            .join(',')
    } else if (typeof plotRaw === 'string') {
        plotTagsStr = plotRaw
    }
    return {
        id: record.id,
        vid: record.vid ?? '',
        originVid: record.originVid ?? record.vid ?? String(record.id),
        languageName: record.languageName,
        languageCode: record.languageCode,
        subtitleLanguageName: (record as any).subtitleLanguageName,
        subtitleLanguageCode: (record as any).subtitleLanguageCode,
        title: record.title,
        titleLanguage: record.titleLanguage,
        coverImg: record.coverImg ?? '',
        description: record.description ?? '',
        sex: record.sex,
        dramaCount: record.dramaCount,
        uploadedDramaCount: record.uploadedDramaCount,
        processingDramaCount: (record as any).processingDramaCount,
        uploadingDramaCount: (record as any).uploadingDramaCount,
        failProcessedDramaCount: (record as any).failProcessedDramaCount,
        totalLikesCount: record.totalLikesCount,
        totalCollectCount: record.totalCollectCount,
        totalPlayCount: record.totalPlayCount,
        dramaCategories: dramaCategoriesStr,
        plotTags: plotTagsStr,
        dramaLanguageCategories: (record as any).dramaLanguageCategories ?? '',
        copyrightCode: (ext.copyrightCode as string | undefined) ?? '',
        copyrightSourceInfo:
            (ext.copyrightSourceInfo as DramaRecord['copyrightSourceInfo']) ?? undefined,
        dramaTagsCodes: (ext.dramaTagsCodes as string | undefined) ?? '',
        publishTime: (record as any).publishTime ?? '',
        createdAt: (record as any).createdAt ?? '',
        updatedAt: record.updatedAt ?? '',
        expiryDate: (record as any).expiryDate ?? '',
        vodSubAppId:
            typeof (record as any).vodSubAppId === 'number'
                ? (record as any).vodSubAppId
                : (record as any).vodSubAppId == null
                  ? undefined
                  : Number((record as any).vodSubAppId) || undefined,
        status: record.status,
        seriesStatus: record.seriesStatus,
        statusEnabled: record.status === 1,
        /** 内容等级 */
        contentRating: (record as any).contentRating ?? '',
        /** 是否置顶 0 未置顶 1置顶 */
        pin: record.pin,
        stickyEnabled: record.pin === 1,
        /** 热度值 */
        popularityScore: record.popularityScore
    }
}

/**
 * 封面图展示用：仅当 URL 以 http/https 开头时返回原值，否则返回空字符串
 * 避免相对路径或纯域名被当成当前站点路径请求（如 123.com → localhost:3001/123.com）
 * @param url 封面图 URL（可能为空或非绝对地址）
 * @returns 可安全用于 el-image src 的字符串
 */
function coverImageSrc(url: string | undefined): string {
    if (!url || typeof url !== 'string') return ''
    const t = url.trim()
    if (t.startsWith('http://') || t.startsWith('https://')) return t
    return ''
}

// 当前页表格数据：按表头排序（点击排序时对当前页数据排序）
const tableData = computed(() => {
    const currentPageRows = [...sourceList.value]
    const sortField = sortProp.value
    const sortDirection = sortOrder.value
    if (!sortField || !sortDirection) return currentPageRows
    const isAscendingOrder = sortDirection === 'ascending'
    return currentPageRows.sort((leftRow, rightRow) => {
        const leftValue = (leftRow as Record<string, unknown>)[sortField]
        const rightValue = (rightRow as Record<string, unknown>)[sortField]
        if (typeof leftValue === 'number' && typeof rightValue === 'number') {
            return isAscendingOrder ? leftValue - rightValue : rightValue - leftValue
        }
        if (typeof leftValue === 'boolean' && typeof rightValue === 'boolean') {
            const leftBooleanAsNumber = leftValue ? 1 : 0
            const rightBooleanAsNumber = rightValue ? 1 : 0
            return isAscendingOrder
                ? leftBooleanAsNumber - rightBooleanAsNumber
                : rightBooleanAsNumber - leftBooleanAsNumber
        }
        const leftText = String(leftValue ?? '')
        const rightText = String(rightValue ?? '')
        const compareResult = leftText.localeCompare(rightText, 'zh-CN')
        return isAscendingOrder ? compareResult : -compareResult
    })
})

/**
 * 加载短剧列表（分页）
 * 第一步：根据 searchForm 组装请求参数（vid、title、languageCode、status、copyrightCode、dramaCategories）
 * 第二步：调用 getDramaPage，将 records 映射为 DramaRecord 写入 sourceList，total 写入 total
 * 第三步：失败时清空列表并提示
 */
async function loadListNow() {
    loading.value = true
    // 新请求发起前，取消上一次未完成请求
    if (listAbortController) listAbortController.abort()
    listAbortController = new AbortController()
    const requestId = ++latestListRequestId
    const startTime = Date.now()
    try {
        const res = await getDramaPage(
            {
                current: currentPage.value,
                size: pageSize.value,
                vid: searchForm.vid?.trim() || undefined,
                title: searchForm.title?.trim() || undefined,
                languageCode: searchForm.languageCode || undefined,
                status:
                    searchForm.status !== '' && searchForm.status !== null
                        ? (searchForm.status as 0 | 1)
                        : undefined,
                pin: searchForm.pin === 0 || searchForm.pin === 1 ? searchForm.pin : undefined,
                copyrightCode: searchForm.copyrightCode || undefined,
                dramaCategoriesCodes:
                    Array.isArray(searchForm.dramaCategoriesCodes) &&
                    searchForm.dramaCategoriesCodes.length > 0
                        ? searchForm.dramaCategoriesCodes
                        : undefined,
                dramaTagsCodes:
                    Array.isArray(searchForm.dramaTagsCodes) && searchForm.dramaTagsCodes.length > 0
                        ? searchForm.dramaTagsCodes
                        : undefined,
            },
            { signal: listAbortController.signal }
        )
        // 若该响应不是“最新请求”，直接丢弃避免脏数据覆盖
        if (requestId !== latestListRequestId) return
        const body = res.data
        if (body?.code === 200 && body.data) {
            sourceList.value = (body.data.records || []).map(mapPageRecordToDramaRecord)
            total.value = body.data.total ?? 0
        } else {
            sourceList.value = []
            total.value = 0
            if (body?.message) ElMessage.error(body.message)
        }
    } catch (e: any) {
        if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return
        console.error('短剧列表加载失败', e)
        sourceList.value = []
        total.value = 0
        ElMessage.error('列表加载失败')
    } finally {
        if (requestId !== latestListRequestId) return
        const elapsed = Date.now() - startTime
        const MIN_LOADING_MS = 300
        if (elapsed < MIN_LOADING_MS) {
            await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed))
        }
        loading.value = false
    }
}

function loadList() {
    return loadListNow()
}

function loadListDebounced(wait = 250) {
    // 防抖：筛选频繁变化时只发最后一次请求
    if (listDebounceTimer) clearTimeout(listDebounceTimer)
    listDebounceTimer = setTimeout(() => {
        listDebounceTimer = null
        void loadListNow()
    }, wait)
}

/**
 * 搜索：当前页置为 1 并重新拉取列表
 */
function handleSearch() {
    currentPage.value = 1
    syncRouteQuery()
    loadListDebounced(200)
}

/**
 * 重置筛选：清空 searchForm 所有筛选项、当前页置 1、重新拉取列表
 */
function handleReset() {
    searchForm.vid = ''
    searchForm.title = ''
    searchForm.copyrightCode = ''
    searchForm.languageCode = ''
    searchForm.dramaCategoriesCodes = []
    searchForm.dramaTagsCodes = []
    searchForm.status = ''
    searchForm.pin = ''
    currentPage.value = 1
    syncRouteQuery()
    loadCategoryOptions(undefined)
    loadPlotTagOptions(undefined)
    loadListDebounced(200)
}

/**
 * 分页每页条数变更：当前页置 1 并重新拉取列表
 */
function handleSizeChange() {
    currentPage.value = 1
    syncRouteQuery()
    void loadListNow()
}

/**
 * 分页当前页变更：重新拉取列表
 */
function handleCurrentChange(val) {
    currentPage.value = val        // 比如切到第3页
    syncRouteQuery()
    void loadListNow()
}

function buildListQuery() {
    const query: Record<string, string> = {
        page: String(currentPage.value),
        size: String(pageSize.value),
    }
    if (searchForm.vid?.trim()) query.vid = searchForm.vid.trim()
    if (searchForm.title?.trim()) query.title = searchForm.title.trim()
    if (searchForm.copyrightCode?.trim()) query.copyrightCode = searchForm.copyrightCode.trim()
    if (searchForm.languageCode?.trim()) query.languageCode = searchForm.languageCode.trim()
    if (searchForm.status !== '' && searchForm.status !== null) query.status = String(searchForm.status)
    if (searchForm.pin === 0 || searchForm.pin === 1) query.pin = String(searchForm.pin)
    if (searchForm.dramaCategoriesCodes.length) {
        query.dramaCategoriesCodes = searchForm.dramaCategoriesCodes.join(',')
    }
    if (searchForm.dramaTagsCodes.length) query.dramaTagsCodes = searchForm.dramaTagsCodes.join(',')
    return query
}

function syncRouteQuery() {
    router.replace({ query: buildListQuery() })
}

function parseQueryString(value: unknown): string {
    if (Array.isArray(value)) return String(value[0] ?? '')
    if (value == null) return ''
    return String(value)
}

/**
 * 表头排序变更：记录当前排序字段与升/降序，供 tableData 计算属性使用
 * @param prop 排序字段名；order 为 'ascending' | 'descending' | null
 */
function handleSortChange({ prop, order }: { prop: string; order: string | null }) {
    sortProp.value = prop || ''
    sortOrder.value = order === 'ascending' || order === 'descending' ? order : null
}

/**
 * 点击「添加」：打开新增短剧弹窗
 */
function handleAdd() {
    void openAddDramaDialog()
}

/**
 * 点击「编辑」：打开编辑短剧弹窗并回填当前行
 * @param row 当前行短剧数据
 */
function handleEdit(row: DramaRecord) {
    console.log("----row-----",row);
    
    void openEditDialog(row)
}

/**
 * 跳转到剧集管理页（当前短剧的集数管理）
 * 第一步：将当前短剧信息写入 sessionStorage（key: drama_episodes_${vid}），供剧集页恢复标题、语言、总集数等
 * 第二步：路由跳转到 /drama/contentManagement/episodes/:id（id 为短剧 vid）
 * @param row 当前行短剧数据，含 vid、title、coverImg、languageCode、dramaCategories、dramaCount
 */
function openEpisodeManage(row: DramaRecord) {
    try {
        const key = `drama_episodes_${row.vid}`
        sessionStorage.setItem(
            key,
            JSON.stringify({
                drama: {
                    id: row.vid,
                    title: row.title,
                    titleLanguage: row.titleLanguage,
                    description: row.description,
                    coverImg: row.coverImg,
                    languageCode: row.languageCode,
                    languageName: row.languageName,
                    dramaCategories: row.dramaCategories,
                    dramaCount: row.dramaCount,
                    uploadedDramaCount: row.uploadedDramaCount,
                    seriesStatus: row.seriesStatus,
                    vodSubAppId: row.vodSubAppId,
                },
            })
        )
    } catch {
        // ignore
    }
    router.push({
        name: 'operationDramaContentEpisodes',
        params: { id: row.vid },
        query: buildListQuery(),
    })
}

/**
 * 删除短剧
 * 第一步：二次确认弹窗
 * 第二步：调用 deleteDrama(row.id)；成功则提示并刷新列表，失败则提示
 * @param row 当前行短剧数据
 */
async function handleDelete(row: DramaRecord) {
    const dramaTitle =
        String(row.titleLanguage ?? '').trim() ||
        String(row.title ?? '').trim() ||
        String(row.vid ?? '').trim() ||
        '该短剧'
    try {
        await ElMessageBox.confirm(`确定要删除短剧「${dramaTitle}」吗？`, '提示', {
            type: 'warning',
            customClass: 'app-confirm-dialog',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showClose: true,
        })
        const res = await deleteDrama(row.id)
        const data = res.data
        // 后端成功时可能返回 data: null / 省略 data，仅当明确 data === false 视为业务失败
        if (data?.code === 200 && data?.data !== false) {
            ElMessage.success(data?.message?.trim() || '删除成功')
            loadList()
        } else {
            ElMessage.error(data?.message ?? '删除失败')
        }
    } catch (e) {
        if (e === 'cancel') return
        ElMessage.error('删除失败')
    }
}

/**
 * 列表内状态开关变更：二次确认后调用 editStatus 接口更新，成功则同步 row.status，失败或取消则还原开关
 * @param _field 固定为 'status'；row 当前行
 */
async function handleToggle(_field: 'status', row: DramaRecord) {
    const nextStatus = row.statusEnabled ? 1 : 0
    const prevEnabled = row.status === 1
    try {
        const targetLabel = nextStatus === 1 ? '上线' : '下线'
        const dramaTitle = row.titleLanguage || row.title || '该剧'
        await ElMessageBox.confirm(
            `确定要将「${dramaTitle}」的状态修改为「${targetLabel}」吗？`,
            '提示',
            {
                type: 'warning',
                customClass: 'app-confirm-dialog',
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                showClose: true,
            }
        )
    } catch {
        row.statusEnabled = prevEnabled
        return
    }
    try {
        await updateDramaStatus(row.id, nextStatus as 0 | 1)
        row.status = nextStatus
        ElMessage.success(`状态已更新为：${nextStatus === 1 ? '上线' : '下线'}`)
    } catch (e: any) {
        row.statusEnabled = prevEnabled
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '状态更新失败')
    }
}

/**
 * 列表内置顶开关变更：二次确认后调用 editPin 接口更新，成功则同步 row.pin，失败或取消则还原开关
 * @param _field 固定为 'pin'；row 当前行
 */
async function handleSticky(_field: 'pin', row: DramaRecord) {
    const nextStatus = row.stickyEnabled ? 1 : 0
    const prevEnabled = row.pin === 1
    try {
        const targetLabel = nextStatus === 1 ? '置顶' : '未置顶'
        const dramaTitle = row.titleLanguage || row.title || '该剧'
        await ElMessageBox.confirm(
            `确定要将「${dramaTitle}」的置顶状态修改为「${targetLabel}」吗？`,
            '提示',
            {
                type: 'warning',
                customClass: 'app-confirm-dialog',
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                showClose: true,
            }
        )
    } catch {
        row.stickyEnabled = prevEnabled
        return
    }
    try {
        await editDramaPin({
            id: String(row.id),
            pin: nextStatus as 0 | 1,
        })
        row.pin = nextStatus
        ElMessage.success(`状态已更新为：${nextStatus === 1 ? '置顶' : '未置顶'}`)
    } catch (e: any) {
        row.stickyEnabled = prevEnabled
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '置顶更新失败')
    }
}

const THROTTLE_WAIT = 500
const throttledHandleSearch = throttle(handleSearch, THROTTLE_WAIT)
const throttledHandleReset = throttle(handleReset, THROTTLE_WAIT)
const throttledHandleAdd = throttle(handleAdd, THROTTLE_WAIT)
const throttledLoadList = throttle(loadList, THROTTLE_WAIT)
const throttledHandleEdit = throttle(handleEdit, THROTTLE_WAIT)
const throttledOpenEpisodeManage = throttle(openEpisodeManage, THROTTLE_WAIT)
const throttledHandleDelete = throttle(handleDelete, THROTTLE_WAIT)
const throttledHandleToggle = throttle(handleToggle, THROTTLE_WAIT)
const throttledHandleSticky = throttle(handleSticky, THROTTLE_WAIT)

onBeforeUnmount(() => {
    // 组件卸载时清理异步状态，避免卸载后仍触发列表回写
    if (listDebounceTimer) {
        clearTimeout(listDebounceTimer)
        listDebounceTimer = null
    }
    if (listAbortController) {
        listAbortController.abort()
        listAbortController = null
    }
})

/** 批量添加表格行（与 add 接口字段对应；简介、封面选填） */
type BatchDramaRow = {
    _id: string
    title: string
    titleLanguage: string
    description: string
    coverRaw?: File
    coverPreview: string
    dramaCategories: string[]
    dramaTags: string[]
    languageCode: string
    subtitleLanguageCode: string
    dramaCount: number
    copyrightCode: string
}

const batchAddDialogVisible = ref(false)
const batchAddRows = ref<BatchDramaRow[]>([])
const batchAddSubmitLoading = ref(false)
/** 批量表格实例，用于新增行后滚到底部 */
const batchAddTableRef = ref<{ $el?: HTMLElement; setScrollTop?: (top: number) => void } | null>(null)

/** 将批量表格纵向滚到底，使最后一行（含刚追加的行）进入可视区 */
async function scrollBatchAddTableToBottom() {
    await nextTick()
    await nextTick()
    const inst = batchAddTableRef.value as
        | ({ $el?: HTMLElement; setScrollTop?: (top: number) => void } & { scrollBarRef?: { wrapRef?: HTMLElement } })
        | null
        | undefined
    if (!inst) return
    const root = inst.$el
    if (!root) return
    const wrap =
        (root.querySelector('.el-table__body-wrapper .el-scrollbar__wrap') as HTMLElement | null) ||
        (root.querySelector('.el-scrollbar__wrap') as HTMLElement | null) ||
        (root.querySelector('.el-table__body-wrapper') as HTMLElement | null)
    if (!wrap) return
    const top = wrap.scrollHeight
    if (typeof inst.setScrollTop === 'function') {
        inst.setScrollTop(top)
    } else {
        wrap.scrollTo({ top, behavior: 'smooth' })
    }
    // 表格下方的「+」若被弹窗裁切，一并滚入视口
    requestAnimationFrame(() => {
        const appendEl = root.closest('.batch-add-table-wrap')?.querySelector('.batch-table-append-row')
        appendEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
}

function createEmptyBatchRow(): BatchDramaRow {
    return {
        _id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        title: '',
        titleLanguage: '',
        description: '',
        coverRaw: undefined,
        coverPreview: '',
        dramaCategories: [],
        dramaTags: [],
        languageCode: languageOptions.value[0]?.languageCode ?? '',
        subtitleLanguageCode: subtitleLanguageOptions.value[0]?.languageCode ?? '',
        dramaCount: 1,
        copyrightCode: copyrightOwnerOptions.value[0]?.value ?? '',
    }
}

function revokeBatchRowCover(row: BatchDramaRow) {
    if (row.coverPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(row.coverPreview)
    }
    row.coverPreview = ''
    row.coverRaw = undefined
}

/** 清空批量草稿（释放封面 blob）；仅在「提交全部」全部成功时调用 */
function resetBatchAddDialog() {
    batchAddRows.value.forEach((r) => revokeBatchRowCover(r))
    batchAddRows.value = []
    batchAddSubmitLoading.value = false
}

/** 取消/关窗：保留表格草稿，便于误关后再次打开继续编辑 */
function onBatchAddDialogClose() {
    batchAddSubmitLoading.value = false
}

function openBatchAddDialog() {
    if (!batchAddRows.value.length) {
        batchAddRows.value = [createEmptyBatchRow()]
    }
    batchAddDialogVisible.value = true
}

function appendBatchAddRow() {
    batchAddRows.value.push(createEmptyBatchRow())
    void scrollBatchAddTableToBottom()
}

function removeBatchAddRow(index: number) {
    const row = batchAddRows.value[index]
    if (row) revokeBatchRowCover(row)
    batchAddRows.value.splice(index, 1)
}

function onBatchRowLanguageChange(row: BatchDramaRow) {
    row.dramaCategories = []
    row.dramaTags = []
}

async function onBatchCoverFileChange(
    row: BatchDramaRow,
    uploadFile: { raw?: File; name?: string },
    fileList: { raw?: File; name?: string }[],
) {
    const raw =
        (fileList?.length ? fileList[fileList.length - 1]?.raw : uploadFile?.raw) || uploadFile?.raw
    if (!raw) return
    const coverErr = await getDramaCoverImageValidationError(raw)
    if (coverErr) {
        ElMessage.error(coverErr)
        return
    }
    revokeBatchRowCover(row)
    row.coverPreview = URL.createObjectURL(raw)
    row.coverRaw = raw
}

async function onBatchCoverExceed(row: BatchDramaRow, files: File[]) {
    const raw = files?.[0]
    if (!raw) return
    const coverErr = await getDramaCoverImageValidationError(raw)
    if (coverErr) {
        ElMessage.error(coverErr)
        return
    }
    revokeBatchRowCover(row)
    row.coverPreview = URL.createObjectURL(raw)
    row.coverRaw = raw
}

function clearBatchRowCover(row: BatchDramaRow) {
    revokeBatchRowCover(row)
}

/** 将行内所选类型标签 value 转为接口 dramaCategoriesCodes（逗号分隔 categoryCode） */
function buildBatchCategoryCodesString(selectedValues: string[], languageCode: string): string {
    const opts = buildCategoryOptionsForLanguage(languageCode)
    return selectedValues
        .map((v) => {
            const matched = opts.find((o) => o.value === v)
            return matched?.code ?? ''
        })
        .filter(Boolean)
        .join(',')
}

async function submitBatchAdd() {
    const rows = batchAddRows.value
    if (!rows.length) {
        ElMessage.warning('请至少添加一行')
        return
    }
    const errors: string[] = []
    rows.forEach((row, i) => {
        const line = `第${i + 1}行`
        if (!String(row.title ?? '').trim()) errors.push(`${line}：请填写原始剧名`)
        if (!String(row.titleLanguage ?? '').trim()) errors.push(`${line}：请填写上线剧名`)
        if (!String(row.languageCode ?? '').trim()) errors.push(`${line}：请选择字幕语言`)
        if (!String(row.subtitleLanguageCode ?? '').trim()) errors.push(`${line}：请选择配音语言`)
        if (!row.dramaCategories?.length) errors.push(`${line}：请至少选择一个类型标签`)
        if (typeof row.dramaCount !== 'number' || row.dramaCount < 1 || row.dramaCount > 9999) {
            errors.push(`${line}：剧集数需在 1-9999`)
        }
        if (!String(row.copyrightCode ?? '').trim()) errors.push(`${line}：请选择版权方`)
    })
    if (errors.length) {
        ElMessage.error(errors[0])
        return
    }
    batchAddSubmitLoading.value = true
    let ok = 0
    const failMsgs: string[] = []
    try {
        const preparedRows: Array<{ lineLabel: string; payload: BatchAddDramaItem }> = []
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            const lineLabel = `第${i + 1}行`
            let coverImgUrl = ''
            try {
                if (row.coverRaw) {
                    coverImgUrl = await uploadByPut(row.coverRaw, 'drama/cover')
                }
            } catch (e: any) {
                failMsgs.push(`${lineLabel}：封面上传失败 ${e?.message ?? ''}`)
                continue
            }
            const dramaCategoriesCodes = buildBatchCategoryCodesString(
                row.dramaCategories,
                row.languageCode,
            )
            const dramaTagsCodesStr = Array.isArray(row.dramaTags)
                ? row.dramaTags.filter(Boolean).join(',')
                : ''
            const payload: BatchAddDramaItem = {
                languageCode: row.languageCode,
                title: row.title.trim(),
                titleLanguage: row.titleLanguage.trim(),
                coverImg: coverImgUrl,
                description: (row.description ?? '').trim(),
                dramaCount: row.dramaCount,
                copyrightCode: row.copyrightCode,
                dramaTagsCodes: dramaTagsCodesStr,
                dramaCategoriesCodes: dramaCategoriesCodes || '',
                subtitleLanguageCode: row.subtitleLanguageCode,
            }
            preparedRows.push({ lineLabel, payload })
        }

        const BATCH_SIZE = 50
        for (let start = 0; start < preparedRows.length; start += BATCH_SIZE) {
            const chunkRows = preparedRows.slice(start, start + BATCH_SIZE)
            const chunkPayload = chunkRows.map((item) => item.payload)
            try {
                const addRes = await batchAddDrama(chunkPayload)
                const data = addRes.data
                if (Number(data?.code) === 200) {
                    ok += chunkRows.length
                } else {
                    const msg = data?.message ?? '批量新增失败'
                    chunkRows.forEach((item) => failMsgs.push(`${item.lineLabel}：${msg}`))
                }
            } catch (e: any) {
                const msg = e?.response?.data?.message ?? e?.message ?? '请求失败'
                chunkRows.forEach((item) => failMsgs.push(`${item.lineLabel}：${msg}`))
            }
        }
        if (ok === rows.length) {
            ElMessage.success(`已全部添加成功（${ok} 条）`)
            batchAddDialogVisible.value = false
            resetBatchAddDialog()
            loadList()
        } else if (ok > 0) {
            ElMessage.warning(`部分成功：成功 ${ok} 条，失败 ${failMsgs.length} 条`)
            if (failMsgs.length) console.warn('批量添加失败明细', failMsgs)
            loadList()
        } else {
            ElMessage.error(failMsgs[0] ?? '全部添加失败')
        }
    } finally {
        batchAddSubmitLoading.value = false
    }
}

onMounted(async () => {
    document.addEventListener('mousedown', handleTagPickerGlobalPointerDown)
    const page = Number(parseQueryString(route.query.page))
    if (Number.isFinite(page) && page > 0) currentPage.value = page
    const size = Number(parseQueryString(route.query.size))
    if ([10, 20, 50].includes(size)) pageSize.value = size
    searchForm.vid = parseQueryString(route.query.vid)
    searchForm.title = parseQueryString(route.query.title)
    searchForm.copyrightCode = parseQueryString(route.query.copyrightCode)
    searchForm.languageCode = parseQueryString(route.query.languageCode)
    const status = parseQueryString(route.query.status)
    searchForm.status = status === '0' || status === '1' ? Number(status) : ''
    const pinQ = parseQueryString(route.query.pin)
    searchForm.pin = pinQ === '0' ? 0 : pinQ === '1' ? 1 : ''
    const categories = parseQueryString(route.query.dramaCategoriesCodes)
    const tags = parseQueryString(route.query.dramaTagsCodes)
    searchForm.dramaCategoriesCodes = categories
        ? categories.split(',').map((item) => item.trim()).filter(Boolean)
        : []
    searchForm.dramaTagsCodes = tags
        ? tags.split(',').map((item) => item.trim()).filter(Boolean)
        : []
    // 首屏关键路径：优先并发列表与轻量字典（语言/版权方），先把首屏画出来
    await Promise.allSettled([
        loadListNow(),
        loadLanguageOptions(),
        loadCopyrightOwnerOptions(),
    ])
    // 次要路径：后台补齐重字典（分类/情节标签），不阻塞首屏可交互
    void (async () => {
        await ensureTagAndCategoryLoaded()
        loadCategoryOptions(searchForm.languageCode || undefined)
        loadPlotTagOptions(searchForm.languageCode || undefined)
        const defaultLang = languageOptions.value[0]?.languageCode
        if (defaultLang) {
            loadEditFormCategoryOptions(defaultLang)
            loadEditFormPlotTagOptions(defaultLang)
        }
    })()
})

onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleTagPickerGlobalPointerDown)
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
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
    overflow-x: visible;
    overflow-y: visible;
    padding: 0 0 4px 0;
}
.search-form--single-row > :deep(.el-form-item) {
    flex-shrink: 0;
}
.search-form :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 0;
}

.filter-input--title {
    width: 150px;
}
.filter-input--vid {
    width: 86px;
}
.filter-select--copyright {
    width: 180px;
}
.filter-select--language {
    width: 120px;
}
.filter-select--tags {
    width: 148px;
}
.filter-select--status {
    width: 92px;
}
.filter-select--pin {
    width: 96px;
}

.drama-title-mid-ellipsis {
    display: inline-block;
    max-width: 100%;
    vertical-align: middle;
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
.copy-cell--title-col {
    flex-wrap: nowrap;
    width: 100%;
    box-sizing: border-box;
}
.copy-cell__title-main {
    flex: 1 1 0;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}
.copy-cell__title-trigger {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    display: block;
    text-align: center;
}
.copy-cell--title-col .drama-title-tail-ellipsis {
    display: block;
    width: 100%;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: center;
}
.drama-table-copy-btn {
    flex-shrink: 0;
    padding: 0 2px;
}

.drama-main-card :deep(.filter-input .el-input__wrapper) {
    min-height: 34px;
    padding: 0 8px;
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
    padding: 0 8px;
    background-color: #edf1fc;
    border-radius: 8px;
    box-shadow: none !important;
    font-size: 12px;
}
.drama-main-card :deep(.filter-select .el-select__wrapper:hover),
.drama-main-card :deep(.filter-select .el-select__wrapper.is-focused) {
    box-shadow: none !important;
}

.search-form__actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.search-form__add {
    margin-left: auto;
}
.search-form__add-btns {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.add-menu-btn--batch {
    border-radius: 8px;
    min-width: 64px;
    height: 34px;
    padding: 0 12px;
    font-size: 12px;
}

.batch-add-toolbar {
    margin-bottom: 8px;
}
.batch-add-tip {
    font-size: 12px;
    color: #909399;
    line-height: 1.4;
}
.batch-add-table-wrap {
    width: 100%;
    overflow-x: auto;
}
/* 图片：与「清除」同一行，无描边方框 */
.batch-cover-inline {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
    white-space: nowrap;
    min-width: 0;
    line-height: 22px;
}
.batch-cover-upload-inline :deep(.el-upload) {
    display: inline-flex;
    vertical-align: middle;
}
.batch-cover-trigger-inline {
    cursor: pointer;
    width: 24px;
    height: 24px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-sizing: border-box;
    border: none;
    border-radius: 2px;
    background: transparent;
}
.batch-cover-thumb-inline {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}
.batch-cover-text-inline {
    font-size: 12px;
    color: var(--el-color-primary);
    white-space: nowrap;
}
.batch-cover-clear-inline {
    flex-shrink: 0;
    padding: 0 2px !important;
    height: auto !important;
    min-height: 0 !important;
}
.batch-add-drama-dialog :deep(.el-dialog__body) {
    padding-top: 8px;
}
.batch-add-el-table {
    font-size: 12px;
}
.batch-add-drama-dialog :deep(.batch-add-el-table .el-table__cell) {
    padding: 0 4px;
    vertical-align: middle;
}
.batch-add-drama-dialog :deep(.batch-add-el-table .el-table__body .el-table__row) {
    height: 28px;
    max-height: 28px;
}
.batch-add-plain-table :deep(.el-table__body .el-table__cell) {
    overflow: hidden;
}
.batch-add-plain-table :deep(.el-table__body .el-table__cell .cell) {
    overflow: hidden;
    max-height: 28px;
}
.batch-add-drama-dialog :deep(.batch-add-el-table .el-table__header .el-table__cell) {
    padding: 2px 4px;
}
.batch-add-drama-dialog :deep(.batch-add-el-table .cell) {
    padding: 0;
    line-height: 22px;
}
/* 去掉输入/下拉/数字框描边盒，无底部分隔线 */
.batch-add-plain-table :deep(.batch-add-plain-field.el-input .el-input__wrapper),
.batch-add-plain-table :deep(.batch-add-plain-field.el-select .el-select__wrapper) {
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    background: transparent !important;
    border-bottom: none !important;
    min-height: 22px !important;
    padding: 0 2px !important;
}
.batch-add-plain-table :deep(.batch-add-plain-field .el-input__inner) {
    height: 22px;
    line-height: 22px;
    font-size: 12px;
}
.batch-add-plain-table :deep(.batch-add-plain-field.el-input .el-input__wrapper.is-focus),
.batch-add-plain-table :deep(.batch-add-plain-field.el-select .el-select__wrapper.is-focused) {
    border-bottom: none !important;
    box-shadow: none !important;
}
.batch-add-plain-table :deep(.batch-add-plain-num .el-input-number__decrease),
.batch-add-plain-table :deep(.batch-add-plain-num .el-input-number__increase) {
    border: none !important;
    background: transparent !important;
}
.batch-add-plain-table :deep(.batch-add-plain-num .el-input__wrapper) {
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    background: transparent !important;
    border-bottom: none !important;
    min-height: 22px !important;
    padding: 0 24px 0 2px !important;
}
.batch-add-plain-table :deep(.batch-add-plain-num .el-input__wrapper.is-focus) {
    border-bottom: none !important;
    box-shadow: none !important;
}
.batch-add-plain-table :deep(.batch-add-plain-num .el-input__inner) {
    height: 22px;
    line-height: 22px;
    font-size: 12px;
    text-align: left;
}
/* 多选标签：强制单行高度，选多个也不撑大行 */
.batch-add-plain-table :deep(.batch-add-tag-select) {
    max-height: 22px;
    display: block;
}
.batch-add-plain-table :deep(.batch-add-tag-select .el-select__wrapper) {
    min-height: 22px !important;
    height: 22px !important;
    max-height: 22px !important;
    overflow: hidden !important;
    align-items: center !important;
}
.batch-add-plain-table :deep(.batch-add-tag-select .el-select__selection) {
    flex-wrap: nowrap !important;
    overflow: hidden !important;
    max-height: 22px !important;
    align-items: center !important;
}
.batch-add-plain-table :deep(.batch-add-tag-select .el-select__selected-item) {
    max-width: 100%;
    height: auto !important;
    max-height: 20px !important;
    line-height: 1 !important;
}
.batch-add-plain-table :deep(.batch-add-tag-select .el-select__tags-text) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-height: 20px;
    line-height: 20px;
}
.batch-add-plain-table :deep(.batch-add-tag-select .el-tag) {
    max-width: 100%;
    height: 20px !important;
    line-height: 18px !important;
    padding: 0 6px !important;
    margin: 0 4px 0 0 !important;
    box-sizing: border-box;
}
.batch-add-plain-table :deep(.batch-add-tag-select .el-tag .el-tag__content) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-height: 18px;
    line-height: 18px;
}
.batch-add-plain-table :deep(.batch-add-tag-select .el-select__suffix) {
    flex-shrink: 0;
}
.batch-table-append-row {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 6px 0 2px 8px;
    box-sizing: border-box;
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

.add-menu-btn {
    background-color: #2d53eb !important;
    border-color: #2d53eb !important;
    border-radius: 8px;
    color: #ffffff !important;
    min-width: 64px;
    height: 34px;
    padding: 0 12px;
    font-size: 12px;
}
.add-menu-btn:hover,
.add-menu-btn:focus {
    background-color: #2447d4 !important;
    border-color: #2447d4 !important;
    color: #ffffff !important;
}

.table-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 12px 0 8px;
    margin-top: 16px;
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

/* 与注册管理列表一致：无竖线，仅行间分隔；字号小于注册页默认值 */
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
/* 表头：标题与排序箭头同一行（覆盖 EP 默认 white-space: normal 导致的换行） */
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
    color: #575757;
    line-height: 18px;
}
.drama-op-table :deep(.el-table__body .el-button.is-link) {
    font-size: 12px;
    line-height: 18px;
}
.drama-op-table :deep(.el-table__fixed-right-patch) {
    background-color: #edf1fc;
}

.pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 12px 0 0;
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

.title-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}
.cover-cell {
    display: flex;
    align-items: center;
    justify-content: center;
}
.cover-list-file-input {
    display: none;
}
.cover-upload-placeholder {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    border: 1px dashed #c0c4cc;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: #fafafa;
    flex: 0 0 auto;
    box-sizing: border-box;
}
.cover-upload-placeholder:hover:not(.cover-upload-placeholder--busy) {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
}
.cover-upload-placeholder--busy {
    cursor: wait;
    pointer-events: none;
}
.cover-upload-placeholder__text {
    font-size: 10px;
    line-height: 1;
    color: #909399;
}
.cover-upload-placeholder:hover:not(.cover-upload-placeholder--busy)
    .cover-upload-placeholder__text {
    color: var(--el-color-primary);
}
.cover-upload-placeholder__icon {
    font-size: 16px;
    color: var(--el-color-primary);
}
.cover {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    flex: 0 0 auto;
    overflow: hidden;
    cursor: pointer;
}
.cover--error {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: #f2f3f5;
    color: #909399;
    font-size: 11px;
}
.cover-preview-wrap {
    padding: 4px;
}
.cover-preview {
    width: 180px;
    height: 240px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
    display: block;
}
.cover-preview--empty {
    width: 180px;
    height: 240px;
    border-radius: 8px;
    background: #f2f3f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #909399;
    font-size: 13px;
}
.title-info {
    min-width: 0;
}
.title-info .main {
    font-weight: 500;
    color: #303133;
    line-height: 16px;
    font-size: 12px;
}
.title-info .sub {
    margin-top: 2px;
    font-size: 11px;
    color: #909399;
    line-height: 16px;
}

.action-buttons {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
}
.action-btn {
    border: none;
}
.action-edit {
    background: #e8f3ff;
    color: #409eff;
}
.action-add {
    background: #fff3e0;
    color: #e6a23c;
}
.action-preview {
    background: #eaf8ef;
    color: #67c23a;
}
.action-del {
    background: #ffecec;
    color: #f56c6c;
}

.action-more {
    margin-left: 12px;
    background: #f5f7fa;
    color: #909399;
}
.action-btn:hover {
    opacity: 0.9;
}

.tag-line-cell {
    width: 100%;
    min-width: 0;
    padding: 2px 0;
    line-height: 1.35;
}
.tag-line-ellipsis {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 999px;
    box-sizing: border-box;
}
.tag-line-ellipsis--primary {
    color: #2d53eb;
    background: rgba(45, 83, 235, 0.08);
}
.tag-line-ellipsis--warning {
    color: #e6a23c;
    background: rgba(230, 162, 60, 0.1);
}
.tag-empty {
    color: #c0c4cc;
    font-size: 12px;
}

.dub-sub-ellipsis {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
    font-size: 12px;
    color: #575757;
    box-sizing: border-box;
}

.episode-ratio {
    color: #606266;
}
.episode-ratio--processing {
    color: #409eff;
}

.episode-panel {
    padding: 10px 10px 2px;
}
.episode-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}
.episode-panel__title {
    font-weight: 500;
    color: #303133;
}
.episode-table {
    width: 100%;
}

.form-readonly-tip {
    margin-left: 8px;
    font-size: 12px;
    color: #909399;
}

/* 新增/编辑短剧弹窗：选图区与用户管理一致（全局 menu-add-dialog.css） */
.drama-add-form :deep(.el-input-number) {
    width: 100%;
}
.cover-pick-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
}
.upload-tip {
    font-size: 12px;
    color: #909399;
}

.drama-content-dialog {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.drama-content-dialog--empty {
    color: #909399;
}
.dialog-top {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 16px;
}
.dialog-cover {
    display: flex;
    justify-content: center;
}
.dialog-cover-img {
    width: 160px;
    height: 220px;
    border-radius: 8px;
    border: 1px solid #ebeef5;
}
.dialog-main {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.dialog-title__line {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    line-height: 1.4;
}
.dialog-title__sub {
    margin-top: 2px;
    color: #909399;
}
.dialog-tag-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
}
.dialog-tag-label {
    color: #606266;
}
.dialog-desc {
    font-size: 14px;
    line-height: 1.6;
    word-break: break-word;
}
.dialog-desc__label {
    color: #606266;
    font-weight: 500;
}
.dialog-desc__text {
    color: #303133;
    white-space: pre-wrap;
}
.dialog-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
}
.dialog-card {
    border-radius: 8px;
}
.dialog-card__header {
    font-weight: 600;
    color: #303133;
}
.dialog-info-row {
    display: grid;
    grid-template-columns: 88px 1fr;
    gap: 8px;
    margin-bottom: 8px;
    align-items: center;
}
.dialog-info-row:last-child {
    margin-bottom: 0;
}
.dialog-info-label {
    color: #909399;
}
.dialog-info-value {
    color: #303133;
    word-break: break-word;
}

.tag-picker-trigger {
    min-height: 36px;
    width: 100%;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    padding: 4px 10px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    cursor: pointer;
    transition: border-color 0.2s;
}
.tag-picker-trigger:hover {
    border-color: var(--el-color-primary);
}
.tag-picker-trigger.is-disabled {
    cursor: not-allowed;
    color: #c0c4cc;
    background-color: var(--el-disabled-bg-color);
    border-color: var(--el-disabled-border-color);
}
.tag-picker-trigger__placeholder {
    color: #a8abb2;
    font-size: 13px;
}
.tag-picker-trigger__tag {
    margin: 0;
}

.tag-picker-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.tag-picker-search {
    max-width: 320px;
}
.tag-picker-dialog__title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 22px;
    font-weight: 700;
    color: #000000;
}
.tag-picker-dialog__title-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #2d53eb;
}
.tag-picker-dialog :deep(.el-dialog__header) {
    background-color: #ffffff !important;
}
.tag-picker-selected {
    padding-bottom: 4px;
}
.tag-picker-selected__list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
.tag-picker-selected__item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 13px;
    border-radius: 18px;
    background: #ecf2ff;
    border: 1px solid #c8d7ff;
    color: #3a68ff;
    font-weight: 600;
    font-size: 13px;
}
.tag-picker-selected__remove {
    cursor: pointer;
    width: 14px;
    height: 14px;
}
.tag-picker-options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
.tag-picker-add-option {
    width: 52px;
    height: 36px;
    border: 1px dashed #c8d7ff;
    border-radius: 10px;
    background: #f7f9ff;
    color: #2d53eb;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}
.tag-picker-add-option:hover {
    border-color: #2d53eb;
    background: #eef2ff;
}
.tag-picker-inline-add-panel {
    display: none;
}
.tag-picker-inline-add-anchor {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}
.tag-picker-inline-input {
    width: 170px;
}
.tag-picker-inline-input :deep(.el-input__wrapper) {
    border-radius: 18px;
    min-height: 36px;
}
.tag-picker-empty {
    padding: 12px 0 6px;
}
.tag-picker-option {
    border: none;
    background: #F3F3F3;
    border-radius: 40px;
    padding: 10px 13px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: #4e5969;
    font-size: 12px;
}
.tag-picker-option:hover {
    background: #e9edf5;
}
.tag-picker-option.is-checked {
    background: #DEE6F8;
    color: #2D53EB;
}
.tag-picker-option__check {
    width: 16px;
    height: 16px;
    border: 1px solid transparent;
    border-radius: 3px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    line-height: 1;
    color: transparent;
    background: #e6e6e6;
    margin-left: auto;
}
.tag-picker-option__check img {
    width: 12px;
    height: 12px;
    display: block;
}
.tag-picker-option.is-checked .tag-picker-option__check {
    background: #2d53eb;
}
.tag-picker-btn-cancel {
    min-width: 80px;
    height: 40px;
    padding: 8px 20px;
    border-radius: 10px;
    background-color: #EEF1FE;
    border: 1px solid #2D53EB;
    color: #2d53eb;
}
.tag-picker-btn-cancel:hover,
.tag-picker-btn-cancel:focus {
    background-color: #e4e9fc;
    border-color: #2d53eb;
    color: #2d53eb;
}
.tag-picker-btn-primary.el-button--primary {
    min-width: 80px;
    height: auto;
    padding: 8px 15px;
    border-radius: 10px;
    font-size: 14px;
    line-height: 22px;
    background-color: #2d53eb;
    border-color: #2d53eb;
}
.tag-picker-btn-primary.el-button--primary:hover,
.tag-picker-btn-primary.el-button--primary:focus {
    background-color: #2447d4;
    border-color: #2447d4;
}
</style>

<style lang="css">
/* Teleport 到 body 的弹层，使用全局高优先级覆盖 menu-add-dialog */
.menu-add-dialog.tag-picker-dialog .el-dialog__header {
    background: #ffffff !important;
}

.menu-add-dialog.tag-picker-dialog .el-dialog__footer .tag-picker-btn-cancel {
    min-width: 80px;
    height: 40px;
    padding: 8px 20px;
    border-radius: 10px;
    background-color: #eef1fe;
    border: 1px solid #2d53eb;
    color: #2d53eb;
}

.menu-add-dialog.tag-picker-dialog .el-dialog__footer .tag-picker-btn-cancel:hover,
.menu-add-dialog.tag-picker-dialog .el-dialog__footer .tag-picker-btn-cancel:focus {
    background-color: #e4e9fc;
    border-color: #2d53eb;
    color: #2d53eb;
}

.menu-add-dialog.tag-picker-dialog .el-dialog__footer .tag-picker-btn-primary.el-button--primary {
    min-width: 80px;
    padding: 8px 15px;
    border-radius: 10px;
    font-size: 14px;
    line-height: 22px;
    background-color: #2d53eb;
    border-color: #2d53eb;
}

.menu-add-dialog.tag-picker-dialog .el-dialog__footer .tag-picker-btn-primary.el-button--primary:hover,
.menu-add-dialog.tag-picker-dialog .el-dialog__footer .tag-picker-btn-primary.el-button--primary:focus {
    background-color: #2447d4;
    border-color: #2447d4;
}

.drama-content-title-tooltip {
    max-width: min(480px, 90vw) !important;
    box-sizing: border-box;
}
.drama-content-title-tooltip .el-tooltip__content,
.drama-content-title-tooltip .el-popper__inner {
    word-break: break-all;
    white-space: normal;
    line-height: 1.5;
}
</style>
