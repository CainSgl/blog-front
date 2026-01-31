# 点赞缓存使用说明

## 概述

点赞缓存系统使用 `localStorage` 存储用户的点赞状态，带有自动过期机制（默认7天），避免缓存无限增长。

## 特性

- ✅ 自动过期：点赞记录7天后自动失效
- ✅ 自动清理：页面加载时和每小时自动清理过期数据
- ✅ 容错处理：localStorage 满时自动清理过期数据后重试
- ✅ 统计功能：可查看缓存使用情况

## 基本使用

```javascript
import { likeCache } from '@/utils/likeCache.js';

// 获取点赞状态
const isLiked = likeCache.getLike(commentId);

// 设置点赞状态
likeCache.setLike(commentId, true);  // 点赞
likeCache.setLike(commentId, false); // 取消点赞

// 切换点赞状态
const newState = likeCache.toggleLike(commentId);

// 删除单个记录
likeCache.removeLike(commentId);
```

## 高级功能

```javascript
// 查看缓存统计
const stats = likeCache.getStats();
console.log(stats);
// {
//   total: 100,      // 总记录数
//   valid: 85,       // 有效记录数
//   expired: 15,     // 已过期记录数
//   expireDays: 7    // 过期天数配置
// }

// 手动清理过期数据
const cleanedCount = likeCache.cleanExpired();
console.log(`清理了 ${cleanedCount} 条过期记录`);

// 清空所有缓存（慎用）
likeCache.clearAll();
```

## 在组件中使用

已集成到以下组件：
- `src/components/comment/Comment.vue` - 主评论
- `src/components/comment/CommentReply.vue` - 回复评论

组件会自动：
1. 初始化时从缓存读取点赞状态
2. 点赞时更新缓存
3. API 失败时回滚缓存状态

## 配置

修改 `src/utils/likeCache.js` 中的常量：

```javascript
const EXPIRE_DAYS = 7; // 修改过期天数
```

## 注意事项

1. **跨设备不同步**：缓存存储在本地，换设备或浏览器会丢失
2. **隐私模式**：隐私/无痕模式下 localStorage 可能不可用
3. **存储限制**：localStorage 通常有 5-10MB 限制，缓存会自动清理过期数据
4. **过期后重置**：7天后点赞状态会重置，用户需要重新点赞

## 为什么不用后端存储？

- 后端存储点赞记录压力大（海量数据）
- 点赞状态不是核心数据，短期缓存即可满足需求
- 用户一般不会记得很久以前的点赞状态
- 7天过期时间是合理的平衡点

## 调试

在浏览器控制台查看缓存：

```javascript
// 查看原始数据
JSON.parse(localStorage.getItem('comment_likes'))

// 查看统计
likeCache.getStats()
```
