// Quill编辑器图片上传处理器

import { uploadOss } from '@/api/finance';

/**
 * 创建Quill图片上传处理器（延迟上传模式）
 * @param quill Quill编辑器实例
 * @param channelId 商户ID（可选）
 * @returns 图片上传处理器
 */
export const createQuillImageHandler = (quill: any, channelId?: string) => {
  // 监听粘贴事件，处理粘贴的图片
  quill.clipboard.addMatcher(Node.ELEMENT_NODE, (node: any, delta: any) => {
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src');
      if (src && src.startsWith('data:')) {
        // 如果是base64图片，保持base64格式，稍后统一上传
        return delta;
      } else if (src) {
        // 如果是网络图片，添加内联样式
        const styledDelta = {
          ...delta,
          ops: delta.ops.map((op: any) => {
            if (op.insert && op.insert.image) {
              return {
                ...op,
                insert: {
                  ...op.insert,
                  image: src
                },
                attributes: {
                  ...op.attributes,
                  style: 'max-width: 100%; height: auto; display: block; margin: 8px auto;'
                }
              };
            }
            return op;
          })
        };
        return styledDelta;
      }
    }
    return delta;
  });
  
  // 监听拖拽事件
  quill.root.addEventListener('drop', (e: DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      handleImageFiles(imageFiles, quill);
    }
  });
  
  // 监听拖拽悬停事件
  quill.root.addEventListener('dragover', (e: DragEvent) => {
    e.preventDefault();
  });
};

/**
 * 选择本地图片文件
 * @param quill Quill编辑器实例
 */
const selectLocalImage = (quill: any) => {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.style.display = 'none';
  
  input.addEventListener('change', (e) => {
    e.stopPropagation(); // 阻止事件冒泡
    const files = Array.from(input.files || []);
    if (files.length > 0) {
      handleImageFiles(files, quill);
    }
  });
  
  // 使用setTimeout确保在下一个事件循环中执行
  setTimeout(() => {
    document.body.appendChild(input);
    input.click();
    // 延迟移除，确保文件选择对话框完全关闭
    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }, 100);
  }, 0);
};

/**
 * 处理图片文件（延迟上传模式）
 * @param files 图片文件数组
 * @param quill Quill编辑器实例
 */
const handleImageFiles = async (files: File[], quill: any) => {
  for (const file of files) {
    await insertImageAsBase64(file, quill);
  }
};

/**
 * 将图片文件转换为base64并插入编辑器
 * @param file 图片文件
 * @param quill Quill编辑器实例
 */
const insertImageAsBase64 = (file: File, quill: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        
        // 插入带有内联样式的base64图片
        insertImageWithStyle(quill, index, base64);
        quill.setSelection(index + 1);
        
        resolve();
      } else {
        reject(new Error('图片读取失败'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('图片读取失败'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * 插入带有内联样式的图片
 * @param quill Quill编辑器实例
 * @param index 插入位置
 * @param src 图片源地址
 */
const insertImageWithStyle = (quill: any, index: number, src: string) => {
  // 使用insertEmbed插入图片
  quill.insertEmbed(index, 'image', src);
  
  // 获取刚插入的图片元素并添加样式
  setTimeout(() => {
    const imgElements = quill.root.querySelectorAll('img');
    const lastImg = imgElements[imgElements.length - 1];
    if (lastImg && !lastImg.style.maxWidth) {
      lastImg.style.maxWidth = '100%';
      lastImg.style.height = 'auto';
      lastImg.style.display = 'block';
      lastImg.style.margin = '8px auto';
    }
  }, 0);
};

/**
 * 上传图片文件（保留用于批量上传）
 * @param file 图片文件
 * @param quill Quill编辑器实例
 * @param channelId 商户ID（可选）
 */
const uploadImageFile = async (file: File, quill: any, channelId?: string) => {
  try {
    // 显示上传进度
    const range = quill.getSelection();
    const index = range ? range.index : quill.getLength();
    
    // 插入占位符
    quill.insertEmbed(index, 'image', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    quill.setSelection(index + 1);
    
    // 创建FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // 确保channelId存在，如果不存在则使用空字符串
    const finalChannelId = channelId || '';
    
    // 上传到OSS
    const response = await uploadOss(formData, finalChannelId);
    
    if (response?.data?.code === 200) {
      const imageData = response.data.data;
      // 处理OSS返回的URL数据
      let imageUrl: string;
      if (Array.isArray(imageData)) {
        // 如果是数组，拼接成完整的URL
        imageUrl = imageData.join('');
      } else if (typeof imageData === 'string') {
        // 如果是字符串，直接使用
        imageUrl = imageData;
      } else if (imageData && imageData.url) {
        // 如果是对象，取url属性
        imageUrl = imageData.url;
      } else {
        throw new Error('无效的图片URL格式');
      }
      
      // 替换占位符为真实URL
      quill.deleteText(index, 1);
      insertImageWithStyle(quill, index, imageUrl);
    } else {
      // 上传失败，移除占位符
      quill.deleteText(index, 1);
      throw new Error(response?.data?.msg || '上传失败');
    }
  } catch (error) {
    console.error('上传图片失败:', error);
    // 移除占位符
    const range = quill.getSelection();
    if (range) {
      quill.deleteText(range.index, 1);
    }
  }
};

/**
 * 上传base64图片
 * @param base64Data base64图片数据
 * @param quill Quill编辑器实例
 * @param channelId 商户ID（可选）
 */
const uploadBase64Image = async (base64Data: string, quill: any, channelId?: string) => {
  try {
    // 转换为Blob
    const blob = base64ToBlob(base64Data);
    
    // 生成文件名
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = `rich-text-image-${timestamp}-${random}.png`;
    
    // 创建FormData
    const formData = new FormData();
    formData.append('file', blob, fileName);
    
    // 确保channelId存在，如果不存在则使用空字符串
    const finalChannelId = channelId || '';
    
    // 上传到OSS
    const response = await uploadOss(formData, finalChannelId);
    
    if (response?.data?.code === 200 && response.data.data?.url) {
      // 替换base64为URL
      const delta = quill.clipboard.convert();
      const imageOps = delta.ops?.filter((op: any) => op.insert?.image);
      
      if (imageOps && imageOps.length > 0) {
        imageOps.forEach((op: any) => {
          if (op.insert?.image === base64Data) {
            op.insert.image = response.data.data.url;
          }
        });
        
        quill.setContents(delta);
      }
    }
  } catch (error) {
    console.error('上传base64图片失败:', error);
  }
};

/**
 * 将base64转换为Blob
 * @param base64Data base64数据
 * @returns Blob对象
 */
const base64ToBlob = (base64Data: string): Blob => {
  const arr = base64Data.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

/**
 * 配置Quill编辑器的图片上传选项
 * @param quill Quill编辑器实例
 * @param channelId 商户ID（可选）
 */
export const configureQuillImageUpload = (quill: any, channelId?: string) => {
  // 创建图片上传处理器
  createQuillImageHandler(quill, channelId);
  
  // 使用Quill的标准方式重写图片按钮的处理逻辑
  const toolbar = quill.getModule('toolbar');
  toolbar.addHandler('image', () => {
    selectLocalImage(quill);
  });
};

/**
 * 获取富文本内容中的图片URL列表
 * @param htmlContent 富文本HTML内容
 * @returns 图片URL数组
 */
export const extractImageUrls = (htmlContent: string): string[] => {
  if (!htmlContent) return [];
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const images = tempDiv.querySelectorAll('img');
  const urls: string[] = [];
  
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('data:')) {
      urls.push(src);
    }
  });
  
  return urls;
};

/**
 * 检查富文本内容是否包含base64图片
 * @param htmlContent 富文本HTML内容
 * @returns 是否包含base64图片
 */
export const hasBase64Images = (htmlContent: string): boolean => {
  if (!htmlContent) return false;
  return /data:image\/[^;]+;base64,/.test(htmlContent);
};

/**
 * 批量上传富文本内容中的base64图片
 * @param htmlContent 富文本HTML内容
 * @param channelId 商户ID（可选）
 * @returns Promise<string> 返回替换后的HTML内容
 */
export const uploadBase64ImagesInContent = async (
  htmlContent: string, 
  channelId?: string
): Promise<string> => {
  if (!htmlContent) return '';
  
  // 提取所有base64图片
  const base64Images = extractBase64Images(htmlContent);
  
  if (base64Images.length === 0) {
    return htmlContent;
  }
  
  try {
    // 批量上传图片
    const uploadPromises = base64Images.map(async (base64Data) => {
      const blob = base64ToBlob(base64Data);
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fileName = `rich-text-image-${timestamp}-${random}.png`;
      
      const formData = new FormData();
      formData.append('file', blob, fileName);
      
      const response = await uploadOss(formData, channelId || '');
      
      if (response?.data?.code === 200) {
        const imageData = response.data.data;
        // 处理OSS返回的URL数据
        let imageUrl: string;
        if (Array.isArray(imageData)) {
          // 如果是数组，拼接成完整的URL
          imageUrl = imageData.join('');
        } else if (typeof imageData === 'string') {
          // 如果是字符串，直接使用
          imageUrl = imageData;
        } else if (imageData && imageData.url) {
          // 如果是对象，取url属性
          imageUrl = imageData.url;
        } else {
          throw new Error('无效的图片URL格式');
        }
        
        return {
          base64: base64Data,
          url: imageUrl
        };
      } else {
        throw new Error(response?.data?.msg || '上传失败');
      }
    });
    
    const uploadResults = await Promise.all(uploadPromises);
    
    // 替换HTML中的base64图片为URL，并添加内联样式
    let result = htmlContent;
    uploadResults.forEach(({ base64, url }) => {
      // 创建带有内联样式的img标签
      const styledImgTag = `<img src="${url}" style="max-width: 100%; height: auto; display: block; margin: 8px auto;" />`;
      
      // 使用简单的字符串替换，避免复杂的正则表达式
      result = result.replace(base64, url);
      
      // 然后为所有img标签添加样式（如果还没有的话）
      result = result.replace(
        /<img([^>]*?)src="([^"]*?)"([^>]*?)>/g,
        (match, before, src, after) => {
          // 检查是否已经有style属性
          if (match.includes('style=')) {
            return match;
          }
          // 添加内联样式
          return `<img${before}src="${src}"${after} style="max-width: 100%; height: auto; display: block; margin: 8px auto;">`;
        }
      );
    });
    
    return result;
  } catch (error) {
    console.error('批量上传图片失败:', error);
    throw error;
  }
};

/**
 * 提取富文本内容中的所有base64图片
 * @param htmlContent 富文本HTML内容
 * @returns base64图片数组
 */
export const extractBase64Images = (htmlContent: string): string[] => {
  if (!htmlContent) return [];
  
  const base64Regex = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g;
  const matches = htmlContent.match(base64Regex);
  
  return matches || [];
};

/**
 * 清理富文本内容中的base64图片
 * @param htmlContent 富文本HTML内容
 * @returns 清理后的HTML内容
 */
export const cleanBase64Images = (htmlContent: string): string => {
  if (!htmlContent) return '';
  
  // 移除所有base64图片
  return htmlContent.replace(/<img[^>]*src="data:image\/[^;]+;base64,[^"]*"[^>]*>/g, '');
};
