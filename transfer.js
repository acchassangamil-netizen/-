(async()=>{
 const hash=new URLSearchParams(location.hash.slice(1)),transfer=hash.get('transfer');if(!transfer)return;
 history.replaceState(null,'',location.pathname+location.search);
 const [id,keyText]=transfer.split('.');if(!/^[a-f0-9]{32}$/.test(id||'')||!/^[A-Za-z0-9_-]{43}$/.test(keyText||''))return;
 const notice=document.getElementById('notice');notice.textContent='جارٍ نقل بيانات الشيت بأمان إلى هذا المتصفح…';
 try{
  const r=await fetch('./imports/'+id+'.json',{cache:'no-store'});if(!r.ok)throw Error('تعذر تنزيل حزمة النقل');const packet=await r.json();
  const decode=x=>Uint8Array.from(atob(x.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey('raw',decode(keyText),'AES-GCM',false,['decrypt']);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(packet.iv)},key,decode(packet.data));
  const incoming=JSON.parse(new TextDecoder().decode(plain));
  if(incoming.schema==='alameen-sales-patch-v1'){incoming.transferId=id;await OfflineStore.request('/api/import-invoices',incoming);await refresh();notice.className='success';notice.textContent='تم إدخال '+incoming.documents.length+' فاتورة '+incoming.rep.name+' بأرقام سندات الأمين، مع استبعاد تجميع المبيعات القديم لنفس الفترة. بيانات الرصيد تحتاج استكمال المرتجعات والتحصيلات وأول المدة.';return}
  OfflineStore.validate(incoming);
  const old=await OfflineStore.request('/api/state');
  if(old.importAudit?.transferId===id){notice.textContent='بيانات الشيت دي مستوردة بالفعل؛ تم الاحتفاظ بأي حركات أضفتها بعدها.';return}
  const populated=old.transactions.length||old.reps.some(x=>x.opening||x.target);
  if(populated&&!confirm('يوجد بيانات محفوظة بالفعل. استبدالها ببيانات الشيت؟ ستُحفظ نسخة تلقائية قبل الاستبدال.')){notice.textContent='تم إلغاء النقل؛ بياناتك الحالية محفوظة.';return}
  incoming.importAudit={...incoming.importAudit,transferId:id};
  await OfflineStore.request('/api/restore',incoming);await refresh();
  notice.className='success';notice.textContent='تم نقل بيانات الشيت بنجاح: '+incoming.reps.length+' مناديب / جهات، '+incoming.transactions.length+' حركة، وأرشيف '+incoming.importAudit.sheetCount+' تبويبًا. نزّل نسخة احتياطية من الإعدادات.';
 }catch(e){notice.className='error';notice.textContent='لم يتم نقل البيانات: '+e.message}
})();
