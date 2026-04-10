import { test, expect } from '@playwright/test'

test('login page loads', async ({ page }) => {
  await page.goto('/login')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('button', { name: '同步身份进入' })).toBeVisible()
  await expect(page.getByPlaceholder('analyst@researchos.ai')).toBeVisible()
  await expect(page.getByPlaceholder('••••••••••••')).toBeVisible()
})

test('issues page redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/issues')

  await expect(page).toHaveURL(/\/login\?redirect=\/issues$/)
  await expect(page.getByRole('button', { name: '同步身份进入' })).toBeVisible()
})

test('home page is reachable without auth', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL('http://127.0.0.1:5173/')
  await expect(page.getByText('关于 Q3 用户订阅价格调整的对抗性推理决策')).toBeVisible()
  await expect(page.getByRole('button', { name: '开始对抗推理' })).toBeVisible()
})
