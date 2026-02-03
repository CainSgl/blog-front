<template>
  <div class="blocked-session-list">
    <div class="session-list-header">
      <h3>已拉黑的会话</h3>
    </div>
    <div class="session-list-content">
      <ChatSessionItem 
        v-for="session in sessions" 
        :key="session.id" 
        :session="session"
        :is-blocked="true"
        @restore="handleRestore"
      />
      <div v-if="sessions.length === 0" class="empty-state">
        <p>暂无拉黑的会话</p>
      </div>
      <div v-if="hasMore" class="load-more">
        <a-button @click="loadMore" :loading="loading">加载更多</a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import ChatSessionItem from './ChatSessionItem.vue';
import api from '@/api';

const sessions = ref([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);
const hasMore = ref(true);

// 加载被拉黑的会话列表
const loadBlockedSessions = async (isLoadMore = false) => {
  if (loading.value) return;
  
  try {
    loading.value = true;
    const { data } = await api.get('/chat/sessions/deleted', {
        page: page.value,
        pageSize: pageSize.value
    });
    
    if (isLoadMore) {
      sessions.value = [...sessions.value, ...data.list];
    } else {
      sessions.value = data.list;
    }
    
    total.value = data.total;
    hasMore.value = sessions.value.length < total.value;
  } catch (error) {
    console.error('加载拉黑会话列表失败:', error);
    Message.error('加载拉黑会话列表失败');
  } finally {
    loading.value = false;
  }
};

// 加载更多
const loadMore = () => {
  page.value++;
  loadBlockedSessions(true);
};

// 恢复会话
const handleRestore = async (sessionId) => {
  try {
    await api.put(`/chat/session/restore?sessionId=${sessionId}`,{});
    Message.success('已恢复该会话');
    
    // 从列表中移除
    sessions.value = sessions.value.filter(s => s.id !== sessionId);
    total.value--;
  } catch (error) {
    console.error('恢复会话失败:', error);
    Message.error('恢复会话失败，请重试');
  }
};

onMounted(() => {
  loadBlockedSessions();
});
</script>

<style scoped lang="less">
.blocked-session-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-bg-1);
  overflow: hidden;

  .session-list-header {
    flex-shrink: 0;
    padding: 16px;
    border-bottom: 1px solid var(--color-border-2);

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-1);
    }
  }

  .session-list-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--color-text-3);
    }

    .load-more {
      padding: 16px;
      text-align: center;
    }
  }
}
</style>
