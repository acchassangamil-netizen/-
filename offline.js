const APP_RELEASE='1.18';
(async()=>{
 const check=document.getElementById('check-update'),status=document.querySelector('.offline');
 if(!('serviceWorker'in navigator)||location.protocol==='file:'){if(check)check.hidden=true;return}
 let registration,changed=false,wasControlled=!!navigator.serviceWorker.controller;
 function notice(text,bad=false){const n=document.getElementById('notice');if(n){n.textContent=text;n.className=bad?'error':'success'}}
 function reloadButton(){
  let button=document.getElementById('update-app');if(button)return;
  button=document.createElement('button');button.id='update-app';button.textContent='تطبيق آخر تحديث';button.className='primary';
  button.onclick=()=>{if(!confirm('احفظ أي نموذج مفتوح قبل تطبيق التحديث. تحديث الآن؟'))return;
   if(registration?.waiting){navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});registration.waiting.postMessage('ACTIVATE')}
   else location.reload();
  };
  document.querySelector('header .tools')?.append(button);
 }
 function inspect(){if(registration?.waiting||changed)reloadButton()}
 function watch(worker){if(!worker)return;worker.addEventListener('statechange',()=>{setTimeout(inspect,0);if(worker.state==='redundant')notice('تعذر تنزيل التحديث كاملًا؛ النسخة الحالية ما زالت متاحة. أعد المحاولة مع اتصال الإنترنت.',true)})}
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(wasControlled){changed=true;reloadButton()}else wasControlled=true});
 try{
  registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
  registration.addEventListener('updatefound',()=>watch(registration.installing));watch(registration.installing);
  await navigator.serviceWorker.ready;if(status?.firstChild)status.firstChild.textContent='● جاهز للعمل بدون إنترنت';inspect();
  if(check)check.onclick=async()=>{check.disabled=true;check.textContent='جارٍ فحص التحديث…';try{
   await registration.update();watch(registration.installing);
   if(registration.installing)await new Promise(resolve=>{const worker=registration.installing;const timer=setTimeout(resolve,15000);worker.addEventListener('statechange',()=>{if(['installed','activated','redundant'].includes(worker.state)){clearTimeout(timer);resolve()}})});
   inspect();if(changed||registration.waiting){notice('التحديث جاهز. اضغط «تطبيق آخر تحديث».')}else notice('النسخة المفتوحة: '+APP_RELEASE+'؛ اكتمل فحص التحديثات. إذا ظل الشريط القديم ظاهرًا، أغلق تبويبات البرنامج وافتحه مجددًا.');
  }catch(e){notice('تعذر فحص التحديثات؛ تحقق من الإنترنت ثم أعد المحاولة.',true)}finally{check.disabled=false;check.textContent='فحص التحديثات'}};
  window.addEventListener('online',()=>registration.update().catch(()=>{}));
 }catch(e){if(status?.firstChild)status.firstChild.textContent='● لم يكتمل تجهيز الأوفلاين';if(check)check.onclick=()=>location.reload()}
})();
