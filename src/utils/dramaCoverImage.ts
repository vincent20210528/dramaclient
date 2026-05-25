import { getFileExtension } from '@/utils/obsUpload'

/** 封面图大小上限（字节），须严格小于 500KB */
export const DRAMA_COVER_MAX_SIZE_BYTES = 500 * 1024

/** 封面宽高比 9:16 */
export const DRAMA_COVER_ASPECT_RATIO = 9 / 16

const ASPECT_TOLERANCE = 0.03

export function isDramaCoverImageExtension(fileName: string): boolean {
    return /\.(png|jpe?g|webp|gif|bmp)$/i.test(getFileExtension(fileName))
}

function loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
            URL.revokeObjectURL(url)
            resolve({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('load failed'))
        }
        img.src = url
    })
}

/**
 * 校验内容列表封面图：格式、<500KB、宽高比 9:16
 * @returns 错误文案；通过则返回 null
 */
export async function getDramaCoverImageValidationError(file: File): Promise<string | null> {
    if (!isDramaCoverImageExtension(file.name)) {
        return '请选择图片文件（png/jpg/webp/gif/bmp）'
    }
    if (file.size >= DRAMA_COVER_MAX_SIZE_BYTES) {
        return '图片大小须小于 500KB'
    }
    try {
        const { width, height } = await loadImageDimensions(file)
        if (!width || !height) {
            return '无法读取图片尺寸，请换一张图片'
        }
        const ratio = width / height
        if (Math.abs(ratio - DRAMA_COVER_ASPECT_RATIO) > ASPECT_TOLERANCE) {
            return `图片宽高比须为 9:16（当前约为 ${width}:${height}）`
        }
    } catch {
        return '无法读取图片，请换一张图片'
    }
    return null
}

export const DRAMA_COVER_UPLOAD_HINT = '图片须小于 500KB，宽高比 9:16'
