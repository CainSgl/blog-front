<template>
  <div class="knowledge-base">
    <div class="sidebar">
      <div class="kb-header">
        <h3>{{ kbName }}</h3>
      </div>
      <TreeMenu 
        :tree-data="treeData"
        :edit="true"
        @clickPost="handleClickPost"
        :kb-id="kbId"
      />
    </div>




    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import TreeMenu from '@/components/TreeMenuNew.vue';
import api from '@/api/index.js';
import { useRoute } from 'vue-router';


const route = useRoute();
onMounted(async ()=>
{
  const kbParam = route.query.kb;
  if (kbParam) 
  {
    const kbIdreq = parseInt(kbParam);
   
    const {data}= await api.get('/kb',{id:kbIdreq});
    console.log('知识库ID',kbIdreq,data);
    //TODO，现在全部是正确的，后续加隐私设置
    kbId.value=data.first.id;
    kbName.value=data.first.name;
    treeData.value=data.second;
  }

});
const kbName=ref('');
const kbId=ref('-1');
function handleClickPost(node) 
{
  console.log('点击了');
}
const treeData = ref([]);



</script>

<style scoped lang="less">
.knowledge-base {
  display: flex;
  height: 100%;
  width: 100%;
}

.sidebar {
  width: 300px;
  border-right: 1px solid #e5e6eb;
  padding: 20px;
  overflow-y: auto;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>