// Zamanlanmış hatırlatmayı Web Push ile gönderir (GitHub Actions'tan çalışır).
// İstanbul GMT+3 (yaz saati yok): 06:00 = 03:00 UTC, 21:00 = 18:00 UTC.
// GitHub cron'u gecikebildiği için iş 15 dk erken başlar ve tam saate kadar bekler.
import webpush from 'web-push'

const VAPID_PUBLIC_KEY = 'BBAleKxwusZY5Df95go7hGGPlEFP4jvqIHnSwnXU3jItzWrm_TYXCaQCG8w0n5X5hLuvo8vTGMuoRqUbZKy7J1Q'

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

const { VAPID_PRIVATE_KEY, PUSH_SUBSCRIPTION } = process.env
if (!VAPID_PRIVATE_KEY || !PUSH_SUBSCRIPTION) {
  console.log('VAPID_PRIVATE_KEY / PUSH_SUBSCRIPTION secret tanımlı değil — atlanıyor.')
  process.exit(0)
}

// Hangi hatırlatma: elle çalıştırmada girdi, zamanlanmışta UTC saatine göre
let kind = process.env.KIND
if (!kind || kind === 'auto') kind = new Date().getUTCHours() < 12 ? 'morning' : 'night'
const msg = MESSAGES[kind]
if (!msg) throw new Error(`Bilinmeyen hatırlatma: ${kind}`)

if (process.env.WAIT !== 'false') {
  const target = new Date()
  target.setUTCHours(msg.utcHour, 0, 0, 0)
  const wait = target.getTime() - Date.now()
  if (wait > 0 && wait < 60 * 60 * 1000) {
    console.log(`${Math.round(wait / 1000)} sn bekleniyor (${target.toISOString()})`)
    await new Promise((r) => setTimeout(r, wait))
  }
}

webpush.setVapidDetails('https://bilalgurkansanli.github.io/spor/', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
const subs = JSON.parse(PUSH_SUBSCRIPTION)
for (const sub of Array.isArray(subs) ? subs : [subs]) {
  try {
    const res = await webpush.sendNotification(sub, JSON.stringify(msg.payload), { TTL: 3600, urgency: 'high' })
    console.log(`Gönderildi (${kind}): ${res.statusCode}`)
  } catch (e) {
    console.error(`Gönderilemedi: ${e.statusCode ?? ''} ${e.body ?? e.message}`)
    if (e.statusCode === 404 || e.statusCode === 410) console.error('Abonelik geçersiz — uygulamada Bildirimleri yeniden aç ve yeni kodu kaydet.')
    process.exitCode = 1
  }
}
