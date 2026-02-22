import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/index.js';
import { Message } from '@arco-design/web-vue';
import { likeCache } from '@/utils/likeCache.js';
import { useUserSettingStore } from './userSetting';

const youKe = { id: -1 };

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null);
  const token = ref(null);

  // 其他用户信息缓存
  const userInfoCache = new Map();
  const userInfoPromises = new Map();

  // 当前用户请求Promise（防止重复请求）
  let currentUserPromise = null;

  // 更新 hotInfo（仅内存缓存）
  const updateHotInfo = async () => {
    if (!userInfo.value) return;
    
    try {
      const response = await api.get('/user/hotInfo');
      userInfo.value = { ...userInfo.value, ...response.data };
    } catch (error) {
      console.error('更新 hotInfo 失败:', error);
    }
  };

  // 设置用户信息
  const setUserInfo = (info) => {
    userInfo.value = info;
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
    // 1. 内存中有直接返回，并异步更新 hotInfo
    if (userInfo.value) {
      updateHotInfo();
      return userInfo.value;
    }

    // 2. 未登录返回游客
    if (!getToken()) {
      return youKe;
    }

    // 3. 防止重复请求
    if (currentUserPromise) {
      return currentUserPromise;
    }

   // Message.loading({ id: 'loadcurrentInfo', content: '拉取个人信息中，请耐心等待...' });
    currentUserPromise = api.get('/user/current')
      .then((response) => {
        //Message.success({ id: 'loadcurrentInfo', content: '拉取完毕~' });
        userInfo.value = response.data;
        currentUserPromise = null;
        
        // 初始化用户设置
        const userSettingStore = useUserSettingStore();
        userSettingStore.initSettings().catch(err => {
          console.warn('初始化用户设置失败:', err);
        });
        
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
  const updateUserInfo = async (updateData, noApi) => {
    const oldUserInfo = await getUserInfo();
    try {
      userInfo.value = { ...oldUserInfo, ...updateData };
      if (!noApi) {
        await api.put('/user', updateData);
      }
    } catch (error) {
      userInfo.value = oldUserInfo;
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
