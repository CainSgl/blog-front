import axios from "axios";
import { Message, Notification } from "@arco-design/web-vue";
import { useUserStore } from "@/store/user.js";
import { showLoginModal } from "@/services/authService";
import { API_BASE_URL } from "@/config";

// 创建消息ID映射表，用于跟踪当前显示的消息
const messageMap = new Map();

// 创建axios实例
const service = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    if (userStore.getToken()) {
      config.headers["token"] = userStore.getToken();
    }
    // 打印URL、请求方式和参数
    console.debug("发送的请求:", {
      url: config.url,
      method: config.method,
      params: config.params,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const code = String(response.data.code);
    if (code.startsWith("200")) {
      return response.data;
    }

    //构造一下错误提醒
    const error = {
      debug: response.data.debug,
      message: response.data.msg || response.message,
      code: code,
      data: response.data,
      response: response,
    };
    //只处理未登录的请求，其他请求谁调用谁处理
    if (code == "40100") {
      //说明没有登录
      const userStore = useUserStore();
      if (userStore.getToken()) {
        // 检查是否已有相同ID的消息，如果有则先移除
        if (messageMap.has("40100")) {
          try {
            Message.clear("40100");
          } catch (e) {
            // 如果清除失败，忽略错误
          }
        }
        const msgInstance = Message.warning({
          id: "40100",
          content: "登录似乎过期了，请重新登录",
          duration: 3000,
          onClose: () => {
            // 消息关闭时从映射表中移除
            messageMap.delete("40100");
          },
        });
        // 将消息实例存入映射表
        messageMap.set("40100", msgInstance);
      } else {
        // 检查是否已有相同ID的消息，如果有则先移除
        if (messageMap.has("40100")) {
          try {
            Message.clear("40100");
          } catch (e) {
            // 如果清除失败，忽略错误
          }
        }
        const msgInstance = Message.info({
          id: "40100",
          content: "你还没有登录呢，登录享受更多服务哦",
          duration: 3000,
          onClose: () => {
            // 消息关闭时从映射表中移除
         
            messageMap.delete("40100");
          },
        });
        // 将消息实例存入映射表
        messageMap.set("40100", msgInstance);
      }
      showLoginModal();
      return;
    }
    if (code == "40101") {
      // 检查是否已有相同ID的消息，如果有则先移除
      if (messageMap.has("40101")) {
        try {
          Message.clear("40101");
        } catch (e) {
          // 如果清除失败，忽略错误
        }
      }
      const msgInstance = Message.error({
        id: "40101",
        content: "无权限操作",
        duration: 3000,
        onClose: () => {
          console.log("无权限操作消息关闭")
          // 消息关闭时从映射表中移除
          messageMap.delete("40101");
        },
      });
      // 将消息实例存入映射表
      messageMap.set("40101", msgInstance);
      return;
    }
    const errorMsgId = error.message
    const msgInstance = Message.error({
      id: errorMsgId,
      content: errorMsgId || "服务器异常",
      duration: 3000,
      onClose: () => {
        // 消息关闭时从映射表中移除
        messageMap.delete(errorMsgId);
      },
    });
    // 将消息实例存入映射表
    messageMap.set(errorMsgId, msgInstance);
    console.error("服务器成功响应，但返回的不是成功请求", error);
    return Promise.reject(error);
  },
  (error) => {
    console.error("Response error:", error);
    if (error.response) {
      const { status, data } = error.response;
      let message = `HTTP error: ${status}`;
      switch (status) {
        case 400:
          message = data?.message || data?.msg || "请求参数错误";
          break;
        case 401:
          message = "未授权，请重新登录";
          break;
        case 403:
          message = "拒绝访问";
          break;
        case 404:
          message = "请求的资源不存在";
          break;
        case 408:
          message = "请求超时";
          break;
        case 500:
          message = "服务器内部错误";
          break;
        case 501:
          message = "服务未实现";
          break;
        case 502:
          message = "网关错误";
          break;
        case 503:
          message = "服务不可用";
          break;
        case 504:
          message = "网关超时";
          break;
        default:
          message = data?.message || data?.msg || `HTTP error: ${status}`;
      }

      Notification.error({
        id: message,
        title: "请求错误",
        content: message,
        duration: 3000,
      });
    } else if (error.request) {
      Notification.error({
        id: "network-error",
        title: "网络错误",
        content: "无法连接到服务器，请检查网络连接",
        duration: 3000,
      });
    } else {
      Notification.error({
        id: "request-error",
        title: "请求错误",
        content: error.message || "未知错误",
        duration: 3000,
      });
    }
    return Promise.reject(error);
  }
);

// 导出消息映射表管理函数，供外部组件使用
export const messageManager = {
  /**
   * 检查指定ID的消息是否存在
   * @param {string} messageId - 消息ID
   * @returns {boolean} - 消息是否存在
   */
  hasMessage: (messageId) => {
    return messageMap.has(messageId);
  },

  /**
   * 获取指定ID的消息实例
   * @param {string} messageId - 消息ID
   * @returns {any} - 消息实例
   */
  getMessage: (messageId) => {
    return messageMap.get(messageId);
  },

  /**
   * 移除指定ID的消息
   * @param {string} messageId - 消息ID
   */
  removeMessage: (messageId) => {
    if (messageMap.has(messageId)) {
      try {
        Message.clear(messageId);
      } catch (e) {
        // 如果清除失败，忽略错误
      }
      messageMap.delete(messageId);
    }
  },

  /**
   * 获取所有消息ID
   * @returns {Array<string>} - 所有消息ID的数组
   */
  getAllMessageIds: () => {
    return Array.from(messageMap.keys());
  },

  /**
   * 清除所有消息
   */
  clearAllMessages: () => {
    for (const [messageId] of messageMap) {
      try {
        Message.clear(messageId);
      } catch (e) {
        // 如果清除失败，忽略错误
      }
    }
    messageMap.clear();
  },
};

export default service;
