<template>
  <Header></Header>
  <div class="header-container"></div>
  <div class="announcement-page">

    <div class="announcement-container">
      <a-spin :loading="loading" class="loading-spinner" style="display: block;">
        <div v-if="!loading && announcement" class="announcement-detail">
          <!-- 公告头部 -->
          <div class="announcement-header">
            <h1 class="announcement-title">{{ announcement.title }}</h1>
            <div class="announcement-meta">
              <span class="announcement-date">{{ formatDate(announcement.createdAt) }}</span>
              <div class="announcement-tags" v-if="announcement.tags && announcement.tags.length">
                <a-tag v-for="tag in announcement.tags" :key="tag" color="arcoblue">{{ tag }}</a-tag>
              </div>
            </div>
          </div>

          <!-- 公告内容 -->
          <div class="announcement-content">
            <MarkdownPreviewWrapper :tocDefaultShow="false" :content="announcement.content" :showComment="true"
              :showToc="true" :useWindowScroll="true" />
          </div>

          <!-- 评论区 -->
          <a-divider dashed ref="commentDividerRef" />
          <CommentList :noCommentsText="'看来大家都没什么意见'" :commentCountText="'留下你宝贵的意见吧'" :version="version" :postId="announcement.id"
            :postCount="announcement.commentCount" />
        </div>
      
        <a-empty v-if="!loading && !announcement" description="公告不存在" />
      </a-spin>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {useRoute} from 'vue-router';
import MarkdownPreviewWrapper from '@/components/md/MarkdownPreviewWrapper.vue';
import CommentList from '@/components/post/children/CommentList.vue';
import {useCommentStore} from '@/components/comment/commentStore.js';
import api from '@/api/index';
import Header from '@/components/layout/Header.vue';
import {formatDate} from '@/utils/DateFormatter.js';

const route = useRoute();
const commentStore = useCommentStore();
const announcement = ref(null);
const loading = ref(true);
const version = ref();
const commentDividerRef = ref(null);

onMounted(async () => {
  await fetchAnnouncement();
});

const fetchAnnouncement = async () => {
  try {
    loading.value = true;
    const id = route.params.id;
    const { data } = await api.get(`/system/announcement/content`, { id });
    announcement.value = data;
    document.title='公告-'+data.title
    // 获取版本号和段评数据
    version.value = data.version;

    // 获取段评统计数据
    if (data.id && data.version) {
      commentStore.getParagraphCommentCountByPost(data.id, data.version);
    }
  }
  catch (error) {
    console.error('获取公告失败:', error);
  }
  finally {
    loading.value = false;
  }
};


</script>

<style lang="less" scoped>
.announcement-page {
  width: 100%;
  min-height: 100vh;
  background: @color-fill-1;
  padding: @size-5;
}

.announcement-container {
  max-width: 1200px;
  margin: 0 auto;
  background: @color-bg-white;
  border-radius: @size-3;
  box-shadow: 0 2px 12px fade(#000, 8%);
  overflow: hidden;
}

.loading-spinner {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.announcement-detail {
  padding: 40px;
}

.announcement-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: @border-1 solid @color-border-2;
}

.announcement-title {
  font-size: 32px;
  font-weight: @font-weight-700;
  color: @color-text-1;
  margin: 0 0 @size-4 0;
  line-height: 1.4;
}

.announcement-meta {
  display: flex;
  align-items: center;
  gap: @size-4;
  flex-wrap: wrap;
}

.announcement-date {
  font-size: @font-size-body-3;
  color: @color-text-4;
}

.announcement-tags {
  display: flex;
  gap: @size-2;
  flex-wrap: wrap;
}

.announcement-content {
  min-height: 400px;
}

@media (max-width: 768px) {
  .announcement-page {
    padding: @size-3;
  }

  .announcement-detail {
    padding: @size-5;
  }

  .announcement-title {
    font-size: 24px;
  }
}
</style>
