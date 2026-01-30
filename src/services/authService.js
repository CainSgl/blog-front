import {useAuthStore} from '@/store/auth';
import {useUserStore} from '@/store/user';

// 使用工厂函数创建登录服务，避免循环依赖
let loginServiceInstance = null;

export const getLoginService = () => 
{
  if (!loginServiceInstance) 
  {
    // 延迟初始化，避免循环依赖
    const authStore = useAuthStore();
    const userStore = useUserStore();
    
    loginServiceInstance = {
      // 检查是否已登录
      isLoggedIn: () => authStore.checkLogin(),
      
      // 打开登录弹窗
      //b代表是否允许关闭
      showLogin: (b) => 
      {
      
        authStore.openLogin(b);
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
        // 登录成功后刷新页面
        window.location.reload();
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
  }
  
  return loginServiceInstance;
};

// 导出全局函数，方便在组件中直接调用
export const requireLogin = () => 
{
  const loginService = getLoginService();
  if (!loginService.isLoggedIn()) 
  {
    loginService.showLogin();
    return false;
  }
  return true;
};

export const showLoginModal = (b) => 
{
  const loginService = getLoginService();
  loginService.showLogin(b);
};

export const hideLoginModal = () => 
{
  const loginService = getLoginService();
  loginService.hideLogin();
};