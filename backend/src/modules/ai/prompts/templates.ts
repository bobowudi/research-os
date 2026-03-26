// ==================== AI 提示词模板 ====================

/** 立场分析提示词 */
export const STANCE_ANALYSIS_PROMPT = `你是一个专业的研究分析助手。你需要分析一条证据与一个议题之间的关系。

## 议题
标题: {{issueTitle}}
描述: {{issueDescription}}

## 证据
来源: {{sourceLabel}} ({{sourceType}})
内容: {{evidenceContent}}

## 任务
请分析这条证据对该议题的立场倾向，返回 JSON 格式：

{
  "stance": "pro" | "con" | "neutral",
  "confidence": 0.0-1.0,
  "reason": "简要说明判断依据（100字以内）",
  "relevanceScore": 0.0-1.0
}

仅返回 JSON，不要其他内容。`

/** 洞察生成提示词（内部视角） */
export const INTERNAL_ANALYSIS_PROMPT = `你是一个组织内部视角的研究分析师。你倾向于从组织内部利益角度解读证据。

## 议题
{{issueTitle}}: {{issueDescription}}

## 证据摘要
{{evidenceSummaries}}

请从内部视角生成 3-5 个关键洞察，返回 JSON 数组：

[
  {
    "title": "洞察标题",
    "description": "详细描述",
    "type": "finding" | "risk" | "opportunity" | "contradiction",
    "direction": "pro" | "con" | "neutral",
    "confidence": 0.0-1.0,
    "supportingEvidenceIndices": [0, 1]
  }
]`

/** 洞察生成提示词（外部视角） */
export const EXTERNAL_ANALYSIS_PROMPT = `你是一个独立的外部观察者和批判性分析师。你从市场、竞争对手和行业趋势角度客观分析。

## 议题
{{issueTitle}}: {{issueDescription}}

## 证据摘要
{{evidenceSummaries}}

请从外部视角生成 3-5 个关键洞察，特别关注可能的盲点和风险，返回 JSON 数组：

[
  {
    "title": "洞察标题",
    "description": "详细描述",
    "type": "finding" | "risk" | "opportunity" | "contradiction",
    "direction": "pro" | "con" | "neutral",
    "confidence": 0.0-1.0,
    "supportingEvidenceIndices": [0, 1]
  }
]`

/** 决策综合提示词 */
export const SYNTHESIS_PROMPT = `你是一个高级决策分析师。基于内部和外部两个视角的分析，生成最终的决策建议。

## 议题
{{issueTitle}}: {{issueDescription}}

## 内部视角分析
{{internalInsights}}

## 外部视角分析
{{externalInsights}}

## 证据统计
正面: {{proCount}} | 反面: {{conCount}} | 中立: {{neutralCount}}

请综合生成决策建议，返回 JSON：

{
  "recommendation": "核心建议（200字以内）",
  "confidence": 0.0-1.0,
  "keyFactors": ["关键因素1", "关键因素2"],
  "risks": [
    { "description": "风险描述", "severity": "low|medium|high|critical", "likelihood": 0.0-1.0 }
  ],
  "dissent": "反对意见摘要",
  "suggestedActions": ["建议行动1", "建议行动2"]
}`

/** 填充模板变量 */
export function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}
