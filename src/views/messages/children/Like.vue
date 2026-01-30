<template>
  <div class="like-messages">
    <div class="messages-list" v-if="messages.length > 0">
      <a-divider dashed />
      <MessageItem v-for="message in messages" :key="message.id" :message="message">
        <template #action>
          <div v-if="message.type == 1">
            点赞了你的文章<icon-heart :style="{ color: '#f53f3f', marginRight: '4px' }" />
          </div>
          <div v-if="message.type == 2">
            点赞了你的评论<icon-heart :style="{ color: '#f53f3f', marginRight: '4px' }" />
          </div>
        </template>
        <div v-if="message.postInfo" style="margin-left: auto;">
          <a-link :hoverable="false" :href="`/p/${message.postInfo.id}`" target="_ablank">
            <div v-if="message.postInfo" style="display: flex;">
              <c-img v-if="message.postInfo.img" :src="message.postInfo.img" :alt="message.postInfo.title" width="180px"
                height="120px" fit="cover" :preview="false"></c-img>
              <div class="post-info">
                <div class="post-title">{{ message.postInfo.title }}</div>
                <div class="post-summary" v-if="message.postInfo.summary">
                  {{ message.postInfo.summary }}
                </div>
                <div class="post-stats">
                  <span class="stat-item">
                    <icon-eye size="large" /> {{ message.postInfo.viewCount || 0 }}
                  </span>
                  <span class="stat-item">
                    <icon-heart size="large" /> {{ message.postInfo.likeCount || 0 }}
                  </span>
                  <span class="stat-item">
                    <icon-message size="large" /> {{ message.postInfo.commentCount || 0 }}
                  </span>
                </div>
              </div>
            </div>
          </a-link>
        </div>


      </MessageItem>

      <!-- 加载触发器 -->
      <div ref="loadMoreTrigger" class="load-more-trigger">
        <a-spin v-if="loading" tip="获取更多中" />
        <div v-else-if="!hasMore" class="no-more">没有更多了</div>
      </div>
    </div>

    <a-empty v-else-if="!loading" description="暂无点赞消息" />

    <a-spin v-else :loading="loading" style="display: block;">
      <div style="width: 100%; height: 300px;"></div>
    </a-spin>
  </div>
</template>

<script setup>
import {onMounted, onUnmounted, ref} from 'vue';
import {IconEye, IconHeart, IconMessage} from '@arco-design/web-vue/es/icon';
import MessageItem from '@/components/user/base/MessageItem.vue';
import CImg from '@/components/base/cImg.vue';
import api from '@/api/index';
import {useRouter} from 'vue-router';

const router = useRouter();
const loading = ref(false);
const messages = ref([]);
const after = ref(null);
const size = ref(20);
const hasMore = ref(true);
const loadMoreTrigger = ref(null);
let observer = null;

// 缓存 Map
const postInfoCache = new Map();
const commentInfoCache = new Map();

// 处理点赞文章 (type === 1)
const loadPostInfo = async (msgs) => {
  const postIds = msgs
    .filter(msg => msg.type === 1)
    .map(msg => msg.targetId)
    .filter(id => !postInfoCache.has(id));

  if (postIds.length === 0) return;

  try {
    const ids = postIds.join(',');
    const { data } = await api.get('/post/batch', { ids });
    console.log(data)
    // 更新缓存
    data.forEach(post => {
      postInfoCache.set(post.id, post);
    });

    // 更新消息中的 postInfo
    messages.value.forEach(msg => {
      if (msg.type === 1 && postInfoCache.has(msg.targetId)) {
        msg.postInfo = postInfoCache.get(msg.targetId);
      }
    });
  } catch (error) {
    console.error('加载文章详情失败:', error);
  }
};

// 处理点赞评论 (type === 2)
const loadCommentInfo = async (msgs) => {
  // const commentIds = msgs
  //   .filter(msg => msg.type === 2)
  //   .map(msg => msg.targetId)
  //   .filter(id => !commentInfoCache.has(id));

  // if (commentIds.length === 0) return;

  // try {
  //   const ids = commentIds.join(',');
  //   const { data } = await api.get('/comment/batch', { ids });

  //   // 更新缓存
  //   data.forEach(comment => {
  //     commentInfoCache.set(comment.id, comment);
  //   });

  //   // 更新消息中的 commentInfo
  //   msgs.forEach(msg => {
  //     if (msg.type === 2 && commentInfoCache.has(msg.targetId)) {
  //       msg.commentInfo = commentInfoCache.get(msg.targetId);
  //     }
  //   });
  // } catch (error) {
  //   console.error('加载评论详情失败:', error);
  // }
};

const loadMessages = async () => {
  if (loading.value || !hasMore.value) return;

  loading.value = true;
  try {
    const { data } = await api.get('/user/notice', {
      type: ["点赞文章", "点赞评论"],
      size: size.value,
      after: after.value
    });
    const newMessages = data.records;

    // 先把消息加入列表，立即显示
    messages.value.push(...newMessages);
    hasMore.value = data.hasMore;
    after.value = data.after;

    // 异步加载完整的文章和评论信息
    loadPostInfo(newMessages);
    loadCommentInfo(newMessages);
  } catch (error) {
    console.error('加载消息失败:', error);
  } finally {
    loading.value = false;
  }
};



const setupObserver = () => {
  if (!loadMoreTrigger.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore.value && !loading.value) {
        loadMessages();
      }
    },
    {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    }
  );

  observer.observe(loadMoreTrigger.value);
};

onMounted(() => {
  loadMessages().then(() => {
    setupObserver();
  });
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped lang="less">
.like-messages {
  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .load-more-trigger {
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;

    .no-more {
      color: @color-text-3;
      font-size: 14px;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .post-info {
    color: inherit;
    text-decoration: none;
    margin-left: 12px;

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

    .post-summary {
      color: @color-text-3;
      font-size: 12px;
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .post-stats {
      display: flex;
      gap: 12px;
      color: @color-text-3;
      font-size: 12px;

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
  }
}
</style>
