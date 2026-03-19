<template>
  <div class="ai-chat-page">
    <!-- 顶部标题栏 -->
    <Header 
      :show-search="false" 
      :show-border="true"
      :padding="false"
    />
    <div class="header-container"></div>

    <!-- 左上角刷新按钮 -->
    <div class="refresh-button-container">
      <a-tooltip content="清空会话">
        <a-button 
          shape="circle"
          size="large"
          @click="handleRefreshClick"
          :disabled="isAITyping"
          class="refresh-button"
        >
          <template #icon>
            <icon-refresh />
          </template>
        </a-button>
      </a-tooltip>
    </div>

    <!-- 消息列表 -->
    <AIMessageList
      :messages="messages"
      :is-typing="isAITyping"
      :retrieval-stages="currentRetrievalStages"
      :streaming-content="currentAIContent"
      :reasoning-content="currentReasoningContent"
      :user-info="userInfo"
      :has-more-history="hasMoreHistory"
      :is-loading-history="isLoadingHistory"
      @load-history="handleLoadHistory"
      @send-suggestion="handleSend"
    />

    <!-- 输入区 -->
    <AIInputArea
      v-model:config="config"
      :disabled="isAITyping"
      @send="handleSend"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Message, Modal } from '@arco-design/web-vue';
import { IconRefresh } from '@arco-design/web-vue/es/icon';
import Header from '@/components/layout/Header.vue';
import AIMessageList from './components/AIMessageList.vue';
import AIInputArea from './components/AIInputArea.vue';
import { useUserStore } from '@/store/user';
import { chatWithAI, getChatHistory, resetAIMemory } from '@/api/ai';

const userStore = useUserStore();

// 用户信息
const userInfo = computed(() => userStore.userInfo);

// 配置项
const config = ref({
  memory: true,
  rag: 'auto',
  model: 'auto'
});

// 消息列表
const messages = ref([]);

// AI是否正在输入
const isAITyping = ref(false);

// 当前检索阶段列表（结构化）
const currentRetrievalStages = ref([]);

// 阶段引用映射（用于追踪各类阶段，支持多线程乱序）
const stageRefs = {
  search: null,      // 文档搜索阶段
  filter: null,      // 文档筛选阶段
  extract: null,     // 内容提取阶段
};

// 当前 AI 消息的累积内容（响应式）
const currentAIContent = ref('');

// 当前 AI 的思考过程（响应式）
const currentReasoningContent = ref('');

// 当前的补充建议（响应式）
const currentSuggestions = ref(null);

// 当前 SSE 连接的取消函数
let cancelCurrentChat = null;

// 历史记录游标
const historyCursor = ref(null);
const hasMoreHistory = ref(true);
const isLoadingHistory = ref(false);

// 创建新阶段（返回阶段引用）
const createStage = (title, summary = null) => {
  const stage = {
    id: `${Date.now()}-${Math.random()}`, // 唯一ID
    title,
    summary,
    completed: false,
    collapsed: true, // 默认折叠
    steps: [],
    documents: [],
    documentGroups: [] // 新增：文档分组数组
  };
  currentRetrievalStages.value.push(stage);
  
  // 根据标题保存引用（用于后续乱序事件定位）
  if (title === '文档搜索') stageRefs.search = stage;
  else if (title === '文档筛选') stageRefs.filter = stage;
  else if (title === '内容提取') stageRefs.extract = stage;
  
  return stage;
};

// 根据标题查找阶段（查找最后一个匹配的）
const findStageByTitle = (title) => {
  for (let i = currentRetrievalStages.value.length - 1; i >= 0; i--) {
    if (currentRetrievalStages.value[i].title === title) {
      return currentRetrievalStages.value[i];
    }
  }
  return null;
};

// 完成指定阶段
const completeStage = (stage) => {
  if (stage) {
    stage.completed = true;
    // 完成所有子步骤
    stage.steps.forEach(step => step.completed = true);
  }
};

// 添加子步骤到指定阶段
const addStepToStage = (stage, message, detail = null, completed = false) => {
  if (stage) {
    stage.steps.push({
      message,
      detail,
      completed
    });
  }
};

// 完成阶段的最后一个步骤
const completeLastStepOfStage = (stage) => {
  if (stage && stage.steps.length > 0) {
    stage.steps[stage.steps.length - 1].completed = true;
  }
};

// 添加文档到指定阶段
const addDocumentToStage = (stage, document) => {
  if (stage) {
    stage.documents.push(document);
  }
};

// 添加文档分组到指定阶段
const addDocumentGroupToStage = (stage, groupName) => {
  if (stage) {
    const group = {
      name: groupName,
      collapsed: true, // 默认收起
      documents: []
    };
    stage.documentGroups.push(group);
    return group;
  }
  return null;
};

// 添加文档到最后一个分组
const addDocumentToLastGroup = (stage, document) => {
  if (stage && stage.documentGroups.length > 0) {
    const lastGroup = stage.documentGroups[stage.documentGroups.length - 1];
    lastGroup.documents.push(document);
  }
};

// 加载历史消息
const handleLoadHistory = async () => {
  if (isLoadingHistory.value || !hasMoreHistory.value) {
    console.log('跳过加载：', { isLoadingHistory: isLoadingHistory.value, hasMoreHistory: hasMoreHistory.value });
    return;
  }

  isLoadingHistory.value = true;
  
  try {
    const result = await getChatHistory({
      after: historyCursor.value,
      limit: 20
    });

    console.log('历史消息返回:', result);

    // 如果返回的消息为空，说明没有更多了
    if (!result.messages || result.messages.length === 0) {
      hasMoreHistory.value = false;
      console.log('没有更多历史消息了');
      return;
    }

    // 将历史消息添加到列表开头（因为返回的是倒序）
    const historyMessages = result.messages.reverse().map((msg, index) => ({
      id: `history-${historyCursor.value || 'initial'}-${index}`,
      role: msg.role === 'User' ? 'user' : 'assistant',
      content: msg.content,
      createdAt: msg.createTime
    }));
    
    messages.value.unshift(...historyMessages);

    // 更新游标
    historyCursor.value = result.after || null;
    
    // 只有返回的消息数量 >= 20 条时，才认为可能还有更多
    hasMoreHistory.value = result.messages.length >= 20;
    
    console.log('历史消息加载完成，还有更多:', hasMoreHistory.value, '游标:', historyCursor.value, '返回数量:', result.messages.length);
  } catch (error) {
    console.error('加载历史消息失败:', error);
    Message.error('加载历史消息失败');
  } finally {
    isLoadingHistory.value = false;
  }
};

// 发送消息
const handleSend = (content) => {
  // 取消之前的连接（如果存在）
  if (cancelCurrentChat) {
    cancelCurrentChat();
  }

  // 添加用户消息
  const userMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content,
    createdAt: new Date().toISOString()
  };
  messages.value.push(userMessage);

  // 重置状态
  isAITyping.value = true;
  currentRetrievalStages.value = [];
  stageRefs.search = null;
  stageRefs.filter = null;
  stageRefs.extract = null;
  currentAIContent.value = '';
  currentReasoningContent.value = '';
  currentSuggestions.value = null;

  // 建立 SSE 连接
  cancelCurrentChat = chatWithAI(
    { content, kbIds: [] },
    (eventType, data) => {
      // 处理不同的事件类型
      switch (eventType) {
        case 'mode_decision': {
          // 始终显示模式决策阶段
          const stage = createStage('模式决策', data.message);
          completeStage(stage);
          break;
        }

        case 'memory_compress_start': {
          createStage('压缩对话记忆', data.message || '开始压缩对话记忆...');
          break;
        }

        case 'memory_compress_complete': {
          const stage = findStageByTitle('压缩对话记忆');
          if (stage) {
            completeLastStepOfStage(stage);
            addStepToStage(
              stage,
              '压缩完成',
              data.message || `已压缩为 ${data.compressedCount || 0} 条记忆`,
              true
            );
            completeStage(stage);
          }
          break;
        }

        case 'memory_loaded': {
          // 根据数据结构生成不同的摘要信息
          let memorySummary = data.message || '已加载记忆';
          if (data.recentCount !== undefined && data.totalCount !== undefined) {
            memorySummary = `最近 ${data.recentCount} 条，共 ${data.totalCount} 条${data.hasCompressed ? '（已压缩）' : ''}`;
          }
          const stage = createStage('记忆加载', memorySummary);
          completeStage(stage);
          break;
        }

        case 'search_start': {
          const stage = createStage('文档搜索', data.message);
          addStepToStage(stage, '开始向量搜索...', null, false);
          break;
        }

        case 'search_complete': {
          const stage = stageRefs.search || findStageByTitle('文档搜索');
          if (stage) {
            completeLastStepOfStage(stage);
            addStepToStage(
              stage,
              '向量搜索完成',
              `找到 ${data.count || data.documentCount} 个候选文档`,
              true
            );
            
            // 创建"向量搜索结果"分组
            if ((data.count || data.documentCount) > 0) {
              addDocumentGroupToStage(stage, '向量搜索结果');
            }
          }
          break;
        }

        case 'search_document_found': {
          // 添加检索到的文档到最后一个分组
          const stage = stageRefs.search || findStageByTitle('文档搜索');
          if (stage) {
            addDocumentToLastGroup(stage, {
              documentId: data.documentId,
              title: data.title,
              summary: data.summary,
              tags: data.tags,
              score: data.score
            });
          }
          break;
        }

        case 'filter_need_more': {
          // AI 建议继续搜索
          const stage = stageRefs.search || findStageByTitle('文档搜索');
          if (stage) {
            completeLastStepOfStage(stage);
            addStepToStage(stage, 'AI 建议继续搜索', data.message, true);
          }
          break;
        }

        case 'keyword_extraction_started': {
          // 向量搜索未找到，开始关键词提取
          const stage = stageRefs.search || findStageByTitle('文档搜索');
          if (stage) {
            completeLastStepOfStage(stage);
            addStepToStage(stage, '向量搜索未找到文档', null, true);
            addStepToStage(stage, 'AI 正在提取关键词...', data.message, false);
          }
          break;
        }

        case 'keyword_extraction_complete': {
          // 关键词提取完成
          const stage = stageRefs.search || findStageByTitle('文档搜索');
          if (stage) {
            completeLastStepOfStage(stage);
            addStepToStage(
              stage,
              '关键词提取完成',
              `提取关键词: ${data.keywords.join('、')}`,
              true
            );
          }
          break;
        }

        case 'keyword_search_start': {
          // 开始关键词搜索
          const stage = stageRefs.search || findStageByTitle('文档搜索');
          if (stage) {
            addStepToStage(
              stage,
              `第 ${data.attempt} 次关键词搜索`,
              `使用关键词: ${data.keywords.join('、')}`,
              false
            );
          }
          break;
        }

        case 'keyword_search_complete': {
          // 关键词搜索完成
          const stage = stageRefs.search || findStageByTitle('文档搜索');
          if (stage) {
            completeLastStepOfStage(stage);
            addStepToStage(
              stage,
              '关键词搜索完成',
              `找到 ${data.count} 个候选文档`,
              true
            );
            
            // 创建"词项搜索N"分组
            if (data.count > 0) {
              const groupName = `词项搜索${data.attempt}`;
              addDocumentGroupToStage(stage, groupName);
            }
          }
          break;
        }

        case 'filter_document_selected': {
          // 如果还没有筛选阶段，创建一个
          let stage = stageRefs.filter || findStageByTitle('文档筛选');
          if (!stage) {
            // 完成搜索阶段
            const searchStage = stageRefs.search || findStageByTitle('文档搜索');
            if (searchStage) completeStage(searchStage);
            
            stage = createStage('文档筛选', '正在筛选最相关的文档...');
          }
          addStepToStage(stage, `已筛选文档: ${data.title}`, data.message, true);
          break;
        }

        case 'filter_success': {
          const stage = stageRefs.filter || findStageByTitle('文档筛选');
          if (stage) {
            completeLastStepOfStage(stage);
            addStepToStage(
              stage,
              '文档筛选完成',
              `从 ${data.totalCount} 篇中筛选出 ${data.selectedCount} 篇`,
              true
            );
            completeStage(stage);
          }
          break;
        }

        case 'extract_start': {
          // 完成文档搜索阶段（如果存在）
          const searchStage = stageRefs.search || findStageByTitle('文档搜索');
          if (searchStage && !searchStage.completed) {
            completeStage(searchStage);
          }
          
          createStage('内容提取', data.message);
          break;
        }

        case 'extract_evaluate_start': {
          const stage = stageRefs.extract || findStageByTitle('内容提取');
          if (stage) {
            addStepToStage(stage, 'AI 正在评估文档...', data.message, false);
          }
          break;
        }

        case 'extract_evaluate_complete': {
          const stage = stageRefs.extract || findStageByTitle('内容提取');
          if (stage) {
            completeLastStepOfStage(stage);
            addStepToStage(
              stage,
              '文档评估完成',
              `选择 ${data.selectedCount}/${data.totalCount} 篇文档`,
              true
            );
          }
          break;
        }

        case 'extract_documents_selected': {
          const stage = stageRefs.extract || findStageByTitle('内容提取');
          if (stage) {
            addStepToStage(stage, data.message, null, true);
          }
          break;
        }

        case 'extract_posts_loaded': {
          const stage = stageRefs.extract || findStageByTitle('内容提取');
          if (stage) {
            addStepToStage(stage, data.message, null, true);
          }
          break;
        }

        case 'document_chunked': {
          // 文档分块完成
          const stage = stageRefs.extract || findStageByTitle('内容提取');
          if (stage) {
            addStepToStage(
              stage,
              `正在提取: ${data.title}`,
              `文档长度 ${data.totalLength} 字符，分为 ${data.chunkCount} 个分块`,
              false
            );
            // 保存 documentId 到步骤中
            if (stage.steps.length > 0) {
              const lastStep = stage.steps[stage.steps.length - 1];
              lastStep.chunksCollapsed = true; // 默认折叠
              lastStep.documentId = data.documentId; // 保存文档ID
            }
          }
          break;
        }

        case 'chunk_evaluated': {
          // 分块评估完成
          const stage = stageRefs.extract || findStageByTitle('内容提取');
          if (stage && stage.steps.length > 0) {
            // 根据 documentId 找到对应的步骤
            const targetStep = stage.steps.find(step => step.documentId === data.documentId);
            if (targetStep) {
              if (!targetStep.chunks) {
                targetStep.chunks = [];
              }
              targetStep.chunks.push({
                index: data.chunkIndex,
                total: data.totalChunks,
                score: data.score,
                canAnswer: data.canAnswer,
                preview: data.preview
              });
              
              // 如果是最后一个分块，标记为完成
              if (data.chunkIndex === data.totalChunks) {
                targetStep.completed = true;
              }
            }
          }
          break;
        }

        case 'extract_content_collected': {
          // 内容收集完成
          const stage = stageRefs.extract || findStageByTitle('内容提取');
          if (stage) {
            addStepToStage(stage, '内容收集完成', data.message, true);
          }
          break;
        }

        case 'extract_complete': {
          const stage = stageRefs.extract || findStageByTitle('内容提取');
          if (stage) {
            completeLastStepOfStage(stage);
            completeStage(stage);
          }
          break;
        }

        case 'complexity_evaluation': {
          const stage = createStage(
            '复杂度评估',
            `复杂度: ${data.score*10}%，选择模型: ${data.selectedModel}`
          );
          completeStage(stage);
          break;
        }

        case 'answer_start': {
          const stage = createStage('生成回答', data.message);
          completeStage(stage);
          
          // 如果有思考过程，创建思考过程阶段
          if (currentReasoningContent.value) {
            const reasoningStage = createStage('思考过程', '正在思考...');
            reasoningStage.collapsed = true; // 默认收起
            reasoningStage.reasoning = true; // 标记为思考过程阶段
          }
          break;
        }

        case 'message':
          // 流式接收 AI 回答内容
          if (data && data.length > 0) {
            const messageData = data[0];
            if (messageData.message) {
              // 累积正常回答内容
              if (messageData.message.content) {
                currentAIContent.value += messageData.message.content;
              }
              // 累积思考过程
              if (messageData.message.reasoning_content) {
                currentReasoningContent.value += messageData.message.reasoning_content;
              }
            }
          }
          break;

        case 'followup_start':
          // 开始生成补充建议
          console.log('开始生成补充建议:', data.message);
          break;

        case 'followup_suggestions':
          // 收到补充建议（此时消息可能还没添加到列表）
          console.log('收到补充建议:', data.suggestions);
          if (data.suggestions && data.suggestions.length > 0) {
            // 先保存到临时变量
            currentSuggestions.value = data.suggestions;
            console.log('已保存补充建议到临时变量');
            
            // 如果消息已经添加到列表，立即更新
            const lastIndex = messages.value.length - 1;
            if (lastIndex >= 0 && messages.value[lastIndex].role === 'assistant') {
              console.log('消息已存在，立即更新');
              const updatedMessage = {
                ...messages.value[lastIndex],
                suggestions: data.suggestions,
                isGeneratingSuggestions: false
              };
              messages.value.splice(lastIndex, 1, updatedMessage);
            }
          }
          break;

        case 'answer_complete':
          // 回答完成，添加到消息列表
          const aiMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: currentAIContent.value,
            reasoningContent: currentReasoningContent.value, // 保存思考过程
            createdAt: new Date().toISOString(),
            retrievalStages: [...currentRetrievalStages.value],
            suggestions: currentSuggestions.value, // 使用已接收的建议（如果有）
            isGeneratingSuggestions: !currentSuggestions.value // 如果还没收到建议，标记为正在生成
          };
          messages.value.push(aiMessage);
          console.log('添加 AI 消息到列表:', aiMessage);
          
          // 重置状态（但保持连接以接收建议）
          isAITyping.value = false;
          currentRetrievalStages.value = [];
          stageRefs.search = null;
          stageRefs.filter = null;
          stageRefs.extract = null;
          currentAIContent.value = '';
          currentReasoningContent.value = '';
          // 注意：不重置 currentSuggestions，因为可能还会用到
          break;

        case 'done':
          // 流式传输结束标记
          console.log('SSE 流结束:', data.message);
          // 清理连接
          cancelCurrentChat = null;
          // 重置临时建议
          currentSuggestions.value = null;
          // 如果最后一条消息还在生成建议，标记为完成
          const lastIndex2 = messages.value.length - 1;
          if (lastIndex2 >= 0 && messages.value[lastIndex2].role === 'assistant' && messages.value[lastIndex2].isGeneratingSuggestions) {
            const updatedMessage = {
              ...messages.value[lastIndex2],
              isGeneratingSuggestions: false
            };
            messages.value.splice(lastIndex2, 1, updatedMessage);
          }
          break;

        case 'error':
          // 错误处理
          Message.error(data.message || 'AI 回答出错');
          isAITyping.value = false;
          currentRetrievalStages.value = [];
          stageRefs.search = null;
          stageRefs.filter = null;
          stageRefs.extract = null;
          currentAIContent.value = '';
          currentReasoningContent.value = '';
          cancelCurrentChat = null;
          break;
      }
    },
    (error) => {
      // 连接错误处理
      console.error('SSE 连接错误:', error);
      Message.error('连接失败，请重试');
      isAITyping.value = false;
      currentRetrievalStages.value = [];
      stageRefs.search = null;
      stageRefs.filter = null;
      stageRefs.extract = null;
      currentAIContent.value = '';
      currentReasoningContent.value = '';
      cancelCurrentChat = null;
    }
  );
};

// 初始化加载历史消息
onMounted(() => {
  handleLoadHistory();
});

// 处理刷新按钮点击
const handleRefreshClick = () => {
  Modal.confirm({
    title: '清空会话',
    content: '确定要清空当前会话吗？这将清除 AI 记忆和所有聊天记录。\n针对上下文过多易引发模型幻觉的问题，我们已通过自动压缩上下文技术解决，无需担忧。',
    okText: '确定',
    cancelText: '取消',
    onOk: handleRefresh
  });
};

// 处理刷新（清空会话）
const handleRefresh = async () => {
  try {
    // 取消当前的聊天连接（如果存在）
    if (cancelCurrentChat) {
      cancelCurrentChat();
      cancelCurrentChat = null;
    }

    // 调用重置 API
    await resetAIMemory();

    // 清空本地消息列表
    messages.value = [];
    
    // 重置状态
    isAITyping.value = false;
    currentRetrievalStages.value = [];
    stageRefs.search = null;
    stageRefs.filter = null;
    stageRefs.extract = null;
    currentAIContent.value = '';
    currentReasoningContent.value = '';
    
    // 重置历史记录游标
    historyCursor.value = null;
    hasMoreHistory.value = true;

    Message.success('会话已清空');
  } catch (error) {
    console.error('清空会话失败:', error);
    Message.error('清空会话失败，请重试');
  }
};
</script>

<style scoped lang="less">
.ai-chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 100vw;
  background-color: var(--color-bg-1);
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;

  :deep(.arco-layout-header) {
    padding: 0;
    height: auto;
  }

  .header-container {
    height: 64px;
    flex-shrink: 0;
  }

  .refresh-button-container {
    position: fixed;
    right: 40px;
    bottom: 120px;
    z-index: 100;

    @media (max-width: 768px) {
      right: 20px;
      bottom: 100px;
    }

    @media (max-width: 480px) {
      right: 12px;
      bottom: 90px;
    }

    .refresh-button {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      
      &:hover:not(:disabled) {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      @media (max-width: 768px) {
        width: 40px;
        height: 40px;
      }

      @media (max-width: 480px) {
        width: 36px;
        height: 36px;
      }
    }
  }
}
</style>

<style lang="less">
// 自定义下拉选项样式（全局样式）
.arco-select-dropdown {
  .option-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px 0;
    min-width: 160px;
    max-width: 200px;

    .option-title {
      font-size: 14px;
      color: var(--color-text-1);
      line-height: 1.4;
    }

    .option-desc {
      font-size: 12px;
      color: var(--color-text-3);
      line-height: 1.4;
      white-space: normal;
      word-wrap: break-word;
      word-break: keep-all;
    }
  }
}
</style>
