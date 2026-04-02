<template>
  <div class="evidence-panel">
    <div class="panel-header">
      <h3 class="panel-title">关联证据</h3>
      <el-button type="primary" :icon="Plus" @click="showLinkDialog = true">关联证据</el-button>
    </div>

    <div v-loading="loading" class="evidence-list">
      <template v-if="evidenceList.length > 0">
        <div v-for="item in evidenceList" :key="item.id" class="evidence-item">
          <div class="evidence-header">
            <div class="evidence-title-row">
              <el-tag size="small" :type="getSourceTagType(item.sourceType)" effect="plain">
                {{ item.sourceType || '未知' }}
              </el-tag>
              <span class="evidence-label">{{ item.sourceLabel || item.title || '未命名证据' }}</span>
            </div>
            <el-tag
              v-if="item.stance"
              size="small"
              :type="getStanceType(item.stance)"
              effect="dark"
              round
            >
              {{ formatStance(item.stance) }}
            </el-tag>
          </div>
          <p v-if="item.summary" class="evidence-summary">{{ item.summary }}</p>
          <div class="evidence-meta">
            <span v-if="item.confidence != null" class="meta-tag">
              可信度: {{ (item.confidence * 100).toFixed(0) }}%
            </span>
            <span v-if="item.sourceCategory" class="meta-tag">
              {{ item.sourceCategory }}
            </span>
            <span class="meta-time">{{ formatDate(item.createdAt) }}</span>
          </div>
        </div>
      </template>
      <el-empty v-else description="暂无关联证据" :image-size="80">
        <el-button type="primary" plain @click="showLinkDialog = true">关联第一条证据</el-button>
      </el-empty>
    </div>

    <!-- Link Evidence Dialog -->
    <el-dialog
      v-model="showLinkDialog"
      title="关联证据"
      width="700px"
      destroy-on-close
    >
      <p class="dialog-desc">从证据库中选择要关联到此议题的证据。</p>

      <div class="search-row">
        <el-input
          v-model="searchQuery"
          placeholder="搜索证据..."
          clearable
          :prefix-icon="Search"
          @input="handleSearch"
        />
        <el-select v-model="filterCategory" placeholder="来源类别" clearable @change="loadAllEvidence" style="width: 160px">
          <el-option label="学术" value="academic" />
          <el-option label="行业" value="industry" />
          <el-option label="内部" value="internal" />
          <el-option label="媒体" value="media" />
        </el-select>
      </div>

      <div v-loading="loadingAll" class="all-evidence-list">
        <template v-if="allEvidence.length > 0">
          <div
            v-for="item in allEvidence"
            :key="item.id"
            class="selectable-evidence"
            :class="{ selected: selectedIds.includes(item.id) }"
            @click="toggleSelect(item.id)"
          >
            <el-checkbox :model-value="selectedIds.includes(item.id)" @click.stop />
            <div class="evidence-info">
              <div class="evidence-title-row">
                <el-tag size="small" :type="getSourceTagType(item.sourceType)" effect="plain">
                  {{ item.sourceType || '未知' }}
                </el-tag>
                <span class="evidence-label">{{ item.sourceLabel || item.title || '未命名' }}</span>
              </div>
              <p v-if="item.summary" class="evidence-summary-sm">{{ item.summary }}</p>
            </div>
          </div>
        </template>
        <el-empty v-else description="暂无可用证据" :image-size="60" />
      </div>

      <template #footer>
        <span class="selected-count">已选择 {{ selectedIds.length }} 条</span>
        <el-button @click="showLinkDialog = false">取消</el-button>
        <el-button type="primary" :loading="linking" :disabled="selectedIds.length === 0" @click="handleLink">
          关联选中证据
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { apiClient } from '@/shared/api/client'

const props = defineProps<{
  issueId: string
}>()

const emit = defineEmits<{
  'linked': []
}>()

const loading = ref(false)
const evidenceList = ref<any[]>([])

const showLinkDialog = ref(false)
const loadingAll = ref(false)
const allEvidence = ref<any[]>([])
const selectedIds = ref<string[]>([])
const linking = ref(false)
const searchQuery = ref('')
const filterCategory = ref('')

async function loadEvidence() {
  loading.value = true
  try {
    // Try to get evidence associated with this issue
    const res = await apiClient.get(`/api/evidence`, {
      params: { issueId: props.issueId }
    })
    evidenceList.value = res.data.data?.items || res.data.data || []
  } catch {
    evidenceList.value = []
  } finally {
    loading.value = false
  }
}

async function loadAllEvidence() {
  loadingAll.value = true
  try {
    const params: any = {}
    if (filterCategory.value) params.sourceCategory = filterCategory.value
    if (searchQuery.value) params.q = searchQuery.value
    const res = await apiClient.get('/api/evidence', { params })
    allEvidence.value = res.data.data?.items || res.data.data || []
  } catch {
    allEvidence.value = []
  } finally {
    loadingAll.value = false
  }
}

let searchTimeout: any = null
function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadAllEvidence(), 300)
}

function toggleSelect(id: string) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

async function handleLink() {
  linking.value = true
  try {
    // Link each selected evidence to the issue
    const promises = selectedIds.value.map(evidenceId =>
      apiClient.post(`/api/issues/${props.issueId}/evidence`, { evidenceId })
    )
    await Promise.all(promises)
    ElMessage.success(`成功关联 ${selectedIds.value.length} 条证据`)
    selectedIds.value = []
    showLinkDialog.value = false
    loadEvidence()
    emit('linked')
  } catch (err: any) {
    ElMessage.error(err.response?.data?.error?.message || '关联失败，请重试')
  } finally {
    linking.value = false
  }
}

// Open dialog hook
import { watch } from 'vue'
watch(showLinkDialog, (val) => {
  if (val) {
    selectedIds.value = []
    loadAllEvidence()
  }
})

function getSourceTagType(type: string) {
  const map: Record<string, string> = {
    report: '', paper: 'success', survey: 'warning', interview: 'danger', article: 'info'
  }
  return map[type] || ''
}

function getStanceType(stance: string) {
  const map: Record<string, string> = {
    supporting: 'success', opposing: 'danger', neutral: 'info'
  }
  return map[stance] || 'info'
}

function formatStance(stance: string) {
  const map: Record<string, string> = {
    supporting: '支持', opposing: '反对', neutral: '中立'
  }
  return map[stance] || stance
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

onMounted(loadEvidence)
</script>

<style scoped lang="less">
.evidence-panel {
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .panel-title {
      font-size: 16px;
      font-weight: 700;
      color: @text-primary;
    }
  }
}

.evidence-list {
  min-height: 120px;
}

.evidence-item {
  padding: 16px 20px;
  background: @surface-color;
  border: 1px solid @border-color;
  border-radius: @radius-lg;
  margin-bottom: 12px;
  transition: @transition-base;

  &:hover {
    border-color: @primary-light;
    box-shadow: @shadow-sm;
  }

  .evidence-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .evidence-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .evidence-label {
    font-size: 14px;
    font-weight: 600;
    color: @text-primary;
  }

  .evidence-summary {
    font-size: 13px;
    color: @text-secondary;
    line-height: 1.5;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .evidence-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;

    .meta-tag {
      color: @text-tertiary;
      background: @background-base;
      padding: 2px 8px;
      border-radius: @radius-sm;
    }

    .meta-time {
      color: @text-tertiary;
      margin-left: auto;
    }
  }
}

.dialog-desc {
  color: @text-secondary;
  margin-bottom: 16px;
}

.search-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.all-evidence-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid @border-color;
  border-radius: @radius-lg;
  padding: 8px;
}

.selectable-evidence {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: @radius-md;
  cursor: pointer;
  transition: @transition-base;

  &:hover {
    background: @background-base;
  }

  &.selected {
    background: fade(@primary-color, 6%);
    border-color: @primary-light;
  }

  .evidence-info {
    flex: 1;
    min-width: 0;

    .evidence-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .evidence-label {
      font-size: 14px;
      font-weight: 600;
      color: @text-primary;
    }

    .evidence-summary-sm {
      font-size: 12px;
      color: @text-tertiary;
      line-height: 1.4;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}

.selected-count {
  color: @text-secondary;
  font-size: 13px;
  margin-right: auto;
}
</style>
