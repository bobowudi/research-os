<template>
  <div class="issue-status-tabs">
    <div
      v-for="tab in tabs"
      :key="tab.value"
      class="tab-item"
      :class="{ active: modelValue === tab.value }"
      @click="$emit('update:modelValue', tab.value)"
    >
      <span class="tab-label">{{ tab.label }}</span>
      <span class="tab-count" v-if="tab.count !== undefined">{{ tab.count }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Tab {
  label: string
  value: string
  count?: number
}

defineProps<{
  modelValue: string
  tabs: Tab[]
}>()

defineEmits(['update:modelValue'])
</script>

<style scoped lang="less">
.issue-status-tabs {
  display: flex;
  gap: 4px;
  background: @surface-color;
  border: 1px solid @border-color;
  border-radius: @radius-lg;
  padding: 4px;
  margin-bottom: 24px;
  width: fit-content;
}

.tab-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: @radius-md;
  transition: @transition-base;
  color: @text-tertiary;
  font-size: 13px;
  font-weight: 600;

  &:hover {
    color: @text-primary;
    background: @background-base;
  }

  &.active {
    color: #fff;
    background: @gradient-primary;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);

    .tab-count {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
    }
  }

  .tab-count {
    font-size: 11px;
    background: @background-base;
    padding: 1px 6px;
    border-radius: @radius-sm;
    color: @text-tertiary;
    font-weight: 700;
  }
}
</style>
