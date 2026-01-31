<template>
  <div class="follow-item" :bordered="true">
    <div class="follow-user-info">
      <Avatar :size="size" v-if="follower" class="user-avatar" @click="goToUserSpace" :src="follower.avatarUrl">
      </Avatar>
      <div class="follow-user-details">
        <div class="follow-user-name">
          <span class="user-link" @click="goToUserSpace">
            {{ follower.nickname }}
          </span>
          <a-tag color="arcoblue" size="small" style="margin-left: 8px;">LV.{{ follower.level }}</a-tag>
          <icon-man v-if="follower.gender === '男'" class="gender-icon gender-male" />
          <icon-woman v-else-if="follower.gender === '女'" class="gender-icon gender-female" />
        </div>
        <div class="follow-user-actions">
          <FollowButton :user-id="follower.id" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {IconMan, IconWoman} from '@arco-design/web-vue/es/icon';
import {useRouter} from 'vue-router';
import FollowButton from '@/components/base/follow/FollowButton.vue';
import Avatar from '@/components/base/avatar/Avatar.vue';

// 定义组件接收的属性
const props = defineProps({
  follower: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      nickname: '',
      avatarUrl: '',
      level: 0,
      gender: ''
    })
  },
  size: {
    type: Number,
    default: 48
  }
});

const router = useRouter();

// 跳转到用户空间页面
const goToUserSpace = () => 
{
  if (props.follower) 
  {
    const routeData = router.resolve({ name: 'User', params: { id: props.follower.id } });
    window.open(routeData.href, '_blank');
  }
};
</script>

<style scoped lang="less">
.follow-item {
  margin-bottom: 12px;
  padding: @size-3;
  background-color: @color-fill-1;
  border-radius: @border-radius-large;
  transition: background-color 0.2s;

  &:hover {
    background-color: @color-fill-2;
    .user-link {
      cursor: pointer;
      user-select: none;
      color: @primary-6;
    }
  }

  .follow-user-info {
    display: flex;
    align-items: center;

    .user-avatar {
      margin-right: 12px;
      flex-shrink: 0;
      cursor: pointer;
    }

    .follow-user-details {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-left: 16px;

      .follow-user-name {
        display: flex;
        align-items: center;

        .user-link {
          font-size: 16px;
          font-weight: 500;
          color: var(--color-neutral-10);
          text-decoration: none;
          cursor: pointer;
        }
      }

      .follow-user-actions {
        display: flex;
        align-items: center;
      }
    }
  }
}

.gender-icon {
  font-size: 16px;
  margin-left: 8px;
}

.gender-male {
  color: @link-6;
}

.gender-female {
  color: @primary-4;
}
</style>