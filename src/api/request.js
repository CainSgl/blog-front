import axios from 'axios';

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
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
    const { data } = response;
    // 根据后端返回的数据结构进行处理
    if (data.code === 200 || data.success === true) 
    {
      return data.data || data;
    }
    else 
    {
      // 处理业务错误
      console.error('Business error:', data.message || data.msg);
      return Promise.reject(
        new Error(data.message || data.msg || 'Unknown error'),
      );
    }
  },
  (error) => 
  {
    // 处理HTTP错误
    if (error.response) 
    {
      const { status } = error.response;
      console.error(`HTTP error: ${status}`);
    }
    else if (error.request) 
    {
      console.error('Network error');
    }
    else 
    {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  },
);

export default service;
