<template>
  <a-badge :count="message.checked ? 0 : 1" text="新" color="arcoblue">
    <div class="message-item" @click="handleClick">
      <div>
        <a-link class="user-info" :hoverable="false" target="_ablank" :href="`/space/${message.targetUser}`">
          <Avatar :size="48" :src="message.targetUserAvatarUrl" class="user-avatar" />
          <div class="user-details">
            <div class="user-name-row">
              <span class="user-nickname">{{ message.targetUserNickname }}</span>
              <icon-man v-if="message.targetUserGender === '男'" class="gender-icon male" />
              <icon-woman v-if="message.targetUserGender === '女'" class="gender-icon female" />
              <a-tag color="arcoblue" size="small" class="level-tag">LV.{{ message.targetUserLevel }}</a-tag>

            </div>
            <div class="action-text">
              <span>{{ formatDate(message.createdAt) }}</span>
              <slot name="action"></slot>
            </div>
          </div>
        </a-link>
      </div>

      <div class="content-slot">
        <slot></slot>
      </div>

    </div>
  </a-badge>
  <a-divider dashed />

</template>

<script setup>
import {IconMan, IconWoman} from '@arco-design/web-vue/es/icon';
import Avatar from '@/components/base/avatar/Avatar.vue';
import {formatDate} from '@/utils/DateFormatter.js';

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['click']);

const handleClick = () => {
  emit('click', props.message);
};
</script>

<style scoped lang="less">
.message-item {
  display: flex;

  gap: 16px;
  padding: 16px;
  background-color: @color-bg-2;
  border-radius: 8px;

  transition: all 0.2s;





  .user-info {
    display: flex;

    gap: 12px;
    flex-shrink: 0;
    cursor: pointer;

    .user-avatar {
      flex-shrink: 0;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .user-name-row {
        display: flex;
        align-items: center;
        gap: 4px;

        .user-nickname {
          font-size: 14px;
          font-weight: 600;
          color: @color-text-1;
        }

        .gender-icon {
          font-size: 14px;

          &.male {
            color: #55acee;
          }

          &.female {
            color: #e85695;
          }
        }

        .level-tag {
          margin-left: 2px;
        }
      }

      .action-text {
        font-size: 13px;
        color: @color-text-2;
      }
    }
  }

  .content-slot {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: flex-start;
  }

  .message-status {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }
}
</style>
