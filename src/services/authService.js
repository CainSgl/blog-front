import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';

// 创建全局登录服务
export const createLoginService = () => 
{
  const authStore = useAuthStore();
  const userStore = useUserStore();
  
  return {
    // 检查是否已登录
    isLoggedIn: () => authStore.checkLogin(),
    
    // 打开登录弹窗
    showLogin: () => 
    {
      authStore.openLogin();
    },
    
    // 关闭登录弹窗
    hideLogin: () => 
    {
      authStore.closeLogin();
    },
    
    // 执行登录
    login: async (credentials) => 
    {
      // 执行登录操作
      const result = await authStore.login(credentials);
      return result;
    },
    
    // 登出
    logout: () => 
    {
      authStore.logout();
    },
    
    // 获取用户信息
    getUserInfo: () => 
    {
      return userStore.getUserInfo();
    },
    
    // 获取token
    getToken: () => 
    {
      return userStore.getToken();
    },
  };
};

// 创建全局实例
export const loginService = createLoginService();

// 导出全局函数，方便在组件中直接调用
export const requireLogin = () => 
{
  if (!loginService.isLoggedIn()) 
  {
    loginService.showLogin();
    return false;
  }
  return true;
};

export const showLoginModal = () => 
{
  loginService.showLogin();
};

export const hideLoginModal = () => 
{
  loginService.hideLogin();
};