<template>
  <div class="evidence-card" @click="$emit('click')">
    <div class="card-left">
      <div class="source-icon-wrap" :class="evidence.sourceType">
        <el-icon><component :is="getIcon(evidence.sourceType)" /></el-icon>
      </div>
      <div class="evidence-info">
        <h3 class="evidence-title">{{ evidence.sourceLabel || evidence.title || '未命名证据' }}</h3>
        <div class="evidence-meta">
          <el-tag size="small" :type="getSourceTagType(evidence.sourceType)" effect="plain" class="source-tag">
            {{ evidence.sourceType || '未知' }}
          </el-tag>
          <span class="meta-dot">·</span>
          <span class="source-category">{{ evidence.sourceCategory || '未分类' }}</span>
          <span class="meta-dot">·</span>
          <span class="evidence-time">{{ formatTime(evidence.createdAt) }}</span>
        </div>
      </div>
    </div>
    <div class="card-right">
      <div class="confidence-info" v-if="evidence.confidence != null">
        <span class="confidence-label">置信度</span>
        <span class="confidence-value">{{ (evidence.confidence * 100).toFixed(0) }}%</span>
        <el-progress
          :percentage="Math.round(evidence.confidence * 100)"
          :show-text="false"
          :stroke-width="4"
          :color="getConfidenceColor(evidence.confidence)"
          style="width: 60px"
        />
      </div>
      <el-tag
        v-if="evidence.stance"
        size="small"
        :type="getStanceType(evidence.stance)"
        effect="dark"
        round
      >
        {{ formatStance(evidence.stance) }}
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Document, Link, ChatSquare, Memo, Reading, Monitor
} from '@element-plus/icons-vue'

const props = defineProps<{
  evidence: any
}>()

defineEmits(['click'])

function getIcon(type: string) {
  const map: Record<string, any> = {
    report: Document,
    paper: Reading,
    survey: Memo,
    interview: ChatSquare,
    article: Link,
    web: Monitor
  }
  return map[type] || Document
}

function getSourceTagType(type: string) {
  const map: Record<string, string> = {
    report: '',
    paper: 'success',
    survey: 'warning',
    interview: 'danger',
    article: 'info',
    web: 'info'
  }
  return map[type] || ''
}

function getStanceType(stance: string) {
  const map: Record<string, string> = {
    supporting: 'success',
    opposing: 'danger',
    neutral: 'info'
  }
  return map[stance] || 'info'
}

function formatStance(stance: string) {
  const map: Record<string, string> = {
    supporting: '支持',
    opposing: '反对',
    neutral: '中立'
  }
  return map[stance] || stance
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.8) return '#10b981'
  if (confidence >= 0.5) return '#f59e0b'
  return '#ef4444'
}

function formatTime(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return date.toLocaleDateString()
}
</script>

<style scoped lang="less">
.evidence-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: @surface-color;
  border: 1px solid @border-color;
  border-radius: @radius-lg;
  margin-bottom: 12px;
  cursor: pointer;
  transition: @transition-base;

  &:hover {
    border-color: @primary-light;
    box-shadow: @shadow-card;
    transform: translateY(-1px);
  }

  .card-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
  }

  .source-icon-wrap {
    width: 40px;
    height: 40px;
    background: @background-base;
    border-radius: @radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: @text-tertiary;

    &.report { color: @primary-color; background: fade(@primary-color, 10%); }
    &.paper { color: @success-color; background: fade(@success-color, 10%); }
    &.survey { color: @warning-color; background: fade(@warning-color, 10%); }
    &.interview { color: @danger-color; background: fade(@danger-color, 10%); }
  }

  .evidence-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .evidence-title {
    font-size: 14px;
    font-weight: 700;
    color: @text-primary;
    margin: 0;
  }

  .evidence-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: @text-tertiary;
    font-weight: 500;
  }

  .meta-dot { opacity: 0.4; }

  .source-tag {
    font-size: 11px;
    height: 20px;
  }

  .card-right {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .confidence-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;

    .confidence-label {
      font-size: 10px;
      color: @text-tertiary;
      font-weight: 600;
    }

    .confidence-value {
      font-size: 13px;
      font-weight: 700;
      color: @text-secondary;
    }
  }
}
</style>
