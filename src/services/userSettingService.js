import api from '@/api/index.js';

/**
 * 用户设置服务
 * 提供用户自定义设置的 CRUD 操作
 */
class UserSettingService {
  /**
   * 获取用户设置
   * @returns {Promise<Object>} 用户设置对象
   */
  async getUserSetting() {
    try {
      const response = await api.get('/user/setting');
      return response.data || {};
    } catch (error) {
      console.error('获取用户设置失败:', error);
      return {};
    }
  }

  /**
   * 保存/更新用户设置
   * @param {Object} settings - 设置对象
   * @returns {Promise<Object>} 响应结果
   */
  async saveSetting(settings) {
    try {
      const response = await api.put('/user/setting', settings);
      return response;
    } catch (error) {
      console.error('保存用户设置失败:', error);
      throw error;
    }
  }

  /**
   * 删除用户设置
   * @returns {Promise<Object>} 响应结果
   */
  async deleteSetting() {
    try {
      const response = await api.delete('/user/setting');
      return response;
    } catch (error) {
      console.error('删除用户设置失败:', error);
      throw error;
    }
  }
}

export default new UserSettingService();
