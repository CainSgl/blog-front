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


        <!-- 摘要确认模态框 -->
        <a-modal v-model:visible="summaryModalVisible" title="确认摘要" @ok="confirmSummary" @cancel="cancelSummary"
            okText="使用AI生成的摘要" cancelText="取消">
            <div class="summary-comparison">
                <p><strong>原文摘要：</strong></p>
                <div class="summary-content original-summary">{{ articleForm.summary }}</div>
                <p><strong>AI生成的摘要：</strong></p>
                <div class="summary-content ai-summary">{{ aiGeneratedSummary }}</div>
            </div>
        </a-modal>

        <div class="content">
            <Spin :loading="publishing" tip="正在发布文章..." style="display: block;">
                <div class="layout-container">
                    <!-- 左侧：文章信息 -->

                    <div class="left-panel">
                        <a-card title="文章信息">
                            <h3>预览</h3>
                            <PostCard :post="articleForm"></PostCard>
                            <a-divider></a-divider>
                            <a-form :model="articleForm" layout="vertical">
                                <a-form-item label="文章标题">
                                    <a-input v-model="articleForm.title" placeholder="请输入文章标题" :maxlength="150"
                                        show-word-limit />
                                </a-form-item>

                                <a-form-item label="文章摘要">
                                    <div class="summary-input-group">
                                        <a-textarea v-model="articleForm.summary" placeholder="请输入文章摘要"
                                            :auto-size="{ minRows: 3, maxRows: 5 }" :maxlength="300" show-word-limit />
                                        <a-button type="primary" @click="autoGenerateSummary"
                                            :loading="generatingSummary" class="auto-generate-btn">
                                            AI帮我填
                                        </a-button>
                                    </div>
                                </a-form-item>

                                <a-form-item label="文章标签">
                                    <div class="tag-input-group">
                                        <a-select v-model="articleForm.tags" multiple allow-create filterable
                                            placeholder="请选择或输入标签" class="tag-select" :max-tag-count="8"
                                            @change="onTagChange">
                                            <a-option v-for="tag in articleForm.tags" :key="tag" :value="tag">{{ tag
                                                }}</a-option>
                                        </a-select>
                                        <a-button type="primary" @click="autoGenerateTags" :loading="generatingTags"
                                            class="auto-generate-btn">
                                            AI帮我填
                                        </a-button>
                                        <div class="tag-count-info"
                                            v-if="articleForm.tags && articleForm.tags.length > 0">
                                            已选择 {{ articleForm.tags.length }}/8 个标签
                                        </div>
                                    </div>
                                </a-form-item>
                            </a-form>
                                     <!-- 图片上传区域 -->
                            <div class="image-upload-section">
                                <h4>上传封面</h4>
                                <Upload :custom-request="customRequest" :show-file-list="false" :multiple="true"
                                    accept="image/*" @progress="uploadingImage = true">
                                    <a-button type="dashed" :loading="uploadingImage">
                                        <template #icon>
                                            <IconPlus />
                                        </template>
                                        点击封面
                                    </a-button>
                                </Upload>

                                <!-- 图片裁剪模态框 -->
                                <ImageCropperModal ref="imageCropperRef" v-model="cropperModalVisible"
                                    :aspect-ratio="1.5" @confirm="handleCroppedImage" />
                            </div>
                            <p>内容预览</p>
                            <MarkdownPreview :content="articleForm.newContent" height="400px"
                                style="max-height: 400px;" />

                   
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

                                <a-divider></a-divider>
                                <h4 style="user-select: none;">文章统计</h4>
                                <a-space  direction="vertical" size="large" style="width: 100%;">
                                    <a-statistic title="字数统计" :value="wordCount" suffix="字" show-group-separator />
                                    <a-statistic title="阅读数" :value="articleForm.viewCount" show-group-separator />
                                    <a-statistic title="点赞数" :value="articleForm.likeCount" show-group-separator />
                                    <a-statistic title="评论数" :value="articleForm.commentCount" show-group-separator />
                                </a-space>

                            </div>
                        </a-card>
                    </div>
                </div>
            </Spin>
        </div>

    </div>

</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Message, Spin, Upload } from '@arco-design/web-vue';
import { useKbStore } from './kb/kbStore.js';
import MarkdownPreview from '../components/md/MarkdownPreview.vue';
import ImageCropperModal from '../components/ImageCropperModal.vue';
import {
    IconArrowLeft,
    IconArrowRise,
    IconSend,
    IconPlus
} from '@arco-design/web-vue/lib/icon';
import { API_BASE_URL } from '@/config';
import PostCard from '@/components/PostCard.vue'
import api from '@/api/index.js';
const router = useRouter();
const kbStore = useKbStore();

// 注册组件
const components = {
    ImageCropperModal,
    MarkdownPreview,
    PostCard
}

// 表单数据
const articleForm = ref({
    title: '',
    summary: '',
    content: '',
    status: '已发布',
    top: false,
    recommend: false,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: [],
    userId: '',
    createdAt: '',
    updatedAt: '',
    kbId: '',
    newContent: ''
});

// 发布状态
const publishing = ref(false);

// 自动生成标签状态
const generatingTags = ref(false);

// 自动生成摘要状态
const generatingSummary = ref(false);

// 摘要确认模态框状态
const summaryModalVisible = ref(false);

// AI生成的摘要内容
const aiGeneratedSummary = ref('');

// 上传图片相关状态
const uploadingImage = ref(false);

// 图片裁剪相关状态
const cropperModalVisible = ref(false);
const currentImageFile = ref(null);
const imageCropperRef = ref(null);



// 计算属性
const wordCount = computed(() => {
    // 现在直接从 articleForm 中获取内容
    return articleForm.value.content ? articleForm.value.content.length : 0;
});

// 标签选择变化处理
const onTagChange = (value) => {
    if (value && value.length > 8) {
        Message.warning('选择的标签过多！最多只能选择8个标签');
        // 限制标签数量为8个
        articleForm.value.tags = value.slice(0, 8);
    }
};

// 方法
const goBack = () => {
    router.go(-1);
};

const autoGenerateTags = async () => {
    generatingTags.value = true;
    try {
        // 检查当前标签数量是否已达到上限
        if (articleForm.value.tags && articleForm.value.tags.length >= 8) {
            Message.warning('标签数量已达上限！最多只能选择8个标签');
            return;
        }

        const { data } = await api.post('/ai/tag/generate', { content: articleForm.value.newContent })
        console.log(data)
        const generatedTags = data.map(item => item.tag + ":" + item.core);
        // 将生成的标签添加到现有标签中，去重
        const currentTags = articleForm.value.tags || [];
        const newTags = [...new Set([...currentTags, ...generatedTags])];
        // 限制标签数量为8个
        articleForm.value.tags = newTags.slice(0, 8);
        Message.success(`已自动生成 ${Math.min(generatedTags.length, 8 - currentTags.length)} 个标签`);
    } catch (error) {
        console.error('自动生成标签失败:', error);
        Message.error('自动生成标签失败，请重试');
    } finally {
        generatingTags.value = false;
    }
};

const autoGenerateSummary = async () => {
    generatingSummary.value = true;
    try {
        const { data } = await api.post('/ai/summary/generate', { content: articleForm.value.newContent });
        // 限制AI生成的摘要长度不超过300字
        const limitedData = data.length > 300 ? data.substring(0, 300) : data;
        // 保存AI生成的摘要
        aiGeneratedSummary.value = limitedData;

        // 如果已有摘要，显示确认模态框让用户选择
        if (articleForm.value.summary && articleForm.value.summary.trim() !== '') {
            summaryModalVisible.value = true;
        } else {
            // 如果没有现有摘要，直接使用AI生成的摘要
            articleForm.value.summary = limitedData;
            Message.success('已自动生成摘要');
        }
    } catch (error) {
        console.error('自动生成摘要失败:', error);
        Message.error('自动生成摘要失败，请重试');
    } finally {
        generatingSummary.value = false;
    }
};

const publishArticle = async () => {
    // 设置发布状态为true，显示加载动画
    publishing.value = true;
    try {
        // 调用api
        // 先保存文章信息
        const res = await api.put('/post', {
            id: articleForm.value.id,
            title: articleForm.value.title,
            summary: articleForm.value.summary,
            status: '已发布',
            isTop: articleForm.value.top,
            tags: articleForm.value.tags,
            img: articleForm.value.img,
        });

        // 然后发布文章
        await api.post('/post/publish', { id: articleForm.value.id });

        // 发布成功提示
        Message.success('文章发布成功！');

        // 跳转到文章列表页
        router.push('/p');
    } catch (error) {
        console.error('发布文章失败:', error);
        // 发布失败提示
        Message.error('文章发布失败，请重试');
    } finally {
        // 无论成功还是失败，都要结束加载状态
        publishing.value = false;
    }
};

// 确认使用AI生成的摘要
const confirmSummary = () => {
    // 确保摘要长度不超过300字
    const limitedSummary = aiGeneratedSummary.value.length > 300
        ? aiGeneratedSummary.value.substring(0, 300)
        : aiGeneratedSummary.value;
    articleForm.value.summary = limitedSummary;
    summaryModalVisible.value = false;
    Message.success('已更新摘要');
};

// 取消使用AI生成的摘要
const cancelSummary = () => {
    summaryModalVisible.value = false;
};



// 处理裁剪后的图片
const handleCroppedImage = async (croppedFile) => {
    try {
        Message.loading({
            id: 'upload-cropped-image:' + croppedFile.name,
            content: croppedFile.name + '上传中...',
            duration: 15000,
        });

        // 创建FormData对象 
        const formData = new FormData();
        formData.append('file', croppedFile);

        // 使用api上传文件 
        const { data } = await api.post('/file/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        articleForm.value.img = API_BASE_URL + "/file?f=" + data.shortUrl;

        // 显示成功信息
        Message.success({
            id: 'upload-cropped-image:' + croppedFile.name,
            content: '图片上传成功',
            duration: 3000,
        });

        // 可以将上传的图片URL添加到文章内容中
        const imageUrl = '/api/file?f=' + data.shortUrl; // 假设API_BASE_URL为'/api'
        console.log('裁剪后图片上传成功，URL:', imageUrl);

        cropperModalVisible.value = false;
        currentImageFile.value = null;

        return imageUrl;
    } catch (error) {
        console.error('裁剪后图片上传失败:', error);
        Message.error({
            id: 'upload-cropped-image:' + croppedFile.name,
            content: '图片上传失败，请稍后重试',
            duration: 3000,
        });
        throw error;
    }
};

// Arco Design Upload组件的自定义上传方法
const customRequest = async (options) => {
    const { fileItem, onError, onSuccess, onProgress } = options;
    const file = fileItem.file;

    // 检查是否为图片
    if (!file.type.startsWith('image/')) {
        console.error('请选择图片文件');
        onError();
        return;
    }

    // 创建图片对象用于裁剪组件
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
        // 将原始文件保存到currentImageFile，用于裁剪
        currentImageFile.value = file;

        // 显示裁剪模态框
        cropperModalVisible.value = true;

        // 等待模态框打开后设置图片
        await nextTick();
        setTimeout(() => {
            if (imageCropperRef.value) {
                imageCropperRef.value.setImage(img);
            }
        }, 100);

        onSuccess();
    };
    img.onerror = () => {
        console.error('图片加载失败');
        onError();
    };
};

// 组件挂载时初始化数据
onMounted(() => {
    try {
        const commitData = kbStore.getCommitData?.() || {};
        if (!commitData.id || !commitData.newContent) {
            Message.warning('未找到文章内容，请返回编辑页面');
            return;
        }
        commitData.status='发布中'
        articleForm.value = commitData;
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
    position: relative;
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

    .tag-input-group>* {
        margin-top: 0 !important;
    }

    .tag-count-info {
        font-size: 12px;
        color: var(--color-text-3);
        white-space: nowrap;
        margin-left: 8px;
        display: flex;
        align-items: center;
    }

    .summary-input-group {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        width: 100%;
    }

    .summary-input-group .arco-textarea {
        flex: 1;
    }

    .summary-input-group .auto-generate-btn {
        flex-shrink: 0;
        white-space: nowrap;
        margin-top: 1px;
    }

    .summary-comparison {
        .summary-content {
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            max-height: 150px;
            overflow-y: auto;
        }

        .original-summary {
            background-color: #f5f5f5;
        }

        .ai-summary {
            background-color: #e8f4ff;
        }
    }

    .preview-card {
        margin-top: 16px;

        .arco-card-body {
            padding: 0;
        }
    }

    .image-upload-section {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;

        h4 {
            margin-bottom: 12px;
            font-weight: 500;
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

            .tag-count-info {
                margin-left: 0;
                margin-top: 8px;
            }

            .summary-input-group {
                flex-direction: column;
                gap: 12px;
            }

            .summary-input-group .auto-generate-btn {
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

    .tag-count-info {
        margin-left: 0;
        margin-top: 8px;
        align-self: flex-start;
    }

    .summary-input-group {
        flex-direction: column;
        gap: 8px;
    }

    .summary-input-group .auto-generate-btn {
        width: 100%;
    }
}
</style>