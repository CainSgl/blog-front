import api from '@/api/index.js';

/**
 * 签到服务 - 统一管理签到相关的缓存和API调用
 */

const CACHE_KEY = 'checkInCache';
/**
 * 获取签到缓存
 */
export const getCheckInCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    console.error('解析签到缓存失败:', e);
    return null;
  }
};

/**
 * 保存签到缓存
 */
export const saveCheckInCache = (userId, data) => {
  const today = new Date().toISOString().split('T')[0];
  const cache = {
    userId,
    date: today,
    data
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

/**
 * 检查缓存是否有效
 */
export const isCacheValid = (cache, userId) => {
  if (!cache) return false;
  const today = new Date().toISOString().split('T')[0];
  return cache.userId === userId && cache.date === today;
};

/**
 * 获取签到数据（优先从缓存，无缓存则请求后端）
 * 注意：使用 /user/checkin 接口，该接口既用于签到也用于获取记录
 * success=true 表示今天签到成功，success=false 表示今天已签到过
 * 无论 success 是什么，都会返回 checkInDays 数据
 */
export const getCheckInData = async (userId) => {
  // 先检查缓存
  const cache = getCheckInCache();
  if (isCacheValid(cache, userId)) {
    return cache.data;
  }
  try {
    const response = await api.post('/user/checkin');
    const data = response.data;

    if (data.checkInDays) {
      saveCheckInCache(userId, {
        checkInDays: data.checkInDays,
        expGained: data.success ? data.expGained : null
      });
    }
    
    return {
      checkInDays: data.checkInDays || [],
      expGained: data.success ? data.expGained : null
    };
  } catch (error) {
    console.error('获取签到记录失败:', error);
    return null;
  }
};

/**
 * 执行签到（仅用于自动签到场景）
 * 返回签到结果和数据
 */
export const performCheckIn = async (userId) => {
  try {
    const response = await api.post('/user/checkin');
    const data = response.data;
    if (data.checkInDays) {
      saveCheckInCache(userId, {
        checkInDays: data.checkInDays,
        expGained: data.success ? data.expGained : null
      });
    }
    
    return {
      success: data.success,
      expGained: data.expGained,
      checkInDays: data.checkInDays,
      message: data.message
    };
  } catch (error) {
    console.error('签到失败:', error);
    throw error;
  }
};
