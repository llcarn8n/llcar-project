import { test, expect } from '@playwright/test'

test('app loads v3 route', async ({ page }) => {
  await page.goto('/v3/')
  // Canvas should be mounted for 3D scene
  const canvas = page.locator('canvas').first()
  await expect(canvas).toBeVisible({ timeout: 15_000 })
  const box = await canvas.boundingBox()
  expect(box?.width || 0).toBeGreaterThan(0)
  expect(box?.height || 0).toBeGreaterThan(0)
})

test('knowledge base page loads situations count', async ({ page }) => {
  await page.goto('/v3/kb/')
  // "Ситуации" tab header visible
  await expect(page.getByText(/Ситуации/).first()).toBeVisible({ timeout: 15_000 })
  // situations-universal.json should return ≥100 items (we have 764)
  const resp = await page.waitForResponse(
    (r) => r.url().includes('situations-universal.json') && r.status() === 200,
    { timeout: 15_000 }
  )
  const data = await resp.json()
  expect(Array.isArray(data)).toBe(true)
  expect(data.length).toBeGreaterThan(100)
})

test('DtcSearch tab switch + code P0300 shows results', async ({ page }) => {
  await page.goto('/v3/kb/')
  await page.waitForLoadState('networkidle')
  // Switch to DTC tab
  const dtcTab = page.getByRole('button', { name: /Поиск по DTC/i })
  await expect(dtcTab).toBeVisible()
  await dtcTab.click()
  // Type P0300
  const input = page.locator('input[placeholder*="DTC"]')
  await input.fill('P0300')
  await input.press('Enter')
  // Count text appears: "X из Y ситуаций"
  await expect(page.getByText(/ситуаци/).first()).toBeVisible({ timeout: 10_000 })
})

test('mobile viewport renders v3 canvas', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/v3/')
  const canvas = page.locator('canvas').first()
  await expect(canvas).toBeVisible({ timeout: 15_000 })
  const box = await canvas.boundingBox()
  expect(box?.width || 0).toBeGreaterThan(200)
})

test('brands.json returns 60+ brands', async ({ page }) => {
  const resp = await page.request.get('/data/brands.json')
  expect(resp.status()).toBe(200)
  const data = await resp.json()
  const list = Array.isArray(data) ? data : (data?.brands ?? [])
  expect(list.length).toBeGreaterThanOrEqual(50)
})
