# Recomp — Body Recomposition & Fitness Tracker

Kişisel diyetisyen & antrenör web uygulaması: kalori tampon sistemi, makro/şeker takibi, su & uyku, okul günü menüleri, 12 hareketlik full body antrenman modu (dinlenme sayacı, plank kronometresi, 3×10 dk kardiyo), kilo + mezura analizi ve geçmiş günlükler.

**Teknoloji:** React + Vite + TypeScript · Tailwind CSS · Framer Motion · Recharts · Lucide

Tüm veriler yalnızca tarayıcıda (LocalStorage + IndexedDB) saklanır; JSON olarak yedeklenip geri yüklenebilir.

## Geliştirme

```bash
npm install
npm run dev
```

## Yayınlama

Canlı sitede uygulama kodu şifreyle AES-256-GCM olarak şifrelenir; doğru şifre girilmeden çözülemez ve çalışmaz. Şifre depoda tutulmaz, yayın sırasında ortam değişkeniyle verilir:

```bash
APP_PASSWORD="..." npm run deploy
```

Egzersiz görselleri: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense).

> Bu uygulama tıbbi tavsiye yerine geçmez.
