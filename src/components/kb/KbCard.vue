<template>
    <div class="kb-card">
        <a-card class="kb-card-container" :bordered="false" :body-style="{ padding: 0 }" @click="handleCardClick"
            v-if="kbInfo.id">
            <!-- 封面图片 -->
            <div class="kb-cover">
                <c-img v-if="kbInfo.coverUrl" :src="kbInfo.coverUrl" :alt="kbInfo.name" width="180px" height="180px"
                    fit="cover" :preview="false" lazy-load />
                <div v-else class="kb-cover-empty">
                    <a-empty description="无封面" :image-style="{ height: '100%', width: '100%' }" />
                </div>
            </div>

            <!-- 内容区域 -->
            <div class="kb-content">
                <!-- 知识库名称 -->
                <div class="kb-name">{{ kbInfo.name }}</div>

                <!-- 底部信息栏 -->
                <div class="kb-footer">
                    <div class="kb-stats">
                        <!-- <icon-heart :style="{ marginRight: '16px' }"  /> {{ kbInfo.likeCount }} -->
                        <icon-book :style="{  marginRight: '4px' }" /> {{ kbInfo.postCount }}
                    </div>
                    <div class="kb-date">{{ formatDate(kbInfo.createdAt) }}</div>
                </div>
            </div>
        
            <!-- 状态标签 -->
            <div v-if="showStatus && kbInfo.status"    class="kb-status-tag">
                <a-tag v-if="kbInfo.status === '仅粉丝'" :color="primary4Color">粉丝专属</a-tag>
                <a-tag v-if="kbInfo.status === '已发布'&&!onlyFans" color="green">公开</a-tag>
                <a-tag v-if="kbInfo.status === '草稿' && !onlyFans" color="gray">私密</a-tag>
            </div>

        </a-card>
        <div class="kb-card-loading" v-else>
            <a-skeleton :animation="true">
               <a-skeleton-shape :style="{ height: `260px`, width: `180px` }"/>
            </a-skeleton>
        </div>
    </div>
</template>

<script setup>
import { IconHeart, IconBook } from '@arco-design/web-vue/es/icon';
import CImg from '../base/cImg.vue';
import { useRouter } from 'vue-router';
import { formatDate } from '@/utils/DateFormatter.js';
const router = useRouter();

const props = defineProps({
  kbInfo: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      userId: '',
      name: '',
      createdAt: '',
      status: '草稿',
      likeCount: 0,
      coverUrl: '',
      postCount: 0
    })
  },
  showStatus: {
    type: Boolean,
    default: true
  },
  onlyFans:{
    type:Boolean,
    default: false
  }
});


const primary4Color = '#ff6699'; 


// 处理卡片点击事件
const handleCardClick = () => 
{
  const routeData = router.resolve({ name: 'KB', query: { kb: props.kbInfo.id } });
  window.open(routeData.href, '_blank');
};


</script>

<style scoped lang="less">
.kb-card {
    width: 180px;
    position: relative;

    .kb-card-container {
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s ease;
        cursor: pointer;
        height: 100%;
        border: 1px solid #e5e8ef;
        /* 添加外边框 */

        &:hover {
            border-color: #4080ff;
            /* 类似于 PostCard 的 hover 效果 */
            box-shadow: 0 4px 12px 0 rgba(0, 174, 236, 0.15);
            /* 减轻 hover 阴影 */
        }
    }

    .kb-card-loading {
         border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        height: 100%;
        border: 1px solid #e5e8ef;
    }

    .kb-cover {
        width: 100%;
        height: 180px;
        overflow: hidden;

        .arco-image {
            transition: transform 0.3s ease;
        }
    }

    .kb-card-container:hover .kb-cover .arco-image {
        transform: scale(1.05);
    }

    .kb-card-container:hover .kb-cover-empty {
        background-color: #f0f3f8;
    }

    .kb-cover-empty {
        width: 100%;
        height: 180px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f7f8fa;
    }

    .kb-content {
        padding: 16px;

        .kb-name {
            font-size: 16px;
            font-weight: 500;
            color: #1d2129;
            margin-bottom: 12px;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.4;
        }

        .kb-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #86909c;

            .kb-stats {
                display: flex;
                align-items: center;
            }

            .kb-date {
                margin-left: auto;
            }
        }
    }

    .kb-status-tag {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 1;
    }
}
</style>