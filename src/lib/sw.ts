// Service worker kaydı: uygulamanın ana ekrana yüklenebilmesi için.
// Bildirimler kaldırıldı; eski bir bildirim aboneliği kaldıysa iptal edilir.
export async function registerSW() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return
  try {
    const reg = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
    const sub = await reg.pushManager?.getSubscription()
    await sub?.unsubscribe()
  } catch { /* yoksay */ }
}
