<template>
  <Header></Header>
  <div class="header-container"></div>
  <div class="messages-container">
    <div class="messages-header">
      <h1>消息中心</h1>
    </div>
    
    <div class="messages-content">
      <div class="messages-tabs">
        <a-tabs 
          :active-key="activeTab" 
          @change="handleTabChange"
          type="line"
        >
          <a-tab-pane key="reply" title="回复我的">
            <template #title>
              <div class="tab-title">
                <icon-message />
                <span>回复我的</span>
                <a-badge :count="userInfo?.msgReplyCount || 0" :max-count="99" v-if="userInfo?.msgReplyCount" />
              </div>
            </template>
          </a-tab-pane>
          
          <a-tab-pane key="like" title="收到的赞">
            <template #title>
              <div class="tab-title">
                <icon-heart />
                <span>收到的赞</span>
                <a-badge :count="userInfo?.msgLikeCount || 0" :max-count="99" v-if="userInfo?.msgLikeCount" />
              </div>
            </template>
          </a-tab-pane>
          
          <a-tab-pane key="message" title="消息">
            <template #title>
              <div class="tab-title">
                <icon-email />
                <span>消息</span>
                <a-badge :count="userInfo?.msgMessageCount || 0" :max-count="99" v-if="userInfo?.msgMessageCount" />
              </div>
            </template>
          </a-tab-pane>
          
          <a-tab-pane key="report" title="举报消息">
            <template #title>
              <div class="tab-title">
                <icon-exclamation-circle />
                <span>举报消息</span>
                <a-badge :count="userInfo?.msgReportCount || 0" :max-count="99" v-if="userInfo?.msgReportCount" />
              </div>
            </template>
          </a-tab-pane>
        </a-tabs>
      </div>
      
      <div class="messages-body">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user.js';
import { storeToRefs } from 'pinia';
import { IconMessage, IconHeart, IconEmail, IconExclamationCircle } from '@arco-design/web-vue/es/icon';
import Header from '../../components/layout/Header.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);

// 根据路由确定当前激活的标签
const activeTab = computed(() => {
  const path = route.path;
  if (path.includes('/report')) return 'report';
  if (path.includes('/reply')) return 'reply';
  if (path.includes('/like')) return 'like';
  if (path.includes('/message')) return 'message';
  return 'reply';
});

// 处理标签切换
const handleTabChange = (key) => {
  router.push(`/messages/${key}`);
};

onMounted(async () => {
  await userStore.getUserInfo();
  
  // 如果当前路径是 /messages，重定向到 /messages/reply
  if (route.path === '/messages' || route.path === '/messages/') {
    router.replace('/messages/reply');
  }
});
</script>

<style scoped lang="less">
.messages-container {
  min-height: 100vh;
  background-color: @color-bg-2;

}

.messages-header {
  background-color: @color-bg-1;
  padding: 24px 40px;

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: @color-text-1;
  }
}

.messages-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 40px;
}

.messages-tabs {
  background-color: @color-bg-1;
  border-radius: 8px;
  padding: 16px 24px 0;
  margin-bottom: 16px;
  
  .tab-title {
    display: flex;
    align-items: center;
    gap: 8px;
    
    :deep(.arco-badge) {
      margin-left: 4px;
    }
  }
  
  :deep(.arco-tabs-nav) {
    &::before {
      display: none;
    }
  }
}

.messages-body {
  background-color: @color-bg-1;
  border-radius: 8px;
  padding: 24px;
  min-height: 400px;
}

@media (max-width: 768px) {
  .messages-header {
    padding: 16px 20px;
    
    h1 {
      font-size: 20px;
    }
  }
  
  .messages-content {
    padding: 16px 20px;
  }
  
  .messages-tabs {
    padding: 12px 16px 0;
    
    .tab-title {
      span {
        display: none;
      }
    }
  }
  
  .messages-body {
    padding: 16px;
  }
}
</style>
