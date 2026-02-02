import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/index.js';
import { Message } from '@arco-design/web-vue';
import { likeCache } from '@/utils/likeCache.js';

const youKe = { id: -1 };
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10分钟

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null);
  const token = ref(null);

  // 其他用户信息缓存
  const userInfoCache = new Map();
  const userInfoPromises = new Map();

  // 当前用户请求Promise（防止重复请求）
  let currentUserPromise = null;

  // 缓存工具函数
  const isCacheExpired = (timestamp) => Date.now() - timestamp > CACHE_EXPIRY_MS;

  const saveUserCache = (data) => {
    const cacheData = { data, timestamp: Date.now() };
    localStorage.setItem('userInfo', JSON.stringify(cacheData));
  };

  const getUserCache = () => {
    try {
      const cached = localStorage.getItem('userInfo');
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      if (!parsed.timestamp || isCacheExpired(parsed.timestamp)) {
        localStorage.removeItem('userInfo');
        return null;
      }
      return parsed;
    } catch (e) {
      localStorage.removeItem('userInfo');
      console.error('解析用户缓存失败:', e);
      return null;
    }
  };

  // hotInfo 计数器管理
  const getHotCounter = () => {
    try {
      return parseInt(localStorage.getItem('userHotCounter') || '0', 10);
    } catch {
      return 0;
    }
  };

  const incrementHotCounter = () => {
    const count = getHotCounter() + 1;
    localStorage.setItem('userHotCounter', count.toString());
    return count;
  };

  const resetHotCounter = () => {
    localStorage.setItem('userHotCounter', '0');
  };

  // 更新 hotInfo
  const updateHotInfo = async (cachedData) => {
    try {
      const response = await api.get('/user/hotInfo');
      const updatedUserInfo = { ...cachedData, ...response.data };
      userInfo.value = updatedUserInfo;
      saveUserCache(updatedUserInfo);
      resetHotCounter();
      return updatedUserInfo;
    } catch (error) {
      console.error('更新 hotInfo 失败:', error);
      return cachedData;
    }
  };

  // 设置用户信息
  const setUserInfo = (info) => {
    userInfo.value = info;
    if (info) saveUserCache(info);
  };

  // 设置token
  const setToken = (authToken) => {
    if (!authToken) {
      throw { debug: 'setToken这里传入的token是空的' };
    }
    token.value = authToken;
    localStorage.setItem('authToken', authToken);
  };

  // 清除用户信息
  const clearUserInfo = () => {
    userInfo.value = null;
    token.value = null;
    localStorage.removeItem('authToken');
    clearCache();
  };

  const clearCache = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userHotCounter');
    // 清除点赞缓存
    likeCache.clearAll();
    // 清除签到缓存
    localStorage.removeItem('checkInCache');
  }

  // 获取token
  const getToken = () => {
    if (!token.value) {
      token.value = localStorage.getItem('authToken');
    }
    return token.value;
  };

  // 检查用户是否已登录
  const isUserLoggedIn = () => {
    return !!getToken();
  };

  // 获取其他用户信息（通过ID）
  const getOtherUserInfo = async (id) => {
    if (userInfoCache.has(id)) {
      return userInfoCache.get(id);
    }

    if (userInfoPromises.has(id)) {
      return userInfoPromises.get(id);
    }

    const promise = api.get('/user', { id })
      .then((response) => {
        userInfoCache.set(id, response.data);
        userInfoPromises.delete(id);
        return response.data;
      })
      .catch((error) => {
        console.error('获取用户信息失败:', error);
        userInfoPromises.delete(id);
        return {};
      });

    userInfoPromises.set(id, promise);
    return promise;
  };

  // 获取当前用户信息
  const getCurrentUserInfo = async () => {
    // 1. 内存中有直接返回
    if (userInfo.value) {
      return userInfo.value;
    }

    // 2. 未登录返回游客
    if (!getToken()) {
      return youKe;
    }

    // 3. 检查缓存
    const cached = getUserCache();
    if (cached) {
      userInfo.value = cached.data;

      // 尝试更新 hotInfo（计数器机制）
      const counter = incrementHotCounter();
      if (counter >= 3) {
        // 异步更新，不阻塞返回
        updateHotInfo(cached.data);
      }

      return cached.data;
    }

    // 4. 缓存过期或不存在，请求后端
    if (currentUserPromise) {
      return currentUserPromise;
    }

    Message.loading({ id: 'loadcurrentInfo', content: '拉取个人信息中，请耐心等待...' });
    currentUserPromise = api.get('/user/current')
      .then((response) => {
        Message.success({ id: 'loadcurrentInfo', content: '拉取完毕~已放入缓存中' });
        userInfo.value = response.data;
        saveUserCache(response.data);
        resetHotCounter();
        currentUserPromise = null;
        return response.data;
      })
      .catch((error) => {
        Message.clear();
        console.error('获取用户信息失败:', error);
        currentUserPromise = null;
        return youKe;
      });

    return currentUserPromise;
  };

  // 获取用户信息（统一入口）
  const getUserInfo = async (id = null) => {
    return id ? getOtherUserInfo(id) : getCurrentUserInfo();
  };

  // 更新用户信息
  const updateUserInfo = async (updateData,noApi) => {
    const oldUserInfo = await getUserInfo();
    try {
      userInfo.value = { ...oldUserInfo, ...updateData };
      if(!noApi)
      {
          await api.put('/user', updateData);
      }
      saveUserCache(userInfo.value);
    } catch (error) {
      userInfo.value = oldUserInfo;
      saveUserCache(oldUserInfo);
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
    clearCache
  };
});
