<template>
  <el-header height="64px" class="workspace-header">
    <div class="workspace-header__title">
      <span class="workspace-header__current">{{ title }}</span>
      <div class="workspace-header__divider"></div>
      <div class="engine-status">
        <span class="engine-status__dot"></span>
        <span>推理引擎就绪</span>
      </div>
    </div>

    <div class="workspace-header__actions">
      <div class="view-switch">
        <button class="view-switch__button view-switch__button--active">个人空间</button>
        <button class="view-switch__button">团队协作</button>
      </div>
      <button class="notify-button" type="button" aria-label="通知">
        <el-icon><Bell /></el-icon>
      </button>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { Bell } from '@element-plus/icons-vue'

defineProps<{
  title: string
}>()
</script>

<style scoped lang="less">
.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  box-sizing: border-box;

  &__title {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
  }

  &__current {
    color: #0f172a;
    font-size: 14px;
    font-weight: 800;
  }

  &__divider {
    width: 1px;
    height: 16px;
    background: #e2e8f0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}

.engine-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #22c55e;
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.45);
    animation: pulse 1.6s ease infinite;
  }
}

.view-switch {
  display: inline-flex;
  align-items: center;
  padding: 4px;
  border-radius: 10px;
  background: #f1f5f9;

  &__button {
    padding: 6px 12px;
    border-radius: 8px;
    background: transparent;
    color: #94a3b8;
    font-size: 12px;
    font-weight: 800;

    &--active {
      background: #fff;
      color: #2563eb;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    }
  }
}

.notify-button {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: transparent;
  color: #94a3b8;
  transition: all 0.2s ease;

  &:hover {
    color: #475569;
    background: #f8fafc;
  }

  .el-icon {
    font-size: 18px;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.6;
  }
}

@media (max-width: 960px) {
  .workspace-header {
    padding: 0 20px;
    gap: 12px;

    &__actions {
      gap: 10px;
    }
  }
}
</style>
