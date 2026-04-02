<template>
  <div class="issue-stat-cards">
    <div v-for="(card, i) in cards" :key="card.label" class="stat-card" :class="[card.type, `card-${i}`]">
      <div class="card-header">
        <span class="card-label">{{ card.label }}</span>
        <div class="icon-wrap">
          <el-icon class="card-icon"><component :is="card.icon" /></el-icon>
        </div>
      </div>
      <div class="card-body">
        <div class="card-value">{{ card.value }}</div>
        <div class="card-trend" v-if="card.trend">
          <span class="trend-value" :class="card.trendType">
            {{ card.trendType === 'up' ? '↑' : '↓' }} {{ card.trend }}
          </span>
          <span class="trend-label">较上周</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface StatCard {
  label: string
  value: string | number
  icon: any
  type?: 'primary' | 'success' | 'warning' | 'info'
  trend?: string | number
  trendType?: 'up' | 'down'
}

defineProps<{
  cards: StatCard[]
}>()
</script>

<style scoped lang="less">
.issue-stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  padding: 24px;
  background: @surface-color;
  border: 1px solid @border-color;
  border-radius: @radius-xl;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: @transition-base;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: @shadow-lg;
  }

  // Colored top borders via gradient
  &.card-0::before, &.primary::before { background: @gradient-primary; }
  &.card-1::before, &.success::before { background: linear-gradient(90deg, @success-color, #34d399); }
  &.card-2::before, &.warning::before { background: linear-gradient(90deg, @warning-color, #fbbf24); }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: @text-tertiary;
    }

    .icon-wrap {
      width: 36px;
      height: 36px;
      background: @background-base;
      border-radius: @radius-md;
      display: flex;
      align-items: center;
      justify-content: center;

      .card-icon {
        font-size: 18px;
        color: @primary-color;
      }
    }
  }

  &.success .icon-wrap .card-icon { color: @success-color; }
  &.warning .icon-wrap .card-icon { color: @warning-color; }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .card-value {
    font-size: 32px;
    font-weight: 800;
    color: @text-primary;
    letter-spacing: -1px;
    line-height: 1;
  }

  .card-trend {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;

    .trend-value {
      font-weight: 700;
      &.up { color: @success-color; }
      &.down { color: @danger-color; }
    }

    .trend-label {
      color: @text-tertiary;
    }
  }
}
</style>
