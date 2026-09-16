import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(root)

const staging = path.join(root, '.taptap-h5', 'game')
const zipName = '文字农场.zip'
const zipPath = path.join(root, zipName)

execSync('npx vite build', { stdio: 'inherit', cwd: root })

rmSync(path.join(root, '.taptap-h5'), { recursive: true, force: true })
mkdirSync(staging, { recursive: true })
cpSync(path.join(root, 'dist'), staging, { recursive: true })
if (existsSync(zipPath)) rmSync(zipPath)

execSync(`zip -r ${JSON.stringify(zipPath)} game -x "*.DS_Store"`, {
  stdio: 'inherit',
  cwd: path.join(root, '.taptap-h5'),
})

rmSync(path.join(root, '.taptap-h5'), { recursive: true, force: true })
console.log(`\n已生成 ${zipPath}`)
