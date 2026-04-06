<template>
  <div class="hero-banner">
    <div class="hero-content">
      <div class="issue-badge-row">
        <el-tag :type="getIssueStatusType(issue.status)" size="small" effect="dark" round>
          {{ formatIssueStatus(issue.status) }}
        </el-tag>
        <span class="issue-id">ISSUE-{{ issue.id.slice(-4) }}</span>
      </div>
      <h1 class="page-title">{{ issue.title }}</h1>
      <div class="issue-meta">
        <div class="meta-item">
          <el-icon><Calendar /></el-icon>
          <span>创建于 {{ formatIssueDate(issue.createdAt) }}</span>
        </div>
        <div v-if="issue.decisionDueAt" class="meta-item">
          <el-icon><Timer /></el-icon>
          <span>截止 {{ formatIssueDate(issue.decisionDueAt) }}</span>
        </div>
        <div class="meta-item">
          <el-icon><User /></el-icon>
          <span>{{ issue.assignee?.username || '未分配' }}</span>
        </div>
      </div>
    </div>

    <div class="hero-actions">
      <el-button-group>
        <el-button :icon="Edit" @click="$emit('edit')">编辑</el-button>
        <el-button :icon="Share">分享</el-button>
      </el-button-group>

      <el-dropdown v-if="nextStatuses.length > 0" trigger="click" @command="handleCommand">
        <el-button type="primary" class="status-btn">
          更改状态 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="status in nextStatuses"
              :key="status.value"
              :command="status.value"
            >
              {{ status.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-tag v-else type="info" effect="plain" size="large" class="no-transition-tag">
        {{ formatIssueStatus(issue.status) }}（终态）
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, Calendar, Edit, Share, Timer, User } from '@element-plus/icons-vue'
import type { IssueDetail, IssueStatusOption } from '../types'
import { formatIssueDate, formatIssueStatus, getIssueStatusType } from '../utils'

const props = defineProps<{
  issue: IssueDetail
  nextStatuses: IssueStatusOption[]
}>()

const emit = defineEmits<{
  edit: []
  'change-status': [status: string]
}>()

function handleCommand(status: string | number | object) {
  emit('change-status', String(status))
}
</script>

<style scoped lang="less">
.hero-banner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 32px;
  margin-bottom: 32px;
  background: @surface-color;
  border: 1px solid @border-color;
  border-radius: @radius-xl;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: @gradient-primary;
  }
}

.hero-content {
  .issue-badge-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .issue-id {
    font-size: 13px;
    color: @text-tertiary;
    font-weight: 700;
    font-family: monospace;
  }

  .page-title {
    font-size: 26px;
    font-weight: 800;
    color: @text-primary;
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }

  .issue-meta {
    display: flex;
    gap: 20px;
  }
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: @text-secondary;

  .el-icon {
    color: @text-tertiary;
  }
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  align-items: center;

  .status-btn {
    background: @gradient-primary;
    border: none;
  }

  .no-transition-tag {
    height: 32px;
  }
}

@media (max-width: 768px) {
  .hero-banner {
    flex-direction: column;
    gap: 20px;
  }

  .hero-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
