// Derlenmiş uygulama paketini şifreyle AES-256-GCM olarak şifreler ve
// dist/index.html'i yalnızca şifre soran bir yükleyiciye dönüştürür.
// Kullanım: APP_PASSWORD=... node scripts/encrypt.mjs
import { webcrypto as crypto } from 'node:crypto'
import { readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ITERATIONS = 310000
const dist = 'dist'
const password = process.env.APP_PASSWORD
if (!password) {
  console.error('APP_PASSWORD ortam değişkeni gerekli.')
  process.exit(1)
}

const htmlPath = join(dist, 'index.html')
let html = readFileSync(htmlPath, 'utf8')
const tag = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/)
if (!tag) throw new Error('index.html içinde modül script etiketi bulunamadı')
const jsFile = join(dist, 'assets', tag[1].split('/assets/')[1])
const jsFiles = readdirSync(join(dist, 'assets')).filter((f) => f.endsWith('.js'))
if (jsFiles.length !== 1) throw new Error(`Tek bir JS paketi bekleniyordu, bulunan: ${jsFiles.join(', ')}`)

const salt = crypto.getRandomValues(new Uint8Array(16))
const iv = crypto.getRandomValues(new Uint8Array(12))
const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password.normalize('NFC')), 'PBKDF2', false, ['deriveKey'])
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt'])
const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, readFileSync(jsFile)))

const encName = `app-${Buffer.from(crypto.getRandomValues(new Uint8Array(6))).toString('hex')}.bin`
writeFileSync(join(dist, encName), cipher)
rmSync(jsFile)

const b64 = (u) => Buffer.from(u).toString('base64')
const loader = `
<style>
#lock{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,system-ui,sans-serif;color:#E5E7EB;z-index:99}
#lock form{width:100%;max-width:360px;padding:28px 24px;border-radius:20px;border:1px solid rgba(255,255,255,.06);background:linear-gradient(180deg,rgba(17,24,39,.95),rgba(15,22,35,.95));box-shadow:0 20px 40px -24px rgba(0,0,0,.6)}
#lock .logo{width:56px;height:56px;margin:0 auto 16px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#10B981,#0D9488);box-shadow:0 0 30px -4px #10B981}
#lock h1{margin:0;text-align:center;font-size:20px;font-weight:700}
#lock p{margin:4px 0 22px;text-align:center;font-size:14px;color:#94A3B8}
#lock label.t{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#94A3B8;font-weight:600;margin-bottom:6px}
#lock input[type=password]{width:100%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 14px;color:#F3F4F6;font-size:16px;outline:none}
#lock input[type=password]:focus{border-color:rgba(16,185,129,.6);box-shadow:0 0 0 3px rgba(16,185,129,.15)}
#lock .err{color:#EF4444;font-size:12px;font-weight:500;margin-top:8px;min-height:16px}
#lock .rem{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:14px;color:#CBD5E1;cursor:pointer}
#lock .rem input{width:16px;height:16px;accent-color:#10B981}
#lock button{margin-top:20px;width:100%;padding:13px;border:0;border-radius:14px;background:#10B981;color:#04120C;font-weight:700;font-size:15px;cursor:pointer}
#lock button:disabled{opacity:.6;cursor:wait}
#lock.shake form{animation:sh .4s}
@keyframes sh{20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}
</style>
<div id="lock" hidden>
  <form autocomplete="on">
    <div class="logo"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#090D16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></div>
    <h1>Recomp</h1>
    <p>Devam etmek için şifreni gir.</p>
    <input type="text" name="username" value="recomp" autocomplete="username" hidden>
    <label class="t" for="pw">Şifre</label>
    <input id="pw" type="password" autocomplete="current-password" required>
    <div class="err" id="err"></div>
    <label class="rem"><input id="rem" type="checkbox" checked> Bu cihazda beni hatırla</label>
    <button id="go" type="submit">Giriş Yap</button>
  </form>
</div>
<script>
(() => {
  const SALT = '${b64(salt)}', IV = '${b64(iv)}', IT = ${ITERATIONS}, SRC = '/spor/${encName}', K = 'recomp-key'
  const ub = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
  const bu = (b) => btoa(String.fromCharCode(...new Uint8Array(b)))
  const enc = fetch(SRC).then((r) => { if (!r.ok) throw new Error('yüklenemedi'); return r.arrayBuffer() })
  async function decrypt(raw) {
    const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt'])
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub(IV) }, key, await enc)
  }
  function start(js) {
    document.getElementById('lock').remove()
    return import(URL.createObjectURL(new Blob([js], { type: 'text/javascript' })))
  }
  const run = (raw) => decrypt(raw).then(start)
  async function derive(pw) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw.normalize('NFC')), 'PBKDF2', false, ['deriveBits'])
    return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: ub(SALT), iterations: IT }, base, 256)
  }
  const lock = document.getElementById('lock'), form = lock.querySelector('form'), pw = document.getElementById('pw'), err = document.getElementById('err'), go = document.getElementById('go')
  function show() { lock.hidden = false; pw.focus() }
  let saved = null
  try { saved = localStorage.getItem(K) || sessionStorage.getItem(K) } catch {}
  if (saved) run(ub(saved)).catch(() => { try { localStorage.removeItem(K); sessionStorage.removeItem(K) } catch {}; show() })
  else show()
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!pw.value) return
    go.disabled = true; go.textContent = 'Kontrol ediliyor…'; err.textContent = ''
    const remember = document.getElementById('rem').checked
    let js
    try {
      const raw = await derive(pw.value)
      js = await decrypt(raw)
      try { (remember ? localStorage : sessionStorage).setItem(K, bu(raw)) } catch {}
    } catch {
      err.textContent = 'Şifre yanlış, tekrar dene.'
      pw.value = ''; lock.classList.remove('shake'); void lock.offsetWidth; lock.classList.add('shake')
      go.disabled = false; go.textContent = 'Giriş Yap'; pw.focus()
      return
    }
    start(js)
  })
})()
</script>`

html = html.replace(tag[0], '').replace('</body>', `${loader}\n</body>`)
html = html.replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <meta name="robots" content="noindex, nofollow" />\n    <meta name="referrer" content="no-referrer" />')
writeFileSync(htmlPath, html)
writeFileSync(join(dist, '404.html'), html)
console.log(`Şifrelendi: ${jsFile} → ${encName} (${cipher.length} bayt)`)
