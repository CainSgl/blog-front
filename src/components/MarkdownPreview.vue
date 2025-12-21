<template>
  <div class="markdown-preview">
    <v-md-editor 
      :model-value="content" 
      :height="height"
      mode="preview"
      class="preview-content"
    />
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
  content: {
    type: String,
    default: ''
  },
  height: {
    type: String,
  }
});
</script>

<style scoped>
.markdown-preview {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.preview-content {
  min-height: 100%;
}

/* 自定义预览器样式 */
:deep(.v-md-editor__preview) {
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  padding: 16px;
}

/* 标题样式 */
:deep(.v-md-editor__preview h1) {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
  margin: 24px 0 16px 0;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
}

:deep(.v-md-editor__preview h2) {
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
  margin: 20px 0 12px 0;
}

:deep(.v-md-editor__preview h3) {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  margin: 16px 0 10px 0;
}

:deep(.v-md-editor__preview h4) {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin: 14px 0 8px 0;
}

/* 段落样式 */
:deep(.v-md-editor__preview p) {
  line-height: 1.7;
  color: #4e5969;
  margin: 12px 0;
}

/* 列表样式 */
:deep(.v-md-editor__preview ul),
:deep(.v-md-editor__preview ol) {
  margin: 12px 0;
  padding-left: 24px;
}

:deep(.v-md-editor__preview li) {
  line-height: 1.7;
  color: #4e5969;
  margin: 6px 0;
}

/* 引用样式 */
:deep(.v-md-editor__preview blockquote) {
  border-left: 4px solid #165dff;
  background: #f7f8fa;
  margin: 16px 0;
  padding: 12px 16px;
  color: #666;
  border-radius: 0 4px 4px 0;
}

/* 代码样式 */
:deep(.v-md-editor__preview code) {
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  color: #d73027;
}

:deep(.v-md-editor__preview pre) {
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  margin: 16px 0;
}

:deep(.v-md-editor__preview pre code) {
  background: transparent;
  border: none;
  padding: 0;
  color: #1d2129;
}

/* 链接样式 */
:deep(.v-md-editor__preview a) {
  color: #165dff;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-bottom-color 0.2s;
}

:deep(.v-md-editor__preview a:hover) {
  border-bottom-color: #165dff;
}

/* 表格样式 */
:deep(.v-md-editor__preview table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

:deep(.v-md-editor__preview th),
:deep(.v-md-editor__preview td) {
  border: 1px solid #e5e6eb;
  padding: 8px 12px;
  text-align: left;
}

:deep(.v-md-editor__preview th) {
  background: #f7f8fa;
  font-weight: 600;
  color: #1d2129;
}

:deep(.v-md-editor__preview td) {
  color: #4e5969;
}

/* 分隔线样式 */
:deep(.v-md-editor__preview hr) {
  border: none;
  height: 1px;
  background: #e5e6eb;
  margin: 24px 0;
}

/* 任务列表样式 */
:deep(.v-md-editor__preview .todo-list) {
  list-style: none;
  padding-left: 0;
}

:deep(.v-md-editor__preview .todo-list li) {
  display: flex;
  align-items: center;
  margin: 8px 0;
}

:deep(.v-md-editor__preview .todo-list input[type="checkbox"]) {
  margin-right: 8px;
}

/* 图片样式 */
:deep(.v-md-editor__preview img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>