const CACHE='abuhamda-shell-v5';
const ASSETS=['./','./index.html','./style.css','./storage.js','./app.js','./offline.js','./transfer.js','./reconcile.js','./model.js','./daily.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE')self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('abuhamda-shell-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin||!u.href.startsWith(self.registration.scope))return;event.respondWith(caches.open(CACHE).then(async c=>{if(event.request.mode==='navigate')return(await c.match(new URL('./index.html',self.registration.scope)))||fetch(event.request);return(await c.match(event.request))||fetch(event.request)}))});
