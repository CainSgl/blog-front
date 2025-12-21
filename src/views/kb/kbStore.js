import { defineStore } from 'pinia';

export const useKbStore = defineStore('kb', {
  state: () => ({
    treeData: [],
    kbId: '',
    kbInfo: {
      name: '获取中...',
      likeCount: 0
    },
    postInfo: {
      postId: '',
      content: ''
    }
  }),
  
  actions: {
    setTreeData(data) {
      this.treeData = data;
    },
    
    setKbInfo(info) {
      this.kbInfo = info;
    },
    
    setKbId(id) {
      this.kbId = id;
    },
    setCommitInfo(postInfo,newContent)
    {
      
    },
    reset() {
      this.treeData = [];
      this.kbId = '';
      this.kbInfo = {
        name: '获取中...',
        likeCount: 0
      };
    }
  }
});