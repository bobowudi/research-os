<template>
  <el-dialog
    :model-value="modelValue"
    title="创建新议题"
    width="600px"
    @close="handleClose"
    @update:model-value="emit('update:modelValue', $event)"
  >
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
            <el-option
              v-for="option in ISSUE_DOMAIN_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
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
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">创建</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ISSUE_DOMAIN_OPTIONS } from '../constants'

interface CreateIssuePayload {
  title: string
  description: string
  domain: string
  decisionDueAt: string
}

const props = defineProps<{
  modelValue: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  submit: [payload: CreateIssuePayload]
  'update:modelValue': [value: boolean]
}>()

const createFormRef = ref<FormInstance>()
const createForm = reactive({
  title: '',
  description: '',
  domain: '',
  decisionDueAt: null as Date | null,
})

const createRules = reactive<FormRules>({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  domain: [{ required: true, message: '请选择领域', trigger: 'change' }],
  decisionDueAt: [{ required: true, message: '请选择截止日期', trigger: 'change' }],
})

function resetForm() {
  createForm.title = ''
  createForm.description = ''
  createForm.domain = ''
  createForm.decisionDueAt = null
  createFormRef.value?.resetFields()
}

function handleClose() {
  emit('update:modelValue', false)
  resetForm()
}

function handleSubmit() {
  if (!createFormRef.value) return

  createFormRef.value.validate((valid) => {
    if (!valid || !createForm.decisionDueAt) return

    emit('submit', {
      title: createForm.title,
      description: createForm.description,
      domain: createForm.domain,
      decisionDueAt: createForm.decisionDueAt.toISOString(),
    })
  })
}
</script>

<style scoped lang="less">
.dialog-desc {
  color: @text-secondary;
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row-item {
  flex: 1;
}
</style>
