/* Read-only invoice line catalog imported from the user's Al Ameen PDF. */
(function(){
const storageKey='abuhamda-report-links-v1';
const sourceKey='abuhamda-report-details-v1';
let source={rows:[]},loaded=false,error='',links={};
try{const raw=localStorage.getItem(storageKey);if(raw&&raw.length<300000){const parsed=JSON.parse(raw);if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))links=parsed}}catch(e){}
function key(x){return x.date+'|'+x.series+'|'+x.invoice}
function txRep(x){
 if(typeof state==='undefined'||!state||!Array.isArray(state.transactions))return '';
 const candidates=state.transactions.filter(t=>{
  if(t.cancelled||t.type!=='sale'||t.date!==x.date)return false;
  const numbers=[t.document?.invoiceNumber,t.document?.originNumber,t.reference,t.document?.number].filter(Boolean).map(String);
  return numbers.includes(String(x.invoice));
 });
 const ids=[...new Set(candidates.map(t=>t.rep))];
 return ids.length===1?ids[0]:'';
}
function rep(x){const k=key(x);return links[k]||txRep(x)}
function list(){const seen=new Map();for(const x of source.rows){const k=key(x);if(!seen.has(k))seen.set(k,{...x,key:k,rep:rep(x),count:0,value:0});const t=seen.get(k);t.count++;t.value+=x.amount}return [...seen.values()]}
function updateControls(){
 const invoice=document.getElementById('report-link-invoice'),repSelect=document.getElementById('report-link-rep');
 if(!invoice||!repSelect||typeof state==='undefined'||!state)return;
 const old=invoice.value,records=list();
 invoice.innerHTML='<option value="">اختر فاتورة من كشف الأصناف</option>'+records.map(x=>'<option value="'+escape(x.key)+'">'+escape(x.date+' | '+x.invoice+' | '+x.customer+(x.rep?' ✓':' • غير مربوط'))+'</option>').join('');
 if(records.some(x=>x.key===old))invoice.value=old;
 repSelect.innerHTML='<option value="">غير مربوط بمندوب</option>'+state.reps.map(r=>'<option value="'+escape(r.id)+'">'+escape(r.name)+'</option>').join('');
 if(invoice.value){const item=records.find(x=>x.key===invoice.value);repSelect.value=item?.rep||''}
 document.getElementById('report-source-link-panel').hidden=!records.length;
}
function assign(){
 const k=document.getElementById('report-link-invoice').value;
 const r=document.getElementById('report-link-rep').value;
 if(!k||!list().some(x=>x.key===k)){alert('اختر رقم فاتورة صحيحًا');return}
 if(r&&!state.reps.some(x=>x.id===r)){alert('اختر مندوبًا صحيحًا');return}
 if(r)links[k]=r;else delete links[k];
 try{localStorage.setItem(storageKey,JSON.stringify(links))}catch(e){alert('تعذر حفظ ربط المندوب في هذا المتصفح: '+e.message);return}
 updateControls();if(typeof window.renderReports==='function')window.renderReports();
}

function accept(data){
 if(data?.schema!=='abuhamda-report-source-v1'||data?.nonFinancial!==true||!Array.isArray(data.rows)||data.rows.length>30000||data.rows.some(x=>!x.date||!x.invoice||!x.product||!x.customer||!Number.isFinite(x.quantity)||!Number.isFinite(x.amount)))throw Error('تنسيق ملف تفاصيل الفواتير غير صحيح');
 source=data;loaded=true;error='';
}
function load(){
 try{
  const raw=localStorage.getItem(sourceKey);
  if(raw){accept(JSON.parse(raw));}
  else{loaded=false;error='حمّل ملف تفاصيل الفواتير من جهازك من خلال زر الاستيراد أدناه';}
 }catch(e){loaded=false;error=e.message||String(e)}
 updateControls();if(typeof window.renderReports==='function')window.renderReports();
}
document.getElementById('report-source-file').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>8_000_000)throw Error('حجم ملف التفاصيل أكبر من المسموح');
  const raw=await file.text();const data=JSON.parse(raw);accept(data);
  localStorage.setItem(sourceKey,JSON.stringify(data));
  load();
  if(typeof toast==='function')toast('تم تحميل تفاصيل '+data.rows.length+' سطر صنف في المتصفح فقط، دون تسجيل مبيعات جديدة.');
 }catch(err){if(typeof toast==='function')toast('تعذر استيراد تفاصيل الفواتير: '+err.message,true)}
 finally{e.target.value=''}
});
document.getElementById('report-link-invoice').addEventListener('change',e=>{const found=list().find(x=>x.key===e.target.value);document.getElementById('report-link-rep').value=found?.rep||''});
document.getElementById('report-link-save').addEventListener('click',assign);
window.ReportSource={get rows(){return source.rows},get loaded(){return loaded},get error(){return error},key,rep,list,updateControls};
load();
})();