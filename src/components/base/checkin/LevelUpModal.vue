<template>
  <a-modal v-model:visible="visible" title="恭喜升级！" :width="400" :footer="false" @cancel="handleClose">
    <div class="levelup-modal">
      <div class="levelup-icon">
        <icon-trophy />
      </div>
      <div class="levelup-content">
        <h2>恭喜升级！</h2>
        <div class="level-change">
          <span class="old-level">LV.{{ oldLevel }}</span>
          <icon-arrow-right class="arrow" />
          <span class="new-level">LV.{{ newLevel }}</span>
        </div>
        <p class="levelup-message">继续加油，探索更多精彩内容！</p>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref } from 'vue';
import { IconTrophy, IconArrowRight } from '@arco-design/web-vue/es/icon';

const visible = ref(false);
const oldLevel = ref(0);
const newLevel = ref(0);

// 打开升级弹窗
const open = (oldLv, newLv) => {
  oldLevel.value = oldLv;
  newLevel.value = newLv;
  visible.value = true;
};

// 关闭弹窗
const handleClose = () => {
  visible.value = false;
};

defineExpose({
  open
});
</script>

<style scoped lang="less">
.levelup-modal {
  padding: 20px;
  text-align: center;

  .levelup-icon {
    font-size: 64px;
    color: rgb(var(--warning-6));
    margin-bottom: 20px;
    animation: bounce 0.6s ease-in-out;
  }

  .levelup-content {
    h2 {
      margin: 0 0 20px 0;
      font-size: 24px;
      color: var(--color-neutral-10);
      font-weight: bold;
    }

    .level-change {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 20px;

      .old-level,
      .new-level {
        font-size: 28px;
        font-weight: bold;
        padding: 8px 20px;
        border-radius: 8px;
        background: var(--color-fill-2);
      }

      .old-level {
        color: var(--color-neutral-6);
      }

      .new-level {
        color: rgb(var(--primary-6));
        background: rgb(var(--primary-1));
      }

      .arrow {
        font-size: 24px;
        color: var(--color-neutral-6);
      }
    }

    .levelup-message {
      margin: 0;
      font-size: 14px;
      color: var(--color-neutral-6);
    }
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}
</style>
