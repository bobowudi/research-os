<template>
  <div class="issue-detail-page" v-if="issue">
    <!-- Hero Banner -->
    <div class="hero-banner">
      <div class="hero-content">
        <div class="issue-badge-row">
          <el-tag :type="getStatusType(issue.status)" size="small" effect="dark" round>
            {{ formatStatus(issue.status) }}
          </el-tag>
          <span class="issue-id">ISSUE-{{ issue.id.slice(-4) }}</span>
        </div>
        <h1 class="page-title">{{ issue.title }}</h1>
        <div class="issue-meta">
          <div class="meta-item">
            <el-icon><Calendar /></el-icon>
            <span>创建于 {{ formatDate(issue.createdAt) }}</span>
          </div>
          <div class="meta-item" v-if="issue.decisionDueAt">
            <el-icon><Timer /></el-icon>
            <span>截止 {{ formatDate(issue.decisionDueAt) }}</span>
          </div>
          <div class="meta-item">
            <el-icon><User /></el-icon>
            <span>{{ issue.assignee?.username || '未分配' }}</span>
          </div>
        </div>
      </div>
      <div class="hero-actions">
        <el-button-group>
          <el-button :icon="Edit" @click="showEditDialog = true">编辑</el-button>
          <el-button :icon="Share">分享</el-button>
        </el-button-group>
        <el-dropdown trigger="click" @command="handleStatusChange" v-if="nextStatuses.length > 0">
          <el-button type="primary" class="status-btn">
            更改状态 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="s in nextStatuses"
                :key="s.value"
                :command="s.value"
              >
                {{ s.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-tag v-else type="info" effect="plain" size="large" class="no-transition-tag">
          {{ formatStatus(issue.status) }}（终态）
        </el-tag>
      </div>
    </div>

    <IssueStatCards :cards="statCards" />

    <!-- Tab Layout -->
    <el-tabs v-model="activeTab" class="detail-tabs" type="border-card">
      <!-- Tab 1: Description -->
      <el-tab-pane label="描述" name="description">
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
                  <el-tag :type="getStatusType(issue.status)" size="small" effect="dark" round>
                    {{ formatStatus(issue.status) }}
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
                    {{ formatPriority(issue.priority) }}
                  </span>
                </div>
                <div class="attr-item">
                  <span class="attr-label">组织</span>
                  <span>{{ issue.tenant?.name || '默认组织' }}</span>
                </div>
                <div class="attr-item" v-if="issue.decisionDueAt">
                  <span class="attr-label">截止日期</span>
                  <span>{{ formatDate(issue.decisionDueAt) }}</span>
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
      </el-tab-pane>

      <!-- Tab 2: Evidence -->
      <el-tab-pane name="evidence">
        <template #label>
          <span>证据</span>
          <el-badge v-if="issue.evidenceCount" :value="issue.evidenceCount" :max="99" class="tab-badge" />
        </template>
        <IssueEvidencePanel :issue-id="issueId" @linked="handleEvidenceLinked" />
      </el-tab-pane>

      <!-- Tab 3: Insights -->
      <el-tab-pane name="insights">
        <template #label>
          <span>洞察</span>
          <el-badge v-if="issue.insightCount" :value="issue.insightCount" :max="99" class="tab-badge" />
        </template>
        <IssueInsightPanel :issue-id="issueId" />
      </el-tab-pane>

      <!-- Tab 4: Decisions -->
      <el-tab-pane name="decisions">
        <template #label>
          <span>决策</span>
          <el-badge v-if="issue.decisionCardCount" :value="issue.decisionCardCount" :max="99" class="tab-badge" />
        </template>
        <IssueDecisionPanel :issue-id="issueId" />
      </el-tab-pane>
    </el-tabs>

    <!-- Edit Dialog -->
    <IssueEditDialog
      v-model="showEditDialog"
      :issue="issue"
      @saved="handleEditSaved"
    />
  </div>
  <div v-else class="loading-state" v-loading="true"></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiClient } from '@/shared/api/client'
import {
  Calendar, Timer, User, Edit, Share, ArrowDown,
  Flag, Document, Opportunity, Aim, Refresh
} from '@element-plus/icons-vue'
import IssueStatCards from '../components/IssueStatCards.vue'
import IssueEvidencePanel from '../components/IssueEvidencePanel.vue'
import IssueInsightPanel from '../components/IssueInsightPanel.vue'
import IssueDecisionPanel from '../components/IssueDecisionPanel.vue'
import IssueEditDialog from '../components/IssueEditDialog.vue'

const route = useRoute()
const issueId = computed(() => route.params.id as string)
const issue = ref<any>(null)
const activeTab = ref('description')
const showEditDialog = ref(false)

// ===== Status Transition Map =====
const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['collecting'],
  collecting: ['analyzing', 'closed'],
  analyzing: ['pending_decision', 'collecting', 'closed'],
  pending_decision: ['decided', 'analyzing'],
  decided: ['closed'],
  closed: ['collecting']
}

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  collecting: '收集中',
  analyzing: '分析中',
  pending_decision: '待决策',
  decided: '已决策',
  closed: '已关闭'
}

const nextStatuses = computed(() => {
  if (!issue.value) return []
  const allowed = STATUS_TRANSITIONS[issue.value.status] || []
  return allowed.map(s => ({ value: s, label: STATUS_LABELS[s] || s }))
})

// ===== Stat Cards =====
const statCards = computed(() => [
  { label: '关联证据', value: issue.value?.evidenceCount || 0, icon: Document, type: 'primary' as const, trend: '+2', trendType: 'up' as const },
  { label: '深度洞察', value: issue.value?.insightCount || 0, icon: Opportunity, type: 'success' as const },
  { label: '决策建议', value: issue.value?.decisionCardCount || 0, icon: Aim, type: 'warning' as const }
])

// ===== Load Issue =====
async function loadIssue() {
  try {
    const res = await apiClient.get(`/api/issues/${issueId.value}`)
    issue.value = res.data.data
  } catch (error) {
    console.error('Failed to load issue:', error)
  }
}

// ===== Status Change =====
async function handleStatusChange(newStatus: string) {
  const statusLabel = STATUS_LABELS[newStatus] || newStatus
  try {
    await ElMessageBox.confirm(
      `确定要将议题状态更改为「${statusLabel}」吗？`,
      '确认状态变更',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return // user cancelled
  }

  try {
    await apiClient.patch(`/api/issues/${issueId.value}`, { status: newStatus })
    ElMessage.success(`状态已更改为「${statusLabel}」`)
    await loadIssue()
  } catch (err: any) {
    ElMessage.error(err.response?.data?.error?.message || '状态变更失败')
  }
}

// ===== Edit =====
async function handleEditSaved() {
  await loadIssue()
}

// ===== Evidence Linked =====
async function handleEvidenceLinked() {
  await loadIssue() // refresh counts
}

// ===== Formatters =====
function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatStatus(status: string) {
  return STATUS_LABELS[status] || status
}

function getStatusType(status: string) {
  const map: any = { draft: 'info', collecting: 'primary', analyzing: 'warning', pending_decision: 'danger', decided: 'success', closed: 'info' }
  return map[status] || ''
}

function formatPriority(priority: string) {
  const map: any = { urgent: '紧急', high: '高', medium: '中', low: '低', none: '无' }
  return map[priority] || '无'
}

onMounted(loadIssue)
</script>

<style scoped lang="less">
.issue-detail-page {
  max-width: 1100px;
  margin: 0 auto;
}

// ===== Hero Banner =====
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

  .hero-content {
    .issue-badge-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .issue-id {
        font-size: 13px;
        color: @text-tertiary;
        font-weight: 700;
        font-family: monospace;
      }
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

      .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: @text-secondary;

        .el-icon { color: @text-tertiary; }
      }
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
}

// ===== Tabs =====
.detail-tabs {
  margin-bottom: 40px;
  border-radius: @radius-lg;
  overflow: hidden;
  border: 1px solid @border-color;
  background: @surface-color;

  :deep(.el-tabs__header) {
    background: @background-base;
    margin-bottom: 0;
  }

  :deep(.el-tabs__content) {
    padding: 24px;
  }

  :deep(.el-tabs__item) {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.tab-badge {
  margin-left: 6px;

  :deep(.el-badge__content) {
    font-size: 10px;
  }
}

// ===== Tab Content Grid (Description tab) =====
.tab-content-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 28px;
}

.content-section {
  margin-bottom: 28px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .section-title {
    font-size: 15px;
    font-weight: 700;
    color: @text-primary;
    margin-bottom: 12px;
  }
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

  .attr-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;

    .attr-label {
      color: @text-tertiary;
      font-weight: 600;
    }

    .priority-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 700;

      &.urgent, &.high { color: @danger-color; }
      &.medium { color: @warning-color; }
      &.low { color: @success-color; }
    }
  }
}

.insight-summary-card {
  padding: 20px;
  background: @gradient-card-1;
  border: 1px solid #c7d2fe;
  border-radius: @radius-lg;

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
}

.empty-text {
  color: @text-tertiary;
  font-style: italic;
}

.loading-state {
  height: 400px;
}

// ===== Responsive =====
@media (max-width: 768px) {
  .tab-content-grid {
    grid-template-columns: 1fr;
  }

  .hero-banner {
    flex-direction: column;
    gap: 20px;

    .hero-actions {
      width: 100%;
      justify-content: flex-start;
    }
  }
}
</style>
