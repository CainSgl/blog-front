<template>

  <div class="container">
    <KBList :initialPosts="[]" :load-data="loadKbs" :listenWindowScroll="true"
      :enableAutoLoad="enableAutoLoad"
      hasMoreText="你真是一个博学的人，本站的知识库都被看光了 ヾ(*´∀ ˋ*)ﾉ" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useKbPaginationStore } from './kbPaginationStore.js'

import KBList from '@/components/home/KBList.vue'
import api from '@/api/index.js'

const props = defineProps({
  enableAutoLoad: {
    type: Boolean,
    default: true
  }
})

//这个组件是加载最新的知识库列表用的
const kbPaginationStore = useKbPaginationStore()

const loadKbs = async (pageSize) => {
  if (!props.enableAutoLoad) {
    return []
  }
  pageSize = Math.min(100, pageSize)
  const { data } = await api.post('/kb/cursor', kbPaginationStore.buildRequestParams(pageSize))
  if (data && data.length > 0) {
    const lastItem = data[data.length - 1]
    kbPaginationStore.updatePagination(lastItem)
  }
  return data || []
}
</script>

<style scoped></style>