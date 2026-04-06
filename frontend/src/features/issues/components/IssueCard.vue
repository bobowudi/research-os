<template>
  <div class="issue-card" @click="$emit('click')">
    <div class="card-left">
      <div class="status-dot" :class="issue.status"></div>
      <div class="issue-info">
        <h3 class="issue-title">{{ issue.title }}</h3>
        <div class="issue-meta">
          <span class="issue-id">ISSUE-{{ issue.id.slice(-4) }}</span>
          <span class="meta-dot">·</span>
          <el-tag v-if="issue.domain" size="small" effect="plain" round class="domain-tag">{{ issue.domain }}</el-tag>
          <span class="meta-dot">·</span>
          <span class="issue-time">{{ formatIssueRelativeTime(issue.createdAt) }}</span>
        </div>
      </div>
    </div>
    <div class="card-right">
      <div class="issue-stats">
        <div class="stat-item" v-if="issue.evidenceCount" title="证据">
          <el-icon><Document /></el-icon>
          <span>{{ issue.evidenceCount }}</span>
        </div>
        <div class="stat-item" v-if="issue.insightCount" title="洞察">
          <el-icon><Opportunity /></el-icon>
          <span>{{ issue.insightCount }}</span>
        </div>
      </div>
      <div class="priority-badge" :class="issue.priority">
        <el-icon><Flag /></el-icon>
        <span>{{ formatIssuePriority(issue.priority) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document, Flag, Opportunity } from '@element-plus/icons-vue'
import type { IssueDetail } from '../types'
import { formatIssuePriority, formatIssueRelativeTime } from '../utils'

defineProps<{
  issue: IssueDetail
}>()

defineEmits(['click'])
</script>

<style scoped lang="less">
.issue-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: @surface-color;
  border: 1px solid @border-color;
  border-radius: @radius-lg;
  margin-bottom: 10px;
  cursor: pointer;
  transition: @transition-base;

  &:hover {
    border-color: @primary-light;
    box-shadow: @shadow-card, 0 0 0 1px rgba(99, 102, 241, 0.08);
    transform: translateY(-1px);
  }

  .card-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
  }

  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: @text-tertiary;
    flex-shrink: 0;

    &.todo { background-color: @info-color; }
    &.in_progress { background-color: @warning-color; }
    &.done { background-color: @success-color; }
    &.canceled { background-color: @text-tertiary; opacity: 0.5; }
    &.backlog { background-color: @text-tertiary; }
    &.collecting { background-color: @info-color; }
    &.analyzing { background-color: @warning-color; }
    &.pending_decision { background-color: @danger-color; }
    &.decided { background-color: @success-color; }
    &.draft { background-color: @text-tertiary; }
  }

  .issue-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .issue-title {
    font-size: 14px;
    font-weight: 700;
    color: @text-primary;
    margin: 0;
  }

  .issue-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: @text-tertiary;
    font-weight: 500;
  }

  .meta-dot { opacity: 0.4; }

  .domain-tag {
    font-size: 11px;
    height: 20px;
    border-color: @border-color;
    color: @text-secondary;
  }

  .card-right {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .issue-stats {
    display: flex;
    gap: 16px;
    color: @text-tertiary;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
    }
  }

  .priority-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: @radius-sm;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: @text-tertiary;
    background: @background-base;

    &.urgent, &.high {
      color: @danger-color;
      background: #fef2f2;
    }
    &.medium {
      color: @warning-color;
      background: #fffbeb;
    }
    &.low {
      color: @success-color;
      background: #ecfdf5;
    }
  }
}
</style>
