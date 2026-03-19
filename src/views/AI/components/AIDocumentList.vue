<template>
  <div v-if="documents.length > 0" class="document-list">
    <div class="document-header" @click="toggleCollapse">
      <div class="document-title">
        <icon-file />
        <span>检索到的文档</span>
        <span class="document-count">({{ documents.length }} 篇)</span>
      </div>
      <icon-down :class="{ rotated: !isCollapsed }" />
    </div>
    
    <div v-show="!isCollapsed" class="document-content">
      <a 
        v-for="(doc, index) in documents" 
        :key="doc.documentId"
        :href="`/p/${doc.id}`"
        class="document-item"
      >
        <div class="document-header-row">
          <div class="document-index">{{ index + 1 }}</div>
          <div class="document-info">
            <div class="document-title-text">{{ doc.title }}</div>
            <div class="document-score">相关度: {{ (doc.score * 100).toFixed(1) }}%</div>
          </div>
        </div>
        
        <div v-if="doc.summary" class="document-summary">
          {{ doc.summary }}
        </div>
        
        <div v-if="doc.tags" class="document-tags">
          <span 
            v-for="tag in parseTags(doc.tags)" 
            :key="tag.name"
            class="tag-item"
          >
            {{ tag.name }}
          </span>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { IconFile, IconDown } from '@arco-design/web-vue/es/icon';

defineProps({
  documents: {
    type: Array,
    default: () => []
  }
});

const isCollapsed = ref(false);

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const parseTags = (tagsStr) => {
  if (!tagsStr) return [];
  return tagsStr.split(',').map(tag => {
    const [name, score] = tag.trim().split(':');
    return { name: name.trim(), score: parseFloat(score) };
  });
};
</script>

<style scoped lang="less">
.document-list {
  background-color: var(--color-fill-1);
  border: 1px solid var(--color-border-2);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
  transition: all 0.3s;

  .document-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid var(--color-border-2);
    transition: all 0.2s;

    &:hover {
      background-color: var(--color-fill-2);
    }

    .document-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--color-text-2);
      font-weight: 500;

      svg {
        font-size: 14px;
        color: rgb(var(--warning-6));
      }

      .document-count {
        font-size: 12px;
        color: var(--color-text-3);
        font-weight: 400;
      }
    }

    .arco-icon-down {
      font-size: 12px;
      color: var(--color-text-3);
      transition: transform 0.3s;

      &.rotated {
        transform: rotate(-180deg);
      }
    }
  }

  .document-content {
    padding: 12px 16px;
    max-height: 400px;
    overflow-y: auto;

    .document-item {
      display: block;
      padding: 12px;
      background-color: var(--color-bg-2);
      border: 1px solid var(--color-border-2);
      border-radius: 8px;
      margin-bottom: 8px;
      transition: all 0.2s;
      text-decoration: none;
      color: inherit;
      cursor: pointer;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        border-color: rgb(var(--primary-6));
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      .document-header-row {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;

        .document-index {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: rgb(var(--primary-6));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .document-info {
          flex: 1;
          min-width: 0;

          .document-title-text {
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text-1);
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .document-score {
            font-size: 12px;
            color: var(--color-text-3);
          }
        }
      }

      .document-summary {
        font-size: 13px;
        color: var(--color-text-2);
        line-height: 1.6;
        margin-bottom: 8px;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .document-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .tag-item {
          padding: 2px 8px;
          background-color: var(--color-fill-2);
          border: 1px solid var(--color-border-2);
          border-radius: 4px;
          font-size: 12px;
          color: var(--color-text-2);
        }
      }
    }
  }
}
</style>
