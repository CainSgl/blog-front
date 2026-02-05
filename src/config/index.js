
// 统一配置管理文件
// 动态获取 API 地址
const getApiBaseUrl = () => {
  // 开发环境使用环境变量或 localhost
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  }
  return `https://cainsgl.cn/api`;
};

export const API_BASE_URL = getApiBaseUrl();

// 如果还有其他配置项，也可以放在这里
export const CONFIG = {
  API_BASE_URL,
};