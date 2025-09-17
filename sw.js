// ====== 基本設定（毎回 VERSION を更新！） ======
const VERSION    = "2025-09-17.1";                 // ← 更新のたびに日付や通し番号を変える
const PRECACHE   = `loanpro-precache-${VERSION}`;
const RUNTIME    = `loanpro-runtime-${VERSION}`;

// ここは絶対パス（ユーザーサイトなので "/" 始まり）
const APP_SHELL = [
  "/",                           // ルート（トップ）
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-1024.png",
  "/icons/apple-touch-icon-180.png"
];

// sw.js
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});


  if (isHTML) {
    // オフライン時のフォールバックも考慮
    e.respondWith(
      fetch(req).catch(() => caches.match(req).then(r => r || caches.match("/index.html")))
    );
  } else {
    // 画像/CSS/JSなどはキャッシュ優先、無ければ取得してRUNTIMEへ保存
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          const clone = res.clone();
          caches.open(RUNTIME).then(c => c.put(req, clone));
          return res;
        });
      })
    );
  }
});

// （任意）ページ側から postMessage で即時更新を指示できる口
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});
