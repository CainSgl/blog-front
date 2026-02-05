import {defineStore} from 'pinia';
import {ref} from 'vue';
import {useUserStore} from './user';
import {useUserSettingStore} from './userSetting';
import api from '@/api/index.js';

export const useAuthStore = defineStore('auth', () => 
{
  const showLoginModal = ref(false);
  const allowClose = ref(true);  // 控制是否允许关闭登录弹窗
  const isLoading = ref(false);
  const userStore = useUserStore();
  const userSettingStore = useUserSettingStore();

  const openLogin = (b) => 
  {
    showLoginModal.value = true;
    allowClose.value = b !== undefined ? b : true;  // 如果参数b存在，则使用b的值，否则默认为true
  };

  const closeLogin = () => 
  {
    showLoginModal.value = false;
    // 关闭登录弹窗时清空token等用户信息，避免重复弹出
    userStore.clearUserInfo();
  };

  const login = async (credentials) => 
  {
    isLoading.value = true;
    try 
    {
      // 调用登录接口
      const loginData = {
        account: credentials.username,
        password: credentials.password,
      };
      
      // 如果有验证码，添加验证码相关参数
      if (credentials.captcha) {
        loginData.captcha = credentials.captcha;
        loginData.code = credentials.code;
      }
      
      const res = await api.post('/user/login', loginData);
      //如果没抛出异常，代码肯定是执行到这里了，继续执行
      console.log(res);
      if(!res.data.userInfo)
      {
        //返回
        throw res.data
      }
      userStore.setUserInfo(res.data.userInfo);
      userStore.setToken(res.data.token);
      
      // 登录成功后，初始化用户设置
      try {
        await userSettingStore.initSettings();
      } catch (settingError) {
        console.warn('初始化用户设置失败，但不影响登录:', settingError);
      }
    }
    catch (error) 
    {
      throw error;
    }
    finally
    {
      isLoading.value = false;
    }
  };
  const logout = () => 
  {
    api.post('/user/logout');
    userStore.clearUserInfo();
    // 退出登录时清除用户设置（不删除服务器数据）
    userSettingStore.clearSettings(false);
  };
  const checkLogin = () => 
  {
    return userStore.isUserLoggedIn();
  };

  return {
    showLoginModal,
    allowClose,
    isLoading,
    openLogin,
    closeLogin,
    login,
    logout,
    checkLogin,
  };
});
