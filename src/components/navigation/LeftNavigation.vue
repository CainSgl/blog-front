<template>
  <div class="left-navigation">
    <!-- 首页单独渲染 -->
    <div class="nav-item nav-link" @click="handleClick(menuData[0])">
      <component :is="menuData[0].icon" class="nav-icon" />
      <span>{{ menuData[0].label }}</span>
    </div>

    <!-- 其他可展开的分组 -->
    <a-collapse :default-active-key="defaultActiveKeys" :bordered="false">
      <a-collapse-item 
        v-for="item in menuData.slice(1)" 
        :key="item.key" 
        :header="item.label"
      >
        <div class="nav-children">
          <a-link 
            v-for="child in item.children" 
            :key="child.key"
            :href="child.to"
            class="nav-child-item"
            :class="{ disabled: child.disabled }"
            @click.prevent="!child.disabled && handleClick(child)"
          >
            <component :is="child.icon" class="nav-icon" />
            <span>{{ child.label }}</span>
          </a-link>
        </div>
      </a-collapse-item>
    </a-collapse>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {
  IconBook,
  IconClockCircle,
  IconCloud,
  IconFile,
  IconFire,
  IconHeart,
  IconHistory,
  IconHome,
  IconMessage,
  IconStar,
  IconUser
} from '@arco-design/web-vue/es/icon';

const router = useRouter();

const menuData = [
  {
    key: 'home',
    label: '首页',
    icon: IconHome,
    to: '/'
  },
  {
    key: 'my',
    label: '我的',
    icon: IconUser,
    children: [
      { key: 'profile', label: '个人主页', icon: IconUser, to: '/profile' },
      { key: 'kb', label: '知识库', icon: IconBook, to: '/my/kb' },
      { key: 'doc', label: '文档', icon: IconFile, to: '/my/doc' },
      { key: 'cloud', label: '云存储', icon: IconCloud, to: '/my/cloud' },
      { key: 'likes', label: '我的点赞', icon: IconHeart, to: '/my/likes' },
      { key: 'history', label: '历史记录', icon: IconHistory, to: '/my/history' }
    ]
  },
  {
    key: 'blog',
    label: '博客',
    icon: IconFile,
    children: [
      { key: 'latest-blog', label: '最新博客', icon: IconFire, to: '/blog/latest' },
      { key: 'hot-blog', label: '最热博客', icon: IconStar, to: '/blog/hot' }
    ]
  },
  {
    key: 'knowledge',
    label: '知识库',
    icon: IconBook,
    children: [
      { key: 'latest-kb', label: '最新知识库', icon: IconFire, to: '/kb/latest' },
      { key: 'hot-kb', label: '最热知识库', icon: IconStar, to: '/kb/hot' }
    ]
  },
  {
    key: 'chat',
    label: '在线聊天',
    icon: IconMessage,
    children: [
      { key: 'my-chat', label: '我的聊天', icon: IconMessage, to: '/chat/my' }
    ]
  },
  {
    key: 'topic',
    label: '话题',
    icon: IconClockCircle,
    children: [
      { key: 'coming-soon', label: '敬请期待', icon: IconClockCircle, disabled: true }
    ]
  }
];

const defaultActiveKeys = ref(menuData.slice(1).map(item => item.key));

const handleClick = (item) => {
  if (item.to) {
    console.log('导航到:', item.to);
    // router.push(item.to);
  }
};
</script>

<style scoped lang="less">
.left-navigation {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  
  .nav-item {
    display: flex;
    align-items: center;
    padding: 14px 20px;
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 1px solid #f0f0f0;
    
    .nav-icon {
      font-size: 18px;
      margin-right: 12px;
      color: #4e5969;
    }
    
    span {
      font-size: 15px;
      color: #1d2129;
      font-weight: 500;
    }
    
    &:hover {
      background: #f7f8fa;
      
      .nav-icon {
        color: #165dff;
      }
      
      span {
        color: #165dff;
      }
    }
  }
  
  :deep(.arco-collapse) {
    background: transparent;
    border: none;
    
    .arco-collapse-item {
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
    }
    
    .arco-collapse-item-header {
      padding: 14px 20px;
      font-weight: 500;
      font-size: 15px;
      color: #1d2129;
      background: transparent;
      
      &:hover {
        background: #f7f8fa;
      }
      
      .arco-collapse-item-header-title {
        display: flex;
        align-items: center;
      }
    }
    
    .arco-collapse-item-content {
      padding: 0;
      background: #fafafa;
    }
    
    .arco-collapse-item-content-box {
      padding: 8px 0;
    }
  }
  
  .nav-children {
    display: flex;
    flex-direction: column;
    
    .nav-child-item {
      display: flex;
      align-items: center;
      padding: 10px 20px 10px 48px;
      color: #4e5969;
      text-decoration: none;
      transition: all 0.2s;
      
      .nav-icon {
        font-size: 16px;
        margin-right: 10px;
      }
      
      span {
        font-size: 14px;
      }
      
      &:hover:not(.disabled) {
        background: #e8f3ff;
        color: #165dff;
      }
      
      &.disabled {
        color: #c9cdd4;
        cursor: not-allowed;
        
        .nav-icon {
          color: #c9cdd4;
        }
      }
    }
  }
}
</style>
