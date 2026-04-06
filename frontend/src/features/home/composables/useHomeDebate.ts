import { onBeforeUnmount, ref } from 'vue'
import type { DebateStage } from '../types'

export function useHomeDebate() {
  const stage = ref<DebateStage>('gathering')
  const isDebating = ref(false)
  const confidenceScore = ref(50)

  let intervalId: ReturnType<typeof window.setInterval> | null = null
  let timeoutId: ReturnType<typeof window.setTimeout> | null = null

  function clearTimers() {
    if (intervalId) {
      window.clearInterval(intervalId)
      intervalId = null
    }

    if (timeoutId) {
      window.clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  function startDebate() {
    if (stage.value !== 'gathering') return

    stage.value = 'debating'
    isDebating.value = true

    intervalId = window.setInterval(() => {
      confidenceScore.value = Math.min(Math.max(confidenceScore.value + (Math.random() - 0.45) * 8, 30), 85)
    }, 400)

    timeoutId = window.setTimeout(() => {
      clearTimers()
      isDebating.value = false
      stage.value = 'verdict'
      confidenceScore.value = 72
    }, 4500)
  }

  onBeforeUnmount(() => {
    clearTimers()
  })

  return {
    stage,
    isDebating,
    confidenceScore,
    startDebate,
  }
}
