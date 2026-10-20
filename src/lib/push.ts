// Bildirim aboneliği: service worker kaydı + Web Push aboneliği.
// Hatırlatmalar GitHub Actions zamanlayıcısından (06:00 / 21:00 İstanbul) gönderilir.
export const VAPID_PUBLIC_KEY = 'BBAleKxwusZY5Df95go7hGGPlEFP4jvqIHnSwnXU3jItzWrm_TYXCaQCG8w0n5X5hLuvo8vTGMuoRqUbZKy7J1Q'
const SW_URL = `${import.meta.env.BASE_URL}sw.js`

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export async function registerSW() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return null
  try { return await navigator.serviceWorker.register(SW_URL, { scope: import.meta.env.BASE_URL }) } catch { return null }
}

const urlB64 = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export async function currentSubscription() {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)
  return (await reg?.pushManager.getSubscription()) ?? null
}

/** İzin ister ve aboneliği döndürür (GitHub'a kaydedilecek JSON) */
export async function subscribe() {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error(perm === 'denied' ? 'Bildirim izni reddedildi. Chrome site ayarlarından izin vermelisin.' : 'Bildirim izni verilmedi.')
  const reg = (await registerSW()) ?? (await navigator.serviceWorker.ready)
  await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(VAPID_PUBLIC_KEY) })
}

export async function testNotification() {
  const reg = await navigator.serviceWorker.ready
  await reg.showNotification('Recomp · Test 🔔', {
    body: 'Bildirimler çalışıyor! Sabah 06:00 su, akşam 21:00 uyku hatırlatması gelecek.',
    icon: `${import.meta.env.BASE_URL}icons/icon-192.png`,
    badge: `${import.meta.env.BASE_URL}icons/badge-96.png`,
    tag: 'recomp-test',
  })
}
