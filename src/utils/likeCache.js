/**
 * 点赞缓存管理工具
 * 使用 localStorage 存储点赞状态，带过期时间机制
 */

const CACHE_KEY = 'comment_likes';
const EXPIRE_DAYS = 7; // 7天后过期

export const likeCache = {
  /**
   * 获取点赞状态
   * @param {string|number} commentId - 评论ID
   * @returns {boolean} 是否已点赞
   */
  getLike(commentId) {
    const cache = this._getCache();
    const item = cache[commentId];
    
    if (!item) return false;
    
    // 检查是否过期
    if (Date.now() > item.expireAt) {
      this.removeLike(commentId);
      return false;
    }
    
    return item.liked;
  },
  
  /**
   * 设置点赞状态
   * @param {string|number} commentId - 评论ID
   * @param {boolean} liked - 是否点赞
   */
  setLike(commentId, liked) {
    const cache = this._getCache();
    cache[commentId] = {
      liked,
      timestamp: Date.now(),
      expireAt: Date.now() + (EXPIRE_DAYS * 24 * 60 * 60 * 1000)
    };
    this._saveCache(cache);
  },
  
  /**
   * 删除单个点赞记录
   * @param {string|number} commentId - 评论ID
   */
  removeLike(commentId) {
    const cache = this._getCache();
    delete cache[commentId];
    this._saveCache(cache);
  },
  
  /**
   * 切换点赞状态
   * @param {string|number} commentId - 评论ID
   * @returns {boolean} 切换后的状态
   */
  toggleLike(commentId) {
    const currentState = this.getLike(commentId);
    const newState = !currentState;
    this.setLike(commentId, newState);
    return newState;
  },
  
  /**
   * 清理所有过期数据
   * @returns {number} 清理的记录数
   */
  cleanExpired() {
    const cache = this._getCache();
    const now = Date.now();
    let cleanedCount = 0;
    
    Object.keys(cache).forEach(id => {
      if (now > cache[id].expireAt) {
        delete cache[id];
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      this._saveCache(cache);
      console.log(`[LikeCache] 清理了 ${cleanedCount} 条过期点赞记录`);
    }
    
    return cleanedCount;
  },
  
  /**
   * 清空所有缓存
   */
  clearAll() {
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('[LikeCache] 已清空所有点赞缓存');
    } catch (e) {
      console.error('[LikeCache] 清空缓存失败:', e);
    }
  },
  
  /**
   * 获取缓存统计信息
   * @returns {object} 统计信息
   */
  getStats() {
    const cache = this._getCache();
    const now = Date.now();
    const ids = Object.keys(cache);
    
    const expired = ids.filter(id => now > cache[id].expireAt).length;
    const valid = ids.length - expired;
    
    return {
      total: ids.length,
      valid,
      expired,
      expireDays: EXPIRE_DAYS
    };
  },
  
  /**
   * 内部方法：获取缓存对象
   * @private
   */
  _getCache() {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('[LikeCache] 读取缓存失败:', e);
      return {};
    }
  },
  
  /**
   * 内部方法：保存缓存对象
   * @private
   */
  _saveCache(cache) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      // localStorage 满了，尝试清理过期数据后重试
      console.warn('[LikeCache] 存储失败，尝试清理过期数据...');
      this.cleanExpired();
      
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch (retryError) {
        console.error('[LikeCache] 存储失败，localStorage 可能已满:', retryError);
      }
    }
  }
};

// 页面加载时自动清理过期数据
likeCache.cleanExpired();

// 可选：定期清理（每小时检查一次）
if (typeof window !== 'undefined') {
  setInterval(() => {
    likeCache.cleanExpired();
  }, 60 * 60 * 1000); // 1小时
}

export default likeCache;
