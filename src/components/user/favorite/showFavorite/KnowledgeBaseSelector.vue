<template>
  <a-modal v-model:visible="visible" title="选择知识库" @ok="handleConfirm" @cancel="handleCancel"
    :ok-loading="confirmLoading" ok-text="确认" cancel-text="取消" width="700px">
    <div class="kb-selector">
      <!-- 搜索框 -->
      <a-input-search v-model="searchKeyword" placeholder="搜索知识库..." style="margin-bottom: 16px;"
        @search="handleSearch" @clear="handleSearch" allow-clear />

      <!-- 知识库列表 -->
      <a-spin :loading="loading" style="width: 100%;">
        <div class="kb-list" v-if="knowledgeBases.length > 0">
          <div v-for="kb in knowledgeBases" :key="kb.id" class="kb-item" :class="{ selected: selectedKbId === kb.id }"
            @click="selectedKbId = kb.id">
            <div class="kb-cover">
              <CImg v-if="kb.coverUrl" :src="kb.coverUrl" alt="封面" />
              <div v-else class="kb-cover-empty">
                <icon-book />
              </div>
            </div>
            <div class="kb-info">
              <div class="kb-name">{{ kb.name }}</div>
              <div class="kb-meta">
                <span>{{ kb.postCount || 0 }} 篇文档</span>
                <span class="kb-status">{{ kb.status }}</span>
              </div>
            </div>
            <div class="kb-check" v-if="selectedKbId === kb.id">
              <icon-check-circle-fill />
            </div>
          </div>
        </div>
        <a-empty v-else description="暂无知识库" style="padding: 40px 0;" />
      </a-spin>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > pageSize">
        <a-pagination :total="total" :current="currentPage" :page-size="pageSize" simple
          @change="handlePageChange" />
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { IconBook, IconCheckCircleFill } from '@arco-design/web-vue/es/icon';
import { Message } from '@arco-design/web-vue';
import api from '@/api/index.js';
import CImg from '@/components/base/cImg.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  userId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = ref(false);
const loading = ref(false);
const confirmLoading = ref(false);
const knowledgeBases = ref([]);
const selectedKbId = ref(null);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val) {
    loadKnowledgeBases();
  }
});

watch(visible, (val) => {
  emit('update:modelValue', val);
  if (!val) {
    // 关闭时重置
    selectedKbId.value = null;
    searchKeyword.value = '';
    currentPage.value = 1;
  }
});

const loadKnowledgeBases = async (page = 1) => {
  loading.value = true;
  try {
    const params = {
      page,
      size: pageSize.value,
      userId: props.userId,
      status: '已发布' // 只显示已发布的知识库
    };

    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim();
    }

    const { data } = await api.post('/kb/list', params);
    knowledgeBases.value = data.records;
    total.value = data.total;
    currentPage.value = page;
  } catch (error) {
    console.error('加载知识库列表失败:', error);
    Message.error('加载知识库列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadKnowledgeBases(1);
};

const handlePageChange = (page) => {
  loadKnowledgeBases(page);
};

const handleConfirm = () => {
  if (!selectedKbId.value) {
    Message.warning('请选择一个知识库');
    return;
  }

  const selectedKb = knowledgeBases.value.find(kb => kb.id === selectedKbId.value);
  emit('confirm', selectedKb);
  visible.value = false;
};

const handleCancel = () => {
  visible.value = false;
};
</script>

<style lang="less" scoped>
.kb-selector {
  .kb-list {
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 16px;

    .kb-item {
      display: flex;
      align-items: center;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: #4080ff;
        background-color: #f5f8ff;
      }

      &.selected {
        border-color: #4080ff;
        background-color: #f5f8ff;
      }

      .kb-cover {
        width: 60px;
        height: 60px;
        border-radius: 6px;
        overflow: hidden;
        flex-shrink: 0;
        margin-right: 12px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .kb-cover-empty {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          font-size: 24px;
          color: #999;
        }
      }

      .kb-info {
        flex: 1;
        min-width: 0;

        .kb-name {
          font-size: 14px;
          font-weight: 500;
          color: #1d2129;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .kb-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #86909c;

          .kb-status {
            padding: 2px 8px;
            background-color: #e8f3ff;
            color: #4080ff;
            border-radius: 4px;
          }
        }
      }

      .kb-check {
        font-size: 20px;
        color: #4080ff;
        margin-left: 12px;
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    padding-top: 8px;
  }
}
</style>
