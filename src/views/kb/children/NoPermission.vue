<template>
  <div class="no-permission-container">
    <div class="no-permission-content">
      <a-result
        class="result"
        status="403"
        title="403"
        subtitle="抱歉，您没有访问此内容的权限"
      >
        <template #extra>
          <a-button type="primary" @click="goBack">返回知识库</a-button>
        </template>
      </a-result>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const goBack = () => {
  const kbId = route.query.kb;
  if (kbId) {
    router.push({ name: 'KBIndex', query: { kb: kbId } });
  } else {
    router.push({ name: 'KB' });
  }
};
</script>

<style scoped>
.no-permission-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.no-permission-content {
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.result {
  padding: 20px 0;
}
</style>