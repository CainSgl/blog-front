import request from './request.js';

const api = {
  /**
   * GET请求
   * @param {string} url - 请求URL
   * @param {object} params - URL参数
   * @param {object} config - axios配置
   * @returns {Promise}
   */
  get(url, params = {}, config = {}) 
  {
    return request({
      url,
      method: 'get',
      params,
      ...config,
    });
  },

  /**
   * POST请求
   * @param {string} url - 请求URL
   * @param {object} data - 请求体数据
   * @param {object} config - axios配置
   * @returns {Promise}
   */
  post(url, data = {}, config = {}) 
  {
    return request({
      url,
      method: 'post',
      data,
      ...config,
    });
  },

  /**
   * PUT请求
   * @param {string} url - 请求URL
   * @param {object} data - 请求体数据
   * @param {object} config - axios配置
   * @returns {Promise}
   */
  put(url, data = {}, config = {}) 
  {
    return request({
      url,
      method: 'put',
      data,
      ...config,
    });
  },

  /**
   * DELETE请求
   * @param {string} url - 请求URL
   * @param {object} params - URL参数
   * @param {object} config - axios配置
   * @returns {Promise}
   */
  delete(url, params = {}, config = {}) 
  {
    return request({
      url,
      method: 'delete',
      params,
      ...config,
    });
  },
};

export default api;
