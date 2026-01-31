import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api/index.js';

export const useKbStore = defineStore('kb', () => {
  // 知识库信息状态
  const treeData = ref([]);
  const kbId = ref('');
  const kbInfo = ref({
    name: '',
    likeCount: 0,
    title: '',
    coverUrl: '',
    status: '草稿'
  });
  const postInfo = ref({
    postId: '',
    content: ''
  });
  const hasStar = ref(false);
  // 用于共享获取 kbInfo 的 Promise
  let kbInfoPromise = null;

  // 设置树形数据
  const setTreeData = (data) => {
    treeData.value = data;
  };

  // 设置知识库信息
  const setKbInfo = (info) => {
    if (info.name) {
      document.title = info.name + '-知识库'
    }
    kbInfo.value = info;
  };

  // 设置知识库ID
  const setKbId = (id) => {
    kbId.value = id;
  };

  // 设置提交信息
  const setCommitInfo = (postInfoData, newContent) => {
    postInfo.value = {
      ...postInfoData,
      newContent
    };
  };

  // 获取提交数据的便捷方法
  const getCommitData = () => {
    return postInfo.value;
  };

  // 清除提交数据
  const clearCommitData = () => {
    postInfo.value = {
      postId: '',
      content: '',
    };
  };

  // 异步获取知识库信息
  const getKbInfo = async (kbParam) => {
    // 如果已经有缓存的信息，直接返回
    if (kbInfo.value && kbInfo.value.id) {
      return kbInfo.value;
    }

    // 如果没有提供 kb 参数且当前 store 中没有 kbId，返回 null
    if (!kbParam && !kbId.value) {
      return null;
    }

    const kbIdToUse = kbParam || kbId.value;

    // 如果已经有请求在进行中，直接返回同一个 Promise
    if (kbInfoPromise) {
      return kbInfoPromise;
    }

    // 否则创建一个新的请求 Promise
    kbInfoPromise = api.get('/post/kb', { id: kbIdToUse })
      .then(response => {
        // 更新 store 中的信息
        if (response.data && response.data.first) {
          kbInfo.value = response.data.first;
          setTreeData(response.data.second);
          setKbId(response.data.first.id);
          hasStar.value = response.data.third;
        }
        return response.data.first;
      });

    return kbInfoPromise;
  };

  // 重置 store 状态
  const reset = () => {
    treeData.value = [];
    kbId.value = '';
    kbInfo.value = {
      name: '获取中...',
      likeCount: 0,
      title: '',
      coverUrl: ''
    };
    clearCommitData();
  };

  return {
    treeData,
    kbId,
    kbInfo,
    postInfo,
    hasStar,
    setTreeData,
    setKbInfo,
    setKbId,
    setCommitInfo,
    getCommitData,
    clearCommitData,
    getKbInfo,
    reset,
  };
});