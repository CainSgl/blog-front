import api from '@/api/index.js';

/**
 * 聊天服务 - REST API
 */
class ChatService {
  /**
   * 获取会话列表
   */
  async getSessions() {
    const response = await api.get('/chat/sessions');
    return response.data;
  }

  /**
   * 创建或获取会话
   * @param {number} otherUserId - 对方用户ID
   */
  async createSession(otherUserId) {
    const response = await api.post(`/chat/session/${otherUserId}`);
    return response.data;
  }

  /**
   * 删除会话
   * @param {number} sessionId - 会话ID
   */
  async deleteSession(sessionId) {
    await api.delete(`/chat/session/${sessionId}`);
  }

  /**
   * 获取消息列表
   * @param {number} sessionId - 会话ID
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   */
  async getMessages(sessionId, page = 1, pageSize = 50) {
    const response = await api.post('/chat/messages', {
      sessionId,
      page,
      pageSize
    });
    return response.data;
  }

  /**
   * 发送消息（REST方式）
   * @param {number} receiverId - 接收者ID
   * @param {string} content - 消息内容
   */
  async sendMessage(receiverId, content) {
    const response = await api.post('/chat/send', {
      receiverId,
      content
    });
    return response.data;
  }

  /**
   * 标记消息已读
   * @param {number} sessionId - 会话ID
   */
  async markAsRead(sessionId) {
    await api.post(`/chat/read/${sessionId}`);
  }

  /**
   * 获取未读消息数量
   */
  async getUnreadCount() {
    const response = await api.get('/chat/unread-count');
    return response.data.count;
  }
}

export default new ChatService();
