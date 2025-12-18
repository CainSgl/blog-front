<template>
    <div class="tree-menu" @mousemove="handleMouseMove" @mouseup="handleMouseUp" @mouseleave="handleMouseLeave">
    <!-- 搜索框 -->
    <div class="search-container" v-if="edit">
      <Input 
        v-model="searchText" 
        placeholder="搜索节点..." 
        allow-clear
        @input="handleSearch"
      >
        <template #prefix>
          <IconSearch />
        </template>
      </Input>
    </div>
    <TransitionGroup 
      name="node-list" 
      tag="div"
    >
      <div  
        v-for="(node, index) in flatNodes" 
        :key="node.id"
        class="tree-node"
        :class="getNodeClasses(node, index)"
        :style="{ marginLeft: `${node.depth * 20}px` }"
        @mousedown="handleMouseDown($event, node, index)"
      >
        <div class="node-content">
          <span 
            class="expand-icon"
            :class="{ expanded: getNodeExpandedState(node) }"
          >
            <IconDown v-if="getNodeExpandedState(node)" />
            <IconRight v-else-if="node.children && node.children.length > 0" />
          </span>
          <span class="node-name">{{ node.name || '未命名' }}</span>
          
          <!-- 右侧操作图标-->
           <div 
             class="node-actions" 
             :class="{ 'show-actions': menuState.openNodeId === node.id && (menuState.openMenuType === 'add' || menuState.openMenuType === 'more') }"
             v-show="!dragState.isDragging && (edit || (menuState.openNodeId === node.id && (menuState.openMenuType === 'add' || menuState.openMenuType === 'more')))">

              <Dropdown 
                trigger="click" 
                placement="bottom" 
                :popup-visible="menuState.openNodeId === node.id && menuState.openMenuType === 'add'"
                @select="(key) => handleMenuSelect(key, node)"
                @popup-visible-change="(visible) => handleAddMenuToggle(visible, node)"
                v-if="!node.postId"
                position="br"
              >
               <IconPlus class="action-icon" @click.stop @mousedown.stop />
               <template #content>
                 <Menu>
                   <Menu.Item key="newPost"  @click="() => slectHandler('newPost', node, 'add')"><IconDriveFile class="menu-icon" />文档</Menu.Item>
                   <Menu.Item key="import"  @click="() => slectHandler('import', node, 'add')"><IconImport   class="menu-icon" />导入</Menu.Item>
                   <Menu.Item key="newDir"  @click="() => slectHandler('newDir', node, 'add')"><IconFolder  class="menu-icon" />目录</Menu.Item>
                 </Menu>
               </template>
             </Dropdown>
             <Dropdown 
                trigger="click" 
                placement="bottom" 
                :popup-visible="menuState.openNodeId === node.id && menuState.openMenuType === 'more'"
                @select="(value) => handleMoreActions(value, node)"
                @popup-visible-change="(visible) => handleMoreMenuToggle(visible, node)"
                position="bl"
                :popup-max-height="false"
              >
               <IconMore class="action-icon" @click.stop @mousedown.stop />
               <template #content>
                 <Menu>
                   <Menu.Item key="rename"   @click="() => slectHandler('rename', node, 'more')" > <IconEdit  class="menu-icon" /> 重命名</Menu.Item>
                   <Menu.Item key="edit-doc" @click="() => slectHandler('edit-doc', node, 'more')" ><IconPen  class="menu-icon"/>  编辑文档</Menu.Item>
                   <Menu.Item key="copy-link"  @click="() => slectHandler('copy-link', node, 'more')" >  <IconCopy  class="menu-icon"/>复制链接</Menu.Item>
                    <Menu.Item key="pin-top"  @click="() => slectHandler('pin-top', node, 'more')" > <IconToTop  class="menu-icon"/> 置顶文档</Menu.Item>
                    <Menu.Item key="open-new-tab"  @click="() => slectHandler('open-new-tab', node, 'more')" > <IconLaunch  class="menu-icon"/>在新标签页打开</Menu.Item>
                   <Menu.Item key="delete" :style="{ color: 'rgb(var(--red-6))' }"  @click="() => slectHandler('delete', node, 'more')" ><IconDelete  class="menu-icon"/> 删除</Menu.Item>
                 </Menu>
               </template>
             </Dropdown>
           </div>
        </div>

        <!-- 拖拽预览指示器 -->
        <div 
          v-if="dragState.isDragging && dragState.targetIndex === index"
          class="drag-indicator"
          :class="`indicator-${dragState.dropType}`"
          :style="{ paddingLeft: `${(node.depth)}px` }"
        >
          <div class="indicator-line"></div>
        </div>
      </div>
    </TransitionGroup>
    <!-- 拖拽阴影元素 -->
    <div 
      v-if="dragState.isDragging && dragState.draggingElement"
      class="dragging-shadow"
      :style="{
        left: dragState.shadowPosition.x + 'px',
        top: dragState.shadowPosition.y + 'px',
        width: dragState.shadowWidth + 'px'
      }"
    >
      <div class="node-content" :style="{ paddingLeft: `${dragState.sourceNode?.depth * 20 || 0}px` }">
        <span 
          v-if="dragState.sourceNode?.children && dragState.sourceNode.children.length > 0" 
          class="expand-icon"
        >
          <IconRight />
        </span>
        <!-- <span v-else class="expand-icon-placeholder">•</span> -->
        <span class="node-name">{{ dragState.sourceNode?.name }}</span>
      </div>
    </div>
    <!-- 加载状态指示器 -->
    <div v-if="loading>0" class="loading-container">
      <Spin tip="数据正在拼命发送到服务器中...">
      <template #icon>
      <IconSync/>
       </template>
      </Spin>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { IconDown, IconRight, IconPlus, IconMore, IconImport, IconFolder, IconDriveFile,IconEdit, IconPen, IconCopy, IconToTop, IconLaunch, IconDelete ,IconSync, IconSearch } from '@arco-design/web-vue/es/icon';
import { Dropdown, Menu, Spin, Input } from '@arco-design/web-vue';
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
  kbId:{
    type:String,
    default:"-1",
  }
});

const emit = defineEmits(['clickPost', 'trigger']);

// 初始化路由
const router = useRouter();

// 创建内部loading状态
const loading = ref(0);

// 创建操作锁，防止并发操作
const operationLock = ref(false);

// 锁定操作函数
async function withLock(operation) {
  // 如果已经有操作在进行中，直接返回
  if (operationLock.value) {
    console.warn('操作被拒绝：已有操作正在进行中');
    return;
  }
  
  // 获取锁
  operationLock.value = true;
  
  try {
    // 执行操作
    await operation();
  } finally {
    // 释放锁
    operationLock.value = false;
  }
}

// 创建操作处理函数映射对象
const actionHandlers = {
  'newPost': async (node) => 
  {
    await withLock(async () => {
      loading.value +=1;
      //创建并跳转
      try
      {
        const {data}= await api.post('/post',{
          title:'无标题文档',
          kbId:props.kbId,
          parentId:node.id,
        });
        const newNode={
          id:data.dirId,
          name:'无标题文档',
          parentId:node.id,
          postId:data.post.id,
          depth:node.depth+1,
        };
        addChildNode(node, newNode);
        //跳转到编辑页面并携带postId参数
        router.push({ 
          name: 'KBEdit', 
          query: { p: data.post.id ,kb:props.kbId}
        });
      }
      catch(error)
      {
        console.error('创建文档失败:', error);
      }
      finally
      {
        loading.value-=1;
      }
    });
  },
  'newDir': (node) => 
  {
    withLock(() => {
      // 实现新建目录逻辑
      console.log('新建目录:', node);
    });
  },
  'import': (node) => 
  {
    withLock(() => {
      // 实现导入逻辑
      console.log('导入到节点:', node);
    });
  },
  'rename': (node) => 
  {
    withLock(() => {
      // 实现重命名逻辑
      console.log('重命名节点:', node);
    });
  },
  'edit-doc': (node) => 
  {
    withLock(() => {
      // 实现编辑文档逻辑
      console.log('编辑文档:', node);
      if (node.postId) {
        router.push({ 
          name: 'KBEdit', 
          query: { p: node.postId, kb: props.kbId }
        });
      }
    });
  }, 
  'copy-link': (node) => 
  {
    withLock(() => {
      // 实现复制链接逻辑
      console.log('复制链接:', node);
      if (node.postId) {
        const link = `${window.location.origin}/post/${node.postId}`;
        navigator.clipboard.writeText(link).then(() => {
          console.log('链接已复制到剪贴板');
        }).catch(err => {
          console.error('复制链接失败:', err);
        });
      }
    });
  },
  'pin-top': (node) => 
  {
    withLock(() => {
      // 实现置顶文档逻辑
      console.log('置顶文档:', node);
    });
  },
  'open-new-tab': (node) => 
  {
    withLock(() => {
      // 实现新标签页打开逻辑
      console.log('新标签页打开:', node);
      if (node.postId) {
        const routeData = router.resolve({ 
          name: 'KBEdit', 
          query: { p: node.postId, kb: props.kbId }
        });
        window.open(routeData.href, '_blank');
      }
    });
  },
  'delete': async (node) => 
  {
    await withLock(async () => {
      //删除dir就行
      loading.value +=1;
      try 
      {
        const {data} = await api.delete('/dir',{
          'kbId': props.kbId,
          'dirId': node.id
        });
        console.log("本次目录删除影响了",data,"个文章，需要用户注意");
        // 移除对应的dir节点
        removeNode(node);
      }
      catch (error) 
      {
        console.error('删除目录失败:', error);
      }
      finally 
      {
        loading.value -=1;
      }
    });
  }
};

// 添加子节点
function addChildNode(parentNode, childNode) 
{
  if (operationLock.value) {
    console.warn('addChildNode操作被拒绝：已有操作正在进行中');
    return;
  }
  
  if(getNodeExpandedState(parentNode)) 
  {
    //找到当前节点在扁平化数组中的位置
    const currentIndex = flatNodes.value.findIndex(item => item.id === parentNode.id);
    //找到该节点的所有子节点，插入到最后一个子节点后面
    let insertIndex = currentIndex + 1;
    //遍历找到最后一个子节点的位置
    while(insertIndex < flatNodes.value.length && flatNodes.value[insertIndex].depth > parentNode.depth) 
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
}

// 移除节点
function removeNode(node) 
{
  if (operationLock.value) {
    console.warn('removeNode操作被拒绝：已有操作正在进行中');
    return;
  }
  
  // 找到当前节点在扁平化数组中的位置
  if(getNodeExpandedState(node))
{
  toggleNode(node);
}
  const currentIndex = flatNodes.value.findIndex(item => item.id === node.id);

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

// 原始节点数据缓存
const cachedTreeData = ref([]);

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
  if (operationLock.value) {
    console.warn('flattenTree操作被拒绝：已有操作正在进行中');
    return [];
  }
  
  const result = [];
  
  for (const node of nodes) 
  {
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
  console.log(result)
  return result;
}

// 递归过滤节点
function filterNodes(nodes, keyword) {
  if (!keyword) return nodes;
  
  const filteredNodes = [];
  
  for (const node of nodes) {
    // 检查当前节点是否匹配
    const isMatch = node.name && node.name.toLowerCase().includes(keyword.toLowerCase());
    
    // 创建节点副本
    const nodeCopy = { ...node };
    
    // 递归过滤子节点
    if (node.children && node.children.length > 0) {
      nodeCopy.children = filterNodes(node.children, keyword);
    }
    
    // 如果当前节点匹配或有匹配的子节点，则添加到结果中
    if (isMatch || (nodeCopy.children && nodeCopy.children.length > 0)) {
      // 如果当前节点不匹配但子节点匹配，清除children数组以避免显示不匹配的中间节点
      if (!isMatch && nodeCopy.children && nodeCopy.children.length === 0) {
        delete nodeCopy.children;
      }
      filteredNodes.push(nodeCopy);
    }
  }
  
  return filteredNodes;
}

// 处理搜索
function handleSearch(value) {
  if (operationLock.value) {
    console.warn('handleSearch操作被拒绝：已有操作正在进行中');
    return;
  }
  
  if (!value) {
    // 如果搜索文本为空，恢复原始数据
    flatNodes.value = flattenTree(cachedTreeData.value);
  } else {
    // 过滤节点
    const filteredData = filterNodes(cachedTreeData.value, value);
    flatNodes.value = flattenTree(filteredData);
  }
}

// 监听原始数据变化，重新扁平化
watch(
  () => props.treeData,
  (newData) => 
  {
    if (operationLock.value) {
      console.warn('监听器操作被拒绝：已有操作正在进行中');
      return;
    }
    
    // 缓存原始数据
    cachedTreeData.value = JSON.parse(JSON.stringify(newData));
    flatNodes.value = flattenTree(newData);
    for(let i=0;i<flatNodes.value.length;i++)
    {
      flatNodes.value[i].children=[];
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
  if(node.children && node.children.length>0)
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
function toggleNode(node) 
{
  if (operationLock.value) {
    console.warn('toggleNode操作被拒绝：已有操作正在进行中');
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
      me.children=[];
    }
  }
  
  function toCollapse(index) 
  {

    if (index+1>=flatNodes.value.length) 
    {
      return;
    }
    const me = flatNodes.value[index];
    if(me.children && me.children.length>0)
    {
      return
    }
    //如果下一个节点的深度刚好是自己的深度+1，说明下一个节点是直接子节点
    while(true)
    {
      const next=flatNodes.value[index+1];
      if(!next)
     {
       return
      }
      if(next.depth===me.depth+1)
      {
        toCollapse(index+1);
        //移除他，并加入到自己的子节点里去
        me.children.push(next);
        flatNodes.value.splice(index+1,1);
      }
      else
      {
        break
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
const DRAG_THRESHOLD = 5; // 最小拖拽距离

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
  
  // 如果 edit 为 false，不允许拖拽功能
  if (!props.edit) 
  {
    event.preventDefault();
    // 如果节点存在 postId，调用父组件的 clickPost 方法
    if (node.postId) 
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
  // 如果 edit 为 false，不允许开始拖拽
  if (!props.edit) 
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
  
  // 如果 edit 为 false，不允许拖拽
  if (!props.edit) 
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
  if (operationLock.value) {
    console.warn('performDrop操作被拒绝：已有操作正在进行中');
    return;
  }
  
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
  
  // 根据放置类型插入到新位置
  switch (dropType) 
  {
  case 'before':
    flatNodes.value.splice(adjustedTargetIndex, 0, {
      ...sourceNode,
      depth: flatNodes.value[adjustedTargetIndex].depth,
      parentId: flatNodes.value[adjustedTargetIndex].parentId
    });
    break;
      
  case 'after':
    flatNodes.value.splice(adjustedTargetIndex + 1, 0, {
      ...sourceNode,
      depth: flatNodes.value[adjustedTargetIndex].depth,
      parentId: flatNodes.value[adjustedTargetIndex].parentId
    });
    break;
      
  case 'child':
    flatNodes.value.splice(adjustedTargetIndex + 1, 0, {
      ...sourceNode,
      depth: flatNodes.value[adjustedTargetIndex].depth + 1,
      parentId: flatNodes.value[adjustedTargetIndex].id
    });
    break;
  }
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
.tree-menu {
  user-select: none;
  .tree-menu-container {
    position: relative;
  }
  
  .default {
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
    opacity:1;
  }
  
  .tree-node {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    margin: 2px 0;
    transition: all 0.2s ease;
    position: relative;
    border: 2px solid transparent;
  }
  
  .tree-node .node-content {
    display: flex;
    align-items: center;
    gap: 8px;
    
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
    opacity: 0.4;
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
  
  .arco-input-wrapper {
    border-radius: 16px;
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
 color:#414141;
 vertical-align: middle;
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

</style>