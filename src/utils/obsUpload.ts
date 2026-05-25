import axios from 'axios'
import { generatePreSignedUrl, generatePostPreSignedUrl } from '@/api/file'

/** 允许的扩展名（小写） */
export const ALLOWED_EXTENSIONS = [
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.gif',
    '.bmp',
    '.mp4',
    '.webm',
    '.mov',
    '.avi',
    '.mkv',
    '.pdf',
    '.doc',
    '.docx',
] as const

/** 扩展名 -> Content-Type 映射 */
const EXTENSION_MIME: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

/**
 * 从文件名获取扩展名（含点，小写）
 */
export function getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    if (lastDot === -1) return ''
    return filename.slice(lastDot).toLowerCase()
}

/**
 * 获取文件的 Content-Type，优先用 file.type，否则按扩展名查表
 */
export function getFileContentType(file: File): string {
    if (file.type) return file.type
    const ext = getFileExtension(file.name)
    return EXTENSION_MIME[ext] || 'application/octet-stream'
}

/**
 * 校验文件类型是否在允许列表中
 */
export function isAllowedFile(file: File): boolean {
    const ext = getFileExtension(file.name)
    return ALLOWED_EXTENSIONS.some((e) => e === ext)
}

/**
 * 从后端返回的 fileUrl 解析出 OBS POST 的桶域名（用于构造 postUrl）
 * 例如 https://dev-dramas.obs.ap-southeast-3.myhuaweicloud.com/... -> https://dev-dramas.obs.ap-southeast-3.myhuaweicloud.com
 */
function getPostBaseUrl(fileUrl: string): string {
    try {
        const u = new URL(fileUrl)
        return `${u.protocol}//${u.hostname}`
    } catch {
        return ''
    }
}

/**
 * PUT 方式上传到腾讯云 Cos
 * 流程：1. 获取签名链接 2. 使用 preSignedUrl PUT 文件
 * @returns 上传成功后的 fileUrl
 */
export async function uploadByPut(file: File, directory: string): Promise<string> {
    const fileExtension = getFileExtension(file.name)
    const fileContentType = getFileContentType(file)
    if (!ALLOWED_EXTENSIONS.includes(fileExtension as any)) {
        throw new Error(`不支持的文件类型: ${fileExtension}，允许: ${ALLOWED_EXTENSIONS.join(', ')}`)
    }

    const res: any = await generatePreSignedUrl({
        directory,
        fileContentType,
        fileExtension,
    })
    const data = res?.data?.data ?? res?.data
    if (!data?.preSignedUrl || !data?.fileUrl) {
        throw new Error(res?.data?.message ?? '获取签名链接失败')
    }

    await axios.put(data.preSignedUrl, file, {
        headers: {
            'Content-Type': fileContentType,
            'x-cos-acl': 'public-read',
        },
    })

    return data.fileUrl
}

/**
 * POST 方式上传到华为 OBS（表单上传）
 * 流程：1. 获取 POST 签名信息 2. 构造表单 POST 到 endpoint 对应地址
 * @returns 上传成功后的 fileUrl
 */
export async function uploadByPost(file: File, directory: string): Promise<string> {
    const fileExtension = getFileExtension(file.name)
    const fileContentType = getFileContentType(file)
    if (!ALLOWED_EXTENSIONS.includes(fileExtension as any)) {
        throw new Error(`不支持的文件类型: ${fileExtension}，允许: ${ALLOWED_EXTENSIONS.join(', ')}`)
    }

    const res: any = await generatePostPreSignedUrl({
        directory,
        fileContentType,
        fileExtension,
    })
    const data = res?.data?.data ?? res?.data
    if (!data?.fileUrl || !data?.key || !data?.policy || !data?.signature) {
        throw new Error(res?.data?.message ?? '获取签名信息失败')
    }

    const postUrl = getPostBaseUrl(data.fileUrl)
    if (!postUrl) throw new Error('无法解析上传地址')

    const form = new FormData()
    form.append('key', data.key)
    form.append('AccessKeyId', data.AccessKeyId)
    form.append('policy', data.policy)
    form.append('signature', data.signature)
    form.append('content-type', data['content-type'] ?? fileContentType)
    form.append('x-obs-acl', data['x-obs-acl'] ?? 'public-read')
    form.append('file', file)

    try {
        const resp = await axios.post(postUrl, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            // 204 无响应体，避免默认解析导致 Network Error
            responseType: 'text',
            validateStatus: (status) => status >= 200 && status < 300,
        })
        if (resp.status >= 200 && resp.status < 300) {
            return data.fileUrl
        }
    } catch (err: any) {
        // 跨域或 204 空体时部分环境会报 Network Error，但服务端已上传成功，仍返回 fileUrl
        const isNetworkErr = !err?.response && (err?.message === 'Network Error' || err?.code === 'ERR_NETWORK')
        if (isNetworkErr) {
            return data.fileUrl
        }
        throw err
    }

    return data.fileUrl
}

export type ObsUploadMethod = 'put' | 'post'

/**
 * 华为 OBS 上传入口
 * @param file 文件
 * @param directory 目录（业务自定义，如 "测试/霸道总裁"、"avatar"）
 * @param method 上传方式，默认 'put'
 * @returns 上传成功后的文件访问地址 fileUrl
 */
export async function uploadToObs(
    file: File,
    directory: string,
    method: ObsUploadMethod = 'put'
): Promise<string> {
    if (method === 'post') {
        return uploadByPost(file, directory)
    }
    return uploadByPut(file, directory)
}
