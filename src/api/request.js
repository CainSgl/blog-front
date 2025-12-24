import axios from 'axios';
import { Message, Notification } from '@arco-design/web-vue';
import { useUserStore } from '@/store/user.js';
import { showLoginModal } from '@/services/authService';
import { API_BASE_URL } from '@/config';
// 创建axios实例
const service = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config) => 
  {
    const userStore = useUserStore();
    if (userStore.getToken()) 
    {
      config.headers['token'] = userStore.getToken();
    }
    // 打印URL、请求方式和参数
    console.debug('发送的请求:', {
      url: config.url,
      method: config.method,
      params: config.params,
      data: config.data
    });
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
      const userStore = useUserStore();
      if(userStore.getToken())
      {
        Message.warning({
          content: '登录似乎过期了，请重新登录',
          duration: 3000,
        });
      }
      else
      {
        Message.info({
          content: '你还没有登录呢，登录享受更多服务哦',
          duration: 3000,
        });
      }
      showLoginModal();
      return;
    }
    if(code==40101)
    {
      Message.error({
        content: '无权限操作',
        duration: 3000,
      });
      return;
    }
    Message.error({
      content: error.message||'服务器异常',
      duration: 3000,
    });
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
