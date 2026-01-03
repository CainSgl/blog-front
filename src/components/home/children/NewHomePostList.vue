<template>
    <HomePostList :initialPosts=[] :load-data="loadPosts" style="height: 1000px;"  hasMoreText="你真是一个博学的人，本站的文档都被看光了 ヾ(*´∀ ˋ*)ﾉ" />
</template>

<script setup>
import HomePostList from '@/components/home/HomePostList.vue'
import api from '@/api/index.js'
//这个组件是加载最新的文章列表用的
let lastUpdatedAt;
let lastLikeRatio;
let lastId;
function buildRequestParams(pageSize) {
    const data = { pageSize }
    if (lastUpdatedAt) {
        data.lastUpdatedAt = lastUpdatedAt
    }
    if (lastLikeRatio) {
        data.lastLikeRatio = lastLikeRatio
    }
    if (lastId) {
        data.lastId = lastId
    }
    return data
}
const loadPosts = async (pageSize) => {
    const { data } = await api.post('/post/cursor', buildRequestParams(pageSize))
    if (data && data.length > 0) {
        const lastItem = data[data.length-1 ]
        lastUpdatedAt = lastItem.updatedAt
        lastLikeRatio = lastItem.likeRatio
        lastId = lastItem.id
    }
    return data || []
}

</script>

<style scoped></style>
