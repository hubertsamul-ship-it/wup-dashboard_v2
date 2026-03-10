// ─────────────────────────────────────────────────────────────────────────────
// DANE STATYCZNE (MVP) — docelowo zastąpione przez dane z parsera MRPiPS
// Źródła: MRPiPS-01 (styczeń 2026), GUS, ZUS
// ─────────────────────────────────────────────────────────────────────────────

export const months = [
  'Sty 25','Lut 25','Mar 25','Kwi 25','Maj 25','Cze 25',
  'Lip 25','Sie 25','Wrz 25','Paź 25','Lis 25','Gru 25','Sty 26',
];

export const DS = {
  bezr:   [128000,125000,122000,119000,116000,113000,111000,113000,115000,117000,120000,120500,122600],
  stopa:  [5.2,5.0,4.9,4.7,4.5,4.3,4.2,4.3,4.4,4.5,4.6,4.5,4.5],
  polska: [5.4,5.4,5.2,5.0,4.9,4.9,4.9,4.9,5.0,5.1,5.1,5.0,5.4],
  zwol:   [180,210,290,320,410,380,290,250,310,420,480,360],
  prac:   [2280,2300,2320,2340,2360,2380,2400,2390,2395,2400,2405,2410],
  wynagr: [8200,8300,8450,8550,8700,8800,8950,9000,9100,9250,9500,9650,9842],
};

export const WOJ_DATA = [
  {n:'Warmińsko-maz.',  s:8.3},
  {n:'Podkarpackie',    s:7.8},
  {n:'Świętokrzyskie',  s:7.5},
  {n:'Lubelskie',       s:7.2},
  {n:'Kujawsko-pom.',   s:6.8},
  {n:'Zachodniopom.',   s:6.5},
  {n:'Podlaskie',       s:6.4},
  {n:'Łódzkie',         s:5.5},
  {n:'Lubuskie',        s:5.4},
  {n:'Opolskie',        s:5.2},
  {n:'Dolnośląskie',    s:4.8},
  {n:'Pomorskie',       s:4.8},
  {n:'Małopolskie',     s:4.2},
  {n:'Śląskie',         s:3.9},
  {n:'Mazowieckie',     s:4.2},
  {n:'Wielkopolskie',   s:3.2},
];

// POW_DATA, POW_POSITIONS, WOJ_POSITIONS — usunięte.
// Dane powiatów są teraz ładowane dynamicznie z public/data/mrpips_data.json
// przez DataContext (src/context/DataContext.jsx).

export const POWIAT_INFO = {
  warszawa:     {stopa:1.5,  bezr:20100, prac:1050000, ludnosc:1860000},
  radom:        {stopa:10.5, bezr:12800, prac:82000,   ludnosc:210000},
  plock:        {stopa:9.2,  bezr:8400,  prac:64000,   ludnosc:119000},
  siedlce:      {stopa:6.4,  bezr:6800,  prac:48000,   ludnosc:78000},
  ostroleka:    {stopa:8.0,  bezr:7200,  prac:42000,   ludnosc:52000},
  szydlowiecki: {stopa:23.2, bezr:8200,  prac:15000,   ludnosc:40000},
  przysuski:    {stopa:19.0, bezr:6800,  prac:14000,   ludnosc:43000},
  radomski:     {stopa:17.4, bezr:9100,  prac:42000,   ludnosc:155000},
  makowski:     {stopa:17.0, bezr:4200,  prac:11000,   ludnosc:50000},
  legionowski:  {stopa:6.8,  bezr:7200,  prac:68000,   ludnosc:127000},
  piaseczynski: {stopa:3.8,  bezr:5800,  prac:82000,   ludnosc:175000},
  pruszkow:     {stopa:2.7,  bezr:6200,  prac:92000,   ludnosc:175000},
};

// ─── Dane Wynagrodzenia (z arkuszy ZUS) ───────────────────────────────────

export const WYNAGR_POWIATY = [
  {n:'m. Warszawa',      w:10842, k:9634,  m:12201, zatrudnieni:542000},
  {n:'Piaseczyński',     w:8920,  k:7840,  m:10120, zatrudnieni:52000},
  {n:'Pruszkowski',      w:8640,  k:7520,  m:9980,  zatrudnieni:48000},
  {n:'Legionowski',      w:7820,  k:6910,  m:8940,  zatrudnieni:38000},
  {n:'Wołomiński',       w:7560,  k:6640,  m:8620,  zatrudnieni:44000},
  {n:'Grodziski',        w:7340,  k:6480,  m:8360,  zatrudnieni:28000},
  {n:'Grójecki',         w:6980,  k:6210,  m:7920,  zatrudnieni:22000},
  {n:'Otwocki',          w:7120,  k:6340,  m:8050,  zatrudnieni:26000},
  {n:'m. Radom',         w:6840,  k:6020,  m:7780,  zatrudnieni:62000},
  {n:'m. Płock',         w:7210,  k:6380,  m:8180,  zatrudnieni:41000},
  {n:'Siedlecki',        w:6480,  k:5740,  m:7360,  zatrudnieni:18000},
  {n:'Żyrardowski',      w:6920,  k:6140,  m:7840,  zatrudnieni:21000},
  {n:'Nowodworski',      w:7040,  k:6240,  m:7980,  zatrudnieni:24000},
  {n:'Sierpecki',        w:5980,  k:5320,  m:6780,  zatrudnieni:14000},
  {n:'Gostyniński',      w:6120,  k:5440,  m:6940,  zatrudnieni:15000},
  {n:'Szydłowiecki',     w:5640,  k:5020,  m:6380,  zatrudnieni:11000},
  {n:'Przysuski',        w:5480,  k:4860,  m:6200,  zatrudnieni:10000},
  {n:'Radomski',         w:6020,  k:5360,  m:6820,  zatrudnieni:19000},
  {n:'Makowski',         w:5720,  k:5080,  m:6480,  zatrudnieni:9000},
  {n:'Lipski',           w:5540,  k:4920,  m:6280,  zatrudnieni:8000},
];

export const WYNAGR_ZAWODY = [
  {n:'Informatycy i spec. IT',       w:18420, udzial:8.4},
  {n:'Działalność finansowa',        w:16800, udzial:6.2},
  {n:'Prawnicy i notariusze',        w:14200, udzial:2.1},
  {n:'Architekci i urbaniści',       w:11840, udzial:1.8},
  {n:'Menedżerowie wyżsi',           w:18600, udzial:3.4},
  {n:'Inżynierowie budownictwa',     w:10200, udzial:4.2},
  {n:'Obsługa nieruchomości',        w:9400,  udzial:5.8},
  {n:'Technicy elektrycy',           w:8800,  udzial:3.6},
  {n:'Administracja publiczna',      w:9800,  udzial:7.2},
  {n:'Nauczyciele akademiccy',       w:8400,  udzial:2.9},
  {n:'Przetwórstwo przemysłowe',     w:9200,  udzial:9.1},
  {n:'Transport i magazynowanie',    w:8900,  udzial:6.8},
  {n:'Handel detaliczny',            w:8100,  udzial:10.4},
  {n:'Edukacja (nauczyciele)',        w:7800,  udzial:5.3},
  {n:'Opieka zdrowotna',             w:8600,  udzial:6.1},
  {n:'Gastronomia i zakwaterowanie', w:6200,  udzial:3.2},
];

export const STRUKTURA_UMOW = [
  {n:'IT i telekomunikacja',       uprace:72, ucywilno:24, usamo:4,  dlug:68},
  {n:'Finanse i ubezpieczenia',    uprace:81, ucywilno:14, usamo:5,  dlug:74},
  {n:'Administracja publiczna',    uprace:94, ucywilno:5,  usamo:1,  dlug:88},
  {n:'Przetwórstwo przemysłowe',   uprace:85, ucywilno:12, usamo:3,  dlug:71},
  {n:'Handel detaliczny',          uprace:68, ucywilno:28, usamo:4,  dlug:52},
  {n:'Transport i logistyka',      uprace:76, ucywilno:18, usamo:6,  dlug:63},
  {n:'Edukacja',                   uprace:78, ucywilno:19, usamo:3,  dlug:82},
  {n:'Opieka zdrowotna',           uprace:71, ucywilno:22, usamo:7,  dlug:69},
  {n:'Budownictwo',                uprace:58, ucywilno:22, usamo:20, dlug:48},
  {n:'Gastronomia',                uprace:52, ucywilno:38, usamo:10, dlug:34},
];

export const PODSUMOWANIE_DATA = {
  mazowieckie_avg: 9842,
  polska_avg: 8015,
  premia_pct: 22.8,
  dynamika_rr: 8.4,
  mediana_maz: 8240,
  kwartal_q1: 6980,
  kwartal_q3: 12400,
  top5_zawodow: [
    {n:'Menedżerowie', w:18600},
    {n:'Informatycy',  w:18420},
    {n:'Finansiści',   w:16800},
    {n:'Prawnicy',     w:14200},
    {n:'Architekci',   w:11840},
  ],
  trend_kwartalny: [
    {q:'Q1 2024', maz:8640, pl:7240},
    {q:'Q2 2024', maz:8920, pl:7420},
    {q:'Q3 2024', maz:9180, pl:7680},
    {q:'Q4 2024', maz:9450, pl:7900},
    {q:'Q1 2025', maz:9620, pl:8020},
    {q:'II pół 2025', maz:9842, pl:8015},
  ],
};
