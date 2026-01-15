<template>
  <div class="post-history" v-if="postId && historyList && historyList.length > 0">
    <a-collapse :default-active-key="['1', 2]" class="history-collapse">
      <a-collapse-item header=" 历史版本" key="1">
        <div style="max-width: 250px;width: 14dvw;">
          <span class="history-limit-hint">至多显示9条记录</span>
          <a-timeline>
            <a-timeline-item v-for="(item, index) in historyList" :key="item.id"
                             :label="formatDate(item.createdAt, '更改')">
              <div class="history-item" @click="handleHistoryItemClick(item)"
                   :class="item.id === showVersionId ? 'select-history-item' : ''">
                <div class="version-info" v-if="!item.publishVersion"> 版本：v{{ item.version }}</div>
                <div class="version-info" v-else> 发布版本</div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </div>
      </a-collapse-item>
    </a-collapse>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted, watch } from 'vue';
import { formatDate } from '@/utils/DateFormatter.js';
import api from '@/api/index.js';

const props = defineProps({
  postId: {
    type: String,
    required: true
  },
  post: {
    type: Object,
    default: {}
  }
});
const showVersionId = ref(0);
const emit = defineEmits(['historyItemClick']);

const historyList = ref([]);


const fetchHistoryData = async () =>
{
  console.log(props.postId);
  if (!props.postId)
  {
    return;
  }
  const { data } = await api.post('/post/history', { id: props.postId });
  data.unshift({
    id: 0,
    createdAt: props.post.publishedAt,
    version: props.post.version,
    publishVersion: true
  });
  historyList.value = data;

};

// 监听 postId 变化，重新获取数据
watch(() => props.postId, (newPostId) =>
{
  if (newPostId)
  {
    fetchHistoryData();
  }
  else
  {
    historyList.value = [];
  }
}, { immediate: true });

// 处理历史记录点击事件
const handleHistoryItemClick = (item) =>
{
  if (item.publishVersion)
  {
    switchOriginVersion();
    return;
  }
  if (showVersionId.value === item.id)
  {
    //切换到原来的版本
    switchOriginVersion();
    return;
  }
  //下面这个是切换到原来的version
  switchOtherVersion(item);
};
function switchOriginVersion()
{
  showVersionId.value = 0;
  emit('historyItemClick', { publishVersion: true });
}
function switchOtherVersion(item)
{
  showVersionId.value = item.id;
  emit('historyItemClick', item);
}

</script>

<style scoped lang="less">
.history-collapse {

  @media screen and (min-width: 1250px) {
    width: 250px;
  }

}

.post-history {
  margin-right:10px;
  margin-left: 10px;
  .history-limit-hint {
    font-size: 12px;
    color: #6e7781;
    font-weight: normal;

  }

  .history-item {
    max-width: 100px;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border: 1px solid transparent;
    display: flex;
    align-items: center;

    &:hover {
      background-color: #f6f8fa;
      border-color: #d0d7de;
    }

    &:active {
      background-color: #eaecef;
    }
  }

  .select-history-item {
    background-color: #f6f8fa;
    border-color: #d0d7de;
  }

  .version-info {
    font-family: monospace;
    user-select: none;
    font-size: 14px;
    color: #0969da;
    font-weight: 500;
  }
}
</style>