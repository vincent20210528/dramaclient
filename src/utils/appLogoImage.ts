import { getFileExtension } from '@/utils/obsUpload'

/** Logo 大小上限（字节），须严格小于 500KB */
export const APP_LOGO_MAX_SIZE_BYTES = 500 * 1024

export const APP_LOGO_UPLOAD_HINT = '图片须小于 500KB'

export function isAppLogoImageExtension(fileName: string): boolean {
    return /\.(png|jpe?g|webp|gif|bmp)$/i.test(getFileExtension(fileName))
}

/**
 * 校验 App Logo：格式、<500KB
 * @returns 错误文案；通过则返回 null
 */
export async function getAppLogoImageValidationError(file: File): Promise<string | null> {
    if (!isAppLogoImageExtension(file.name)) {
        return '请选择图片文件（png/jpg/webp/gif/bmp）'
    }
    if (file.size >= APP_LOGO_MAX_SIZE_BYTES) {
        return '图片大小须小于 500KB'
    }
    return null
}
