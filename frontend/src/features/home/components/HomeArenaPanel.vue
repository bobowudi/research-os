<template>
  <section class="arena-panel">
    <div class="arena-card">
      <div class="arena-card__pattern"></div>

      <div class="confidence-board">
        <div class="confidence-icons">
          <div :class="['confidence-icon', 'confidence-icon--blue', { 'confidence-icon--active': confidenceScore > 50 }]">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div :class="['confidence-icon', 'confidence-icon--red', { 'confidence-icon--active': confidenceScore < 50 }]">
            <el-icon><Warning /></el-icon>
          </div>
        </div>

        <div class="confidence-gauge">
          <svg class="confidence-gauge__svg" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="76" fill="none" stroke="#f1f5f9" stroke-width="12" />
            <circle
              cx="100"
              cy="100"
              r="76"
              fill="none"
              :stroke="confidenceScore > 50 ? '#2563eb' : '#ef4444'"
              stroke-width="14"
              stroke-linecap="round"
              stroke-dasharray="478"
              :stroke-dashoffset="478 - (478 * confidenceScore) / 100"
              class="confidence-gauge__progress"
            />
          </svg>
          <div class="confidence-gauge__label">
            <span :class="['confidence-gauge__value', confidenceScore > 50 ? 'is-blue' : 'is-red']">
              {{ Math.round(confidenceScore) }}%
            </span>
            <span class="confidence-gauge__caption">综合决策偏好</span>
          </div>
        </div>
      </div>

      <div class="log-stream">
        <div class="log-stream__heading">
          <el-icon><Lightning /></el-icon>
          <span>Agent 推理实况流</span>
        </div>

        <div class="log-stream__viewport">
          <div class="log-stream__fade"></div>
          <div :class="['log-stream__list', { 'log-stream__list--running': isDebating }]">
            <div class="log-entry log-entry--blue">
              <div class="log-entry__mark">正</div>
              <p>Advocate: 分析内部 NPS 调研。结论：降价可直接阻止 12% 的流失风险。</p>
            </div>
            <div class="log-entry log-entry--red">
              <div class="log-entry__mark">反</div>
              <p>Critic: 外部信号监控中。风险提示：竞品 A 保持高价，我方先行降价将损害高端心智。</p>
            </div>
            <div class="log-entry log-entry--neutral">
              <div class="log-entry__mark">判</div>
              <p>Judge: 正在平衡“留存率”与“ARPU 长期趋势”，计算最优解中...</p>
            </div>
          </div>
        </div>
      </div>

      <transition name="slide-up">
        <div v-if="stage === 'verdict'" class="verdict-panel">
          <div class="verdict-panel__header">
            <div class="verdict-panel__title">
              <div class="verdict-panel__icon">
                <el-icon><Select /></el-icon>
              </div>
              <span>最终推理建议</span>
            </div>
            <button class="verdict-panel__link" @click="$emit('open-decisions')">
              深度报告
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>

          <div class="verdict-card">
            <p class="verdict-card__eyebrow">Decision Card</p>
            <p class="verdict-card__content">
              建议采取“定向优惠策略”而非全量降价，利用暗折形式留存高敏感用户并维持官宣价。
            </p>
          </div>
        </div>
      </transition>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight, Lightning, Select, TrendCharts, Warning } from '@element-plus/icons-vue'
import type { DebateStage } from '../types'

defineProps<{
  stage: DebateStage
  isDebating: boolean
  confidenceScore: number
}>()

defineEmits<{
  'open-decisions': []
}>()
</script>

<style scoped lang="less">
.arena-card {
  position: relative;
  overflow: hidden;
  min-height: 640px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 32px;
  background: #fff;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.05);

  &__pattern {
    position: absolute;
    inset: 0;
    opacity: 0.03;
    background-image: radial-gradient(#3b82f6 1px, transparent 1px);
    background-size: 24px 24px;
    pointer-events: none;
  }
}

.confidence-board,
.log-stream {
  position: relative;
  z-index: 1;
}

.confidence-board {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
}

.confidence-icons {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 56px;
  margin-bottom: 24px;
}

.confidence-icon {
  width: 80px;
  height: 80px;
  border: 4px solid #fff;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.14);
  opacity: 0.4;
  transform: scale(0.9);
  transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);

  .el-icon {
    font-size: 34px;
    color: #fff;
  }

  &--blue {
    background: #2563eb;
    transform: rotate(3deg) scale(0.9);
  }

  &--red {
    background: #ef4444;
    transform: rotate(-3deg) scale(0.9);
  }

  &--active {
    opacity: 1;
    transform: scale(1.25);
  }
}

.confidence-gauge {
  position: relative;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;

  &__svg {
    width: 100%;
    max-width: 320px;
    transform: rotate(-90deg);
  }

  &__progress {
    transition: stroke-dashoffset 0.7s ease, stroke 0.7s ease;
  }

  &__label {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &__value {
    font-size: 72px;
    font-weight: 900;
    letter-spacing: -0.06em;

    &.is-blue {
      color: #2563eb;
    }

    &.is-red {
      color: #ef4444;
    }
  }

  &__caption {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
    color: #94a3b8;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
}

.log-stream {
  margin-top: 20px;
  padding: 0 8px;

  &__heading {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding-bottom: 12px;
    border-bottom: 1px solid #f1f5f9;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;

    .el-icon {
      color: #2563eb;
    }
  }

  &__viewport {
    position: relative;
    height: 160px;
    overflow: hidden;
    margin-top: 16px;
  }

  &__fade {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    height: 64px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #fff 100%);
    pointer-events: none;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: transform 0.7s ease;

    &--running {
      transform: translateY(-32px);
    }
  }
}

.log-entry {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 24px;
  border: 1px solid transparent;

  &--blue {
    background: #eff6ff;
    border-color: rgba(191, 219, 254, 0.6);
    color: #1e40af;
  }

  &--red {
    background: #fef2f2;
    border-color: rgba(254, 202, 202, 0.7);
    color: #991b1b;
  }

  &--neutral {
    background: #f8fafc;
    border-color: #e2e8f0;
    color: #475569;
  }

  p {
    font-size: 12px;
    line-height: 1.55;
    font-weight: 700;
  }

  &__mark {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    background: #0f172a;
  }

  &--blue &__mark {
    background: #2563eb;
  }

  &--red &__mark {
    background: #ef4444;
  }
}

.verdict-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  padding: 32px;
  border-top: 1px solid #f1f5f9;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(18px);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    color: #0f172a;
    font-size: 20px;
    font-weight: 900;
  }

  &__icon {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #2563eb;
    color: #fff;
    box-shadow: 0 16px 30px rgba(37, 99, 235, 0.2);
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #2563eb;
    font-size: 12px;
    font-weight: 800;
    background: transparent;
  }
}

.verdict-card {
  padding: 24px;
  border-radius: 24px;
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #4338ca 100%);
  box-shadow: 0 28px 48px rgba(37, 99, 235, 0.25);

  &__eyebrow {
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.72;
  }

  &__content {
    font-size: 24px;
    line-height: 1.45;
    font-weight: 800;
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.35s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
