<template>
    <page-content :title="title" class="register-management-page">
        <template v-slot:bottom>
            <el-card class="list-card" shadow="never">
                <input
                    ref="listLogoFileInputRef"
                    type="file"
                    class="logo-list-file-input"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp"
                    @change="onListLogoFileSelected"
                />
                <div class="filter-card">
                    <el-form :model="searchForm" inline class="search-form">
                        <el-form-item>
                            <el-input
                                v-model="searchForm.appName"
                                class="filter-input"
                                placeholder="请输入App名称"
                                clearable
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-input
                                v-model="searchForm.appDeveloperPhone"
                                class="filter-input"
                                placeholder="请输入开发者手机号"
                                clearable
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-input
                                v-model="searchForm.recommenderPhone"
                                class="filter-input"
                                placeholder="请输入推荐人手机号"
                                clearable
                            />
                        </el-form-item>
                        <el-form-item class="search-form__actions">
                            <el-button class="btn-query" type="primary" @click="handleSearch">查询</el-button>
                            <el-button class="btn-reset" @click="handleResetSearch">重置</el-button>
                        </el-form-item>
                        <el-form-item v-if="canAddApp" class="search-form__add">
                            <el-button class="btn-add-app" type="primary" :icon="Plus" @click="openAddDialog">新增App</el-button>
                        </el-form-item>
                    </el-form>
                </div>
                <div class="table-toolbar">
                    <span class="toolbar-actions">
                        <el-icon class="toolbar-icon" @click="loadList"><Refresh /></el-icon>
                    </span>
                </div>
                <el-table
                    class="register-table"
                    :data="list"
                    v-loading="loading"
                    style="width: 100%"
                >
                    <el-table-column label="Logo" width="90" align="center">
                        <template #default="{ row }">
                            <div class="logo-cell">
                                <template v-if="logoImageSrc(row.logoUrl)">
                                    <el-popover placement="right-start" trigger="hover" width="auto">
                                        <template #reference>
                                            <el-image
                                                class="list-logo-thumb"
                                                :src="logoImageSrc(row.logoUrl)"
                                                fit="cover"
                                            >
                                                <template #error>
                                                    <div class="logo-thumb--error">无图</div>
                                                </template>
                                            </el-image>
                                        </template>
                                        <div class="logo-preview-wrap">
                                            <el-image
                                                v-if="logoImageSrc(row.logoUrl)"
                                                class="logo-preview"
                                                :src="logoImageSrc(row.logoUrl)"
                                                fit="contain"
                                            />
                                            <div v-else class="logo-preview--empty">暂无 Logo</div>
                                        </div>
                                    </el-popover>
                                </template>
                                <template v-else>
                                    <div
                                        v-if="canEdit"
                                        class="logo-upload-placeholder"
                                        :class="{
                                            'logo-upload-placeholder--busy': logoListUploadingId === row.id,
                                        }"
                                        title="上传 Logo"
                                        @click.stop="triggerListLogoUpload(row)"
                                    >
                                        <el-icon
                                            v-if="logoListUploadingId === row.id"
                                            class="logo-upload-placeholder__icon is-loading"
                                        >
                                            <Loading />
                                        </el-icon>
                                        <span v-else class="logo-upload-placeholder__text">上传</span>
                                    </div>
                                    <div v-else class="logo-thumb--error">无图</div>
                                </template>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="appName" label="App名称" min-width="120" align="center" show-overflow-tooltip />
                    <el-table-column label="App包名" min-width="160" align="center" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ row.appDesc || '--' }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="storeType" label="商店类型" width="120" align="center" show-overflow-tooltip />
                    <el-table-column prop="vodAppId" label="播放器id" width="120" align="center" show-overflow-tooltip />
                    <el-table-column label="AppId" width="180" align="center">
                        <template #default="{ row }">
                            <span class="copy-cell">
                                <span class="copy-text">{{ row.appId || '--' }}</span>
                                <el-button v-if="row.appId" type="primary" link :icon="CopyDocument" size="small" @click="copyToClipboard(row.appId, 'AppId')" />
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column label="AppSecret" width="180" align="center">
                        <template #default="{ row }">
                            <span class="copy-cell">
                                <span class="copy-text">{{ maskSecret(row.appSecret) }}</span>
                                <el-button v-if="row.appSecret" type="primary" link :icon="CopyDocument" size="small" @click="copyToClipboard(row.appSecret, 'AppSecret')" />
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column label="状态" width="100" align="center">
                        <template #default="{ row }">
                            <el-switch
                                v-if="canEditStatus"
                                :model-value="row.status === 1 || row.status === '1'"
                                active-text="正常"
                                inactive-text="停用"
                                inline-prompt
                                @update:model-value="(val: boolean) => handleStatusChange(row, val)"
                            />
                            <el-tag v-else :type="getStatusTagType(row)">{{ getStatusText(row) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="创建时间" width="180" align="center" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ row.createdAt ?? row.createTime ?? '--' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="300" align="center" fixed="right">
                        <template #default="{ row }">
                            <div class="op-cell">
                                <el-button class="op-btn op-btn--view" link :icon="View" @click="handleView(row)">查看</el-button>
                                <el-button v-if="canEdit" class="op-btn op-btn--edit" link :icon="Edit" @click="handleEdit(row)">编辑</el-button>
                                <el-button v-if="canResetSecret" type="warning" link @click="handleResetSecret(row)">重置AppSecret</el-button>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
                <div class="pagination-wrapper">
                    <el-pagination
                        v-model:current-page="currentPage"
                        v-model:page-size="pageSize"
                        :total="total"
                        :page-sizes="[10, 20, 50]"
                        layout="total, sizes, ->, prev, pager, next, jumper"
                        prev-text="上一页"
                        next-text="下一页"
                        @size-change="loadList"
                        @current-change="loadList"
                    />
                </div>
            </el-card>

            <!-- 查看详情弹窗 -->
            <FormDialog
                v-model="viewVisible"
                title="App详情"
                width="760px"
                app-detail
                :show-cancel="false"
                confirm-text="关闭"
                @confirm="viewVisible = false"
            >
                <el-form v-if="viewRow" class="ld-dialog-detail-form" label-width="auto" label-position="right">
                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">App信息</div>
                            <div class="add-form-section__desc">App名称、App包名、商店类型、商店地址</div>
                        </div>
                        <el-form-item label="App名称"><div class="detail-value">{{ viewRow.appName ?? '--' }}</div></el-form-item>
                        <el-form-item label="App包名"><div class="detail-value">{{ viewRow.appDesc ?? '--' }}</div></el-form-item>
                        <el-form-item label="商店类型"><div class="detail-value">{{ viewRow.storeType ?? viewRow.storeName ?? viewRow.appStoreName ?? '--' }}</div></el-form-item>
                        <el-form-item label="商店地址"><div class="detail-value">{{ viewRow.storeUrl ?? viewRow.appStoreUrl ?? '--' }}</div></el-form-item>
                        <el-form-item label="App Logo">
                            <el-image
                                v-if="viewRow.logoUrl"
                                :src="viewRow.logoUrl"
                                fit="contain"
                                class="view-logo-img"
                            />
                            <div v-else class="detail-value">--</div>
                        </el-form-item>
                        <el-form-item label="AppID"><div class="detail-value">{{ viewRow.appId ?? '--' }}</div></el-form-item>
                        <el-form-item label="AppSecret"><div class="detail-value">{{ maskSecret(viewRow.appSecret) }}</div></el-form-item>
                        <el-form-item label="App状态"><div class="detail-value">{{ getStatusText(viewRow) }}</div></el-form-item>
                        <el-form-item label="创建时间"><div class="detail-value">{{ viewRow.createdAt ?? viewRow.createTime ?? '--' }}</div></el-form-item>
                        <el-form-item label="更新时间"><div class="detail-value">{{ viewRow.updatedAt ?? viewRow.updateTime ?? '--' }}</div></el-form-item>
                    </div>

                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">播放器参数</div>
                            <div class="add-form-section__desc">播放器id、licenceUrl、licenceKey</div>
                        </div>
                        <el-form-item label="播放器id"><div class="detail-value">{{ viewRow.vodAppId ?? '--' }}</div></el-form-item>
                        <el-form-item label="licenseUrl"><div class="detail-value">{{ viewRow.licenseUrl ?? '--' }}</div></el-form-item>
                        <el-form-item label="licenseKey"><div class="detail-value">{{ viewRow.licenseKey ?? '--' }}</div></el-form-item>
                    </div>

                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">开发者</div>
                            <div class="add-form-section__desc">开发者手机号、开发者名字、开发者邮箱</div>
                        </div>
                        <el-form-item label="开发者手机号"><div class="detail-value">{{ viewRow.developerPhone ?? viewRow.appDeveloperPhone ?? '--' }}</div></el-form-item>
                        <el-form-item label="开发者名字"><div class="detail-value">{{ viewRow.developerName ?? viewRow.appDeveloperName ?? '--' }}</div></el-form-item>
                        <el-form-item label="开发者邮箱"><div class="detail-value">{{ viewRow.developerEmail ?? viewRow.appDeveloperEmail ?? '--' }}</div></el-form-item>
                    </div>

                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">推荐人</div>
                            <div class="add-form-section__desc">推荐人手机号、推荐人名称</div>
                        </div>
                        <el-form-item label="推荐人手机号"><div class="detail-value">{{ viewRow.referrerPhone ?? viewRow.recommenderPhone ?? '--' }}</div></el-form-item>
                        <el-form-item label="推荐人名称"><div class="detail-value">{{ viewRow.referrerName ?? viewRow.recommenderName ?? '--' }}</div></el-form-item>
                    </div>
                </el-form>
            </FormDialog>

            <!-- 新增 App 弹窗 -->
            <FormDialog
                v-model="addVisible"
                title="新增App"
                detail-header
                width="760px"
                confirm-text="确定"
                :loading="addSubmitting"
                @close="resetAddForm"
                @confirm="submitAdd"
            >
                <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="120px" class="add-form-single-col">
                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">App信息</div>
                            <div class="add-form-section__desc">App名称、App包名、商店类型、商店地址</div>
                        </div>
                        <el-form-item label="App名称" prop="appName">
                            <el-input v-model="addForm.appName" placeholder="请输入App名称" clearable />
                        </el-form-item>
                        <el-form-item label="App包名" prop="packageName">
                            <el-input v-model="addForm.packageName" placeholder="必填，全局唯一" clearable />
                        </el-form-item>
                        <el-form-item label="商店类型" prop="storeType">
                            <el-select v-model="addForm.storeType" placeholder="请选择" clearable style="width: 100%" @change="onStoreTypeChange">
                                <el-option v-for="opt in STORE_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item v-if="addForm.storeType === '其他'" label="商店名字" prop="storeName">
                            <el-input v-model="addForm.storeName" placeholder="请输入商店名字" clearable />
                        </el-form-item>
                        <el-form-item label="商店地址" prop="storeUrl">
                            <el-input v-model="addForm.storeUrl" placeholder="URL，必填" clearable />
                        </el-form-item>
                        <el-form-item label="App Logo" class="form-item-logo">
                            <div class="logo-field">
                                <el-upload
                                    ref="addLogoUploadRef"
                                    :auto-upload="false"
                                    :limit="1"
                                    :show-file-list="false"
                                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp"
                                    @change="onAddLogoChange"
                                    @exceed="onAddLogoExceed"
                                >
                                    <el-button type="primary" class="logo-pick-btn">选择图片</el-button>
                                </el-upload>
                                <span class="logo-upload-hint">{{ APP_LOGO_UPLOAD_HINT }}</span>
                                <div v-if="addLogoPreviewSrc" class="logo-preview-side">
                                    <el-popover
                                        placement="right-start"
                                        trigger="hover"
                                        width="auto"
                                        popper-class="logo-form-preview-popper"
                                    >
                                        <template #reference>
                                            <el-image
                                                class="logo-preview-img logo-preview-thumb"
                                                :src="addLogoPreviewSrc"
                                                fit="cover"
                                            >
                                                <template #error>
                                                    <div class="logo-thumb--error">无图</div>
                                                </template>
                                            </el-image>
                                        </template>
                                        <div class="logo-preview-wrap">
                                            <el-image
                                                class="logo-preview"
                                                :src="addLogoPreviewSrc"
                                                fit="contain"
                                            />
                                        </div>
                                    </el-popover>
                                    <el-button type="danger" size="small" link @click="clearAddLogo">移除</el-button>
                                </div>
                            </div>
                        </el-form-item>
                        <el-form-item label="是否使用PlayUrl">
                            <el-switch
                                v-model="addForm.usePlayUrl"
                                :active-value="1"
                                :inactive-value="0"
                                inline-prompt
                                active-text="使用"
                                inactive-text="关闭"
                            />
                        </el-form-item>
                    </div>

                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">播放器参数</div>
                            <div class="add-form-section__desc">播放器id、licenceUrl、licenceKey</div>
                        </div>
                        <el-form-item label="播放器id" prop="vodAppId" class="vod-appid-item">
                            <el-input-number
                                v-model="addForm.vodAppId"
                                :min="1"
                                :step="1"
                                :precision="0"
                                :controls="false"
                                controls-position="right"
                                style="width: 100%"
                                placeholder="请输入播放器id"
                            />
                        </el-form-item>
                        <el-form-item label="licenseUrl" prop="licenseUrl">
                            <el-input v-model="addForm.licenseUrl" placeholder="请输入 licenseUrl" clearable />
                        </el-form-item>
                        <el-form-item label="licenseKey" prop="licenseKey">
                            <el-input v-model="addForm.licenseKey" placeholder="请输入 licenseKey" clearable />
                        </el-form-item>
                    </div>

                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">开发者</div>
                            <div class="add-form-section__desc">开发者手机号、开发者名字、开发者邮箱</div>
                        </div>
                        <el-form-item label="开发者手机号" prop="developerPhone">
                            <el-input v-model="addForm.developerPhone" placeholder="请输入" clearable />
                        </el-form-item>
                        <el-form-item label="开发者名字" prop="developerName">
                            <el-input v-model="addForm.developerName" placeholder="请输入" clearable />
                        </el-form-item>
                        <el-form-item label="开发者邮箱" prop="developerEmail">
                            <el-input v-model="addForm.developerEmail" placeholder="请输入" clearable />
                        </el-form-item>
                    </div>

                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">推荐人</div>
                            <div class="add-form-section__desc">推荐人手机号、推荐人名称</div>
                        </div>
                        <el-form-item label="推荐人手机号" prop="referrerPhone">
                            <el-input v-model="addForm.referrerPhone" placeholder="请输入" clearable />
                        </el-form-item>
                        <el-form-item label="推荐人名称" prop="referrerName">
                            <el-input v-model="addForm.referrerName" placeholder="请输入" clearable />
                        </el-form-item>
                    </div>
                </el-form>
            </FormDialog>

            <!-- 编辑弹窗 -->
            <FormDialog
                v-model="editVisible"
                title="编辑App"
                detail-header
                width="760px"
                confirm-text="保存"
                :loading="editSubmitting"
                @close="cancelEdit"
                @confirm="submitEdit"
            >
                <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="120px" class="add-form-single-col">
                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">App信息</div>
                            <div class="add-form-section__desc">App名称、App包名、商店类型、商店地址</div>
                        </div>
                        <el-form-item label="App名称" prop="appName">
                            <el-input v-model="editForm.appName" placeholder="请输入App名称" clearable />
                        </el-form-item>
                        <el-form-item label="App包名">
                            <el-input v-model="editForm.appDesc" placeholder="--" disabled />
                        </el-form-item>
                        <el-form-item label="商店类型" prop="storeType">
                            <el-select v-model="editForm.storeType" placeholder="请选择" clearable style="width: 100%" @change="onEditStoreTypeChange">
                                <el-option v-for="opt in STORE_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item v-if="editForm.storeType === '其他'" label="商店名字" prop="storeName">
                            <el-input v-model="editForm.storeName" placeholder="请输入商店名字" clearable />
                        </el-form-item>
                        <el-form-item label="商店地址" prop="storeUrl">
                            <el-input v-model="editForm.storeUrl" placeholder="URL" clearable />
                        </el-form-item>
                        <el-form-item label="App Logo" class="form-item-logo">
                            <div class="logo-field">
                                <el-upload
                                    ref="editLogoUploadRef"
                                    :auto-upload="false"
                                    :limit="1"
                                    :show-file-list="false"
                                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp"
                                    @change="onEditLogoChange"
                                    @exceed="onEditLogoExceed"
                                >
                                    <el-button type="primary" class="logo-pick-btn">选择图片</el-button>
                                </el-upload>
                                <span class="logo-upload-hint">{{ APP_LOGO_UPLOAD_HINT }}</span>
                                <div v-if="editLogoPreviewSrc" class="logo-preview-side">
                                    <el-popover
                                        placement="right-start"
                                        trigger="hover"
                                        width="auto"
                                        popper-class="logo-form-preview-popper"
                                    >
                                        <template #reference>
                                            <el-image
                                                class="logo-preview-img logo-preview-thumb"
                                                :src="editLogoPreviewSrc"
                                                fit="cover"
                                            >
                                                <template #error>
                                                    <div class="logo-thumb--error">无图</div>
                                                </template>
                                            </el-image>
                                        </template>
                                        <div class="logo-preview-wrap">
                                            <el-image
                                                class="logo-preview"
                                                :src="editLogoPreviewSrc"
                                                fit="contain"
                                            />
                                        </div>
                                    </el-popover>
                                    <el-button type="danger" size="small" link @click="clearEditLogo">移除</el-button>
                                </div>
                            </div>
                        </el-form-item>
                        <el-form-item label="是否使用PlayUrl">
                            <el-switch
                                v-model="editForm.usePlayUrl"
                                :active-value="1"
                                :inactive-value="0"
                                inline-prompt
                                active-text="使用"
                                inactive-text="关闭"
                            />
                        </el-form-item>
                    </div>

                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">播放器参数</div>
                            <div class="add-form-section__desc">播放器id、licenceUrl、licenceKey</div>
                        </div>
                        <el-form-item label="播放器id" prop="vodAppId" class="vod-appid-item">
                            <el-input-number
                                v-model="editForm.vodAppId"
                                :min="1"
                                :step="1"
                                :precision="0"
                                :controls="false"
                                controls-position="right"
                                style="width: 100%"
                                placeholder="请输入播放器id"
                            />
                        </el-form-item>
                        <el-form-item label="licenseUrl" prop="licenseUrl">
                            <el-input v-model="editForm.licenseUrl" placeholder="请输入 licenseUrl" clearable />
                        </el-form-item>
                        <el-form-item label="licenseKey" prop="licenseKey">
                            <el-input v-model="editForm.licenseKey" placeholder="请输入 licenseKey" clearable />
                        </el-form-item>
                    </div>

                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">开发者</div>
                            <div class="add-form-section__desc">开发者手机号、开发者名字、开发者邮箱</div>
                        </div>
                        <el-form-item label="开发者手机号" prop="developerPhone">
                            <el-input v-model="editForm.developerPhone" clearable />
                        </el-form-item>
                        <el-form-item label="开发者名字" prop="developerName">
                            <el-input v-model="editForm.developerName" clearable />
                        </el-form-item>
                        <el-form-item label="开发者邮箱" prop="developerEmail">
                            <el-input v-model="editForm.developerEmail" clearable />
                        </el-form-item>
                    </div>

                    <div class="add-form-section">
                        <div class="add-form-section__head">
                            <div class="add-form-section__title">推荐人</div>
                            <div class="add-form-section__desc">推荐人手机号、推荐人名称</div>
                        </div>
                        <el-form-item label="推荐人手机号" prop="referrerPhone">
                            <el-input v-model="editForm.referrerPhone" clearable />
                        </el-form-item>
                        <el-form-item label="推荐人名称" prop="referrerName">
                            <el-input v-model="editForm.referrerName" clearable />
                        </el-form-item>
                        <el-form-item label="App状态">
                            <el-tag :type="editForm.status === 1 ? 'success' : 'info'">
                                {{ editForm.status === 1 ? '正常' : '停用' }}
                            </el-tag>
                        </el-form-item>
                    </div>
                </el-form>
            </FormDialog>

        </template>
    </page-content>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { hasPerm, PERM_APP } from '@/utils/permission'
import { Plus, CopyDocument, Refresh, View, Edit, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { getAppRegisterPage, registerApp, updateApp, resetAppSecret, editAppStatus } from '@/api/app'
import { STORE_TYPE_OPTIONS, normalizeStoreTypeForForm } from '@/types/app'
import FormDialog from '@/components/FormDialog.vue'
import { uploadByPut } from '@/utils/obsUpload'
import { APP_LOGO_UPLOAD_HINT, getAppLogoImageValidationError } from '@/utils/appLogoImage'

const title = { firstTitle: '注册管理', secondTitle: '已注册 App 列表' }

const canAddApp = computed(() => hasPerm(PERM_APP.add)) // 生成开发者账号和app注册都是这个
const canEditStatus = computed(() => hasPerm(PERM_APP.editStatus))
const canEdit = computed(() => hasPerm(PERM_APP.edit))
const canResetSecret = computed(() => hasPerm(PERM_APP.reset))

const searchForm = reactive({
    appName: '',
    appDeveloperPhone: '',
    recommenderPhone: '',
})

const list = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

function getStatusTagType(row: any) {
    const s = row?.status
    if (s === 1 || s === '1') return 'success'
    return 'info'
}

function getStatusText(row: any) {
    const s = row?.status
    if (s === 1 || s === '1') return '正常'
    return '停用'
}

async function handleStatusChange(row: any, enabled: boolean) {
    const id = row?.id
    if (id == null) return
    const status = enabled ? 1 : 0
    try {
        await ElMessageBox.confirm('确认要修改状态吗？', '提示', {
            type: 'warning',
            customClass: 'app-confirm-dialog',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showClose: true,
        })
    } catch {
        return
    }
    try {
        await editAppStatus(id, status as 0 | 1)
        row.status = status
        ElMessage.success(status === 1 ? '已设为正常' : '已设为停用')
    } catch (e: any) {
        const msg = e?.response?.data?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '状态更新失败')
    }
}

async function copyToClipboard(text: string, label: string) {
    try {
        await navigator.clipboard.writeText(text)
        ElMessage.success(`${label} 已复制`)
    } catch {
        ElMessage.error('复制失败')
    }
}

function logoImageSrc(url: string | undefined | null): string {
    return String(url ?? '').trim()
}

function buildAppUpdatePayload(row: any, extra: Record<string, unknown> = {}) {
    const r = normalizeRecord(row)
    const storeType = normalizeStoreTypeForForm(r.storeType ?? r.storeName ?? '')
    return {
        id: r.id,
        appName: r.appName ?? '',
        appStoreName: storeType === '其他' ? String(r.storeName ?? '').trim() : storeType,
        appStoreUrl: r.storeUrl ?? '',
        licenseUrl: r.licenseUrl || undefined,
        licenseKey: r.licenseKey || undefined,
        appDeveloperPhone: r.developerPhone || undefined,
        appDeveloperName: r.developerName || undefined,
        appDeveloperEmail: r.developerEmail || undefined,
        appDesc: String(r.appDesc ?? '').trim() || undefined,
        vodAppId: Number(r.vodAppId),
        usePlayUrl: r.usePlayUrl,
        ...extra,
    }
}

const listLogoFileInputRef = ref<HTMLInputElement | null>(null)
const listLogoUploadRow = ref<any>(null)
const logoListUploadingId = ref<string | number | null>(null)

function triggerListLogoUpload(row: any) {
    if (!canEdit.value) return
    if (logoImageSrc(row.logoUrl)) return
    if (logoListUploadingId.value != null) return
    listLogoUploadRow.value = row
    listLogoFileInputRef.value?.click()
}

async function onListLogoFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    const row = listLogoUploadRow.value
    listLogoUploadRow.value = null
    if (!file || !row) return

    const coverErr = await getAppLogoImageValidationError(file)
    if (coverErr) {
        ElMessage.error(coverErr)
        return
    }

    logoListUploadingId.value = row.id
    try {
        const logoUrl = await uploadByPut(file, 'app/logo')
        const res: any = await updateApp(buildAppUpdatePayload(row, { logoUrl }))
        const code = Number(res?.data?.code ?? res?.code)
        if (code === 200) {
            row.logoUrl = logoUrl
            ElMessage.success(res?.data?.message?.trim() || 'Logo 已更新')
        } else {
            ElMessage.error(res?.data?.message ?? '保存 Logo 失败')
        }
    } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : 'Logo 上传或保存失败')
    } finally {
        logoListUploadingId.value = null
    }
}

function maskSecret(secret: string | null | undefined): string {
    const s = String(secret ?? '')
    if (!s) return '--'
    if (s.length <= 8) return `${s.slice(0, 2)}****${s.slice(-2)}`
    return `${s.slice(0, 4)}****${s.slice(-4)}`
}

/** 将接口返回的字段映射为列表/详情使用的字段 */
function normalizeRecord(row: any) {
    return {
        ...row,
        packageName: row.packageName ?? row.appPkg,
        storeType: normalizeStoreTypeForForm(row.storeType ?? row.appStoreName),
        storeName: row.storeName ?? row.appStoreName,
        storeUrl: row.storeUrl ?? row.appStoreUrl,
        logoUrl: row.logoUrl ?? '',
        licenseUrl: row.licenseUrl,
        licenseKey: row.licenseKey,
        registerFileUrl: row.registerFileUrl ?? row.licenseFileUrl,
        developerPhone: row.developerPhone ?? row.appDeveloperPhone,
        developerName: row.developerName ?? row.appDeveloperName,
        developerEmail: row.developerEmail ?? row.appDeveloperEmail,
        referrerPhone: row.referrerPhone ?? row.recommenderPhone,
        referrerName: row.referrerName ?? row.recommenderName,
        vodAppId: row.vodAppId ?? row.vodAppID ?? row.vod_app_id,
        usePlayUrl: Number(row.usePlayUrl ?? 0) === 1 ? 1 : 0,
    }
}

const viewVisible = ref(false)
const viewRow = ref<any>(null)

const addVisible = ref(false)
const addFormRef = ref<FormInstance>()
const addSubmitting = ref(false)

const editVisible = ref(false)
const editFormRef = ref<FormInstance>()
const editSubmitting = ref(false)
const editingId = ref<string | number | null>(null)

type LogoPickState = {
    raw: File | null
    previewUrl: string
    existingUrl: string
}

const addLogo = reactive<LogoPickState>({ raw: null, previewUrl: '', existingUrl: '' })
const editLogo = reactive<LogoPickState>({ raw: null, previewUrl: '', existingUrl: '' })
const addLogoUploadRef = ref<{ clearFiles?: () => void } | null>(null)
const editLogoUploadRef = ref<{ clearFiles?: () => void } | null>(null)
/** 编辑时用户主动移除已有 Logo，保存时传空字符串以清空 */
const editLogoRemoved = ref(false)

const addLogoPreviewSrc = computed(() => addLogo.previewUrl || addLogo.existingUrl || '')
const editLogoPreviewSrc = computed(() => editLogo.previewUrl || editLogo.existingUrl || '')

function revokeLogoBlob(url: string) {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

async function applyLogoFile(target: LogoPickState, file: File): Promise<boolean> {
    const err = await getAppLogoImageValidationError(file)
    if (err) {
        ElMessage.error(err)
        return false
    }
    revokeLogoBlob(target.previewUrl)
    target.raw = file
    target.previewUrl = URL.createObjectURL(file)
    target.existingUrl = ''
    return true
}

function clearAddLogoUpload() {
    addLogoUploadRef.value?.clearFiles?.()
}

function clearEditLogoUpload() {
    editLogoUploadRef.value?.clearFiles?.()
}

async function handleLogoFilePick(target: LogoPickState, raw: File, clearUpload: () => void): Promise<void> {
    const ok = await applyLogoFile(target, raw)
    if (!ok) clearUpload()
}

async function onAddLogoChange(uploadFile: { raw?: File }, fileList: { raw?: File }[]) {
    const raw = (fileList?.length ? fileList[fileList.length - 1]?.raw : uploadFile?.raw) || uploadFile?.raw
    if (!raw) return
    await handleLogoFilePick(addLogo, raw, clearAddLogoUpload)
}

async function onAddLogoExceed(files: File[]) {
    const raw = files?.[0]
    if (!raw) return
    clearAddLogoUpload()
    await handleLogoFilePick(addLogo, raw, clearAddLogoUpload)
}

async function onEditLogoChange(uploadFile: { raw?: File }, fileList: { raw?: File }[]) {
    const raw = (fileList?.length ? fileList[fileList.length - 1]?.raw : uploadFile?.raw) || uploadFile?.raw
    if (!raw) return
    editLogoRemoved.value = false
    await handleLogoFilePick(editLogo, raw, clearEditLogoUpload)
}

async function onEditLogoExceed(files: File[]) {
    const raw = files?.[0]
    if (!raw) return
    clearEditLogoUpload()
    editLogoRemoved.value = false
    await handleLogoFilePick(editLogo, raw, clearEditLogoUpload)
}

function clearAddLogo() {
    revokeLogoBlob(addLogo.previewUrl)
    addLogo.previewUrl = ''
    addLogo.raw = null
    addLogo.existingUrl = ''
    clearAddLogoUpload()
}

function clearEditLogo() {
    const hadLogo = Boolean(editLogo.previewUrl || editLogo.existingUrl)
    revokeLogoBlob(editLogo.previewUrl)
    editLogo.previewUrl = ''
    editLogo.raw = null
    editLogo.existingUrl = ''
    clearEditLogoUpload()
    if (hadLogo) editLogoRemoved.value = true
}

function resetLogoPick(target: LogoPickState) {
    revokeLogoBlob(target.previewUrl)
    target.previewUrl = ''
    target.raw = null
    target.existingUrl = ''
}

async function resolveLogoUrlForSubmit(target: LogoPickState): Promise<string | undefined> {
    if (target.raw) {
        const err = await getAppLogoImageValidationError(target.raw)
        if (err) {
            ElMessage.error(err)
            throw new Error(err)
        }
        return uploadByPut(target.raw, 'app/logo')
    }
    const existing = String(target.existingUrl ?? '').trim()
    return existing || undefined
}

const addForm = reactive({
    appName: '',
    packageName: '',
    storeType: '',
    storeName: '',
    storeUrl: '',
    logoUrl: '',
    licenseUrl: '',
    licenseKey: '',
    developerPhone: '',
    developerName: '',
    developerEmail: '',
    referrerPhone: '',
    referrerName: '',
    vodAppId: null as number | null,
    usePlayUrl: 0 as 0 | 1,
})

const editForm = reactive({ ...addForm, appDesc: '', status: 1 as number })

const addRules: FormRules = {
    appName: [{ required: true, message: '请输入App名称', trigger: 'blur' }],
    packageName: [{ required: true, message: '请输入App包名（全局唯一）', trigger: 'blur' }],
    storeUrl: [{ required: true, message: '请输入App商店地址', trigger: 'blur' }],
    vodAppId: [
        {
            required: true,
            validator: (_rule, value, callback) => {
                if (typeof value === 'number' && Number.isFinite(value) && value > 0) callback()
                else callback(new Error('请输入播放器id'))
            },
            trigger: 'change',
        },
    ],
}

const editRules: FormRules = {
    appName: addRules.appName,
    storeUrl: addRules.storeUrl,
    vodAppId: addRules.vodAppId,
}

function onStoreTypeChange() {
    if (addForm.storeType !== '其他') addForm.storeName = ''
}

function onEditStoreTypeChange() {
    if (editForm.storeType !== '其他') editForm.storeName = ''
}


async function loadList() {
    loading.value = true
    try {
        const body: any = {
            current: currentPage.value,
            size: pageSize.value,
        }
        if (searchForm.appName?.trim()) body.appName = searchForm.appName.trim()
        if (searchForm.appDeveloperPhone?.trim()) body.appDeveloperPhone = searchForm.appDeveloperPhone.trim()
        if (searchForm.recommenderPhone?.trim()) body.recommenderPhone = searchForm.recommenderPhone.trim()

        const res: any = await getAppRegisterPage(body)
        const data = res?.data?.data ?? res?.data
        if (data?.records) {
            list.value = (data.records as any[]).map(normalizeRecord)
            total.value = data.total ?? 0
        } else {
            list.value = []
            total.value = 0
        }
    } catch {
        list.value = []
        total.value = 0
    } finally {
        loading.value = false
    }
}

function handleSearch() {
    currentPage.value = 1
    loadList()
}

function handleResetSearch() {
    searchForm.appName = ''
    searchForm.appDeveloperPhone = ''
    searchForm.recommenderPhone = ''
    currentPage.value = 1
    loadList()
}

function handleView(row: any) {
    viewRow.value = { ...row }
    viewVisible.value = true
}

function handleEdit(row: any) {
    const r = normalizeRecord(row)
    editingId.value = r.id
    editForm.appName = r.appName ?? ''
    editForm.appDesc = r.appDesc ?? ''
    const storeType = normalizeStoreTypeForForm(r.storeType ?? r.storeName ?? '')
    editForm.storeType = storeType
    editForm.storeName = storeType === '其他' ? String(r.storeName ?? '').trim() : ''
    editForm.storeUrl = r.storeUrl ?? ''
    editForm.logoUrl = r.logoUrl ?? ''
    editLogoRemoved.value = false
    resetLogoPick(editLogo)
    editLogo.existingUrl = String(r.logoUrl ?? '').trim()
    editForm.licenseUrl = r.licenseUrl ?? ''
    editForm.licenseKey = r.licenseKey ?? ''
    editForm.developerPhone = r.developerPhone ?? ''
    editForm.developerName = r.developerName ?? ''
    editForm.developerEmail = r.developerEmail ?? ''
    editForm.referrerPhone = r.referrerPhone ?? ''
    editForm.referrerName = r.referrerName ?? ''
    editForm.vodAppId = r.vodAppId != null && r.vodAppId !== '' ? Number(r.vodAppId) : null
    editForm.usePlayUrl = Number(r.usePlayUrl ?? 0) === 1 ? 1 : 0
    const st = r.status
    editForm.status = st === 0 || st === '0' ? 0 : 1
    editVisible.value = true
}

function cancelEdit() {
    editingId.value = null
    editLogoRemoved.value = false
    resetLogoPick(editLogo)
    clearEditLogoUpload()
}

async function handleResetSecret(row: any) {
    try {
        await ElMessageBox.confirm('确定要重置该 App 的 AppSecret 吗？重置后原凭证将失效。', '提示', {
            type: 'warning',
        })
        const res: any = await resetAppSecret(row.id)
        const data = res?.data?.data ?? res?.data
        const appId = data?.appId ?? ''
        const appSecret = data?.appSecret ?? ''
        loadList()
        await ElMessageBox.alert(
            `重置成功，请妥善保存新凭证：\n\nAppId：${appId}\nAppSecret：${appSecret}`,
            '新凭证',
            { type: 'success', confirmButtonText: '知道了' }
        )
    } catch (e: any) {
        if (e === 'cancel') return
        const msg = e?.response?.data?.message
        ElMessage.error(msg && typeof msg === 'string' ? msg : '重置失败')
    }
}

function openAddDialog() {
    addVisible.value = true
}


function resetAddForm() {
    resetLogoPick(addLogo)
    clearAddLogoUpload()
    addForm.appName = ''
    addForm.packageName = ''
    addForm.storeType = ''
    addForm.storeName = ''
    addForm.storeUrl = ''
    addForm.logoUrl = ''
    addForm.licenseUrl = ''
    addForm.licenseKey = ''
    addForm.developerPhone = ''
    addForm.developerName = ''
    addForm.developerEmail = ''
    addForm.referrerPhone = ''
    addForm.referrerName = ''
    addForm.vodAppId = null
    addForm.usePlayUrl = 0
    addFormRef.value?.resetFields()
}

async function submitAdd() {
    if (!addFormRef.value) return
    await addFormRef.value.validate(async (valid) => {
        if (!valid) return
        addSubmitting.value = true
        try {
            const logoUrl = await resolveLogoUrlForSubmit(addLogo)
            const payload = {
                appName: addForm.appName,
                appPkg: addForm.packageName,
                appStoreName: addForm.storeType === '其他' ? addForm.storeName : addForm.storeType,
                appStoreUrl: addForm.storeUrl,
                logoUrl,
                licenseUrl: addForm.licenseUrl || undefined,
                licenseKey: addForm.licenseKey || undefined,
                appDeveloperPhone: addForm.developerPhone || undefined,
                appDeveloperName: addForm.developerName || undefined,
                appDeveloperEmail: addForm.developerEmail || undefined,
                recommenderPhone: addForm.referrerPhone || undefined,
                recommenderName: addForm.referrerName || undefined,
                vodAppId: Number(addForm.vodAppId),
                usePlayUrl: addForm.usePlayUrl,
            }
            await registerApp(payload)
            ElMessage.success('新增成功')
            addVisible.value = false
            loadList()
        } catch (e) {
            ElMessage.error('新增失败')
        } finally {
            addSubmitting.value = false
        }
    })
}

async function submitEdit() {
    if (!editFormRef.value || editingId.value == null) return
    await editFormRef.value.validate(async (valid) => {
        if (!valid) return
        editSubmitting.value = true
        try {
            let logoUrl: string | undefined
            if (editLogo.raw || editLogo.existingUrl) {
                logoUrl = await resolveLogoUrlForSubmit(editLogo)
            } else if (editLogoRemoved.value) {
                logoUrl = ''
            }
            const editRow = list.value.find((item) => item.id === editingId.value)
            const payload = buildAppUpdatePayload(
                {
                    ...(editRow ?? {}),
                    id: editingId.value,
                    appName: editForm.appName,
                    appDesc: editForm.appDesc,
                    storeType: editForm.storeType,
                    storeName: editForm.storeName,
                    storeUrl: editForm.storeUrl,
                    licenseUrl: editForm.licenseUrl,
                    licenseKey: editForm.licenseKey,
                    developerPhone: editForm.developerPhone,
                    developerName: editForm.developerName,
                    developerEmail: editForm.developerEmail,
                    vodAppId: editForm.vodAppId,
                    usePlayUrl: editForm.usePlayUrl,
                },
                { logoUrl }
            )
            await updateApp(payload)
            ElMessage.success('保存成功')
            editVisible.value = false
            loadList()
        } catch (e) {
            ElMessage.error('保存失败')
        } finally {
            editSubmitting.value = false
        }
    })
}

onMounted(() => {
    loadList()
})

</script>

<style scoped>
/* 筛选卡片：距标题区 12px，距列表卡片 20px，圆角 20px */
.register-management-page :deep(.page-content-body) {
    padding-top: 0;
}
.filter-card {
    margin-top: 0;
    margin-bottom: 0;
    border-radius: 0;
    overflow: visible;
    padding: 0;
    box-sizing: border-box;
}
.filter-card :deep(.el-card__body) {
    padding: 16px 20px;
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
.search-form :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 0;
}
/* 筛选输入：200×43，背景 #EDF1FC，圆角 10px */
.filter-input {
    width: 200px;
}
.filter-card :deep(.filter-input .el-input__wrapper) {
    width: 200px;
    min-height: 34px;
    padding: 0 10px;
    background-color: #edf1fc;
    border-radius: 8px;
    box-shadow: none;
    border: none;
}
.filter-card :deep(.filter-input .el-input__wrapper:hover),
.filter-card :deep(.filter-input .el-input__wrapper.is-focus) {
    box-shadow: none;
}
.filter-card :deep(.filter-input .el-input__inner) {
    height: 34px;
    line-height: 34px;
    font-size: 12px;
    color: #303133;
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
/* 查询 80×43 #2D53EB；重置 80×43 #EEF1FE + 1px #2D53EB；新增 128×43 #2D53EB 圆角 10px */
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
.btn-add-app {
    width: 120px;
    height: 34px;
    padding: 0 12px;
    border-radius: 10px;
    background-color: #2d53eb;
    border-color: #2d53eb;
}
.btn-add-app:hover,
.btn-add-app:focus {
    background-color: #2447d4;
    border-color: #2447d4;
}

.list-card {
    border-radius: 20px;
    overflow: hidden;
}
/* 列表卡片内边距：上下 24px、左右 20px */
.list-card :deep(.el-card__body) {
    padding: 12px 20px 20px;
    box-sizing: border-box;
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
    gap: 12px;
}
.toolbar-icon {
    font-size: 18px;
    color: #909399;
    cursor: pointer;
}
.toolbar-icon:hover {
    color: #409eff;
}
/* 表格：不要竖线/外框，仅保留行间 border-bottom（勿使用 el-table border） */
.register-table {
    --el-table-border-color: #ebeef5;
    --el-table-fixed-right-column: none;
    --el-table-fixed-left-column: none;
}
.register-table :deep(.el-table__fixed-right),
.register-table :deep(.el-table__fixed-left) {
    box-shadow: none !important;
}
.register-table :deep(.el-table__inner-wrapper::before) {
    display: none;
}
.register-table :deep(.el-table__cell) {
    border-right: none !important;
    border-left: none !important;
    border-top: none !important;
}
.register-table :deep(thead th.el-table__cell),
.register-table :deep(tbody td.el-table__cell) {
    border-bottom: 1px solid #ebeef5 !important;
}

/* 列表表头区域圆角 8px */
.register-table :deep(.el-table__header-wrapper) {
    border-radius: 8px;
    overflow: hidden;
}
.register-table :deep(thead th.el-table__cell:first-child) {
    border-top-left-radius: 8px;
}
.register-table :deep(thead th.el-table__cell:last-child) {
    border-top-right-radius: 8px;
}

/* 列表表头：背景 #EDF1FC，13px bold #000，上下 padding 10px */
.register-table :deep(.el-table__header-wrapper th.el-table__cell) {
    background-color: #edf1fc !important;
    padding: 10px 12px;
    box-sizing: border-box;
    vertical-align: middle;
}
.register-table :deep(.el-table__header .cell) {
    font-size: 13px;
    font-weight: 700;
    color: #000000;
    line-height: 18px;
}
/* 表体单元格：12px #575757，行高 18px */
.register-table :deep(.el-table__body .el-table__cell .cell) {
    font-size: 12px;
    color: #575757;
    line-height: 18px;
}
.register-table :deep(tbody td.el-table__cell) {
    font-size: 12px;
    color: #575757;
    box-sizing: border-box;
}
.register-table :deep(.el-table__body .el-button.is-link) {
    font-size: 12px;
    line-height: 18px;
    vertical-align: baseline;
}
/* 复制 icon：#2D53EB */
.register-table :deep(.copy-cell .el-button.is-link) {
    color: #2d53eb !important;
}
.register-table :deep(.copy-cell .el-button.is-link .el-icon),
.register-table :deep(.copy-cell .el-button.is-link svg) {
    color: #2d53eb !important;
}
/* 查看、编辑：#2D53EB */
.register-table :deep(.el-table__body .el-button.is-link.el-button--primary) {
    color: #2d53eb !important;
}
.register-table :deep(.el-table__body .el-button.is-link.el-button--primary .el-icon) {
    color: #2d53eb !important;
}
/* 重置 AppSecret：#E6A23C */
.register-table :deep(.el-table__body .el-button.is-link.el-button--warning) {
    color: #e6a23c !important;
}
.register-table :deep(.el-table__body .el-button.is-link.el-button--warning .el-icon) {
    color: #e6a23c !important;
}

/* 查看 / 编辑：与用户管理一致（有 icon，不同颜色） */
.register-table :deep(.op-cell) {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: 2px;
    white-space: nowrap;
}

.register-table :deep(.op-btn) {
    font-size: 12px;
    padding: 4px 4px;
}

.register-table :deep(.op-btn--view) {
    color: #ff9900 !important;
}
.register-table :deep(.op-btn--view .el-icon),
.register-table :deep(.op-btn--view svg) {
    color: #ff9900;
}

.register-table :deep(.op-btn--edit) {
    color: #409eff !important;
}
.register-table :deep(.op-btn--edit .el-icon),
.register-table :deep(.op-btn--edit svg) {
    color: #409eff;
}
/* 状态开关：主题色 #2D53EB */
.register-table :deep(.el-switch) {
    --el-switch-on-color: #2d53eb;
}
.register-table :deep(.el-table__fixed-right-patch) {
    background-color: #edf1fc;
}
.add-form-single-col {
    min-height: 480px;
}
.add-form-single-col .el-form-item .el-input,
.add-form-single-col .el-form-item .el-select,
.add-form-single-col .el-form-item .el-input-number {
    width: 100%;
}
.add-form-section {
    padding: 14px 16px 6px;
    border: 1px solid #e4e7ed;
    border-radius: 12px;
    background: linear-gradient(165deg, #f8fbff 0%, #ffffff 55%);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.add-form-section + .add-form-section {
    margin-top: 14px;
}
.add-form-section__head {
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f2f5;
}
.add-form-section__title {
    position: relative;
    padding-left: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}
.add-form-section__title::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #409eff;
    transform: translateY(-50%);
}
.add-form-section__desc {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
}
.vod-appid-item :deep(.el-input__inner) {
    text-align: left;
}
.upload-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
}
.upload-tip--edit {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}
.upload-tip--edit .upload-tip__label {
    flex-shrink: 0;
}
.upload-tip--edit .upload-tip__link {
    flex-shrink: 0;
}
.upload-tip--edit .upload-tip__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}
.upload-tip--add {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}
.upload-tip--add .upload-tip__label {
    flex-shrink: 0;
}
.upload-tip--add .upload-tip__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}
/* 注册文件 el-upload 列表：文件名单行省略，不超出表单 */
.register-file-upload :deep(.el-upload-list) {
    min-width: 0;
    max-width: 100%;
}
.register-file-upload :deep(.el-upload-list__item) {
    min-width: 0;
}
.register-file-upload :deep(.el-upload-list__item-name) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
}
.copy-cell {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}
.copy-cell .copy-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 140px;
    display: inline-block;
}

.logo-list-file-input {
    display: none;
}
.logo-cell {
    display: flex;
    align-items: center;
    justify-content: center;
}
.list-logo-thumb {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 1px solid #ebeef5;
    flex: 0 0 auto;
    overflow: hidden;
    cursor: pointer;
    box-sizing: border-box;
}
.list-logo-thumb :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.logo-thumb--error {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: #f2f3f5;
    color: #909399;
    font-size: 11px;
    box-sizing: border-box;
}
.logo-upload-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 1px dashed #c0c4cc;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: #fafafa;
    flex: 0 0 auto;
    box-sizing: border-box;
}
.logo-upload-placeholder:hover:not(.logo-upload-placeholder--busy) {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
}
.logo-upload-placeholder--busy {
    cursor: wait;
    pointer-events: none;
}
.logo-upload-placeholder__text {
    font-size: 11px;
    line-height: 1;
    color: #909399;
}
.logo-upload-placeholder:hover:not(.logo-upload-placeholder--busy) .logo-upload-placeholder__text {
    color: var(--el-color-primary);
}
.logo-upload-placeholder__icon {
    font-size: 18px;
    color: var(--el-color-primary);
}
.logo-preview-wrap {
    padding: 4px;
}
.logo-preview {
    max-width: 200px;
    max-height: 200px;
    width: auto;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
    display: block;
}
.logo-preview--empty {
    width: 120px;
    height: 120px;
    border-radius: 8px;
    background: #f2f3f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #909399;
    font-size: 13px;
}

.view-logo-img {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    border: 1px solid #ebeef5;
}

.form-item-logo {
    align-items: center;
}
.form-item-logo :deep(.el-form-item__label) {
    align-self: center;
    padding-top: 0;
    line-height: 1.4;
}
.form-item-logo :deep(.el-form-item__content) {
    display: flex;
    align-items: center;
    line-height: normal;
}
.logo-field {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 12px;
    width: 100%;
}
.logo-preview-side {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
}
.logo-preview-img,
.logo-preview-thumb {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 1px solid var(--el-border-color);
    flex-shrink: 0;
    overflow: hidden;
    cursor: pointer;
}
.logo-preview-thumb :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.logo-pick-btn {
    min-width: 88px;
    height: 34px;
}
.logo-upload-hint {
    margin: 0;
    font-size: 12px;
    color: #909399;
    line-height: 1.4;
    white-space: nowrap;
}
.form-item-logo :deep(.el-upload) {
    display: inline-flex;
    vertical-align: middle;
}
</style>
