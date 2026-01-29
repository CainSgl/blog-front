<template>
  <div class="like-messages">
    <div class="messages-header">
      <h2>收到的赞</h2>
    </div>

    <a-tabs v-model:active-key="activeTab" type="line">
      <a-tab-pane key="article" title="文章">
        <LikeArticle />
      </a-tab-pane>
      <a-tab-pane key="comment" title="评论">
        <LikeComment />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import LikeArticle from './like/LikeArticle.vue';
import LikeComment from './like/LikeComment.vue';

const activeTab = ref('article');
</script>

<style scoped lang="less">
.like-messages {
  .messages-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
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
}
</style>
