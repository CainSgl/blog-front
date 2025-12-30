// 关注状态缓存管理模块
import { useFollowStore } from '@/store/follow.js';

class FollowCache {
  constructor() {
    // 使用 Pinia store 来管理关注状态
    this.followStore = useFollowStore();
  }

  // 获取关注状态，先检查缓存
  async getFollowStatus(userId) {
    if (!userId) {
      return false;
    }

    return await this.followStore.getFollowStatus(userId);
  }

  // 执行关注操作并更新缓存
  async follow(userId) {
    if (!userId) {
      return false;
    }

    return await this.followStore.follow(userId);
  }

  // 执行取消关注操作并更新缓存
  async unfollow(userId) {
    if (!userId) {
      return false;
    }

    return await this.followStore.unfollow(userId);
  }

  // 清除特定用户的缓存
  clearUserCache(userId) {
    if (userId) {
      this.followStore.clearUserCache(userId);
    }
  }

  // 清除所有缓存
  clearAllCache() {
    this.followStore.clearAllCache();
  }
}

// 创建单例实例
const followCache = new FollowCache();
export default followCache;