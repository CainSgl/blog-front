<template>
    <div class="cainsgl-post-reference">
        <div v-if="error" class="post-error">
            <icon-exclamation-circle :size="24" />
            <span>{{ error }}</span>
        </div>
        <a-link v-if="!error" :hoverable="false" :href="postData?`/p/${postData.id}` : ''" style="width: 100%;max-width: 500px;display: block;" >
            <PostCardWrapper  :post="postData" />
        </a-link>
    </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { IconExclamationCircle } from '@arco-design/web-vue/es/icon';
import { useRouter } from 'vue-router';
import PostCardWrapper from '@/components/post/PostCardWrapper.vue';
import api from '@/api';

const props = defineProps({
    postId: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    }
});

const router = useRouter();

// 解析 postId，格式可能是 "id 自定义描述"
const parsedData = computed(() => {
    const parts = props.postId.trim().split(/\s+/);
    return {
        id: parts[0] || '',
        customDesc: parts.slice(1).join(' ') || props.description
    };
});

const postId = computed(() => parsedData.value.id);

// 状态
const loading = ref(true);
const error = ref(null);
const postData = ref({});

// 获取文章信息
const fetchPostData = async () => {
    try {
        loading.value = true;
        error.value = null;

        const response = await api.get('/post/basic', { id: postId.value });
        postData.value = response.data;
    } catch (err) {
        console.error('获取文章信息失败:', err);
        error.value = '该文章信息加载失败，可能是被作者移除';
    } finally {
        loading.value = false;
    }
};



onMounted(() => {
    fetchPostData();
});
</script>

<style lang="less" scoped>
.cainsgl-post-reference {
    margin: 16px 0;

    .post-loading,
    .post-error {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background-color: var(--color-fill-1);
        border: 1px solid var(--color-border-2);
        border-radius: 8px;
        color: var(--color-text-2);
    }

    .post-error {
        color: @danger-6;
    }
}
</style>
