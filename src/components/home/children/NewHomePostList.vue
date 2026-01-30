<template>
  <div class="container">
    <a-button v-if="hasSavedPosition" type="primary" @click="jumpToLastPosition"
      style="position: fixed; bottom: 80px; right: 40px; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
      回到上次位置
    </a-button>

    <HomePostList :initialPosts=[] :load-data="loadPosts" :listenWindowScroll="true"
      hasMoreText="你真是一个博学的人，本站的文档都被看光了 ヾ(*´∀ ˋ*)ﾉ" />

    <div v-if="!hasMore">
      <div style="height: 200px;"></div>
      <NewKBList></NewKBList>
    </div>
  </div>
</template>

<script setup>
import {onBeforeMount, onMounted, ref} from 'vue';
import HomePostList from '@/components/home/HomePostList.vue';
import NewKBList from '@/components/home/children/NewKBList.vue';
import api from '@/api/index.js';
import {useUserStore} from '@/store/user.js';

const emit = defineEmits(['noData']);
const STORAGE_KEY = 'blog_last_position';

let lastUpdatedAt;
let lastLikeRatio;
let lastId;

const hasSavedPosition = ref(false);
function buildRequestParams(pageSize) {
  const data = { pageSize };
  if (lastUpdatedAt) {
    data.lastUpdatedAt = lastUpdatedAt;
    data.lastLikeRatio = lastLikeRatio;
    data.lastId = lastId;
  }
  return data;
}
const hasMore = ref(true);
const currentUser = ref({})

// 保存位置到 localStorage
function saveLastPosition() {
  if (lastUpdatedAt && lastLikeRatio !== undefined && lastId) {
    const positionData2 = {
      lastUpdatedAt,
      lastLikeRatio,
      lastId,
      userId: currentUser.id
    };
    if(positionData?.lastId==positionData2.lastId)
    {
      hasSavedPosition.value=false;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positionData2));
  }
}
const userStore = useUserStore();
// 从 localStorage 加载位置
let positionData;
function loadLastPosition() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      positionData = JSON.parse(saved);
      console.log(positionData)
      currentUser.value = userStore.getUserInfo();
      hasSavedPosition.value = positionData.userId == currentUser.value.id
    }
  }
  catch (e) {
    console.error('加载上次位置失败:', e);
  }
}

// 跳转到上次位置
async function jumpToLastPosition() {

  lastUpdatedAt = positionData.lastUpdatedAt;
  lastLikeRatio = positionData.lastLikeRatio;
  lastId = positionData.lastId;
  hasSavedPosition.value = false;
  setTimeout(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  }, 10)
}



const loadPosts = async (pageSize) => {
  pageSize = Math.min(100, pageSize);
  const { data } = await api.post('/post/cursor', buildRequestParams(pageSize));
  if (data && data.length > 0) {
    // 保存位置
    saveLastPosition();
    const lastItem = data[data.length - 1];
    lastUpdatedAt = lastItem.updatedAt;
    lastLikeRatio = lastItem.likeRatio;
    lastId = lastItem.id;
  }
  if (data && data.length < pageSize) {
    console.log(pageSize, data.length);
    hasMore.value = false;
    hasSavedPosition.value = false;
    emit('noData');
  }
  return data || [];
};

onBeforeMount(()=>{
 loadLastPosition();
})
onMounted(async () => {
 
});
</script>

<style scoped>
.container {
  padding-left: 20px;
}
</style>
