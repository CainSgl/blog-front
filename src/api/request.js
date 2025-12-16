import axios from 'axios';
import { Notification } from '@arco-design/web-vue';

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config) => 
  {
    return config;
  },
  (error) => 
  {
    console.error('Request error:', error);
    return Promise.reject(error);
  },
);

// 响应拦截器
service.interceptors.response.use(
  (response) => 
  {
    console.log('Response:', response);
    const { data } = response;
    if (data.code === 2000 || data.success === true) 
    {
      return data.data || data;
    }
    // 检查是否有明确的错误标识
    else if (data.code && data.code !== 200 || data.success === false) 
    {
      // 处理业务错误
      const errorMessage = data.message || data.msg || 'Unknown error';
      console.error('Business error:', errorMessage);
      return Promise.reject(
        new Error(errorMessage),
      );
    }
    else 
    {
      return data.data || data;
    }
  },
  (error) => 
  {
    console.error('Response error:', error);
    if (error.response) 
    {
      const { status, data } = error.response;
      let message = `HTTP error: ${status}`;
      switch(status) {
        case 400:
          message = data?.message || data?.msg || '请求参数错误';
          break;
        case 401:
          message = '未授权，请重新登录';
          break;
        case 403:
          message = '拒绝访问';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 408:
          message = '请求超时';
          break;
        case 500:
          message = '服务器内部错误';
          break;
        case 501:
          message = '服务未实现';
          break;
        case 502:
          message = '网关错误';
          break;
        case 503:
          message = '服务不可用';
          break;
        case 504:
          message = '网关超时';
          break;
        default:
          message = data?.message || data?.msg || `HTTP error: ${status}`;
      }
      
      Notification.error({
        title: '请求错误',
        content: message,
        duration: 3000
      });
    }
    else if (error.request) 
    {
      Notification.error({
        title: '网络错误',
        content: '无法连接到服务器，请检查网络连接',
        duration: 3000
      });
    }
    else 
    {
      Notification.error({
        title: '请求错误',
        content: error.message || '未知错误',
        duration: 3000
      });
    }
    return Promise.reject(error);
  },
);

export default service;
