(async()=>{
 if(!('serviceWorker'in navigator)||location.protocol==='file:'){const n=document.createElement('p');n.className='hint';n.textContent='للتثبيت والعمل أوفلاين افتح نسخة HTTPS المنشورة، ثم افتحها مرة واحدة بالإنترنت.';document.querySelector('main').prepend(n);return}
 try{const r=await navigator.serviceWorker.register('./sw.js');const status=document.querySelector('.offline');function ready(){status.firstChild.textContent='● جاهز للعمل بدون إنترنت'}
 await navigator.serviceWorker.ready;ready();
 function offer(){if(!r.waiting)return;let b=document.getElementById('update-app');if(b)return;b=document.createElement('button');b.id='update-app';b.textContent='تحديث البرنامج متاح';b.onclick=()=>{if(!confirm('حُفظت الحركات السابقة. احفظ أي نموذج مفتوح قبل التحديث. تحديث الآن؟'))return;navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});r.waiting.postMessage('ACTIVATE')};document.querySelector('.tools').append(b)}
 offer();r.addEventListener('updatefound',()=>{const w=r.installing;w?.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)offer()})});window.addEventListener('online',()=>r.update().catch(()=>{}));
 }catch(e){document.querySelector('.offline').firstChild.textContent='● لم يكتمل تجهيز الأوفلاين'}
})();
