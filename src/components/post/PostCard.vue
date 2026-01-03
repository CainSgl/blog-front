<template>
  <div class="post-card" :style="{ height: `${props.height}px`, width: `${props.width}px` }">

    <a-card class="post-card-container" :bordered="false" :body-style="{ padding: '20px' }" @click="handleCardClick" v-if="post.id">
      <!-- 图片和内容容器，用于响应式布局 -->
      <div class="post-content-wrapper"
        :class="{ 'horizontal-layout': props.width > 400, 'vertical-layout': props.width <= 400, 'no-image': !post.img }">
        <!-- 文章图片 -->
        <div v-if="post.img" class="post-image" :style="imageStyle">
          <c-img :src="post.img" :alt="post.title" width="100%" height="100%" fit="cover" :preview="false" lazy-load />
        </div>

        <!-- 文章内容 -->
        <div class="post-content">
          <div class="header">
            <div class="post-header">
              <div class="post-title-section">
                <!-- 置顶标识 -->
                <span v-if="post.top" class="top-tag">置顶</span>
                <!-- 标题 -->
                <span class="post-title">{{ post.title }}</span>
              </div>
              <!-- 状态 -->
              <div v-if="showStatus">
                <a-tag v-if="post.status === '仅粉丝'" :color="primary4Color">{{ post.status }}</a-tag>
                <a-tag v-else-if="post.status === '已发布'" color="green">{{ post.status }}</a-tag>
                <a-tag v-else color="gray">{{ post.status }}</a-tag>
              </div>
            </div>
          </div>

          <div class="content" :style="{ height: `${summaryHight}px` }" v-if="showSummary">
            <!-- 摘要 -->
            <div v-if="!post.summary">
              <div v-if="summaryHight > 100">
                <a-empty description="摘要里什么都没有" />
              </div>
              <div v-else-if="summary > 0" class="post-summary">
                摘要里什么都没有
              </div>
            </div>
            <div class="post-summary" :style="{ WebkitLineClamp: summary }">
              {{ post.summary }}
            </div>

          </div>
          <div class="footer">
            <!-- 标签 -->
            <div class="post-tags" v-if="post.tags && post.tags.length > 0">
              <a-space wrap>
                <template v-for="(tag, index) in post.tags" :key="index">
                  <a-tooltip v-if="getTagScore(tag)" :content="getTagScore(tag)" position="top">
                    <a-tag color="arcoblue">
                      {{ getTagDisplayName(tag) }}
                    </a-tag>
                  </a-tooltip>
                  <a-tag v-else color="arcoblue">
                    {{ getTagDisplayName(tag) }}
                  </a-tag>
                </template>
              </a-space>
            </div>
            <div class="post-stats-footer-wrapper">
              <!-- 统计数据和时间信息容器 -->
              <div class="post-stats-footer-container">
                <!-- 统计数据 -->
                <div class="post-stats">
                  <a-space>
                    <span class="stat-item">
                      <icon-eye size="large" /> {{ post.viewCount }}
                    </span>
                    <span class="stat-item" @click="handleLikeClick">
                      <icon-heart-fill size="large" v-if="!isDisliked && isLiked" :style="{ color: '#ff6699' }" />
                      <icon-thumb-down-fill size="large" v-else-if="isDisliked" :style="{ color: '#ff6699' }" />
                      <icon-thumb-up size="large" v-else />
                      {{ post.likeCount }}
                    </span>
                    <span class="stat-item">
                      <icon-message /> {{ post.commentCount }}
                    </span>
                  </a-space>
                </div>

                <!-- 时间信息 -->
                <div class="post-footer" v-if="props.width>240">
                  <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                </div>
              </div>
            </div>


          </div>

        </div>
      </div>
    </a-card>
    <div  class="post-card-loading" v-else>
      <a-skeleton :animation="true">
        <a-skeleton-shape :style="{ height: `${props.height}px`, width: `${props.width}px` }"/>
      </a-skeleton>
    </div>
  </div>
</template>

<script setup>
import { IconEye, IconThumbUp, IconMessage, IconThumbDownFill, IconHeartFill, IconStarFill } from '@arco-design/web-vue/es/icon'
import { computed, ref, watchEffect, defineEmits } from 'vue'
import CImg from '../base/cImg.vue'
const emit = defineEmits(['clickCard']);
const props = defineProps({
  post: {
    type: Object,
    default: {}
  },
  height: {
    type: Number,
    default: 300
  },
  width: {
    type: Number,
    default: 600
  },
  showStatus: {
    type: Boolean,
    default: false
  }
})

// 定义使用全局样式变量 primary-4 的颜色
const primary4Color = '#ff6699' // 对应 @primary-4: #ff6699; 在 global.less 中

const imageHeight = ref(0)
const imageStyle = ref({})
const summary = ref(1);
const summaryHight = ref(0)
const showSummary = ref(true)
// 使用 watchEffect 来处理副作用并计算图片样式
watchEffect(() => {
  // 如果没有图片，返回空样式
  if (!props.post.img) {
    summary.value = calculateSummary()
    imageStyle.value = {};
    return;
  }
  //如果是水平模式
  if (props.width <= 400) {
    //width应该是填满的
    const width = props.width - 40;
    //虽然由宽度决定，但是高度仍然不要超过1/2
    imageHeight.value = Math.min(width / 1.5, props.height / 2)
    summary.value = calculateSummary()
    imageStyle.value = {
      height: `${imageHeight.value}px`,
      // width: `${width}px`
    };
  } else {
    //图片由高度决定
    const height = props.height - 40
    //虽然有高度决定，但是width仍然限制一下，最好不要超过卡片的1/2
    imageHeight.value = height
    summary.value = calculateSummary()
    imageStyle.value = {
      height: `${height - 20}px`,
      width: `${Math.min(props.width / 2, height * 1.5)}px`
    };
  }
})


function calculateSummary() {
  // 计算可用高度用于摘要显示 (总高度 - 标题高度 - 页脚高度等)
  const lineHeight = 20; // 每行高度
  const titleHeight = 36; // 标题区域高度
  const footerHeight = 70; // 页脚区域高度
  let availableHeight = props.height - titleHeight - footerHeight;

  // 如果有图片且宽度，说明这个时候是垂直模式，需要减去图片高度
  if (props.post.img && props.width <= 400) {
    availableHeight -= imageHeight.value;
  }
  if (props.post.tags && props.post.tags.length > 0) {
    availableHeight -= 50;
  } else {
    availableHeight -= 10;
  }
  summaryHight.value = availableHeight
  const lines = Math.floor(availableHeight / lineHeight);
  if (lines <= 0) {
    //不显示了  
    showSummary.value = false
    return 1;
  } else {
    //显示lines行
    showSummary.value = true
  }
  return lines;

}





// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 计算属性：判断是否已点赞
const isLiked = computed(() => {
  return props.post.operate && props.post.operate.includes('点赞');
})

// 计算属性：判断是否已讨厌
const isDisliked = computed(() => {
  return props.post.operate && props.post.operate.includes('讨厌');
})

// 处理点赞/讨厌点击事件
const handleLikeClick = (event) => {
  console.log('Like clicked for post:', props.post.id)
  event.stopPropagation(); // 阻止事件冒泡，避免触发卡片点击
  // 这里可以添加点赞/取消点赞的逻辑
}

// 获取标签显示名称（去掉分数部分）
const getTagDisplayName = (tag) => {
  if (typeof tag === 'string' && tag.includes(':')) {
    return tag.split(':')[0];
  }
  return tag;
}

// 获取标签分数（如果存在）
const getTagScore = (tag) => {
  if (typeof tag === 'string' && tag.includes(':')) {
    const parts = tag.split(':');
    if (parts.length > 1) {
      return `作者认为该标签相关度为: ${parts[1]}`;
    }
  }
  return null; // 如果没有分数部分，则不显示tooltip
}

// 处理卡片点击事件
const handleCardClick = () => {
  if (props.post.id) {
    emit('clickCard', props.post)
  }
}
</script>

<style scoped lang="less">
.post-card {
  container-type: inline-size;
  container-name: post-card;
  height: 100%;

  .post-card-container {
    border-radius: 8px;
    border: 1px solid #e5e8ef;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.34, 0.69, 0.1, 1);
    overflow: hidden;
    cursor: pointer;
    height: 100%;

    &:hover {
      border-color: @primary-6;
      box-shadow: 0 4px 12px 0 rgba(0, 174, 236, 0.15);

      .arco-image {
        transform: scale(1.05);
      }
    }
  }
   .post-card-loading {
    border-radius: 8px;
    border: 1px solid #e5e8ef;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.34, 0.69, 0.1, 1);
    overflow: hidden;
    height: 100%;
  }
  .post-content-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;

    &.horizontal-layout {
      flex-direction: row;

      .post-image {

        height: auto;
        max-height: 100%;
        border-radius: 8px;
      }

      .post-content {
        margin-left: 20px;
        flex: 1;
        min-width: 0; // 允许内容区域收缩
        height: 100%;
        display: flex;
        flex-direction: column;
      }
    }

    &.no-image.horizontal-layout .post-content {
      margin-left: 0; // 没有图片时，内容区域不需要左边距
    }

  }

  .post-image {
    position: relative;
    width: 100%;
    min-height: 100px; // 设置最小高度以确保在小容器中也能显示
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;
    flex: 0 0 auto; // 防止图片区域被压缩

    .arco-image {
      display: block;
      width: 100%;
      height: 100%;
      transition: transform 0.3s ease;
    }
  }

  .post-content-wrapper.horizontal-layout .post-image {
    margin-bottom: 0;
    height: 100%;
  }

  .post-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;

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
      min-width: 0;
      /* 允许flex子项收缩 */
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
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
  }

  .post-tags {
    margin-top: 10px;
    margin-bottom: 8px;
  }

  .post-stats-footer-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    position: relative;
  }

  .post-stats-footer-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background-color: #f6f8fa;
    z-index: -1;
    /* 确保伪元素在内容下方 */
  }

  .post-stats {
    margin-bottom: 0;

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

  .post-stats-footer-wrapper {
    position: absolute;
    bottom: 5px;
    left: 0;
    right: 0;
    padding: 0 20px; // 与卡片内边距一致
  }
}
</style>
