// Deterministic daily horoscope generator.
// Personalised by zodiac sign AND varied by the exact date (year+month+day), so
// the same calendar day in different months — or the same date for different
// signs — produces different, consistent readings. No network/AI call needed,
// so browsing the calendar stays instant and offline.

interface SignInfo {
  name: string;      // Turkish display name
  element: string;   // Turkish element
  intro: string;     // sign-flavoured opening line
}

const SIGN_INFO: Record<string, SignInfo> = {
  aries: { name: 'Koç', element: 'Ateş', intro: 'Koç enerjin bugün ateşli ve atılgan; önderlik etmek için yıldızlar arkanda.' },
  taurus: { name: 'Boğa', element: 'Toprak', intro: 'Boğa kararlılığın bugün seni sağlam bir zemine taşıyor; sabrın ödüllendirilecek.' },
  gemini: { name: 'İkizler', element: 'Hava', intro: 'İkizler zekân bugün pırıl pırıl; merakın yeni kapılar aralayacak.' },
  cancer: { name: 'Yengeç', element: 'Su', intro: 'Yengeç sezgilerin bugün derin ve şefkatli; kalbinin sesini dinle.' },
  leo: { name: 'Aslan', element: 'Ateş', intro: 'Aslan ışığın bugün çevreni aydınlatıyor; sahne senin, parla.' },
  virgo: { name: 'Başak', element: 'Toprak', intro: 'Başak titizliğin bugün ayrıntılarda gizli fırsatları ortaya çıkaracak.' },
  libra: { name: 'Terazi', element: 'Hava', intro: 'Terazi dengen bugün ilişkilerine uyum getiriyor; diplomasin işine yarayacak.' },
  scorpio: { name: 'Akrep', element: 'Su', intro: 'Akrep tutkun bugün dönüştürücü bir güce sahip; derinlere inmekten korkma.' },
  sagittarius: { name: 'Yay', element: 'Ateş', intro: 'Yay özgürlüğün bugün yeni ufuklara işaret ediyor; macera seni çağırıyor.' },
  capricorn: { name: 'Oğlak', element: 'Toprak', intro: 'Oğlak disiplinin bugün hedeflerine bir adım daha yaklaştırıyor; istikrarın kazanıyor.' },
  aquarius: { name: 'Kova', element: 'Hava', intro: 'Kova vizyonun bugün alışılmadık fikirlerle parlıyor; özgünlüğün fark yaratacak.' },
  pisces: { name: 'Balık', element: 'Su', intro: 'Balık hayal gücün bugün sınır tanımıyor; ilhamını yaratıcılığa dök.' },
};

const DEFAULT_INFO: SignInfo = {
  name: 'Yıldızların', element: 'Eter', intro: 'Evrenin enerjileri bugün seninle uyum içinde; içsel rehberine güven.',
};

const THEMES = [
  'Aşk hayatında beklenmedik bir yakınlaşma kapıda; kalbini açık tutmak sana iyi gelecek.',
  'Kariyerinde atacağın küçük bir adım, ileride büyük bir kapı aralayacak.',
  'Maddi konularda yapacağın sade bir plan bugün sana huzur ve güven getirecek.',
  'Bedenine kulak ver; kısa bir mola ya da yürüyüş enerjini ikiye katlayacak.',
  'Sosyal çevrende biri sana ilham verecek; dinlemekten ve paylaşmaktan çekinme.',
  'Yaratıcılığın doruğa çıkıyor; içindeki sesi somut bir projeye dönüştürme zamanı.',
  'Sezgilerin bugün her zamankinden güçlü; ilk hissine güvenmek seni doğru yöne taşıyacak.',
  'Uzun süredir ertelediğin bir meseleyi nihayet kapatmak için ideal bir gün.',
  'İletişimde açık ve net olman, olası bir yanlış anlaşılmanın önüne geçecek.',
  'Küçük bir şans dokunuşu günün akışını beklenmedik biçimde lehine çevirebilir.',
  'Bir alışkanlığını değiştirmek için evren sana tam da bugün cesaret veriyor.',
  'Doğayla geçireceğin kısa bir an zihnini berraklaştıracak ve kararlarını netleştirecek.',
  'Bugün bir öğrenme fırsatı çıkacak; merakını takip etmek ufkunu genişletecek.',
  'Geçmişte bıraktığın bir bağ yeniden canlanabilir; affetmek seni hafifletecek.',
];

const ENERGIES = ['Yüksek', 'Pozitif', 'Dengeli', 'Sakin', 'Dinamik', 'Coşkulu', 'Berrak', 'Uyumlu'];
const LUCKY_COLORS = ['Mor', 'Mavi', 'Yeşil', 'Kırmızı', 'Turuncu', 'Sarı', 'Lacivert', 'Turkuaz', 'Altın', 'Gümüş'];

const hashSeed = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export interface DailyHoroscope {
  signName: string;
  message: string;
  energy: string;
  element: string;
  luckyNumbers: string;
  luckyColor: string;
  loveScore: number;
  careerScore: number;
  healthScore: number;
}

export const getDailyHoroscope = (signRaw: string | undefined, date: Date): DailyHoroscope => {
  const sign = (signRaw || '').toLowerCase().trim();
  const info = SIGN_INFO[sign] || DEFAULT_INFO;

  // Seed from sign + full date → unique per sign per calendar date.
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const seed = hashSeed(`${sign}|${dateKey}`);

  // Two distinct themes for a richer, non-repeating message.
  const t1 = seed % THEMES.length;
  let t2 = (Math.floor(seed / 7) + 1) % THEMES.length;
  if (t2 === t1) t2 = (t2 + 1) % THEMES.length;

  const n1 = (seed % 30) + 1;
  const n2 = (Math.floor(seed / 31) % 30) + 1;
  const n3 = (Math.floor(seed / 961) % 30) + 1;

  return {
    signName: info.name,
    message: `${info.intro} ${THEMES[t1]} ${THEMES[t2]}`,
    energy: ENERGIES[seed % ENERGIES.length],
    element: info.element,
    luckyNumbers: `${n1}, ${n2}, ${n3}`,
    luckyColor: LUCKY_COLORS[Math.floor(seed / 11) % LUCKY_COLORS.length],
    loveScore: 55 + (seed % 45),
    careerScore: 50 + (Math.floor(seed / 13) % 50),
    healthScore: 55 + (Math.floor(seed / 17) % 45),
  };
};
