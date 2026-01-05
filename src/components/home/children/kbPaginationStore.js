import { defineStore } from 'pinia'

export const useKbPaginationStore = defineStore('kbPagination', {
  state: () => ({
    lastCreatedAt: null,
    lastLike: null,
    lastId: null,

  }),
  
  actions: {
    updatePagination(lastItem) {
      this.lastCreatedAt = lastItem.createdAt
      this.lastLike = lastItem.likeCount
      this.lastId = lastItem.id
    },
    
    resetPagination() {
      this.lastCreatedAt = null
      this.lastLike = null
      this.lastId = null
    },
    
    buildRequestParams(pageSize) {
      const req = { pageSize }
      if (this.lastCreatedAt) {
        req.lastCreatedAt = this.lastCreatedAt
        req.lastLike = this.lastLike
        req.lastId = this.lastId
      }
      return req
    },
  
  }
})