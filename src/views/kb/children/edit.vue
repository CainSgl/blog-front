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
        <a-tooltip content="粗体">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('bold')" title="粗体" size="large">
            <icon-bold size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="斜体">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('italic')" title="斜体" size="large">
            <icon-italic size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="删除线">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('strikethrough')" title="删除线" size="large">
            <icon-strikethrough size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="下划线">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('underline')" title="下划线" size="large">
            <icon-underline size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="字体颜色">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('color')" title="字体颜色" size="large">
            <icon-font-colors size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="切换字体颜色">
        </a-tooltip>
        <a-tooltip content="背景颜色">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('background')" title="背景颜色" size="large">
            <icon-highlight />
          </a-button>
        </a-tooltip>
      </a-button-group>
      <a-button-group>
        <a-tooltip content="无序列表">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('unordered-list')"
            title="无序列表" size="large">
            <icon-unordered-list size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="有序列表">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('ordered-list')" title="有序列表" size="large">
            <icon-ordered-list size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="任务列表">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('task-list')" title="任务列表" size="large">
            <icon-check-circle size="large" />
          </a-button>
        </a-tooltip>
        <a-tooltip content="引用">
          <a-button class="format-button" @mousedown.prevent="saveSelection(); formatText('quote')" title="引用" size="large">
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
            <icon-upload size="large" />
          </a-button>
        </a-tooltip>
        <a-trigger trigger="click" :unmount-on-close="false" animation-name="slide-dynamic-origin" auto-fit-transform-origin v-model:popup-visible="showEmojiPicker">
          <a-tooltip content="表情">
            <a-button class="format-button" title="表情" size="large">
              <icon-face-smile-fill size="large" />
            </a-button>
          </a-tooltip>
          <template #content>
            <emoji-picker 
              v-show="showEmojiPicker"
              @select="handleEmojiSelect" 
              :native="true"
              class="emoji-picker-popup"
            />
          </template>
        </a-trigger>
      </a-button-group>
    </div>

    <v-md-editor ref="editorRef" :model-value="text" @update:model-value="text = $event" height="calc(100vh - 40px)"
      :disabled-menus="['save']" @upload-image="handleUploadImage" :include-level="[1, 2, 3, 4, 5]"
      :mode="editorMode"></v-md-editor>
  </div>
</template>

<script setup>
import { onMounted, ref, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api/index.js';
import { Message } from '@arco-design/web-vue';
import { API_BASE_URL } from '@/config';
import { IconArrowLeft, IconBold, IconItalic,IconMoreVertical,IconHighlight, IconStrikethrough, IconUnderline, IconFontColors, IconUnorderedList, IconOrderedList, IconCheckCircle, IconLink, IconUpload, IconUndo, IconRedo, IconFaceSmileFill, IconQuote } from '@arco-design/web-vue/es/icon';
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';

// 使用 shallowRef 而不是 ref 来避免对象被冻结的问题
const text = shallowRef('');
const router = useRouter();

// 编辑器引用
const editorRef = ref(null);

// 控制编辑器功能的响应式数据
const showPreview = ref(true);
const showToc = ref(false);
const syncScroll = ref(true);
const isFullscreen = ref(false);
const showEmojiPicker = ref(false); // 控制表情选择器显示

// 编辑器模式
const editorMode = ref('both'); // 'edit', 'preview', 'both'

const goBack = () => {

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

// 字体颜色处理函数
const formatColor = () => {
  const textInfo = getSelectedTextInfo();
  if (!textInfo) return;

  const { textarea, start, end, selectedText } = textInfo;

  // 检查是否已经设置了字体颜色（只在选中文本时检查）
  if (selectedText.length > 0) {
    // 定义颜色标签
    const colorTagStart = '<span style="color: #0080ff;">';
    const colorTagEnd = '</span>';

    // 检查选中文本是否已经被颜色标签包围
    if (selectedText.startsWith(colorTagStart) && selectedText.endsWith(colorTagEnd) && selectedText.length > 35) {
      // 取消颜色：去掉前后标签
      const unformattedText = selectedText.substring(colorTagStart.length, selectedText.length - colorTagEnd.length);
      const newText = text.value.substring(0, start) + unformattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start);
    } else {
      // 设置颜色：包裹标签
      // 这里我们可以弹出一个颜色选择器，但为了简化，我们使用默认颜色
      const formattedText = `<span style="color: #0080ff;">${selectedText}</span>`;
      const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start + colorTagStart.length);
    }
  } else {
    // 如果没有选中文本，检查当前行是否已经设置了字体颜色
    const lineInfo = getCurrentLineText();
    if (lineInfo) {
      const { lineText, lineStart, lineEnd, cursorPositionInLine } = lineInfo;
      const colorTagStart = '<span style="color: #0080ff;">';
      const colorTagEnd = '</span>';

      // 检查当前行是否已经被颜色标签包围
      if (lineText.startsWith(colorTagStart) && lineText.endsWith(colorTagEnd) && lineText.length > 35) {
        // 取消整行颜色：去掉前后标签
        const unformattedText = lineText.substring(colorTagStart.length, lineText.length - colorTagEnd.length);
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + unformattedText + afterText;
        // 保持光标在原来的位置（相对位置不变）
        const newCursorPosition = lineStart + cursorPositionInLine - colorTagStart.length;
        updateTextAndSetCursor(newText, Math.max(lineStart, newCursorPosition));
      } else {
        // 整行设置颜色：包裹标签
        const formattedText = `<span style="color: #0080ff;">${lineText}</span>`;
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + formattedText + afterText;
        // 保持光标在原来的位置（相对位置不变）
        const newCursorPosition = lineStart + colorTagStart.length + cursorPositionInLine;
        updateTextAndSetCursor(newText, newCursorPosition);
      }
    } else {
      // 如果无法获取行信息，则在光标位置插入颜色标签
      const newText = text.value.substring(0, start) + `<span style="color: #0080ff;"></span>` + text.value.substring(end);
      updateTextAndSetCursor(newText, start + 29); // '<span style="color: #0080ff;">'.length
    }
  }
};

// 背景颜色处理函数
const formatBackground = () => {
  const textInfo = getSelectedTextInfo();
  if (!textInfo) return;

  const { textarea, start, end, selectedText } = textInfo;

  // 检查是否已经设置了背景颜色（只在选中文本时检查）
  if (selectedText.length > 0) {
    // 定义背景颜色标签
    const bgColorTagStart = '<span style="background-color: #ffff00;">';
    const bgColorTagEnd = '</span>';

    // 检查选中文本是否已经被背景颜色标签包围
    if (selectedText.startsWith(bgColorTagStart) && selectedText.endsWith(bgColorTagEnd) && selectedText.length > 45) {
      // 取消背景颜色：去掉前后标签
      const unformattedText = selectedText.substring(bgColorTagStart.length, selectedText.length - bgColorTagEnd.length);
      const newText = text.value.substring(0, start) + unformattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start);
    } else {
      // 设置背景颜色：包裹标签
      const formattedText = `<span style="background-color: #ffff00;">${selectedText}</span>`;
      const newText = text.value.substring(0, start) + formattedText + text.value.substring(end);
      updateTextAndSetCursor(newText, start + bgColorTagStart.length);
    }
  } else {
    // 如果没有选中文本，检查当前行是否已经设置了背景颜色
    const lineInfo = getCurrentLineText();
    if (lineInfo) {
      const { lineText, lineStart, lineEnd, cursorPositionInLine } = lineInfo;
      const bgColorTagStart = '<span style="background-color: #ffff00;">';
      const bgColorTagEnd = '</span>';

      // 检查当前行是否已经被背景颜色标签包围
      if (lineText.startsWith(bgColorTagStart) && lineText.endsWith(bgColorTagEnd) && lineText.length > 45) {
        // 取消整行背景颜色：去掉前后标签
        const unformattedText = lineText.substring(bgColorTagStart.length, lineText.length - bgColorTagEnd.length);
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + unformattedText + afterText;
        // 保持光标在原来的位置（相对位置不变）
        const newCursorPosition = lineStart + cursorPositionInLine - bgColorTagStart.length;
        updateTextAndSetCursor(newText, Math.max(lineStart, newCursorPosition));
      } else {
        // 整行设置背景颜色：包裹标签
        const formattedText = `<span style="background-color: #ffff00;">${lineText}</span>`;
        const beforeText = text.value.substring(0, lineStart);
        const afterText = text.value.substring(lineEnd);
        const newText = beforeText + formattedText + afterText;
        // 保持光标在原来的位置（相对位置不变）
        const newCursorPosition = lineStart + bgColorTagStart.length + cursorPositionInLine;
        updateTextAndSetCursor(newText, newCursorPosition);
      }
    } else {
      // 如果无法获取行信息，则在光标位置插入背景颜色标签
      const newText = text.value.substring(0, start) + `<span style="background-color: #ffff00;"></span>` + text.value.substring(end);
      updateTextAndSetCursor(newText, start + 39); // '<span style="background-color: #ffff00;">'.length
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




// 文本格式化函数
const formatText = (type) => {
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
      formatColor();
      break;
    case 'background':
      formatBackground();
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
  const route = useRoute();
  const { data } = await api.get('/post', { id: route.query.p })
  text.value = data.content
})

</script>

<style scoped lang="less">
.editor-container {
  height: calc(100vh - 40px);
  overflow: hidden;
  padding: 20px;
}

.tool-list {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.control-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.control-buttons .arco-btn {
  white-space: nowrap;
}

.formatting-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  align-items: center;
}

.format-button {
  min-width: 32px;
  padding: 4px 8px;
  font-size: 14px;
}

.format-button:hover {
  background-color: #f2f3f5;
}

/* Markdown 编辑器主题配色 */
.editor-container :deep(.v-md-editor) {
  border: 1px solid #e5e5e5;
  border-radius: 4px;
}

.editor-container :deep(.v-md-editor .v-md-mode-edit) {
  background-color: #fff;
}

.editor-container :deep(.v-md-editor .v-md-mode-preview) {
  background-color: #fff;
}

/* 工具栏样式 */
.editor-container :deep(.v-md-editor .v-md-toolbar) {
  background-color: #f7f8fa;
  border-bottom: 1px solid #e5e5e5;
  padding: 8px 12px;
}

.editor-container :deep(.v-md-editor .v-md-toolbar-item) {
  color: #1f1f1f;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.editor-container :deep(.v-md-editor .v-md-toolbar-item:hover) {
  background-color: #e5e6eb;
}

.editor-container :deep(.v-md-editor .v-md-toolbar-item.active) {
  background-color: #0080ff;
  color: #fff;
}

/* 编辑区域样式 */
.editor-container :deep(.v-md-editor .v-md-textarea) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  color: #1f1f1f;
  background-color: #fff;
}

/* 预览区域样式 */
.editor-container :deep(.v-md-editor .v-md-preview) {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 14px;
  color: #1f1f1f;
  background-color: #fff;
}

/* 标题样式 */
.editor-container :deep(.v-md-editor .v-md-preview h1),
.editor-container :deep(.v-md-editor .v-md-preview h2),
.editor-container :deep(.v-md-editor .v-md-preview h3),
.editor-container :deep(.v-md-editor .v-md-preview h4),
.editor-container :deep(.v-md-editor .v-md-preview h5),
.editor-container :deep(.v-md-editor .v-md-preview h6) {
  color: #1f1f1f;
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.editor-container :deep(.v-md-editor .v-md-preview h1) {
  font-size: 32px;
  border-bottom: 1px solid #e5e5e5;
  padding-bottom: 0.3em;
}

.editor-container :deep(.v-md-editor .v-md-preview h2) {
  font-size: 28px;
  border-bottom: 1px solid #e5e5e5;
  padding-bottom: 0.3em;
}

.editor-container :deep(.v-md-editor .v-md-preview h3) {
  font-size: 24px;
}

.editor-container :deep(.v-md-editor .v-md-preview h4) {
  font-size: 20px;
}

.editor-container :deep(.v-md-editor .v-md-preview h5) {
  font-size: 16px;
}

.editor-container :deep(.v-md-editor .v-md-preview h6) {
  font-size: 14px;
  color: #595959;
}

/* 段落样式 */
.editor-container :deep(.v-md-editor .v-md-preview p) {
  margin-top: 0;
  margin-bottom: 16px;
  line-height: 1.5;
}

/* 列表样式 */
.editor-container :deep(.v-md-editor .v-md-preview ul),
.editor-container :deep(.v-md-editor .v-md-preview ol) {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.editor-container :deep(.v-md-editor .v-md-preview li) {
  line-height: 1.5;
}

.editor-container :deep(.v-md-editor .v-md-preview li + li) {
  margin-top: 4px;
}

.editor-container :deep(.v-md-editor .v-md-preview ul li) {
  list-style-type: disc;
}

.editor-container :deep(.v-md-editor .v-md-preview ol li) {
  list-style-type: decimal;
}

/* 任务列表样式 */
.editor-container :deep(.v-md-editor .v-md-preview .contains-task-list) {
  padding-left: 0;
  list-style-type: none;
}

.editor-container :deep(.v-md-editor .v-md-preview .contains-task-list li.task-list-item) {
  margin-left: 24px;
}

.editor-container :deep(.v-md-editor .v-md-preview .contains-task-list li.task-list-item::before) {
  content: "";
  display: none;
}

.editor-container :deep(.v-md-editor .v-md-preview .contains-task-list input[type="checkbox"]) {
  margin-right: 8px;
}

/* 链接样式 */
.editor-container :deep(.v-md-editor .v-md-preview a) {
  color: #0080ff;
  text-decoration: none;
}

.editor-container :deep(.v-md-editor .v-md-preview a:hover) {
  text-decoration: underline;
}

/* 图片样式 */
.editor-container :deep(.v-md-editor .v-md-preview img) {
  max-width: 100%;
  box-sizing: content-box;
  background-color: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 4px;
}

.editor-container :deep(.v-md-editor .v-md-preview img[align="right"]) {
  padding-left: 20px;
}

.editor-container :deep(.v-md-editor .v-md-preview img[align="left"]) {
  padding-right: 20px;
}

/* 代码块样式 */
.editor-container :deep(.v-md-editor .v-md-preview pre) {
  background-color: #f7f8fa;
  border-radius: 4px;
  padding: 16px;
  overflow: auto;
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 85%;
  line-height: 1.45;
}

.editor-container :deep(.v-md-editor .v-md-preview code) {
  background-color: #f7f8fa;
  border-radius: 4px;
  padding: 2px 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 85%;
}

.editor-container :deep(.v-md-editor .v-md-preview pre code) {
  background-color: transparent;
  padding: 0;
}

/* 引用块样式 */
.editor-container :deep(.v-md-editor .v-md-preview blockquote) {
  margin: 0;
  padding: 0 1em;
  color: #595959;
  border-left: 0.25em solid #d9d9d9;
  margin-bottom: 16px;
}

.editor-container :deep(.v-md-editor .v-md-preview blockquote p) {
  margin: 0;
  padding: 8px 0;
}

/* 表格样式 */
.editor-container :deep(.v-md-editor .v-md-preview table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.editor-container :deep(.v-md-editor .v-md-preview table th),
.editor-container :deep(.v-md-editor .v-md-preview table td) {
  padding: 6px 13px;
  border: 1px solid #d9d9d9;
}

.editor-container :deep(.v-md-editor .v-md-preview table tr:nth-child(2n)) {
  background-color: #f7f8fa;
}

/* 分割线样式 */
.editor-container :deep(.v-md-editor .v-md-preview hr) {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #e5e5e5;
  border: 0;
}

/* 表情选择器样式 */
.emoji-picker-popup {
  padding: 10px;
  background-color: var(--color-bg-popup);
  border-radius: 4px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.15);
}
</style>