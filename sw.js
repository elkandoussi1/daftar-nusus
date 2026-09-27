/* دفتر النصوص الرقمي — Service Worker
   الغرض الوحيد هنا هو السماح بتثبيت الصفحة كتطبيق (PWA) وتوفير عملها
   دون اتصال بالإنترنت. لا علاقة له بحفظ بيانات الدفتر نفسها —
   ذلك يبقى بالكامل عبر localStorage/IndexedDB داخل الصفحة كما هو. */

const CACHE_NAME = 'daftar-nusus-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // لصفحة HTML نفسها: نحاول الشبكة أولًا لضمان وصول آخر تحديث،
  // ونستعمل النسخة المخزّنة فقط عند تعذر الاتصال (وضع عدم الاتصال).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // لبقية الملفات الثابتة (الأيقونات، manifest): من الذاكرة المؤقتة أولًا.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
