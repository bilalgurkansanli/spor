// Zamanlanmış hatırlatmayı Web Push ile gönderir (GitHub Actions'tan çalışır).
// İstanbul GMT+3 (yaz saati yok): 06:00 = 03:00 UTC, 21:00 = 18:00 UTC.
// Gönderim hataları işi başarısız saymaz (GitHub her başarısızlıkta mail atar);
// bunun yerine herkese açık okunabilen bir uyarı notu (annotation) yazılır.
import webpush from 'web-push'

const VAPID_PUBLIC_KEY = 'BBAleKxwusZY5Df95go7hGGPlEFP4jvqIHnSwnXU3jItzWrm_TYXCaQCG8w0n5X5hLuvo8vTGMuoRqUbZKy7J1Q'
const MAX_LATE_MIN = 45 // bundan daha geç başlayan zamanlanmış çalışma bildirim göndermez

const MESSAGES = {
  morning: {
    utcHour: 3,
    payload: {
      title: 'Günaydın! 💧 Sabah suyu',
      body: 'Uyanınca 500 ml suyunu iç — günün ilk tiki. Hedef bugün 3.5 L.',
      tag: 'morning-water',
      actions: [{ action: 'morning-water', title: '✓ 500 ml içtim' }],
    },
  },
  night: {
    utcHour: 18,
    payload: {
      title: 'Uyku vakti yaklaşıyor 🌙',
      body: 'Ekranı kıs, 8 saat uyku için yatmaya hazırlan. Yatmadan "Bugünü Tamamladım"a basmayı unutma.',
      tag: 'night-sleep',
    },
  },
}

const note = (level, title, msg) => console.log(`::${level} title=${title}::${String(msg).replace(/\r?\n/g, ' ')}`)

const { VAPID_PRIVATE_KEY, PUSH_SUBSCRIPTION } = process.env
if (!VAPID_PRIVATE_KEY || !PUSH_SUBSCRIPTION) {
  note('warning', 'Secret eksik', 'VAPID_PRIVATE_KEY veya PUSH_SUBSCRIPTION tanımlı değil.')
  process.exit(0)
}

let subs
try {
  const parsed = JSON.parse(PUSH_SUBSCRIPTION)
  subs = Array.isArray(parsed) ? parsed : [parsed]
  if (!subs.every((s) => s?.endpoint && s?.keys?.p256dh && s?.keys?.auth)) throw new Error('endpoint/keys alanları eksik')
} catch (e) {
  note('warning', 'Abonelik kodu okunamadı', `PUSH_SUBSCRIPTION geçerli değil: ${e.message}`)
  process.exit(0)
}

try {
  webpush.setVapidDetails('https://bilalgurkansanli.github.io/spor/', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
} catch (e) {
  note('warning', 'VAPID anahtarı hatalı', e.message)
  process.exit(0)
}

let kind = process.env.KIND
if (kind === 'check') {
  // Göndermeden doğrula: şifreli istek oluşturulabiliyorsa anahtarlar ve kod uyumlu
  for (const sub of subs) webpush.generateRequestDetails(sub, '{}')
  note('notice', 'Kontrol tamam', `Secret'lar geçerli. Push servisi: ${new URL(subs[0].endpoint).host}`)
  process.exit(0)
}
if (!kind || kind === 'auto') kind = new Date().getUTCHours() < 12 ? 'morning' : 'night'
const msg = MESSAGES[kind]
if (!msg) throw new Error(`Bilinmeyen hatırlatma: ${kind}`)

if (process.env.WAIT === 'true') {
  const target = new Date()
  target.setUTCHours(msg.utcHour, 0, 0, 0)
  const diff = target.getTime() - Date.now()
  if (diff > 0 && diff < 60 * 60 * 1000) {
    console.log(`${Math.round(diff / 1000)} sn bekleniyor (${target.toISOString()})`)
    await new Promise((r) => setTimeout(r, diff))
  } else if (-diff > MAX_LATE_MIN * 60 * 1000) {
    note('warning', 'Geç kaldı', `GitHub bu işi ${Math.round(-diff / 60000)} dk geç başlattı; ${kind} bildirimi gönderilmedi.`)
    process.exit(0)
  }
}

for (const sub of subs) {
  try {
    const res = await webpush.sendNotification(sub, JSON.stringify(msg.payload), { TTL: 3600, urgency: 'high' })
    note('notice', 'Gönderildi', `${kind} bildirimi gönderildi (${res.statusCode}).`)
  } catch (e) {
    const hint = e.statusCode === 404 || e.statusCode === 410
      ? ' Abonelik geçersiz: uygulamada Bildirimleri yeniden aç ve yeni kodu PUSH_SUBSCRIPTION olarak kaydet.'
      : e.statusCode === 403 ? ' Anahtar uyuşmazlığı: VAPID_PRIVATE_KEY secret değerini kontrol et.' : ''
    note('warning', 'Gönderilemedi', `${e.statusCode ?? ''} ${String(e.body ?? e.message).trim().replace(/.$/, '')}.${hint}`)
  }
}
