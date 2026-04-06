<template>
  <div v-if="issue" class="issue-detail-page">
    <IssueDetailHero
      :issue="issue"
      :next-statuses="nextStatuses"
      @edit="showEditDialog = true"
      @change-status="handleStatusChange"
    />

    <IssueStatCards :cards="statCards" />

    <el-tabs v-model="activeTab" class="detail-tabs" type="border-card">
      <el-tab-pane label="描述" name="description">
        <IssueDescriptionTab :issue="issue" />
      </el-tab-pane>

      <el-tab-pane name="evidence">
        <template #label>
          <span>证据</span>
          <el-badge v-if="issue.evidenceCount" :value="issue.evidenceCount" :max="99" class="tab-badge" />
        </template>
        <IssueEvidencePanel :issue-id="issueId" @linked="handleEvidenceLinked" />
      </el-tab-pane>

      <el-tab-pane name="insights">
        <template #label>
          <span>洞察</span>
          <el-badge v-if="issue.insightCount" :value="issue.insightCount" :max="99" class="tab-badge" />
        </template>
        <IssueInsightPanel :issue-id="issueId" />
      </el-tab-pane>

      <el-tab-pane name="decisions">
        <template #label>
          <span>决策</span>
          <el-badge v-if="issue.decisionCardCount" :value="issue.decisionCardCount" :max="99" class="tab-badge" />
        </template>
        <IssueDecisionPanel :issue-id="issueId" />
      </el-tab-pane>
    </el-tabs>

    <IssueEditDialog
      v-model="showEditDialog"
      :issue="issue"
      @saved="handleEditSaved"
    />
  </div>

  <div v-else class="loading-state" v-loading="true"></div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiClient } from '@/shared/api/client'
import IssueDecisionPanel from '../components/IssueDecisionPanel.vue'
import IssueDescriptionTab from '../components/IssueDescriptionTab.vue'
import IssueDetailHero from '../components/IssueDetailHero.vue'
import IssueEditDialog from '../components/IssueEditDialog.vue'
import IssueEvidencePanel from '../components/IssueEvidencePanel.vue'
import IssueInsightPanel from '../components/IssueInsightPanel.vue'
import IssueStatCards from '../components/IssueStatCards.vue'
import { ISSUE_STATUS_LABELS } from '../constants'
import type { IssueDetail } from '../types'
import { buildIssueStatCards, getNextIssueStatuses } from '../utils'

const route = useRoute()
const issueId = computed(() => route.params.id as string)
const issue = ref<IssueDetail | null>(null)
const activeTab = ref('description')
const showEditDialog = ref(false)

const nextStatuses = computed(() => getNextIssueStatuses(issue.value))
const statCards = computed(() => buildIssueStatCards(issue.value))

async function loadIssue() {
  try {
    const res = await apiClient.get(`/api/issues/${issueId.value}`)
    issue.value = res.data.data
  } catch (error) {
    console.error('Failed to load issue:', error)
  }
}

async function handleStatusChange(newStatus: string) {
  const statusLabel = ISSUE_STATUS_LABELS[newStatus] || newStatus

  try {
    await ElMessageBox.confirm(
      `确定要将议题状态更改为「${statusLabel}」吗？`,
      '确认状态变更',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  try {
    await apiClient.patch(`/api/issues/${issueId.value}`, { status: newStatus })
    ElMessage.success(`状态已更改为「${statusLabel}」`)
    await loadIssue()
  } catch (err: any) {
    ElMessage.error(err.response?.data?.error?.message || '状态变更失败')
  }
}

async function handleEditSaved() {
  await loadIssue()
}

async function handleEvidenceLinked() {
  await loadIssue()
}

onMounted(loadIssue)
</script>

<style scoped lang="less">
.issue-detail-page {
  max-width: 1100px;
  margin: 0 auto;
}

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

.loading-state {
  height: 400px;
}
</style>
