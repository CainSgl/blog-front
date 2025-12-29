<template>
  <div class="user-knowledge">
    <a-page-header title="知识库" :subtitle="`用户 ${userId} 的知识库`" @back="handleBack">
      <template #extra>
        <a-space>
        
        </a-space>
      </template>
    </a-page-header>

    <div class="content-area" style="margin-top: 20px;">
      <a-card :bordered="false">
        <a-spin :loading="loading" tip="正在加载知识库...">
          <div class="kb-list">
            <KbCard 
              v-for="kb in knowledgeBases" 
              :key="kb.id" 
              :kb-info="kb" 
            />
          </div>
          
          <a-empty v-if="knowledgeBases.length === 0" style="padding: 40px 0;" description="暂无知识库" />
          
          <!-- 分页组件 -->
          <div class="pagination-wrapper" v-if="total > 0">
            <a-pagination
              size="large"
              :total="total"
              :current="currentPage"
              :page-size="pageSize"
              show-total
              show-jumper
              @change="handlePageChange"
            />
          </div>
        </a-spin>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import KbCard from '@/components/kb/KbCard.vue';
import api from '@/api/index.js';
import { useUserStore } from '@/store/user';

const router = useRouter();
const route = useRoute();
// 从路由参数获取用户ID
const userId = ref(route.params.id);

const knowledgeBases = ref([]);
const loading = ref(false);
const total = ref(-1);
const currentPage = ref(1);
const pageSize = ref(12); // 每页显示12个知识库卡片

const loadKnowledgeBases = async (page = 1) => {
  loading.value = true;
  try {
    // 构建请求参数
    const params = {
      page: page,
      size: pageSize.value,
      userId: userId.value,
      simple:total.value>0
    };
    const { data } = await api.post('/kb/list', params);
    knowledgeBases.value = data.records || [];
    total.value = data.total || 0;
    currentPage.value = page;
  } catch (error) {
    console.error('加载知识库列表失败:', error);
    knowledgeBases.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  // 返回到用户主页
  router.push(`/space/${userId.value}`);
};



// 处理分页变化
const handlePageChange = (page) => {
  loadKnowledgeBases(page);
};



// 组件挂载时加载数据
onMounted(() => {
  loadKnowledgeBases(currentPage.value);
});
</script>

<style lang="less" scoped>
.user-knowledge {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;

  .kb-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: flex-start;
    padding: 16px 0;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }

  .content-area {
    min-height: 400px;
  }
}
</style>