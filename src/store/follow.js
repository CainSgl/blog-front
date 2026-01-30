import {defineStore} from 'pinia';
import {ref} from 'vue';
import api from '@/api/index.js';

export const useFollowStore = defineStore('follow', () => 
{
  // 关注状态缓存，使用 Map 存储 {userId: isFollowing}
  const followStatusMap = ref(new Map());
  // 存储正在进行的请求，避免重复请求
  const pendingRequests = ref(new Map());

  // 获取关注状态，先检查缓存
  async function getFollowStatus(userId) 
  {
    if (!userId) 
    {
      return false;
    }

    // 检查缓存中是否存在
    if (followStatusMap.value.has(userId)) 
    {
      return followStatusMap.value.get(userId);
    }

    // 检查是否已有相同的请求正在进行
    if (pendingRequests.value.has(userId)) 
    {
      // 如果有正在进行的请求，等待其完成
      return pendingRequests.value.get(userId);
    }

    // 发起新请求
    const requestPromise = fetchFollowStatusFromAPI(userId);
    pendingRequests.value.set(userId, requestPromise);

    try 
    {
      const result = await requestPromise;
      // 请求完成后，从待处理请求中移除
      pendingRequests.value.delete(userId);
      // 将结果存入缓存
      followStatusMap.value.set(userId, result);
      return result;
    }
    catch (error) 
    {
      // 请求失败时，也从待处理请求中移除
      pendingRequests.value.delete(userId);
      console.error('获取关注状态失败:', error);
      return false;
    }
  }

  // 从 API 获取关注状态
  async function fetchFollowStatusFromAPI(userId) 
  {
    try 
    {
      const {data} = await api.get('/follow', { id: userId });
      return data;
    }
    catch (err) 
    {
      console.error('获取关注状态失败:', err);
      throw err;
    }
  }

  // 更新关注状态
  async function toggleFollow(userId) 
  {
    if (!userId) 
    {
      return false;
    }


    const currentStatus = followStatusMap.value.get(userId) || false;
    const newStatus = !currentStatus;

    try 
    {
      if (newStatus) 
      {
        // 关注
        const {data} =  await api.post('/follow', { id: userId });
      }
      else 
      {
        // 取消关注
        const {data} =  await api.delete('/follow', { id: userId });
      }

      // 成功后更新缓存
      followStatusMap.value.set(userId, newStatus);
      return newStatus;
    }
    catch (err) 
    {
      console.error('关注操作失败:', err);
      throw err;
    }
  }

  // 直接关注
  async function follow(userId) 
  {
    if (!userId) 
    {
      return false;
    }

    if (followStatusMap.value.get(userId)) 
    {
      return true; // 已经关注了
    }

    try 
    {
      const {data} =   await api.post('/follow', { id: userId });
      followStatusMap.value.set(userId, true);
      return true;
    }
    catch (err) 
    {
      console.error('关注操作失败:', err);
      throw err;
    }
  }

  // 直接取消关注
  async function unfollow(userId) 
  {
    if (!userId) 
    {
      return false;
    }

    if (!followStatusMap.value.get(userId)) 
    {
      return true; // 本来就没有关注
    }

    try 
    {
      const {data} = await api.delete('/follow', { id: userId });
       
      followStatusMap.value.set(userId, false);
      return true;
    }
    catch (err) 
    {
      console.error('取消关注操作失败:', err);
      throw err;
    }
  }

  // 批量获取多个用户的关注状态
  async function getMultipleFollowStatus(userIds) 
  {
    const results = {};
    const userIdsToFetch = [];

    // 检查哪些用户ID已经在缓存中
    userIds.forEach((userId) => 
    {
      if (followStatusMap.value.has(userId)) 
      {
        results[userId] = followStatusMap.value.get(userId);
      }
      else 
      {
        userIdsToFetch.push(userId);
      }
    });

    // 对于不在缓存中的用户ID发起请求
    if (userIdsToFetch.length > 0) 
    {
      // 为简化处理，逐个获取（在实际应用中可能需要批量API）
      for (const userId of userIdsToFetch) 
      {
        results[userId] = await getFollowStatus(userId);
      }
    }

    return results;
  }

  // 清除特定用户的缓存
  function clearUserCache(userId) 
  {
    if (userId && followStatusMap.value.has(userId)) 
    {
      followStatusMap.value.delete(userId);
    }
  }

  // 清除所有缓存
  function clearAllCache() 
  {
    followStatusMap.value.clear();
    pendingRequests.value.clear();
  }

  return {
    followStatusMap,
    getFollowStatus,
    toggleFollow,
    follow,
    unfollow,
    getMultipleFollowStatus,
    clearUserCache,
    clearAllCache,
  };
});
