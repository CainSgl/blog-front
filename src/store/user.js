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
  let userInfoPromise = null;
  const userInfoPromises = new Map(); // 为不同ID的用户信息请求创建Promise缓存
  const getUserInfo = async (id=null) => 
  {
    if(id)
    {
      //说明是获取别人的信息
      // 如果已经有相同ID的请求在进行中，直接返回同一个Promise
      if (userInfoPromises.has(id)) {
        return userInfoPromises.get(id);
      }
      
      // 创建一个新的请求 Promise 并缓存它
      const promise = api.get('/user', { id: id })
        .then(response => {
          return response.data;
        })
        .catch(error => {
          console.error('获取用户信息失败:', error);
          return {};
        })
        .finally(() => {
          // 请求完成后从缓存中移除，允许后续请求
          userInfoPromises.delete(id);
        });
      
      userInfoPromises.set(id, promise);
      return promise;
    }

    if (userInfo.value) 
    {
      return userInfo.value;
    }
    else 
    {
      const token = getToken();
      if (token) 
      {
        // 如果已经有请求在进行中，直接返回同一个 Promise
        if (userInfoPromise) {
          return userInfoPromise;
        }
        
        // 否则创建一个新的请求 Promise
        userInfoPromise = api.get('/user/current')
          .then(response => {
            userInfo.value = response.data;
            return response.data;
          })
          .catch(error => {
            console.error('获取用户信息失败:', error);
            userInfoPromise = null; // 重置 Promise，允许后续重试
            return {};
          });
        
        return userInfoPromise;
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
