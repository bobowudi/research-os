<template>
  <div class="page-header">
    <div class="header-left">
      <div class="header-icon-wrap">
        <el-icon><List /></el-icon>
      </div>
      <div class="header-text">
        <h2 class="page-title">议题管理</h2>
        <p class="page-subtitle">管理与跟踪组织内的所有研究议题</p>
      </div>
    </div>

    <el-button type="primary" size="large" class="create-btn" :icon="Plus" @click="$emit('create')">
      新建议题
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { List, Plus } from '@element-plus/icons-vue'

defineEmits<{
  create: []
}>()
</script>

<style scoped lang="less">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon-wrap {
  width: 48px;
  height: 48px;
  background: @gradient-card-1;
  border-radius: @radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: @primary-color;
}

.page-title {
  font-size: 26px;
  font-weight: 800;
  color: @text-primary;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 14px;
  color: @text-tertiary;
}

.create-btn {
  height: 44px;
  padding: 0 24px;
  background: @gradient-primary;
  border: none;
  font-weight: 700;
  border-radius: @radius-md;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(99, 102, 241, 0.3);
  }
}
</style>
