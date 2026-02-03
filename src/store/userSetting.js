import { defineStore } from 'pinia';
import { ref } from 'vue';
import userSettingService from '@/services/userSettingService';

const STORAGE_KEY = 'userSettings';

/**
 * 用户设置 Store
 * 使用本地缓存，只在登录时拉取一次服务器设置
 */
export const useUserSettingStore = defineStore('userSetting', () => {
  const settings = ref({});
  const isLoaded = ref(false);

  /**
   * 从本地缓存加载设置
   */
  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        settings.value = JSON.parse(cached);
        isLoaded.value = true;
        return true;
      }
    } catch (error) {
      console.error('加载本地设置失败:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
    return false;
  };

  /**
   * 保存设置到本地缓存
   */
  const saveToCache = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value));
    } catch (error) {
      console.error('保存本地设置失败:', error);
    }
  };

  /**
   * 从服务器拉取设置（仅在登录时调用）
   */
  const fetchFromServer = async () => {
    try {
      const serverSettings = await userSettingService.getUserSetting();
      settings.value = serverSettings;
      saveToCache();
      isLoaded.value = true;
      return serverSettings;
    } catch (error) {
      console.error('从服务器拉取设置失败:', error);
      // 如果拉取失败，尝试使用本地缓存
      loadFromCache();
      throw error;
    }
  };

  /**
   * 初始化设置（登录时调用）
   * 优先使用本地缓存，如果没有则从服务器拉取
   */
  const initSettings = async () => {
    // 先尝试从本地缓存加载
    const hasCache = loadFromCache();
    
    // 如果没有缓存，从服务器拉取
    if (!hasCache) {
      try {
        await fetchFromServer();
      } catch (error) {
        console.warn('初始化设置失败，使用空设置');
        settings.value = {};
        isLoaded.value = true;
      }
    } else {
      // 有缓存就直接使用，不再从服务器拉取
      isLoaded.value = true;
    }
  };

  /**
   * 获取设置值
   * @param {string} key - 设置键，支持点号分隔的路径，如 'musicPlayer.dontAskAgain'
   * @param {any} defaultValue - 默认值
   */
  const getSetting = (key, defaultValue = null) => {
    if (!key) return defaultValue;
    
    const keys = key.split('.');
    let value = settings.value;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  };

  /**
   * 设置值
   * @param {string} key - 设置键，支持点号分隔的路径
   * @param {any} value - 设置值
   * @param {boolean} syncToServer - 是否同步到服务器，默认 true
   */
  const setSetting = async (key, value, syncToServer = true) => {
    if (!key) return;
    
    const keys = key.split('.');
    let target = settings.value;
    
    // 创建嵌套对象路径
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!target[k] || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }
    
    // 设置最终值
    target[keys[keys.length - 1]] = value;
    
    // 保存到本地缓存
    saveToCache();
    
    // 同步到服务器
    if (syncToServer) {
      try {
        await userSettingService.saveSetting(settings.value);
      } catch (error) {
        console.error('同步设置到服务器失败:', error);
        // 不抛出错误，允许继续使用本地设置
      }
    }
  };

  /**
   * 批量更新设置
   * @param {Object} newSettings - 新设置对象
   * @param {boolean} merge - 是否合并，默认 true
   * @param {boolean} syncToServer - 是否同步到服务器，默认 true
   */
  const updateSettings = async (newSettings, merge = true, syncToServer = true) => {
    if (merge) {
      settings.value = { ...settings.value, ...newSettings };
    } else {
      settings.value = newSettings;
    }
    
    saveToCache();
    
    if (syncToServer) {
      try {
        await userSettingService.saveSetting(settings.value);
      } catch (error) {
        console.error('同步设置到服务器失败:', error);
      }
    }
  };

  /**
   * 手动同步到服务器
   */
  const syncToServer = async () => {
    try {
      await userSettingService.saveSetting(settings.value);
      return true;
    } catch (error) {
      console.error('同步到服务器失败:', error);
      throw error;
    }
  };

  /**
   * 清除所有设置
   * @param {boolean} deleteFromServer - 是否从服务器删除，默认 false
   */
  const clearSettings = async (deleteFromServer = false) => {
    settings.value = {};
    isLoaded.value = false;
    localStorage.removeItem(STORAGE_KEY);
    
    if (deleteFromServer) {
      try {
        await userSettingService.deleteSetting();
      } catch (error) {
        console.error('从服务器删除设置失败:', error);
      }
    }
  };

  return {
    settings,
    isLoaded,
    initSettings,
    getSetting,
    setSetting,
    updateSettings,
    syncToServer,
    fetchFromServer,
    clearSettings,
    loadFromCache,
  };
});
