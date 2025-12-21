<template>
  <div style="padding:10px 0px;">
    <div>
      <a-layout-header style="display: flex;justify-content: space-between; align-items: center;">
        <a-breadcrumb>
          <a-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="item.id"
            :class="{ 'last-item': index === breadcrumbItems.length - 1 }">
            {{ item.name }}
          </a-breadcrumb-item>
        </a-breadcrumb>
        <div style="display: flex; align-items: center;margin-right: 10px">
          <a-tooltip v-if="postInfo.status" :content="getStatusTooltip()">
            <component :is="getStatusIcon()" style="cursor: pointer;font-size: 20px;" size="large" />
          </a-tooltip>
          <span v-if="postInfo.updatedAt" style="color: #666; margin-left: 10px; font-size: 15px;">
            上次更新时间：{{ formatUpdateTime(postInfo.updatedAt) }}
          </span>
        </div>
      </a-layout-header>
    </div>
    <div style="height: 100%;">
      <MarkdownEditor v-model="textContent" :height="editorHeight" @go-back="goBack" />
    </div>
  </div>

</template>

<script setup>
import { ref, onMounted, computed, watch, h, onBeforeUnmount } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { Message, Modal } from '@arco-design/web-vue';
import MarkdownEditor from '@/components/MarkdownEditor.vue';
import api from '@/api/index.js';
import { useKbStore } from '../kbStore.js';
import { IconFilePdf, IconWifi } from '@arco-design/web-vue/es/icon';
const route = useRoute();
const router = useRouter();
const kbStore = useKbStore();

// 响应式数据
const textContent = ref('');
const originalContent = ref(''); // 存储原始内容用于比较
const lastAutoSavedContent = ref(''); // 存储上次自动保存的内容
const lastAutoSavedTime = ref(0); // 存储上次自动保存的时间戳
let isAutoSave = false; // 自动保存的定时器（非响应式）
let diff = 0; // 跟踪内容变化是否达到200字
const editorHeight = ref('calc(100vh - 104px)');
const breadcrumbItems = ref([
  { id: 'home', name: kbStore.kbInfo?.name || '知识库' }
]);

// 从store中获取treeData
const treeData = computed(() => kbStore.treeData);
const kbId = computed(() => kbStore.kbId);
const kbInfo = computed(() => kbStore.kbInfo);

// 检查内容是否发生变化
const isContentChanged = computed(() => {
  return textContent.value !== originalContent.value;
});



// 返回函数
const goBack = () => {
  console.log(postInfo.value.content, textContent.value);
  if (postInfo.value.content != textContent.value) {
    Modal.info({
      title: '发布文章',
      content: '是否前往发布页发布你的文章？',
      okText: '确认',
      onOk: () => {
        const postId = route.query.p;
        savePostContent(postId, textContent.value);
        router.push({ name: 'KBCommit', query: { kb: kbId.value, p: postInfo.value.postId } });
      },
      onCancel:()=>{
        router.push({ name: 'KBView', query: { kb: kbId.value, p: postInfo.value.postId } });
      }
    });
    return;
  } else {
    //直接不发布，反正也没修改，回到首页
    router.push({ name: 'KBIndex', query: { kb: kbId.value } });
  }
  //前往提交页面
  // router.push({ name: 'KBCommit', query: { kb: kbId.value, p: postInfo.value.postId } });
};
let saveLock = false;
// 保存文章内容
const savePostContent = async (postId, content, isAuto = false) => {
  if (saveLock) {
    return;
  }
  saveLock = true;

  try {
    Message.loading({
      id: "saveInfo",
      content: "正在保存中...",
      duration: 15000
    });
    await api.put('/post', { id: postId, content, auto: isAuto });
    if (isAuto) {
      let know = localStorage.getItem("autoSave:know")
      Message.success(
        {
          id: "saveInfo",
          content: "保存成功",
          duration: know ? 1500 : 3000,
        });
      if (!know) {
        setTimeout(() => {
          Message.info(
            {
              id: "saveInfo",
              content: "自动保存不会生成历史版本信息哦，该信息只会提醒一次",
              duration: 15000,
              closable: true,
              onClose: () => {
                localStorage.setItem("autoSave:know", true)
              }
            });
        }, 2000)
        localStorage.setItem("autoSave:know", true)
      }
    } else {
      Message.success(
        {
          id: "saveInfo",
          content: "保存成功",
          duration: 2000,
        });
    }
    postInfo.value.updatedAt = Date.now();
    lastAutoSavedTime.value = Date.now()
    // 更新上次自动保存的内容
    lastAutoSavedContent.value = textContent.value;
    // 同时更新原始内容，避免出现未保存提醒
    originalContent.value = textContent.value;
    diff = 0;
    return true;
  } catch (error) {
    console.error('保存文章内容失败:', error);
    Message.error({
      id: "saveInfo",
      content: "保存失败，已存放入本地缓存！",
      duration: 1500
    });
    for (let i = 0; ; i++) {
      let a = localStorage.getItem(`lastPostContentCache:${i}`)
      if (a) {
        continue;
      }
      localStorage.setItem(`lastPostContentCache:${i}`,
        {
          postId: postId,
          content: content,
          time: Date.now()
        }
      );
      break;
    }

    return false;
  } finally {
    saveLock = false;
  }
};

// 显示未保存提醒对话框
const showUnsavedChangesModal = (postName, postId, resolve) => {
  // 用于控制保存按钮的加载状态
  let isLoading = false;

  const modalInstance = Modal.confirm({
    content: `当前"${postName}"内容还未保存，是否保存？`,
    okText: '保存',
    cancelText: '取消',
    onCancel: () => {
      // 取消操作，不跳转
      resolve(false);
    },
    footer: () => [
      h('button', {
        class: `arco-btn arco-btn-primary arco-btn-shape-square arco-btn-size-medium ${isLoading ? 'arco-btn-loading' : 'arco-btn-status-normal'}`,
        onClick: async () => {
          // 防止重复点击
          if (isLoading) return;

          // 设置加载状态
          isLoading = true;
          modalInstance.update({
            footer: () => [
              h('button', {
                class: 'arco-btn arco-btn-primary arco-btn-shape-square arco-btn-size-medium arco-btn-loading',
                disabled: true
              }, '保存中...'),
              h('button', {
                class: ' arco-btn arco-btn-secondary arco-btn-shape-square arco-btn-size-medium arco-btn-status-normal ',
                style: { marginRight: '12px' },
                disabled: true
              }, '取消'),
              h('button', {
                class: 'arco-btn arco-btn-secondary arco-btn-shape-square arco-btn-size-medium arco-btn-status-danger',
                style: { marginRight: '12px' },
                disabled: true
              }, '放弃修改'),
            ]
          });

          // 执行保存操作
          const success = await savePostContent(postId, textContent.value);
          // if (success) {
          //   originalContent.value = textContent.value;
          // }

          // 恢复状态并关闭模态框
          isLoading = false;
          resolve(success);
          modalInstance.close();
        }
      }, isLoading ? '保存中...' : '保存'),
      h('button', {
        class: ' arco-btn arco-btn-secondary arco-btn-shape-square arco-btn-size-medium arco-btn-status-normal ',
        style: { marginRight: '12px' },
        onClick: () => {
          // 取消操作，不跳转
          resolve(false);
          modalInstance.close();
        }
      }, '取消'),
      h('button', {
        class: 'arco-btn arco-btn-secondary arco-btn-shape-square arco-btn-size-medium arco-btn-status-danger',
        style: { marginRight: '12px' },
        onClick: () => {
          // 放弃修改，直接跳转
          //   textContent.value = originalContent.value;
          resolve(true);
          modalInstance.close();
        }
      }, '放弃修改'),
    ]
  });
};

// 监听treeData的变化
watch(treeData, (newVal) => {
  if (newVal && newVal.length > 0) {
    const postId = route.query.p;
    if (postId) {
      buildBreadcrumb(postId);
    }
  }
}, { deep: true });

// 监听文本内容变化，当变化达到200字时设置标志为true
watch(textContent, (newVal, oldVal) => {
  if (saveLock) {
    return
  }
  diff++;
  diff += Math.abs(newVal.length - oldVal.length);
});

// 自动保存定时器引用
let autoSaveInterval = null;

// 自动保存函数
const autoSave = async () => {
  if (isAutoSave || saveLock) {
    return;
  }

  isAutoSave = true;

  const currentTime = Date.now();
  if ((currentTime - lastAutoSavedTime.value > 40000 && diff > 200) || (currentTime - lastAutoSavedTime.value > 10000 && diff > 1000)) {
    const postId = route.query.p;
    if (postId) {
      // 自动保存
      await savePostContent(postId, textContent.value, true);

    }
  }

  isAutoSave = false;
};

// 启动自动保存定时器
const startAutoSave = () => {
  // 先清理可能存在的旧定时器
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }

  // 每5秒检查一次是否需要自动保存
  autoSaveInterval = setInterval(autoSave, 1000);
};

// 停止自动保存定时器
const stopAutoSave = () => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
};

// 用于跟踪是否正在恢复路由，防止无限循环
let isRestoringRoute = false;

// 监听路由参数变化
watch(
  () => route.query.p,
  async (newPostId, oldPostId) => {
    // 如果正在恢复路由，则不执行检查
    if (isRestoringRoute) {
      return;
    }
    isRestoringRoute = true;
    if (newPostId && newPostId !== oldPostId) {
      // 检查是否有未保存的更改
      if (isContentChanged.value) {
        let currentPostName = '文章';
        const currentResult = findNodeByPostId(treeData.value, oldPostId);
        if (currentResult && currentResult.node) {
          currentPostName = currentResult.node.name || '文章';
        }
        const shouldContinue = await new Promise((resolve) => {
          showUnsavedChangesModal(currentPostName, oldPostId, resolve);
        });
        if (shouldContinue) {
          console.log("用户放弃或已经保存了")
        }
      }
    }
    loadPostContent(newPostId);
    buildBreadcrumb(newPostId);
    isRestoringRoute = false;
  }
);

// 处理键盘事件
const handleKeyDown = (event) => {
  // 检查是否按下了Ctrl+S或Cmd+S (Mac)
  if (originalContent.value !== textContent.value) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault(); // 阻止浏览器默认的保存页面行为
      const postId = route.query.p;
      if (postId && textContent.value.trim()) { 
        savePostContent(postId, textContent.value, false); // 手动保存
      }
    }
  }

};

// 组件挂载时的逻辑（如果需要）
onMounted(() => {
  const postId = route.query.p;
  console.log('Post ID from route:', postId, 'type:', typeof postId);
  if (postId) {
    // 先加载文章内容
    loadPostContent(postId);

    // 如果treeData已经存在，则构建面包屑
    if (treeData.value && treeData.value.length > 0) {
      buildBreadcrumb(postId);
    }
  }

  // 初始化上次自动保存的内容和时间 
  lastAutoSavedContent.value = textContent.value;
  lastAutoSavedTime.value = Date.now();

  // 启动自动保存定时器
  startAutoSave();

  // 添加键盘事件监听器
  document.addEventListener('keydown', handleKeyDown);
});

// 组件卸载前清理定时器
onBeforeUnmount(() => {
  // 停止自动保存定时器
  stopAutoSave();

  // 移除键盘事件监听器
  document.removeEventListener('keydown', handleKeyDown);
});

// 路由离开前的守卫
onBeforeRouteLeave(async (to, from) => {
  // 检查是否有未保存的更改
  if (isContentChanged.value&&!saveLock) {
    // 获取当前文章名称
    let currentPostName = '文章';
    const postId = route.query.p;
    if (postId) {
      const result = findNodeByPostId(treeData.value, postId);
      if (result && result.node) {
        currentPostName = result.node.name || '文章';
      }
    }

    // 显示未保存提醒对话框
    const shouldContinue = await new Promise((resolve) => {
      showUnsavedChangesModal(currentPostName, postId, resolve);
    });

    // 如果用户选择取消，则阻止路由跳转
    if (!shouldContinue) {
      return false;
    }
  }
});

// 根据postId在树形结构中查找节点
const findNodeByPostId = (nodes, postId) => {
  if (!Array.isArray(nodes)) return null;

  // 确保postId是字符串类型
  const targetPostId = String(postId);

  for (const node of nodes) {
    // 确保node.postId也是字符串类型进行比较
    if (String(node.postId) === targetPostId) {
      return { node, path: [node] };
    }

    // 递归查找子节点
    if (node.children && node.children.length > 0) {
      const result = findNodeByPostId(node.children, postId);
      if (result) {
        // 将当前节点添加到路径开头
        result.path.unshift(node);
        return result;
      }
    }
  }

  return null;
};

// 构建面包屑路径
const buildBreadcrumb = (postId) => {
  if (!postId || !treeData.value) {
    console.log('Missing postId or treeData');
    return;
  }

  const result = findNodeByPostId(treeData.value, postId);

  if (result) {
    // 构建面包屑项
    const items = [
      { id: 'home', name: kbStore.kbInfo?.name || '知识库' },
      ...result.path.map(node => ({
        id: node.id,
        name: node.name
      }))
    ];
    breadcrumbItems.value = items;
  } else {
    // 如果找不到节点，至少显示知识库名称
    breadcrumbItems.value = [
      { id: 'home', name: kbStore.kbInfo?.name || '知识库' }
    ];
  }
};

const postInfo = ref({})

// 根据状态获取对应的图标组件
const getStatusIcon = () => {
  if (!postInfo.value.status) return null;

  if (postInfo.value.status === '草稿') {
    return IconFilePdf;
  } else if (postInfo.value.status === '已发布') {
    return IconWifi;
  }
  return null;
};

// 获取状态提示信息
const getStatusTooltip = () => {
  if (!postInfo.value.status) return '';

  const statusMap = {
    '草稿': '草稿：互联网的所有人都无法访问你的文章',
    '已发布': '已发布：互联网的所有人都能访问你的文章'
  };

  return statusMap[postInfo.value.status] || postInfo.value.status;
};

// 格式化更新时间
const formatUpdateTime = (time) => {
  if (!time) return '';

  // 假设time是时间戳或可被Date解析的字符串
  const date = new Date(time);
  const now = new Date();

  // 如果是今天，显示时:分
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  // 如果是今年，显示月-日 时:分
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 其他情况显示年-月-日 时:分
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const loadPostContent = async (postId) => {
  // 获取文章名称用于加载提示
  let postName = '文章';
  const result = findNodeByPostId(treeData.value, postId);
  if (result && result.node) {
    postName = result.node.name || '文章';
  }

  // 显示加载提示
  const loadingMsg = Message.loading(`正在加载${postName}...`, 0);

  try {
    saveLock = true
    const { data } = await api.get(`/post`, { id: postId });
    textContent.value = data.content || '';
    originalContent.value = data.content || ''; // 保存原始内容
    lastAutoSavedContent.value = data.content || ''; // 更新上次自动保存的内容
    saveLock = false;

    postInfo.value = data;
    // 添加调试信息以验证数据结构
    console.log('Post Info:', data);
    lastAutoSavedTime.value = Date.now(); // 更新上次自动保存的时间
    diff = 0;
  } catch (error) {
    console.error('加载文章内容失败:', error);
    Message.error(`加载${postName}失败`);
  } finally {
    // 关闭加载提示
    loadingMsg.close();
  }
};
</script>

<style scoped>
.last-item {
  font-weight: bold;
  color: #165DFF;
}

/* 未保存提醒模态框样式 */
.unsaved-changes-modal .arco-modal-footer {
  text-align: left;
}

.unsaved-changes-modal .arco-modal-footer button {
  margin-right: 10px;
}
</style>