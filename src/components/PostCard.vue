<template>
  <div class="post-card">
    <a-card class="post-card-container" :bordered="false" :body-style="{ padding: '20px' }" @click="handleCardClick">
      <!-- 图片和内容容器，用于响应式布局 -->
      <div class="post-content-wrapper">
        <!-- 文章图片 -->
        <div v-if="post.img" class="post-image">
          <a-image 
            :src="post.img" 
            :alt="post.title"
            width="100%"
            height="100%"
            fit="cover"
            :preview="false"
            lazy-load
          />
        </div>
        
        <!-- 文章内容 -->
        <div class="post-content">
          <div class="post-header">
            <div class="post-title-section">
              <!-- 置顶标识 -->
              <span v-if="post.top" class="top-tag">置顶</span>
              <!-- 标题 -->
              <span class="post-title">{{ post.title }}</span>
            </div>
            <!-- 状态 -->
            <a-tag v-if="post.status === '已发布'" color="green">{{ post.status }}</a-tag>
            <a-tag v-else color="gray">{{ post.status }}</a-tag>
          </div>
          
          <!-- 摘要 -->
          <div class="post-summary" v-if="post.summary">
            {{ post.summary }}
          </div>
          
          <!-- 标签 -->
          <div class="post-tags" v-if="post.tags && post.tags.length > 0">
            <a-space wrap>
              <a-tag v-for="(tag, index) in post.tags" :key="index" color="arcoblue">
                {{ tag }}
              </a-tag>
            </a-space>
          </div>
          
          <!-- 统计数据 -->
          <div class="post-stats">
            <a-space>
              <span class="stat-item">
                <icon-eye /> {{ post.viewCount }}
              </span>
              <span class="stat-item">
                <icon-thumb-up /> {{ post.likeCount }}
              </span>
              <span class="stat-item">
                <icon-message /> {{ post.commentCount }}
              </span>
            </a-space>
          </div>
          
          <!-- 时间信息 -->
          <div class="post-footer">
            <span class="post-date">{{ formatDate(post.createdAt) }}</span>
          </div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { Card, Tag, Space, Image } from '@arco-design/web-vue'
import { IconEye, IconThumbUp, IconMessage } from '@arco-design/web-vue/es/icon'

const props = defineProps({
  post: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      title: '',
      status: '草稿',
      top: false,
      summary: '',
      recommend: false,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      tags: [],
      userId: '',
      createdAt: '',
      updatedAt: '',
      img:''
    })
  }
})



// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 处理卡片点击事件
const handleCardClick = () => {
  // 可以在这里添加跳转到文章详情页的逻辑
  console.log('Card clicked for post:', props.post.id)
}
</script>

<style scoped lang="less">
@import '@/assets/style/global.less';

.post-card {
  .post-card-container {
    border-radius: 8px;
    border: 1px solid #e5e8ef;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.34, 0.69, 0.1, 1);
    overflow: hidden;
    cursor: pointer;
    
    &:hover {
      border-color: @primary-6;
      box-shadow: 0 4px 12px 0 rgba(0, 174, 236, 0.15);
    }
  }
  
  .post-content-wrapper {
    display: flex;
    flex-direction: column;
    
    // 在大屏幕下，图片和内容水平排列
    @media (min-width: 768px) {
      flex-direction: row;
      gap: 16px;
      
      .post-image {
        flex: 0 0 300px; // 固定图片宽度为200px
        height: 200px;
        border-radius: 8px;
      }
      
      .post-content {
        flex: 1;
        min-width: 0; // 允许内容区域收缩
      }
    }
  }
  
  .post-image {
    position: relative;
    width: 100%;
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;
    
    // 在大屏幕水平布局时，取消底部边距
    @media (min-width: 768px) {
      margin-bottom: 0;
    }
    
    .arco-image {
      display: block;
      width: 100%;
      height: 100%;
    }
  }
  
  .post-content {
    flex: 1;
    min-width: 0;
  }
  
  .post-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    
    .post-title-section {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0; /* 允许flex子项收缩 */
    }
    
    .top-tag {
      background-color: #ff7d00;
      color: white;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    
    .post-title {
      font-size: 16px;
      font-weight: 500;
      color: #1d2129;
      line-height: 1.4;
      flex: 1;
      word-break: break-word;
      cursor: pointer;
      user-select: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  .post-summary {
    color: #4e5969;
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 16px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 42px; /* 保证至少显示两行的高度 */
  }
  
  .post-tags {
    margin-bottom: 16px;
  }
  
  .post-stats {
    margin-bottom: 12px;
    padding-top: 12px;
    border-top: 1px solid #f6f8fa;
    
    .stat-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #86909c;
      font-size: 14px;
      margin-right: 16px;
      
      &:last-child {
        margin-right: 0;
      }
    }
  }
  
  .post-footer {
    .post-date {
      color: #86909c;
      font-size: 12px;
    }
  }
}
</style>
