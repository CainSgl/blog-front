import request from './request.js';

const api = {
  /**
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
  

  post(url, data = {}, config = {}) 
  {
    return request({
      url,
      method: 'post',
      data,
      ...config,
    });
  },


  put(url, data = {}, config = {}) 
  {
    return request({
      url,
      method: 'put',
      data,
      ...config,
    });
  },


  delete(url, params = {}, config = {}) 
  {
    return request({
      url,
      method: 'delete',
      params,
      ...config,
    });
  }
  
};

export default api;