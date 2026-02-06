<template>
    <!-- 遮罩层（仅手机端） -->
    <div v-if="!collapsed" class="sidebar-mask" @click="toggleCollapse"></div>
    <a-button type="text" size="large" @click="toggleCollapse" class="collapse-btn mobile-only-btn">
        <template #icon>
            <icon-menu-fold size="large" v-if="!collapsed" />
            <icon-menu-unfold size="large" v-else />
        </template>
    </a-button>
    <div class="sidebar" :class="{ 'sidebar-collapsed': collapsed }">
        <div class="sidebar-header">
            <h2 v-show="!collapsed" style="color: var(--color-neutral-10);">关于本站</h2>
            <a-button type="text" size="large" @click="toggleCollapse" class="collapse-btn">
                <template #icon>
                    <icon-menu-fold size="large" v-if="!collapsed" />
                    <icon-menu-unfold size="large" v-else />
                </template>
            </a-button>
        </div>

        <div v-show="!collapsed" class="sidebar-content">
            <!-- 搜索框 -->
            <a-input-search v-model="searchKeyword" placeholder="搜索文档..." class="search-input" allow-clear />

            <!-- 统计信息 -->
            <div class="stats-info">
                <a-space>
                    <a-tag color="blue" size="medium" style="cursor:pointer;user-select: none;"
                        @click="goToHome">首页</a-tag>
                    <a-tag color="arcoblue" size="medium">{{ rawTreeData.length }} 个分类</a-tag>
                    <a-tag color="green" size="medium">{{ totalArticles }} 篇文章</a-tag>

                </a-space>
            </div>

            <!-- 树形菜单 -->
            <div class="tree-container" ref="treeContainerRef">
                <a-spin :loading="loading" tip="加载中" style="display: block;">
                    <a-tree v-if="filteredTreeData.length > 0" :data="filteredTreeData"
                        v-model:selected-keys="selectedKeys" :show-line="false" :block-node="true"
                        :default-expand-all="true" @select="handleNodeSelect" :fieldNames="{
                            key: 'id',
                        }">
                        <template #title="nodeData">
                            <div class="tree-node-title" :id="`tree-node-${nodeData.id}`">
                                <span class="node-text">{{ nodeData.name }}</span>
                            </div>
                        </template>
                    </a-tree>
                    <a-empty v-else-if="!loading" description="没有找到匹配的文档" />
                    <div v-else style="height: 300px;width: 100%;"> </div>
                </a-spin>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IconMenuFold, IconMenuUnfold } from '@arco-design/web-vue/es/icon';
import api from '@/api/index.js';
import { Message } from '@arco-design/web-vue';

const emit = defineEmits(['node-select']);
const router = useRouter();
const route = useRoute();

// 内部状态
const collapsed = ref(false);
const rawTreeData = ref([]);
const selectedKeys = ref([]);
const searchKeyword = ref('');
const treeContainerRef = ref(null);
const loading = ref(true);
// 加载树形数据
const loadTreeData = async () => {
    try {
        const { data } = await api.get('/system/about');
        rawTreeData.value = data || [];
        // 数据加载完成后，解析路由并选中对应节点
        await nextTick();
        parseRouteAndSelectNode();
    } catch (error) {
        console.error('获取目录结构失败:', error);
        Message.error('获取目录结构失败');
    } finally {
        loading.value = false;
    }
};

// 过滤树形数据（搜索功能）
const filteredTreeData = computed(() => {
    if (!searchKeyword.value.trim()) {
        return rawTreeData.value;
    }

    const keyword = searchKeyword.value.toLowerCase();

    const filterNodes = (nodes) => {
        return nodes.reduce((acc, node) => {
            const matchesName = node.name.toLowerCase().includes(keyword);
            const filteredChildren = node.children ? filterNodes(node.children) : [];

            if (matchesName || filteredChildren.length > 0) {
                acc.push({
                    ...node,
                    children: filteredChildren
                });
            }

            return acc;
        }, []);
    };

    return filterNodes(rawTreeData.value);
});

// 计算总文章数
const totalArticles = computed(() => {
    const countNodes = (nodes) => {
        let count = 0;
        for (const node of nodes) {
            if (node.postId) {
                count++;
            }
            if (node.children && node.children.length > 0) {
                count += countNodes(node.children);
            }
        }
        return count;
    };
    return countNodes(rawTreeData.value);
});


// 切换侧边栏折叠状态
const toggleCollapse = () => {
    collapsed.value = !collapsed.value;
};

// 返回首页
const goToHome = () => {
    router.push('/about');
    selectedKeys.value = [];
    emit('node-select', null);
};

// 处理节点选择
const handleNodeSelect = (_keys, data) => {
    if (data.node) {
        // 向父组件发送选中事件
        emit('node-select', data.node);
    }
};

// 滚动到选中的节点
const scrollToSelectedNode = (key) => {
    if (!key || !treeContainerRef.value) return;

    nextTick(() => {
        const selectedElement = document.getElementById(`tree-node-${key}`);

        if (selectedElement) {
            selectedElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    });
};

// 查找节点路径
const findNodePath = (nodes, targetKey, path = []) => {
    for (const node of nodes) {
        const currentPath = [...path, { key: node.key, name: node.name }];
        if (node.key === targetKey) {
            return currentPath;
        }
        if (node.children && node.children.length > 0) {
            const result = findNodePath(node.children, targetKey, currentPath);
            if (result) {
                return result;
            }
        }
    }
    return null;
};

// 根据 id 查找节点
const findNodeById = (nodes, id) => {
    for (const node of nodes) {
        if (node.id == id) {
            return node;
        }
        if (node.children && node.children.length > 0) {
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
    }
    return null;
};

// 解析路由并选中对应节点
const parseRouteAndSelectNode = () => {
    const path = route.path;

    // 如果是欢迎页，不选中任何节点
    if (path === '/about') {
        return;
    }

    let nodeId = null;

    // 解析路由获取节点 id
    if (path.startsWith('/about/view/')) {
        nodeId = path.replace('/about/view/', '');
    } else if (path.startsWith('/about/dir/')) {
        nodeId = path.replace('/about/dir/', '');
    }
    console.log("初始化", nodeId)
    console.log(rawTreeData.value)
    // 如果有 id，查找对应节点并通知父组件
    if (nodeId && rawTreeData.value.length > 0) {
        const node = findNodeById(rawTreeData.value, nodeId);
        if (node) {
            selectedKeys.value = [node.id];
            emit('node-select', node);
            nextTick(() => {
                scrollToSelectedNode(node.id);
            });
        }
    }
};



// 暴露给父组件的方法：选中指定节点
const selectNodeById = (id) => {
    const node = findNodeById(rawTreeData.value, id);
    if (node) {
        selectedKeys.value = [node.id];
        nextTick(() => {
            scrollToSelectedNode(node.id);
        });
        // 通知父组件
        emit('node-select', node);
    }
};

// 暴露方法给父组件
defineExpose({
    selectNodeById,
    rawTreeData, // 暴露树形数据给父组件
    toggleCollapse // 暴露切换方法给父组件
});

onMounted(() => {
    loadTreeData();
    // 手机端默认折叠
    if (window.innerWidth <= 768) {
        collapsed.value = true;
    }
});
</script>

<style scoped lang="less">
.sidebar {
    width: 360px;
    min-width: 360px;
    background-color: var(--color-bg-2);
    border-right: 1px solid var(--color-border-2);
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease, min-width 0.3s ease;
    overflow: hidden;

  
    &.sidebar-collapsed {
        width: 60px;
        min-width: 60px;
    }
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 16px;
    border-bottom: 1px solid var(--color-border-2);
    position: relative;

    h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--color-neutral-10);
    }

    .collapse-btn {
        flex-shrink: 0;
        transition: all 0.3s ease;
    }
}

.sidebar-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 16px;
}

.search-input {
    margin-bottom: 18px;
}

.stats-info {
    margin-bottom: 18px;
}

.tree-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-thumb {
        background: var(--color-border-3);
        border-radius: 3px;
    }
}

.tree-node-title {
    display: flex;
    align-items: center;
    width: 100%;

    .node-icon {
        flex-shrink: 0;
        font-size: 15px;
        color: var(--color-text-3);
    }

    .node-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 15px;
    }

    .count-tag {
        flex-shrink: 0;
        margin-left: auto;
    }
}

:deep(.arco-tree-node-title) {
    padding: 6px 10px;
    margin: 2px 2px;
    border-radius: 6px;
    transition: all 0.2s;

    &:hover {
        background: var(--color-fill-2);
    }
}

:deep(.arco-tree-node-selected .arco-tree-node-title) {
    background: var(--color-primary-light-1) !important;
    color: rgb(var(--primary-6)) !important;
    font-weight: 500;
}

:deep(.arco-tree-node-switcher) {
    color: var(--color-text-3);
}

.sidebar-mask {
    display: none;
}

.mobile-only-btn {
    display: none;
}

@media (max-width: 768px) {
    .mobile-only-btn {
        display: flex;
    }
    .sidebar-mask {
        display: block;
        position: fixed;
        top: 64px;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 90;
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }

        to {
            opacity: 1;
        }
    }

    .sidebar {
        position: fixed;
        left: 0;
        top: 64px;
        height: calc(100vh - 64px);
        z-index: 95;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
        transform: translateX(0);
        transition: transform 0.3s ease;
        width: 85vw;
        min-width: 85vw;
        max-width: 360px;

        &.sidebar-collapsed {
            transform: translateX(-100%);
            width: 0;
            min-width: 0;
            box-shadow: none;
            border-right: none;
        }
    }

    .sidebar-header {
        padding: 16px 8px;

        h2 {
            font-size: 16px;
        }

        .collapse-btn {
            background-color: var(--color-bg-3);
            border-radius: 8px;

            &:hover {
                background-color: var(--color-fill-3);
            }
        }
    }

    .sidebar-collapsed .sidebar-header {
        justify-content: center;
        padding: 16px 4px;
        border-bottom: none;

        .collapse-btn {
            background-color: rgb(var(--primary-6));
            color: white;
            box-shadow: 0 2px 8px rgba(var(--primary-6), 0.3);
            animation: pulse 2s ease-in-out infinite;

            &:hover {
                background-color: rgb(var(--primary-5));
                animation: none;
            }
        }
    }

    @keyframes pulse {

        0%,
        100% {
            box-shadow: 0 2px 8px rgba(var(--primary-6), 0.3);
        }

        50% {
            box-shadow: 0 2px 16px rgba(var(--primary-6), 0.6);
        }
    }

    // 移动端浮动按钮（当侧边栏完全隐藏时显示）
    .sidebar-collapsed .collapse-btn {
        position: fixed !important;
        left: 12px !important;
        top: 80px !important;
        width: 44px !important;
        height: 44px !important;
        background-color: rgb(var(--primary-6)) !important;
        color: white !important;
        border-radius: 50% !important;
        box-shadow: 0 2px 12px rgba(var(--primary-6), 0.4) !important;
        z-index: 100 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 !important;
        animation: pulse 2s ease-in-out infinite;

        &:hover {
            background-color: rgb(var(--primary-5)) !important;
            animation: none;
        }
    }

    .sidebar-content {
        padding: 12px;
    }

    .search-input {
        margin-bottom: 12px;
    }

    .stats-info {
        margin-bottom: 12px;
    }
}
</style>
