/**
 * 图片压缩工具
 * 支持在上传前对图片进行压缩处理
 */

/**
 * 压缩图片
 * @param {File|Blob} file - 原始图片文件
 * @param {Object} options - 压缩选项
 * @param {number} options.quality - 压缩质量 0-1，默认 0.8
 * @param {number} options.maxWidth - 最大宽度，默认 1920
 * @param {number} options.maxHeight - 最大高度，默认 1080
 * @param {string} options.mimeType - 输出格式，默认 'image/jpeg'
 * @param {boolean} options.convertToJpeg - 是否强制转换为 JPEG，默认 false
 * @returns {Promise<File>} 压缩后的图片文件
 */
export const compressImage = (file, options = {}) => 
{
  return new Promise((resolve, reject) => 
  {
    // 默认配置
    const config = {
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      mimeType: file.type || 'image/jpeg',
      convertToJpeg: false,
      ...options
    };

    // 如果设置了转换为 JPEG
    if (config.convertToJpeg) 
    {
      config.mimeType = 'image/jpeg';
    }

    // 创建 FileReader 读取文件
    const reader = new FileReader();
    
    reader.onload = (e) => 
    {
      const img = new Image();
      
      img.onload = () => 
      {
        try 
        {
          // 计算压缩后的尺寸
          let { width, height } = calculateSize(
            img.width,
            img.height,
            config.maxWidth,
            config.maxHeight
          );

          // 创建 canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height);

          // 转换为 Blob
          canvas.toBlob(
            (blob) => 
            {
              if (!blob) 
              {
                reject(new Error('图片压缩失败'));
                return;
              }

              // 转换为 File 对象
              const compressedFile = new File(
                [blob],
                file.name,
                {
                  type: config.mimeType,
                  lastModified: Date.now()
                }
              );

              resolve(compressedFile);
            },
            config.mimeType,
            config.quality
          );
        }
        catch (error) 
        {
          reject(error);
        }
      };

      img.onerror = () => 
      {
        reject(new Error('图片加载失败'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => 
    {
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * 计算压缩后的尺寸（保持宽高比）
 */
const calculateSize = (width, height, maxWidth, maxHeight) => 
{
  if (width <= maxWidth && height <= maxHeight) 
  {
    return { width, height };
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
};

/**
 * 批量压缩图片
 * @param {File[]} files - 图片文件数组
 * @param {Object} options - 压缩选项
 * @returns {Promise<File[]>} 压缩后的图片文件数组
 */
export const compressImages = async (files, options = {}) => 
{
  const promises = files.map(file => compressImage(file, options));
  return Promise.all(promises);
};

/**
 * 获取图片信息
 * @param {File} file - 图片文件
 * @returns {Promise<Object>} 图片信息（宽度、高度、大小）
 */
export const getImageInfo = (file) => 
{
  return new Promise((resolve, reject) => 
  {
    const reader = new FileReader();
    
    reader.onload = (e) => 
    {
      const img = new Image();
      
      img.onload = () => 
      {
        resolve({
          width: img.width,
          height: img.height,
          size: file.size,
          name: file.name,
          type: file.type
        });
      };

      img.onerror = () => 
      {
        reject(new Error('图片加载失败'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => 
    {
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export const formatFileSize = (bytes) => 
{
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
