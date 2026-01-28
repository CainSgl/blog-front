import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/index.js';
const youKe = {
  id: -1,
};

export const useUserStore = defineStore('user', () => 
{
  // 用户信息状态
  const userInfo = ref(null);
  const token = ref(null);

  // 设置用户信息
  const setUserInfo = (info) => 
  {
    userInfo.value = info;
    // 同时更新缓存，包含时间戳
    if (info) 
    {
      const cacheData = {
        data: info,
        timestamp: Date.now(),
      };
      localStorage.setItem('userInfo', JSON.stringify(cacheData));
    }
  };

  // 设置token
  const setToken = (authToken) => 
  {
    if (!authToken) 
    {
      throw {
        debug: 'setToken这里传入的token是空的',
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
    localStorage.removeItem('userInfo');
  };

  // 获取用户信息
  let userInfoPromise = null;
  const userInfoPromises = new Map(); // 为不同ID的用户信息请求创建Promise缓存
  const userInfoCache = new Map(); // 存储已获取的用户数据

  // 检查缓存是否过期（10分钟 = 10 * 60 * 1000 毫秒）
  const isCacheExpired = (timestamp) => 
  {
    const tenMinutesInMs = 10 * 60 * 1000;
    return Date.now() - timestamp > tenMinutesInMs;
  };

  const getUserInfo = async (id = null) => 
  {
    if (id) 
    {
      
      // 先检查数据缓存中是否已有该用户信息
      if (userInfoCache.has(id)) 
      {
        return userInfoCache.get(id);
      }
      
      // 如果已经有相同ID的请求在进行中，直接返回同一个Promise
      if (userInfoPromises.has(id)) 
      {
        return userInfoPromises.get(id);
      }
      
      // 创建一个新的请求 Promise 并缓存它
      const promise = api.get('/user', { id: id })
        .then((response) => 
        {
          // 将用户数据存储到缓存中
          userInfoCache.set(id, response.data);
          // 请求完成后清理Promise缓存
          userInfoPromises.delete(id);
          return response.data;
        })
        .catch((error) => 
        {
          console.error('获取用户信息失败:', error);
          // 请求失败后也要清理缓存，允许重试
          userInfoPromises.delete(id);
          return {};
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
        //查看缓存里有没有，有的话读缓存
        const cachedUserInfo = localStorage.getItem('userInfo');
        if (cachedUserInfo) 
        {
          try 
          {
            const parsedCache = JSON.parse(cachedUserInfo);
            // 检查是否是新格式（包含时间戳）且未过期
            if (
              parsedCache.timestamp &&
              !isCacheExpired(parsedCache.timestamp)
            ) 
            {
              return parsedCache.data;
            }
            else 
            {
              // 缓存已过期，删除它
              localStorage.removeItem('userInfo');
            }
          }
          catch (e) 
          {
            // 如果解析失败，删除损坏的缓存
            localStorage.removeItem('userInfo');
            console.error('解析用户缓存失败:', e);
          }
        }
        // 如果已经有请求在进行中，直接返回同一个 Promise
        if (userInfoPromise) 
        {
          return userInfoPromise;
        }
        // 否则创建一个新的请求 Promise
        userInfoPromise = api
          .get('/user/current')
          .then((response) => 
          {
            userInfo.value = response.data;
            // 存储带时间戳的缓存
            const cacheData = {
              data: response.data,
              timestamp: Date.now(),
            };
            localStorage.setItem('userInfo', JSON.stringify(cacheData));
            // 请求完成后清理Promise缓存
            userInfoPromise = null;
            return response.data;
          })
          .catch((error) => 
          {
            console.error('获取用户信息失败:', error);
            userInfoPromise = null; // 重置 Promise，允许后续重试
            return youKe;
          });

        return userInfoPromise;
      }
      else 
      {
        return youKe;
      }
    }
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
    return token.value;
  };
  const updateUserInfo = async (updateData) => 
  {
    const oldUserInfo = await getUserInfo();
    try 
    {
      // 调用API更新用户信息
      userInfo.value = { ...oldUserInfo, ...updateData };
      console.log('更新用户信息:', userInfo.value);
      await api.put('/user', updateData);
      // 更新缓存，包含时间戳
      const cacheData = {
        data: userInfo.value,
        timestamp: Date.now(),
      };
      localStorage.setItem('userInfo', JSON.stringify(cacheData));
    }
    catch (error) 
    {
      // 如果更新失败，回滚到旧的用户信息
      userInfo.value = oldUserInfo;
      // 回滚缓存
      const oldCacheData = {
        data: oldUserInfo,
        timestamp: Date.now(),
      };
      localStorage.setItem('userInfo', JSON.stringify(oldCacheData));
      console.error('更新用户信息失败:', error);
      throw error;
    }
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
    updateUserInfo,
  };
});
