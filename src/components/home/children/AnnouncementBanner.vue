<template>
  <div class="announcement-banner">
    <div class="announcement-header">
      <a-typography-title :heading="5">公告</a-typography-title>
    </div>
    <div v-for="(item, index) in announcements" :key="item.id">
      <router-link :to="{ name: 'Announcement', params: { id: item.id } }" class="announcement-link" target="_blank">
        <div class="announcement-item">
          <div class="announcement-date">{{ formatDate(item.createdAt) }}</div>
          <div class="announcement-content">
            <cImg class="announcement-image" :src="item.img" v-if="item.img" />
            <div class="announcement-text">
              <div class="announcement-title-row">
                <h3 class="announcement-title">{{ item.title }}</h3>
                <div class="announcement-tags" v-if="item.tags && item.tags.length">
                  <a-tag v-for="tag in item.tags" :key="tag" size="small" color="arcoblue">{{ tag }}</a-tag>
                </div>
              </div>
              <div class="announcement-summary">{{ item.summary }}</div>
            </div>
          </div>
        </div>
      </router-link>
      <a-divider v-if="index < announcements.length - 1" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import cImg from '@/components/base/cImg.vue';
import api from '@/api/index';

const announcements = ref([]);

onMounted(async () =>
{
  const {data}= await api.get('/system/announcement');
  announcements.value=data;
});

const formatDate = (dateString) =>
{
  const now = new Date();
  const targetDate = new Date(dateString);
  const diffMs = now - targetDate;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds > 604800)
  {
    return targetDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  if (diffSeconds < 60)
  {
    return `${diffSeconds}秒前`;
  }
  else if (diffSeconds < 3600)
  {
    return `${Math.floor(diffSeconds / 60)}分钟前`;
  }
  else if (diffSeconds < 86400)
  {
    return `${Math.floor(diffSeconds / 3600)}小时前`;
  }
  else
  {
    return `${Math.floor(diffSeconds / 86400)}天前`;
  }
};
</script>

<style lang="less" scoped>
.announcement-banner {
  width: 100%;
  max-height: 60dvh;
  overflow-y: auto;
  background: transparent;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.announcement-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e4e7ed;

  .arco-typography {
    margin: 0;
    font-weight: 600;
    color: #1d2129;
  }
}

.announcement-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.announcement-item {
  padding: 16px 0;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    .announcement-title {
      color: @primary-4;
    }
  }
}

.announcement-date {
  margin-bottom: 8px;
  font-size: 12px;
  color: #86909c;
}

.announcement-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.announcement-image {
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.announcement-text {
  flex: 1;
  min-width: 0;
}

.announcement-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.announcement-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1D2129;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.announcement-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.announcement-summary {
  font-size: 12px;
  color: #4E5969;
  line-height: 1.5;
}

@media (max-width: 1024px) {
  .announcement-banner {
    padding: 16px;
  }

  .announcement-content {
    flex-direction: column;
    gap: 12px;
  }

  .announcement-title {
    font-size: 14px;
  }

  .announcement-summary {
    font-size: 11px;
  }
}
</style>