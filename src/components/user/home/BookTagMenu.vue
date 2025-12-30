<template>
  <div class="menu" :class="{ collapsed: isCollapsed }">
    <div class="collapse-btn" @click="toggleCollapse">
      <IconMenuUnfold v-if="isCollapsed" />
      <IconMenuFold v-else />
    </div>
    <div 
      v-for="item in menuItems" 
      :key="item.key"
      class="menu-item"
      :class="{ 'active': isActive(item.key), [item.bgClass]: true }"
      @click="handleClick(item.key)"
    >
      <component :is="item.icon" class="icon" />
      <span class="text" v-if="!isCollapsed">{{ item.title }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IconHome,
  IconBook,
  IconFile,
  IconCloud,
  IconMenuFold,
  IconMenuUnfold
} from '@arco-design/web-vue/es/icon';

const emit = defineEmits(['collapse-change']);

const route = useRoute();
const router = useRouter();

const isCollapsed = ref(false);

const menuItems = [
  {
    key: 'UserHomeIndex',
    title: '主页',
    icon: IconHome,
    bgClass: 'bg-home'
  },
  {
    key: 'UserKnowledge',
    title: '知识库',
    icon: IconBook,
    bgClass: 'bg-knowledge'
  },
  {
    key: 'UserDocs',
    title: '文档',
    icon: IconFile,
    bgClass: 'bg-docs'
  },
  {
    key: 'UserCloud',
    title: '云存储',
    icon: IconCloud,
    bgClass: 'bg-cloud'
  }
];

const isActive = (key) => {
  return route.name === key;
};

const handleClick = (key) => {
  router.push({
    name: key
  });
};

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('collapse-change', isCollapsed.value);
};
</script>

<style lang="less" scoped>
.menu {
  display: flex;
  flex-direction: column;
  justify-content: center; // 垂直居中对齐
  height: 100%;

  position: relative;
  
  .collapse-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    cursor: pointer;
    z-index: 10;
    font-size: 18px;
    color: #fff;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
  
  .menu-item {
    width: 80%;
    margin: 16px 0;  
    padding: 16px 16px 16px 8px; 
    cursor: pointer;
    display: flex;
    align-items: center;
    border-radius: 0 20px 20px 0; 
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    
    .icon {
      font-size: 22px;  // 增大图标大小
      margin-right: 10px;
      color: #fff;
      z-index: 2;
    }
    
    .text {
      font-size: 16px;  // 增大字体大小
      color: #fff;
      z-index: 2;
    }
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.15); // 半透明灰色实现颜色变深效果
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 1;
    }

    &:hover {
      &::before {
        opacity: 1;
      }
      .icon {
        color: #fff;
      }
    }
    
    &.active {
      width: 90%; // 选中时伸展更长
      padding-left: 24px; // 选中时增加左边距，产生伸展效果
      .icon,
      .text {
        color: #fff;
      }
    }
  }
  
  // 为每个菜单项定义不同的背景色
  .bg-home {
    background: linear-gradient(90deg, #409EFF, #5ca0f9);
  }
  
  .bg-knowledge {
    background: linear-gradient(90deg, #67C23A, #7ecb5e);
  }
  
  .bg-docs {
    background: linear-gradient(90deg, #E6A23C, #f0c75f);
  }
  
  .bg-cloud {
    background: linear-gradient(90deg, #F56C6C, #f88989);
  }
  
  &.collapsed {
    .menu-item {
      width: 50px;
      justify-content: center;
      padding: 16px 0;
      
      .text {
        display: none;
      }
      
      .icon {
        margin-right: 0;
      }
    }
  }
}
</style>