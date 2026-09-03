<template>
    <page-content class="wallpaper-page" :title="title">
        <template #bottom>
            <el-row :gutter="16">
                <el-col :xs="24" :md="12">
                    <el-card shadow="never" class="form-card">
                        <template #header>
                            <div class="card-header">结构化提示词</div>
                        </template>
                        <el-form label-position="top" :model="form" class="gen-form">
                            <el-form-item label="AI 提供商" required>
                                <el-select v-model="form.provider" style="width: 100%" @change="onProviderChange">
                                    <el-option
                                        v-for="p in providers"
                                        :key="p.id"
                                        :label="p.label"
                                        :value="p.id"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="模型" required>
                                <el-select v-model="form.model" style="width: 100%">
                                    <el-option
                                        v-for="m in currentModels"
                                        :key="m"
                                        :label="m"
                                        :value="m"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="风格（分类）" required>
                                <el-input v-model="form.styleCategory" placeholder="例如：赛博朋克 / 动漫电影" />
                            </el-form-item>
                            <el-form-item label="尺寸" required>
                                <el-select v-model="form.aspectRatio" style="width: 100%">
                                    <el-option label="9:16 竖屏手机壁纸" value="9:16" />
                                    <el-option label="16:9 横屏壁纸" value="16:9" />
                                    <el-option label="1:1 方形" value="1:1" />
                                    <el-option label="3:4 竖屏" value="3:4" />
                                    <el-option label="4:3 横屏" value="4:3" />
                                </el-select>
                            </el-form-item>
                            <el-form-item
                                v-if="form.provider === 'gemini' || form.provider === 'sensenova'"
                                label="分辨率档位"
                            >
                                <el-select v-model="form.imageSize" style="width: 100%">
                                    <el-option label="2K（推荐）" value="2K" />
                                    <el-option
                                        v-if="form.provider === 'sensenova' && form.model === 'sensenova-u1.5-lite'"
                                        label="4K"
                                        value="4K"
                                    />
                                    <el-option v-if="form.provider === 'gemini'" label="1K" value="1K" />
                                </el-select>
                            </el-form-item>
                            <el-form-item v-if="form.provider === 'cloudflare'" label="Steps（1-8）">
                                <el-input-number v-model="form.steps" :min="1" :max="8" />
                            </el-form-item>
                            <el-form-item label="主体" required>
                                <el-input
                                    v-model="form.subject"
                                    type="textarea"
                                    :rows="3"
                                    placeholder="例如：漂浮在空中的透明发光数据鲸鱼，鳞片上是流动的代码"
                                />
                            </el-form-item>
                            <el-form-item label="环境" required>
                                <el-input
                                    v-model="form.environment"
                                    type="textarea"
                                    :rows="3"
                                    placeholder="例如：下着细雨的未来东京，街道上有全息广告投影"
                                />
                            </el-form-item>
                            <el-form-item label="风格描述" required>
                                <el-input
                                    v-model="form.style"
                                    type="textarea"
                                    :rows="3"
                                    placeholder="例如：新海诚动画电影风格，画面通透，柔和的蓝紫光影"
                                />
                            </el-form-item>
                            <el-form-item label="参数">
                                <el-input
                                    v-model="form.params"
                                    type="textarea"
                                    :rows="2"
                                    placeholder="例如：电影级广角镜头，超高细节，上下留安全边距"
                                />
                            </el-form-item>
                            <el-form-item v-if="form.provider === 'sensenova'" label="SenseNova 选项">
                                <el-checkbox v-model="form.watermark">添加官方水印</el-checkbox>
                                <el-checkbox
                                    v-if="form.model === 'sensenova-u1.5-lite'"
                                    v-model="form.promptExtend"
                                    style="margin-left: 12px"
                                >
                                    提示词自动扩写
                                </el-checkbox>
                            </el-form-item>
                            <el-form-item label="负面提示（可选）">
                                <el-input
                                    v-model="form.negative"
                                    placeholder="例如：文字、水印、模糊、畸形"
                                />
                            </el-form-item>
                            <el-form-item>
                                <el-button
                                    type="primary"
                                    :loading="loading"
                                    :disabled="!canGenerate"
                                    @click="handleGenerate"
                                >
                                    生成壁纸
                                </el-button>
                                <el-button :disabled="!result?.imageUrl" @click="handleDownload">下载图片</el-button>
                                <el-button :disabled="!result?.imageUrl" @click="copyUrl">复制链接</el-button>
                                <el-button @click="fillDemo">填入示例</el-button>
                            </el-form-item>
                        </el-form>
                    </el-card>
                </el-col>
                <el-col :xs="24" :md="12">
                    <el-card shadow="never" class="preview-card">
                        <template #header>
                            <div class="card-header">预览</div>
                        </template>
                        <div v-loading="loading" class="preview-wrap">
                            <el-empty v-if="!result?.imageUrl && !loading" description="生成后将在此预览" />
                            <img v-if="result?.imageUrl" :src="result.imageUrl" class="preview-img" alt="wallpaper" />
                        </div>
                        <div v-if="result?.imageUrl" class="url-box">
                            <div class="prompt-title">COS 地址</div>
                            <a :href="result.imageUrl" target="_blank" rel="noopener">{{ result.imageUrl }}</a>
                        </div>
                        <div v-if="result?.provider || result?.model" class="url-box">
                            <div class="prompt-title">使用模型</div>
                            <span>{{ result?.provider }} / {{ result?.model }}</span>
                        </div>
                        <div v-if="result?.promptUsed" class="prompt-box">
                            <div class="prompt-title">实际使用的 Prompt</div>
                            <pre>{{ result.promptUsed }}</pre>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { generateWallpaper, type WallpaperGenerateResult } from '@/api/wallpaper'
import { hasPerm, PERM_WALLPAPER } from '@/utils/permission'

defineProps<{ title?: string }>()

const canGenerate = computed(() => hasPerm(PERM_WALLPAPER.generate) || hasPerm('*'))

const providers = [
    {
        id: 'sensenova' as const,
        label: 'SenseNova 日日新',
        models: ['sensenova-u1.5-lite', 'sensenova-u1-fast'],
        supportsImageSize: true,
    },
    {
        id: 'cloudflare' as const,
        label: 'Cloudflare Workers AI',
        models: [
            '@cf/black-forest-labs/flux-1-schnell',
            '@cf/stabilityai/stable-diffusion-xl-base-1.0',
            '@cf/lykon/dreamshaper-8-lcm',
        ],
        supportsImageSize: false,
    },
    {
        id: 'gemini' as const,
        label: 'Google Gemini',
        models: ['gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation'],
        supportsImageSize: true,
    },
]

const form = reactive({
    provider: 'sensenova' as 'gemini' | 'cloudflare' | 'sensenova',
    model: 'sensenova-u1.5-lite',
    styleCategory: '',
    aspectRatio: '9:16',
    imageSize: '2K',
    steps: 4,
    subject: '',
    environment: '',
    style: '',
    params: '',
    negative: '',
    watermark: false,
    promptExtend: true,
})

const currentModels = computed(() => {
    const p = providers.find((x) => x.id === form.provider)
    return p?.models || []
})

const onProviderChange = () => {
    const models = currentModels.value
    form.model = models[0] || ''
}

const loading = ref(false)
const result = ref<WallpaperGenerateResult | null>(null)

const fillDemo = () => {
    form.styleCategory = '赛博朋克 / 动漫电影'
    form.aspectRatio = '9:16'
    form.imageSize = '2K'
    form.subject = '一个漂浮在空中的透明发光数据鲸鱼，鳞片上是流动的代码'
    form.environment = '背景是下着细雨的未来东京，街道上有全息广告投影'
    form.style = '新海诚动画电影风格，画面通透，光影唯美，使用柔和的蓝色和紫色调'
    form.params = '电影级广角镜头，超高细节，上下留安全边距，无文字无水印'
    form.negative = 'text, watermark, logo, blur, low quality'
}

const handleGenerate = async () => {
    if (!form.styleCategory.trim() || !form.subject.trim() || !form.environment.trim() || !form.style.trim()) {
        ElMessage.warning('请填写风格分类、主体、环境、风格描述')
        return
    }
    loading.value = true
    result.value = null
    try {
        const res: any = await generateWallpaper({
            provider: form.provider,
            model: form.model,
            styleCategory: form.styleCategory.trim(),
            subject: form.subject.trim(),
            environment: form.environment.trim(),
            style: form.style.trim(),
            params: form.params.trim(),
            negative: form.negative.trim(),
            aspectRatio: form.aspectRatio,
            imageSize: form.imageSize,
            steps: form.steps,
            watermark: form.watermark,
            promptExtend: form.promptExtend,
        })
        // axios: res.data = ApiResponse；业务体在 res.data.data
        const payload = res?.data
        const data = payload?.data ?? payload
        if (payload?.code != null && payload.code !== 200) {
            ElMessage.error(payload?.message || '生成失败')
            return
        }
        if (!data?.imageUrl) {
            ElMessage.error(payload?.message || '生成失败：未返回图片地址')
            return
        }
        result.value = {
            mimeType: data.mimeType || 'image/png',
            promptUsed: data.promptUsed || '',
            imageUrl: data.imageUrl,
            objectKey: data.objectKey,
            provider: data.provider,
            model: data.model,
        }
        ElMessage.success('生成成功')
    } catch (e: any) {
        ElMessage.error(e?.message || '生成失败')
    } finally {
        loading.value = false
    }
}

const handleDownload = () => {
    if (!result.value?.imageUrl) return
    const a = document.createElement('a')
    a.href = result.value.imageUrl
    a.target = '_blank'
    a.rel = 'noopener'
    const ext = (result.value.mimeType || '').includes('jpeg') ? 'jpg' : 'png'
    a.download = `wallpaper_${Date.now()}.${ext}`
    a.click()
}

const copyUrl = async () => {
    if (!result.value?.imageUrl) return
    try {
        await navigator.clipboard.writeText(result.value.imageUrl)
        ElMessage.success('链接已复制')
    } catch {
        ElMessage.error('复制失败，请手动选择地址')
    }
}
</script>

<style scoped>
.wallpaper-page :deep(.page-content-bottom) {
    padding-bottom: 24px;
}
.form-card,
.preview-card {
    min-height: 560px;
}
.card-header {
    font-weight: 600;
}
.preview-wrap {
    min-height: 420px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    border-radius: 8px;
    overflow: hidden;
}
.preview-img {
    max-width: 100%;
    max-height: 640px;
    object-fit: contain;
    display: block;
}
.url-box,
.prompt-box {
    margin-top: 12px;
}
.url-box a {
    font-size: 12px;
    word-break: break-all;
    color: #409eff;
}
.prompt-title {
    font-size: 13px;
    color: #606266;
    margin-bottom: 6px;
}
.prompt-box pre {
    white-space: pre-wrap;
    word-break: break-word;
    background: #f8f8f8;
    border-radius: 6px;
    padding: 10px;
    font-size: 12px;
    max-height: 180px;
    overflow: auto;
}
</style>
