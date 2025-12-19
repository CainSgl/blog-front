import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/index.js';
export const useUserStore = defineStore('user', () => 
{
  // 用户信息状态
  const userInfo = ref(null);
  const token = ref(null);

  // 设置用户信息
  const setUserInfo = (info) => 
  {
    userInfo.value = info;
  };

  // 设置token
  const setToken = (authToken) => 
  {
    if(!authToken)
    {
      throw {
        debug:'setToken这里传入的token是空的'
      };
    }
    token.value = authToken;
    localStorage.setItem('authToken', authToken);
  };

  // 清除用户信息
  const clearUserInfo = () => 
  {
    userInfo.value = null;
    token.value = null;
    localStorage.removeItem('authToken');
  };

  // 获取用户信息
  const getUserInfo = async () => 
  {
    if (userInfo.value) 
    {
      return userInfo.value;
    }
    else 
    {
      const token = getToken();
      if (token) 
      {
        //说明有token，但是没有用户信息，需要从后端获取
        try{
            const { data } = await api.get('/user/current');
           userInfo.value = data;  
        }catch(error)
        {
          console.error('获取用户信息失败:', error);
          return {}
        }
      }
    }
    return userInfo.value;
  };

  // 获取token
  const getToken = () => 
  {
    // 如果内存中的token为空，则尝试从localStorage获取
    if (!token.value) 
    {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) 
      {
        token.value = storedToken;
      }
    }
    return token.value;
  };

  // 检查用户是否已登录
  const isUserLoggedIn = () => 
  {
    // 如果内存中的token为空，则尝试从localStorage获取
    if (!token.value) 
    {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) 
      {
        token.value = storedToken;
      }
    }
    return !!token.value && !!userInfo.value;
  };

  return {
    userInfo,
    token,
    setUserInfo,
    setToken,
    clearUserInfo,
    getUserInfo,
    getToken,
    isUserLoggedIn,
  };
});
