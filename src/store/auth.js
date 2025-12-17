import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useUserStore } from './user';
import api from '@/api/index.js';

export const useAuthStore = defineStore('auth', () => 
{
  const showLoginModal = ref(false);
  const isLoading = ref(false);
  const userStore = useUserStore();

  const openLogin = () => 
  {
    showLoginModal.value = true;
  };

  const closeLogin = () => 
  {
    showLoginModal.value = false;
  };

  const login = async (credentials) => 
  {
    isLoading.value = true;
    try 
    {
      // 调用登录接口
      const res = await api.post('/user/login', {
        account: credentials.username,
        password: credentials.password,
      });
      //如果没抛出异常，代码肯定是执行到这里了，继续执行
      console.log(res);
      userStore.setUserInfo(res.data.userInfo);
      userStore.setToken(res.data.token);
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
    //调用api请求，但不需要等待结果
    api.get('/user/logout');
    userStore.clearUserInfo();
  };
  const checkLogin = () => 
  {
    return userStore.isUserLoggedIn();
  };

  return {
    showLoginModal,
    isLoading,
    openLogin,
    closeLogin,
    login,
    logout,
    checkLogin,
  };
});
