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

// ====== install：シェルを事前キャッシュ、即時適用準備 ======
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PRECACHE).then(c => c.addAll(APP_SHELL)));
  self.skipWaiting(); // 新SWを waiting に止めずすぐ有効化へ
});

// ====== activate：旧キャッシュ掃除＆既存タブも新SW管理へ ======
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => {
      const isOld = (k.startsWith("loanpro-precache-") || k.startsWith("loanpro-runtime-")) && !k.endsWith(VERSION);
      return isOld ? caches.delete(k) : null;
    }));
    await self.clients.claim();
  })());
});

// ====== fetch：HTMLはネット優先、静的はキャッシュ優先 ======
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const accept = req.headers.get("accept") || "";
  const isHTML = accept.includes("text/html");

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
