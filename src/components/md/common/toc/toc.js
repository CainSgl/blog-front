import {defineStore} from 'pinia';
import {ref} from 'vue';

export const useTocStore = defineStore('toc', () => 
{
  // 当前选中的目录项
  const currentTocItem = ref('');
  const toHashItem=ref('');
  // 设置当前选中的目录项
  const setCurrentTocItem = (itemId) => 
  {
    currentTocItem.value = itemId;
   
  };

  // 清除当前选中的目录项
  const clearCurrentTocItem = () => 
  {
    currentTocItem.value = '';
  };

  // 初始化时从URL hash中获取值
  const initializeFromUrl = () => 
  {
    if (typeof window !== 'undefined') 
    {
      let hash = window.location.hash.substring(1); // 移除 # 符号
      try 
      {
        hash = decodeURIComponent(hash);
      }
      catch (e) 
      {
        console.warn('无法解码hash值:', hash);
      }
      if (hash) 
      {
        currentTocItem.value = hash;
      }
    }
  };

  // 同步到URL hash
  const syncToUrl = (newValue) => 
  {
    if (typeof window !== 'undefined') 
    {
      if (newValue) 
      {
        const oldHash = window.location.hash.substring(1);
        if (oldHash !== newValue) 
        {
          const newURL = window.location.pathname + window.location.search + '#' + newValue;
          window.history.replaceState(null, '', newURL);
        }
        toHashItem.value=newValue;
      }
      else 
      {
        // 清空hash
        const oldHash = window.location.hash.substring(1);
        if (oldHash) 
        {
          const newURL = window.location.pathname + window.location.search;
          window.history.replaceState(null, '', newURL);
        }
      }
    }
  };



  return {
    toHashItem,
    currentTocItem,
    syncToUrl,
    setCurrentTocItem,
    clearCurrentTocItem,
    initializeFromUrl
  };
});