<template>
    <div class="post-history" v-if="postId&&historyList && historyList.length > 0">
        <div class="history-title">历史版本</div>
        <a-timeline>
            <a-timeline-item v-for="(item, index) in historyList" :key="item.id"
                :label="formatDate(item.createdAt, '更改')">
                <div class="history-item" @click="handleHistoryItemClick(item)">
                    <div class="version-info"> 版本：v{{ item.version }}</div>
                </div>
            </a-timeline-item>
        </a-timeline>
    </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted, watch } from 'vue'
import { formatDate } from '@/utils/DateFormatter.js'
import api from '@/api/index.js'
const props = defineProps({
    postId: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['historyItemClick'])

const historyList = ref([])


const fetchHistoryData = async () => {
    console.log(props.postId)
    if (!props.postId) {
        return;
    }
    const { data } = await api.post('/post/history', { id: props.postId })
    console.log(data)
    historyList.value = data
}

// 监听 postId 变化，重新获取数据
watch(() => props.postId, (newPostId) => {
    if (newPostId) {
        fetchHistoryData()
    } else {
        historyList.value = []
    }
}, { immediate: true })

// 处理历史记录点击事件
const handleHistoryItemClick = (item) => {
    emit('historyItemClick', item)
}


</script>

<style scoped lang="less">
.post-history {
    padding: 16px;

    .history-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
        color: #1f2328;
    }

    .history-item {
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        border: 1px solid transparent;
        display: flex;
        align-items: center;

        &:hover {
            background-color: #f6f8fa;
            border-color: #d0d7de;
        }

        &:active {
            background-color: #eaecef;
        }
    }

    .version-info {
        font-family: monospace;
        font-size: 14px;
        color: #0969da;
        font-weight: 500;
    }
}
</style>