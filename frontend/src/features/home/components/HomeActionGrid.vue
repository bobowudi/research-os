<template>
  <transition name="fade-up">
    <section v-if="stage === 'verdict'" class="action-grid">
      <article class="action-hero" @click="$emit('open-actions')">
        <div class="action-hero__glow"></div>
        <div class="action-hero__body">
          <p class="action-hero__eyebrow">Next Actions</p>
          <h2>派生 4 个可执行任务</h2>
          <p>决策已自动分解并同步至执行面板。</p>
        </div>
        <div class="action-hero__link">
          <div class="action-hero__icon">
            <el-icon><ArrowRight /></el-icon>
          </div>
          <span>追踪面板</span>
        </div>
      </article>

      <article v-for="item in items" :key="item.title" class="action-card" @click="$emit('open-actions')">
        <div class="action-card__header">
          <div class="action-card__icon">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
          <span class="action-card__deadline">{{ item.deadline }}</span>
        </div>

        <h3>{{ item.title }}</h3>
        <p>负责人：{{ item.owner }}</p>
      </article>
    </section>
  </transition>
</template>

<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'
import type { ActionItem, DebateStage } from '../types'

defineProps<{
  stage: DebateStage
  items: ActionItem[]
}>()

defineEmits<{
  'open-actions': []
}>()
</script>

<style scoped lang="less">
.action-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr;
  gap: 24px;
}

.action-hero {
  position: relative;
  overflow: hidden;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 32px;
  border-radius: 32px;
  background: #0f172a;
  color: #fff;
  box-shadow: 0 28px 48px rgba(15, 23, 42, 0.18);
  cursor: pointer;

  &__glow {
    position: absolute;
    top: 0;
    right: 0;
    width: 128px;
    height: 128px;
    background: rgba(37, 99, 235, 0.22);
    filter: blur(64px);
  }

  &__body,
  &__link {
    position: relative;
    z-index: 1;
  }

  &__eyebrow {
    margin-bottom: 18px;
    color: #64748b;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  h2 {
    max-width: 240px;
    margin-bottom: 12px;
    font-size: 40px;
    line-height: 1.1;
    font-weight: 900;
    letter-spacing: -0.05em;
  }

  p {
    color: #94a3b8;
    font-size: 13px;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    color: #fff;
    font-size: 12px;
    font-weight: 800;
  }

  &__icon {
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    background: #2563eb;
    box-shadow: 0 16px 30px rgba(37, 99, 235, 0.22);
  }
}

.action-card {
  padding: 28px;
  border: 1px solid #e2e8f0;
  border-radius: 32px;
  background: #fff;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #bfdbfe;
    box-shadow: 0 24px 40px rgba(15, 23, 42, 0.08);
  }

  h3 {
    margin-bottom: 8px;
    color: #1e293b;
    font-size: 18px;
    line-height: 1.35;
    font-weight: 800;
    transition: color 0.25s ease;
  }

  p {
    color: #94a3b8;
    font-size: 13px;
    font-weight: 600;
  }

  &:hover h3 {
    color: #2563eb;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 28px;
  }

  &__icon {
    width: 48px;
    height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    background: #f8fafc;
    color: #94a3b8;
    transition: background 0.3s ease, color 0.3s ease;

    .el-icon {
      font-size: 24px;
    }

    .action-card:hover & {
      background: #2563eb;
      color: #fff;
    }
  }

  &__deadline {
    padding: 6px 12px;
    border-radius: 14px;
    background: #f1f5f9;
    color: #64748b;
    font-size: 10px;
    font-weight: 900;
  }
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.35s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

@media (max-width: 1280px) {
  .action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>
