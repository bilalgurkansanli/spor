// Şifre kapısı, yayın sırasında scripts/encrypt.mjs tarafından üretilen yükleyici sayfadadır:
// uygulama kodu AES-GCM ile şifrelenir ve yalnızca doğru şifreyle çözülüp çalıştırılır.
// "Beni hatırla" seçilirse çözme anahtarı bu cihazda saklanır; çıkış onu siler.
export const KEY_STORAGE = 'recomp-key'

export function logout() {
  try { localStorage.removeItem(KEY_STORAGE); sessionStorage.removeItem(KEY_STORAGE) } catch { /* yoksay */ }
  location.reload()
}
