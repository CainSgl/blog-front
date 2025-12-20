// src/config/index.js
// 统一配置管理文件

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// 如果还有其他配置项，也可以放在这里
export const CONFIG = {
  API_BASE_URL,
};