<template>
  <div class="redirect-page">
    <div class="redirect-container">
      <h2>安全跳转提示</h2>
      <p>您即将跳转到外部网站：</p>
      <p class="external-url">{{ decodedUrl }}</p>
      <p>为确保您的安全，我们建议您确认此网站的可信度。</p>
      
      <div class="button-group">
        <a-button @click="cancelRedirect" status="default">取消跳转</a-button>
        <a-button @click="proceedToUrl" type="primary">继续访问</a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {Button as AButton} from '@arco-design/web-vue';

const route = useRoute();
const router = useRouter();
const decodedUrl = ref('');

onMounted(() => 
{
  if (route.query.url) 
  {  
    try 
    {
      // 解码 URL 并验证其格式
      const url = decodeURIComponent(route.query.url);
      const parsedUrl = new URL(url);
      decodedUrl.value = parsedUrl.href;
      document.title='跳转到'+decodedUrl.value

    }
    catch (error) 
    {
      console.error('Invalid URL:', error);
      alert('无效的链接地址');
      router.push('/');
    }
  }
  else 
  {
    router.push('/');
  }
});

const cancelRedirect = () => 
{
  // 关闭当前标签页
  window.close();
  // 如果 window.close() 不起作用（比如不是通过 JavaScript 打开的窗口），则跳转到首页
  setTimeout(() => 
  {
    router.push('/');
  }, 100);
};

const proceedToUrl = () => 
{
  if (decodedUrl.value) 
  {
    // 打开外部链接
    window.open(decodedUrl.value, '_blank', 'noopener,noreferrer');
    // 关闭当前标签页
    window.close();
    // 如果 window.close() 不起作用，则跳转到首页
    setTimeout(() => 
    {
      router.push('/');
    }, 100);
  }
};
</script>

<style scoped>
.redirect-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.redirect-container {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.redirect-container h2 {
  color: #333;
  margin-bottom: 15px;
}

.external-url {
  word-break: break-all;
  color: #007bff;
  font-weight: bold;
  margin: 15px 0;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-family: monospace;
}

.button-group {
  margin-top: 20px;
}

.button-group .arco-btn {
  margin: 0 8px;
}
</style>