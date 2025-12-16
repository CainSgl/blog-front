import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => 
{
  const isLoggedIn = ref(false);
  const showLoginModal = ref(false);
  const isLoading = ref(false);

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
      // 这里后面会实现具体的登录逻辑
      console.log('登录中...', credentials);
      // 模拟登录成功
      isLoggedIn.value = true;
      showLoginModal.value = false;
      return { success: true };
    }
    catch (error) 
    {
      console.error('登录失败:', error);
      return { success: false, error: error.message };
    }
    finally 
    {
      isLoading.value = false;
    }
  };

  const logout = () => 
  {
    isLoggedIn.value = false;
  };

  const checkLogin = () => 
  {
    return isLoggedIn.value;
  };

  return {
    isLoggedIn,
    showLoginModal,
    isLoading,
    openLogin,
    closeLogin,
    login,
    logout,
    checkLogin,
  };
});