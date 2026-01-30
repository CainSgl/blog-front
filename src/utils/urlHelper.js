import {API_BASE_URL} from '@/config/index.js';

/**
 * 计算完整的资源 URL
 * @param {string} src - 资源路径
 * @returns {string} 完整的 URL
 */
export function computeResourceUrl(src) 
{
  if (!src) 
  {
    return '';
  }
  
  // 如果已经是完整的 URL，则直接返回
  if (src.startsWith('http')) 
  {
    return src;
  }
  
  // 如果是 file 协议，直接返回
  if (src.startsWith('file')) 
  {
    return src;
  }
  
  // 如果是 blob 协议，直接返回
  if (src.startsWith('blob')) 
  {
    return src;
  }
  
  // 如果以 / 开头，直接拼接 API_BASE_URL
  if (src.startsWith('/')) 
  {
    return `${API_BASE_URL}${src}`;
  }
  
  // 否则使用 file 参数拼接
  return `${API_BASE_URL}/file?f=${src}`;
}
