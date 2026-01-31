<template>

  <div class="article-view-container">
    <!-- 向上滑动进度条 -->

    <a-spin :loading="!node?.content" style="width: 100%;display: block;height: 100%;" tip="正在加载文章">

      <div v-if="node?.content">
        <!-- 文章头部信息 -->
        <div class="article-header">
          <h1 class="article-title">{{ node.content.title }}</h1>
          <div class="article-summary" v-if="node.content.summary">
            <div class="summary-icon">
              <icon-info-circle />
            </div>
            <div class="summary-text">{{ node.content.summary }}</div>
          </div>
        </div>
        <ScrollProgressTrigger ref="progressTriggerUpRef" container-selector=".article-view-container"
          :enabled="!!node.content" progress-tip="向上滑动返回上一级" direction="up"
          @progress-complete="handleProgressCompleteUp" />
        <!-- 文章内容 -->
        <div style="margin-right: 20px;">
          <MarkdownPreviewWrapper :tocDefaultShow="false" :content="node?.content?.content || ''" :showComment="true"
            :showToc="true" :useWindowScroll="false" />
        </div>
      </div>
      <div v-if="!node.content" style="width: 100%;height: 100%;"></div>
      <a-empty v-if="node?.content && !node?.content.content" style="width: 100%;height: 100%;">
        <template #image>
          <icon-exclamation-circle-fill />
        </template>
        这篇文章什么都没写！肯定是小编偷懒了。
      </a-empty>
      <ScrollProgressTrigger ref="progressTriggerRef" container-selector=".article-view-container"
        progress-tip="向下滑动跳转到下一级" direction="down" @progress-complete="handleProgressComplete" />
    </a-spin>


  </div>
  <!-- 向下滑动进度条 -->

  <!-- 固钉评论按钮 -->
  <a-affix :offset-bottom="20">
    <div class="comment-affix-button">
      <a-badge :count="commentCount" :offset="[-2, 2]">
        <a-button type="primary" shape="circle" @click="showCommentModal = true">
          <template #icon>
            <icon-message />
          </template>
        </a-button>
      </a-badge>
    </div>
  </a-affix>
  <!-- 评论 Modal -->
  <a-modal v-model:visible="showCommentModal" title="评论列表" :width="'min(980px,80vw)'" :footer="false" unmount-on-close>
    <div style="overflow-x: hidden;">
      <CommentList v-if="node?.content?.id" :noCommentsText="'这里是无人区~'" :commentCountText="'不好的地方可以评论一下'"
        :version="version" :postId="node.content.id" :postCount="commentCount" />
    </div>

  </a-modal>
</template>

<script setup>
import {computed, nextTick, ref, watch} from 'vue';
import {IconExclamationCircleFill, IconInfoCircle, IconMessage} from '@arco-design/web-vue/es/icon';
import MarkdownPreviewWrapper from '@/components/md/MarkdownPreviewWrapper.vue';
import CommentList from '@/components/post/children/CommentList.vue';
import ScrollProgressTrigger from '@/views/about/components/ScrollProgressTrigger.vue';
import {useCommentStore} from '@/components/comment/commentStore.js';

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['scroll-to-bottom', 'scroll-to-top']);

const commentStore = useCommentStore();
const version = ref();
const showCommentModal = ref(false);
const progressTriggerRef = ref(null);
const progressTriggerUpRef = ref(null);

const commentCount = computed(() => {
  return props.node?.content?.commentCount || 0;
});

// 处理向下进度完成事件
const handleProgressComplete = () => {
  emit('scroll-to-bottom');
};

// 处理向上进度完成事件
const handleProgressCompleteUp = () => {
  emit('scroll-to-top');
};

// 监听 node 变化，获取段评数据
watch(() => props.node, (newNode) => {
  if (newNode?.content?.id && newNode?.content?.version) {
    version.value = newNode.content.version;
    commentStore.getParagraphCommentCountByPost(newNode.content.id, newNode.content.version);
  }
  // 重置进度条
  nextTick(() => {
    if (progressTriggerRef.value) {
      progressTriggerRef.value.resetProgress();
    }
    if (progressTriggerUpRef.value) {
      progressTriggerUpRef.value.resetProgress();
    }
  });
}, { immediate: true });
</script>

<style scoped lang="less">
.article-view-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: var(--color-bg-1);
}

.article-header {
  padding: 32px 24px 24px;
  border-bottom: 1px solid var(--color-border-2);
  margin-bottom: 24px;
  background-color: var(--color-bg-1);
}

.article-title {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.4;
  margin: 0 0 16px 0;
  color: var(--color-text-1);
  letter-spacing: -0.5px;
}

.article-summary {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: var(--color-fill-2);
  border-left: 4px solid rgb(var(--primary-6));
  border-radius: 4px;
  margin-top: 16px;
  transition: all 0.3s ease;

  &:hover {
    background: var(--color-fill-3);
    border-left-color: rgb(var(--primary-5));
  }
}

.summary-icon {
  flex-shrink: 0;
  font-size: 18px;
  color: rgb(var(--primary-6));
  margin-top: 2px;
}

.summary-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text-2);
  font-weight: 400;
}

.comment-affix-button {
  position: fixed;
  right: 20px;
  bottom: 20px;
}
</style>
