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
import {onMounted, ref} from 'vue';
import cImg from '@/components/base/image/cImg.vue';
import api from '@/api/index';
import {formatDate} from '@/utils/DateFormatter.js';

const announcements = ref([]);

onMounted(async () =>
{
  const {data}= await api.get('/system/announcement');
  announcements.value=data;
});


</script>

<style scoped>
.announcement-banner {
  width: 100%;
  max-height: 60dvh;
  overflow-y: auto;
  background: transparent;
  border: 1px solid var(--color-border-2);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.announcement-banner::-webkit-scrollbar {
  width: 6px;
}

.announcement-banner::-webkit-scrollbar-track {
  background: var(--color-fill-2);
  border-radius: 3px;
}

.announcement-banner::-webkit-scrollbar-thumb {
  background: var(--color-fill-4);
  border-radius: 3px;
}

.announcement-banner::-webkit-scrollbar-thumb:hover {
  background: var(--color-fill-3);
}

.announcement-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color-border-2);
}

.announcement-header .arco-typography {
  margin: 0;
  font-weight: 600;
  color: var(--color-text-1);
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
}

.announcement-item:hover .announcement-title {
  color: rgb(var(--primary-4));
}

.announcement-date {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--color-text-3);
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
  color: var(--color-text-1);
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
  color: var(--color-text-2);
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