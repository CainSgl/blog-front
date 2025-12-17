<template>
  <div class="knowledge-base">
    <div class="sidebar">
      <TreeMenu 
        :tree-data="treeData"
      />
    </div>
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import TreeMenu from '@/components/TreeMenuNew.vue';

// 模拟数据
const treeData = ref([
  {
    "id": 1,
    "kbId": 1,
    "name": "目录1",
    "sortNum": 1,
    "children":[]
  },
  {
    "id": 2,
    "kbId": 1,
    "name": "目录2",
    "sortNum": 2,
    "children": [
      {
        "id": 3,
        "kbId": 1,
        "parentId": 1,
        "name": "目录3",
        "sortNum": 2,
        "children": [
          {
            "id": 4,
            "kbId": 1,
            "parentId": 4,
            "name": "目录5",
            "sortNum": 2,
            "children":[]
          },
            {
            "id": 7,
            "kbId": 1,
            "parentId": 4,
            "name": "目录6",
            "sortNum": 2,
            "children":[]
          },
          {
            "id": 5,
            "kbId": 1,
            "parentId": 4,
            "name": "文章1",
            "postId": 5,
            "sortNum": 2,
            "children":[]
          },
          {
            "id": 6,
            "kbId": 1,
            "parentId": 4,
            "name": "文章2",
            "postId": 1998966530797060097,
            "sortNum": 3,
            "children":[]
          }
        ]
      }
    ]
  }
]);


</script>

<style scoped lang="less">
.knowledge-base {
  display: flex;
  height: 100%;
  width: 100%;
}

.sidebar {
  width: 600px;
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