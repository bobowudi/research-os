<template>
  <div class="issue-list-page">
    <IssueListHeader @create="showCreate = true" />

    <IssueStatusTabs v-model="filters.status" :tabs="ISSUE_STATUS_TABS" @update:modelValue="loadData" />

    <IssueListFilters
      :search="filters.search"
      :domain="filters.domain"
      :priority="filters.priority"
      @search="handleSearch"
      @update:search="filters.search = $event"
      @update:domain="handleDomainChange"
      @update:priority="handlePriorityChange"
    />

    <div class="issue-list-container" v-loading="loading">
      <transition-group v-if="items.length > 0" name="list" tag="div" class="issue-list">
        <IssueCard
          v-for="item in items"
          :key="item.id"
          :issue="item"
          @click="$router.push(`/issues/${item.id}`)"
        />
      </transition-group>
      <el-empty v-else description="暂无议题" :image-size="160" />
    </div>

    <IssueCreateDialog
      v-model="showCreate"
      :loading="creating"
      @submit="handleCreate"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { apiClient } from '@/shared/api/client'
import IssueCard from '../components/IssueCard.vue'
import IssueCreateDialog from '../components/IssueCreateDialog.vue'
import IssueListFilters from '../components/IssueListFilters.vue'
import IssueListHeader from '../components/IssueListHeader.vue'
import IssueStatusTabs from '../components/IssueStatusTabs.vue'
import { ISSUE_STATUS_TABS } from '../constants'
import type { IssueDetail } from '../types'

interface IssueFilters {
  status: string
  domain: string
  priority: string
  search: string
}

interface CreateIssuePayload {
  title: string
  description: string
  domain: string
  decisionDueAt: string
}

const items = ref<IssueDetail[]>([])
const loading = ref(false)
const creating = ref(false)
const showCreate = ref(false)

const filters = reactive<IssueFilters>({
  status: 'all',
  domain: '',
  priority: '',
  search: '',
})

async function loadData() {
  loading.value = true

  try {
    const params = new URLSearchParams()
    if (filters.status && filters.status !== 'all') params.set('status', filters.status)
    if (filters.domain) params.set('domain', filters.domain)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.search) params.set('q', filters.search)

    const res = await apiClient.get(`/api/issues?${params}`)
    items.value = res.data.data.items || []
  } catch (error) {
    console.error('Failed to load issues:', error)
  } finally {
    loading.value = false
  }
}

let searchTimeout: ReturnType<typeof window.setTimeout> | null = null

function handleSearch() {
  if (searchTimeout) window.clearTimeout(searchTimeout)
  searchTimeout = window.setTimeout(() => loadData(), 300)
}

function handleDomainChange(value: string) {
  filters.domain = value
  loadData()
}

function handlePriorityChange(value: string) {
  filters.priority = value
  loadData()
}

async function handleCreate(payload: CreateIssuePayload) {
  creating.value = true

  try {
    await apiClient.post('/api/issues', {
      ...payload,
      tags: [],
    })

    ElMessage.success('议题创建成功')
    showCreate.value = false
    loadData()
  } catch (err: any) {
    ElMessage.error(err.response?.data?.error?.message || '创建失败，请重试')
  } finally {
    creating.value = false
  }
}

onMounted(loadData)
</script>

<style scoped lang="less">
.issue-list-page {
  max-width: 1100px;
  margin: 0 auto;
}

.issue-list-container {
  min-height: 300px;
}

.issue-list {
  display: flex;
  flex-direction: column;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.list-leave-to {
  opacity: 0;
}
</style>
