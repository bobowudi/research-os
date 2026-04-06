<template>
  <div class="tab-content-grid">
    <div class="main-column">
      <section class="content-section">
        <h3 class="section-title">描述</h3>
        <div class="description-card">
          <p v-if="issue.description">{{ issue.description }}</p>
          <p v-else class="empty-text">暂无描述</p>
        </div>
      </section>
    </div>

    <div class="side-column">
      <section class="content-section">
        <h3 class="section-title">属性</h3>
        <div class="attributes-card">
          <div class="attr-item">
            <span class="attr-label">状态</span>
            <el-tag :type="getIssueStatusType(issue.status)" size="small" effect="dark" round>
              {{ formatIssueStatus(issue.status) }}
            </el-tag>
          </div>
          <div class="attr-item">
            <span class="attr-label">领域</span>
            <el-tag size="small" effect="plain">{{ issue.domain || '未定义' }}</el-tag>
          </div>
          <div class="attr-item">
            <span class="attr-label">优先级</span>
            <span class="priority-indicator" :class="issue.priority">
              <el-icon><Flag /></el-icon>
              {{ formatIssuePriority(issue.priority) }}
            </span>
          </div>
          <div class="attr-item">
            <span class="attr-label">组织</span>
            <span>{{ issue.tenant?.name || '默认组织' }}</span>
          </div>
          <div v-if="issue.decisionDueAt" class="attr-item">
            <span class="attr-label">截止日期</span>
            <span>{{ formatIssueDate(issue.decisionDueAt) }}</span>
          </div>
        </div>
      </section>

      <section class="content-section">
        <h3 class="section-title">AI 洞察摘要</h3>
        <div class="insight-summary-card">
          <p class="insight-text">AI 正在分析该议题的最新进展...</p>
          <div class="insight-footer">
            <el-button size="small" plain :icon="Refresh">重新生成</el-button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Flag, Refresh } from '@element-plus/icons-vue'
import type { IssueDetail } from '../types'
import {
  formatIssueDate,
  formatIssuePriority,
  formatIssueStatus,
  getIssueStatusType,
} from '../utils'

defineProps<{
  issue: IssueDetail
}>()
</script>

<style scoped lang="less">
.tab-content-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 28px;
}

.content-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: @text-primary;
  margin-bottom: 12px;
}

.description-card {
  padding: 24px;
  background: @surface-color;
  border: 1px solid @border-color;
  border-radius: @radius-lg;
  line-height: @line-height-base;
  color: @text-primary;
  white-space: pre-wrap;
}

.attributes-card {
  padding: 16px 20px;
  background: @surface-color;
  border: 1px solid @border-color;
  border-radius: @radius-lg;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.attr-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.attr-label {
  color: @text-tertiary;
  font-weight: 600;
}

.priority-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;

  &.urgent,
  &.high {
    color: @danger-color;
  }

  &.medium {
    color: @warning-color;
  }

  &.low {
    color: @success-color;
  }
}

.insight-summary-card {
  padding: 20px;
  background: @gradient-card-1;
  border: 1px solid #c7d2fe;
  border-radius: @radius-lg;
}

.insight-text {
  font-size: 14px;
  color: @text-secondary;
  line-height: 1.6;
  margin-bottom: 16px;
  font-style: italic;
}

.insight-footer {
  display: flex;
  justify-content: flex-end;
}

.empty-text {
  color: @text-tertiary;
  font-style: italic;
}

@media (max-width: 768px) {
  .tab-content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
