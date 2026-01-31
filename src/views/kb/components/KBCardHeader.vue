<template>
  <div :style="{ background: 'var(--color-fill-2)' }">
    <a-page-header :style="{ background: 'var(--color-bg-1)' }" :title="postInfo.title"
      :subtitle="postInfo.version ? '版本：' + postInfo.version : undefined" :show-back="true" @back="handleBack">
      <template #breadcrumb>
        <a-breadcrumb>
          <a-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="item.id"
            :class="{ 'last-item': index === breadcrumbItems.length - 1 }">
            {{ item.name }}
          </a-breadcrumb-item>
        </a-breadcrumb>
      </template>
      <template #extra>
        <div style="display: flex; align-items: center">
          <a-link :href="`/p/${postInfo.id}`" target="_albank" v-if="postInfo.status=='已发布'">
            前往文章页面
          </a-link>

          <a-tooltip v-if="postInfo.status&&isCurrentUser" :content="getStatusTooltip()">
            <component :is="getStatusIcon()" style="cursor: pointer; font-size: 20px;color:var(--color-neutral-10)" size="large" />
          </a-tooltip>

          <span v-if="postInfo.updatedAt" style="color: var(--color-neutral-6); margin-left: 10px; font-size: 15px">
            上次更新时间：{{ formatDate(postInfo.updatedAt) }}
          </span>
        </div>
      </template>
    </a-page-header>
  </div>
</template>

<script setup>
import {computed, ref, watch} from 'vue';
import {useRouter} from 'vue-router';
import {IconFilePdf, IconUserGroup, IconWifi} from '@arco-design/web-vue/es/icon';
import {useUserStore} from '@/store/user.js';
import {formatDate} from '@/utils/DateFormatter.js';

const router = useRouter();

// 定义 props
const props = defineProps({
  postInfo: {
    type: Object,
    required: true,
    default: () => ({})
  },
  kbId: {
    type: [String, Number],
    required: true
  },
  treeData: {
    type: Array,
    default: () => []
  },
  kbInfo: {
    type: Object,
    default: () => ({})
  },
  onBack: {
    type: Function,
    default: null
  },
  showGoPost: {
    type: Boolean,
    default: false,
  }
});

// 定义 emits
const emit = defineEmits(['back']);
const userStore = useUserStore();
const currentUserInfo = ref({})
async function getCurrentUserInfo() {
  currentUserInfo.value =await userStore.getUserInfo();
}

const isCurrentUser = computed(() => {
  return currentUserInfo.value.id == props.kbInfo.userId;
});
// 响应式数据
const breadcrumbItems = ref([
  { id: 'home', name: props.kbInfo?.name || '知识库' }
]);

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
  if (!postId || !props.treeData) {
    console.log('Missing postId or treeData');
    return;
  }

  const result = findNodeByPostId(props.treeData, postId);

  if (result) {
    // 构建面包屑项
    const items = [
      { id: 'home', name: props.kbInfo?.name || '知识库' },
      ...result.path.map(node => ({
        id: node.id,
        name: node.name
      }))
    ];
    breadcrumbItems.value = items;
  }
  else {
    // 如果找不到节点，至少显示知识库名称
    breadcrumbItems.value = [
      { id: 'home', name: props.kbInfo?.name || '知识库' }
    ];
  }
};

// 根据状态获取对应的图标组件
const getStatusIcon = () => {
  if (!props.postInfo.status) return null;

  if (props.postInfo.status === '草稿') {
    return IconFilePdf;
  }
  else if (props.postInfo.status === '已发布') {
    return IconWifi;
  }else if(props.postInfo.status==='仅粉丝')
  {
    return IconUserGroup
  }
  return null;
};

// 获取状态提示信息
const getStatusTooltip = () => {
  if (!props.postInfo.status) return '';

  const statusMap = {
    '草稿': '草稿：互联网的所有人都无法访问你的文章',
    '已发布': '已发布：互联网的所有人都能访问你的文章'
  };

  return statusMap[props.postInfo.status] || props.postInfo.status;
};



// 处理返回事件
const handleBack = () => {
  if (props.onBack) {
    props.onBack();
  }
  else {
    router.push({ name: 'KBIndex', query: { kb: props.kbId } });
  }
  emit('back');
};

// 监听treeData的变化，更新面包屑
watch(
  () => props.treeData,
  (newVal) => {
    if (newVal && newVal.length > 0 && props.postInfo.postId) {
      buildBreadcrumb(props.postInfo.postId);
    }
  },
  { deep: true }
);

// 当 postInfo 变化时，更新面包屑
watch(
  () => props.postInfo,
  (newVal) => {
    if (newVal && newVal.postId && props.treeData) {
      buildBreadcrumb(newVal.postId);
    }
  },
  { immediate: true }
);

// 当 kbInfo 变化时，更新面包屑
watch(
  () => props.kbInfo,
  (newVal) => {
    // 更新面包屑的第一项为知识库名称
    getCurrentUserInfo();
    if (breadcrumbItems.value.length > 0) {
      breadcrumbItems.value[0] = {
        id: 'home',
        name: newVal?.name || '知识库'
      };
    }
    else {
      breadcrumbItems.value = [{
        id: 'home',
        name: newVal?.name || '知识库'
      }];
    }

    // 重新构建完整的面包屑路径
    if (props.postInfo?.postId && props.treeData) {
      buildBreadcrumb(props.postInfo.postId);
    }
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
.last-item {
  font-weight: bold;
  color: rgb(var(--primary-6));
}
</style>