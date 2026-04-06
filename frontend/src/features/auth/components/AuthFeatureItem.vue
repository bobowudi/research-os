<template>
  <div class="feature-item">
    <div :class="['feature-icon', `feature-icon--${tone}`]">{{ icon }}</div>
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  icon: string
  label: string
  tone?: 'cyan' | 'violet' | 'amber'
}>(), {
  tone: 'cyan',
})
</script>

<style scoped lang="less">
.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: @radius-lg;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  backdrop-filter: blur(8px);
  transition: @transition-base;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateX(4px);
  }
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;

  &--cyan {
    background: rgba(6, 182, 212, 0.2);
  }

  &--violet {
    background: rgba(139, 92, 246, 0.2);
  }

  &--amber {
    background: rgba(245, 158, 11, 0.2);
  }
}
</style>
