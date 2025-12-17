import axios from 'axios';
import { Notification } from '@arco-design/web-vue';
import { useUserStore } from '@/store/user.js';
// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config) => 
  {
    const userStore = useUserStore();
    if (userStore.getToken()) {
      config.headers['token'] = userStore.getToken();
    }
    console.debug("发送的请求",config)
    return config;
  },
  (error) => 
  {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => 
  {
    const code = String(response.data.code);
    if (code.startsWith('200')) 
    {
      return response.data;
    }
    //构造一下错误提醒
    const error={
      debug:response.data.debug,
      message:response.data.msg || response.message,
      code:code,
      data:response.data,
      response:response
    };
    //只处理未登录的请求，其他请求谁调用谁处理
    if (code == '40100') 
    {
      //说明没有登录
      Notification.error({
        title: '登录过期',
        content: '请重新登录',
        duration: 3000,
      });
      //TODO 尝试弹出登录后，重新刷新页面
      return;
    }
    console.error('服务器成功响应，但返回的不是成功请求', error);
    return Promise.reject(error);
  },
  (error) => 
  {
    console.error('Response error:', error);
    if (error.response) 
    {
      const { status, data } = error.response;
      let message = `HTTP error: ${status}`;
      switch (status) 
      {
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
        duration: 3000,
      });
    }
    else if (error.request) 
    {
      Notification.error({
        title: '网络错误',
        content: '无法连接到服务器，请检查网络连接',
        duration: 3000,
      });
    }
    else 
    {
      Notification.error({
        title: '请求错误',
        content: error.message || '未知错误',
        duration: 3000,
      });
    }
    return Promise.reject(error);
  }
);

export default service;
