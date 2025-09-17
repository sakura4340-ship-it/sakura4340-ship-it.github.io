// ====== 基本設定（バージョンは更新するごとに変える） ======
const VERSION  = "2025-09-17.3"; 
const PRECACHE = `loanpro-precache-${VERSION}`;
const RUNTIME  = `loanpro-runtime-${VERSION}`;

// GitHub Pages 用: 相対パスで書くこと！
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// ====== インストール（プリキャッシュ） ======
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ====== 有効化（古いキャッシュ削除） ======
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== PRECACHE && key !== RUNTIME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ====== fetch ハンドラ ======
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const isHTML = req.headers.get("accept")?.includes("text/html");

  if (isHTML) {
    // HTML はネット優先、オフラインなら index.html をフォールバック
    event.respondWith(
      fetch(req).catch(() => caches.match("./index.html"))
    );
  } else {
    // 画像/CSS/JS はキャッシュ優先
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const clone = res.clone();
          caches.open(RUNTIME).then((c) => c.put(req, clone));
          return res;
        });
      })
    );
  }
});

// ====== 即時更新用 ======
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
