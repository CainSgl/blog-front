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
              <Menu.Item key="newPost" @click="() => slectHandler('newPost', null, 'add')">
                <IconDriveFile class="menu-icon" />文档
              </Menu.Item>
              <Menu.Item key="import" @click="() => slectHandler('import', null, 'add')">
                <IconImport class="menu-icon" />导入
              </Menu.Item>
              <Menu.Item key="newDir" @click="() => slectHandler('newDir', null, 'add')">
                <IconFolder class="menu-icon" />目录
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </div>
    </div>
    <TransitionGroup name="node-list" tag="div" style="height:100%;overflow: auto" class="menu-nodes-list" >
      <div v-for="(node, index) in flatNodes" :key="node.id" class="tree-node" :class="getNodeClasses(node, index)"
        :style="{ marginLeft: `${node.depth * 20}px` }" @mousedown="handleMouseDown($event, node, index)">
        <div class="node-content" :class="{ renaming: node.showInput }">
          <span class="expand-icon" :class="{ expanded: getNodeExpandedState(node) }">
            <IconDown v-if="getNodeExpandedState(node)" />
            <IconRight v-else-if="node.children && node.children.length > 0" />
            <IconFile v-else-if="node.postId" />
          </span>

          <span class="node-name" v-show="!node.showInput">{{ node.name || '未命名' }}</span>
          <div v-show="node.showInput">
            <Input :value="nodeName" class="rename-input" @input="(e) => handleRenameInput(e, node)"
              @blur="() => handleRenameBlur(node)" @keyup.enter="() => handleRenameConfirm(node)"
              @keyup.esc="() => handleRenameCancel(node)" @mousedown.stop @click.stop autofocus />
          </div>
          <!-- 右侧操作图标-->
          <div class="node-actions"
            :class="{ 'show-actions': menuState.openNodeId === node.id && (menuState.openMenuType === 'add' || menuState.openMenuType === 'more') }"
            v-show="!dragState.isDragging && (edit || (menuState.openNodeId === node.id && (menuState.openMenuType === 'add' || menuState.openMenuType === 'more'))) && !node.showInput">

            <Dropdown trigger="hover" placement="bottom"
              :popup-visible="menuState.openNodeId === node.id && menuState.openMenuType === 'add'"
              @select="(key) => handleMenuSelect(key, node)"
              @popup-visible-change="(visible) => handleAddMenuToggle(visible, node)" v-if="!node.postId" position="br">
              <IconPlus class="action-icon" @click.stop @mousedown.stop />
              <template #content>
                <Menu>
                  <Menu.Item key="newPost" @click="() => slectHandler('newPost', node, 'add')">
                    <IconDriveFile class="menu-icon" />文档
                  </Menu.Item>
                  <Menu.Item key="import" @click="() => slectHandler('import', node, 'add')">
                    <IconImport class="menu-icon" />导入
                  </Menu.Item>
                  <Menu.Item key="newDir" @click="() => slectHandler('newDir', node, 'add')">
                    <IconFolder class="menu-icon" />目录
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
            <Dropdown trigger="hover" placement="bottom"
              :popup-visible="menuState.openNodeId === node.id && menuState.openMenuType === 'more'"
              @select="(value) => handleMoreActions(value, node)"
              @popup-visible-change="(visible) => handleMoreMenuToggle(visible, node)" position="bl"
              :popup-max-height="false">
              <IconMore class="action-icon" @click.stop @mousedown.stop />
              <template #content>
                <Menu>
                  <Menu.Item key="rename" @click="() => slectHandler('rename', node, 'more')">
                    <IconEdit class="menu-icon" /> 重命名
                  </Menu.Item>
                  <Menu.Item v-if="node.postId" key="view-doc" @click="() => slectHandler('view-doc', node, 'more')">
                    <IconEye class="menu-icon" /> 查看文档
                  </Menu.Item>
                  <Menu.Item v-if="node.postId" key="edit-doc" @click="() => slectHandler('edit-doc', node, 'more')">
                    <IconPen class="menu-icon" /> 编辑文档
                  </Menu.Item>
                  <Menu.Item v-if="node.postId" key="copy-link" @click="() => slectHandler('copy-link', node, 'more')">
                    <IconCopy class="menu-icon" />复制链接
                  </Menu.Item>
                  <!-- <Menu.Item v-if="node.postId" key="pin-top"  @click="() => slectHandler('pin-top', node, 'more')" > <IconToTop  class="menu-icon"/> 置顶文档</Menu.Item> -->
                  <Menu.Item v-if="node.postId" key="open-new-tab"
                    @click="() => slectHandler('open-new-tab', node, 'more')">
                    <IconLaunch class="menu-icon" />在新标签页打开
                  </Menu.Item>
                  <Menu.Item key="delete" :style="{ color: 'rgb(var(--red-6))' }"
                    @click="() => slectHandler('delete', node, 'more')">
                    <IconDelete class="menu-icon" /> 删除
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
import { ref, watch, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { IconDown, IconRight, IconPlus, IconEye, IconFile, IconMore, IconImport, IconFolder, IconDriveFile, IconEdit, IconPen, IconCopy, IconToTop, IconLaunch, IconDelete, IconSync, IconSearch } from '@arco-design/web-vue/es/icon';
import { Dropdown, Menu, Spin, Input, Message } from '@arco-design/web-vue';
import api from '@/api/index.js';
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
const loadingTip = computed(() => 
{
  if (loading.value === 1) 
  {
    return '正在拼命同步修改中...';
  }
  return `正在拼命同步修改中,前方还有${loading.value - 1}个命令正在发送...`;
});
// 创建操作锁，防止并发操作
const operationLock = ref(false);

// 锁定操作函数
async function withLock(operation) 
{
  // 如果已经有操作在进行中，直接返回
  while (true) 
  {
    if (!operationLock.value) 
    {
      break;
    }
  }

  // 获取锁
  operationLock.value = true;

  try 
  {
    // 执行操作
    await operation();
  }
  finally 
  {
    // 释放锁
    operationLock.value = false;
  }
}

let lastRenameNode = null;
const nodeName = ref('');
// 处理重命名确认
function handleRenameConfirm(node) 
{
  node.showInput = false;
  node.showInput = false;
  lastRenameNode = null;
}

// 处理重命名失焦
function handleRenameBlur(node) 
{
  if (nodeName.value != node.name) 
  {
    console.log('需要保存数据');
    //去调用api
    loading.value += 1;
    let parentId = node.parentId;
    if (!parentId) 
    {
      parentId = null;
    }
    api.put('/dir', {
      id: node.id,
      kbId: props.kbId,
      name: nodeName.value,
      parentId: parentId,
    }).then((res) => 
    {
      loading.value -= 1;
      node.name = nodeName.value;
    }).catch((error) => 
    {
      console.error('重命名目录失败:', error);
      loading.value -= 1;
      node.name = nodeName.value;
    });
  }
  node.showInput = false;
  lastRenameNode = null;


}

// 处理重命名输入框变化
function handleRenameInput(e, node) 
{
  nodeName.value = e;
  return;
}
function handleRenameCancel(e) 
{
  console.log('取消重命名');
  lastRenameNode.showInput = false;
  nodeName.value = lastRenameNode.name;
  lastRenameNode = null;
}


// 创建操作处理函数映射对象
const actionHandlers = {
  'newPost': async (node) => 
  {

    loading.value += 1;
    //创建并跳转
    try 
    {
      let parentId = null;
      let docName = '未命名文档';
      if (node) 
      {
        parentId = node.id;
        docName = node.name + '下的文档';
      }
      const { data } = await api.post('/post', {
        title: docName,
        kbId: props.kbId,
        parentId: node?.id,
      });
      const newNode = {
        id: data.dirId,
        name: docName,
        parentId: parentId,
        postId: data.post.id,
        depth: node ? node.depth + 1 : 0,
        children: []
      };
      addChildNode(node, newNode);
      //跳转到编辑页面并携带postId参数
      router.push({
        name: 'KBEdit',
        query: { p: data.post.id, kb: props.kbId }
      });
    }
    catch (error) 
    {
      console.error('创建文档失败:', error);
    }
    finally 
    {
      loading.value -= 1;
    }

  },
  'newDir': async (node) => 
  {
    loading.value += 1;
    try 
    {
      let parentId = null;
      let dirName = '根目录';
      if (node) 
      {
        parentId = node.id;
        dirName = (node.depth + 1) + '级目录';
      }
      const { data } = await api.post('/dir', {
        name: dirName,
        kbId: props.kbId,
        parentId: parentId,
      });
      const newNode = {
        id: data,
        name: dirName,
        parentId: parentId,
        depth: node ? node.depth + 1 : 0,
        children: []
      };
      addChildNode(node, newNode);
    }
    catch (error) 
    {
      console.error('创建文档失败:', error);
    }
    finally 
    {
      loading.value -= 1;
    }

  },
  'import': (node) => 
  {
    //后面再做 TODO
  },
  'rename': (node) => 
  {
    if (lastRenameNode) 
    {
      lastRenameNode.showInput = false;
    }
    lastRenameNode = node;
    nodeName.value = node.name;
    console.log(node.name);
    node.showInput = true;
  },
  'view-doc': (node) => 
  {
    console.log('查看文档:', node);
    if (node.postId) 
    {
      router.push({
        name: 'KBView',
        query: { p: node.postId, kb: props.kbId }
      });
    }
  },
  'edit-doc': (node) => 
  {
    console.log('编辑文档:', node);
    if (node.postId) 
    {
      router.push({
        name: 'KBEdit',
        query: { p: node.postId, kb: props.kbId }
      });
    }
  },
  'copy-link': (node) => 
  {
    // 实现复制链接逻辑
    console.log('复制链接:', node);
    if (node.postId) 
    {
      const link = 'a';
    }
  },
  'pin-top': async (node) => 
  {
    loading.value += 1;
    try 
    {
      let postId = null;
      if (node.postId) 
      {
        postId = node.postId;
      }
      const { data } = await api.put('/post', {
        id: node.postId,
        isTop: true,
      });
    }
    catch (error) 
    {
      console.error('置顶文档失败:', error);
    }
    finally 
    {
      loading.value -= 1;
    }

  },
  'open-new-tab': (node) => 
  {
    // 实现新标签页打开逻辑
    console.log('新标签页打开:', node);
    if (node.postId) 
    {
      let pageName = router.currentRoute.value.name;
      if (pageName === 'KBIndex') 
      {
        pageName = 'KBView';
      }
      const routeData = router.resolve({
        name: pageName,
        query: { p: node.postId, kb: props.kbId }
      });
      window.open(routeData.href, '_blank');
    }
  },
  'delete': async (node) => 
  {
    //删除dir就行
    loading.value += 1;
    try 
    {
      const { data } = await api.delete('/dir', {
        'kbId': props.kbId,
        'dirId': node.id
      });
      if (data > 0) 
      {
        if (node.postId) 
        {
          Message.success(node.name + '将移入游离文档列表，若需要完全删除，请在个人空间操作。');
        }
        else 
        {
          Message.warning(node.name + '目录下的' + data + '个文章已自动移入游离文档列表，可在个人空间查看。');
        }

      }

      console.log('本次目录删除影响了', data, '个文章，需要用户注意');
      // 移除对应的dir节点
      removeNode(node);
    }
    catch (error) 
    {
      console.error('删除目录失败:', error);
    }
    finally 
    {
      loading.value -= 1;
    }
  }
};

// 添加子节点
function addChildNode(parentNode, childNode) 
{
  withLock(() => 
  {
    if (!parentNode) 
    {
      //明显根节点
      flatNodes.value.push(childNode);
      return;
    }



    if (getNodeExpandedState(parentNode)) 
    {
      //找到当前节点在扁平化数组中的位置
      const currentIndex = flatNodes.value.findIndex(item => item.id === parentNode.id);
      //找到该节点的所有子节点，插入到最后一个子节点后面
      let insertIndex = currentIndex + 1;
      //遍历找到最后一个子节点的位置
      while (insertIndex < flatNodes.value.length && flatNodes.value[insertIndex].depth > parentNode.depth) 
      {
        insertIndex++;
      }
      //在正确位置插入新节点
      flatNodes.value.splice(insertIndex, 0, childNode);
    }
    else 
    {
      //添加在children里
      parentNode.children.push(childNode);
    }
  });

}

// 移除节点
function removeNode(node) 
{
  withLock(() => 
  {
    // 找到当前节点在扁平化数组中的位置
    if (getNodeExpandedState(node)) 
    {
      toggleNode(node, true);
    }
    const currentIndex = flatNodes.value.findIndex(item => item.id === node.id);
    if (currentIndex !== -1) 
    {
      flatNodes.value.splice(currentIndex, 1);
    }
  });
}

function slectHandler(key, node) 
{
  //隐藏菜单
  menuState.openNodeId = null;
  menuState.openMenuType = null;

  // 使用映射对象直接调用对应的函数
  if (actionHandlers[key]) 
  {
    actionHandlers[key](node);
  }
  else 
  {
    console.log('未知操作:', key);
  }
}



// 处理添加菜单的开关
function handleAddMenuToggle(visible, node) 
{
  if (visible) 
  {
    // 打开添加菜单时，关闭其他菜单
    menuState.openNodeId = node.id;
    menuState.openMenuType = 'add';
  }
  else if (menuState.openNodeId === node.id && menuState.openMenuType === 'add') 
  {
    // 只有当关闭的是当前节点的添加菜单时才重置状态
    menuState.openNodeId = null;
    menuState.openMenuType = null;
  }
}

// 处理更多操作菜单的开关
function handleMoreMenuToggle(visible, node) 
{
  if (visible) 
  {
    // 打开更多操作菜单时，关闭其他菜单
    menuState.openNodeId = node.id;
    menuState.openMenuType = 'more';
  }
  else if (menuState.openNodeId === node.id && menuState.openMenuType === 'more') 
  {
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
function flattenTree(nodes, depth = 0) 
{
  const result = [];

  for (const node of nodes) 
  {
    // 添加当前节点到结果中
    result.push({
      ...node,
      depth
    });

    // 递归处理子节点
    if (node.children && node.children.length > 0) 
    {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

// 递归过滤节点 - 新版本：返回包含所有匹配节点及其父节点的树结构
function filterNodes(nodes, keyword) 
{
  if (!keyword || !nodes?.length) return [];

  const lowerKeyword = keyword.toLowerCase();

  // 深度克隆节点树，避免修改原数据
  function cloneNode(node) 
  {
    return {
      ...node,
      children: node.children ? node.children.map(child => cloneNode(child)) : []
    };
  }

  // 检查节点及其子节点是否包含匹配项
  function hasMatchingDescendant(node) 
  {
    // 检查当前节点是否匹配
    if (node.name && node.name.toLowerCase().includes(lowerKeyword)) 
    {
      return true;
    }

    // 递归检查子节点
    if (node.children && node.children.length > 0) 
    {
      return node.children.some(child => hasMatchingDescendant(child));
    }

    return false;
  }

  // 过滤节点树，保留匹配节点及其所有父节点
  function filterTree(nodes) 
  {
    const result = [];

    for (const node of nodes) 
    {
      // 深度克隆当前节点
      const clonedNode = cloneNode(node);

      // 如果当前节点匹配或者有匹配的后代节点，则保留该节点
      if (hasMatchingDescendant(node)) 
      {
        // 如果有子节点，递归过滤子节点
        if (clonedNode.children && clonedNode.children.length > 0) 
        {
          clonedNode.children = filterTree(clonedNode.children);
        }
        result.push(clonedNode);
      }
    }

    return result;
  }

  return filterTree(nodes);
}
let cachedTreeData;
// 处理搜索
function handleSearch(value) 
{
  withLock(() => 
  {
    if (!value) 
    {
      // 如果搜索文本为空，恢复原始数据
      flatNodes.value = cachedTreeData;
      console.log('恢复数据');
      cachedTreeData = null;
    }
    else 
    {
      if (cachedTreeData == null) 
      {
        cachedTreeData = flatNodes.value;
      }
      // 过滤节点
      const filteredData = filterNodes(props.treeData, value);
      // 将过滤后的树结构扁平化
      flatNodes.value = flattenTree(filteredData);
      // 清空所有节点的children数组以适配现有逻辑
      for (let i = 0; i < flatNodes.value.length; i++) 
      {
        flatNodes.value[i].children = [];
      }
    }
  });

}

// 监听原始数据变化，重新扁平化
watch(
  () => props.treeData,
  (newData) => 
  {
    flatNodes.value = flattenTree(newData);
    for (let i = 0; i < flatNodes.value.length; i++) 
    {
      flatNodes.value[i].children = [];
    }
    //让深度为2的收起自己的子目录
    for (let i = 0; i < flatNodes.value.length; i++) 
    {
      if (flatNodes.value[i].depth == 1) 
      {
        toggleNode(flatNodes.value[i], true);
      }
    }
  },
  { immediate: true, deep: true }
);
/**
 * 控制节点的展开和收起
 */
// 获取节点展开状态
function getNodeExpandedState(node) 
{
  if (node.children && node.children.length > 0) 
  {
    return false;
  }
  // 查找当前节点在扁平化数组中的索引
  const currentIndex = flatNodes.value.findIndex(item => item.id === node.id);
  // 检查下一个元素是否存在且是否为当前节点的子节点
  if (currentIndex >= 0 && currentIndex < flatNodes.value.length - 1) 
  {

    const nextNode = flatNodes.value[currentIndex + 1];
    // 如果下一个节点的parentId等于当前节点的id，说明是展开状态
    if (nextNode.parentId === node.id) 
    {
      //说明展开了，并且就在自己的后面
      return true;
    }
  }
  return false;
}

// 切换节点展开/收起状态
function toggleNode(node, onLock = false) 
{
  const toggle = () => 
  {
    if (node.showInput) 
    {
      return;
    }

    const currentIndex = flatNodes.value.findIndex(item => item.id === node.id);

    // 获取当前节点的展开状态
    const isExpanded = getNodeExpandedState(node);

    function toExpand(index) 
    {
      if (flatNodes.value.length <= index) 
      {
        return;
      }

      const me = flatNodes.value[index];
      // 将子节点逐个插入到当前节点之后
      if (me.children && me.children.length > 0) 
      {
        const childrenWithDepth = me.children.map(child => ({
          ...child,
          depth: me.depth + 1
        }));
        // 在当前节点后插入子节点
        flatNodes.value.splice(index + 1, 0, ...childrenWithDepth);
        me.children = [];
      }
    }

    function toCollapse(index) 
    {

      if (index + 1 >= flatNodes.value.length) 
      {
        return;
      }
      const me = flatNodes.value[index];
      if (me.children && me.children.length > 0) 
      {
        return;
      }
      //如果下一个节点的深度刚好是自己的深度+1，说明下一个节点是直接子节点
      while (true) 
      {
        const next = flatNodes.value[index + 1];
        if (!next) 
        {
          return;
        }
        if (next.depth === me.depth + 1) 
        {
          toCollapse(index + 1);
          //移除他，并加入到自己的子节点里去
          me.children.push(next);
          flatNodes.value.splice(index + 1, 1);
        }
        else 
        {
          break;
        }
      }
    }


    // 切换节点展开状态
    if (!isExpanded) 
    {
      // 展开节点
      toExpand(currentIndex);
    }
    else 
    {
      // 收起节点
      toCollapse(currentIndex);
    }


  };
  if (onLock) 
  {
    toggle();
  }
  else 
  {
    withLock(toggle);
  }
}

// 获取节点样式类
function getNodeClasses(node, index) 
{
  const classes = ['default'];

  if (dragState.isDragging) 
  {
    if (dragState.sourceIndex === index) 
    {
      classes.push('dragging-source');
    }
    else if (dragState.targetIndex === index && dragState.dropType === 'child') 
    {
      classes.push('drag-target');
    }
    else 
    {
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
function handleMouseDown(event, node, index) 
{
  // 如果点击的是展开图标，不触发拖拽，只处理展开/收起
  if (event.target.closest('.expand-icon')) 
  {
    event.preventDefault();
    toggleNode(node);
    return;
  }

  // 如果 edit 为 false 或者正在重命名节点，不允许拖拽功能
  if (!props.edit || lastRenameNode) 
  {
    event.preventDefault();
    // 如果节点存在 postId，调用父组件的 clickPost 方法
    if (node.postId && !lastRenameNode) 
    {
      emit('clickPost', node);
    }
    else 
    {
      // 否则执行点击逻辑 - 切换展开/收起状态
      toggleNode(node);
    }
    return;
  }

  event.preventDefault();

  // 获取容器边界
  const container = event.currentTarget.closest('.tree-menu');
  dragState.containerRect = container.getBoundingClientRect();

  // 计算鼠标相对于节点的偏移
  const nodeRect = event.currentTarget.getBoundingClientRect();
  dragState.mouseOffset.x = event.clientX - nodeRect.left;
  dragState.mouseOffset.y = event.clientY - nodeRect.top;

  // 记录初始位置
  dragState.startPosition = {
    x: event.clientX,
    y: event.clientY
  };

  // 设置拖拽准备状态，但不立即开始拖拽
  dragState.isDragging = false;
  dragState.sourceNode = { ...node };
  dragState.sourceIndex = index;
  dragState.targetIndex = index;
}

// 创建拖拽阴影元素
function createDraggingShadow(node, event) 
{
  dragState.draggingElement = true;
  dragState.shadowWidth = event.currentTarget.offsetWidth;
}

// 开始拖拽
function startDragging(event) 
{
  // 如果 edit 为 false 或者正在重命名节点，不允许开始拖拽
  if (!props.edit || lastRenameNode) 
  {
    return;
  }

  dragState.isDragging = true;
  dragState.hasMoved = true;

  // 清除点击定时器
  if (dragState.clickTimeout) 
  {
    clearTimeout(dragState.clickTimeout);
    dragState.clickTimeout = null;
  }

  // 收起子目录（如果展开的话）
  if (dragState.sourceNode && getNodeExpandedState(dragState.sourceNode)) 
  {
    toggleNode(dragState.sourceNode);
  }

  // 临时移除tree-menu-container样式
  const container = document.querySelector('.tree-menu-container');
  if (container) 
  {
    container.classList.add('no-transition');
  }

  // 创建拖拽阴影元素
  createDraggingShadow(dragState.sourceNode, event);

  // 更新阴影位置
  updateShadowPosition(event);
}

// 更新阴影位置
function updateShadowPosition(event) 
{
  if (!dragState.isDragging) return;

  dragState.shadowPosition.x = event.clientX - dragState.mouseOffset.x;
  dragState.shadowPosition.y = event.clientY - dragState.mouseOffset.y;
}

// 鼠标移动事件
function handleMouseMove(event) 
{
  event.preventDefault();
 
  // 如果 edit 为 false 或者正在重命名节点，不允许拖拽
  if (!props.edit || lastRenameNode) 
  {
    return;
  }

  // 如果还未开始拖拽，检查是否需要启动拖拽
  if (!dragState.isDragging && dragState.sourceNode) 
  {
    const deltaX = Math.abs(event.clientX - dragState.startPosition.x);
    const deltaY = Math.abs(event.clientY - dragState.startPosition.y);

    // 如果移动距离超过阈值，开始拖拽
    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) 
    {
      startDragging(event);
      return;
    }
  }

  // 如果已经在拖拽状态，处理拖拽逻辑
  if (dragState.isDragging) 
  {
    // 更新阴影位置
    updateShadowPosition(event);

    // 计算目标位置
    calculateDropPosition(event);
  }
}

// 计算放置位置
function calculateDropPosition(event) 
{
  const nodes = document.querySelectorAll('.tree-node');
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  let targetIndex = -1;
  let dropType = 'none';

  // 遍历所有节点，找到鼠标悬停的节点
  for (let i = 0; i < nodes.length; i++) 
  {
    const nodeElement = nodes[i];
    const rect = nodeElement.getBoundingClientRect();

    // 检查鼠标是否在当前节点范围内
    if (mouseY >= rect.top && mouseY <= rect.bottom &&
      mouseX >= rect.left && mouseX <= rect.right) 
    {

      // 排除源节点
      if (i === dragState.sourceIndex) continue;

      targetIndex = i;

      // 计算精确的放置类型
      const relativeY = mouseY - rect.top;
      const nodeHeight = rect.height;

      if (relativeY < nodeHeight * 0.25) 
      {
        dropType = 'before';
      }
      else if (relativeY > nodeHeight * 0.75) 
      {
        dropType = 'after';
      }
      else 
      {
        // 如果目标节点存在postId，不允许作为子节点
        const targetNode = flatNodes.value[i];

        if (targetNode.postId) 
        {
          dropType = 'after';
        }
        else 
        {
          dropType = 'child';
        }
      }

      break;
    }
  }

  // 更新拖拽状态
  if (targetIndex !== dragState.targetIndex || dropType !== dragState.dropType) 
  {
    dragState.targetIndex = targetIndex;
    dragState.dropType = dropType;
  }
}

// 鼠标释放事件 - 结束拖拽或处理点击
function handleMouseUp(event) 
{
  event.preventDefault();

  // 如果 edit 为 false，直接处理点击事件
  if (!props.edit) 
  {
    if (dragState.sourceNode) 
    {
      const deltaX = Math.abs(event.clientX - dragState.startPosition.x);
      const deltaY = Math.abs(event.clientY - dragState.startPosition.y);

      // 如果移动距离很小，认为是点击
      if (deltaX <= DRAG_THRESHOLD && deltaY <= DRAG_THRESHOLD) 
      {
        // 如果节点存在 postId，调用父组件的 clickPost 方法
        if (dragState.sourceNode.postId) 
        {
          emit('clickPost', dragState.sourceNode);
        }
        else 
        {
          // 否则执行点击逻辑 - 切换展开/收起状态
          toggleNode(dragState.sourceNode);
        }
      }
    }

    // 清理拖拽状态
    cleanupDrag();
    return;
  }

  // 如果已经开始了拖拽，执行放置操作
  if (dragState.isDragging) 
  {
    performDrop();
    cleanupDrag();
    return;
  }

  // 如果没有开始拖拽，可能是点击事件
  if (dragState.sourceNode) 
  {
    const deltaX = Math.abs(event.clientX - dragState.startPosition.x);
    const deltaY = Math.abs(event.clientY - dragState.startPosition.y);

    // 如果移动距离很小，认为是点击
    if (deltaX <= DRAG_THRESHOLD && deltaY <= DRAG_THRESHOLD) 
    {
      // 清除点击定时器（如果有的话）
      if (dragState.clickTimeout) 
      {
        clearTimeout(dragState.clickTimeout);
        dragState.clickTimeout = null;
      }

      // 如果节点存在postId，调用父组件的clickPost方法
      if (dragState.sourceNode.postId) 
      {
        emit('clickPost', dragState.sourceNode);
      }
      else 
      {
        // 否则执行点击逻辑 - 切换展开/收起状态
        toggleNode(dragState.sourceNode);
      }
    }
  }

  // 清理拖拽状态
  cleanupDrag();
}

// 鼠标离开容器事件
function handleMouseLeave(event) 
{
  if (!dragState.isDragging) return;

  // 如果鼠标离开容器，尝试目前是不放置
  if (dragState.targetIndex !== -1) 
  {
    // performDrop();
  }

  cleanupDrag();
}

// 执行放置操作
function performDrop() 
{

  withLock(() => 
  {
    if (dragState.targetIndex === -1 || dragState.dropType === 'none') 
    {
      return;
    }

    const sourceIndex = dragState.sourceIndex;
    const targetIndex = dragState.targetIndex;
    const dropType = dragState.dropType;

    // 防止无效放置
    if (sourceIndex === targetIndex) return;

    // 调整索引（因为移除了源节点，目标索引可能会变化）
    let adjustedTargetIndex = targetIndex;
    if (sourceIndex < targetIndex) 
    {
      adjustedTargetIndex--;
    }
    // 获取源节点
    const sourceNode = flatNodes.value[sourceIndex];
    // 从原位置移除
    flatNodes.value.splice(sourceIndex, 1);
    const adjustedTarget = flatNodes.value[adjustedTargetIndex];
    const lastNode = flatNodes.value[adjustedTargetIndex - 1];
    // 根据放置类型插入到新位置
    switch (dropType) 
    {
    case 'before':
      if (adjustedTarget.depth != sourceNode.depth) 
      {
        console.log('before切换了层级 adjustedTarget,sourceNode,lastNode', adjustedTarget, sourceNode, lastNode);
        if (lastNode) 
        {
          //查看lastNode的深度，如果是一样的，说明是resort，如果不一样，说明是move
          if (lastNode.depth == adjustedTarget.depth) 
          {
            moveOrResourt(sourceNode.id, lastNode.id, adjustedTarget.parentId);
          }
          else 
          {
            moveOrResourt(sourceNode.id, null, adjustedTarget.parentId);
          }

        }
        else 
        {
          //说明完全是最高的一级
          moveOrResourt(sourceNode.id, null, null);
        }
      }
      else 
      {
        if (!lastNode) 
        {
          //说明切换到了最高一级别
          moveOrResourt(sourceNode.id, null, null);

        }
        else if (lastNode.depth == adjustedTarget.depth) 
        {
          moveOrResourt(sourceNode.id, lastNode.id, -1);
        }
        else 
        {
          moveOrResourt(sourceNode.id, null, -1);
        }
        console.log('before切换了层级 adjustedTarget,sourceNode,lastNode', adjustedTarget, sourceNode, lastNode);
      }
      flatNodes.value.splice(adjustedTargetIndex, 0, {
        ...sourceNode,
        depth: adjustedTarget.depth,
        parentId: adjustedTarget.parentId
      });
      break;

    case 'after':
      if (adjustedTarget.depth != sourceNode.depth) 
      {
        moveOrResourt(sourceNode.id, adjustedTarget.id, adjustedTarget.parentId);
        console.log('after切换了层级', adjustedTarget, sourceNode);
      }
      else 
      {
        moveOrResourt(sourceNode.id, adjustedTarget.id, -1);
        console.log('after未切换层级', adjustedTarget, sourceNode);
      }
      flatNodes.value.splice(adjustedTargetIndex + 1, 0, {
        ...sourceNode,
        depth: adjustedTarget.depth,
        parentId: adjustedTarget.parentId
      });
      break;

    case 'child':
      if (adjustedTarget.depth != sourceNode.depth - 1) 
      {
        moveOrResourt(sourceNode.id, null, adjustedTarget.id);
        console.log('child切换了层级', adjustedTarget, sourceNode);
      }
      else 
      {
        moveOrResourt(sourceNode.id, null, -1);
        console.log('child未切换层级', adjustedTarget, sourceNode);
      }
      flatNodes.value.splice(adjustedTargetIndex + 1, 0, {
        ...sourceNode,
        depth: adjustedTarget.depth + 1,
        parentId: adjustedTarget.id
      });
      break;
    }
  });

}
function moveOrResourt(id, lastId, parentId) 
{
  if (parentId == -1) 
  {
    console.log('调用resort即可,id,lastId', id, lastId);
    resourtDir(id, lastId);
    //加入队列等待
  }
  else 
  {
    console.log('调用move即可,id,lastId,parentId', id, lastId, parentId);
    //加入队列请求
    moveDir(id, lastId, parentId);
  }
}

const willMoveDirs = [];
let moveDirItem = null;
function resourtDir(id, lastId) 
{
  willMoveDirs.push({
    url: '/dir/resort',
    id,
    lastId,
    kbId: props.kbId
  });
  startMoveDirs();
}
function moveDir(id, lastId, parentId) 
{
  willMoveDirs.push({
    url: '/dir/move',
    id,
    lastId,
    parentId,
    kbId: props.kbId
  });
  startMoveDirs();
}

function startMoveDirs() 
{
  if (moveDirItem) 
  {
    return;
  }
  moveDirItem = setInterval(async () => 
  {
    //去不断的调用api并等待
    const item = willMoveDirs.shift();
    if (item) 
    {
      loading.value += 1;
      try 
      {
        await api.post(item.url, item);
      }
      catch (error) 
      {
        console.log('移动目录失败', error);
      }
      finally 
      {
        loading.value -= 1;
      }
    }
    else 
    {
      clearInterval(moveDirItem);
      moveDirItem = null;
    }
  });
}




// 清理拖拽状态
function cleanupDrag() 
{
  dragState.isDragging = false;
  dragState.sourceNode = null;
  dragState.sourceIndex = -1;
  dragState.targetIndex = -1;
  dragState.dropType = 'none';
  dragState.draggingElement = null;
  dragState.shadowPosition = { x: 0, y: 0 };
  dragState.shadowWidth = 0;
  dragState.mouseOffset = { x: 0, y: 0 };
  dragState.containerRect = null;
  dragState.startPosition = { x: 0, y: 0 };
  dragState.hasMoved = false;
  if (dragState.clickTimeout) 
  {
    clearTimeout(dragState.clickTimeout);
    dragState.clickTimeout = null;
  }

}

</script>

<style scoped lang="less">
.menu-nodes-list{
  overflow: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar{
    display: none!important;
    width: 0!important;
    height: 0!important;
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
      background-color: #f5f5f5;
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

    // 当显示重命名输入框时，调整对齐方式
    &.renaming {
      align-items: stretch;
    }

    // 确保内容区域占满节点高度，有助于子元素垂直居中
    height: 100%;
    min-height: 24px;

    .expand-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
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
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    // 重命名输入框样式
    .arco-input-wrapper.rename-input {
      flex: 1;
      background: rgba(255, 255, 255, 0);
      border-radius: 10px;
      border: 1px solid #ccc;
      margin: -4px -8px;
      /* 抵消父容器的padding影响 */
      /* 确保输入框垂直居中对齐 */
      align-self: center;
      /* 确保输入框高度与节点内容一致 */
      min-height: 24px;
      display: flex;
      align-items: center;
      // 添加过渡效果使 appearance 更平滑
      transition: all 0.2s ease;
    }

    /* 重命名输入框内的input元素样式 */
    .rename-input input {
      /* 确保文字垂直居中 */
      line-height: 1.5;
      padding: 4px 12px;
      // 移除默认的上下内边距，因为我们已经在 wrapper 上设置了
      padding-top: 0;
      padding-bottom: 0;
      // 确保输入框占满容器高度
      height: 100%;
      // 文本居中
      text-align: left;
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
      color: #999;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f0f0f0;
      }

      svg {
        width: 14px;
        height: 14px;
      }
    }
  }

  // 悬停时显示右侧图标
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
        background-color: @primary-6;
        border-radius: 1px;
      }
    }

    // &.indicator-child {
    //   top: 50%;
    //   left: 50%;
    //   transform: translate(-50%, -50%);

    //   .indicator-line {
    //     width: 12px;
    //     height: 12px;
    //     background-color: #2196f3;
    //     border-radius: 50%;
    //     border: 2px solid white;
    //   }
    // }
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
      background: white;

      .expand-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;

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
        color: #333;
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
      color: #999;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f0f0f0;
      }

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
  color: #414141;
  vertical-align: middle;
}

/* 加载状态样式 */
.loading-container {
  left: 25%;
  z-index: 1001;
  position: absolute;
  bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}
</style>1