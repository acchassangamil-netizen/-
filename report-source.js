/* Read-only invoice line catalog imported from the user's Al Ameen PDF. */
(function(){
const storageKey='abuhamda-report-links-v1';
let source={rows:[]},loaded=false,error='',links={};
try{const raw=localStorage.getItem(storageKey);if(raw&&raw.length<300000){const parsed=JSON.parse(raw);if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))links=parsed}}catch(e){}
function key(x){return x.date+'|'+x.series+'|'+x.invoice}
function txRep(x){
 if(!window.state||!Array.isArray(state.transactions))return '';
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
 if(!invoice||!repSelect||!window.state)return;
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
async function load(){
 try{
  const response=await fetch('./report-source-2026-11-09.json',{cache:'no-cache'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const result=await response.json();
  if(result.schema!=='abuhamda-report-source-v1'||result.nonFinancial!==true||!Array.isArray(result.rows))throw Error('تنسيق بيانات المصدر غير صحيح');
  source=result;loaded=true;error='';
 }catch(e){error=String(e.message||e)}
 updateControls();if(typeof window.renderReports==='function')window.renderReports();
}
document.getElementById('report-link-invoice').addEventListener('change',e=>{const found=list().find(x=>x.key===e.target.value);document.getElementById('report-link-rep').value=found?.rep||''});
document.getElementById('report-link-save').addEventListener('click',assign);
window.ReportSource={get rows(){return source.rows},get loaded(){return loaded},get error(){return error},key,rep,list,updateControls};
load();
})();