<template>
  <div class="issue-list-page">
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon-wrap">
          <el-icon><List /></el-icon>
        </div>
        <div class="header-text">
          <h2 class="page-title">议题管理</h2>
          <p class="page-subtitle">管理与跟踪组织内的所有研究议题</p>
        </div>
      </div>
      <el-button type="primary" @click="showCreate = true" :icon="Plus" size="large" class="create-btn">
        新建议题
      </el-button>
    </div>

    <IssueStatusTabs v-model="filters.status" :tabs="statusTabs" @update:modelValue="loadData" />

    <div class="list-controls">
      <div class="search-bar">
        <el-input
          v-model="filters.search"
          placeholder="搜索议题标题或描述..."
          :prefix-icon="Search"
          clearable
          @input="handleSearch"
          size="large"
        />
      </div>
      <div class="filter-options">
        <el-select v-model="filters.domain" placeholder="领域" clearable @change="loadData" size="large">
          <el-option label="品牌" value="brand" />
          <el-option label="产品" value="product" />
          <el-option label="市场" value="market" />
          <el-option label="战略" value="strategy" />
          <el-option label="运营" value="operations" />
        </el-select>
        <el-select v-model="filters.priority" placeholder="优先级" clearable @change="loadData" size="large">
          <el-option label="紧急" value="urgent" />
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </div>
    </div>

    <div class="issue-list-container" v-loading="loading">
      <transition-group name="list" tag="div" v-if="items.length > 0" class="issue-list">
        <IssueCard
          v-for="item in items"
          :key="item.id"
          :issue="item"
          @click="$router.push(`/issues/${item.id}`)"
        />
      </transition-group>
      <el-empty v-else description="暂无议题" :image-size="160" />
    </div>

    <el-dialog v-model="showCreate" title="创建新议题" width="600px" @close="resetCreateForm">
      <p class="dialog-desc">定义一个新的研究议题，开始 AI 辅助的研究与决策流程。</p>
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-position="top"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="createForm.title" placeholder="输入议题标题" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="createForm.description" type="textarea" :rows="4" placeholder="描述议题背景和目标" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="领域" prop="domain" class="form-row-item">
            <el-select v-model="createForm.domain" placeholder="选择领域">
              <el-option label="品牌" value="brand" />
              <el-option label="产品" value="product" />
              <el-option label="市场" value="market" />
              <el-option label="战略" value="strategy" />
              <el-option label="运营" value="operations" />
            </el-select>
          </el-form-item>
          <el-form-item label="决策截止日期" prop="decisionDueAt" class="form-row-item">
            <el-date-picker
              v-model="createForm.decisionDueAt"
              type="datetime"
              placeholder="选择截止日期"
              format="YYYY-MM-DD HH:mm"
              style="width: 100%"
            />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search, List } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { apiClient } from '@/shared/api/client'
import IssueCard from '../components/IssueCard.vue'
import IssueStatusTabs from '../components/IssueStatusTabs.vue'

const items = ref<any[]>([])
const loading = ref(false)
const creating = ref(false)
const showCreate = ref(false)
const createFormRef = ref<FormInstance>()

const filters = reactive({
  status: 'all',
  domain: '',
  priority: '',
  search: ''
})

const createForm = reactive({
  title: '',
  description: '',
  domain: '',
  decisionDueAt: null as Date | null
})

const createRules = reactive<FormRules>({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  domain: [{ required: true, message: '请选择领域', trigger: 'change' }],
  decisionDueAt: [{ required: true, message: '请选择截止日期', trigger: 'change' }]
})

const statusTabs = [
  { label: '全部', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '收集中', value: 'collecting' },
  { label: '分析中', value: 'analyzing' },
  { label: '待决策', value: 'pending_decision' },
  { label: '已决策', value: 'decided' },
  { label: '已关闭', value: 'closed' }
]

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

let searchTimeout: any = null
function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadData(), 300)
}

function handleCreate() {
  if (!createFormRef.value) return
  createFormRef.value.validate(async (valid) => {
    if (!valid) return
    creating.value = true
    try {
      await apiClient.post('/api/issues', {
        title: createForm.title,
        description: createForm.description,
        domain: createForm.domain,
        decisionDueAt: new Date(createForm.decisionDueAt).toISOString(),
        tags: []
      })
      ElMessage.success('议题创建成功')
      showCreate.value = false
      resetCreateForm()
      loadData()
    } catch (err: any) {
      ElMessage.error(err.response?.data?.error?.message || '创建失败，请重试')
    } finally {
      creating.value = false
    }
  })
}

function resetCreateForm() {
  createForm.title = ''
  createForm.description = ''
  createForm.domain = ''
  createForm.decisionDueAt = null
  createFormRef.value?.resetFields()
}

onMounted(loadData)
</script>

<style scoped lang="less">
.issue-list-page {
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-icon-wrap {
    width: 48px;
    height: 48px;
    background: @gradient-card-1;
    border-radius: @radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: @primary-color;
  }

  .page-title {
    font-size: 26px;
    font-weight: 800;
    color: @text-primary;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
  }

  .page-subtitle {
    font-size: 14px;
    color: @text-tertiary;
  }

  .create-btn {
    height: 44px;
    padding: 0 24px;
    background: @gradient-primary;
    border: none;
    font-weight: 700;
    border-radius: @radius-md;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(99, 102, 241, 0.3);
    }
  }
}

.list-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;

  .search-bar {
    flex: 1;
    max-width: 500px;
  }

  .filter-options {
    display: flex;
    gap: 12px;

    .el-select { width: 120px; }
  }
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

.dialog-desc {
  color: @text-secondary;
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 16px;

  .form-row-item {
    flex: 1;
  }
}
</style>
