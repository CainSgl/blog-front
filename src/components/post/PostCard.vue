<template>
  <div class="post-card" :style="{ height: `${props.height}px`, width: `${props.width}px` }"
    :alt="post.summary ? post.summary : post.title">

    <a-card class="post-card-container" :bordered="false" :body-style="{ padding: '20px' }" @click="handleCardClick"
      v-if="post.id||post.title">
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

                <span class="post-title" v-if="inHtlm" v-html="post.title"></span>
                <span class="post-title" v-else>{{ post.title }}</span>
              </div>
              <!-- 状态 -->
              <div v-if="showStatus">
                <a-tag v-if="post.status === '仅粉丝'" color="pink">{{ post.status }}</a-tag>
                <a-tag v-else-if="post.status === '已发布' && !onlyFans" color="green">{{ post.status }}</a-tag>
                <a-tag v-else-if="!onlyFans" color="gray">{{ post.status }}</a-tag>
              </div>
            </div>
          </div>

          <div class="content" :style="{ height: `${summaryConfig.height}px` }" v-if="summaryConfig.show">
            <!-- 摘要 -->
            <div v-if="!post.summary">
              <div v-if="summaryConfig.height > 100">
                <a-empty description="摘要里什么都没有" />
              </div>
              <div v-else-if="summaryConfig.lines > 0" class="post-summary">
                摘要里什么都没有
              </div>
            </div>
            <div class="post-summary" :style="{ WebkitLineClamp: summaryConfig.lines }" v-if="inHtlm"
              v-html="post.summary">
            </div>
            <div class="post-summary" :style="{ WebkitLineClamp: summaryConfig.lines }" v-else>
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
            <div class="post-stats-footer-wrapper" v-if="showBottom">
              <!-- 统计数据和时间信息容器 -->
              <div class="post-stats-footer-container">
                <!-- 统计数据 -->
                <div class="post-stats">
                  <a-space>
                    <span class="stat-item" v-if="post.viewCount !== undefined">
                      <icon-eye size="large" /> {{ post.viewCount }}
                    </span>
                    <span class="stat-item" v-if="post.likeCount !== undefined">
                      <icon-heart size="large" />{{ post.likeCount }}
                    </span>
                    <span class="stat-item" v-if="post.commentCount !== undefined">
                      <icon-message size="large" /> {{ post.commentCount }}
                    </span>
                  </a-space>
                </div>

                <!-- 时间信息 -->
                <div class="post-footer" v-if="props.width > 240">
                  <span class="post-date">{{ formatDate(post.updatedAt, '更新') }}</span>
                </div>
              </div>
            </div>


          </div>

        </div>
      </div>
    </a-card>
    <div class="post-card-loading" v-else>
      <a-skeleton :animation="true">
        <a-skeleton-shape :style="{ height: `${props.height}px`, width: `${props.width}px` }" size="large" />
      </a-skeleton>
    </div>
  </div>
</template>

<script setup>
import {IconEye, IconHeart, IconMessage} from '@arco-design/web-vue/es/icon';
import {computed} from 'vue';
import CImg from '../base/image/cImg.vue';
import {formatDate} from '@/utils/DateFormatter.js';

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
  },
  onlyFans: {
    type: Boolean,
    default: false
  },
  showBottom: {
    type: Boolean,
    default: true
  },
  inHtlm: {
    type: Boolean,
    default: false
  }
});

// 常量定义
const LAYOUT_BREAKPOINT = 400;
const LINE_HEIGHT = 20;
const TITLE_HEIGHT = 36;
const FOOTER_HEIGHT = 70;
const TAGS_HEIGHT_WITH_TAGS = 50;
const TAGS_HEIGHT_WITHOUT_TAGS = 10;

// 布局模式
const isVerticalLayout = computed(() => props.width <= LAYOUT_BREAKPOINT);

// 图片尺寸计算
const imageHeight = computed(() => {
  if (!props.post.img || !isVerticalLayout.value) return 0;
  const width = props.width - 40;
  return Math.min(width / 1.5, props.height / 2);
});

const imageStyle = computed(() => {
  if (!props.post.img) return {};

  if (isVerticalLayout.value) {
    return { height: `${imageHeight.value}px` };
  }

  let height = props.height - 50;
  if (!props.showBottom) height += 20;
  
  return {
    height: `${height}px`,
    width: `${Math.min(props.width / 2, height * 1.5)}px`
  };
});

// 摘要配置
const summaryConfig = computed(() => {
  const tagsHeight = props.post.tags?.length > 0 ? TAGS_HEIGHT_WITH_TAGS : TAGS_HEIGHT_WITHOUT_TAGS;
  let availableHeight = props.height - TITLE_HEIGHT - FOOTER_HEIGHT - tagsHeight;

  if (props.post.img && isVerticalLayout.value) {
    availableHeight -= imageHeight.value;
  }

  if (!props.showBottom) {
    availableHeight += 10;
  }

  const lines = Math.floor(availableHeight / LINE_HEIGHT);

  return {
    height: availableHeight,
    lines: Math.max(1, lines),
    show: lines > 0
  };
});

// 标签处理
const getTagDisplayName = (tag) => {
  if (typeof tag === 'string' && tag.includes(':')) {
    return tag.split(':')[0];
  }
  return tag;
};

const getTagScore = (tag) => {
  if (typeof tag === 'string' && tag.includes(':')) {
    const parts = tag.split(':');
    if (parts.length > 1) {
      return `作者认为该标签相关度为: ${parts[1]}`;
    }
  }
  return null;
};

// 事件处理
const handleCardClick = () => {
  if (props.post.id) {
    emit('clickCard', props.post);
  }
};
</script>

<style scoped>
.post-card {
  container-type: inline-size;
  container-name: post-card;
  height: 100%;
}

.post-card-container {
  border-radius: var(--border-radius-large);
  border: 1px solid var(--color-border-2);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.34, 0.69, 0.1, 1);
  overflow: hidden;
  cursor: pointer;
  height: 100%;
}

.post-card-container:hover {
  border-color: rgb(var(--primary-6));
  box-shadow: 0 4px 12px 0 rgba(var(--primary-6), 0.15);
}

.post-card-container:hover .arco-image {
  transform: scale(1.05);
}

.post-card-loading {
  background-color: var(--color-bg-1);
  border-radius: var(--border-radius-large);
  border: 1px solid var(--color-border-2);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.34, 0.69, 0.1, 1);
  overflow: hidden;
  height: 100%;
}

.post-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.post-content-wrapper.horizontal-layout {
  flex-direction: row;
}

.post-content-wrapper.horizontal-layout .post-image {
  height: auto;
  max-height: 100%;
  border-radius: var(--border-radius-large);
}

.post-content-wrapper.horizontal-layout .post-content {
  margin-left: 20px;
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.post-content-wrapper.no-image.horizontal-layout .post-content {
  margin-left: 0;
}

.post-image {
  position: relative;
  width: 100%;
  min-height: 100px;
  border-radius: var(--border-radius-medium);
  overflow: hidden;
  margin-bottom: 16px;
  flex: 0 0 auto;
}

.post-image .arco-image {
  display: block;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
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
}

.post-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.top-tag {
  background-color: rgb(var(--warning-6));
  color: var(--color-bg-white);
  font-size: 14px;
  padding: 2px 6px;
  border-radius: var(--border-radius-small);
  flex-shrink: 0;
}

.post-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-neutral-10);
  line-height: 1.4;
  flex: 1;
  word-break: break-word;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-summary {
  color: var(--color-neutral-8);
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
  background-color: var(--color-fill-2);
  z-index: -1;
}

.post-stats {
  margin-bottom: 0;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-neutral-4);
  font-size: 14px;
  margin-right: 16px;
}

.stat-item:last-child {
  margin-right: 0;
}

.post-date {
  color: var(--color-neutral-4);
  font-size: 14px;
}

.post-stats-footer-wrapper {
  position: absolute;
  bottom: 5px;
  left: 0;
  right: 0;
  padding: 0 20px;
}

.post-card :deep(em) {
  color: rgb(var(--primary-4));
  font-style: normal;
  font-weight: 600;
  background-color: rgba(var(--primary-4), 0.1);
  padding: 2px 4px;
  border-radius: 0;
}
</style>
