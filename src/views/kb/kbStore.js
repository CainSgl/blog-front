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
    },
    
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
    setCommitInfo(postInfo, newContent) {
      this.postInfo={
        ...postInfo,
        newContent
      }
      console.log("发布的文章信息",this.postInfo)
    },
    // 获取发布数据的便捷方法
    getCommitData() {
      return this.postInfo;
    },
    // 清除发布数据
    clearCommitData() { 
      this.postInfo = {
        postId: '',
        content: '',
      };
    },
    reset() {
      this.treeData = [];
      this.kbId = '';
      this.kbInfo = {
        name: '获取中...',
        likeCount: 0
      };
      this.clearCommitData();
    }
  }
});