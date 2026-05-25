<template>
    <el-dialog
        :model-value="modelValue"
        :title="appDetail || detailHeader ? '' : title"
        :width="width"
        :align-center="alignCenter"
        destroy-on-close
        :close-on-click-modal="false"
        :show-close="!(appDetail || detailHeader)"
        append-to-body
        :class="['ld-form-dialog', { 'ld-form-dialog--app-detail': appDetail }, { 'ld-form-dialog--detail-header': appDetail || detailHeader }]"
        @update:model-value="onUpdateVisible"
        @close="emit('close')"
    >
        <template v-if="appDetail || detailHeader" #header>
            <div class="ld-app-detail-header">
                <span role="heading" class="ld-app-detail-header__title">{{ title }}</span>
                <button type="button" class="ld-app-detail-header__close" aria-label="关闭" @click="handleHeaderClose">
                    <img src="@/assets/svg/common_cancel.svg" alt="" />
                </button>
            </div>
        </template>
        <slot />
        <template #footer>
            <div class="ld-form-dialog__footer">
                <slot name="footer">
                    <el-button v-if="showCancel" class="ld-form-dialog__btn-cancel" @click="handleCancel">
                        {{ cancelText }}
                    </el-button>
                    <el-button
                        type="primary"
                        :class="['ld-form-dialog__btn-primary', { 'ld-form-dialog__btn-primary--app-detail': appDetail }]"
                        :loading="loading"
                        @click="handleConfirm"
                    >
                        {{ confirmText }}
                    </el-button>
                </slot>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        modelValue: boolean
        title: string
        width?: string
        loading?: boolean
        /** 主按钮文案：表单默认「保存」，可改为「确定」「关闭」等 */
        confirmText?: string
        cancelText?: string
        /** 为 false 时仅显示主按钮（如仅「关闭」） */
        showCancel?: boolean
        alignCenter?: boolean
        /** App 详情等：圆角 20px、表头 #EDF1FC、标签/值区字号与关闭按钮尺寸 */
        appDetail?: boolean
        /** 统一表头样式：与 app-detail 相同的标题栏（不影响 footer 按钮尺寸逻辑） */
        detailHeader?: boolean
    }>(),
    {
        width: '680px',
        loading: false,
        confirmText: '保存',
        cancelText: '取消',
        showCancel: true,
        alignCenter: true,
        appDetail: false,
        detailHeader: false,
    },
)

const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'close'): void
    (e: 'confirm'): void
}>()

function onUpdateVisible(v: boolean) {
    emit('update:modelValue', v)
}

function handleCancel() {
    emit('update:modelValue', false)
}

function handleConfirm() {
    emit('confirm')
}

function handleHeaderClose() {
    emit('update:modelValue', false)
}
</script>

<style scoped>
/* 根节点即 el-dialog，与内部结构用 :deep */
</style>

<style lang="css">
/**
 * 全局样式：el-dialog 会 teleport 到 body，避免仅 scoped 时标题/圆角不生效
 * 类名 ld-form-dialog 加在 el-dialog 上
 */
.ld-form-dialog.el-dialog {
    max-width: 92vw;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    padding: 0;
}

.ld-form-dialog .el-dialog__header {
    margin: 0;
    padding: 18px 24px 14px;
    border-bottom: 1px solid #ebeef5;
}

.ld-form-dialog .el-dialog__title {
    font-size: 18px;
    font-weight: 700;
    color: #000000;
    line-height: 26px;
}

.ld-form-dialog .el-dialog__headerbtn {
    top: 4px;
    width: 40px;
    height: 40px;
}

.ld-form-dialog .el-dialog__body {
    padding: 20px 24px 24px;
    max-height: min(68vh, 720px);
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;
}

.ld-form-dialog .el-dialog__footer {
    margin: 0;
    padding: 14px 24px 20px;
    border-top: 1px solid #f0f2f5;
}

.ld-form-dialog__footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
}

.ld-form-dialog__btn-cancel {
    min-width: 80px;
    height: 40px;
    padding: 8px 20px;
    border-radius: 10px;
    background-color: #eef1fe;
    border: 1px solid #2d53eb;
    color: #2d53eb;
}

.ld-form-dialog__btn-cancel:hover,
.ld-form-dialog__btn-cancel:focus {
    background-color: #e4e9fc;
    border-color: #2d53eb;
    color: #2d53eb;
}

.ld-form-dialog__btn-primary.el-button--primary {
    min-width: 80px;
    height: auto;
    padding: 8px 15px;
    border-radius: 10px;
    font-size: 14px;
    line-height: 22px;
    background-color: #2d53eb;
    border-color: #2d53eb;
}

.ld-form-dialog__btn-primary.el-button--primary:hover,
.ld-form-dialog__btn-primary.el-button--primary:focus {
    background-color: #2447d4;
    border-color: #2447d4;
}

/* ---------- 详情只读：标签 + 灰底值（与 ld-form-dialog 搭配） ---------- */
.ld-form-dialog .ld-dialog-detail-form.el-form .el-form-item {
    margin-bottom: 14px;
}

.ld-form-dialog .ld-dialog-detail-form .el-form-item__label {
    color: #303133;
    font-weight: 400;
    height: auto;
    line-height: 20px;
    align-items: flex-start;
    padding-top: 8px;
}

.ld-form-dialog .ld-dialog-detail-form .detail-value {
    width: 100%;
    min-height: 36px;
    padding: 8px 12px;
    background-color: #f5f7fa;
    border-radius: 6px;
    color: #303133;
    font-size: 14px;
    line-height: 20px;
    box-sizing: border-box;
    word-break: break-word;
}

.ld-form-dialog .ld-dialog-detail-form .detail-value-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
}

.ld-form-dialog .ld-dialog-detail-form .detail-value-row .detail-value {
    flex: 1;
    min-width: 0;
}

.ld-form-dialog .ld-dialog-detail-form .add-form-section {
    border: none;
    background: transparent;
    box-shadow: none;
    padding: 8px 0 16px;
}

.ld-form-dialog .ld-dialog-detail-form .add-form-section + .add-form-section {
    margin-top: 8px;
}

.ld-form-dialog .ld-dialog-detail-form .add-form-section__head {
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f2f5;
}

.ld-form-dialog .ld-dialog-detail-form .add-form-section__title {
    position: relative;
    padding-left: 12px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.ld-form-dialog .ld-dialog-detail-form .add-form-section__title::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #2d53eb;
    transform: translateY(-50%);
}

.ld-form-dialog .ld-dialog-detail-form .add-form-section__desc {
    display: none;
}

.ld-form-dialog .ld-dialog-detail-form .el-button.is-link {
    color: #2d53eb;
    flex-shrink: 0;
}

/* ---------- 仅影响内容区（App详情） ---------- */
.ld-form-dialog--app-detail.el-dialog {
    border-radius: 20px;
}

/* ---------- 统一表头样式（任何使用自定义 header 的弹窗） ---------- */
.ld-form-dialog--detail-header.el-dialog {
    border-radius: 20px;
}

.ld-form-dialog--detail-header .el-dialog__header {
    padding: 0;
    margin: 0;
    border-bottom: none;
    background-color: #edf1fc;
}

.ld-app-detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 24px 17px;
    box-sizing: border-box;
}

.ld-app-detail-header__title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    line-height: 20px;
    color: #000000;
}

.ld-app-detail-header__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 4px;
    margin: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    line-height: 0;
}

.ld-app-detail-header__close:hover {
    opacity: 0.85;
}

.ld-app-detail-header__close img {
    display: block;
    width: 10.482px;
    height: 10.482px;
}

.ld-form-dialog--app-detail .el-dialog__body {
    padding: 20px 24px 24px;
    background-color: #ffffff;
}

.ld-form-dialog--app-detail .el-dialog__footer {
    border-top: 1px solid #f0f2f5;
    padding: 14px 24px 18px;
    background-color: #ffffff;
}

/* 主按钮「关闭」：67×30，13px / 19px / medium / 白字 */
.ld-form-dialog__btn-primary--app-detail.ld-form-dialog__btn-primary.el-button--primary {
    width: 67px;
    min-width: 67px;
    height: 30px;
    padding: 0;
    border-radius: 6px;
    font-size: 13px;
    line-height: 19px;
    font-weight: 500;
    color: #ffffff;
}

/* 详情表单：分类卡片渐变、标签与值区 */
.ld-form-dialog--app-detail .ld-dialog-detail-form .add-form-section {
    margin-bottom: 16px;
    padding: 16px 18px 12px;
    border-radius: 20px;
    border: 1px solid #eef0f3;
    background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%);
    box-shadow: none;
}

.ld-form-dialog--app-detail .ld-dialog-detail-form .add-form-section:last-child {
    margin-bottom: 0;
}

.ld-form-dialog--app-detail .ld-dialog-detail-form .add-form-section__head {
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f0f2f5;
}

.ld-form-dialog--app-detail .ld-dialog-detail-form .add-form-section__title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.ld-form-dialog--app-detail .ld-dialog-detail-form .el-form-item {
    margin-bottom: 14px;
}

/* EP 表单项本身已是 flex；统一用 gap 控制 label 与值区间距为 25px */
.ld-form-dialog--app-detail .ld-dialog-detail-form .el-form-item {
    gap: 25px;
}

.ld-form-dialog--app-detail .ld-dialog-detail-form .el-form-item__label {
    height: auto !important;
    padding: 6px 0 !important;
    color: #000000;
    font-weight: 700;
    font-size: 14px;
    line-height: 25px;
    text-align: right !important;
    white-space: normal;
    word-break: break-word;
}

.ld-form-dialog--app-detail .ld-dialog-detail-form .el-form-item__content {
    margin-left: 0 !important;
}

.ld-form-dialog--app-detail .ld-dialog-detail-form .detail-value {
    min-height: auto;
    padding: 6px 16px 6px 16px;
    background-color: #ffffff;
    border: 1px solid #ebeef5;
    border-radius: 5px;
    color: #000000;
    font-size: 13px;
    font-weight: 400;
    line-height: 25px;
}

/* 无复制行时不再使用 detail-value-row 特殊布局 */
.ld-form-dialog--app-detail .ld-dialog-detail-form .detail-value-row .detail-value {
    flex: 1;
}
</style>
