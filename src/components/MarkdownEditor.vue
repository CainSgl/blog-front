<template>
  <div class="editor-container">
    <div class="tool-list">
      <a-tooltip content="返回">
        <a-button type="primary" shape="round" @click="goBack"><icon-arrow-left /></a-button>
      </a-tooltip>
      <a-button-group>
        <a-tooltip content="撤销">
          <a-button class="format-button" @click="undo" title="撤销" size="large">
            <icon-undo size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="重做">
          <a-button class="format-button" @click="redo" title="重做" size="large">
            <icon-redo size="large" />
          </a-button>
        </a-tooltip>
      </a-button-group>
      <a-button-group>
        <a-tooltip content="预览">
          <a-button :type="showPreview ? 'primary' : 'outline'" @click="togglePreview">
            {{ '预览' }}
          </a-button>
        </a-tooltip>
        <a-tooltip content="大纲">
          <a-button :type="showToc ? 'primary' : 'outline'" @click="toggleToc">
            {{ '目录导航' }}
          </a-button>
        </a-tooltip>
        <a-tooltip content="同步滚动">
          <a-button :type="syncScroll ? 'primary' : 'outline'" @click="toggleSyncScroll">
            {{ '同步滚动' }}
          </a-button>
        </a-tooltip>
      </a-button-group>
      <a-button-group>
        <!-- 标题下拉菜单 -->
        <a-dropdown>
          <a-button class="format-button" title="标题" size="large">
            <span>正文</span>
            <icon-down size="small" style="margin-left: 4px;" />
          </a-button>
          <template #content>
            <a-doption @click="saveSelection(); formatText('title', 0)">正文</a-doption>
            <a-doption @click="saveSelection(); formatText('title', 1)"><icon-h1 size="large" /> 标题1</a-doption>
            <a-doption @click="saveSelection(); formatText('title', 2)"><icon-h2 size="large" /> 标题2</a-doption>
            <a-doption @click="saveSelection(); formatText('title', 3)"><icon-h3 size="large" /> 标题3</a-doption>
            <a-doption @click="saveSelection(); formatText('title', 4)"><icon-h4 size="large" /> 标题4</a-doption>
          </template>
        </a-dropdown>
        <a-tooltip content="粗体">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('bold')" title="粗体"
            size="large">
            <icon-bold size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="斜体">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('italic')" title="斜体"
            size="large">
            <icon-italic size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="删除线">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('strikethrough')" title="删除线"
            size="large">
            <icon-strikethrough size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="下划线">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('underline')" title="下划线"
            size="large">
            <icon-underline size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="字体颜色">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('color')" title="字体颜色"
            size="large">
            <icon-font-colors size="large" />
          </a-button>
        </a-tooltip>
        <!-- 字体颜色选择器 -->
        <vue-pick-colors v-model:value="fontColor" @change="handleFontColorChange" :width="25" :height="25"
          :borderRadius="4" />
        <a-tooltip content="背景颜色">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('background')" title="背景颜色"
            size="large">
            <icon-highlight />
          </a-button>
        </a-tooltip>
        <!-- 背景颜色选择器 -->
        <vue-pick-colors v-model:value="backgroundColor" @change="handleBackgroundColorChange" :width="25" :height="25"
          :borderRadius="4" />
      </a-button-group>
      <a-button-group>
        <a-tooltip content="无序列表">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('unordered-list')"
            title="无序列表" size="large">
            <icon-unordered-list size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="有序列表">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('ordered-list')" title="有序列表"
            size="large">
            <icon-ordered-list size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="任务列表">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('task-list')" title="任务列表"
            size="large">
            <icon-check-circle size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="引用">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('quote')" title="引用"
            size="large">
            <icon-quote size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="插入链接">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); insertLink()" title="插入链接" size="large">
            <icon-link size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="上传图片">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); insertImage()" title="上传图片" size="large">
            <icon-image size="large" />
          </a-button>
        </a-tooltip>
        <a-trigger trigger="click" :unmount-on-close="false" animation-name="slide-dynamic-origin"
          auto-fit-transform-origin v-model:popup-visible="showEmojiPicker">
          <a-tooltip content="表情">
            <a-button class="format-button" title="表情" size="large">
              <icon-face-smile-fill size="large" />
            </a-button>
          </a-tooltip>
          <template #content>
            <emoji-picker v-show="showEmojiPicker" @select="handleEmojiSelect" :native="true" class="emoji-picker-popup"
              :toolbar="['bold', 'italic']" />
          </template>
        </a-trigger>
      </a-button-group>
    </div>
    <a-divider :size="2" style="border-bottom-style: dotted" />
    <!-- 编辑器容器（带右键菜单） -->
    <a-dropdown trigger="contextMenu" alignPoint :popup-max-height="800">
      <div style="height: 100%;">
        <v-md-editor ref="editorRef" :model-value="text" @update:model-value="handleModelUpdate" :height="height"
          @upload-image="handleUploadImage" :include-level="[1, 2, 3, 4, 5]" :mode="editorMode"
          :toolbar="[]"></v-md-editor>
      </div>
      <template #content>
        <!-- 格式化功能 -->
        <a-doption @click="saveSelection(); formatText('bold')">
          <icon-bold style="margin-right: 8px;" /> 粗体
        </a-doption>
        <a-doption @click="saveSelection(); formatText('italic')">
          <icon-italic style="margin-right: 8px;" /> 斜体
        </a-doption>

        <a-doption @click="saveSelection(); insertImage()">
          <icon-image style="margin-right: 8px;" /> 插入图片
        </a-doption>
        <a-doption @click="saveSelection(); formatText('color')">
          <icon-font-colors style="margin-right: 8px;" /> 字体颜色
        </a-doption>
        <a-doption @click="saveSelection(); formatText('background')">
          <icon-highlight style="margin-right: 8px;" /> 背景颜色
        </a-doption>
        <a-doption @click="saveSelection(); formatText('strikethrough')">
          <icon-strikethrough style="margin-right: 8px;" /> 删除线
        </a-doption>

        <!-- 列表功能 -->
        <a-doption @click="saveSelection(); formatText('unordered-list')">
          <icon-unordered-list style="margin-right: 8px;" /> 无序列表
        </a-doption>
        <a-doption @click="saveSelection(); formatText('ordered-list')">
          <icon-ordered-list style="margin-right: 8px;" /> 有序列表
        </a-doption>
        <a-doption @click="saveSelection(); formatText('task-list')">
          <icon-check-circle style="margin-right: 8px;" /> 任务列表
        </a-doption>
        <a-doption @click="saveSelection(); formatText('quote')">
          <icon-quote style="margin-right: 8px;" /> 引用
        </a-doption>
        <!-- 颜色功能 -->

        <a-doption @click="saveSelection(); insertLink()">
          <icon-link style="margin-right: 8px;" /> 插入链接
        </a-doption>

      </template>
    </a-dropdown>


    <!-- 字数和行数统计 -->
    <div class="editor-stats">
      <span class="stat-item">字数: {{ wordCount }}</span>
      <span class="stat-item">行数: {{ lineCount }}</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, shallowRef, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api/index.js';
import { Message, Dropdown, Doption } from '@arco-design/web-vue';
import { API_BASE_URL } from '@/config';
import { IconArrowLeft, IconBold, IconItalic, IconImage, IconMoreVertical, IconHighlight, IconStrikethrough, IconUnderline, IconFontColors, IconUnorderedList, IconOrderedList, IconCheckCircle, IconLink, IconUpload, IconUndo, IconRedo, IconFaceSmileFill, IconQuote, IconDown, IconH1, IconH2, IconH3, IconH4 } from '@arco-design/web-vue/es/icon';
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';
import VuePickColors from 'vue-pick-colors';

// 定义 props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  height: {
    type: String,
    default: 'calc(100vh - 40px)'
  }
});

// 定义 emits
const emit = defineEmits(['update:modelValue', 'go-back']);

// 使用 shallowRef 而不是 ref 来避免对象被冻结的问题
const text = shallowRef(props.modelValue);
const router = useRouter();

// 监听 modelValue 的变化
watch(() => props.modelValue, (newVal) => {
  text.value = newVal;
});

// 监听内部文本变化并触发更新事件
watch(text, (newVal) => {
  emit('update:modelValue', newVal);
});

// 处理模型值更新
const handleModelUpdate = (value) => {
  text.value = value;
};

// 计算字数和行数
const wordCount = computed(() => {
  return text.value.length;
});

const lineCount = computed(() => {
  return text.value.split('\n').length;
});

// 编辑器引用
const editorRef = ref(null);

// 控制编辑器功能的响应式数据
const showPreview = ref(true);
const showToc = ref(false);
const syncScroll = ref(true);
const isFullscreen = ref(false);
const showEmojiPicker = ref(false); // 控制表情选择器显示

// 颜色选择器相关数据
const fontColor = ref('#0080ff'); // 默认字体颜色
const backgroundColor = ref('#ffff00'); // 默认背景颜色

// 编辑器模式
const editorMode = ref('both'); // 'edit', 'preview', 'both'

const goBack = () => {
  emit('go-back');
};

const togglePreview = () => {
  showPreview.value = !showPreview.value;

  // 更新编辑器模式
  if (!showPreview.value) {
    editorMode.value = 'edit';
  } else {
    editorMode.value = 'both';
  }
};

const toggleToc = () => {
  showToc.value = !showToc.value;

  // 调用编辑器的 toggleToc 方法来控制目录显示/隐藏
  if (editorRef.value && editorRef.value.toggleToc) {
    editorRef.value.toggleToc(showToc.value);
  }

};

const toggleSyncScroll = () => {
  syncScroll.value = !syncScroll.value;
  if (editorRef.value && editorRef.value.toggleSyncScroll) {
    editorRef.value.toggleSyncScroll(syncScroll.value);
  }
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  if (editorRef.value && editorRef.value.toggleFullScreen) {
    editorRef.value.toggleFullScreen(isFullscreen.value);
  }
};

// Undo功能
const undo = () => {
  if (editorRef.value && editorRef.value.undo) {
    editorRef.value.undo();
  } else {
    // 如果编辑器没有提供undo方法，则使用浏览器的execCommand
    document.execCommand('undo', false, null);
  }
};

// Redo功能
const redo = () => {
  if (editorRef.value && editorRef.value.redo) {
    editorRef.value.redo();
  } else {
    // 如果编辑器没有提供redo方法，则使用浏览器的execCommand
    document.execCommand('redo', false, null);
  }
};

const handleUploadImage = async (event, insertImage, files) => {
  const file = files[0];
  try {
    Message.loading({
      id: 'upload-image:' + file.name,
      content: file.name + '图片上传中...',
      duration: 15000,
    });
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);
    // 使用api上传文件
    const { data } = await api.post('/file/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    // 插入图片到编辑器
    insertImage({
      url: API_BASE_URL + "/file?f=" + data.shortUrl,
      desc: file.name,
      width: 'auto',
      height: 'auto',
    });
    Message.success({
      id: 'upload-image:' + file.name,
      content: '图片上传成功，',
      duration: 3000,
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    Message.error({
      id: 'upload-image:' + file.name,
      content: '图片上传失败，请稍后重试',
      duration: 3000,
    });
  }
};

// 保存选区状态
let savedSelection = null;

// 保存当前选区
const saveSelection = () => {
  const editor = editorRef.value;
  if (!editor) return;

  // 正确获取 textarea 元素
  const textarea = editor.$refs.editorEgine?.textareaEl || editor.$el.querySelector('textarea');
  if (!textarea) return;

  savedSelection = {
    start: textarea.selectionStart,
    end: textarea.selectionEnd
  };
};

// 获取编辑器文本区域元素
const getTextAreaElement = () => {
  const editor = editorRef.value;
  if (!editor) return null;

  return editor.$refs.editorEgine?.textareaEl || editor.$el.querySelector('textarea');
};

// 处理表情选择
const handleEmojiSelect = (emoji) => {
  const textarea = getTextAreaElement();
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  // 在光标位置插入表情
  const newText = text.value.substring(0, start) + emoji.i + text.value.substring(end);
  text.value = newText;

  // 设置光标位置到表情后面
  setTimeout(() => {
    textarea.setSelectionRange(start + emoji.i.length, start + emoji.i.length);
    textarea.focus();
  }, 0);
};

// 获取选中文本信息
const getSelectedTextInfo = () => {
  const textarea = getTextAreaElement();
  if (!textarea) return null;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = text.value.substring(start, end);

  return {
    textarea,
    start,
    end,
    selectedText
  };
};

// 获取当前行文本
const getCurrentLineText = () => {
  const textarea = getTextAreaElement();
  if (!textarea) return null;

  const start = textarea.selectionStart;
  const textContent = text.value;

  // 找到当前行的开始和结束位置
  let lineStart = start;
  while (lineStart > 0 && textContent[lineStart - 1] !== '\n') {
    lineStart--;
  }

  let lineEnd = start;
  while (lineEnd < textContent.length && textContent[lineEnd] !== '\n') {
    lineEnd++;
  }

  const lineText = textContent.substring(lineStart, lineEnd);
  const cursorPositionInLine = start - lineStart;

  return {
    lineText,
    lineStart,
    lineEnd,
    cursorPositionInLine
  };
};

// 更新文本内容并设置光标位置
const updateTextAndSetCursor = (newText, cursorPosition, cursorEndPosition = null) => {
  text.value = newText;

  // 重新设置光标位置
  setTimeout(() => {
    const textarea = getTextAreaElement();
    if (!textarea) return;

    if (cursorEndPosition !== null) {
      textarea.setSelectionRange(cursorPosition, cursorEndPosition);
    } else {
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }
    textarea.focus();
  }, 0);
};

// 加粗文本处理函数
const formatBold = () => {
  const textInfo = getSelectedTextInfo();
  if (!textInfo) return;

  const { textarea, start, end, selectedText } = textInfo;
  console.log(selectedText)
  // 检查是否已经加粗（只在选中文本时检查）
  if (selectedText.length > 0) {
    // 检查选中文本是否已经被加粗标记包围
    if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length > 4) {
      // 取消加粗：去掉前后 **
      const unformattedText = selectedText.substring(2, selectedText.length - 2);
      const newText = text.value.substring(0, start) + unformattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start);
    } else {
      // 加粗：包裹 **
      const formattedText = `**${selectedText}**`;
      const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start + 2);
    }
  } else {
    // 如果没有选中文本，检查当前行是否已经是粗体
    const lineInfo = getCurrentLineText();
    if (lineInfo) {
      const { lineText, lineStart, lineEnd, cursorPositionInLine } = lineInfo;

      // 检查当前行是否已经被加粗标记包围
      if (lineText.startsWith('**') && lineText.endsWith('**') && lineText.length > 4) {
        // 取消整行加粗：去掉前后 **
        const unformattedText = lineText.substring(2, lineText.length - 2);
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + unformattedText + afterText;
        // 保持光标在原来的位置（相对位置不变）
        const newCursorPosition = lineStart + cursorPositionInLine - 2;
        updateTextAndSetCursor(newText, Math.max(lineStart, newCursorPosition));
      } else {
        // 整行加粗：包裹 **
        const formattedText = `**${lineText}**`;
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + formattedText + afterText;
        // 保持光标在原来的位置（相对位置不变）
        const newCursorPosition = lineStart + 2 + cursorPositionInLine;
        updateTextAndSetCursor(newText, newCursorPosition);
      }
    } else {
      // 如果无法获取行信息，则在光标位置插入加粗标记
      const newText = text.value.substring(0, start) + `****` + text.value.substring(end);
      updateTextAndSetCursor(newText, start + 2);
    }
  }
};

// 斜体文本处理函数
const formatItalic = () => {
  const textInfo = getSelectedTextInfo();
  if (!textInfo) return;

  const { textarea, start, end, selectedText } = textInfo;

  // 检查是否已经斜体（只在选中文本时检查）
  if (selectedText.length > 0) {
    // 检查选中文本是否已经被斜体标记包围
    if (selectedText.startsWith('*') && selectedText.endsWith('*') && selectedText.length > 2) {
      // 取消斜体：去掉前后 *
      const unformattedText = selectedText.substring(1, selectedText.length - 1);
      const newText = text.value.substring(0, start) + unformattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start);
    } else {
      // 斜体：包裹 *
      const formattedText = `*${selectedText}*`;
      const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start + 1);
    }
  } else {
    // 如果没有选中文本，检查当前行是否已经是斜体
    const lineInfo = getCurrentLineText();
    if (lineInfo) {
      const { lineText, lineStart, lineEnd, cursorPositionInLine } = lineInfo;

      // 检查当前行是否已经被斜体标记包围
      if (lineText.startsWith('*') && lineText.endsWith('*') && lineText.length > 2) {
        // 取消整行斜体：去掉前后 *
        const unformattedText = lineText.substring(1, lineText.length - 1);
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + unformattedText + afterText;
        // 保持光标在原来的位置（相对位置不变）
        const newCursorPosition = lineStart + cursorPositionInLine - 1;
        updateTextAndSetCursor(newText, Math.max(lineStart, newCursorPosition));
      } else {
        // 整行斜体：包裹 *
        const formattedText = `*${lineText}*`;
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + formattedText + afterText;
        // 保持光标在原来的位置（相对位置不变）
        const newCursorPosition = lineStart + 1 + cursorPositionInLine;
        updateTextAndSetCursor(newText, newCursorPosition);
      }
    } else {
      // 如果无法获取行信息，则在光标位置插入斜体标记
      const newText = text.value.substring(0, start) + `**` + text.value.substring(end);
      updateTextAndSetCursor(newText, start + 1);
    }
  }
};

// 删除线文本处理函数
const formatStrikethrough = () => {
  const textInfo = getSelectedTextInfo();
  if (!textInfo) return;

  const { textarea, start, end, selectedText } = textInfo;

  // 检查是否已经删除线（只在选中文本时检查）
  if (selectedText.length > 0) {
    // 检查选中文本是否已经被删除线标记包围
    if (selectedText.startsWith('~~') && selectedText.endsWith('~~') && selectedText.length > 4) {
      // 取消删除线：去掉前后 ~~
      const unformattedText = selectedText.substring(2, selectedText.length - 2);
      const newText = text.value.substring(0, start) + unformattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start);
    } else {
      // 删除线：包裹 ~~
      const formattedText = `~~${selectedText}~~`;
      const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start + 2);
    }
  } else {
    // 如果没有选中文本，检查当前行是否已经是删除线
    const lineInfo = getCurrentLineText();
    if (lineInfo) {
      const { lineText, lineStart, lineEnd, cursorPositionInLine } = lineInfo;

      // 检查当前行是否已经被删除线标记包围
      if (lineText.startsWith('~~') && lineText.endsWith('~~') && lineText.length > 4) {
        // 取消整行删除线：去掉前后 ~~
        const unformattedText = lineText.substring(2, lineText.length - 2);
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + unformattedText + afterText;
        // 保持光标在原来的位置（相对位置不变）
        const newCursorPosition = lineStart + cursorPositionInLine - 2;
        updateTextAndSetCursor(newText, Math.max(lineStart, newCursorPosition));
      } else {
        // 整行删除线：包裹 ~~
        const formattedText = `~~${lineText}~~`;
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + formattedText + afterText;
        // 保持光标在原来的位置（相对位置不变）
        const newCursorPosition = lineStart + 2 + cursorPositionInLine;
        updateTextAndSetCursor(newText, newCursorPosition);
      }
    } else {
      // 如果无法获取行信息，则在光标位置插入删除线标记
      const newText = text.value.substring(0, start) + `~~~~` + text.value.substring(end);
      updateTextAndSetCursor(newText, start + 2);
    }
  }
};

// 下划线文本处理函数
const formatUnderline = () => {
  const textInfo = getSelectedTextInfo();
  if (!textInfo) return;

  const { textarea, start, end, selectedText } = textInfo;

  // 检查是否已经下划线（只在选中文本时检查）
  if (selectedText.length > 0) {
    // 检查选中文本是否已经被下划线标签包围
    const underlineTagStart = '<u>';
    const underlineTagEnd = '</u>';

    if (selectedText.startsWith(underlineTagStart) && selectedText.endsWith(underlineTagEnd) && selectedText.length > 7) {
      // 取消下划线：去掉前后标签
      const unformattedText = selectedText.substring(underlineTagStart.length, selectedText.length - underlineTagEnd.length);
      const newText = text.value.substring(0, start) + unformattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start);
    } else {
      // 下划线：包裹标签
      const formattedText = `<u>${selectedText}</u>`;
      const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start + underlineTagStart.length);
    }
  } else {
    // 如果没有选中文本，检查当前行是否已经是下划线
    const lineInfo = getCurrentLineText();
    if (lineInfo) {
      const { lineText, lineStart, lineEnd, cursorPositionInLine } = lineInfo;
      const underlineTagStart = '<u>';
      const underlineTagEnd = '</u>';

      // 检查当前行是否已经被下划线标签包围
      if (lineText.startsWith(underlineTagStart) && lineText.endsWith(underlineTagEnd) && lineText.length > 7) {
        // 取消整行下划线：去掉前后标签
        const unformattedText = lineText.substring(underlineTagStart.length, lineText.length - underlineTagEnd.length);
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + unformattedText + afterText;
        // 保持光标在原来的位置（相对位置不变）
        const newCursorPosition = lineStart + cursorPositionInLine - underlineTagStart.length;
        updateTextAndSetCursor(newText, Math.max(lineStart, newCursorPosition));
      } else {
        // 整行下划线：包裹标签
        const formattedText = `<u>${lineText}</u>`;
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + formattedText + afterText;
        // 保持光标在原来的位置（相对位置不变）
        const newCursorPosition = lineStart + underlineTagStart.length + cursorPositionInLine;
        updateTextAndSetCursor(newText, newCursorPosition);
      }
    } else {
      // 如果无法获取行信息，则在光标位置插入下划线标签
      const newText = text.value.substring(0, start) + `<u></u>` + text.value.substring(end);
      updateTextAndSetCursor(newText, start + 3);
    }
  }
};



// 无序列表处理函数
const formatUnorderedList = () => {
  const textInfo = getSelectedTextInfo();
  if (!textInfo) return;

  const { textarea, start, end, selectedText } = textInfo;

  // 如果有选中文本，对每一行添加前缀
  if (selectedText.length > 0) {
    const formattedText = selectedText.split('\n').map(line => `- ${line}`).join('\n');
    const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
    updateTextAndSetCursor(newText, start);
  } else {
    // 如果没有选中文本，在当前位置插入两个新行和列表项
    const newText = text.value.substring(0, start) + `\n\n- ` + text.value.substring(end);
    updateTextAndSetCursor(newText, start + 4); // 光标定位在 "- " 后面
  }
};

// 有序列表处理函数
const formatOrderedList = () => {
  const textInfo = getSelectedTextInfo();
  if (!textInfo) return;

  const { textarea, start, end, selectedText } = textInfo;

  // 如果有选中文本，对每一行添加前缀
  if (selectedText.length > 0) {
    const lines = selectedText.split('\n');
    const formattedText = lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
    const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
    updateTextAndSetCursor(newText, start);
  } else {
    // 如果没有选中文本，在当前位置插入两个新行和列表项
    const newText = text.value.substring(0, start) + `\n\n1. ` + text.value.substring(end);
    updateTextAndSetCursor(newText, start + 5); // 光标定位在 "1. " 后面
  }
};

// 任务列表处理函数
const formatTaskList = () => {
  const textInfo = getSelectedTextInfo();
  if (!textInfo) return;

  const { textarea, start, end, selectedText } = textInfo;

  // 如果有选中文本，对每一行添加前缀
  if (selectedText.length > 0) {
    const formattedText = selectedText.split('\n').map(line => `- [ ] ${line}`).join('\n');
    const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
    updateTextAndSetCursor(newText, start);
  } else {
    // 如果没有选中文本，在当前位置插入两个新行和列表项
    const newText = text.value.substring(0, start) + `\n\n- [ ] ` + text.value.substring(end);
    updateTextAndSetCursor(newText, start + 8); // 光标定位在 "- [ ] " 后面
  }
};

// 引用处理函数
const formatQuote = () => {
  const textInfo = getSelectedTextInfo();
  if (!textInfo) return;

  const { textarea, start, end, selectedText } = textInfo;

  // 如果有选中文本，对每一行添加引用符号
  if (selectedText.length > 0) {
    const formattedText = selectedText.split('\n').map(line => `> ${line}`).join('\n');
    const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
    updateTextAndSetCursor(newText, start);
  } else {
    // 如果没有选中文本，在当前位置插入引用符号
    const newText = text.value.substring(0, start) + `\n\n> ` + text.value.substring(end);
    updateTextAndSetCursor(newText, start + 4); // 光标定位在 "> " 后面
  }
};

// 标题格式化函数
const formatTitle = (level) => {
  const textInfo = getSelectedTextInfo();
  if (!textInfo) return;

  const { textarea, start, end, selectedText } = textInfo;

  // 生成对应级别的标题符号
  const titleSymbol = '#'.repeat(level);

  // 如果有选中文本
  if (selectedText.length > 0) {
    // 获取选中文本的第一行作为标题内容
    const firstLine = selectedText.split('\n')[0];
    // 移除已有的标题符号
    const cleanText = firstLine.replace(/^#+\s*/, '');

    // 生成新的标题文本
    const formattedText = `${titleSymbol} ${cleanText}`;
    const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
    updateTextAndSetCursor(newText, start + titleSymbol.length + 1);
  } else {
    // 如果没有选中文本，检查当前行是否已经是标题
    const lineInfo = getCurrentLineText();
    if (lineInfo) {
      const { lineText, lineStart, lineEnd } = lineInfo;

      // 检查当前行是否已经是标题
      const titleMatch = lineText.match(/^(#+)\s*(.*)$/);

      if (titleMatch) {
        const currentLevel = titleMatch[1].length;
        const titleContent = titleMatch[2];

        // 如果当前级别与目标级别相同，则取消标题格式（恢复为普通文本）
        if (currentLevel === level) {
          const newText = text.value.substring(0, lineStart) + titleContent + text.value.substring(lineEnd);
          updateTextAndSetCursor(newText, lineStart);
        } else {
          // 否则更新标题级别
          const newTitleSymbol = '#'.repeat(level);
          const formattedText = `${newTitleSymbol} ${titleContent}`;
          const newText = text.value.substring(0, lineStart) + formattedText + text.value.substring(lineEnd);
          updateTextAndSetCursor(newText, lineStart + newTitleSymbol.length + 1);
        }
      } else {
        // 当前行不是标题，将其转换为指定级别的标题
        const formattedText = `${titleSymbol} ${lineText}`;
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + formattedText + afterText;
        updateTextAndSetCursor(newText, lineStart + titleSymbol.length + 1);
      }
    } else {
      // 如果无法获取行信息，则在光标位置插入标题标记
      const newText = text.value.substring(0, start) + `${titleSymbol} ` + text.value.substring(end);
      updateTextAndSetCursor(newText, start + titleSymbol.length + 1);
    }
  }
};




// 字体颜色变化处理函数
const handleFontColorChange = (color) => {
  // 更新字体颜色值
  fontColor.value = color;
  // 应用字体颜色到选中文本
  formatColorWithCustomColor(color);
};

// 背景颜色变化处理函数
const handleBackgroundColorChange = (color) => {
  // 更新背景颜色值
  backgroundColor.value = color;
  // 应用背景颜色到选中文本
  formatBackgroundWithCustomColor(color);
};

// 辅助函数：解析span标签中的样式
const parseSpanStyle = (spanText) => {
  const styleRegex = /<span style="([^"]*)">([^]*)<\/span>/;
  const match = spanText.match(styleRegex);

  if (!match) return null;

  const styleString = match[1];
  const content = match[2];

  // 解析样式字符串
  const styles = {};
  styleString.split(';').forEach(style => {
    const [key, value] = style.split(':').map(s => s.trim());
    if (key && value) {
      styles[key] = value;
    }
  });

  return {
    styles,
    content,
    fullMatch: match[0]
  };
};

// 辅助函数：构建span标签
const buildSpanTag = (styles, content) => {
  const styleString = Object.entries(styles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
  return `<span style="${styleString}">${content}</span>`;
};

// 带自定义颜色的字体颜色处理函数
const formatColorWithCustomColor = (customColor) => {
  const textInfo = getSelectedTextInfo();
  if (!textInfo) return;

  const { textarea, start, end, selectedText } = textInfo;

  // 检查是否已经设置了字体颜色（只在选中文本时检查）
  if (selectedText.length > 0) {
    // 检查选中文本是否已经被span标签包围
    const spanInfo = parseSpanStyle(selectedText);

    if (spanInfo) {
      // 如果已经有span标签，检查是否已经有相同的字体颜色
      if (spanInfo.styles['color'] === customColor) {
        // 如果颜色相同，则移除字体颜色样式
        delete spanInfo.styles['color'];

        // 如果没有其他样式了，就移除整个span标签
        let newText;
        if (Object.keys(spanInfo.styles).length === 0) {
          newText = text.value.substring(0, start) + spanInfo.content + text.value.substring(end);
          updateTextAndSetCursor(newText, start);
        } else {
          // 否则只更新样式
          const updatedSpan = buildSpanTag(spanInfo.styles, spanInfo.content);
          newText = text.value.substring(0, start) + updatedSpan + text.value.substring(end);
          updateTextAndSetCursor(newText, start);
        }
      } else {
        // 如果颜色不同，则更新字体颜色样式
        spanInfo.styles['color'] = customColor;
        const updatedSpan = buildSpanTag(spanInfo.styles, spanInfo.content);
        const newText = text.value.substring(0, start) + updatedSpan + text.value.substring(end);
        updateTextAndSetCursor(newText, start);
      }
    } else {
      // 没有span标签，直接添加新的
      const styles = { 'color': customColor };
      const formattedText = buildSpanTag(styles, selectedText);
      const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start + formattedText.indexOf('>') + 1);
    }
  } else {
    // 如果没有选中文本，检查当前行是否已经设置了字体颜色
    const lineInfo = getCurrentLineText();
    if (lineInfo) {
      const { lineText, lineStart, lineEnd, cursorPositionInLine } = lineInfo;
      const spanInfo = parseSpanStyle(lineText);

      if (spanInfo) {
        // 如果已经有span标签，检查是否已经有相同的字体颜色
        if (spanInfo.styles['color'] === customColor) {
          // 如果颜色相同，则移除字体颜色样式
          delete spanInfo.styles['color'];

          // 如果没有其他样式了，就移除整个span标签
          let newText;
          if (Object.keys(spanInfo.styles).length === 0) {
            const beforeText = text.value.substring(0, lineStart);
            const afterText = text.value.substring(lineEnd);
            newText = beforeText + spanInfo.content + afterText;
            updateTextAndSetCursor(newText, lineStart + cursorPositionInLine);
          } else {
            // 否则只更新样式
            const updatedSpan = buildSpanTag(spanInfo.styles, spanInfo.content);
            const beforeText = text.value.substring(0, lineStart);
            const afterText = text.value.substring(lineEnd);
            const newText = beforeText + updatedSpan + afterText;
            updateTextAndSetCursor(newText, lineStart + cursorPositionInLine);
          }
        } else {
          // 如果颜色不同，则更新字体颜色样式
          spanInfo.styles['color'] = customColor;
          const updatedSpan = buildSpanTag(spanInfo.styles, spanInfo.content);
          const beforeText = text.value.substring(0, lineStart);
          const afterText = text.value.substring(lineEnd);
          const newText = beforeText + updatedSpan + afterText;
          updateTextAndSetCursor(newText, lineStart + cursorPositionInLine);
        }
      } else {
        // 没有span标签，为整行添加新的
        const styles = { 'color': customColor };
        const formattedText = buildSpanTag(styles, lineText);
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + formattedText + afterText;
        const newCursorPosition = lineStart + formattedText.indexOf('>') + 1 + cursorPositionInLine;
        updateTextAndSetCursor(newText, newCursorPosition);
      }
    } else {
      // 如果无法获取行信息，则在光标位置插入颜色标签
      const styles = { 'color': customColor };
      const formattedText = buildSpanTag(styles, '');
      const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start + formattedText.indexOf('>') + 1);
    }
  }
};

// 带自定义颜色的背景颜色处理函数
const formatBackgroundWithCustomColor = (customColor) => {
  const textInfo = getSelectedTextInfo();
  if (!textInfo) return;

  const { textarea, start, end, selectedText } = textInfo;

  // 检查是否已经设置了背景颜色（只在选中文本时检查）
  if (selectedText.length > 0) {
    // 检查选中文本是否已经被span标签包围
    const spanInfo = parseSpanStyle(selectedText);

    if (spanInfo) {
      // 如果已经有span标签，检查是否已经有相同的背景颜色
      if (spanInfo.styles['background-color'] === customColor) {
        // 如果颜色相同，则移除背景颜色样式
        delete spanInfo.styles['background-color'];

        // 如果没有其他样式了，就移除整个span标签
        let newText;
        if (Object.keys(spanInfo.styles).length === 0) {
          newText = text.value.substring(0, start) + spanInfo.content + text.value.substring(end);
          updateTextAndSetCursor(newText, start);
        } else {
          // 否则只更新样式
          const updatedSpan = buildSpanTag(spanInfo.styles, spanInfo.content);
          newText = text.value.substring(0, start) + updatedSpan + text.value.substring(end);
          updateTextAndSetCursor(newText, start);
        }
      } else {
        // 如果颜色不同，则更新背景颜色样式
        spanInfo.styles['background-color'] = customColor;
        const updatedSpan = buildSpanTag(spanInfo.styles, spanInfo.content);
        const newText = text.value.substring(0, start) + updatedSpan + text.value.substring(end);
        updateTextAndSetCursor(newText, start);
      }
    } else {
      // 没有span标签，直接添加新的
      const styles = { 'background-color': customColor };
      const formattedText = buildSpanTag(styles, selectedText);
      const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start + formattedText.indexOf('>') + 1);
    }
  } else {
    // 如果没有选中文本，检查当前行是否已经设置了背景颜色
    const lineInfo = getCurrentLineText();
    if (lineInfo) {
      const { lineText, lineStart, lineEnd, cursorPositionInLine } = lineInfo;
      const spanInfo = parseSpanStyle(lineText);

      if (spanInfo) {
        // 如果已经有span标签，检查是否已经有相同的背景颜色
        if (spanInfo.styles['background-color'] === customColor) {
          // 如果颜色相同，则移除背景颜色样式
          delete spanInfo.styles['background-color'];

          // 如果没有其他样式了，就移除整个span标签
          let newText;
          if (Object.keys(spanInfo.styles).length === 0) {
            const beforeText = text.value.substring(0, lineStart);
            const afterText = text.value.substring(lineEnd);
            newText = beforeText + spanInfo.content + afterText;
            updateTextAndSetCursor(newText, lineStart + cursorPositionInLine);
          } else {
            // 否则只更新样式
            const updatedSpan = buildSpanTag(spanInfo.styles, spanInfo.content);
            const beforeText = text.value.substring(0, lineStart);
            const afterText = text.value.substring(lineEnd);
            const newText = beforeText + updatedSpan + afterText;
            updateTextAndSetCursor(newText, lineStart + cursorPositionInLine);
          }
        } else {
          // 如果颜色不同，则更新背景颜色样式
          spanInfo.styles['background-color'] = customColor;
          const updatedSpan = buildSpanTag(spanInfo.styles, spanInfo.content);
          const beforeText = text.value.substring(0, lineStart);
          const afterText = text.value.substring(lineEnd);
          const newText = beforeText + updatedSpan + afterText;
          updateTextAndSetCursor(newText, lineStart + cursorPositionInLine);
        }
      } else {
        // 没有span标签，为整行添加新的
        const styles = { 'background-color': customColor };
        const formattedText = buildSpanTag(styles, lineText);
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + formattedText + afterText;
        const newCursorPosition = lineStart + formattedText.indexOf('>') + 1 + cursorPositionInLine;
        updateTextAndSetCursor(newText, newCursorPosition);
      }
    } else {
      // 如果无法获取行信息，则在光标位置插入背景颜色标签
      const styles = { 'background-color': customColor };
      const formattedText = buildSpanTag(styles, '');
      const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start + formattedText.indexOf('>') + 1);
    }
  }
};

// 文本格式化函数
const formatText = (type, extraParam) => {
  // 阻止按钮获取焦点，保持文本选中状态
  event.preventDefault();

  // 根据类型调用对应的处理函数
  switch (type) {
    case 'bold':
      formatBold();
      break;
    case 'italic':
      formatItalic();
      break;
    case 'strikethrough':
      formatStrikethrough();
      break;
    case 'underline':
      formatUnderline();
      break;
    case 'color':
      formatColorWithCustomColor(fontColor.value);
      break;
    case 'background':
      formatBackgroundWithCustomColor(backgroundColor.value);
      break;
    case 'unordered-list':
      formatUnorderedList();
      break;
    case 'ordered-list':
      formatOrderedList();
      break;
    case 'task-list':
      formatTaskList();
      break;
    case 'quote':
      formatQuote();
      break;
    case 'title':
      formatTitle(extraParam); // extraParam 是标题级别 (1-4)
      break;
    default:
      console.warn(`未知的格式化类型: ${type}`);
  }
};

// 插入链接
const insertLink = () => {
  event.preventDefault();

  const editor = editorRef.value;
  if (!editor) return;

  // 正确获取 textarea 元素
  const textarea = editor.$refs.editorEgine?.textareaEl || editor.$el.querySelector('textarea');
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = text.value.substring(start, end);

  const linkText = selectedText || '链接文本';
  const formattedText = `[${linkText}](url)`;

  const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
  text.value = newText;

  // 设置光标位置到url处
  setTimeout(() => {
    textarea.setSelectionRange(start + formattedText.length - 4, start + formattedText.length - 1);
    textarea.focus();
  }, 0);
};

// 插入图片（调用已有的上传图片功能）
const insertImage = () => {
  // 触发文件选择对话框
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.onchange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // 使用已有的上传图片功能
      handleUploadImage(null, (image) => {
        const editor = editorRef.value;
        if (!editor) return;

        // 正确获取 textarea 元素
        const textarea = editor.$refs.editorEgine?.textareaEl || editor.$el.querySelector('textarea');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const imageMarkdown = `![${image.desc}](${image.url})`;
        const newText = text.value.substring(0, start) + imageMarkdown + text.value.substring(end);
        text.value = newText;

        // 设置光标位置到图片后面
        setTimeout(() => {
          textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
          textarea.focus();
        }, 0);
      }, files);
    }
  };
  fileInput.click();
};



onMounted(async () => {
  // const route = useRoute();
  // const { data } = await api.get('/post', { id: route.query.p })
  // text.value = data.content
})

</script>

<style scoped lang="less">
.editor-container {
  position: relative;
}

.editor-container :deep(.v-md-editor__left-area-title) {
  display: none !important;
}

.editor-container :deep(.v-md-editor) {
  box-shadow: none !important;
}

.editor-container :deep(.v-md-editor__toolbar) {
  display: none !important;
}

.tool-list {
  padding-left: 10px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
  background-color: rgb(245, 245, 245);
  border-radius: 15px;
}


.format-button {
  min-width: 32px;
  padding: 4px 8px;
}

.editor-stats {
  position: absolute;
  bottom: 20px;
  right: 20px;
  font-size: 14px;

}


.stat-item {
  margin: 10px
}
</style>