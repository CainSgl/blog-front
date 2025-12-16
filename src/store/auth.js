import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/api/index.js";

export const useAuthStore = defineStore("auth", () => {
  const isLoggedIn = ref(false);
  const showLoginModal = ref(false);
  const isLoading = ref(false);

  const openLogin = () => {
    showLoginModal.value = true;
  };

  const closeLogin = () => {
    showLoginModal.value = false;
  };

  const login = async (credentials) => {
    isLoading.value = true;
    // 调用登录接口
    const response = await api.post("/user/login", {
      account: credentials.account,
      password: credentials.password,
    });
    console.log("登录成功", response);
    isLoggedIn.value = true;
    showLoginModal.value = false;
    return { success: true, data: response };
  };

  const logout = () => {
    isLoggedIn.value = false;
  };

  const checkLogin = () => {
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
