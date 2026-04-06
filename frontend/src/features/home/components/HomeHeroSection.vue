<template>
  <section class="hero-section">
    <div class="hero-section__glow"></div>

    <div class="hero-copy">
      <div class="hero-eyebrow">
        <span class="hero-eyebrow__dot"></span>
        实时议题推理中
      </div>
      <h1 class="hero-title">关于 Q3 用户订阅价格调整的对抗性推理决策</h1>
      <p class="hero-description">
        该议题旨在通过 AI 推理权衡内部流失压力与外部品牌溢价。系统已自动汇聚 142 条关键证据。
      </p>

      <div class="hero-metrics">
        <div class="metric-pill">
          <el-icon><Document /></el-icon>
          <span>内部数据: 86</span>
        </div>
        <div class="metric-pill">
          <el-icon><DataAnalysis /></el-icon>
          <span>外部信号: 56</span>
        </div>
      </div>
    </div>

    <div class="hero-action">
      <button v-if="stage === 'gathering'" class="launch-button" @click="$emit('start')">
        <el-icon><VideoPlay /></el-icon>
        <span>开始对抗推理</span>
      </button>

      <div v-else class="depth-meter">
        <span class="depth-meter__label">Agent 博弈深度</span>
        <div class="depth-meter__track">
          <div class="depth-meter__fill" :style="{ width: stage === 'verdict' ? '100%' : '66%' }"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { DataAnalysis, Document, VideoPlay } from '@element-plus/icons-vue'
import type { DebateStage } from '../types'

defineProps<{
  stage: DebateStage
}>()

defineEmits<{
  start: []
}>()
</script>

<style scoped lang="less">
.hero-section {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 32px;
  background: #fff;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.05);

  &__glow {
    position: absolute;
    inset: 0 0 0 auto;
    width: 34%;
    background: linear-gradient(270deg, rgba(219, 234, 254, 0.55) 0%, rgba(255, 255, 255, 0) 100%);
    pointer-events: none;
  }
}

.hero-copy,
.hero-action {
  position: relative;
  z-index: 1;
}

.hero-copy {
  flex: 1;
  min-width: 0;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #2563eb;
    animation: pulse 1.6s ease infinite;
  }
}

.hero-title {
  max-width: 760px;
  margin-bottom: 14px;
  color: #0f172a;
  font-size: 40px;
  line-height: 1.15;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.hero-description {
  max-width: 760px;
  margin-bottom: 18px;
  color: #64748b;
  font-size: 16px;
  line-height: 1.75;
}

.hero-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.metric-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
  color: #475569;
  font-size: 11px;
  font-weight: 800;

  .el-icon {
    color: #2563eb;
  }
}

.hero-action {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.launch-button {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 20px 40px;
  border-radius: 24px;
  background: #2563eb;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  box-shadow: 0 24px 40px rgba(37, 99, 235, 0.22);
  transition: transform 0.25s ease, background 0.25s ease;

  &:hover {
    background: #1d4ed8;
    transform: scale(1.03);
  }
}

.depth-meter {
  min-width: 192px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  &__label {
    color: #94a3b8;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  &__track {
    width: 192px;
    height: 12px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    background: #f1f5f9;
  }

  &__fill {
    height: 100%;
    border-radius: inherit;
    background: #2563eb;
    transition: width 1s ease;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.7;
    transform: scale(1.7);
  }
}

@media (max-width: 960px) {
  .hero-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-title {
    font-size: 32px;
  }

  .hero-action {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
