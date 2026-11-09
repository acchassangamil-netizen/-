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
  if(incoming.schema==='alameen-full-refresh-v1'){incoming.transferId=id;await OfflineStore.request('/api/import-full-refresh',incoming);await refresh();notice.className='success';notice.textContent='تم تحديث البيانات بالكامل ومطابقتها: 156 فاتورة مبيعات و16 مرتجعًا والتحصيلات والتوريد، مع حفظ رصيد أول المدة والأهداف والحدود والمناديب. افتح كشف أحمد نصر أو أحمد مدحت؛ الحركات تمتد إلى 9 نوفمبر.';return}
  if(incoming.schema==='alameen-sales-supplement-v1'){incoming.transferId=id;await OfflineStore.request('/api/import-sales-supplement',incoming);await refresh();notice.className='success';notice.textContent='تم اعتماد استكمال المبيعات والتعديل حسب كشف الأمين الأحدث، دون تكرار المستندات. رصيد أول المدة والمرتجعات والأهداف محفوظة، والتعديل مسجل في سجل المراجعة.';return}
  if(incoming.schema==='alameen-returns-patch-v1'){incoming.transferId=id;await OfflineStore.request('/api/import-returns',incoming);await refresh();notice.className='success';notice.textContent='تمت مطابقة '+incoming.expectedCount+' مستند مرتجع مع منع تكرار السند وأصل المرتجع. المستندات الموجودة المطابقة لا تُضاف مرة ثانية، ورصيد أول المدة محفوظ.';return}
  if(incoming.schema==='alameen-cleanup-v1'){incoming.transferId=id;await OfflineStore.request('/api/verified-cleanup',incoming);await refresh();notice.className='success';notice.textContent='تمت المراجعة والتنظيف: المبيعات والتحصيلات من ملفي الأمين فقط، مع الحفاظ على أول المدة والمناديب والأهداف وحدود المديونية. المرتجعات بانتظار الاستيراد. نتيجة المطابقة ظاهرة في الملخص.';return}
  if(incoming.schema==='alameen-combined-report-v1'){incoming.transferId=id;await OfflineStore.request('/api/import-company-reports',incoming);await refresh();notice.className='success';notice.textContent='تم إدخال '+incoming.sales.expectedCount+' فاتورة مبيعات وكشف التحصيلات والتوريد للخزينة. التوريد لا يُخصم من المديونية مرة أخرى. التحصيلات تحت التصنيف لحين مراجعة أول المدة.';return}
  if(incoming.schema==='alameen-cash-report-v1'){incoming.transferId=id;await OfflineStore.request('/api/import-cash-report',incoming);await refresh();notice.className='success';notice.textContent='تم إدخال التحصيلات والتوريد: المدين تحصيل، والدائن تحويل للخزينة الرئيسية. التوريد لا يُخصم مرة ثانية من مديونية المندوب. التحصيلات الجديدة تحت التصنيف لحين تحديد مديونية أول المدة.';return}
  if(incoming.schema==='alameen-multi-sales-patch-v1'){incoming.transferId=id;await OfflineStore.request('/api/import-sales-batch',incoming);await refresh();notice.className='success';notice.textContent='تم إدخال '+incoming.expectedCount+' فاتورة من ملف الأمين لعدد '+incoming.groups.length+' مناديب / جهات، مع استبعاد تجميع المبيعات القديم لنفس الفترة. الأرصدة تحتاج استكمال المرتجعات والتحصيلات وأول المدة.';return}
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
