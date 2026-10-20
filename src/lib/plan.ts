// Programın sabit kuralları — SPECIFICATION.md ile birebir.

export const TARGETS = {
  kcal: 2000,
  kcalBuffer: 2200,
  kcalLow: 1800,
  kcalHigh: 2250,
  protein: [165, 180] as const,
  carbs: [180, 210] as const,
  fat: [60, 70] as const,
  sugarMax: 20,
  waterMl: 3500,
  waterRange: [3300, 3700] as const,
  sleepH: 8,
}

export type Muscle =
  | 'quads' | 'hamstrings' | 'glutes' | 'chest' | 'lats' | 'midback'
  | 'delts' | 'triceps' | 'biceps' | 'abs' | 'lowerabs' | 'core' | 'cardio'

export type Motion = 'press' | 'curl' | 'pull' | 'fly' | 'raise' | 'push' | 'legraise' | 'crunch' | 'hold'

export interface Exercise {
  id: string
  name: string
  target: string
  sets: number
  reps: string
  start: string
  startKg: number | null
  rest: number
  restLabel: string
  note: string
  dbId: string
  muscles: Muscle[]
  motion: Motion
  isPlank?: boolean
  youtube: string
}

const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' form shorts')}`

export const EXERCISES: Exercise[] = [
  {
    id: 'leg-press', name: 'Lever Horizontal Leg Press', target: 'Ön Bacak & Kalça', sets: 3, reps: '10-12',
    start: '60 kg (kademeli artır)', startKg: 60, rest: 90, restLabel: '90 sn',
    note: 'En büyük kas grubu; GH ve testosteron tepkisini başlatır. Dizleri tam kilitleme.',
    dbId: 'Leg_Press', muscles: ['quads', 'glutes'], motion: 'press', youtube: yt('horizontal leg press'),
  },
  {
    id: 'seated-leg-curl', name: 'Seated Leg Curl', target: 'Arka Bacak (Hamstring)', sets: 3, reps: '12',
    start: '40-50 kg', startKg: 40, rest: 75, restLabel: '60-90 sn',
    note: 'Lying yerine Seated seçildi: kalça bükülü olduğu için kas uzamış pozisyonda gerilir, maksimum hipertrofi sağlar ve beli korur. Menteşeyi dizle hizala, üst pedi sıkıca kilitle, negatifi 2-3 saniyede yavaşça bırak.',
    dbId: 'Seated_Leg_Curl', muscles: ['hamstrings'], motion: 'curl', youtube: yt('seated leg curl'),
  },
  {
    id: 'chest-press', name: 'Lever Chest Press', target: 'Göğüs (Ana İtiş)', sets: 3, reps: '8-12',
    start: '75-80 kg', startKg: 75, rest: 90, restLabel: '90 sn',
    note: 'Kürek kemiklerini geriye ve aşağıya kilitle, dirsekleri aşırı açmadan kontrollü it.',
    dbId: 'Leverage_Chest_Press', muscles: ['chest', 'triceps'], motion: 'push', youtube: yt('machine chest press'),
  },
  {
    id: 'lat-pulldown', name: 'Lat Pulldown', target: 'Sırt / Kanat (Dikey Çekiş)', sets: 3, reps: '10-12',
    start: '50-60 kg', startKg: 50, rest: 90, restLabel: '90 sn',
    note: 'Sırtı genişletmek ve V-üçgen formunu oluşturmak için. Göğsü kabartarak çeneye/üst göğse çek.',
    dbId: 'Wide-Grip_Lat_Pulldown', muscles: ['lats', 'biceps'], motion: 'pull', youtube: yt('lat pulldown'),
  },
  {
    id: 'pec-deck', name: 'Pec Deck Fly', target: 'Göğüs (İzolasyon)', sets: 3, reps: '12',
    start: '65-70 kg', startKg: 65, rest: 60, restLabel: '60 sn',
    note: 'Kolları birleştirirken göğüs içini 1 saniye sıkıştır, geriye açarken omuz kapsülünü zorlama.',
    dbId: 'Butterfly', muscles: ['chest'], motion: 'fly', youtube: yt('pec deck fly'),
  },
  {
    id: 'cable-row', name: 'Cable Seated Row', target: 'Orta Sırt (Yatay Çekiş)', sets: 3, reps: '10-12',
    start: '60-65 kg', startKg: 60, rest: 75, restLabel: '60-90 sn',
    note: 'Belden sallanma; ağırlığı karnına çekerken kürek kemiklerini birbirine değdirmeye odaklan.',
    dbId: 'Seated_Cable_Rows', muscles: ['midback', 'lats', 'biceps'], motion: 'pull', youtube: yt('seated cable row'),
  },
  {
    id: 'lateral-raise', name: 'Dumbbell Lateral Raise', target: 'Yan Omuz', sets: 3, reps: '12-15',
    start: '5-7.5 kg', startKg: 5, rest: 60, restLabel: '60 sn',
    note: 'Omuz genişliği için tek başına yeterlidir. Trapezleri katmadan, dirsekleri hafif kırık yana aç.',
    dbId: 'Side_Lateral_Raise', muscles: ['delts'], motion: 'raise', youtube: yt('dumbbell lateral raise'),
  },
  {
    id: 'pushdown', name: 'Cable Triceps Pushdown', target: 'Arka Kol (Triceps)', sets: 3, reps: '12',
    start: '40-45 kg', startKg: 40, rest: 60, restLabel: '60 sn',
    note: 'Dirsekleri gövde yanına sabitle, sadece ön kol hareket etsin, en altta triceps\'i tam kilitle.',
    dbId: 'Triceps_Pushdown', muscles: ['triceps'], motion: 'press', youtube: yt('cable triceps pushdown'),
  },
  {
    id: 'biceps-curl', name: 'Dumbbell Alternate Biceps Curl', target: 'Ön Kol (Biceps)', sets: 3, reps: '10-12',
    start: '10-12.5 kg', startKg: 10, rest: 60, restLabel: '60 sn',
    note: 'Gövdeyi savurma, kaldırırken avuç içini dışa çevir (supinasyon), kontrollü indir.',
    dbId: 'Dumbbell_Alternate_Bicep_Curl', muscles: ['biceps'], motion: 'curl', youtube: yt('alternate dumbbell biceps curl'),
  },
  {
    id: 'hanging-leg-raise', name: 'Hanging Straight Leg Raise (Arm Slingers)', target: 'Alt Karın & Core', sets: 3, reps: '10-12',
    start: 'Vücut ağırlığı', startKg: null, rest: 60, restLabel: '60 sn',
    note: 'Sallanmadan bacakları düz şekilde kaldırırken leğen kemiğini hafifçe yukarı kıvır.',
    dbId: 'Hanging_Leg_Raise', muscles: ['lowerabs', 'abs'], motion: 'legraise', youtube: yt('hanging straight leg raise ab straps'),
  },
  {
    id: 'decline-crunch', name: 'Decline Weighted Crunch', target: 'Üst & Orta Karın Hipertrofisi', sets: 3, reps: '12-15',
    start: '5-10 kg plaka', startKg: 5, rest: 60, restLabel: '60 sn',
    note: 'Baklavaları kalınlaştırmak için ağırlıkla yapılır. Kalçadan tam kalkma; göğüs kafesini leğen kemiğine doğru büküp tepede 1 sn sık.',
    dbId: 'Decline_Crunch', muscles: ['abs'], motion: 'crunch', youtube: yt('decline weighted crunch'),
  },
  {
    id: 'plank', name: 'Plank (Finisher)', target: 'İç Korse (Transvers Abdominis)', sets: 1, reps: 'Maks. süre',
    start: 'Vücut ağırlığı', startKg: null, rest: 0, restLabel: '—',
    note: 'Antrenman bitiricisi. Beli çukurlaştırmadan karın ve kalçayı sıkarak tükenişe kadar bekle.',
    dbId: 'Plank', muscles: ['core', 'abs'], motion: 'hold', isPlank: true, youtube: yt('plank'),
  },
]

export const CARDIO = [
  { id: 'treadmill', name: 'Yürüyüş Bandı (Incline Walk)', detail: '5.0 km/s hız · %8 eğim', tip: 'Banttan tutunmadan, dik postürle.', dbId: 'Walking_Treadmill', minutes: 10 },
  { id: 'recumbent', name: 'Yatay Bisiklet (Recumbent)', detail: 'Orta direnç · 70-80 RPM', tip: 'Sabit pedal devrini koru.', dbId: 'Recumbent_Bike', minutes: 10 },
  { id: 'elliptical', name: 'Eliptik Bisiklet', detail: 'Orta tempo · Zone 2', tip: 'Yanındakiyle konuşabileceğin nabızda ritmik bitiriş.', dbId: 'Elliptical_Trainer', minutes: 10 },
]

export const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

export interface Meal {
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  sugar: number
}

export const SCHOOL_STRATEGIES: { id: string; title: string; badge: string; menus: (Meal & { desc: string })[]; rule?: string }[] = [
  {
    id: 'home', title: 'Evden Götürme', badge: 'En güvenli',
    menus: [
      { desc: '200g ızgara tavuk göğsü + 150g pirinç/bulgur veya zeytinyağlı yeşil salata', name: 'Okul · Evden A (Tavuk + Bulgur)', kcal: 520, protein: 48, carbs: 50, fat: 12, sugar: 0 },
      { desc: '2 dilim tam buğday ekmeği + 150g fırın hindi füme/tavuk + 50g süzme peynir + yeşillik', name: 'Okul · Evden B (Hindi Sandviç)', kcal: 480, protein: 42, carbs: 40, fat: 15, sugar: 2 },
    ],
  },
  {
    id: 'market', title: 'Market Kurtarıcısı', badge: '2 dakikada hazır',
    menus: [
      { desc: '160g süzülmüş ton balığı + Akdeniz yeşilliği + 2-3 pirinç patlağı', name: 'Okul · Market A (Ton Balığı)', kcal: 380, protein: 36, carbs: 30, fat: 12, sugar: 0 },
      { desc: '500 ml sade kefir / yüksek proteinli süt + 150g süzme/lor peyniri + 1 yeşil elma', name: 'Okul · Market B (Kefir + Lor)', kcal: 450, protein: 38, carbs: 45, fat: 12, sugar: 0 },
    ],
  },
  {
    id: 'out', title: 'Dışarıda Izgara', badge: 'Restoran',
    menus: [
      { desc: '1 porsiyon ızgara tavuk şiş veya ızgara köfte + bulgur pilavı + salata', name: 'Okul · Dışarıda (Izgara + Bulgur)', kcal: 550, protein: 45, carbs: 50, fat: 18, sugar: 0 },
    ],
    rule: 'Ekmeksiz/lavaşsız, mayonez-ketçap sossuz, patates kızartması yerine bulgur/salata, salata sosu ayrı!',
  },
]

// Hızlı ekleme için tipik porsiyonlar (yaklaşık değerler)
export const QUICK_FOODS: Meal[] = [
  { name: 'Yulaf (60g) + süt', kcal: 330, protein: 15, carbs: 48, fat: 8, sugar: 0 },
  { name: '3 yumurta (haşlanmış)', kcal: 230, protein: 19, carbs: 1, fat: 16, sugar: 0 },
  { name: 'Tavuk göğsü (200g)', kcal: 330, protein: 62, carbs: 0, fat: 7, sugar: 0 },
  { name: 'Basmati pirinç (150g pişmiş)', kcal: 195, protein: 4, carbs: 42, fat: 1, sugar: 0 },
  { name: 'Bulgur pilavı (150g)', kcal: 200, protein: 6, carbs: 38, fat: 3, sugar: 0 },
  { name: 'Süzme yoğurt (200g)', kcal: 150, protein: 20, carbs: 8, fat: 4, sugar: 0 },
  { name: 'Whey protein (1 ölçek)', kcal: 120, protein: 24, carbs: 3, fat: 1.5, sugar: 0 },
  { name: 'Kırmızı et / köfte (150g)', kcal: 340, protein: 38, carbs: 2, fat: 20, sugar: 0 },
  { name: 'Haşlanmış patates (200g)', kcal: 170, protein: 4, carbs: 38, fat: 0, sugar: 0 },
  { name: 'Çiğ badem/ceviz (30g)', kcal: 180, protein: 6, carbs: 5, fat: 15, sugar: 0 },
  { name: 'Muz / yeşil elma', kcal: 100, protein: 1, carbs: 25, fat: 0, sugar: 0 },
  { name: 'Zeytinyağı (1 yk)', kcal: 120, protein: 0, carbs: 0, fat: 14, sugar: 0 },
]

// Aylık yol haritası: başlangıç–hedef farkının spec'teki oranlarla dağıtımı
// (faz payları: 3 / 2.5 / 2.25 / 2.25 / 2.5 → toplam 12.5)
const PHASES = [
  { share: 3 / 12.5, title: '1. Ay — Adaptasyon & Ödem Atımı', desc: 'Glikojen dengelenmesi ve ödemin atılması, belde ilk incelme.' },
  { share: 2.5 / 12.5, title: '2. Ay — Güç Korunur', desc: 'İdman ağırlıkları düşmez/artar, kaslar sertleşir.' },
  { share: 2.25 / 12.5, title: '3. Ay — Hatlar Keskinleşir', desc: 'Yüz hatları keskinleşir, kıyafetler bollaşır.' },
  { share: 2.25 / 12.5, title: '4. Ay — İnatçı Yağlar', desc: 'Karın bölgesindeki inatçı yağlar çekilir, omuz-göğüs üçgenleşir.' },
  { share: 2.5 / 12.5, title: '5-6. Ay — Atletik Form', desc: '%14-16 yağ oranı, belirgin kas kütlesi ve atletik form.' },
]

export function roadmap(start: number, target: number) {
  const total = start - target
  let w = start
  return PHASES.map((p, i) => {
    const from = w
    w = i === PHASES.length - 1 ? target : w - total * p.share
    return { ...p, from: round1(from), to: round1(w), endWeek: i < 4 ? (i + 1) * 4.33 : 24 }
  })
}

/** Haftalık projeksiyon: 24 haftada hedefe, faz oranlarına göre doğrusal parçalı */
export function projectionAt(start: number, target: number, week: number) {
  const rm = roadmap(start, target)
  let prevWeek = 0
  for (const p of rm) {
    if (week <= p.endWeek) {
      const t = (week - prevWeek) / (p.endWeek - prevWeek)
      return round1(p.from + (p.to - p.from) * t)
    }
    prevWeek = p.endWeek
  }
  return target
}

export const round1 = (n: number) => Math.round(n * 10) / 10

export const COACH_TIPS = [
  { title: 'Su Diyeti / OMAD neden yok?', body: 'Uzun açlıklar kas protein sentezini (MPS) durdurur; vücut enerjiyi kastan karşılamaya başlar. Recomp için proteini gün içine 35-45 g\'lık öğünlerle yay.' },
  { title: 'Upright Row neden çıkarıldı?', body: 'Dumbbell Upright Row omuzu iç rotasyonda yukarı kaldırır; supraspinatus tendonu sıkışır (impingement). Yan omuz için Lateral Raise tek başına yeterli ve güvenli.' },
  { title: 'Kardiyo neden sonda?', body: 'Ağırlık sonrası glikojen depoları azaldığı için Zone 2 kardiyoda yağ kullanımı artar; önce yapılırsa ağırlıktaki güç düşer.' },
  { title: 'Tartı yalan söyleyebilir', body: 'Kas kazanırken yağ yakıyorsan kilo sabit kalabilir. Mezurada bel küçülüyorsa doğru yoldasın.' },
  { title: 'Protein kısılmaz', body: 'Kalori kısılsa bile 165-180 g protein korunur. Kas kaybını önleyen en kritik kural budur.' },
  { title: 'Uyku = Anabolik pencere', body: 'Büyüme hormonunun büyük kısmı derin uykuda salgılanır. 8 saatin altı kortizolü ve iştahı artırır.' },
  { title: 'Şeker kotası', body: 'Paketli gıda, çikolata, gazlı içecek ve hazır soslar 20 g kotaya dahil. Taze meyve ve sade süt ürünlerindeki doğal şeker dahil değil.' },
]
