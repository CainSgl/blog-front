<template>
    <a-link 
        :hoverable="false" 
        :href="cardLink" 
        class="kb-card" 
        target="_blank"
    >
        <a-card 
            v-if="isLoaded" 
            class="kb-card-container" 
            :bordered="false" 
            :body-style="{ padding: 0 }"
        >
            <!-- 封面图片 -->
            <div class="kb-cover">
                <c-img 
                    v-if="kbInfo.coverUrl" 
                    :src="kbInfo.coverUrl" 
                    :alt="kbInfo.name" 
                    width="180px" 
                    height="180px"
                    fit="cover" 
                    :preview="false" 
                    lazy-load 
                />
                <div v-else class="kb-cover-empty">
                    <a-empty description="无封面" />
                </div>
            </div>

            <!-- 内容区域 -->
            <div class="kb-content">
                <div class="kb-name">{{ kbInfo.name }}</div>

                <div class="kb-footer">
                    <div class="kb-stats">
                        <icon-book class="icon" />
                        <span>{{ kbInfo.postCount }}</span>
                    </div>
                    <div class="kb-date">{{ formatDate(kbInfo.createdAt) }}</div>
                </div>
            </div>
        
            <!-- 状态标签 -->
            <div v-if="showStatusTag" class="kb-status-tag">
                <a-tag v-if="statusTagConfig.show" :color="statusTagConfig.color">
                    {{ statusTagConfig.text }}
                </a-tag>
            </div>
        </a-card>

        <!-- 加载骨架屏 -->
        <div v-else class="kb-card-loading">
            <a-skeleton :animation="true">
                <a-skeleton-shape :style="skeletonStyle" />
            </a-skeleton>
        </div>
    </a-link>
</template>

<script setup>
import { computed } from 'vue';
import { IconBook } from '@arco-design/web-vue/es/icon';
import CImg from '../base/image/cImg.vue';
import { formatDate } from '@/utils/DateFormatter.js';

const props = defineProps({
  kbInfo: {
    type: Object,
    required: true,
    default: () => ({})
  },
  useLink: {
    type: Boolean,
    default: true
  },
  showStatus: {
    type: Boolean,
    default: true
  },
  onlyFans: {
    type: Boolean,
    default: false
  }
});

// 常量
const SKELETON_STYLE = { height: '260px', width: '180px' };

// 计算属性
const isLoaded = computed(() => props.kbInfo.name || props.kbInfo.id);

const cardLink = computed(() => {
  return props.kbInfo.id && props.useLink 
    ? `/kb?kb=${props.kbInfo.id}` 
    : undefined;
});

const showStatusTag = computed(() => props.showStatus && props.kbInfo.status);

const statusTagConfig = computed(() => {
  const { status } = props.kbInfo;
  const { onlyFans } = props;

  const configs = {
    '仅粉丝': { show: true, color: 'rgb(var(--primary-4))', text: '粉丝专属' },
    '已发布': { show: !onlyFans, color: 'green', text: '公开' },
    '草稿': { show: !onlyFans, color: 'gray', text: '私密' }
  };

  return configs[status] || { show: false };
});

const skeletonStyle = computed(() => SKELETON_STYLE);
</script>

<style scoped lang="less">


.kb-card {
    width: 180px;
    position: relative;
}

.kb-card-container,
.kb-card-loading {
    border-radius: @size-3;
    overflow: hidden;
    cursor: pointer;
    height: 100%;
    border: @border-1 solid @color-border-1;
    transition: all 0.3s ease;
}

.kb-card-container:hover {
    border-color: @primary-6;
    box-shadow: 0 4px 12px 0 fade(@primary-6, 15%);

    .kb-cover .arco-image {
        transform: scale(1.05);
    }

    .kb-cover-empty {
        background-color: @color-fill-2;
    }
}

.kb-cover {
    width: 100%;
    height: 180px;
    overflow: hidden;

    .arco-image {
        transition: transform 0.3s ease;
    }
}

.kb-cover-empty {
    width: 100%;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: @color-fill-1;
    transition: background-color 0.3s ease;
}

.kb-content {
    padding: @size-4;
}

.kb-name {
    font-size: @font-size-title-1;
    font-weight: @font-weight-500;
    color: var(--color-neutral-10);
    margin-bottom: @size-3;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
}

.kb-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: @font-size-body-1;
    color: var(--color-neutral-4);
}

.kb-stats {
    display: flex;
    align-items: center;
    gap: @size-1;

    .icon {
        font-size: @font-size-body-3;
    }
}

.kb-date {
    margin-left: auto;
}

.kb-status-tag {
    position: absolute;
    top: @size-2;
    right: @size-2;
    z-index: 1;
}
</style>