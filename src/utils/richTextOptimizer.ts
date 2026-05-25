// 富文本内容优化工具

// 移除对已删除模块的引用

/**
 * 清理富文本HTML内容，移除不必要的标签和属性
 * @param htmlContent 原始HTML内容
 * @returns 清理后的HTML内容
 */
export const cleanRichTextContent = (htmlContent: string): string => {
  if (!htmlContent || htmlContent.trim() === '') {
    return '';
  }

  // 移除Quill编辑器添加的默认样式和类名
  let cleaned = htmlContent
    // 移除Quill的默认类名
    .replace(/class="ql-[^"]*"/g, '')
    // 移除空的class属性
    .replace(/class=""/g, '')
    // 移除Quill的默认样式
    .replace(/style="[^"]*"/g, '')
    // 移除空的style属性
    .replace(/style=""/g, '')
    // 移除多余的空白字符
    .replace(/\s+/g, ' ')
    // 移除HTML注释
    .replace(/<!--[\s\S]*?-->/g, '')
    // 移除空的标签
    .replace(/<(\w+)[^>]*>\s*<\/\1>/g, '')
    // 移除只有空白字符的标签
    .replace(/<(\w+)[^>]*>\s+<\/\1>/g, '')
    // 压缩HTML
    .trim();

  return cleaned;
};

/**
 * 提取富文本的纯文本内容（用于搜索和摘要）
 * @param htmlContent HTML内容
 * @returns 纯文本内容
 */
export const extractTextFromHtml = (htmlContent: string): string => {
  if (!htmlContent) return '';
  
  // 创建临时DOM元素来解析HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // 提取纯文本
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  
  // 清理多余的空白字符
  return textContent.replace(/\s+/g, ' ').trim();
};

/**
 * 生成富文本内容的摘要
 * @param htmlContent HTML内容
 * @param maxLength 最大长度，默认100
 * @returns 内容摘要
 */
export const generateContentSummary = (htmlContent: string, maxLength: number = 100): string => {
  const textContent = extractTextFromHtml(htmlContent);
  
  if (textContent.length <= maxLength) {
    return textContent;
  }
  
  return textContent.substring(0, maxLength) + '...';
};

/**
 * 检查富文本内容是否为空
 * @param htmlContent HTML内容
 * @returns 是否为空
 */
export const isRichTextEmpty = (htmlContent: string): boolean => {
  if (!htmlContent) return true;
  
  const textContent = extractTextFromHtml(htmlContent);
  return textContent.trim() === '';
};

/**
 * 获取富文本内容的字符数（不包含HTML标签）
 * @param htmlContent HTML内容
 * @returns 字符数
 */
export const getRichTextLength = (htmlContent: string): number => {
  const textContent = extractTextFromHtml(htmlContent);
  return textContent.length;
};

/**
 * 压缩富文本内容（移除不必要的格式）
 * @param htmlContent HTML内容
 * @returns 压缩后的内容
 */
export const compressRichText = (htmlContent: string): string => {
  if (!htmlContent) return '';
  
  let compressed = htmlContent
    // 移除所有样式属性
    .replace(/style="[^"]*"/g, '')
    // 移除所有类名
    .replace(/class="[^"]*"/g, '')
    // 移除id属性
    .replace(/id="[^"]*"/g, '')
    // 移除data属性
    .replace(/data-[^=]*="[^"]*"/g, '')
    // 移除空的属性
    .replace(/\s*=\s*""/g, '')
    // 移除多余的空白
    .replace(/\s+/g, ' ')
    // 移除HTML注释
    .replace(/<!--[\s\S]*?-->/g, '')
    // 移除空的标签
    .replace(/<(\w+)[^>]*>\s*<\/\1>/g, '')
    .trim();
  
  return compressed;
};

/**
 * 完全优化富文本内容（包括图片上传和内容清理）
 * @param htmlContent 原始HTML内容
 * @param channelId 商户ID（可选，用于图片上传）
 * @returns Promise<string> 优化后的HTML内容
 */
export const fullyOptimizeRichText = async (
  htmlContent: string, 
  channelId?: string
): Promise<string> => {
  if (!htmlContent) return '';
  
  try {
    // 1. 清理HTML内容
    const cleanedContent = cleanRichTextContent(htmlContent);
    
    // 2. 压缩内容
    const compressedContent = compressRichText(cleanedContent);
    
    return compressedContent;
  } catch (error) {
    console.error('完全优化富文本失败:', error);
    // 如果优化失败，至少进行内容清理
    return compressRichText(cleanRichTextContent(htmlContent));
  }
};

/**
 * 获取富文本内容的存储大小信息
 * @param htmlContent HTML内容
 * @returns 存储大小信息
 */
export const getRichTextStorageInfo = (htmlContent: string) => {
  if (!htmlContent) {
    return {
      totalSize: 0,
      textSize: 0,
      imageSize: 0,
      imageCount: 0,
      formattedTotalSize: '0 B',
      formattedTextSize: '0 B',
      formattedImageSize: '0 B'
    };
  }
  
  const textSize = new Blob([htmlContent]).size;
  const imageCount = (htmlContent.match(/data:image\/[^;]+;base64,/g) || []).length;
  const imageSize = 0; // 简化处理，不计算图片大小
  const totalSize = textSize + imageSize;
  
  return {
    totalSize,
    textSize,
    imageSize,
    imageCount,
    formattedTotalSize: formatFileSize(totalSize),
    formattedTextSize: formatFileSize(textSize),
    formattedImageSize: formatFileSize(imageSize)
  };
};

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的大小字符串
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 检查富文本内容是否需要优化
 * @param htmlContent HTML内容
 * @param maxImageSize 最大图片大小限制（字节），默认1MB
 * @returns 是否需要优化
 */
export const shouldOptimizeRichText = (
  htmlContent: string, 
  maxImageSize: number = 1024 * 1024 // 1MB
): boolean => {
  if (!htmlContent) return false;
  
  // 简化处理，检查是否有base64图片
  const hasBase64Images = /data:image\/[^;]+;base64,/.test(htmlContent);
  return hasBase64Images;
};
