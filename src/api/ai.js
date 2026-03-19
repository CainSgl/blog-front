import { API_BASE_URL } from '@/config';
import { useUserStore } from '@/store/user.js';
import api from './index';

/**
 * AI 聊天 SSE 连接（使用 fetch）
 * @param {Object} params - 请求参数
 * @param {string} params.content - 用户问题
 * @param {Array<number>} params.kbIds - 知识库ID列表（可选）
 * @param {Function} onEvent - 事件回调函数
 * @param {Function} onError - 错误回调函数
 * @returns {Function} - 取消连接的函数
 */
export function chatWithAI({ content, kbIds }, onEvent, onError) {
  const userStore = useUserStore();
  const token = userStore.getToken();

  const url = `${API_BASE_URL}/ai/chat`;
  
  let abortController = new AbortController();
  let isCancelled = false;

  // 使用 fetch 发送 POST 请求
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'token': token
    },
    body: JSON.stringify({
      content,
      ...(kbIds && kbIds.length > 0 ? { kbIds } : {})
    }),
    signal: abortController.signal
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = null;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done || isCancelled) break;

        buffer += decoder.decode(value, { stream: true });
        
        // 按行分割
        const lines = buffer.split('\n');
        
        // 保留最后一行（可能不完整）
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // 空行表示一个事件结束
          if (trimmedLine === '') {
            currentEvent = null;
            continue;
          }
          
          // 解析事件类型
          if (trimmedLine.startsWith('event:')) {
            currentEvent = trimmedLine.substring(6).trim();
            continue;
          }
          
          // 解析数据
          if (trimmedLine.startsWith('data:')) {
            const dataStr = trimmedLine.substring(5).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              const eventType = currentEvent || 'message';
              onEvent(eventType, data);
            } catch (e) {
              console.error('解析 SSE 数据失败:', e, dataStr);
            }
          }
        }
      }
    })
    .catch((error) => {
      if (error.name === 'AbortError' || isCancelled) {
        console.log('SSE 连接已取消');
        return;
      }
      console.error('SSE 连接错误:', error);
      if (onError) {
        onError(error);
      }
    });

  // 返回取消连接的函数
  return () => {
    isCancelled = true;
    abortController.abort();
  };
}

/**
 * 获取聊天历史记录
 * @param {Object} params - 请求参数
 * @param {string} params.after - 游标（ISO 8601格式时间戳）
 * @param {number} params.limit - 每页数量，默认20
 * @returns {Promise}
 */
export async function getChatHistory({ after = null, limit = 20 } = {}) {
  const params = { limit };
  if (after) {
    params.after = after;
  }

  const { data } = await api.get('/ai/history', params);
  return data;
}

/**
 * 重置 AI 聊天记忆
 * @returns {Promise}
 */
export async function resetAIMemory() {
  const { data } = await api.post('/ai/reset');
  return data;
}

/**
 * 生成标签
 * @param {string} content - 文章内容
 * @returns {Promise}
 */
export async function generateTags(content) {
  const { data } = await api.post('/ai/tag/generate', { content });
  return data;
}

/**
 * 生成摘要
 * @param {string} content - 文章内容
 * @returns {Promise}
 */
export async function generateSummary(content) {
  const { data } = await api.post('/ai/summary/generate', { content });
  return data;
}
