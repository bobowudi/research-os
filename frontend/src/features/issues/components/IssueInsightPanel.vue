<template>
  <div class="insight-panel">
    <div class="panel-header">
      <h3 class="panel-title">AI 洞察</h3>
      <el-tag effect="plain" size="small">{{ insights.length }} 条洞察</el-tag>
    </div>

    <div v-loading="loading" class="insight-list">
      <template v-if="insights.length > 0">
        <div v-for="item in insights" :key="item.id" class="insight-card" :class="item.type">
          <div class="insight-top">
            <div class="insight-tags">
              <el-tag size="small" :type="getTypeTagType(item.type)" effect="dark" round>
                {{ formatType(item.type) }}
              </el-tag>
              <el-tag v-if="item.direction" size="small" effect="plain" round>
                {{ formatDirection(item.direction) }}
              </el-tag>
              <el-tag
                v-if="item.status && item.status !== 'active'"
                size="small"
                :type="item.status === 'confirmed' ? 'success' : 'danger'"
                effect="dark"
                round
              >
                {{ item.status === 'confirmed' ? '已确认' : '已质疑' }}
              </el-tag>
            </div>
          </div>

          <h4 class="insight-title">{{ item.title }}</h4>
          <p v-if="item.description" class="insight-desc">{{ item.description }}</p>

          <div class="confidence-row" v-if="item.confidence != null">
            <span class="confidence-label">置信度</span>
            <el-progress
              :percentage="Math.round(item.confidence * 100)"
              :color="getConfidenceColor(item.confidence)"
              :stroke-width="6"
              style="flex: 1"
            />
          </div>

          <div v-if="item.score != null" class="score-row">
            <span class="score-label">评分</span>
            <span class="score-value">{{ item.score.toFixed(1) }}</span>
          </div>

          <div class="insight-actions" v-if="item.status === 'active' || !item.status">
            <el-button size="small" type="success" plain :icon="Check" @click="handleConfirm(item)">
              确认
            </el-button>
            <el-button size="small" type="danger" plain :icon="Close" @click="openDispute(item)">
              质疑
            </el-button>
          </div>
        </div>
      </template>
      <el-empty v-else description="暂无洞察数据" :image-size="80">
        <p class="empty-hint">当议题积累足够证据后，AI 将自动生成洞察分析。</p>
      </el-empty>
    </div>

    <!-- Dispute Dialog -->
    <el-dialog
      v-model="showDisputeDialog"
      title="质疑洞察"
      width="480px"
      destroy-on-close
    >
      <p class="dialog-desc">请输入质疑原因，帮助改进分析质量。</p>
      <el-input
        v-model="disputeReason"
        type="textarea"
        :rows="3"
        placeholder="输入质疑原因..."
      />
      <template #footer>
        <el-button @click="showDisputeDialog = false">取消</el-button>
        <el-button type="danger" :loading="disputing" @click="handleDispute">提交质疑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { apiClient } from '@/shared/api/client'

const props = defineProps<{
  issueId: string
}>()

const loading = ref(false)
const insights = ref<any[]>([])

const showDisputeDialog = ref(false)
const disputeReason = ref('')
const disputing = ref(false)
const disputeTarget = ref<any>(null)

async function loadInsights() {
  loading.value = true
  try {
    const res = await apiClient.get('/api/insights', {
      params: { issueId: props.issueId }
    })
    insights.value = res.data.data?.items || res.data.data || []
  } catch {
    insights.value = []
  } finally {
    loading.value = false
  }
}

async function handleConfirm(item: any) {
  try {
    await apiClient.patch(`/api/insights/${item.id}`, { status: 'confirmed' })
    ElMessage.success('洞察已确认')
    item.status = 'confirmed'
  } catch (err: any) {
    ElMessage.error(err.response?.data?.error?.message || '操作失败')
  }
}

function openDispute(item: any) {
  disputeTarget.value = item
  disputeReason.value = ''
  showDisputeDialog.value = true
}

async function handleDispute() {
  if (!disputeTarget.value) return
  disputing.value = true
  try {
    await apiClient.patch(`/api/insights/${disputeTarget.value.id}`, {
      status: 'disputed',
      disputeReason: disputeReason.value
    })
    ElMessage.success('已提交质疑')
    disputeTarget.value.status = 'disputed'
    showDisputeDialog.value = false
  } catch (err: any) {
    ElMessage.error(err.response?.data?.error?.message || '操作失败')
  } finally {
    disputing.value = false
  }
}

function getTypeTagType(type: string) {
  const map: Record<string, string> = {
    finding: '', risk: 'danger', opportunity: 'success', contradiction: 'warning'
  }
  return map[type] || ''
}

function formatType(type: string) {
  const map: Record<string, string> = {
    finding: '发现', risk: '风险', opportunity: '机会', contradiction: '矛盾'
  }
  return map[type] || type
}

function formatDirection(dir: string) {
  const map: Record<string, string> = {
    positive: '正向', negative: '负向', neutral: '中性', mixed: '混合'
  }
  return map[dir] || dir
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.8) return '#10b981'
  if (confidence >= 0.5) return '#f59e0b'
  return '#ef4444'
}

onMounted(loadInsights)
</script>

<style scoped lang="less">
.insight-panel {
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

.insight-list {
  min-height: 120px;
}

.insight-card {
  padding: 20px;
  background: @surface-color;
  border: 1px solid @border-color;
  border-radius: @radius-lg;
  margin-bottom: 16px;
  transition: @transition-base;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
  }

  &.finding::before { background: @primary-color; }
  &.risk::before { background: @danger-color; }
  &.opportunity::before { background: @success-color; }
  &.contradiction::before { background: @warning-color; }

  &:hover {
    border-color: @border-hover;
    box-shadow: @shadow-sm;
  }

  .insight-top {
    margin-bottom: 10px;

    .insight-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
  }

  .insight-title {
    font-size: 15px;
    font-weight: 700;
    color: @text-primary;
    margin-bottom: 6px;
    line-height: 1.4;
  }

  .insight-desc {
    font-size: 13px;
    color: @text-secondary;
    line-height: 1.6;
    margin-bottom: 14px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .confidence-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;

    .confidence-label {
      font-size: 12px;
      color: @text-tertiary;
      font-weight: 600;
      white-space: nowrap;
    }
  }

  .score-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .score-label {
      font-size: 12px;
      color: @text-tertiary;
      font-weight: 600;
    }

    .score-value {
      font-size: 18px;
      font-weight: 800;
      color: @primary-color;
    }
  }

  .insight-actions {
    display: flex;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid @border-color;
  }
}

.empty-hint {
  font-size: 13px;
  color: @text-tertiary;
  margin-top: 8px;
}

.dialog-desc {
  color: @text-secondary;
  margin-bottom: 16px;
}
</style>
