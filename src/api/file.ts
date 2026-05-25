import request from '@/utils/request'

/** 获取 PUT 方式上传的签名链接 */
export function generatePreSignedUrl(data: {
    directory: string
    fileContentType: string
    fileExtension: string
}) {
    return request<{
        preSignedUrl: string
        fileUrl: string
        key: string
    }>({
        url: '/api/file/generatePreSignedUrl',
        method: 'post',
        data,
    })
}

/** 获取 POST 方式上传的签名信息 */
export function generatePostPreSignedUrl(data: {
    directory: string
    fileContentType: string
    fileExtension: string
}) {
    return request<{
        endpoint: string
        signature: string
        AccessKeyId: string
        'x-obs-acl': string
        'content-type': string
        fileUrl: string
        key: string
        policy: string
    }>({
        url: '/api/file/generatePostPreSignedUrl',
        method: 'post',
        data,
    })
}
