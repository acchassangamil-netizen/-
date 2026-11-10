const CACHE='abuhamda-shell-v24';
const RELEASE='1.24';
const ASSETS=['./','./index.html','./style.css','./storage.js','./app.js','./reports.js','./report-source.js','./offline.js','./transfer.js','./reconcile.js','./model.js','./statement-model.js','./statements.js','./daily.js','./documents.js','./cash.js','./nav.js','./review.js','./fonts/Cairo.woff2','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(ASSETS.map(asset=>new Request(new URL(asset,self.registration.scope),{cache:'reload'})));await self.skipWaiting()})()));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE')self.skipWaiting();if(event.data==='GET_VERSION')event.ports?.[0]?.postMessage({release:RELEASE})});
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('abuhamda-shell-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);
 if(event.request.method!=='GET'||u.origin!==self.location.origin||!u.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
  const c=await caches.open(CACHE);
  const key=event.request.mode==='navigate'?new URL('./index.html',self.registration.scope):event.request;
  try{
   const response=await fetch(event.request,{cache:'no-store'});
   if(response.ok){await c.put(key,response.clone());return response}
   return (await c.match(key))||response;
  }catch(err){
   const cached=await c.match(key);
   if(cached)return cached;
   throw err;
  }
 })());
});