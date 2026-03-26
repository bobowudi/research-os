// ==================== AI / LLM 客户端 ====================

import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

export function getLLMClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    })
  }
  return client
}

/** 通用 LLM 调用 */
export async function callLLM(params: {
  system?: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  model?: string
  maxTokens?: number
  temperature?: number
}): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const llm = getLLMClient()
  const model = params.model || process.env.AI_MODEL || 'claude-sonnet-4-20250514'

  const response = await llm.messages.create({
    model,
    max_tokens: params.maxTokens || 4096,
    temperature: params.temperature ?? 0.3,
    system: params.system,
    messages: params.messages,
  })

  const textContent = response.content.find((c) => c.type === 'text')
  return {
    text: textContent?.text || '',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }
}
