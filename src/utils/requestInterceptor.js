import { useRequestProgressStore } from '@/store/requestProgress';

// 拦截原生 fetch
export function setupFetchInterceptor() {
  const originalFetch = window.fetch;
  
  window.fetch = function(...args) {
    const progressStore = useRequestProgressStore();
    progressStore.startRequest();
    
    return originalFetch.apply(this, args)
      .then(response => {
        progressStore.completeRequest();
        return response;
      })
      .catch(error => {
        progressStore.completeRequest();
        throw error;
      });
  };
}

// 拦截 XMLHttpRequest
export function setupXHRInterceptor() {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(...args) {
    this._url = args[1];
    return originalOpen.apply(this, args);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    const progressStore = useRequestProgressStore();
    progressStore.startRequest();
    
    this.addEventListener('loadend', () => {
      progressStore.completeRequest();
    });
    
    return originalSend.apply(this, args);
  };
}

// 初始化所有拦截器
export function setupRequestInterceptors() {
  setupFetchInterceptor();
  setupXHRInterceptor();
}
