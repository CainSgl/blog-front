<template>
  <div class="tree-menu" @mousemove="handleMouseMove" @mouseup="handleMouseUp" @mouseleave="handleMouseLeave">
    <!-- 搜索框 -->
    <div class="search-container">
      <Input v-model="searchText" placeholder="找不到？搜索一下吧..." allow-clear @input="handleSearch">
        <template #prefix>
          <IconSearch />
        </template>
      </Input>

      <!-- 搜索框右侧操作图标 -->
      <div class="search-actions" v-if="edit">
        <Dropdown trigger="hover" placement="bottom"
          :popup-visible="menuState.openNodeId === 'search' && menuState.openMenuType === 'add'"
          @select="(key) => handleMenuSelect(key, null)" @popup-visible-change="(visible) => {
            if (visible) {
              menuState.openNodeId = 'search';
              menuState.openMenuType = 'add';
            } else if (menuState.openNodeId === 'search' && menuState.openMenuType === 'add') {
              menuState.openNodeId = null;
              menuState.openMenuType = null;
            }
          }" position="bl">
          <IconPlus class="action-icon" @click.stop @mousedown.stop />
          <template #content>
            <Menu>
              <Menu.Item v-for="item in addDropdownMenuItem" :key="item.handler"
                @click="() => slectHandler(item.handler, null, 'add')">
                <component :is="item.icon" class="menu-icon" style="color:var(--color-neutral-9)" />
                {{ item.text }}
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </div>
    </div>
    <TransitionGroup name="node-list" tag="div" style="height:100%;overflow: auto" class="menu-nodes-list">
      <div v-for="(node, index) in flatNodes" :key="node.id" class="tree-node" :class="getNodeClasses(node, index)"
        :style="{ marginLeft: `${node.depth * 20}px` }" @mousedown="handleMouseDown($event, node, index)">
        <div class="node-content" :class="{ editing: node.isEditing }">
          <span class="expand-icon" :class="{ expanded: getNodeExpandedState(node) }">
            <IconDown v-if="getNodeExpandedState(node)" />
            <IconRight v-else-if="node.children && node.children.length > 0" />
            <IconFile v-else-if="node.postId" />
          </span>

          <template v-if="!node.isEditing">
            <span class="node-name">{{ node.name || '未命名' }}</span>
          </template>
          <Input v-else v-model="node.editingName" class="rename-input" @blur="() => finishRename(node)"
            @keyup.enter="() => finishRename(node)" @keyup.esc="() => cancelRename(node)" @mousedown.stop @click.stop
            autofocus />

          <!-- 右侧操作图标-->
          <div class="node-actions"
            :class="{ 'show-actions': menuState.openNodeId === node.id && (menuState.openMenuType === 'add' || menuState.openMenuType === 'more') }"
            v-show="!dragState.isDragging && !node.isEditing && (edit || (menuState.openNodeId === node.id && (menuState.openMenuType === 'add' || menuState.openMenuType === 'more')))">
            <!-- 这个是增加按钮 -->
            <Dropdown trigger="hover" placement="bottom"
              :popup-visible="menuState.openNodeId === node.id && menuState.openMenuType === 'add'"
              @select="(key) => handleMenuSelect(key, node)"
              @popup-visible-change="(visible) => handleAddMenuToggle(visible, node)" v-if="!node.postId" position="br">
              <IconPlus class="action-icon" @click.stop @mousedown.stop />
              <template #content>
                <Menu>
                  <Menu.Item v-for="item in addDropdownMenuItem" :key="item.handler"
                    @click="() => slectHandler(item.handler, node, 'add')">
                    <component :is="item.icon" class="menu-icon" style="color:var(--color-neutral-9)" />
                    {{ item.text }}
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
            <!-- 这个是更多按钮 -->
            <Dropdown trigger="hover" placement="bottom"
              :popup-visible="menuState.openNodeId === node.id && menuState.openMenuType === 'more'"
              @select="(value) => handleMoreActions(value, node)"
              @popup-visible-change="(visible) => handleMoreMenuToggle(visible, node)" position="bl"
              :popup-max-height="false">
              <IconMore class="action-icon" @click.stop @mousedown.stop />
              <template #content>
                <Menu>
                  <Menu.Item v-for="item in moreDropdownMenuItem" :key="item.handler" :style="item.style"
                    v-show="!(item.needPost && !node.postId)" @click="() => slectHandler(item.handler, node, 'more')">
                    <component :is="item.icon" class="menu-icon" style="color:var(--color-neutral-9)" /> {{ item.text }}
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </div>
        </div>

        <!-- 拖拽预览指示器 -->
        <div v-if="dragState.isDragging && dragState.targetIndex === index" class="drag-indicator"
          :class="`indicator-${dragState.dropType}`" :style="{ paddingLeft: `${(node.depth)}px` }">
          <div class="indicator-line"></div>
        </div>
      </div>
    </TransitionGroup>
    <!-- 拖拽阴影元素 -->
    <div v-if="dragState.isDragging && dragState.draggingElement" class="dragging-shadow" :style="{
      left: dragState.shadowPosition.x + 'px',
      top: dragState.shadowPosition.y + 'px',
      width: dragState.shadowWidth + 'px'
    }">
      <div class="node-content" :style="{ paddingLeft: `${dragState.sourceNode?.depth * 20 || 0}px` }">
        <span v-if="dragState.sourceNode?.children && dragState.sourceNode.children.length > 0" class="expand-icon">
          <IconRight />
        </span>
        <span v-else-if="dragState.sourceNode?.postId" class="expand-icon">
          <IconFile />
        </span>

        <!-- <span v-else class="expand-icon-placeholder">•</span> -->
        <span class="node-name">{{ dragState.sourceNode?.name }}</span>
      </div>
    </div>
    <!-- 加载状态指示器 -->
    <div v-if="loading > 0" class="loading-container">
      <Spin :tip="loadingTip">
        <template #icon>
          <IconSync />
        </template>
      </Spin>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IconCopy,
  IconDelete,
  IconDown,
  IconDriveFile,
  IconEdit,
  IconEye,
  IconFile,
  IconFolder,
  IconImport,
  IconLaunch,
  IconMore,
  IconPen,
  IconPlus,
  IconRight,
  IconSearch,
  IconSync
} from '@arco-design/web-vue/es/icon';
import { Dropdown, Input, Menu, Message, Spin } from '@arco-design/web-vue';
import api from '@/api/index.js';

const moreDropdownMenuItem = [
  {

    text: '重命名',
    handler: 'rename',
    icon: IconEdit,
    needPost: false,
    style: {}
  },
  {

    text: '查看文档',
    handler: 'view-doc',
    icon: IconEye,
    needPost: true,
    style: {}
  },
  {

    text: '编辑文档',
    handler: 'edit-doc',
    icon: IconPen,
    needPost: true,
    style: {}
  },
  {

    text: '复制链接',
    handler: 'copy-link',
    icon: IconCopy,
    needPost: true,
    style: {}
  },
  {

    text: '在新标签页打开',
    handler: 'open-new-tab',
    icon: IconLaunch,
    needPost: true,
    style: {}
  },
  {

    text: '删除',
    handler: 'delete',
    icon: IconDelete,
    needPost: false,
    style: { color: 'rgb(var(--red-6))' }
  }
]
const addDropdownMenuItem = [
  {
    text: '文档',
    handler: 'newPost',
    icon: IconDriveFile
  },
  {
    key: 'import',
    text: '导入',
    handler: 'import',
    icon: IconImport,
  },
  {
    key: 'newDir',
    text: '目录',
    handler: 'newDir',
    icon: IconFolder,
  }
]




const props = defineProps({
  treeData: {
    type: Array,
    required: true
  },
  edit: {
    type: Boolean,
    default: false
  },
  kbId: {
    type: String,
    default: '-1',
  }
});

const emit = defineEmits(['clickPost', 'trigger']);

// 初始化路由
const router = useRouter();


const loading = ref(0);
const loadingTip = computed(() => {
  if (loading.value === 1) {
    return '正在拼命同步修改中...';
  }
  return `正在拼命同步修改中,前方还有${loading.value - 1}个命令正在发送...`;
});
// 创建操作锁，防止并发操作
const operationLock = ref(false);
const pendingOperations = [];

// 优化的锁定操作函数 - 使用队列而非轮询
async function withLock(operation) {
  return new Promise((resolve, reject) => {
    const execute = async () => {
      operationLock.value = true;
      try {
        await operation();
        resolve();
      }
      catch (error) {
        reject(error);
      }
      finally {
        operationLock.value = false;
        // 执行下一个待处理的操作
        const next = pendingOperations.shift();
        if (next) next();
      }
    };

    if (!operationLock.value) {
      execute();
    }
    else {
      pendingOperations.push(execute);
    }
  });
}

// 重命名相关
function startRename(node) {
  node.isEditing = true;
  node.editingName = node.name;
}

function cancelRename(node) {
  node.isEditing = false;
  node.editingName = '';
}

async function finishRename(node) {
  const newName = node.editingName?.trim();

  if (!newName || newName === node.name) {
    cancelRename(node);
    return;
  }

  loading.value += 1;
  try {
    const id = 'rename' + node.id
    Message.loading({ id: id, content: '重命名' + node.name + '中' });
    node.name = newName;
    node.isEditing = false;
    await api.put('/dir', {
      id: node.id,
      kbId: props.kbId,
      name: newName,
      parentId: node.parentId || null,
    });
    Message.success({ id: id, content: '重命名成功' });
  }
  catch (error) {
    console.error('重命名目录失败:', error);
    Message.error('重命名失败');
  }
  finally {
    loading.value -= 1;

    node.editingName = '';
  }
}


// 创建操作处理函数映射对象
const actionHandlers = {
  'newPost': async (node) => {
    loading.value += 1;
    try {
      const parentId = node?.id || null;
      const docName = node ? `${node.name}下的文档` : '未命名文档';

      const { data } = await api.post('/post', {
        title: docName,
        kbId: props.kbId,
        parentId,
      });

      const newNode = {
        id: data.dirId,
        name: docName,
        parentId,
        postId: data.post.id,
        depth: node ? node.depth + 1 : 0,
        children: []
      };

      addChildNode(node, newNode);

      router.push({
        name: 'KBEdit',
        query: { p: data.post.id, kb: props.kbId }
      });
    }
    catch (error) {
      console.error('创建文档失败:', error);
      Message.error('创建文档失败');
    }
    finally {
      loading.value -= 1;
    }
  },
  'newDir': async (node) => {
    loading.value += 1;
    try {
      const parentId = node?.id || null;
      const dirName = node ? `${node.depth + 1}级目录` : '根目录';

      const { data } = await api.post('/dir', {
        name: dirName,
        kbId: props.kbId,
        parentId,
      });

      const newNode = {
        id: data,
        name: dirName,
        parentId,
        depth: node ? node.depth + 1 : 0,
        children: []
      };

      addChildNode(node, newNode);
    }
    catch (error) {
      console.error('创建目录失败:', error);
      Message.error('创建目录失败');
    }
    finally {
      loading.value -= 1;
    }
  },
  'import': (node) => {
    //后面再做 TODO
  },
  'rename': (node) => {
    startRename(node);
  },
  'view-doc': (node) => {
    if (node.postId) {
      router.push({
        name: 'KBView',
        query: { p: node.postId, kb: props.kbId }
      });
    }
  },
  'edit-doc': (node) => {
    if (node.postId) {
      router.push({
        name: 'KBEdit',
        query: { p: node.postId, kb: props.kbId }
      });
    }
  },
  'copy-link': (node) => {
    if (node.postId) {
      const link = `${window.location.origin}/kb?p=${node.postId}&kb=${props.kbId}`;
      navigator.clipboard.writeText(link).then(() => {
        Message.success('链接已复制到剪贴板');
      }).catch(() => {
        Message.error('复制失败');
      });
    }
  },
  'pin-top': async (node) => {
    loading.value += 1;
    try {
      let postId = null;
      if (node.postId) {
        postId = node.postId;
      }
      const { data } = await api.put('/post', {
        id: node.postId,
        isTop: true,
      });
    }
    catch (error) {
      console.error('置顶文档失败:', error);
    }
    finally {
      loading.value -= 1;
    }

  },
  'open-new-tab': (node) => {
    if (node.postId) {
      const pageName = router.currentRoute.value.name === 'KBIndex' ? 'KBView' : router.currentRoute.value.name;
      const routeData = router.resolve({
        name: pageName,
        query: { p: node.postId, kb: props.kbId }
      });
      window.open(routeData.href, '_blank');
    }
  },
  'delete': async (node) => {
    loading.value += 1;
    try {
      const { data } = await api.delete('/dir', {
        kbId: props.kbId,
        dirId: node.id
      });

      if (data > 0) {
        const message = node.postId
          ? `${node.name}将移入回收站，若需要完全删除，请在个人空间操作。`
          : `${node.name}目录下的${data}个文章已自动移入回收站列表，可在个人空间查看。`;
        Message[node.postId ? 'success' : 'warning'](message);
      }

      removeNode(node);
    }
    catch (error) {
      console.error('删除目录失败:', error);
      Message.error('删除失败');
    }
    finally {
      loading.value -= 1;
    }
  }
};

// 添加子节点
function addChildNode(parentNode, childNode) {
  withLock(() => {
    if (!parentNode) {
      flatNodes.value.push(childNode);
      return;
    }

    if (getNodeExpandedState(parentNode)) {
      // 找到插入位置：父节点的最后一个子节点之后
      const currentIndex = flatNodes.value.findIndex(item => item.id === parentNode.id);
      let insertIndex = currentIndex + 1;

      while (insertIndex < flatNodes.value.length && flatNodes.value[insertIndex].depth > parentNode.depth) {
        insertIndex++;
      }

      flatNodes.value.splice(insertIndex, 0, childNode);
    }
    else {
      parentNode.children.push(childNode);
    }
  });
}

// 移除节点
function removeNode(node) {
  withLock(() => {
    if (getNodeExpandedState(node)) {
      toggleNode(node, true);
    }

    const currentIndex = flatNodes.value.findIndex(item => item.id === node.id);
    if (currentIndex !== -1) {
      flatNodes.value.splice(currentIndex, 1);
    }
  });
}

function slectHandler(key, node) {
  menuState.openNodeId = null;
  menuState.openMenuType = null;

  const handler = actionHandlers[key];
  if (handler) {
    handler(node);
  }
  else {
    console.warn('未知操作:', key);
  }
}



// 处理添加菜单的开关
function handleAddMenuToggle(visible, node) {
  if (visible) {
    // 打开添加菜单时，关闭其他菜单
    menuState.openNodeId = node.id;
    menuState.openMenuType = 'add';
  }
  else if (menuState.openNodeId === node.id && menuState.openMenuType === 'add') {
    // 只有当关闭的是当前节点的添加菜单时才重置状态
    menuState.openNodeId = null;
    menuState.openMenuType = null;
  }
}

// 处理更多操作菜单的开关
function handleMoreMenuToggle(visible, node) {
  if (visible) {
    // 打开更多操作菜单时，关闭其他菜单
    menuState.openNodeId = node.id;
    menuState.openMenuType = 'more';
  }
  else if (menuState.openNodeId === node.id && menuState.openMenuType === 'more') {
    // 只有当关闭的是当前节点的更多操作菜单时才重置状态
    menuState.openNodeId = null;
    menuState.openMenuType = null;
  }
}

/**
 * 下面是跟扁平化节点
 */

// 扁平化的节点数据
const flatNodes = ref([]);

// 搜索文本
const searchText = ref('');

// 菜单状态管理
const menuState = reactive({
  openNodeId: null, // 当前打开菜单的节点ID
  openMenuType: null // 'add' 或 'more'
});

// 拖拽状态管理
const dragState = reactive({
  isDragging: false,
  sourceNode: null,
  sourceIndex: -1,
  targetIndex: -1,
  dropType: 'none', // 'before', 'after', 'child'
  draggingElement: null,
  shadowPosition: { x: 0, y: 0 },
  shadowWidth: 0,
  mouseOffset: { x: 0, y: 0 },
  containerRect: null,
  startPosition: { x: 0, y: 0 },
  hasMoved: false,
  clickTimeout: null
});

// 将树形结构扁平化为数组，保留深度信息
function flattenTree(nodes, depth = 0) {
  const result = [];

  for (const node of nodes) {
    // 添加当前节点到结果中
    result.push({
      ...node,
      depth
    });

    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

// 递归过滤节点 - 返回包含所有匹配节点及其父节点的树结构
function filterNodes(nodes, keyword) {
  if (!keyword || !nodes?.length) return [];

  const lowerKeyword = keyword.toLowerCase();

  // 检查节点及其子节点是否包含匹配项
  function hasMatchingDescendant(node) {
    if (node.name?.toLowerCase().includes(lowerKeyword)) {
      return true;
    }

    return node.children?.some(child => hasMatchingDescendant(child)) || false;
  }

  // 过滤节点树，保留匹配节点及其所有父节点
  function filterTree(nodes) {
    const result = [];

    for (const node of nodes) {
      if (hasMatchingDescendant(node)) {
        const clonedNode = {
          ...node,
          children: node.children ? filterTree(node.children) : []
        };
        result.push(clonedNode);
      }
    }

    return result;
  }

  return filterTree(nodes);
}
let cachedTreeData = null;

// 处理搜索
function handleSearch(value) {
  withLock(() => {
    if (!value) {
      if (cachedTreeData) {
        flatNodes.value = cachedTreeData;
        cachedTreeData = null;
      }
    }
    else {
      if (!cachedTreeData) {
        cachedTreeData = flatNodes.value;
      }

      const filteredData = filterNodes(props.treeData, value);
      flatNodes.value = flattenTree(filteredData);

      // 清空children数组以适配现有逻辑
      flatNodes.value.forEach(node => node.children = []);
    }
  });
}

// 监听原始数据变化，重新扁平化
watch(
  () => props.treeData,
  (newData) => {
    flatNodes.value = flattenTree(newData);
    flatNodes.value.forEach(node => node.children = []);

    // 默认收起深度为1的节点
    flatNodes.value.forEach(node => {
      if (node.depth === 1) {
        toggleNode(node, true);
      }
    });
  },
  { immediate: true, deep: true }
);
/**
 * 控制节点的展开和收起
 */
// 获取节点展开状态
function getNodeExpandedState(node) {
  if (node.children?.length > 0) {
    return false;
  }

  const currentIndex = flatNodes.value.findIndex(item => item.id === node.id);
  if (currentIndex >= 0 && currentIndex < flatNodes.value.length - 1) {
    const nextNode = flatNodes.value[currentIndex + 1];
    return nextNode.parentId === node.id;
  }

  return false;
}

// 切换节点展开/收起状态
function toggleNode(node, onLock = false) {
  const toggle = () => {
    const currentIndex = flatNodes.value.findIndex(item => item.id === node.id);
    const isExpanded = getNodeExpandedState(node);

    if (!isExpanded) {
      expandNode(currentIndex);
    }
    else {
      collapseNode(currentIndex);
    }
  };

  if (onLock) {
    toggle();
  }
  else {
    withLock(toggle);
  }
}

// 展开节点
function expandNode(index) {
  if (index >= flatNodes.value.length) return;

  const node = flatNodes.value[index];
  if (node.children?.length > 0) {
    const childrenWithDepth = node.children.map(child => ({
      ...child,
      depth: node.depth + 1
    }));
    flatNodes.value.splice(index + 1, 0, ...childrenWithDepth);
    node.children = [];
  }
}

// 收起节点
function collapseNode(index) {
  if (index + 1 >= flatNodes.value.length) return;

  const node = flatNodes.value[index];
  if (node.children?.length > 0) return;

  while (index + 1 < flatNodes.value.length) {
    const nextNode = flatNodes.value[index + 1];
    if (nextNode.depth === node.depth + 1) {
      collapseNode(index + 1);
      node.children.push(nextNode);
      flatNodes.value.splice(index + 1, 1);
    }
    else {
      break;
    }
  }
}

// 获取节点样式类
function getNodeClasses(node, index) {
  const classes = ['default'];

  if (dragState.isDragging) {
    if (dragState.sourceIndex === index) {
      classes.push('dragging-source');
    }
    else if (dragState.targetIndex === index && dragState.dropType === 'child') {
      classes.push('drag-target');
    }
    else {
      classes.push('dragging-other');
    }
  }

  return classes.join(' ');
}
/**
 * 下面是拖拽
 */
// 拖拽相关配置
const DRAG_THRESHOLD = 10; // 最小拖拽距离

// 鼠标按下事件 - 设置拖拽准备状态
function handleMouseDown(event, node, index) {
  // 点击展开图标，只处理展开/收起
  if (event.target.closest('.expand-icon')) {
    event.preventDefault();
    toggleNode(node);
    return;
  }

  // 点击编辑图标，不处理拖拽
  if (event.target.closest('.edit-icon')) {
    return;
  }

  // 如果正在编辑，不处理
  if (node.isEditing) {
    return;
  }

  // 如果不允许编辑，处理点击事件
  if (!props.edit) {
    event.preventDefault();
    if (node.postId) {
      emit('clickPost', node);
    }
    else {
      toggleNode(node);
    }
    return;
  }

  event.preventDefault();

  // 获取容器边界和鼠标偏移
  const container = event.currentTarget.closest('.tree-menu');
  dragState.containerRect = container.getBoundingClientRect();

  const nodeRect = event.currentTarget.getBoundingClientRect();
  dragState.mouseOffset.x = event.clientX - nodeRect.left;
  dragState.mouseOffset.y = event.clientY - nodeRect.top;
  dragState.startPosition = { x: event.clientX, y: event.clientY };

  // 设置拖拽准备状态
  dragState.isDragging = false;
  dragState.sourceNode = { ...node };
  dragState.sourceIndex = index;
  dragState.targetIndex = index;
}

// 创建拖拽阴影元素
function createDraggingShadow(node, event) {
  dragState.draggingElement = true;
  dragState.shadowWidth = event.currentTarget.offsetWidth;
}

// 开始拖拽
function startDragging(event) {
  if (!props.edit) return;

  // 检查是否有节点正在编辑
  const editingNode = flatNodes.value.find(n => n.isEditing);
  if (editingNode) return;

  dragState.isDragging = true;
  dragState.hasMoved = true;

  if (dragState.clickTimeout) {
    clearTimeout(dragState.clickTimeout);
    dragState.clickTimeout = null;
  }

  // 收起子目录
  if (dragState.sourceNode && getNodeExpandedState(dragState.sourceNode)) {
    toggleNode(dragState.sourceNode);
  }

  // 临时移除过渡效果
  const container = document.querySelector('.tree-menu-container');
  container?.classList.add('no-transition');

  createDraggingShadow(dragState.sourceNode, event);
  updateShadowPosition(event);
}

// 更新阴影位置
function updateShadowPosition(event) {
  if (!dragState.isDragging) return;

  dragState.shadowPosition.x = event.clientX - dragState.mouseOffset.x;
  dragState.shadowPosition.y = event.clientY - dragState.mouseOffset.y;
}

// 鼠标移动事件
function handleMouseMove(event) {
  event.preventDefault();

  if (!props.edit) return;

  // 如果有节点正在编辑，不处理拖拽
  const editingNode = flatNodes.value.find(n => n.isEditing);
  if (editingNode) return;

  // 检查是否需要启动拖拽
  if (!dragState.isDragging && dragState.sourceNode) {
    const deltaX = Math.abs(event.clientX - dragState.startPosition.x);
    const deltaY = Math.abs(event.clientY - dragState.startPosition.y);

    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
      startDragging(event);
      return;
    }
  }

  // 处理拖拽逻辑
  if (dragState.isDragging) {
    updateShadowPosition(event);
    calculateDropPosition(event);
  }
}

// 计算放置位置
function calculateDropPosition(event) {
  const nodes = document.querySelectorAll('.tree-node');
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  let targetIndex = -1;
  let dropType = 'none';

  for (let i = 0; i < nodes.length; i++) {
    const nodeElement = nodes[i];
    const rect = nodeElement.getBoundingClientRect();

    if (mouseY >= rect.top && mouseY <= rect.bottom &&
      mouseX >= rect.left && mouseX <= rect.right) {
      if (i === dragState.sourceIndex) continue;

      targetIndex = i;
      const relativeY = mouseY - rect.top;
      const nodeHeight = rect.height;
      const targetNode = flatNodes.value[i];

      if (relativeY < nodeHeight * 0.25) {
        dropType = 'before';
      }
      else if (relativeY > nodeHeight * 0.75) {
        dropType = 'after';
      }
      else {
        dropType = targetNode.postId ? 'after' : 'child';
      }

      break;
    }
  }

  if (targetIndex !== dragState.targetIndex || dropType !== dragState.dropType) {
    dragState.targetIndex = targetIndex;
    dragState.dropType = dropType;
  }
}

// 鼠标释放事件 - 结束拖拽或处理点击
function handleMouseUp(event) {
  event.preventDefault();

  const deltaX = Math.abs(event.clientX - dragState.startPosition.x);
  const deltaY = Math.abs(event.clientY - dragState.startPosition.y);
  const isClick = deltaX <= DRAG_THRESHOLD && deltaY <= DRAG_THRESHOLD;

  // 处理拖拽
  if (dragState.isDragging) {
    performDrop();
    cleanupDrag();
    return;
  }

  // 处理点击
  if (dragState.sourceNode && isClick) {
    if (dragState.clickTimeout) {
      clearTimeout(dragState.clickTimeout);
      dragState.clickTimeout = null;
    }

    if (dragState.sourceNode.postId) {
      emit('clickPost', dragState.sourceNode);
    }
    else {
      toggleNode(dragState.sourceNode);
    }
  }

  cleanupDrag();
}

// 鼠标离开容器事件
function handleMouseLeave() {
  if (dragState.isDragging) {
    cleanupDrag();
  }
}

// 执行放置操作
function performDrop() {
  withLock(() => {
    if (dragState.targetIndex === -1 || dragState.dropType === 'none' || dragState.sourceIndex === dragState.targetIndex) {
      return;
    }

    const sourceIndex = dragState.sourceIndex;
    const targetIndex = dragState.targetIndex;
    const dropType = dragState.dropType;

    // 调整目标索引
    let adjustedTargetIndex = targetIndex;
    if (sourceIndex < targetIndex) {
      adjustedTargetIndex--;
    }

    // 获取源节点并从原位置移除
    const sourceNode = flatNodes.value[sourceIndex];
    flatNodes.value.splice(sourceIndex, 1);

    const adjustedTarget = flatNodes.value[adjustedTargetIndex];
    const lastNode = flatNodes.value[adjustedTargetIndex - 1];

    // 根据放置类型处理
    handleDropType(dropType, sourceNode, adjustedTarget, lastNode, adjustedTargetIndex);
  });
}

// 处理不同的放置类型
function handleDropType(dropType, sourceNode, adjustedTarget, lastNode, adjustedTargetIndex) {
  switch (dropType) {
    case 'before':
      handleBeforeDrop(sourceNode, adjustedTarget, lastNode, adjustedTargetIndex);
      break;
    case 'after':
      handleAfterDrop(sourceNode, adjustedTarget, adjustedTargetIndex);
      break;
    case 'child':
      handleChildDrop(sourceNode, adjustedTarget, adjustedTargetIndex);
      break;
  }
}

// 处理 before 放置
function handleBeforeDrop(sourceNode, adjustedTarget, lastNode, adjustedTargetIndex) {
  const depthChanged = adjustedTarget.depth !== sourceNode.depth;

  if (depthChanged) {
    if (lastNode?.depth === adjustedTarget.depth) {
      moveOrResourt(sourceNode.id, lastNode.id, adjustedTarget.parentId);
    }
    else {
      moveOrResourt(sourceNode.id, null, adjustedTarget.parentId || null);
    }
  }
  else {
    if (!lastNode || lastNode.depth !== adjustedTarget.depth) {
      moveOrResourt(sourceNode.id, null, adjustedTarget.parentId || null);
    }
    else {
      moveOrResourt(sourceNode.id, lastNode.id, -1);
    }
  }

  flatNodes.value.splice(adjustedTargetIndex, 0, {
    ...sourceNode,
    depth: adjustedTarget.depth,
    parentId: adjustedTarget.parentId
  });
}

// 处理 after 放置
function handleAfterDrop(sourceNode, adjustedTarget, adjustedTargetIndex) {
  const depthChanged = adjustedTarget.depth !== sourceNode.depth;

  if (depthChanged) {
    moveOrResourt(sourceNode.id, adjustedTarget.id, adjustedTarget.parentId);
  }
  else {
    moveOrResourt(sourceNode.id, adjustedTarget.id, -1);
  }

  flatNodes.value.splice(adjustedTargetIndex + 1, 0, {
    ...sourceNode,
    depth: adjustedTarget.depth,
    parentId: adjustedTarget.parentId
  });
}

// 处理 child 放置
function handleChildDrop(sourceNode, adjustedTarget, adjustedTargetIndex) {
  const depthChanged = adjustedTarget.depth !== sourceNode.depth - 1;

  if (depthChanged) {
    moveOrResourt(sourceNode.id, null, adjustedTarget.id);
  }
  else {
    moveOrResourt(sourceNode.id, null, -1);
  }

  flatNodes.value.splice(adjustedTargetIndex + 1, 0, {
    ...sourceNode,
    depth: adjustedTarget.depth + 1,
    parentId: adjustedTarget.id
  });
}
// 移动或排序目录
function moveOrResourt(id, lastId, parentId) {
  if (parentId === -1) {
    resourtDir(id, lastId);
  }
  else {
    moveDir(id, lastId, parentId);
  }
}

const willMoveDirs = [];
let moveDirItem = null;

function resourtDir(id, lastId) {
  willMoveDirs.push({
    url: '/dir/resort',
    id,
    lastId,
    kbId: props.kbId
  });
  startMoveDirs();
}

function moveDir(id, lastId, parentId) {
  willMoveDirs.push({
    url: '/dir/move',
    id,
    lastId,
    parentId,
    kbId: props.kbId
  });
  startMoveDirs();
}

function startMoveDirs() {
  if (moveDirItem) return;

  moveDirItem = setInterval(async () => {
    const item = willMoveDirs.shift();
    if (item) {
      loading.value += 1;
      try {
        await api.post(item.url, item);
      }
      catch (error) {
        console.error('移动目录失败:', error);
        Message.error('移动目录失败');
      }
      finally {
        loading.value -= 1;
      }
    }
    else {
      clearInterval(moveDirItem);
      moveDirItem = null;
    }
  }, 100);
}




// 清理拖拽状态
function cleanupDrag() {
  Object.assign(dragState, {
    isDragging: false,
    sourceNode: null,
    sourceIndex: -1,
    targetIndex: -1,
    dropType: 'none',
    draggingElement: null,
    shadowPosition: { x: 0, y: 0 },
    shadowWidth: 0,
    mouseOffset: { x: 0, y: 0 },
    containerRect: null,
    startPosition: { x: 0, y: 0 },
    hasMoved: false
  });

  if (dragState.clickTimeout) {
    clearTimeout(dragState.clickTimeout);
    dragState.clickTimeout = null;
  }
}

</script>

<style scoped lang="less">
.menu-nodes-list {
  overflow: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
}

.tree-menu {
  user-select: none;

  .tree-menu-container {
    position: relative;
  }

  .default {
    height: 20px;

    &:hover {
      background-color: @color-fill-2;
    }
  }

  // 拖拽状态样式
  .tree-node.dragging-source {
    opacity: 0;
    visibility: hidden;
  }

  .tree-node.drag-target {
    background-color: @primary-1;
    border: 2px dashed @primary-6 !important;
    border-radius: 4px;

    .node-content {
      pointer-events: none;
    }
  }

  .dragging-other {
    opacity: 1;
  }

  .tree-node {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    margin: 2px 0;
    transition: all 0.2s ease;
    position: relative;
    border: 2px solid transparent;
    // 确保节点有固定的最小高度，有助于内容垂直居中
    min-height: 24px;
  }

  .tree-node .node-content {
    display: flex;
    align-items: center;
    gap: 8px;

    // 确保内容区域占满节点高度，有助于子元素垂直居中
    height: 100%;
    min-height: 24px;

    .expand-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-neutral-6);
      cursor: pointer;
      transition: transform 0.2s ease;

      &.expanded {
        transform: rotate(0deg);
      }

      svg {
        width: 16px;
        height: 16px;
      }
    }

    .expand-icon-placeholder {
      width: 16px;
      height: 16px;
    }

    .node-name {
      flex: 1;
      font-size: 14px;
      color:var(--color-neutral-10);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .edit-icon {
      width: 14px;
      height: 14px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s ease;
      flex-shrink: 0;
    }

    .rename-input {
      flex: 1;
      margin: -4px 0;
    }

    // 右侧操作图标样式
    .node-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
      margin-left: auto;
    }

    .action-icon {
      width: 16px;
      height: 16px;
      color: var(--color-neutral-6);
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--color-bg-1);
      }

      svg {
        width: 14px;
        height: 14px;
      }
    }
  }

  // 悬停时显示编辑图标和右侧操作图标
  .tree-node:hover .edit-icon,
  .tree-node:hover .node-actions,
  .tree-node .node-actions.show-actions {
    opacity: 1;
  }

  // 拖拽指示器
  .drag-indicator {
    position: absolute;
    left: 0;
    right: 0;
    pointer-events: none;

    &.indicator-before {
      top: -2px;

      .indicator-line {
        height: 2px;
        background-color: @primary-6;
        border-radius: 1px;
      }
    }

    &.indicator-after {
      bottom: -2px;

      .indicator-line {
        height: 2px;

        border-radius: 1px;
      }
    }

  }

  // 拖拽阴影样式
  .dragging-shadow {
    position: fixed;
    z-index: 1000;
    pointer-events: none;
    border-radius: 20%;
    opacity: 0.8;

    .node-content {
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: @color-bg-white;

      .expand-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-neutral-6);

        svg {
          width: 16px;
          height: 16px;
        }
      }

      .expand-icon-placeholder {
        width: 16px;
        height: 16px;
      }

      .node-name {
        flex: 1;
        font-size: 14px;
        color: var(--color-neutral-8);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

// 搜索框样式
.search-container {
  padding: 12px;
  border-bottom: 1px solid var(--color-neutral-3);
  display: flex;
  align-items: center;
  gap: 8px;
  
  .arco-input-wrapper {
    border-radius: 16px;
    flex: 1;
  }

  .search-actions {
    display: flex;
    align-items: center;

    .action-icon {
      width: 16px;
      height: 16px;
      color: var(--color-neutral-8);
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      transition: all 0.2s ease;


      svg {
        width: 14px;
        height: 14px;
      }
    }
  }
}

// TransitionGroup 动画样式
.node-list-move {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.node-list-enter-active {
  transition: all 0.2s ease;
}

.node-list-leave-active {
  transition: all 0.2s ease;
}

.node-list-enter-from,
.node-list-leave-to {
  opacity: 0;
  max-height: 0;
}

.node-list-enter-to,
.node-list-leave-from {
  opacity: 1;
  max-height: 100px;
}




.menu-icon {
  font-size: 16px;

  vertical-align: middle;
}

/* 加载状态样式 */
.loading-container {
  z-index: 1001;
  position: absolute;
  bottom: 20px;
  display: flex;
  left: 0;
  right: 0;
  margin: auto;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}
</style>