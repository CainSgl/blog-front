<template>
  <div class="reply-messages">


    <div class="messages-list" v-if="messages.length > 0">
      <a-divider dashed />
      <MessageItem v-for="message in messages" :key="message.id" :message="message" @click="handleMessageClick">
        <div class="reply-content">
          <div class="reply-text" @click="handleClickReply(message.replyInfo)">
            <span class="reply-label">回复了你：</span>
            <span class="reply-message">{{ message.replyInfo?.content||' ' }}</span>
          </div>


          <!-- 操作按钮 -->
          <div class="reply-actions">
            <a-button type="text" size="small" @click.stop="toggleReplyInput(message)">
              <template #icon>
                <icon-message />
              </template>
              回复
            </a-button>
            <a-button type="text" size="small" :class="{ 'liked': message.replyInfo?.isLiked }"
              @click.stop="handleLike(message)">
              <template #icon>
                <icon-heart-fill v-if="message.replyInfo?.isLiked" />
                <icon-heart v-else />
              </template>
              {{ message.replyInfo?.likeCount }}
            </a-button>
          </div>

          <!-- 回复输入框 -->
          <div v-if="message.showReplyInput" class="reply-input-container">
            <ReplyInput :placeholder="`回复 ${message.fromUserInfo?.nickname || '用户'}...`" :show-self="true"
              :auto-focus="true" :on-submit-comment="(content) => handleSubmitReply(message, content)" />
          </div>

        </div>
      </MessageItem>

      <!-- 加载触发器 -->
      <div ref="loadMoreTrigger" class="load-more-trigger">
        <a-spin v-if="loading" tip="获取更多中" />
        <div v-else-if="!hasMore" class="no-more">没有更多了</div>
      </div>
    </div>

    <a-empty v-else-if="!loading" description="暂无回复消息" />
    <a-spin v-else :loading="loading" style="width: 100%; padding: 40px 0;" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { IconHeartFill, IconHeart, IconMessage } from '@arco-design/web-vue/es/icon';
import { Message } from '@arco-design/web-vue';
import MessageItem from '@/components/user/base/MessageItem.vue';
import ReplyInput from '@/components/comment/ReplyInput.vue';
import api from '@/api/index';



const loading = ref(false);
const messages = ref([]);
const after = ref(null);
const size = ref(15);
const hasMore = ref(true);
const loadMoreTrigger = ref(null);
let observer = null;

const loadMessages = async () => {
  if (loading.value || !hasMore.value) return;

  loading.value = true;
  try {
    const { data } = await api.get('/user/notice', { type: "回复", size: size.value, after: after.value });
    const newMessages = data.records;

    // 先把消息加入列表，立即显示
    messages.value.push(...newMessages);
    hasMore.value = data.hasMore;
    after.value = data.after;

    // 异步加载完整的回复信息
    const ids = newMessages.map(msg => msg.targetId).join(',');
    if (ids) {
      api.get('/comment/reply/notice', { ids }).then(({ data: replyData }) => {
        const replyMap = new Map(replyData.map(item => [item.id, item]));
        console.log(replyMap)
        messages.value.forEach(msg => {
          if (replyMap.has(msg.targetId)) {
            msg.replyInfo = replyMap.get(msg.targetId);
          }
        });
      }).catch(error => {
        console.error('加载回复详情失败:', error);
      });
    }
  } catch (error) {
    console.error('加载消息失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleMessageClick = (message) => {
  
};

// 切换回复输入框显示
const toggleReplyInput = (message) => {
  message.showReplyInput = !message.showReplyInput;
};

// 处理提交回复
const handleSubmitReply = async (message, content) => {
  try {
    console.log(message.replyInfo)
    const msgId = 'reply:' + message.id
    Message.loading({ id: msgId, content: '回复中...' });
    const otherMessage = message.replyInfo
    const myMessage = {
      replyCommentId: otherMessage.id,
      replyId: message.targetUser,
      content: content,
    }
    if(otherMessage.parCommentId)
    {
       const {data}= await api.get('/comment/locate',{id:otherMessage.parCommentId})
      console.log(data)
       myMessage.dataId=data.dataId
       myMessage.parCommentId= otherMessage.parCommentId;
    }else{
      myMessage.postCommentId= otherMessage.postCommentId;
    }

    const { data } = await api.post('/comment/reply', myMessage)
    console.log('回复消息:', message.targetId, '内容:', content);
    Message.success({ id: msgId, content: '回复成功' });
    message.showReplyInput = false;
  } catch (error) {
    console.error('回复失败:', error);
    Message.error('回复失败，请重试');
    throw error;
  }
};

// 处理点赞
const handleLike = async (message) => {
  try {
    // TODO: 调用点赞 API
    console.log('点赞消息:', message.targetId);

    if (message.replyInfo) {
      message.replyInfo.isLiked = !message.replyInfo.isLiked;
      message.replyInfo.likeCount += message.replyInfo.isLiked ? 1 : -1;
    }

    Message.success(message.replyInfo?.isLiked ? '点赞成功' : '取消点赞');
  } catch (error) {
    console.error('点赞失败:', error);
    Message.error('操作失败，请重试');
  }
};

const setupObserver = () => {
  if (!loadMoreTrigger.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore.value && !loading.value) {
        loadMessages();
      }
    },
    {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    }
  );

  observer.observe(loadMoreTrigger.value);
};
function handleClickReply(message)
{
  console.log(message)
  //看看是段评还是文章评，然后直接跳转

}
onMounted(() => {
  loadMessages().then(() => {
    setupObserver();
  });
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped lang="less">
.reply-messages {


  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .load-more-trigger {
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;

    .no-more {
      color: @color-text-3;
      font-size: 14px;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .reply-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-width: 0;

    .reply-text {
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .reply-label {
        font-size: 13px;
        color: @color-text-3;
        font-weight: 500;
      }

      .reply-message {

        font-size: 14px;
        color: @color-text-1;
        line-height: 1.6;
        word-break: break-word;
        padding: 8px 12px;
        background-color: @color-fill-1;
        border-radius: 6px;
        border-left: 3px solid @color-primary-light-3;
      }
    }

    .reply-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 13px;
      color: @color-text-3;


      .reply-time {
        color: @color-text-3;
      }
    }

    .reply-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;

      .arco-btn-text {
        color: @color-text-3;
        font-size: 13px;

        &:hover {
          color: @color-primary-6;
          background-color: @color-fill-2;
        }

        &.liked {
          color: rgb(var(--danger-6));

          &:hover {
            color: rgb(var(--danger-7));
          }
        }
      }
    }

    .reply-input-container {
      margin-top: 12px;
      border-top: 1px solid @color-border-2;
      padding-top: 12px;
    }
  }
}
</style>
