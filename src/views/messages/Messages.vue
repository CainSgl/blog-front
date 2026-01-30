<template>
  <Header></Header>
  <div class="header-container"></div>
  <div class="messages-container">

    <div class="messages-content">
      <div class="messages-tabs">
        <a-tabs :active-key="activeTab" @change="handleTabChange" type="line">
          <a-tab-pane v-for="tab in tabs" :key="tab.key" :title="tab.title">
            <template #title>
              <div class="tab-title">
                <a-badge :count="userInfo?.[tab.countKey] || 0" :max-count="99">
                  <div style="padding: 4px 0px 8px 0px">
                    <component :is="tab.icon" size="large" />
                    <span class="tab-text">{{ tab.title }}</span>
                  </div>
                </a-badge>
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
import {computed, onMounted} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useUserStore} from '@/store/user.js';
import {storeToRefs} from 'pinia';
import {IconEmail, IconExclamationCircle, IconHeart, IconMessage} from '@arco-design/web-vue/es/icon';
import Header from '../../components/layout/Header.vue';
import api from '@/api';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);

// 标签页配置
const tabs = [
  {
    key: 'reply',
    title: '回复我的',
    icon: IconMessage,
    countKey: 'msgReplyCount'
  },
  {
    key: 'like',
    title: '收到的赞',
    icon: IconHeart,
    countKey: 'msgLikeCount'
  },
  {
    key: 'message',
    title: '消息',
    icon: IconEmail,
    countKey: 'msgMessageCount'
  },
  {
    key: 'report',
    title: '举报消息',
    icon: IconExclamationCircle,
    countKey: 'msgReportCount'
  }
];

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
const handleTabChange = async (key) => {
  // 清除对应的红点计数
  if (userInfo.value) {
    const tab = tabs.find(t => t.key === key);
    if (tab && userInfo.value[tab.countKey] > 0) {
      // 同步服务器数据
      try {
        const olddata = userInfo.value[tab.countKey]
        api.get('/user/hotInfo/ack', { type: tab.countKey }).then(() => {
          // 更新缓存里的数据
          userStore.setUserInfo(userInfo.value);
        }).catch(() => {
          userInfo.value[tab.countKey] = olddata
        });
        userInfo.value[tab.countKey] = 0;
      } catch (error) {
        console.error('清除消息计数失败:', error);
      }
    }
  }
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

  .tab-text {
    padding: 4px 8px;
    font-size: 14px;
  }

  :deep(.arco-tabs-nav) {
    &::before {
      display: none;
    }
  }
}

.messages-body {
  border-radius: 8px;
  padding: 0px 24px;
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
