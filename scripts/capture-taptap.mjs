import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'docs', 'taptap')
const shotDir = path.join(outDir, 'screenshots')
const email = process.env.FARM_EMAIL
const password = process.env.FARM_PASSWORD
const url = process.env.FARM_URL || 'https://farm.powerct.cn/#/'

if (!email || !password) {
  console.error('缺少 FARM_EMAIL / FARM_PASSWORD')
  process.exit(1)
}

mkdirSync(shotDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
})
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  locale: 'zh-CN',
})
const page = await context.newPage()
page.setDefaultTimeout(25000)

const shot = async (name) => {
  await page.waitForTimeout(400)
  await page.screenshot({
    path: path.join(shotDir, `${name}.png`),
    fullPage: false,
  })
  console.log('saved', name)
}

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await shot('01-login')

const passwordTab = page.getByText('邮箱登录', { exact: true })
if (await passwordTab.count()) await passwordTab.click()
await page.locator('input[type="text"]').first().fill(email)
await page.locator('input[type="password"]').fill(password)
await page.getByRole('button', { name: /登录/ }).click()
await page.waitForURL(/#\/(?!login)/, { timeout: 20000 }).catch(() => {})
await page.waitForTimeout(1800)
await shot('02-notice')

const noticeBtn = page.getByRole('button', { name: '知道了' })
if (await noticeBtn.count()) {
  await noticeBtn.click()
  await page.waitForTimeout(500)
}
await shot('03-farm-field')

const clickTab = async (name) => {
  const tab = page.locator('nav.dock button', { hasText: name })
  if (await tab.count()) {
    await tab.click({ force: true })
    await page.waitForTimeout(700)
    return true
  }
  return false
}

if (await clickTab('商店')) await shot('04-shop')
if (await clickTab('仓库')) await shot('05-warehouse')
if (await clickTab('升级')) await shot('06-upgrade')
if (await clickTab('建筑')) await shot('07-world-tree')
if (await clickTab('背包')) await shot('08-backpack')

const orders = page.locator('.order-ticket')
if (await orders.count()) {
  await orders.first().click()
  await page.waitForTimeout(800)
  await shot('09-order')
  await page.keyboard.press('Escape').catch(() => {})
  const mask = page.locator('.mask')
  if (await mask.count()) await page.mouse.click(20, 20)
}

const user = page.locator('.hud-user')
if (await user.count()) {
  await user.click()
  await page.waitForTimeout(1000)
  await shot('10-settings')
}

await context.close()
await browser.close()
console.log('done', shotDir)
