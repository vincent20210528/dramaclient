import request from '../utils/request'

export interface WallpaperGeneratePayload {
    provider?: 'gemini' | 'cloudflare'
    model?: string
    styleCategory: string
    subject: string
    environment: string
    style: string
    params?: string
    negative?: string
    aspectRatio?: string
    imageSize?: string
    promptOverride?: string
    steps?: number
}

export interface WallpaperGenerateResult {
    mimeType: string
    promptUsed: string
    /** COS 公网地址 */
    imageUrl: string
    objectKey?: string
    provider?: string
    model?: string
}

/** 壁纸生成 POST /api/wallpaper/generate（耗时较长） */
export const generateWallpaper = (data: WallpaperGeneratePayload) => {
    return request({
        url: '/api/wallpaper/generate',
        method: 'post',
        timeout: 180000,
        data: {
            provider: data.provider || 'gemini',
            ...(data.model != null && data.model !== '' && { model: data.model }),
            styleCategory: data.styleCategory,
            subject: data.subject,
            environment: data.environment,
            style: data.style,
            ...(data.params != null && data.params !== '' && { params: data.params }),
            ...(data.negative != null && data.negative !== '' && { negative: data.negative }),
            aspectRatio: data.aspectRatio || '9:16',
            imageSize: data.imageSize || '2K',
            ...(data.steps != null && { steps: data.steps }),
            ...(data.promptOverride != null &&
                data.promptOverride !== '' && { promptOverride: data.promptOverride }),
        },
    })
}
