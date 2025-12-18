<template>
  <div class="knowledge-base">
    <div class="sidebar">
      <TreeMenu 
        :tree-data="treeData"
        :edit="true"
        @clickPost="handleClickPost"
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
function handleClickPost(node) {
  console.log(node)
}
// 模拟数据
const treeData = ref([
  {
    'id': 1,
    'kbId': 1,
    'name': '根目录1',
    'parentId':null,
    'children':[]
  },
  {
    'id': 2,
    'kbId': 1,
    'name': '根目录2',
    'parentId':null,
    'children': [
      {
        'id': 3,
        'kbId': 1,
        'name': '目录3',
        'parentId':2,
        'children': [
          {
            'id': 4,
            'kbId': 1,
            'parentId':3,
            'name': '目录5',
            'children':[]
          },
          {
            'id': 5,
            'kbId': 1,
            'parentId':3,
            'name': '目录6',
            'children':[]
          },
          {
            'id': 6,
            'kbId': 1,
            'parentId':3,
            'name': '目录7',

            'children':[
              {
                'id': 11,
                'kbId': 1,
                'parentId':6,
                'name': '测试文档aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1测试文档aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1测试文档aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1',
                  'postId': 5,
                'children':[]
              },  {
                'id': 12,
                'kbId': 1,
                'parentId':6,
                'name': '测试文档2',
                                  'postId': 5,
                'children':[]
              },
            ]
          },
          {
            'id': 7,
            'kbId': 1,
            'parentId':3,
            'name': '文章2',
            'postId': 1998966530797060097,
            'children':[]
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