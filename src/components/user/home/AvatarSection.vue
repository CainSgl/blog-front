<template>
  <div class="user-avatar-wrapper">
    <a-avatar :size="120" class="user-avatar" >
      <c-img v-if="userInfo?.avatarUrl" :src="userInfo?.avatarUrl" :width="120" :height="120"/>
      <icon-user :size="120" v-else />
    </a-avatar>
  </div>
</template>

<script setup>
import { 
  IconUser
} from '@arco-design/web-vue/es/icon';
import cImg from '@/components/cImg.vue';

const props = defineProps({
  userInfo: {
    type: Object,
    default: null
  }
});


</script>

<style lang="less" scoped>
.user-avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;

  .user-avatar {
    margin-right: 12px;
    flex-shrink: 0;

    background-color: @primary-6
  }
}
</style>