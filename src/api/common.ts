import request from '@/utils/request'


/**
 * 生成预签名URL
 * @param {string} userId - 用户ID
 * @param {string} channelId - 渠道ID
 * @param {string} fileContentType - 文件内容类型
 * @param {string} fileExtension - 文件扩展名
 * @returns {Promise} - 返回API响应结果
 */
export  function generatePreSignedUrl(userId, channelId, fileContentType, fileExtension) {
	return  request({
        url: '/serverapi/file/generatePostPreSignedUrl',
        method: 'post',
        data: {
            userId: userId,
            channelId: channelId,
            fileContentType: fileContentType,
            fileExtension: fileExtension
            }
	})
}

/**
 * 生成预签名Token URL（带签名参数）
 * @param {string} userId - 用户ID
 * @param {string} channelId - 渠道ID
 * @param {string} fileContentType - 文件内容类型
 * @param {string} fileExtension - 文件扩展名
 * @param {string} signature - 签名
 * @returns {Promise} - 返回API响应结果
 */
export  function generatePreSignedTokenUrl(userId, channelId, fileContentType, fileExtension, signature: string) {
	return  request({
        url: '/serverapi/file/generatePostPreSignedTokenUrl',
        method: 'post',
        data: {
            userId: userId,
            channelId: channelId,
            fileContentType: fileContentType,
            fileExtension: fileExtension,
            signature: signature
            }
	})
}