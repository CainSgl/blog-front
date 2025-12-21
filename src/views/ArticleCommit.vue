<template>
    <div class="article-commit">
        <a-affix :offset-top="0">
            <div class="header">
                <a-button type="text" @click="goBack">
                    <template #icon>
                        <IconArrowLeft />
                    </template>
                    返回编辑
                </a-button>
                <h2>文章发布</h2>
                <a-button type="primary" @click="publishArticle" :loading="publishing">
                    <template #icon>
                        <IconSend />
                    </template>
                    发布文章
                </a-button>
            </div>
        </a-affix>

        <div class="content">
            <div class="layout-container">
                <!-- 左侧：文章信息 -->
                <div class="left-panel">
                    <a-card title="文章信息">
                        <a-form :model="articleForm" layout="vertical">
                            <a-form-item label="文章标题">
                                <a-input v-model="articleForm.title" placeholder="请输入文章标题" />
                            </a-form-item>

                            <a-form-item label="文章摘要">
                                <a-textarea v-model="articleForm.summary" placeholder="请输入文章摘要"
                                    :auto-size="{ minRows: 3, maxRows: 5 }" />
                            </a-form-item>

                            <a-form-item label="文章标签">
                                <div class="tag-input-group">
                                    <a-select v-model="articleForm.tags" multiple allow-create filterable
                                        placeholder="请选择或输入标签" class="tag-select">
                                        <a-option value="技术">技术</a-option>
                                    </a-select>
                                    <a-button type="primary" @click="autoGenerateTags" :loading="generatingTags"
                                        class="auto-generate-btn">
                                        AI帮我填
                                    </a-button>
                                </div>
                            </a-form-item>
                        </a-form>
                        <p>
                            内容预览
                        </p>
                        <MarkdownPreview :content="articleForm.content" />
                    </a-card>


                </div>

                <!-- 右侧：发布设置 -->
                <div class="right-panel">
                    <a-card title="发布信息">
                        <a-form layout="vertical">
                            <a-form-item label="是否置顶">
                                <a-switch v-model="articleForm.top" />
                            </a-form-item>
                        </a-form>

                        <a-divider />

                        <div class="stats-section">
                            <h4>文章统计</h4>
                            <a-space direction="vertical" size="large" style="width: 100%;">
                                <a-statistic title="字数统计" :value="wordCount" suffix="字" show-group-separator />
                                <a-statistic title="阅读数" :value="articleForm.viewCount" show-group-separator />
                                <a-statistic title="点赞数" :value="articleForm.likeCount" show-group-separator />
                                <a-statistic title="评论数" :value="articleForm.commentCount" show-group-separator />
                                <a-statistic title="阅读增长率" :value="growthPercentage" :precision="2"
                                    :value-style="{ color: '#0fbf60' }">
                                    <template #prefix>
                                        <IconArrowRise />
                                    </template>
                                    <template #suffix>%</template>
                                </a-statistic>
                            </a-space>
                        </div>
                    </a-card>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { useKbStore } from './kb/kbStore.js';
import MarkdownPreview from '../components/MarkdownPreview.vue';
import {
    IconArrowLeft,
    IconArrowRise,
    IconSend
} from '@arco-design/web-vue/lib/icon';

const router = useRouter();
const kbStore = useKbStore();

// 表单数据
const articleForm = ref({
    title: '',
    summary: '',
    content: '',
    status: '草稿',
    top: false,
    recommend: false,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: [],
    userId: '',
    createdAt: '',
    updatedAt: '',
    kbId: ''
});

// 计算动态的增长百分比
const growthPercentage = computed(() => {
    const currentViewCount = articleForm.value.viewCount || 0;
    const growthCount = Math.floor(Math.random() * 50) + 10;

    if (currentViewCount === 0) {
        return growthCount > 0 ? '∞' : '0.0';
    }

    const percentage = (growthCount / currentViewCount) * 100;
    return percentage.toFixed(1);
});

// 发布状态
const publishing = ref(false);

// 自动生成标签状态
const generatingTags = ref(false);

// 生成模拟增长数据的函数
const generateMockGrowthData = () => {
    // 随机更新阅读数、点赞数、评论数等统计数据
    if (articleForm.value.viewCount !== undefined) {
        articleForm.value.viewCount += Math.floor(Math.random() * 10) + 1;
    }
    if (articleForm.value.likeCount !== undefined) {
        articleForm.value.likeCount += Math.floor(Math.random() * 3) + 1;
    }
    if (articleForm.value.commentCount !== undefined) {
        articleForm.value.commentCount += Math.floor(Math.random() * 2);
    }
};

// 计算属性
const wordCount = computed(() => {
    // 现在直接从 articleForm 中获取内容
    return articleForm.value.content ? articleForm.value.content.length : 0;
});

// 方法
const goBack = () => {
    router.go(-1);
};

const autoGenerateTags = async () => {
    if (!articleForm.value.content || !articleForm.value.content.trim()) {
        Message.warning('请先输入文章内容');
        return;
    }

    generatingTags.value = true;

    try {
        // TODO: 调用后端自动生成标签接口
        // 这里模拟一个接口调用，实际需要替换为真实的后端接口
        await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟网络请求

        // 模拟后端返回的数据格式
        const mockResponse = [
            { tag: "Spring AI ChatClient", core: 0.3 },
            { tag: "ChatResponse", core: 0.15 },
            { tag: "entity方法", core: 0.1 },
            { tag: "流式响应stream", core: 0.1 },
            { tag: "提示模版", core: 0.1 },
            { tag: "默认配置", core: 0.1 },
            { tag: "Advisor机制", core: 0.1 }
        ];

        // 从响应中提取标签名
        const generatedTags = mockResponse.map(item => item.tag);

        // 将生成的标签添加到现有标签中，去重
        const currentTags = articleForm.value.tags || [];
        const newTags = [...new Set([...currentTags, ...generatedTags])];

        articleForm.value.tags = newTags;

        Message.success(`已自动生成 ${generatedTags.length} 个标签`);

    } catch (error) {
        console.error('自动生成标签失败:', error);
        Message.error('自动生成标签失败，请重试');
    } finally {
        generatingTags.value = false;
    }
};

const publishArticle = async () => {
    if (!articleForm.value.title.trim()) {
        Message.error('请输入文章标题');
        return;
    }

    publishing.value = true;

    try {
        // TODO: 实现实际的发布逻辑
        await new Promise(resolve => setTimeout(resolve, 1000));

        Message.success('文章发布成功！');

        // 发布成功后跳转到文章列表
        router.push({
            name: 'KBIndex',
            query: { kb: kbStore.kbId || '' }
        });

        // 清除发布数据
        try {
            kbStore.clearCommitData?.();
        } catch (error) {
            console.error('Error clearing commit data:', error);
        }

    } catch (error) {
        console.error('发布文章失败:', error);
        Message.error('发布失败，请重试');
    } finally {
        publishing.value = false;
    }
};

// 组件挂载时初始化数据
onMounted(() => {
    try {
        const commitData = kbStore.getCommitData?.() || {};
        console.log('Commit data:', commitData)

        if (!commitData.id || !commitData.newContent) {
            Message.warning('未找到文章内容，请返回编辑页面');
            //setTimeout(() => router.go(-1), 2000);
            return;
        }

        // 更新 articleForm 中的所有字段
        articleForm.value = {
            title: commitData.title || '',
            summary: commitData.summary || '',
            content: commitData.newContent || '',
            status: commitData.status || '草稿',
            top: commitData.top || false,
            recommend: commitData.recommend || false,
            viewCount: commitData.viewCount || Math.floor(Math.random() * 1000) + 100,
            likeCount: commitData.likeCount || Math.floor(Math.random() * 50) + 10,
            commentCount: commitData.commentCount || Math.floor(Math.random() * 20) + 1,
            tags: commitData.tags || [],
            userId: commitData.userId || 'user_' + Math.floor(Math.random() * 1000),
            createdAt: commitData.createdAt || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: commitData.updatedAt || new Date().toISOString(),
            kbId: commitData.kbId || ''
        };

        // 生成mock增长数据
        generateMockGrowthData();

        // 每30秒更新一次增长数据，模拟实时数据变化
        setInterval(() => {
            generateMockGrowthData();
        }, 30000);

    } catch (error) {
        console.error('Error initializing article form:', error);
        Message.error('初始化失败');
        router.go(-1);
    }
});
</script>

<style scoped lang="less">
.article-commit {
    height: 100vh;
}

.header {
    background: #fff;
    border-bottom: 1px solid #e5e6eb;
    padding: 5px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 100;
}

.content {
    padding: 24px;
    margin-top: 20px;
    position: relative;
    z-index: 1;
    min-height: calc(100vh - 160px);
}

// 响应式设计
@media (max-width: 1200px) {
    .content {
        min-height: auto;
    }
}

.layout-container {
    display: flex;
    gap: 24px;
    height: 100%;
    max-width: 1400px;
    margin: 0 auto;
}

.left-panel {
    flex: 1;
    min-width: 0;

    .arco-card {
        height: 100%;
        display: flex;
        flex-direction: column;

        .arco-card-body {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .arco-form {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
    }

    .arco-form-item-label>label {
        font-weight: 500;
    }

    .tag-input-group {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        width: 100%;
    }

    .tag-input-group .tag-select {
        flex: 1;
        width: 100% !important;
    }

    .tag-input-group .tag-select .arco-select-view {
        width: 100% !important;
    }

    .tag-input-group .auto-generate-btn {
        flex-shrink: 0;
        white-space: nowrap;
    }

    .preview-card {
        margin-top: 16px;

        .arco-card-body {
            padding: 0;
        }
    }
}

.right-panel {
    width: 380px;
    flex-shrink: 0;

    .arco-card {
        display: flex;
        flex-direction: column;

        .arco-card-body {
            display: flex;
            flex-direction: column;
        }

        .stats-section {
            margin-top: auto;
        }
    }

    .stats-section {
        margin-top: 0;

        h4 {
            margin: 0 0 16px 0;
            color: var(--color-text-1);
            font-size: 14px;
            font-weight: 500;
        }
    }
}

// 响应式设计
@media (max-width: 1200px) {
    .layout-container {
        flex-direction: column;
        gap: 16px;
    }

    .left-panel {
        .arco-card {
            height: auto;
            display: block;

            .arco-card-body {
                height: auto;
                display: block;
            }

            .arco-form {
                height: auto;
                display: block;
            }

            .tag-input-group {
                flex-direction: column;
                gap: 12px;
            }

            .tag-input-group .auto-generate-btn {
                width: 100%;
                align-self: stretch;
            }
        }
    }

    .right-panel {
        width: 100%;

        .arco-card {
            .stats-section {
                margin-top: 16px;
            }
        }
    }
}

@media (max-width: 768px) {
    .content {
        padding: 16px;
    }

    .header {
        padding: 5px 16px;

        h2 {
            font-size: 18px;
        }

        .arco-btn {
            font-size: 12px;
            padding: 4px 8px;
        }
    }

    .tag-input-group {
        flex-direction: column;
        gap: 8px;
    }

    .tag-input-group .tag-select {
        width: 100% !important;
    }

    .tag-input-group .auto-generate-btn {
        width: 100%;
    }
}
</style>