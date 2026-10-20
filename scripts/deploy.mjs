// Şifrelenmiş dist/ klasörünü gh-pages dalına yayınlar.
// Yalnızca şifrelenmiş paket yayınlanır; düz JS içeren bir build gönderilmez.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const assets = readdirSync('dist/assets')
if (assets.some((f) => f.endsWith('.js')) || !readdirSync('dist').some((f) => f.endsWith('.bin'))) {
  console.error('dist şifrelenmemiş görünüyor — önce "npm run build:secure" çalıştır.')
  process.exit(1)
}

const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim()
const name = execFileSync('git', ['config', 'user.name'], { encoding: 'utf8' }).trim()
const email = execFileSync('git', ['config', 'user.email'], { encoding: 'utf8' }).trim()

const dir = mkdtempSync(join(tmpdir(), 'recomp-pages-'))
cpSync('dist', dir, { recursive: true })
writeFileSync(join(dir, '.nojekyll'), '')
const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'inherit' })
git('init', '-q', '-b', 'gh-pages')
git('config', 'user.name', name)
git('config', 'user.email', email)
git('add', '-A')
git('commit', '-q', '-m', 'Deploy (şifreli paket)')
git('push', '-q', '-f', remote, 'gh-pages')
rmSync(dir, { recursive: true, force: true })
console.log('Yayınlandı → https://bilalgurkansanli.github.io/spor/')
