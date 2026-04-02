<template>
  <div class="decision-panel">
    <div class="panel-header">
      <h3 class="panel-title">决策卡</h3>
      <el-tag effect="plain" size="small">{{ decisions.length }} 张决策卡</el-tag>
    </div>

    <div v-loading="loading" class="decision-list">
      <template v-if="decisions.length > 0">
        <div v-for="item in decisions" :key="item.id" class="decision-card">
          <div class="decision-top">
            <el-tag
              size="small"
              :type="item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'"
              effect="dark"
              round
            >
              {{ formatDecisionStatus(item.status) }}
            </el-tag>
            <span v-if="item.confidence != null" class="confidence-badge">
              置信度 {{ (item.confidence * 100).toFixed(0) }}%
            </span>
          </div>

          <h4 class="decision-title">{{ item.recommendation || item.title || '决策建议' }}</h4>

          <!-- Key Factors -->
          <div v-if="item.keyFactors && item.keyFactors.length" class="factors-section">
            <h5 class="sub-title">关键因素</h5>
            <ul class="factors-list">
              <li v-for="(factor, idx) in item.keyFactors" :key="idx">{{ factor }}</li>
            </ul>
          </div>

          <!-- Risks -->
          <div v-if="item.risks && item.risks.length" class="risks-section">
            <h5 class="sub-title">风险提示</h5>
            <ul class="risks-list">
              <li v-for="(risk, idx) in item.risks" :key="idx">{{ risk }}</li>
            </ul>
          </div>

          <!-- Dissent -->
          <div v-if="item.dissent" class="dissent-section">
            <h5 class="sub-title">异议观点</h5>
            <p class="dissent-text">{{ item.dissent }}</p>
          </div>

          <!-- Existing Votes -->
          <div v-if="item.votes && item.votes.length" class="votes-section">
            <h5 class="sub-title">投票记录</h5>
            <div class="vote-summary">
              <span class="vote-count approve">
                <el-icon><Check /></el-icon>
                {{ countVotes(item.votes, 'approve') }}
              </span>
              <span class="vote-count reject">
                <el-icon><Close /></el-icon>
                {{ countVotes(item.votes, 'reject') }}
              </span>
              <span class="vote-count abstain">
                <el-icon><Minus /></el-icon>
                {{ countVotes(item.votes, 'abstain') }}
              </span>
            </div>
            <div class="vote-list">
              <div v-for="vote in item.votes" :key="vote.id || vote.userId" class="vote-item">
                <el-tag
                  size="small"
                  :type="vote.vote === 'approve' ? 'success' : vote.vote === 'reject' ? 'danger' : 'info'"
                  effect="plain"
                >
                  {{ formatVote(vote.vote) }}
                </el-tag>
                <span class="vote-user">{{ vote.user?.username || '匿名' }}</span>
                <span v-if="vote.comment" class="vote-comment">"{{ vote.comment }}"</span>
              </div>
            </div>
          </div>

          <!-- Vote Actions -->
          <div class="vote-actions" v-if="!hasUserVoted(item)">
            <div class="vote-comment-row">
              <el-input
                v-model="voteComments[item.id]"
                placeholder="投票评论（可选）"
                size="small"
              />
            </div>
            <div class="vote-buttons">
              <el-button type="success" size="small" :icon="Check" :loading="votingId === item.id" @click="handleVote(item, 'approve')">
                赞成
              </el-button>
              <el-button type="danger" size="small" :icon="Close" :loading="votingId === item.id" @click="handleVote(item, 'reject')">
                反对
              </el-button>
              <el-button type="info" size="small" :icon="Minus" :loading="votingId === item.id" @click="handleVote(item, 'abstain')">
                弃权
              </el-button>
            </div>
          </div>
          <div v-else class="voted-hint">
            <el-icon><CircleCheck /></el-icon>
            <span>你已投票</span>
          </div>
        </div>
      </template>
      <el-empty v-else description="暂无决策卡" :image-size="80">
        <p class="empty-hint">当议题进入"待决策"状态后，AI 将生成决策建议。</p>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Check, Close, Minus, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { apiClient } from '@/shared/api/client'

const props = defineProps<{
  issueId: string
}>()

const loading = ref(false)
const decisions = ref<any[]>([])
const voteComments = reactive<Record<string, string>>({})
const votingId = ref('')

async function loadDecisions() {
  loading.value = true
  try {
    const res = await apiClient.get('/api/decisions', {
      params: { issueId: props.issueId }
    })
    const list = res.data.data?.items || res.data.data || []

    // Load full details (with votes) for each decision
    const detailed = await Promise.all(
      list.map(async (d: any) => {
        try {
          const detail = await apiClient.get(`/api/decisions/${d.id}`)
          return detail.data.data || d
        } catch {
          return d
        }
      })
    )
    decisions.value = detailed
  } catch {
    decisions.value = []
  } finally {
    loading.value = false
  }
}

async function handleVote(decision: any, vote: 'approve' | 'reject' | 'abstain') {
  votingId.value = decision.id
  try {
    const payload: any = { vote }
    if (voteComments[decision.id]) {
      payload.comment = voteComments[decision.id]
    }
    await apiClient.post(`/api/decisions/${decision.id}/vote`, payload)
    ElMessage.success('投票成功')
    // Reload to get updated votes
    const detail = await apiClient.get(`/api/decisions/${decision.id}`)
    const idx = decisions.value.findIndex(d => d.id === decision.id)
    if (idx >= 0) {
      decisions.value[idx] = detail.data.data || decisions.value[idx]
    }
    delete voteComments[decision.id]
  } catch (err: any) {
    ElMessage.error(err.response?.data?.error?.message || '投票失败')
  } finally {
    votingId.value = ''
  }
}

function hasUserVoted(decision: any): boolean {
  // Simple heuristic: check if the current user has voted
  // In a real implementation, compare with current user ID from auth store
  return decision._userVoted === true
}

function countVotes(votes: any[], type: string): number {
  return votes.filter((v: any) => v.vote === type).length
}

function formatVote(vote: string) {
  const map: Record<string, string> = {
    approve: '赞成', reject: '反对', abstain: '弃权'
  }
  return map[vote] || vote
}

function formatDecisionStatus(status: string) {
  const map: Record<string, string> = {
    draft: '草稿', pending: '待投票', approved: '已通过', rejected: '已否决', closed: '已关闭'
  }
  return map[status] || status || '待投票'
}

onMounted(loadDecisions)
</script>

<style scoped lang="less">
.decision-panel {
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

.decision-list {
  min-height: 120px;
}

.decision-card {
  padding: 24px;
  background: @surface-color;
  border: 1px solid @border-color;
  border-radius: @radius-lg;
  margin-bottom: 20px;
  transition: @transition-base;

  &:hover {
    box-shadow: @shadow-md;
  }

  .decision-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .confidence-badge {
      font-size: 12px;
      font-weight: 700;
      color: @primary-color;
      background: fade(@primary-color, 10%);
      padding: 2px 10px;
      border-radius: @radius-sm;
    }
  }

  .decision-title {
    font-size: 16px;
    font-weight: 700;
    color: @text-primary;
    margin-bottom: 16px;
    line-height: 1.4;
  }

  .sub-title {
    font-size: 13px;
    font-weight: 700;
    color: @text-secondary;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .factors-section,
  .risks-section {
    margin-bottom: 16px;
  }

  .factors-list,
  .risks-list {
    padding-left: 18px;
    margin: 0;

    li {
      font-size: 13px;
      color: @text-secondary;
      line-height: 1.6;
      margin-bottom: 4px;
    }
  }

  .risks-list li {
    color: @danger-color;
  }

  .dissent-section {
    margin-bottom: 16px;
    padding: 12px 16px;
    background: fade(@warning-color, 8%);
    border-radius: @radius-md;
    border-left: 3px solid @warning-color;

    .dissent-text {
      font-size: 13px;
      color: @text-secondary;
      line-height: 1.6;
      font-style: italic;
    }
  }

  .votes-section {
    margin-bottom: 16px;
    padding-top: 12px;
    border-top: 1px solid @border-color;

    .vote-summary {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;

      .vote-count {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        font-weight: 700;

        &.approve { color: @success-color; }
        &.reject { color: @danger-color; }
        &.abstain { color: @text-tertiary; }
      }
    }

    .vote-list {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .vote-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;

        .vote-user {
          font-weight: 600;
          color: @text-primary;
        }

        .vote-comment {
          color: @text-tertiary;
          font-style: italic;
        }
      }
    }
  }

  .vote-actions {
    padding-top: 16px;
    border-top: 1px solid @border-color;

    .vote-comment-row {
      margin-bottom: 12px;
    }

    .vote-buttons {
      display: flex;
      gap: 8px;
    }
  }

  .voted-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-top: 12px;
    border-top: 1px solid @border-color;
    color: @success-color;
    font-size: 13px;
    font-weight: 600;
  }
}

.empty-hint {
  font-size: 13px;
  color: @text-tertiary;
  margin-top: 8px;
}
</style>
