<template>
  <div class="knowledge-base">
    <div class="sidebar" v-show="!noKb">
      <div class="tree-menu">
        <div class="kb-header">
          <h3>{{ kbInfo.name }}</h3>
        </div>
        <div class="home-node" @click="goToHome">
          <div class="node-content">
            <span class="node-name">
              <IconHome class="action-icon" />
              <span>首页</span>
            </span>
          </div>
        </div>
        <TreeMenu :tree-data="treeData" :edit="true" @clickPost="handleClickPost" :kb-id="kbId" />
      </div>
    </div>
    <div class="content">
      <router-view />
    </div>

    
    <LikeButton 
      :initial-like-count="kbInfo.likeCount" 
      :kb-id="kbId" 
      @like="handleLike" 
      v-if="!noKb" 
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import TreeMenu from '@/components/TreeMenuNew.vue';
import LikeButton from '@/components/LikeButton.vue';
import api from '@/api/index.js';
import { IconHome } from '@arco-design/web-vue/es/icon';
import { useRoute, useRouter } from 'vue-router';



const route = useRoute();
const router = useRouter();
const noKb = ref(false);
const kbInfo = ref({
  name: "获取中...",
  likeCount: 0
})

onMounted(async () => {
  const kbParam = route.query.kb;
  if (kbParam) {
    const kbIdreq = parseInt(kbParam);
    try {
      const { data } = await api.get('/kb', { id: kbIdreq });
      //TODO，现在全部是正确的，后续加隐私设置
      kbId.value = data.first.id;
      kbInfo.value = data.first;
      treeData.value = data.second;
    } catch (error) {
      console.error(error)
      //要么没登陆，要么资源不存在(权限不足也是这个)
      if (error.data.code == "40004") {
        //展示404
        router.push({ name: 'NoKb' });
        noKb.value = true;
      }
    }
  }
  else {
    console.log('没有');
    //重定向到404页面
    router.push({ name: 'NotFound' });
  }
});
const kbId = ref('-1');
function handleClickPost(node) {
   router.push({ name: 'KBEdit', query: { kb: kbId.value,p:node.id } });
}
const treeData = ref([]);

function goToHome() {
  router.push({ name: 'index', query: { kb: kbId.value } });
}

function handleLike(data) {
  console.log('点赞状态:', data);
  // 这里可以添加发送请求到后端保存点赞状态的逻辑
  // 例如：api.post('/kb/like', { kbId: data.kbId, liked: data.liked })
}



</script>

<style scoped lang="less">
.knowledge-base {
  display: flex;
  height: 100vh;
  width: 100%;
}

.sidebar {
  min-width: 290px;
  width: 16%;
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  border-right: 1px solid #e5e6eb;
  overflow: hidden;
}

.tree-menu {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow: auto;
  height: 100vh;
  box-sizing: border-box;
}

.home-node {
  padding: 4px 12px;
  cursor: pointer;
  border-radius: 4px;
  margin: 2px 0;
  transition: all 0.2s ease;
  position: relative;
  border: 2px solid transparent;
  min-height: 24px;
  background-color: #f7f7f7;

  &:hover {
    background-color: #e4e3e3;
  }

  .node-content {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 100%;
    min-height: 24px;

    .node-name {
      flex: 1;
      font-size: 14px;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 8px;
      line-height: 1;
    }
  }
}

.action-icon {
  width: 18px;
  height: 18px;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  align-self: center;
}
</style>