import request from '../utils/request'

// 上传凭证到 OSS（表单上传）
export const uploadOss = (formData: FormData, channelId?: string) => {
    const token = localStorage.getItem('agent_token')

    // 总是添加 channelId 到 FormData 中，如果未提供则使用空字符串
    formData.append('channelId', channelId || '')

    return request({
        url: '/common/ossUploadFile',
        method: 'post',
        data: formData,
        timeout: 300000, // 5分钟 = 300000毫秒
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
    })
}

