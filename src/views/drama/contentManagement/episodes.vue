<template>
    <page-content :title="title" class="episode-management-page">
        <template #bottom>
            <el-card shadow="never" class="episode-card">
                <div class="episode-header">
                    <div class="episode-header__left">
                        <el-button class="episode-back-btn" :icon="ArrowLeft" @click="throttledGoBack" />
                        <div class="episode-meta">
                            <div class="episode-meta__main">
                                <div class="episode-meta__titles">
                                    <div class="episode-meta__row">
                                        <span
                                            class="episode-meta__value episode-meta__value--online"
                                            :title="dramaOnlineTitleText"
                                        >
                                            {{ dramaOnlineTitleText }}
                                        </span>
                                    </div>
                                    <div class="episode-meta__row">
                                        <span
                                            class="episode-meta__value episode-meta__value--muted"
                                            :title="dramaOriginalTitleText"
                                        >
                                            {{ dramaOriginalTitleText }}
                                        </span>
                                    </div>
                                </div>
                                <div class="episode-meta__upload-stat" aria-label="已上传集数">
                                    <span class="episode-meta__upload-label">处理完成数</span>
                                    <span class="episode-meta__upload-numbers">
                                        <strong class="episode-meta__upload-num">{{ uploadedDramaCountDisplay }}</strong>
                                        <span class="episode-meta__upload-sep">/</span>
                                        <span class="episode-meta__upload-total">{{ maxEpisodeCount }}</span>
                                        <span class="episode-meta__upload-unit">集</span>
                                    </span>
                                    <div v-if="showEpisodeProcessDetails" class="episode-meta__upload-process">
                                        <span class="episode-meta__upload-process-line">处理中: {{ processingDramaCountDisplay }}</span>
                                        <span class="episode-meta__upload-process-line">上传中: {{ uploadingDramaCountDisplay }}</span>
                                        <span class="episode-meta__upload-process-line">
                                            待上传: {{ pendingDramaCountDisplay }}
                                            <span v-if="failProcessedDramaCountDisplay > 0">（其中上传失败: {{ failProcessedDramaCountDisplay }}）</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="episode-header__right">
                        <el-button
                            v-if="canHandleSeries"
                            :icon="Refresh"
                            :loading="handleSeriesLoading"
                            @click="throttledRefreshHandleSeries"
                        >
                            视频状态刷新
                        </el-button>
                        <el-button v-if="canAddEpisode" type="primary" :icon="Plus" @click="throttledOpenAddEpisodeDialog">
                            上传剧集
                        </el-button>
                        <el-button v-if="canAddEpisode" type="primary" plain :icon="Upload" @click="throttledOpenBulkUploadDialog">
                            批量上传
                        </el-button>
                    </div>
                </div>

                <div v-loading="episodesLoading" class="episode-body">
                    <div class="episode-sidebar">
                        <div class="episode-sidebar__title">分集列表</div>
                        <el-scrollbar class="episode-sidebar__scroll">
                            <button
                                v-for="row in episodeListRows"
                                :key="row.no"
                                type="button"
                                class="episode-item"
                                :class="{
                                    'episode-item--active': row.no === selectedEpisodeNo,
                                    'episode-item--empty': !row.record,
                                }"
                                @click="selectEpisodeRow(row.no)"
                            >
                                <div class="episode-item__cover">
                                    <el-image
                                        v-if="row.record?.coverUrl"
                                        :src="row.record.coverUrl"
                                        fit="cover"
                                        class="episode-item__cover-img"
                                    />
                                    <div v-else class="episode-item__cover-ph">
                                        <el-icon :size="22"><Picture /></el-icon>
                                    </div>
                                </div>
                                <div class="episode-item__mid">
                                    <div class="episode-item__line episode-item__line--title">第 {{ row.no }} 集</div>
                                    <div class="episode-item__line episode-item__meta">
                                        {{ row.record && row.record.handleStatus!==-1 ? `时长 ${row.record.durationText || '--'}` : '时长 --' }}
                                    </div>
                                    <div class="episode-item__line episode-item__meta episode-item__fid">
                                        <span class="episode-item__fid-text" :title="row.record?.fileId || ''">
                                            {{ row.record?.fileId ? `ID ${truncateMiddle(row.record.fileId, 14)}` : '文件ID --' }}
                                        </span>
                                        <el-button
                                            v-if="row.record?.fileId"
                                            type="primary"
                                            link
                                            :icon="CopyDocument"
                                            class="episode-item__copy"
                                            @click.stop="copyToClipboard(row.record!.fileId!, '文件ID')"
                                        />
                                    </div>
                                </div>
                                <div class="episode-item__right">
                                    <div class="episode-item__line episode-item__status">
                                        <template v-if="row.record">
                                            <template v-if="row.record.handleStatus === 0">
                                                <el-progress
                                                    :percentage="getUploadTask(row.record.id)?.progress ?? 0"
                                                    :stroke-width="8"
                                                    :show-text="false"
                                                />
                                                <span class="episode-item__status-text episode-item__status-text--uploading">
                                                    上传中
                                                </span>
                                            </template>
                                            <span
                                                v-else-if="row.record.handleStatus === 1"
                                                class="episode-item__status-text episode-item__status-text--processing"
                                            >
                                                处理中
                                            </span>
                                            <span
                                                v-else-if="row.record.handleStatus === 2"
                                                class="episode-item__status-text episode-item__status-text--done"
                                            >
                                                处理完成
                                            </span>
                                            <div v-else-if="row.record.handleStatus === -1" class="episode-item__status-fail-wrap">
                                                <span class="episode-item__status-text episode-item__status-text--muted">
                                                    待上传
                                                </span>
                                                <span class="episode-item__status-text episode-item__status-text--error">
                                                    上传失败
                                                </span>
                                            </div>
                                            <span
                                                v-else
                                                class="episode-item__status-text episode-item__status-text--muted"
                                            >
                                                --
                                            </span>
                                        </template>
                                        <span v-else class="episode-item__status-text episode-item__status-text--muted">待上传</span>
                                    </div>
                                    <div class="episode-item__line episode-item__meta">
                                        <span
                                            class="episode-item__online"
                                            :class="{
                                                'episode-item__online--on': (row.record?.status ?? '未上线') === '已上线',
                                                'episode-item__online--off': (row.record?.status ?? '未上线') !== '已上线',
                                            }"
                                        >
                                            {{ (row.record?.status ?? '未上线') === '已上线' ? '已上线' : '未上线' }}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        </el-scrollbar>
                    </div>

                    <div class="episode-preview">
                        <template v-if="selectedListRow">
                            <div class="episode-preview__head">
                                <h2 class="episode-preview__title">第 {{ selectedListRow.no }} 集</h2>
                                <div class="episode-preview__actions" v-if="selectedListRow.record && selectedListRow.record.handleStatus!==-1">
                                    <el-tooltip
                                        v-if="canEditEpisode"
                                        :content="EPISODE_VIDEO_BUSY_TIP"
                                        placement="top"
                                        :disabled="!isEpisodeVideoBusy(selectedListRow.record)"
                                    >
                                        <span class="episode-preview__action-tip-wrap">
                                            <el-button
                                                type="primary"
                                                link
                                                size="small"
                                                :disabled="isEpisodeVideoBusy(selectedListRow.record)"
                                                @click="throttledOpenEditEpisodeDialog(selectedListRow.record!)"
                                            >
                                                编辑
                                            </el-button>
                                        </span>
                                    </el-tooltip>
                                    <el-tooltip
                                        v-if="canDeleteEpisode"
                                        :content="EPISODE_VIDEO_BUSY_TIP"
                                        placement="top"
                                        :disabled="!isEpisodeVideoBusy(selectedListRow.record)"
                                    >
                                        <span class="episode-preview__action-tip-wrap">
                                            <el-button
                                                type="danger"
                                                link
                                                size="small"
                                                :disabled="isEpisodeVideoBusy(selectedListRow.record)"
                                                @click="throttledDeleteEpisode(selectedListRow.record!)"
                                            >
                                                删除
                                            </el-button>
                                        </span>
                                    </el-tooltip>
                                </div>
                                <div class="episode-preview__actions" v-else>
                                    <el-button
                                        v-if="canAddEpisode"
                                        type="primary"
                                        size="small"
                                        @click="throttledOpenAddEpisodeForNo(selectedListRow.no)"
                                    >
                                        上传本集
                                    </el-button>
                                </div>
                            </div>
                            <div class="episode-preview__status-bar" v-if="selectedListRow.record && selectedListRow.record.handleStatus !== -1">
                                <span class="episode-preview__pill">视频：{{ handleStatusLabel(selectedListRow.record) }}</span>
                                <span
                                    class="episode-preview__pill episode-preview__online"
                                    :class="{
                                        'episode-preview__online--on': selectedListRow.record.status === '已上线',
                                        'episode-preview__online--off': selectedListRow.record.status !== '已上线',
                                    }"
                                >
                                    {{ selectedListRow.record.status === '已上线' ? '已上线' : '未上线' }}
                                </span>
                                <span v-if="selectedListRow.record.createdAt" class="episode-preview__pill episode-preview__pill--muted">
                                    创建：{{ selectedListRow.record.createdAt }}
                                </span>
                            </div>
                            <div v-else class="episode-preview__status-bar episode-preview__status-bar--muted">
                                <span class="episode-preview__pill">本集尚未上传视频</span>
                            </div>
                            <div class="episode-preview__player-wrap">
                                <div class="episode-preview__player-inner">
                                    <template
                                        v-if="
                                            selectedListRow.record &&
                                            canTcPlayerPlay(selectedListRow.record) &&
                                            shouldPlayInline
                                        "
                                    >
                                        <DramaPreviewTcPlayer
                                            :key="`${selectedListRow.record.id}-${selectedListRow.record.no}`"
                                            :episode="tcPlayerEpisodeProps(selectedListRow.record)"
                                        />
                                    </template>
                                    <div v-else class="episode-preview__player-empty">
                                        <template
                                            v-if="
                                                selectedListRow.record &&
                                                canTcPlayerPlay(selectedListRow.record) &&
                                                !shouldPlayInline
                                            "
                                        >
                                            <el-empty description="主动点击后，开始播放" />
                                        </template>
                                        <template v-else-if="selectedListRow.record && selectedListRow.record.handleStatus === 0">
                                            <el-progress
                                                :percentage="getUploadTask(selectedListRow.record.id)?.progress ?? 0"
                                                :status="getUploadProgressStatus(selectedListRow.record.id)"
                                                :stroke-width="10"
                                                style="width: 88%; max-width: 360px"
                                            />
                                            <p class="episode-preview__empty-text">视频上传中…</p>
                                        </template>
                                        <!-- <template v-else-if="selectedListRow.record?.handleStatus === -1">
                                            <p class="episode-preview__empty-text status-error">视频上传失败，请编辑后重新上传</p>
                                        </template> -->
                                        <template v-else-if="selectedListRow.record?.handleStatus === 1">
                                            <el-icon class="episode-preview__processing-icon is-loading" :size="40">
                                                <Loading />
                                            </el-icon>
                                            <p class="episode-preview__empty-text status-processing">
                                                视频云端处理中，转码完成后即可预览播放
                                            </p>
                                            <p class="episode-preview__empty-sub">请稍后或点击顶部「视频状态刷新」更新状态</p>
                                        </template>
                                        <el-empty v-else description="暂无可预览画面" />
                                    </div>
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <div class="episode-preview__empty-state">
                                <el-empty description="请选择需要预览的剧集" />
                            </div>
                        </template>
                    </div>
                </div>
            </el-card>

            <!-- 新增/编辑剧集对话框 -->
            <FormDialog
                v-model="episodeDialogVisible"
                :title="episodeDialogTitle"
                width="640px"
                :loading="episodeSubmitLoading"
                @close="resetEpisodeForm"
                @confirm="submitEpisode"
            >
                <el-form
                    ref="episodeFormRef"
                    :model="episodeForm"
                    :rules="episodeFormRules"
                    label-width="100px"
                    class="edit-form"
                >
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="剧集名称" prop="name">
                                <el-input v-model="episodeForm.name" placeholder="请输入剧集名称" clearable />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="集数" prop="no">
                                <el-select v-model="episodeForm.no" placeholder="请选择集数" style="width: 100%">
                                    <el-option
                                        v-for="n in episodeNoOptions"
                                        :key="n"
                                        :label="`第${n}集`"
                                        :value="n"
                                    />
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="时长" prop="durationText">
                                <el-input v-model="episodeForm.durationText" placeholder="如 5:30" clearable />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="状态" prop="status">
                                <el-select
                                    v-model="episodeForm.status"
                                    placeholder="请选择"
                                    style="width: 100%"
                                    clearable
                                >
                                    <el-option label="已上线" value="已上线" />
                                    <el-option label="未上线" value="未上线" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="文件大小(MB)">
                                <el-input :model-value="formatEpisodeFileSizeMB(episodeForm.fileSize)" disabled />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12"></el-col>
                    </el-row>
                    <el-form-item label="封面上传" prop="coverUrl">
                        <div class="upload-field">
                            <div class="upload-actions">
                                <el-upload
                                    ref="coverUploadRef"
                                    v-model:file-list="coverFileList"
                                    :auto-upload="false"
                                    :limit="1"
                                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                                    :disabled="coverUploading"
                                    @change="onCoverFileChange"
                                    @remove="onCoverRemove"
                                    @exceed="onCoverExceed"
                                >
                                    <el-button type="primary" :loading="coverUploading">选择封面图</el-button>
                                </el-upload>
                                <span class="upload-tip">{{ DRAMA_COVER_UPLOAD_HINT }}</span>
                                <span v-if="coverFileList.length === 0 && existingCoverUrl" class="upload-tip">当前已有封面，选择新文件将替换</span>
                            </div>
                            <div v-if="coverPreviewSrc" class="upload-preview">
                                <el-popover placement="right" trigger="hover" width="auto" popper-class="cover-preview-popover">
                                    <template #reference>
                                        <div class="preview-cover-wrap">
                                            <el-image
                                                :src="coverPreviewSrc"
                                                fit="cover"
                                                class="preview-cover-thumb"
                                            />
                                            <span class="preview-hint">悬停预览</span>
                                        </div>
                                    </template>
                                    <el-image
                                        :src="coverPreviewSrc"
                                        fit="contain"
                                        style="max-width: 320px; max-height: 420px; display: block"
                                    />
                                </el-popover>
                            </div>
                        </div>
                    </el-form-item>
                    <el-form-item label="视频上传" prop="videoUrl">
                        <div class="upload-field">
                            <div class="upload-actions">
                                <el-upload
                                    ref="videoUploadRef"
                                    v-model:file-list="videoFileList"
                                    :auto-upload="false"
                                    :limit="1"
                                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                                    :disabled="false"
                                    @change="onVideoFileChange"
                                    @remove="onVideoRemove"
                                    @exceed="onVideoExceed"
                                >
                                    <el-button type="primary">选择视频</el-button>
                                </el-upload>
                                <span v-if="videoFileList.length === 0 && existingVideoFileId" class="upload-tip">当前已有视频，选择新文件将替换</span>
                            </div>
                            <p
                                v-if="videoFileList.length > 0 || existingVideoFileId"
                                class="upload-vod-process-hint"
                            >
                                保存并上传成功后，云端将转码处理；处理完成前无法在剧集列表中点播预览，请通过「视频状态刷新」或稍后重试。
                            </p>
                            <div v-if="videoPreviewSrc" class="upload-preview">
                                <el-popover placement="right" trigger="hover" width="auto" popper-class="video-preview-popover">
                                    <template #reference>
                                        <div class="preview-video-wrap">
                                            <div class="preview-video-thumb-wrap">
                                                <video
                                                    :src="videoPreviewSrc"
                                                    class="preview-video-thumb"
                                                    muted
                                                    preload="metadata"
                                                />
                                                <span class="preview-video-play">
                                                    <el-icon :size="28"><VideoPlay /></el-icon>
                                                </span>
                                            </div>
                                            <span class="preview-hint">悬停预览</span>
                                        </div>
                                    </template>
                                    <div class="video-preview-large">
                                        <video
                                            :src="videoPreviewSrc"
                                            controls
                                            preload="metadata"
                                            class="video-preview-player"
                                        />
                                    </div>
                                </el-popover>
                            </div>
                        </div>
                    </el-form-item>
                    <el-form-item label="剧集简介" prop="seresDescription">
                        <el-input
                            v-model="episodeForm.seresDescription"
                            type="textarea"
                            :rows="4"
                            placeholder="请输入剧集简介"
                        />
                    </el-form-item>
                </el-form>
            </FormDialog>

            <!-- 批量上传：仅未上传集，按文件名匹配集数并校验命名规则 -->
            <el-dialog
                v-model="bulkUploadVisible"
                width="1200px"
                destroy-on-close
                class="bulk-upload-dialog"
                @close="resetBulkUploadDialog"
            >
                <template #header>
                    <span class="bulk-upload-dialog__title">
                        批量上传剧集
                        <el-tooltip placement="right" effect="light" popper-class="bulk-upload-tooltip-popper">
                            <template #content>
                                <div class="bulk-upload-hint-tooltip">
                                    请选择本地视频（可多选或点击某一集单独选择）。<strong>仅根据去掉扩展名后的主文件名</strong>识别集数（如
                                    <code>1.mp4</code> 只看 <code>1</code>，避免 <code>.mp4</code> 中的数字干扰）。第 1～9 集须包含
                                    <strong>01～09</strong> 或单独数字 <strong>1～9</strong>（不与相邻数字粘连，避免与 10、11 等混淆）；第 10 集及以上须包含对应数字（如 10、11…）。匹配成功后自动填充剧集名与时长。
                                </div>
                            </template>
                            <el-icon class="bulk-upload-dialog__help-icon" @click.stop>
                                <QuestionFilled />
                            </el-icon>
                        </el-tooltip>
                    </span>
                </template>
                <el-upload
                    ref="bulkUploadRef"
                    :auto-upload="false"
                    multiple
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                    :show-file-list="false"
                    @change="onBulkUploadChange"
                >
                    <el-button type="primary">选择视频（可多选）</el-button>
                </el-upload>

                <div class="bulk-upload-section-title">
                    未上传集数
                    <span class="bulk-upload-stats">
                        共 {{ bulkUnuploadedTotal }} 集未上传，已选择 {{ bulkSelectedFileCount }} 个文件
                    </span>
                </div>
                <div class="bulk-upload-list">
                    <div
                        v-for="row in bulkRows"
                        :key="row.no"
                        class="bulk-row"
                        :class="{
                            'bulk-row--ok': row.file && row.valid,
                            'bulk-row--err': row.file && (!row.valid || row.error),
                        }"
                        role="button"
                        tabindex="0"
                        @click="onBulkRowClick(row.no)"
                        @keydown.enter.prevent="onBulkRowClick(row.no)"
                    >
                        <input
                            :id="'bulk-row-file-' + row.no"
                            type="file"
                            class="bulk-row-file-input"
                            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                            @change="onBulkRowFileChange($event, row.no)"
                        />
                        <div class="bulk-row__line">
                            <span class="bulk-row__no">第 {{ row.no }} 集</span>
                            <span class="bulk-row__dur">{{ row.durationText || '--' }}</span>
                        </div>
                        <div class="bulk-row__file">
                            文件：<span class="bulk-row__file-name" :title="row.fileName">{{ row.fileName || '未选择' }}</span>
                        </div>
                        <div v-if="row.error" class="bulk-row__error">{{ row.error }}</div>
                    </div>
                </div>
                <template #footer>
                    <el-button @click="bulkUploadVisible = false">取消</el-button>
                    <el-button type="primary" :loading="bulkSubmitLoading" :disabled="!canSubmitBulkUpload" @click="submitBulkUpload">
                        保存
                    </el-button>
                </template>
            </el-dialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
    ArrowLeft,
    CopyDocument,
    Loading,
    Picture,
    Plus,
    QuestionFilled,
    Refresh,
    Upload,
    VideoPlay,
} from '@element-plus/icons-vue'
import FormDialog from '@/components/FormDialog.vue'
import DramaPreviewTcPlayer from './components/DramaPreviewTcPlayer.vue'
import {
    getDramaSeriesListByVid,
    getSeriesCountProcess,
    addDramaSeries,
    updateDramaSeries,
    deleteDramaSeries,
    handleSeriesRefresh,
    uploadQueue
} from '@/api/drama'
import type { DramaSeriesItem } from '@/api/drama'
import { uploadByPut, getFileExtension } from '@/utils/obsUpload'
import { DRAMA_COVER_UPLOAD_HINT, getDramaCoverImageValidationError } from '@/utils/dramaCoverImage'
import { throttle } from '@/utils/throttle'
import { hasPerm, PERM_DRAMA_SERIES } from '@/utils/permission'
import { useVodUploadStore } from '@/store/vodUpload'

const props = defineProps<{
    /** 返回按钮回到的剧集管理列表页路由 name */
    backRouteName?: string
}>()

type EpisodeStatus = '已上线' | '未上线'

/** 视频文件状态：0 上传中 1 处理中 2 处理完成 -1 待上传 */
type HandleStatus = 0 | 1 | 2 | -1

// 单集在“剧集管理”页使用的数据结构
type EpisodeRecord = {
    id: string
    no: number
    name: string
    durationSec: number
    durationText: string
    videoUrl: string
    coverUrl?: string
    status: EpisodeStatus
    createdAt: string
    description?: string
    fileId?: string
    /** 文件大小（字节） */
    fileSize?: number | null
    /** 腾讯云点播播放签名（psign），供播放器播放 fileId */
    playSign?: string
    handleStatus?: HandleStatus
}

// 从短剧列表页传入的精简短剧信息（与 index 写入 sessionStorage 的 drama 结构一致）
type DramaLite = {
    id: string
    title: string
    /** 境外剧名 */
    titleLanguage?: string
    coverImg?: string
    coverUrl?: string // 兼容旧 key
    languageCode?: string
    languageName?: string
    language?: string // 兼容
    dramaCategories?: string
    category?: string // 兼容
    /** 短剧总集数，用于限制集数下拉选项 */
    dramaCount?: number
    /** 从列表透传的处理完成数（默认展示，接口返回后覆盖） */
    uploadedDramaCount?: number
    episodeCount?: number // 兼容旧 key
    /** 剧集完结状态：0 未完结，1 已完结 */
    seriesStatus?: 0 | 1
}

const route = useRoute()
const router = useRouter()
const vodUpload = useVodUploadStore()

const dramaId = computed(() => String(route.params.id ?? ''))
console.log("1111111111",dramaId);


// 当前短剧 + 剧集列表
const drama = ref<DramaLite | null>(null)
const episodes = ref<EpisodeRecord[]>([])
const episodesLoading = ref(false)
/** 视频状态刷新接口 loading */
const handleSeriesLoading = ref(false)
const seriesCountProcessLoaded = ref(false)
const seriesCountProcess = ref<{
    uploadedDramaCount: number
    processingDramaCount: number
    uploadingDramaCount: number
    failProcessedDramaCount: number
} | null>(null)

const canAddEpisode = computed(() => hasPerm(PERM_DRAMA_SERIES.add))
const canEditEpisode = computed(() => hasPerm(PERM_DRAMA_SERIES.add))
const canDeleteEpisode = computed(() => hasPerm(PERM_DRAMA_SERIES.delete))

const EPISODE_VIDEO_BUSY_TIP = '上传中、处理中的视频不允许此操作，请稍等片刻'

/** 上传中、处理中时不允许编辑/删除 */
function isEpisodeVideoBusy(record: EpisodeRecord | undefined | null) {
    if (!record) return false
    const hs = record.handleStatus
    return hs === 0 || hs === 1
}
const canHandleSeries = computed(() => hasPerm(PERM_DRAMA_SERIES.handleSeries))

// 预上传：用 el-upload 的 file-list 管理，保存时才 uploadByPut
type UploadFileItem = {
    name: string
    url: string
    raw?: File
    uid?: number
    // Element Plus 的 el-upload 回显通常依赖 status 来判断展示状态
    status?: string
}
const coverFileList = ref<UploadFileItem[]>([])
const videoFileList = ref<UploadFileItem[]>([])
// 编辑时已有的封面/视频 URL（未重新选择时保存接口用）
const existingCoverUrl = ref<string>('')
// 编辑时已有的视频文件信息（接口已不再返回 playUrl，通过 fileId + playSign 支持播放器）
const existingVideoFileId = ref<string>('')
const existingVideoFileSize = ref<number | null>(null)

// 绑定封面上传、视频上传的 el-upload 实例，用于在重置表单或校验失败时调用 clearFiles() 清空组件内部文件列表
const coverUploadRef = ref<{ clearFiles?: () => void } | null>(null)
const videoUploadRef = ref<{ clearFiles?: () => void } | null>(null)

// 悬停预览用：本地所选文件的 blob URL（与 file-list 中的 url 同步，确保预览稳定）
const coverPreviewUrl = ref<string>('')
const videoPreviewUrl = ref<string>('')

const coverPreviewSrc = computed(() => coverPreviewUrl.value || existingCoverUrl.value || '')
const videoPreviewSrc = computed(() => videoPreviewUrl.value || '')

// 将 "02:35"、"5:30" 或 "330" 这类时长文本转成秒数（接口 duration 与表单时长均使用）
/**
 * 将时长字符串解析为秒数
 * 支持 "mm:ss"（如 "02:35"）、纯数字（如 "330" 表示 330 秒）
 * @param duration 时长字符串
 * @returns 秒数，解析失败或空为 0
 */
function parseDurationToSeconds(duration: string): number {
    const trimmed = String(duration || '').trim()
    const parts = trimmed.split(':')
    if (parts.length >= 2) {
        const m = parseInt(parts[0], 10) || 0
        const s = parseInt(parts[1], 10) || 0
        return m * 60 + s
    }
    const n = parseInt(trimmed, 10)
    return Number.isNaN(n) ? 0 : n
}

/**
 * 将秒数格式化为 "mm:ss"（如 90 → "01:30"）
 * @param seconds 秒数（可为小数，会四舍五入）
 * @returns 格式化的时长字符串
 */
function formatDurationSeconds(seconds: number): string {
    const s = Math.round(Number(seconds)) || 0
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/**
 * 计算本地视频文件大小（字节）
 * @param file 视频文件
 */
function calcFileSizeBytes(file: File): number {
    const bytes = Number(file.size ?? 0)
    if (!Number.isFinite(bytes) || bytes <= 0) return 0
    return Math.floor(bytes)
}

function formatEpisodeFileSizeMB(v: number | null | undefined): string {
    if (v == null) return '—'
    const bytes = Number(v)
    if (!Number.isFinite(bytes)) return '—'
    return (bytes / 1000 / 1000).toFixed(2)
}

/**
 * 从本地视频 File 读取时长（秒）
 * 通过 createObjectURL + video 元素 onloadedmetadata 获取，用后 revoke ObjectURL
 * @param file 视频文件
 * @returns Promise<number> 时长秒数；失败时 reject
 */
function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const video = document.createElement('video')
        video.preload = 'metadata'
        const cleanup = () => {
            try {
                video.pause()
            } catch {
                // ignore
            }
            video.onloadedmetadata = null
            video.onerror = null
            video.removeAttribute('src')
            // 先断开 src 再 revoke，减少浏览器对已释放 blob 的后续请求报错
            URL.revokeObjectURL(url)
        }
        video.onloadedmetadata = () => {
            const d = video.duration
            cleanup()
            resolve(d)
        }
        video.onerror = () => {
            cleanup()
            reject(new Error('无法读取视频时长'))
        }
        video.src = url
    })
}

/**
 * 将接口返回的单条剧集转为页面使用的 EpisodeRecord
 * 含 status 转「已上线」/「未上线」、duration 解析为 durationSec/durationText
 * @param item 接口 DramaSeriesItem
 * @returns 列表/表单用 EpisodeRecord
 */
function mapSeriesItemToRecord(item: DramaSeriesItem): EpisodeRecord {
    const rawFileId = (item as any).fileID ?? item.fileId ?? ''
    const rawPlaySign = (item as any).psign ?? item.playSign ?? ''
    // 兼容后端字段命名差异：有的接口返回 playURL/play_url/videoUrl
    const rawPlayUrl =
        (item as any).playUrl ??
        (item as any).playURL ??
        (item as any).play_url ??
        (item as any).videoUrl ??
        ''
    return {
        id: String(item.seresId),
        no: item.seriesCount,
        name: item.seriesName,
        durationSec: parseDurationToSeconds(item.duration),
        durationText: item.duration,
        videoUrl: rawPlayUrl,
        coverUrl: item.coverImg,
        status: item.status === 1 ? '已上线' : '未上线',
        createdAt: item.createdAt ?? '',
        description: item.seresDescription ?? '',
        fileId: rawFileId,
        fileSize: (item as any).fileSize ?? null,
        playSign: rawPlaySign,
        handleStatus: item.handleStatus ?? 0,
    }
}

/**
 * 根据当前短剧 vid 调用接口加载剧集列表
 * 第一步：vid 为空则清空 episodes 并 return
 * 第二步：调用 getDramaSeriesListByVid(vid)，将 data 映射为 EpisodeRecord 写入 episodes
 * 第三步：失败时清空列表并提示
 */
async function loadEpisodesFromApi() {
    const vid = dramaId.value?.trim()
    if (!vid) {
        episodes.value = []
        return
    }
    episodesLoading.value = true
    try {
        const res = await getDramaSeriesListByVid(vid)
        const body = res.data
        if (body?.code === 200 && Array.isArray(body.data)) {
            episodes.value = body.data.map(mapSeriesItemToRecord)
        } else {
            episodes.value = []
            if (body?.message) ElMessage.error(body.message)
        }
    } catch (error) {
        console.error('剧集列表加载失败', error)
        episodes.value = []
        ElMessage.error('剧集列表加载失败')
    } finally {
        episodesLoading.value = false
    }
}

function safeCount(n: unknown): number {
    if (typeof n !== 'number' || !Number.isFinite(n)) return 0
    return Math.max(0, Math.floor(n))
}

async function loadSeriesCountProcessFromApi() {
    const vid = dramaId.value?.trim()
    if (!vid) {
        seriesCountProcessLoaded.value = true
        seriesCountProcess.value = null
        return
    }
    seriesCountProcessLoaded.value = false
    try {
        const res = await getSeriesCountProcess(vid)
        const body = res.data
        if (body?.code === 200 && body.data) {
            seriesCountProcess.value = {
                uploadedDramaCount: safeCount(body.data.uploadedDramaCount),
                processingDramaCount: safeCount(body.data.processingDramaCount),
                uploadingDramaCount: safeCount(body.data.uploadingDramaCount),
                failProcessedDramaCount: safeCount(body.data.failProcessedDramaCount),
            }
            return
        }
        seriesCountProcess.value = null
    } catch (error) {
        console.error('剧集处理进度加载失败', error)
        seriesCountProcess.value = null
    } finally {
        seriesCountProcessLoaded.value = true
    }
}


/**
 * 仅刷新列表数据：尽量复用现有 EpisodeRecord 引用，避免预览区/播放器因对象替换而闪断
 */
async function refreshEpisodesListOnly() {
    const vid = dramaId.value?.trim()
    if (!vid) {
        episodes.value = []
        return
    }
    episodesLoading.value = true
    try {
        const res = await getDramaSeriesListByVid(vid)
        const body = res.data
        if (!(body?.code === 200 && Array.isArray(body.data))) {
            if (body?.message) ElMessage.error(body.message)
            return
        }
        const incoming = body.data.map(mapSeriesItemToRecord) as EpisodeRecord[]
        const existingById = new Map<string, EpisodeRecord>()
        for (const ep of episodes.value) existingById.set(ep.id, ep)

        const next: EpisodeRecord[] = []
        for (const inc of incoming) {
            const exist = existingById.get(inc.id)
            if (exist) {
                Object.assign(exist, inc)
                next.push(exist)
            } else {
                next.push(inc)
            }
        }
        episodes.value = next
    } catch (error) {
        console.error('剧集列表加载失败', error)
        ElMessage.error('剧集列表加载失败')
    } finally {
        episodesLoading.value = false
    }
}

// 顶部面包屑标题（弹窗标题等仍用「原始 + 上线」组合）
const dramaDisplayTitle = computed(() => {
    const baseTitle = drama.value?.title || `短剧 ${dramaId.value}`
    const overseasTitle = String(drama.value?.titleLanguage ?? '').trim()
    return overseasTitle ? `${baseTitle}(${overseasTitle})` : baseTitle
})

/** 页头：上线剧名（与内容管理列表「上线剧名」一致，对应 titleLanguage） */
const dramaOnlineTitleText = computed(() => {
    const t = String(drama.value?.titleLanguage ?? '').trim()
    return t || '—'
})

/** 页头：原始剧名（主标题 title） */
const dramaOriginalTitleText = computed(() => {
    const t = String(drama.value?.title ?? '').trim()
    return t || `短剧 ${dramaId.value}`
})

const title = computed(() => ({
    // 让 PageContent 顶部标题不展示（返回按钮仍由 #top 槽显示）
    firstTitle: '',
    secondTitle: '',
}))

// 短剧总集数（至少为 1），用于生成“集数”下拉选项
const maxEpisodeCount = computed(() => {
    const fromDrama = drama.value?.dramaCount ?? drama.value?.episodeCount
    if (fromDrama && fromDrama > 0) return fromDrama
    // 兜底：如果没有从短剧信息里拿到总集数，就用当前剧集里的最大集数或数量
    const maxEpisodeNo = episodes.value.reduce((currentMax, episode) => (episode.no > currentMax ? episode.no : currentMax), 0)
    if (maxEpisodeNo > 0) return maxEpisodeNo
    if (episodes.value.length > 0) return episodes.value.length
    return 1
})

const uploadedDramaCountDisplay = computed(() => {
    if (seriesCountProcess.value) return seriesCountProcess.value.uploadedDramaCount
    return safeCount(drama.value?.uploadedDramaCount)
})

const processingDramaCountDisplay = computed(() => {
    return seriesCountProcess.value?.processingDramaCount ?? 0
})

const uploadingDramaCountDisplay = computed(() => {
    return seriesCountProcess.value?.uploadingDramaCount ?? 0
})

const failProcessedDramaCountDisplay = computed(() => {
    return seriesCountProcess.value?.failProcessedDramaCount ?? 0
})

const pendingDramaCountDisplay = computed(() => {
    return Math.max(
        0,
        maxEpisodeCount.value -
            uploadedDramaCountDisplay.value -
            processingDramaCountDisplay.value -
            uploadingDramaCountDisplay.value,
    )
})

const showEpisodeProcessDetails = computed(() => {
    if (!seriesCountProcessLoaded.value || !seriesCountProcess.value) return false
    return uploadedDramaCountDisplay.value < maxEpisodeCount.value
})

// 集数下拉选项：1 ~ maxEpisodeCount
const episodeNoOptions = computed(() => Array.from({ length: maxEpisodeCount.value }, (_, i) => i + 1))

/** 列表行：按总集数铺满，无数据的集显示为占位（灰色） */
type EpisodeListRow = { no: number; record: EpisodeRecord | null }

const episodeListRows = computed<EpisodeListRow[]>(() => {
    const total = maxEpisodeCount.value
    const byNo = new Map<number, EpisodeRecord>()
    for (const ep of episodes.value) {
        byNo.set(ep.no, ep)
    }
    return Array.from({ length: total }, (_, i) => {
        const no = i + 1
        return { no, record: byNo.get(no) ?? null }
    })
})

const selectedEpisodeNo = ref<number | null>(null)

const selectedListRow = computed(() => {
    if (selectedEpisodeNo.value == null) return null
    return episodeListRows.value.find((r) => r.no === selectedEpisodeNo.value) ?? null
})

// 默认进入页面不自动播放；仅当用户主动点击列表项时才允许内嵌 TCPlayer 渲染播放
const shouldPlayInline = ref(false)


function selectEpisodeRow(no: number) {
    selectedEpisodeNo.value = no
    shouldPlayInline.value = true
}

/** 中间省略展示 fileId */
function truncateMiddle(s: string, maxLen: number) {
    if (!s || s.length <= maxLen) return s
    const keep = Math.floor((maxLen - 1) / 2)
    return `${s.slice(0, keep)}…${s.slice(-keep)}`
}

function handleStatusLabel(record: EpisodeRecord | null | undefined): string {
    if (!record) return '未上传'
    const h = record.handleStatus
    if (h === -1) return '上传错误'
    if (h === 0) return '上传中'
    if (h === 1) return '处理中'
    if (h === 2) return '处理完成'
    return '--'
}

/**
 * 是否可挂载 TCPlayer：需 fileId + playSign，且点播处理完成（handleStatus===2）。
 * handleStatus===1 时虽可能有签名，转码未完成会导致播放失败，故不挂载。
 * handleStatus 缺省时为兼容旧数据，仍允许尝试播放。
 */
function canTcPlayerPlay(record: EpisodeRecord): boolean {
    if (!record.fileId || !record.playSign) return false
    const h = record.handleStatus
    if (h === 1) return false
    if (h === 0 || h === -1) return false
    if (h === 2) return true
    return true
}

function tcPlayerEpisodeProps(record: EpisodeRecord) {
    return {
        id: record.id,
        no: record.no,
        fileId: record.fileId,
        playSign: record.playSign,
    }
}

// 从短剧列表页写入的 sessionStorage 中恢复短剧信息（用于页头展示）
/**
 * 从 sessionStorage 恢复当前短剧信息（剧集管理页打开时由 index 写入）
 * key 为 drama_episodes_${dramaId}，存 { drama: DramaLite }
 * @returns 有数据并解析成功为 true，否则为 false
 */
function loadFromSession() {
    const key = `drama_episodes_${dramaId.value}`
    const raw = sessionStorage.getItem(key)
    if (!raw) return false
    try {
        const parsed = JSON.parse(raw) as { drama?: DramaLite }
        drama.value = parsed.drama ?? null
        return true
    } catch {
        return false
    }
}

/**
 * session 无数据时的兜底：用 dramaId 构造默认 drama（标题「短剧 ${id}」、语言 zh、总集数 1 等）
 */
function seedFallback() {
    const id = dramaId.value || '0'
    drama.value = {
        id,
        title: `短剧 ${id}`,
        languageCode: 'zh',
        language: 'zh',
        dramaCategories: '',
        category: '',
        dramaCount: 1,
        seriesStatus: 0,
    }
}

// 定时器 ID（用来清除定时器）
let refreshTimer = null

onMounted(async () => {
    const hasDrama = loadFromSession()
    if (!hasDrama) seedFallback()
    await loadEpisodesFromApi()
    await loadSeriesCountProcessFromApi()
    // 默认选中第一集，但不自动播放
    selectedEpisodeNo.value = 1
    shouldPlayInline.value = false

    // ========== 新增：定时刷新（1分15秒 = 75000ms） ==========
    refreshTimer = setInterval(async () => {
        // 只刷新数据，不刷新页面
        await loadEpisodesFromApi()
        await loadSeriesCountProcessFromApi()
        console.log('自动刷新剧集列表 + 顶部上传进度')
    }, 75000)
})

// ========== 新增：页面离开 → 清除定时器 ==========
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

watch(
    () => episodeListRows.value.length,
    (len) => {
        if (len < 1) return
        if (selectedEpisodeNo.value == null) return
        if (selectedEpisodeNo.value > len) selectedEpisodeNo.value = len
        if (selectedEpisodeNo.value < 1) selectedEpisodeNo.value = 1
    },
)

/**
 * 返回短剧内容管理列表页（路由 name: dramaContentManagement）
 */
function goBack() {
    const fallbackPage = route.params.page != null ? String(route.params.page) : ''
    const backQuery =
        Object.keys(route.query || {}).length > 0
            ? { ...route.query }
            : fallbackPage
              ? { page: fallbackPage }
              : undefined
    router.push({
        name: props.backRouteName || 'dramaContentManagement',
        query: backQuery,
    })
}

// 新增 / 编辑剧集对话框
const episodeDialogVisible = ref(false)
const episodeDialogTitle = ref('新增剧集')
const episodeFormRef = ref<FormInstance>()
const episodeSubmitLoading = ref(false)
const editingEpisodeId = ref<string | null>(null)
const coverUploading = ref(false)
// 视频上传改为腾讯云点播后台任务，不在弹窗内阻塞保存
const videoUploading = ref(false)

const episodeForm = reactive({
    name: '',
    no: 1,
    durationText: '',
    status: '已上线' as EpisodeStatus,
    coverUrl: '',
    videoUrl: '',
    seresDescription: '',
    /** 文件大小（字节） */
    fileSize: null as number | null,
})

const episodeFormRules: FormRules = {
    name: [{ required: true, message: '请输入剧集名称', trigger: 'blur' }],
    no: [{ required: true, message: '请选择集数', trigger: 'change' }],
    durationText: [{ required: true, message: '请上传视频或填写时长', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
    // 封面图可非必传
    videoUrl: [
        {
            required: true,
            validator: (_rule: any, _value: any, callback: (err?: Error) => void) => {
                if (videoFileList.value.length > 0 || existingVideoFileId.value) callback()
                else callback(new Error('请上传视频'))
            },
            trigger: 'change',
        },
    ],
}

async function copyToClipboard(text: string, label: string) {
    try {
        await navigator.clipboard.writeText(text)
        ElMessage.success(`${label} 已复制`)
    } catch(error:any) {
        console.log('error',error);
        
        ElMessage.error('复制失败')
    }
}

function getUploadTask(episodeId: string) {
    return vodUpload.getTask(String(episodeId))
}

function getUploadProgressStatus(episodeId: string) {
    const t = vodUpload.getTask(String(episodeId))
    if (!t) return undefined
    if (t.status === 'success') return 'success'
    if (t.status === 'error') return 'exception'
    return undefined
}

/** 上传完成后调用编辑接口，将 fileId、视频地址写入并置 handleStatus=1（处理中） */
async function updateEpisodeAfterUpload(vid:string, episodeId: string, fileId: string, playUrl: string) {
    if (!vid) return
    const ep = episodes.value.find((e) => e.id === episodeId)
    if (!ep) return
    try {
        await updateDramaSeries({
            seresId: Number(ep.id),
            vid,
            seriesCount: ep.no,
            seriesName: ep.name,
            duration: ep.durationText,
            coverImg: ep.coverUrl ?? '',
            playUrl,
            status: ep.status === '已上线' ? 1 : 0,
            seresDescription: ep.description ?? '',
            fileId,
            fileSize: ep.fileSize ?? null,
        })
        // 仅更新当前项，避免整表刷新导致预览区闪断
        ep.fileId = fileId
        ep.videoUrl = playUrl
    } catch (e) {
        console.error('上传完成回调更新剧集失败', e)
        ElMessage.error('更新视频信息失败')
    }
}

/** 上传失败时调用编辑接口，将 handleStatus 置为 -1（上传错误） */
async function setEpisodeUploadError(vid: string, episodeId: string) {
    console.log("11111111111111111111111调用了setEpisodeUploadError");
    if (!vid) return
    const ep = episodes.value.find((e) => e.id === episodeId)
    if (!ep) return
    try {
        await updateDramaSeries({
            seresId: Number(ep.id),
            vid,
            seriesCount: ep.no,
            seriesName: ep.name,
            duration: ep.durationText,
            coverImg: ep.coverUrl ?? '',
            playUrl: ep.videoUrl ?? '',
            status: 0,
            seresDescription: ep.description ?? '',
            fileId: ep.fileId ?? '',
            handleStatus: -1,
        })
        // 仅更新当前项，避免整表刷新导致预览区闪断
        ep.handleStatus = -1
        ep.status = '未上线'
    } catch (e) {
        console.error('上传失败回调更新剧集失败', e)
    }
}

/**
 * 释放 blob URL，避免内存泄漏；仅对以 "blob:" 开头的 url 执行 revokeObjectURL
 * @param url 可能是 blob URL 或普通 http(s) URL
 */
function revokeBlobUrl(url: string | undefined) {
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url)
}

/** 校验通过后写入封面预览与 file-list */
async function applyEpisodeCoverFile(raw: File): Promise<boolean> {
    const coverErr = await getDramaCoverImageValidationError(raw)
    if (coverErr) {
        ElMessage.error(coverErr)
        return false
    }
    const prev = coverFileList.value[0]
    revokeBlobUrl(prev?.url)
    revokeBlobUrl(coverPreviewUrl.value)
    coverPreviewUrl.value = URL.createObjectURL(raw)
    coverFileList.value = [
        { name: raw.name, url: coverPreviewUrl.value, raw, uid: Date.now(), status: 'ready' },
    ]
    return true
}

/**
 * 封面选择变更（el-upload @change）
 * 校验格式、<500KB、宽高比 9:16 后写入预览
 */
async function onCoverFileChange(
    uploadFile: { raw?: File; name?: string },
    fileList: { raw?: File; name?: string }[]
) {
    const raw = (fileList?.length ? fileList[fileList.length - 1]?.raw : uploadFile?.raw) || uploadFile?.raw
    if (!raw) return
    const ok = await applyEpisodeCoverFile(raw)
    if (!ok) {
        coverFileList.value = []
        coverUploadRef.value?.clearFiles()
    }
}

/**
 * 封面已达 limit=1 时再次选择文件（替换）
 */
async function onCoverExceed(files: File[]) {
    const raw = files?.[0]
    if (!raw) return
    await applyEpisodeCoverFile(raw)
}

/**
 * 删除所选封面（el-upload @remove）
 * 释放 blob、清空 coverPreviewUrl；若删除的是「当前封面」虚拟项（无 raw）则清空 existingCoverUrl
 * @param file 被删除的列表项
 */
function onCoverRemove(file: UploadFileItem) {
    revokeBlobUrl(file?.url)
    coverPreviewUrl.value = ''
    if (!file?.raw) existingCoverUrl.value = ''
}

/**
 * 删除所选视频（el-upload @remove）
 * 释放 blob、清空 videoPreviewUrl；若为虚拟项（无 raw）则清空 existingVideoUrl 和时长，否则在无已有视频时清空时长
 * @param file 被删除的列表项
 */
function onVideoRemove(file: UploadFileItem) {
    revokeBlobUrl(file?.url)
    videoPreviewUrl.value = ''
    if (!file?.raw) {
        existingVideoFileId.value = ''
        existingVideoFileSize.value = null
        episodeForm.durationText = ''
        episodeForm.fileSize = null
    } else if (!existingVideoFileId.value) {
        episodeForm.durationText = ''
        episodeForm.fileSize = null
    } else {
        // 保留已有视频：回退文件大小显示/提交值
        episodeForm.fileSize = existingVideoFileSize.value
    }
}

/**
 * 视频选择变更（el-upload @change）
 * 第一步：校验扩展名为视频（mp4/webm/mov/avi/mkv），否则清空并提示
 * 第二步： revoke 上一项及 videoPreviewUrl 的 blob，创建新 blob 写入 videoPreviewUrl 与 videoFileList
 * 第三步：getVideoDuration 回填 episodeForm.durationText
 */
function onVideoFileChange(uploadFile: { raw?: File; name?: string }, fileList: { raw?: File; name?: string }[]) {
    const raw = (fileList?.length ? fileList[fileList.length - 1]?.raw : uploadFile?.raw) || uploadFile?.raw
    if (!raw) return
    const ext = getFileExtension(raw.name)
    if (!/\.(mp4|webm|mov|avi|mkv)$/i.test(ext)) {
        ElMessage.error('请选择视频文件（mp4/webm/mov/avi/mkv）')
        videoFileList.value = []
        videoUploadRef.value?.clearFiles()
        return
    }
    const prev = videoFileList.value[0]
    revokeBlobUrl(prev?.url)
    revokeBlobUrl(videoPreviewUrl.value)
    videoPreviewUrl.value = URL.createObjectURL(raw)
    videoFileList.value = [
        { name: raw.name, url: videoPreviewUrl.value, raw, uid: Date.now(), status: 'ready' },
    ]
    getVideoDuration(raw)//note: 获取视频时长
        .then((seconds) => {
            episodeForm.durationText = formatDurationSeconds(seconds)
        })
        .catch(() => {})
    // 本地文件大小（字节），用于 add/update payload
    episodeForm.fileSize = calcFileSizeBytes(raw)
}

/**
 * 视频已达 limit=1 时再次选择文件（替换）：用新文件替换原视频，逻辑与 onVideoFileChange 一致
 */
function onVideoExceed(files: File[]) {
    const raw = files?.[0]
    if (!raw) return
    const ext = getFileExtension(raw.name)
    if (!/\.(mp4|webm|mov|avi|mkv)$/i.test(ext)) {
        ElMessage.error('请选择视频文件（mp4/webm/mov/avi/mkv）')
        return
    }
    const prev = videoFileList.value[0]
    revokeBlobUrl(prev?.url)
    revokeBlobUrl(videoPreviewUrl.value)
    videoPreviewUrl.value = URL.createObjectURL(raw)
    videoFileList.value = [
        { name: raw.name, url: videoPreviewUrl.value, raw, uid: Date.now(), status: 'ready' },
    ]
    getVideoDuration(raw)
        .then((seconds) => {
            episodeForm.durationText = formatDurationSeconds(seconds)
        })
        .catch(() => {})
    episodeForm.fileSize = calcFileSizeBytes(raw)
}

/**
 * 重置剧集表单并清空上传状态
 * 清空 episodeForm、editingEpisodeId、coverFileList、videoFileList、existingCoverUrl/Url、coverPreviewUrl/Url，
 * 对所有 blob URL 执行 revoke，清空 el-upload 并 resetFields
 */
function resetEpisodeForm() {
    episodeForm.name = ''
    episodeForm.no = 1
    episodeForm.durationText = ''
    episodeForm.status = '已上线'
    episodeForm.coverUrl = ''
    episodeForm.videoUrl = ''
    episodeForm.seresDescription = ''
    episodeForm.fileSize = null
    existingVideoFileSize.value = null
    editingEpisodeId.value = null
    coverFileList.value.forEach((f) => revokeBlobUrl(f.url))
    videoFileList.value.forEach((f) => revokeBlobUrl(f.url))
    coverFileList.value = []
    videoFileList.value = []
    coverPreviewUrl.value = ''
    videoPreviewUrl.value = ''
    existingCoverUrl.value = ''
    existingVideoFileId.value = ''
    coverUploadRef.value?.clearFiles()
    videoUploadRef.value?.clearFiles()
    episodeFormRef.value?.resetFields()
}

/**
 * 打开「新增剧集」弹窗
 * 第一步：resetEpisodeForm，计算下一个可用集数（1~maxEpisodeCount 中未被占用的最小 no）
 * 第二步：episodeForm.no / name 赋默认值（如「第2集」），显示弹窗
 */
function openAddEpisodeDialog() {
    episodeDialogTitle.value = `新增剧集-${dramaDisplayTitle.value}`
    resetEpisodeForm()
    const existingEpisodeNos = episodes.value.map((episode) => episode.no)
    const maxNo = maxEpisodeCount.value
    let nextNo = 1
    for (let episodeNo = 1; episodeNo <= maxNo; episodeNo++) {
        if (!existingEpisodeNos.includes(episodeNo)) {
            nextNo = episodeNo
            break
        }
    }
    episodeForm.no = nextNo
    episodeForm.name = `第${nextNo}集`
    episodeDialogVisible.value = true
}

/** 指定集数打开上传弹窗（用于分集列表空位「上传本集」） */
function openAddEpisodeForNo(no: number) {
    episodeDialogTitle.value = `新增剧集-${dramaDisplayTitle.value}`
    resetEpisodeForm()
    episodeForm.no = no
    episodeForm.name = `第${no}集`
    episodeDialogVisible.value = true
}

/**
 * 打开「编辑剧集」弹窗并回填当前行
 * 第一步：表单回填 row 数据，existingCoverUrl/VideoUrl 存当前行封面/视频 URL（表单项不回填 URL）
 * 第二步：清空本次选择的文件与 blob 预览；将「当前封面/视频」以虚拟项形式放入 file-list，支持与新增一致的删除
 * @param row 当前行剧集数据
 */
function openEditEpisodeDialog(row: EpisodeRecord) {
    episodeDialogTitle.value = `编辑剧集-${dramaDisplayTitle.value}`
    editingEpisodeId.value = row.id
    episodeForm.name = row.name
    episodeForm.no = row.no
    episodeForm.durationText = row.durationText
    episodeForm.status = row.status
    episodeForm.coverUrl = ''
    episodeForm.videoUrl = ''
    episodeForm.seresDescription = row.description ?? ''
    existingCoverUrl.value = row.coverUrl ?? ''
    existingVideoFileId.value = row.fileId ?? ''
    existingVideoFileSize.value = row.fileSize ?? null
    episodeForm.fileSize = row.fileSize ?? null
    // 清掉之前可能选的本地文件（并 revoke blob）
    coverFileList.value.forEach((f) => revokeBlobUrl(f.url))
    videoFileList.value.forEach((f) => revokeBlobUrl(f.url))
    coverPreviewUrl.value = ''
    videoPreviewUrl.value = ''
    // 编辑时把“当前封面/视频”当作一项显示在列表中，和新增一样可点删除
    coverFileList.value = existingCoverUrl.value
        ? [{ name: '当前封面', url: existingCoverUrl.value, uid: -1, status: 'success' }]
        : []
    videoFileList.value = existingVideoFileId.value
        ? [{ name: '当前视频', url: '', uid: -2, status: 'success' }]
        : []
    episodeDialogVisible.value = true
}

/**
 * 提交新增/编辑剧集
 * 第一步：表单校验（含封面/视频必有选择或已有），不通过则 return
 * 第二步：若有本次所选封面/视频则 uploadByPut 得到 URL，否则编辑时用 existingCoverUrl/VideoUrl，写入 episodeForm
 * 第三步：根据 editingEpisodeId 调用 updateDramaSeries 或 addDramaSeries；成功则关闭弹窗并刷新剧集列表
 */
async function submitEpisode() {
    if (!episodeFormRef.value) return

    // 先做表单校验（必填项 + 封面/视频 是否有选择或已有）
    const valid = await episodeFormRef.value.validate().catch(() => false)
    if (!valid) return
    try {
        // 校验通过后再上传并提交
        coverUploading.value = true
        try {
            const coverRaw = coverFileList.value[0]?.raw
            if (coverRaw) {
                const coverErr = await getDramaCoverImageValidationError(coverRaw)
                if (coverErr) {
                    ElMessage.error(coverErr)
                    return
                }
                const url = await uploadByPut(coverRaw, 'drama/episode/cover')
                episodeForm.coverUrl = url
            } else if (editingEpisodeId.value && existingCoverUrl.value) {
                episodeForm.coverUrl = existingCoverUrl.value
            }
    } catch (error: any) {
        ElMessage.error(error?.message ?? '上传失败')
            return
        } finally {
            coverUploading.value = false
        }

        episodeSubmitLoading.value = true
        try {
        const durationSec = parseDurationToSeconds(episodeForm.durationText)
        const mm = String(Math.floor(durationSec / 60)).padStart(2, '0')
        const ss = String(durationSec % 60).padStart(2, '0')
        const durationText = `${mm}:${ss}`

        const selectedVideoRaw = videoFileList.value[0]?.raw as File | undefined

        // 编辑：按ID找
        // 新增：按集数 no 找
        const currentEpisode = editingEpisodeId.value
        ? episodes.value.find(e => e.id === editingEpisodeId.value)
        : episodes.value.find(e => e.no === episodeForm.no);

        const fileSizeToSubmit = episodeForm.fileSize ?? currentEpisode?.fileSize ?? null

        // 判断是否上传失败
        const isUploadFailed = currentEpisode?.handleStatus === -1;
        
        if (editingEpisodeId.value || isUploadFailed) { // 编辑操作
            const vid = dramaId.value?.trim()
            const currentVid = vid  // 把当前 vid 保存为静态常量，不让它被修改
            if (!vid) {
                ElMessage.error('缺少短剧 vid')
                return
            }
            const seresId = Number(editingEpisodeId.value || currentEpisode?.id)
            if (Number.isNaN(seresId)) {
                ElMessage.error('剧集 id 无效')
                return
            }
            // 若选择了新视频：与新增一致先置为上传中（handleStatus=0、fileId 空），再走后台上点；列表与预览区才可显示上传进度条
            const playUrl = ''
            const editRow = episodes.value.find((e) => e.id === editingEpisodeId.value)
            const replacingVideo = Boolean(selectedVideoRaw)
            const res = await updateDramaSeries({
                seresId,
                vid: currentVid,
                seriesCount: episodeForm.no,
                seriesName: episodeForm.name,
                duration: durationText,
                coverImg: episodeForm.coverUrl ?? '',
                playUrl,
                status: episodeForm.status === '已上线' ? 1 : 0,
                seresDescription: episodeForm.seresDescription ?? '',
                fileId: replacingVideo ? '' : editRow?.fileId ?? '',
                fileSize: replacingVideo ? fileSizeToSubmit : editRow?.fileSize ?? null,
                handleStatus: replacingVideo ? 0 : editRow?.handleStatus ?? 0,
            })
            const data = res.data
            if (data?.code === 200 && data?.data === true) {
                ElMessage.success('保存成功')
                episodeDialogVisible.value = false
                await loadEpisodesFromApi()
                // 编辑且选择了新视频：后台上传，完成时调编辑接口更新 fileId、playUrl、handleStatus=1
                if (selectedVideoRaw) {
                    const ep = episodes.value.find((e) => e.id === String(seresId))
                    if (ep) {
                        ep.handleStatus = 0
                        ep.fileId = ''
                        ep.playSign = ''
                        ep.fileSize = fileSizeToSubmit
                    }
                    vodUpload.enqueueEpisodeUpload({
                        episodeId: String(seresId),
                        file: selectedVideoRaw,
                        vid: currentVid,
                        seriesCount: episodeForm.no,
                        onDone: (epId, fileId, videoUrl) => updateEpisodeAfterUpload(currentVid,epId, fileId, videoUrl),
                        onError: (epId) => setEpisodeUploadError(currentVid, epId),
                    })
                }
            } else {
                ElMessage.error(data?.message ?? '保存失败')
            }
        } else { // 新增操作
            const vid = dramaId.value?.trim()
            const currentVid = vid  // 把当前 vid 保存为静态常量，不让它被修改
            if (!vid) {
                ElMessage.error('缺少短剧 vid')
                return
            }
            // 新增：不等待视频上传完成，playUrl/fileId 空，handleStatus=0；上传完成后 onDone 调编辑接口更新
            const res = await addDramaSeries({
                vid:currentVid,
                seriesCount: episodeForm.no,
                seriesName: episodeForm.name,
                duration: durationText,
                coverImg: episodeForm.coverUrl ?? '',
                playUrl: '',
                status: episodeForm.status === '已上线' ? 1 : 0,
                seresDescription: episodeForm.seresDescription ?? '',
                fileId: '',
                fileSize: fileSizeToSubmit,
                handleStatus: 0,
            })
            const data = res.data
            if (data?.code === 200 && data?.data === true) {
                ElMessage.success('新增成功')
                episodeDialogVisible.value = false
                await loadEpisodesFromApi()
                // 新增：后台上传，完成时调编辑接口更新 fileId、playUrl、handleStatus=1
                if (selectedVideoRaw) {
                    const added = episodes.value
                        .filter((ep) => ep.no === episodeForm.no && ep.name === episodeForm.name)
                        .sort((a, b) => Number(b.id) - Number(a.id))[0]
                    if (added?.id) {
                        added.fileSize = fileSizeToSubmit
                        vodUpload.enqueueEpisodeUpload({
                            episodeId: String(added.id),
                            file: selectedVideoRaw,
                            vid:currentVid,
                            seriesCount: episodeForm.no,
                            onDone: (epId, fileId, videoUrl) => updateEpisodeAfterUpload(currentVid,epId, fileId, videoUrl),
                            onError: (epId) => setEpisodeUploadError(currentVid, epId),
                        })
                    }
                }
            } else {
                ElMessage.error(data?.message ?? '新增失败')
            }
        }
        } finally {
            episodeSubmitLoading.value = false
        }
    } finally {
    }
}

/**
 * 删除单集剧集
 * 第一步：二次确认；第二步：调用 deleteDramaSeries(seresId)；成功则刷新列表，失败则提示
 * @param row 当前行剧集数据
 */
async function deleteEpisode(row: EpisodeRecord) {
    try {
        await ElMessageBox.confirm('此操作会删除该剧集，是否继续', '提示', {
            type: 'warning',
            confirmButtonText: '是',
            cancelButtonText: '否',
        })
        const seresId = Number(row.id)
        if (Number.isNaN(seresId)) {
            ElMessage.error('剧集 id 无效')
            return
        }
        const res = await deleteDramaSeries(seresId)
        const data = res.data
        if (data?.code === 200 && data?.data === true) {
            ElMessage.success('删除成功')
            await loadEpisodesFromApi()
        } else {
            ElMessage.error(data?.message ?? '删除失败')
        }
    } catch (error) {
        if (error === 'cancel') return
        ElMessage.error('删除失败')
    }
}


/** 调用后端刷新剧集视频处理状态后重新拉列表 */
async function refreshHandleSeries() {
    handleSeriesLoading.value = true
    try {
        const res = await handleSeriesRefresh()
        const body = res.data as { code?: number; message?: string }
        if (body?.code === 200) {
            ElMessage.success(body.message || '刷新成功')
            // 仅刷新列表数据，避免整页/预览区闪断
            await refreshEpisodesListOnly()
            await loadSeriesCountProcessFromApi()
        } else {
            ElMessage.error(body?.message ?? '刷新失败')
        }
    } catch {
        ElMessage.error('刷新失败')
    } finally {
        handleSeriesLoading.value = false
    }
}

const THROTTLE_WAIT = 500
const throttledGoBack = throttle(goBack, THROTTLE_WAIT)
const throttledRefreshHandleSeries = throttle(refreshHandleSeries, THROTTLE_WAIT)
const throttledOpenAddEpisodeDialog = throttle(openAddEpisodeDialog, THROTTLE_WAIT)
const throttledOpenAddEpisodeForNo = throttle(openAddEpisodeForNo, THROTTLE_WAIT)
const throttledOpenEditEpisodeDialog = throttle(openEditEpisodeDialog, THROTTLE_WAIT)
const throttledDeleteEpisode = throttle(deleteEpisode, THROTTLE_WAIT)

/** 批量上传弹窗 */
type BulkEpisodeRow = {
    no: number
    displayName: string
    durationText: string
    file: File | null
    fileName: string
    error: string | null
    valid: boolean
    handleStatus: number
}

const bulkUploadVisible = ref(false)
const bulkSubmitLoading = ref(false)
const bulkRows = ref<BulkEpisodeRow[]>([])
const bulkUploadRef = ref<{ clearFiles?: () => void } | null>(null)
const bulkCommittedFileKeys = ref<Set<string>>(new Set())
const bulkPendingFiles = ref<File[]>([])
let bulkChangeTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 取「主文件名」用于集数识别：去掉路径与最后一个扩展名（如 .mp4），避免扩展名中的数字（如 mp4 里的 4）参与匹配。
 */
function getStemForEpisodeFilename(filename: string): string {
    const base = String(filename || '').split(/[/\\]/).pop() ?? ''
    const stripped = base.replace(/\.[^.]+$/i, '')
    return stripped.length ? stripped : base
}

/**
 * 文件名与集数校验：1～9 集须包含 01～09，或单独出现 1～9（两侧非数字，避免 ep10 误匹配为第 1 集）；10 集及以上须包含对应数字（如 10、11）
 * 仅在主文件名（无扩展名）上校验。
 */
function validateFilenameForEpisode(no: number, filename: string): boolean {
    const fn = getStemForEpisodeFilename(filename).toLowerCase()
    if (no >= 1 && no <= 9) {
        if (fn.includes(String(no).padStart(2, '0'))) return true
        const re = new RegExp(`(^|[^0-9])${no}([^0-9]|$)`)
        return re.test(fn)
    }
    const re = new RegExp(`(^|[^0-9])${no}([^0-9]|$)`)
    return re.test(fn)
}

/** 在允许集数内解析目标集：优先“第xx集/xx集”，其次按数字位置与上下文打分（仅解析主文件名，扩展名不参与） */
function resolveEpisodeNoFromFilename(filename: string, maxNo: number, allowedNos: Set<number>): number | null {
    const name = getStemForEpisodeFilename(filename)

    // 1) 强规则：第xx集 / xx集
    const explicitRe = /(?:第\s*)?(\d{1,3})\s*集/gi
    let m: RegExpExecArray | null = null
    while ((m = explicitRe.exec(name)) !== null) {
        const n = Number(m[1])
        if (!Number.isFinite(n)) continue
        if (!allowedNos.has(n) || n < 1 || n > maxNo) continue
        if (validateFilenameForEpisode(n, name)) return n
    }

    // 2) 兜底：扫描所有数字片段，按上下文打分（更靠后更优，避免前缀“36-67”抢占）
    const tokenRe = /\d{1,3}/g
    const scored: Array<{ no: number; score: number }> = []
    while ((m = tokenRe.exec(name)) !== null) {
        const raw = m[0]
        const n = Number(raw)
        if (!Number.isFinite(n)) continue
        if (!allowedNos.has(n) || n < 1 || n > maxNo) continue
        if (!validateFilenameForEpisode(n, name)) continue

        const idx = m.index
        const prev = idx > 0 ? name[idx - 1] : ''
        const next = idx + raw.length < name.length ? name[idx + raw.length] : ''
        let score = idx // 越靠后分越高
        if (prev === '第') score += 1000
        if (next === '集') score += 1000
        if (raw.length >= 2) score += 30 // 倾向 36/67，而不是单个 6
        scored.push({ no: n, score })
    }
    if (scored.length === 0) return null
    scored.sort((a, b) => b.score - a.score || b.no - a.no)
    return scored[0].no
}

const bulkUnuploadedTotal = computed(() => bulkRows.value.length)

const bulkSelectedFileCount = computed(() => bulkRows.value.filter((r) => r.file).length)

function isBulkRowUploadable(row: BulkEpisodeRow): row is BulkEpisodeRow & { file: File } {
    if (!row.file || !row.valid || !!row.error) return false
    const allowed = new Set(bulkRows.value.map((r) => r.no))
    const resolved = resolveEpisodeNoFromFilename(row.file.name, maxEpisodeCount.value, allowed)
    if (resolved !== row.no) return false
    return validateFilenameForEpisode(row.no, row.file.name)
}

const canSubmitBulkUpload = computed(() => {
    const rows = bulkRows.value
    const hasAny = rows.some((r) => r.file && r.valid && !r.error)
    if (!hasAny) return false
    return !rows.some((r) => r.file && (!r.valid || r.error))
})

function resetBulkUploadDialog() {
    bulkRows.value = []
    bulkUploadRef.value?.clearFiles?.()
    bulkCommittedFileKeys.value = new Set()
    bulkPendingFiles.value = []
    if (bulkChangeTimer) {
        clearTimeout(bulkChangeTimer)
        bulkChangeTimer = null
    }
}
// 筛选未上传剧集 → 生成批量上传列表 → 打开弹窗
function openBulkUploadDialog() {
    const unuploaded = episodeListRows.value.filter((r) => !r.record || r.record.handleStatus === -1)
    if (unuploaded.length === 0) {
        ElMessage.warning('暂无未上传剧集')
        return
    }
    bulkRows.value = unuploaded
        .sort((a, b) => a.no - b.no) //按集数从小到大排序
        .map((r) => ({
            no:r.no,
            displayName: `第${r.no}集`,
            durationText: '',
            file: null,
            fileName: '',
            error: null,
            valid: false,
            handleStatus: r.record?.handleStatus, // 把状态带进来
        }))
    bulkCommittedFileKeys.value = new Set()
    bulkPendingFiles.value = []
    if (bulkChangeTimer) {
        clearTimeout(bulkChangeTimer)
        bulkChangeTimer = null
    }
    bulkUploadVisible.value = true
}

function getBulkFileKey(file: File): string {
    return `${file.name}__${file.size}__${file.lastModified}`
}

async function onBulkUploadChange(_uploadFile: { raw?: File }, fileList: { raw?: File }[]) {
    const files = (fileList || []).map((f) => f.raw).filter((f): f is File => Boolean(f))
    bulkPendingFiles.value = files
    if (bulkChangeTimer) clearTimeout(bulkChangeTimer)
    bulkChangeTimer = setTimeout(async () => {
        const finalFiles = bulkPendingFiles.value
        const currentKeys = new Set(finalFiles.map((file) => getBulkFileKey(file)))
        const newKeys = new Set<string>()
        for (const key of currentKeys) {
            if (!bulkCommittedFileKeys.value.has(key)) newKeys.add(key)
        }
        await processBulkFilesFromToolbar(finalFiles, newKeys)
        bulkCommittedFileKeys.value = currentKeys
        bulkChangeTimer = null
    }, 80)
}

function onBulkRowClick(no: number) {
    document.getElementById(`bulk-row-file-${no}`)?.click()
}

async function onBulkRowFileChange(e: Event, no: number) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    await applyFileToSingleRow(no, file)
}

/** 点击某一集单独选文件：不重置其它行，且文件名须匹配该行集数 */
async function applyFileToSingleRow(no: number, file: File) {
    const row = bulkRows.value.find((r) => r.no === no)
    if (!row) return
    const allowed = new Set(bulkRows.value.map((r) => r.no))
    const maxNo = maxEpisodeCount.value
    const resolved = resolveEpisodeNoFromFilename(file.name, maxNo, allowed)

    if (resolved == null) {
        row.file = file
        row.fileName = file.name
        row.durationText = ''
        row.error = '无法根据文件名识别到未上传集'
        row.valid = false
        return
    }
    if (resolved !== no) {
        row.file = file
        row.fileName = file.name
        row.durationText = ''
        row.error = `文件名与第 ${no} 集不匹配（识别为第 ${resolved} 集）`
        row.valid = false
        return
    }
    if (!validateFilenameForEpisode(no, file.name)) {
        row.file = file
        row.fileName = file.name
        row.durationText = ''
        row.error = '文件名与集数规则不符（1～9 集需含 01～09 或独立数字 1～9；10 集及以上需含对应数字）'
        row.valid = false
        return
    }

    row.file = file
    row.fileName = file.name
    row.error = null
    row.valid = true
    row.displayName = `第${no}集`
    try {
        const sec = await getVideoDuration(file)
        row.durationText = formatDurationSeconds(sec)
    } catch {
        row.durationText = '00:00'
    }
}

async function processBulkFilesFromToolbar(files: File[], warningFileKeys?: Set<string>) {
    const allowed = new Set(bulkRows.value.map((r) => r.no))
    const maxNo = maxEpisodeCount.value

    bulkRows.value.forEach((r) => {
        r.file = null
        r.fileName = ''
        r.durationText = ''
        r.error = null
        r.valid = false
        r.displayName = `第${r.no}集`
    })

    const occupied = new Set<number>()
    const matched: Array<{ row: BulkEpisodeRow; file: File; no: number }> = []
    let unmatchedCount = 0

    // 第一阶段：只做匹配，无法匹配的文件直接忽略
    for (const file of files) {
        const n = resolveEpisodeNoFromFilename(file.name, maxNo, allowed)
        const row = n != null ? bulkRows.value.find((x) => x.no === n) : undefined

        if (n == null || !row) {
            const key = getBulkFileKey(file)
            if (!warningFileKeys || warningFileKeys.has(key)) unmatchedCount += 1
            continue
        }

        if (occupied.has(n)) {
            row.error = '同一集匹配了多个文件，请检查文件名'
            row.valid = false
            continue
        }

        if (!validateFilenameForEpisode(n, file.name)) {
            // 工具栏多选时：不合法文件视为未匹配，忽略后续处理
            const key = getBulkFileKey(file)
            if (!warningFileKeys || warningFileKeys.has(key)) unmatchedCount += 1
            continue
        }

        occupied.add(n)
        matched.push({ row, file, no: n })
    }

    // 第二阶段：仅对匹配成功的项做时长提取
    for (const item of matched) {
        const { row, file, no } = item
        row.file = file
        row.fileName = file.name
        row.error = null
        row.valid = true
        row.displayName = `第${no}集`
        try {
            const sec = await getVideoDuration(file)
            row.durationText = formatDurationSeconds(sec)
        } catch {
            row.durationText = '00:00'
        }
    }

    if (unmatchedCount > 0) {
        ElMessage.warning(`已忽略 ${unmatchedCount} 个无法匹配到未上传集的文件`)
    }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
    if (size <= 0) return []
    const out: T[][] = []
    for (let j = 0; j < arr.length; j += size) out.push(arr.slice(j, j + size))
    return out
}
// 选文件
// 校验文件
// 批量创建剧集（handleStatus:0 上传中）
// 获取剧集 ID
// 把所有文件加入上传队列
// 后台自动并发上传（最多 5 个）
// 上传成功 → 回调更新地址
// 上传失败 → 回调 setEpisodeUploadError（置为 - 1）
async function submitBulkUpload() {
    if (!canSubmitBulkUpload.value) return
    const vid = dramaId.value?.trim()
    const currentVid = vid  // 把当前 vid 保存为静态常量，不让它被修改
    if (!vid) {
        ElMessage.error('缺少短剧 vid')
        return
    }

    const toSave = bulkRows.value.filter((r) => isBulkRowUploadable(r))
    const invalidSelectedCount = bulkRows.value.filter((r) => r.file && !isBulkRowUploadable(r)).length
    if (invalidSelectedCount > 0) {
        ElMessage.warning(`有 ${invalidSelectedCount} 个文件未匹配或命名不合法，已自动跳过`)
    }
    if (toSave.length < 1) {
        ElMessage.warning('没有可上传的已匹配文件')
        return
    }
    bulkSubmitLoading.value = true
    const prevMaxConcurrent = vodUpload.maxConcurrent
    vodUpload.maxConcurrent = 10
    try {
        for (const group of chunkArray(toSave, 10)) {
            await Promise.all(
                group.map(async (row) => {
                    console.log("----------row--------",row);
                    
                    const durationSec = parseDurationToSeconds(row.durationText)
                    const mm = String(Math.floor(durationSec / 60)).padStart(2, '0')
                    const ss = String(durationSec % 60).padStart(2, '0')
                    const durationText = `${mm}:${ss}`
                    const fileSize = row.file ? calcFileSizeBytes(row.file) : null
                if (row.handleStatus === -1) {
                    // note: handleStatus为 -1【待上传】 → 执行更新接口 updateDramaSeries
                    const added = episodes.value
                        .filter((ep) => ep.no === row.no && ep.name === row.displayName)
                        .sort((a, b) => Number(b.id) - Number(a.id))[0]

                    if (!added?.id) {
                        throw new Error(`第 ${row.no} 集未找到，无法更新`)
                    }
                    const res = await updateDramaSeries({
                        seresId: Number(added.id),
                        vid: currentVid,
                        seriesCount: row.no,
                        seriesName: row.displayName,
                        duration: durationText,
                        coverImg: '',
                        playUrl: '',
                        status: 1,
                        seresDescription: '',
                        fileId: '',
                        fileSize,
                        handleStatus: 0, // 重新上传 → 置为 0
                    })
                    const data = res.data
                    if (data?.code !== 200) {
                        throw new Error(data?.message ?? `第 ${row.no} 集更新失败`)
                    }
                } else {
                    const res = await addDramaSeries({
                        vid: currentVid,
                        seriesCount: row.no,
                        seriesName: row.displayName,
                        duration: durationText,
                        coverImg: '',
                        playUrl: '',
                        status: 1,
                        seresDescription: '',
                        fileId: '',
                        fileSize,
                        handleStatus: 0,
                    })
                    const data = res.data
                    if (data?.code !== 200 || data?.data !== true) {
                        throw new Error(data?.message ?? `第 ${row.no} 集创建失败`)
                    }
                }
                }),
            )
        }

        await loadEpisodesFromApi()

        for (const row of toSave) {// 遍历所有你选中、要上传的剧集文件 toSave数组做了排序 从集数小的开始遍历
            //在刚刚从接口拉回来的最新剧集列表里，找到刚才批量创建出来的那一集
            // 按 集数（no） + 名称（displayName） 匹配
            //按 id 从大到小排序（取最新创建的那条）
            //最终 added = 刚创建好的剧集
            const added = episodes.value 
                .filter((ep) => ep.no === row.no && ep.name === row.displayName)
                .sort((a, b) => Number(b.id) - Number(a.id))[0]

            let queueRes = await uploadQueue({vid:currentVid,index: String(row.no)})//执行完更新任务队列，再执行腾讯云上传
            if (queueRes.data.code === 200 && added?.id && row.file) { // 更新任务队列成功才会上传腾讯云
                added.fileSize = calcFileSizeBytes(row.file)
                vodUpload.enqueueEpisodeUpload({
                    episodeId: String(added.id),
                    file: row.file,
                    vid: currentVid,
                    seriesCount: row.no,
                    onDone: (epId, fileId, videoUrl) => updateEpisodeAfterUpload(currentVid ,epId, fileId, videoUrl),
                    onError: (epId) => setEpisodeUploadError(currentVid, epId),
                })
            }
        }

        ElMessage.success('批量保存已提交，视频将在后台上传')
        bulkUploadVisible.value = false
        resetBulkUploadDialog()
        await loadEpisodesFromApi()
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        ElMessage.error(msg || '批量保存失败')
    } finally {
        vodUpload.maxConcurrent = prevMaxConcurrent
        bulkSubmitLoading.value = false
    }
}

const throttledOpenBulkUploadDialog = throttle(openBulkUploadDialog, THROTTLE_WAIT)

</script>

<style scoped>
/* 隐藏 PageContent 顶部 flex-center justify-between 标题区域 */
.episode-management-page :deep(.flex-center.justify-between) {
    display: none !important;
}

.episode-card {
    min-height: 640px;
}
.episode-header__right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}
.episode-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding-bottom: 14px;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 12px;
}
.episode-header__left {
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 10px;
    min-width: 0;
}
.episode-meta {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 12px 16px;
    min-height: 108px;
    box-sizing: border-box;
    justify-content: center;
    border-radius: 8px;
    background: #fafbfc;
    border: 1px solid #ebeef5;
}
.episode-meta__titles {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.episode-meta__main {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
}
.episode-meta__row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    line-height: 1.45;
    font-size: 14px;
}
.episode-meta__value {
    flex: 1;
    min-width: 0;
    font-weight: 600;
    font-size: 14px;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: min(560px, 52vw);
}
.episode-meta__value--muted {
    font-weight: 500;
    color: #606266;
}
.episode-meta__value--online {
    font-weight: 700;
    font-size: 16px;
}
.episode-meta__upload-stat {
    display: inline-flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 10px 14px;
    align-self: auto;
    padding: 10px 16px;
    min-height: 72px;
    border-radius: 8px;
    background: linear-gradient(135deg, #ecf5ff 0%, #e8f3ff 100%);
    border: 1px solid #b3d8ff;
    box-shadow: 0 1px 2px rgba(64, 158, 255, 0.12);
}
.episode-meta__upload-label {
    font-size: 14px;
    font-weight: 600;
    color: #409eff;
    letter-spacing: 0.02em;
}
.episode-meta__upload-numbers {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    font-size: 18px;
    font-weight: 700;
    color: #303133;
    font-variant-numeric: tabular-nums;
}
.episode-meta__upload-num {
    font-size: 22px;
    font-weight: 800;
    color: #409eff;
    line-height: 1;
}
.episode-meta__upload-sep {
    font-size: 18px;
    font-weight: 600;
    color: #909399;
    margin: 0 2px;
}
.episode-meta__upload-total {
    font-size: 18px;
    font-weight: 700;
    color: #606266;
}
.episode-meta__upload-unit {
    font-size: 14px;
    font-weight: 600;
    color: #606266;
    margin-left: 2px;
}
.episode-meta__upload-process {
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    margin-left: 2px;
    font-size: 12px;
    line-height: 1.35;
    color: #606266;
    white-space: nowrap;
}
.episode-meta__upload-process-line {
    display: block;
}

.upload-field {
    width: 100%;
}
.upload-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.upload-actions .upload-input {
    width: 100%;
}
.upload-vod-process-hint {
    margin: 0 0 10px;
    font-size: 12px;
    color: #909399;
    line-height: 1.55;
    max-width: 520px;
}
.upload-preview {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid #ebeef5;
}
.preview-cover-wrap,
.preview-video-wrap {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
}
.preview-cover-thumb {
    width: 72px;
    height: 96px;
    border-radius: 8px;
    border: 1px solid #ebeef5;
    display: block;
    cursor: pointer;
}
.preview-video-thumb-wrap {
    position: relative;
    display: inline-block;
}
.preview-video-thumb {
    width: 120px;
    height: 68px;
    border-radius: 8px;
    border: 1px solid #ebeef5;
    background: #000;
    object-fit: contain;
    display: block;
    cursor: pointer;
}
.preview-video-play {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
    pointer-events: none;
}
.preview-hint {
    font-size: 12px;
    color: #909399;
}
.video-preview-large {
    padding: 4px;
}
.video-preview-player {
    width: 360px;
    max-width: 90vw;
    max-height: 400px;
    display: block;
    background: #000;
    border-radius: 8px;
}
.status-error {
    color: #f56c6c;
    font-size: 13px;
}
.status-processing {
    color: #409eff;
    font-size: 13px;
}
.status-done {
    color: #67c23a;
    font-size: 13px;
}
.copy-cell {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}
.copy-cell .copy-text {
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.episode-body {
    display: flex;
    gap: 16px;
    align-items: stretch;
    min-height: 440px;
}
.episode-sidebar {
    width: 380px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    background: #fafafa;
    overflow: hidden;
}
.episode-sidebar__title {
    padding: 12px 14px;
    font-weight: 600;
    color: #303133;
    border-bottom: 1px solid #ebeef5;
    background: #fff;
    flex-shrink: 0;
}
.episode-sidebar__scroll {
    flex: 1;
    min-height: 300px;
    max-height: min(64vh, 560px);
}
.episode-sidebar__scroll :deep(.el-scrollbar__wrap) {
    max-height: min(64vh, 560px);
}
.episode-sidebar__scroll :deep(.el-scrollbar__view) {
    padding-top: 8px;
}

.episode-item {
    display: flex;
    align-items: stretch;
    gap: 10px;
    width: calc(100% - 8px);
    margin: 0 4px 8px;
    padding: 10px 10px;
    text-align: left;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    background: #fff;
    cursor: pointer;
    transition:
        background 0.15s,
        border-color 0.15s,
        box-shadow 0.15s;
    font: inherit;
    color: inherit;
    box-sizing: border-box;
}
.episode-item:hover {
    border-color: #c0c4cc;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.episode-item--active {
    border-color: #ffc107;
    background: #fffbeb;
    box-shadow: 0 0 0 1px rgba(255, 193, 7, 0.35);
}
.episode-item--empty {
    opacity: 0.72;
    filter: grayscale(0.35);
}
.episode-item--empty .episode-item__cover-ph {
    background: #ebeef5;
}

.episode-item__cover {
    flex-shrink: 0;
    width: 56px;
    height: 80px;
    border-radius: 6px;
    overflow: hidden;
    background: #f0f2f5;
    border: 1px solid #ebeef5;
}
.episode-item__cover-img {
    width: 56px;
    height: 80px;
    display: block;
}
.episode-item__cover-ph {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c0c4cc;
    background: #ebeef5;
}

.episode-item__mid {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
}
.episode-item__right {
    flex-shrink: 0;
    max-width: 112px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    text-align: right;
}
.episode-item__line {
    line-height: 1.35;
}
.episode-item__line--title {
    font-weight: 600;
    font-size: 14px;
    color: #303133;
}
.episode-item__meta {
    font-size: 12px;
    color: #909399;
}
.episode-item__fid {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 2px;
    min-width: 0;
}
.episode-item__fid-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.episode-item__copy {
    flex-shrink: 0;
    padding: 0 2px !important;
    min-height: auto !important;
}
.episode-item__status {
    font-size: 12px;
    color: #606266;
    font-weight: 500;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
}
.episode-item__status :deep(.el-progress) {
    width: 100%;
}
.episode-item__status-text {
    font-size: 12px;
    font-weight: 600;
}
.episode-item__status-fail-wrap {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
}
.episode-item__status-text--processing {
    color: #409eff;
}
.episode-item__status-text--uploading {
    color: #409eff;
}
.episode-item__status-text--done {
    color: #67c23a;
}
.episode-item__status-text--error {
    color: #f52804;
}
.episode-item__status-text--muted {
    color: #a8abb2;
}
.episode-item__online {
    font-size: 12px;
    font-weight: 600;
}
.episode-item__online--on {
    color: #67c23a;
}
.episode-item__online--off {
    color: #909399;
}

.episode-back-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: 10px;
    border: 1px solid #ebeef5;
    background: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    align-self: center;
}
.episode-back-btn :deep(.el-button__icon) {
    font-size: 18px;
    color: #909399;
}

.episode-page-top-back {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
}

.episode-preview {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    background: #fff;
    overflow: hidden;
}
.episode-preview__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px 10px;
    border-bottom: 1px solid #f0f2f5;
    flex-shrink: 0;
}
.episode-preview__title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #303133;
    line-height: 1.3;
}
.episode-preview__actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: flex-end;
}
/* 禁用按钮仍要触发 tooltip，需包一层可接收 pointer 事件的节点 */
.episode-preview__action-tip-wrap {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
}
.episode-preview__status-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 8px 16px 12px;
    border-bottom: 1px solid #f0f2f5;
    flex-shrink: 0;
}
.episode-preview__status-bar--muted {
    background: #fafafa;
}
.episode-preview__pill {
    font-size: 12px;
    color: #606266;
    padding: 4px 10px;
    border-radius: 4px;
    background: #f4f4f5;
    line-height: 1.4;
}
.episode-preview__online--on {
    color: #67c23a;
}
.episode-preview__online--off {
    color: #909399;
}
.episode-preview__pill--muted {
    color: #909399;
    background: #f0f2f5;
}
.episode-preview__player-wrap {
    flex: 1;
    min-height: 0;
    background: #0a0a0a;
    display: flex;
    align-items: stretch;
    justify-content: center;
}
.episode-preview__player-inner {
    position: relative;
    width: 100%;
    aspect-ratio: 9 / 16;
    max-height: min(60vh, 520px);
    min-height: 240px;
    background: #000;
}
.episode-preview__player-empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px;
    background: #0a0a0a;
}
.episode-preview__processing-icon {
    color: #409eff;
}
.episode-preview__empty-sub {
    margin: 0;
    font-size: 12px;
    color: #909399;
    text-align: center;
    line-height: 1.5;
    max-width: 320px;
}
.episode-preview__empty-text {
    margin: 0;
    font-size: 13px;
    color: #a8abb2;
    text-align: center;
}
.episode-preview__empty-state {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: #fff;
}
.episode-preview__player-empty :deep(.el-empty__description) {
    color: #909399;
}

@media (max-width: 1100px) {
    .episode-body {
        flex-direction: column;
    }
    .episode-sidebar {
        width: 100%;
        max-height: 420px;
    }
    .episode-sidebar__scroll,
    .episode-sidebar__scroll :deep(.el-scrollbar__wrap) {
        max-height: 360px;
    }
    .episode-preview__player-inner {
        max-height: 55vh;
    }
}

.bulk-upload-dialog :deep(.el-dialog) {
    margin-top: 4vh;
    margin-bottom: 4vh;
    max-width: 96vw;
}
.bulk-upload-dialog__title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: inherit;
    font-size: inherit;
    line-height: inherit;
}
.bulk-upload-dialog__help-icon {
    color: #909399;
    cursor: help;
    font-size: 16px;
    vertical-align: middle;
}
.bulk-upload-dialog__help-icon:hover {
    color: #409eff;
}
.bulk-upload-dialog :deep(.el-dialog__body) {
    padding-top: 8px;
    max-height: min(78vh, 900px);
    overflow-y: auto;
}
.bulk-upload-toolbar {
    margin-bottom: 12px;
}
.bulk-upload-section-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin: 16px 0 10px;
}
.bulk-upload-stats {
    font-size: 13px;
    font-weight: 400;
    color: #606266;
}
.bulk-upload-list {
    max-height: min(52vh, 560px);
    min-height: 200px;
    overflow: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
    gap: 8px;
    align-content: start;
    padding: 4px 2px 8px;
}
.bulk-row {
    position: relative;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    background: #fafafa;
    transition:
        border-color 0.15s,
        background 0.15s;
    min-height: 0;
    cursor: pointer;
}
.bulk-row-file-input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
}
.bulk-row--ok {
    border-color: #b3e19d;
    background: #f0f9eb;
}
.bulk-row--err {
    border-color: #fab6b6;
    background: #fef0f0;
}
.bulk-row__line {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    line-height: 1.3;
}
.bulk-row__no {
    font-weight: 600;
    color: #303133;
    flex-shrink: 0;
}
.bulk-row__dur {
    color: #909399;
    flex-shrink: 0;
    font-size: 11px;
    text-align: right;
}
.bulk-row__file {
    margin-top: 4px;
    font-size: 11px;
    color: #909399;
    display: flex;
    flex-wrap: nowrap;
    align-items: baseline;
    gap: 0;
    min-width: 0;
    line-height: 1.3;
}
.bulk-row__file-name {
    color: #606266;
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.bulk-row__error {
    margin-top: 3px;
    font-size: 11px;
    color: #f56c6c;
    line-height: 1.3;
}
</style>

<style>
.cover-preview-popover.el-popper,
.video-preview-popover.el-popper {
    padding: 8px;
}

/* 批量上传说明：悬停在问号右侧展示，多行换行（内容 teleport 到 body，需非 scoped） */
.bulk-upload-tooltip-popper.el-popper {
    max-width: 420px;
    padding: 10px 12px;
    white-space: normal;
    word-break: break-word;
    line-height: 1.55;
}
.bulk-upload-tooltip-popper .bulk-upload-hint-tooltip {
    font-size: 13px;
    line-height: 1.55;
    color: #606266;
}
</style>

