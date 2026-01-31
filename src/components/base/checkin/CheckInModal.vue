<template>
  <a-modal v-model:visible="visible" title="签到记录" :width="480" :footer="false" @cancel="handleClose">
    <div class="checkin-modal">
      <!-- 签到统计 -->
      <div class="checkin-stats" v-if="checkInData">
        <div class="stat-item">
          <span class="stat-label">本月签到</span>
          <span class="stat-value">{{ checkInData.checkInDays?.length || 0 }} 天</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">今日状态</span>
          <span class="stat-value" :style="{ color: todayChecked ? 'rgb(var(--success-6))' : 'var(--color-neutral-6)' }">
            {{ todayChecked ? '已签到' : '未签到' }}
          </span>
        </div>
      </div>

      <!-- 签到日历 -->
      <div class="checkin-calendar" v-if="checkInData?.checkInDays">
        <h4>本月签到记录</h4>
        <div class="calendar-grid">
          <div v-for="day in daysInMonth" :key="day" class="calendar-day"
            :class="{ checked: checkInData.checkInDays.includes(day), today: day === currentDay }">
            {{ day }}
          </div>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="loading">
        <a-spin />
        <p>加载中...</p>
      </div>

      <!-- 无数据提示 -->
      <div v-else-if="!checkInData" class="no-data">
        <icon-calendar class="no-data-icon" />
        <p>暂无签到记录</p>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed } from 'vue';
import { IconCalendar } from '@arco-design/web-vue/es/icon';
import { getCheckInData } from '@/services/checkInService.js';

const visible = ref(false);
const checkInData = ref(null);
const todayChecked = ref(false);
const loading = ref(false);

// 当前日期
const currentDay = new Date().getDate();
const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

// 本月天数
const daysInMonth = computed(() => {
  const days = new Date(currentYear, currentMonth + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => i + 1);
});

// 打开弹窗
const open = async (userInfo) => {
  if (!userInfo || userInfo.id === -1) {
    return;
  }

  visible.value = true;
  loading.value = true;

  try {
    // 使用统一的签到服务获取数据（优先缓存，无缓存则请求后端）
    const data = await getCheckInData(userInfo.id);
    
    if (data) {
      checkInData.value = data;
      todayChecked.value = data.checkInDays?.includes(currentDay) || false;
    } else {
      checkInData.value = null;
      todayChecked.value = false;
    }
  } catch (error) {
    console.error('获取签到数据失败:', error);
    checkInData.value = null;
    todayChecked.value = false;
  } finally {
    loading.value = false;
  }
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
.checkin-modal {
  padding: 20px 0;

  .checkin-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;

    .stat-item {
      flex: 1;
      padding: 16px;
      background: var(--color-fill-2);
      border-radius: 8px;
      text-align: center;

      .stat-label {
        display: block;
        font-size: 14px;
        color: var(--color-neutral-6);
        margin-bottom: 8px;
      }

      .stat-value {
        display: block;
        font-size: 24px;
        font-weight: bold;
        color: rgb(var(--primary-6));
      }
    }
  }

  .checkin-calendar {
    h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: var(--color-neutral-10);
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 8px;

      .calendar-day {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-fill-2);
        border-radius: 4px;
        font-size: 14px;
        color: var(--color-neutral-8);
        transition: all 0.3s;

        &.checked {
          background: rgb(var(--success-6));
          color: white;
          font-weight: bold;
        }

        &.today {
          border: 2px solid rgb(var(--primary-6));
        }

        &.checked.today {
          border-color: rgb(var(--success-6));
        }
      }
    }
  }

  .loading {
    text-align: center;
    padding: 40px 0;

    p {
      margin-top: 16px;
      font-size: 14px;
      color: var(--color-neutral-6);
    }
  }

  .no-data {
    text-align: center;
    padding: 40px 0;

    .no-data-icon {
      font-size: 48px;
      color: var(--color-neutral-4);
      margin-bottom: 16px;
    }

    p {
      margin: 0;
      font-size: 14px;
      color: var(--color-neutral-6);
    }
  }
}
</style>
