import api from '@/api';

/**
 * 计算文件的 SHA256 哈希值
 * @param {File} file - 要计算哈希的文件
 * @returns {Promise<string>} SHA256 哈希值（十六进制字符串）
 */
async function calculateSHA256(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 上传文件到对象存储
 * @param {File} file - 要上传的文件
 * @param {Function} onProgress - 上传进度回调 (可选)
 * @returns {Promise<{fileId: number, isInstant: boolean}>} 返回文件ID和是否秒传
 */
export async function uploadFile(file, onProgress = null) {
  if (!file) {
    throw new Error('文件不能为空');
  }

  try {
    // 1. 计算文件 SHA256
    const sha256 = await calculateSHA256(file);

    // 2. 请求预签名上传凭证
    const { data } = await api.post('/file/presigned-upload', {
      filename: file.name,
      fileSize: file.size,
      sha256: sha256
    });

    // 3. 检查是否需要上传（秒传）
    if (!data.needUpload) {
      return {
        fileId: data.fileId,
        isInstant: true
      };
    }

    // 4. 构建 FormData 并上传到 TOS
    const formData = new FormData();
    formData.append('key', data.key);
    formData.append('policy', data.policy);
    formData.append('x-tos-algorithm', data.algorithm);
    formData.append('x-tos-credential', data.credential);
    formData.append('x-tos-date', data.date);
    formData.append('x-tos-signature', data.signature);
    formData.append('file', file); // file 必须是最后一个字段

    // 5. 直接上传到 TOS
    const uploadResponse = await fetch(data.url, {
      method: 'POST',
      body: formData,
      headers: {
        'Cache-Control': 'max-age=3600'
      }
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`上传失败: ${errorText}`);
    }

    return {
      fileId: data.fileId,
      isInstant: false
    };
  } catch (error) {
    console.error('文件上传失败:', error);
    throw error;
  }
}

/**
 * 获取文件访问 URL
 * @param {number} fileId - 文件ID
 * @returns {string} 文件访问URL
 */
export function getFileUrl(fileId) {
  return `/file?f=${fileId}`;
}

export default {
  uploadFile,
  getFileUrl
};
