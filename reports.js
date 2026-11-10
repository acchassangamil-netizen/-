/* Abu Hamda reports center — read-only, no inventory or ledger mutations. */
(function(){
const defs=[
 ['sales','المبيعات والفواتير'],['collections','التحصيلات'],['returns','المرتجعات والخصومات'],
 ['debt','المديونية وحدودها'],['reps','مقارنة المناديب'],['customers','العملاء ونشاطهم'],
 ['products','الأصناف والكميات'],['invoices','تفاصيل الفواتير'],['unlinked','فواتير غير مربوطة'],['treasury','الخزينة والتوريد'],['inventory','أرصدة المخزون']
];
let reportKind='sales',reportRows=[],reportHeaders=[];
const el=id=>document.getElementById(id);
const name=id=>state.reps.find(r=>r.id===id)?.name||id||'غير محدد';
const val=n=>money(n||0);
const number=n=>Number(n||0).toLocaleString('ar-EG');
const pick=()=>({from:el('report-from').value,to:el('report-to').value,rep:el('report-rep').value});
const rows=()=>{const f=pick();return (state.transactions||[]).filter(t=>!t.cancelled&&t.date>=f.from&&t.date<=f.to&&(!f.rep||t.rep===f.rep))};
const cash=()=>{const f=pick();return (state.cashEntries||[]).filter(t=>!t.cancelled&&t.date>=f.from&&t.date<=f.to&&(!f.rep||t.rep===f.rep))};
const valid=()=>{const f=pick();return !!f.from&&!!f.to&&f.from<=f.to};
const sum=(a,fn)=>a.reduce((n,x)=>n+(fn(x)||0),0);
const cell=x=>escape(String(x??'—'));
const table=(h,data)=>{reportHeaders=h;reportRows=data;el('report-head').innerHTML=h.map(x=>'<th>'+cell(x)+'</th>').join('');el('report-body').innerHTML=data.length?data.map(r=>'<tr>'+r.map(c=>'<td>'+cell(c)+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+h.length+'">لا توجد بيانات مسجلة تطابق الفلاتر المختارة.</td></tr>'};
const info=t=>el('report-info').textContent=t;
const kpis=items=>el('report-cards').innerHTML=items.map(([k,v])=>'<article><small>'+cell(k)+'</small><strong>'+cell(v)+'</strong></article>').join('');
function renderReports(){
 if(!state||!el('reports')||view!=='reports')return;
 const rep=el('report-rep'),was=rep.value;rep.innerHTML='<option value="">جميع المناديب</option>'+state.reps.map(r=>'<option value="'+cell(r.id)+'">'+cell(r.name)+'</option>').join('');if(state.reps.some(r=>r.id===was))rep.value=was;
 el('report-types').querySelectorAll('button[data-report]').forEach(b=>{b.classList.toggle('active',b.dataset.report===reportKind);b.setAttribute('aria-pressed',String(b.dataset.report===reportKind))});
 el('report-title').textContent=defs.find(x=>x[0]===reportKind)?.[1]||'تقرير';
 if(!valid()){info('تأكد أن تاريخ البداية يسبق أو يساوي تاريخ النهاية.');kpis([]);table(['الحالة'],[]);return}
 const a=rows(),c=cash();el('report-source-status').textContent='البيانات المحمّلة: '+number((state.transactions||[]).filter(t=>!t.cancelled).length)+' حركة مالية، و'+number((state.cashEntries||[]).filter(t=>!t.cancelled).length)+' حركة خزينة. داخل الفترة والفلاتر: '+number(a.length)+' حركة مالية، و'+number(c.length)+' حركة خزينة.';const sales=a.filter(x=>x.type==='sale'),collections=a.filter(x=>['collection','debt','collection_pending'].includes(x.type));
 const uniqueSales=new Set(sales.map(x=>[x.documentSeries||'',x.reference||x.id||''].join('|')));
 const gross=sum(sales,x=>x.amount),returned=sum(a.filter(x=>x.type==='return'),x=>x.amount),discount=sum(a.filter(x=>x.type==='discount'),x=>x.amount);
 const invoiceCount=sum(sales,x=>x.invoiceCount||((x.reference||x.id)?1:0));
 const source=window.ReportSource,filters=pick();
 const sourceAll=source?.loaded?source.rows.filter(x=>x.date>=filters.from&&x.date<=filters.to):[];
 const sourceRows=sourceAll.filter(x=>!filters.rep||source.rep(x)===filters.rep);
 const sourceInvoices=source?.loaded?source.list().filter(x=>x.date>=filters.from&&x.date<=filters.to&&(!filters.rep||x.rep===filters.rep)):[];
 const sourceUnlinked=source?.loaded?source.list().filter(x=>x.date>=filters.from&&x.date<=filters.to&&!x.rep):[];
 const sourceStatus=source?.loaded?'كشف الأصناف المستورد: '+number(sourceAll.length)+' سطر، '+number(sourceInvoices.length)+' فاتورة ضمن اختيارك، '+number(sourceUnlinked.length)+' فاتورة غير مربوطة بمندوب. هذه التفاصيل للعرض فقط ولا تدخل في إجمالي المبيعات أو المخزون.':'بيانات حركة تفاصيل الفواتير لم تُحمّل بعد'+(source?.error?' — '+source.error:'')+'.';
 if(source?.loaded)source.updateControls();
 el('report-export').disabled=false;
 switch(reportKind){
 case 'sales':
  kpis([['إجمالي المبيعات',val(gross)],['صافي بعد المرتجعات والخصومات',val(gross-returned-discount)],['عدد الفواتير المسجل',number(invoiceCount)],['عدد العملاء المعروفين',number(new Set(sales.map(t=>(t.customerName||'').trim()).filter(Boolean)).size)]]);
  table(['التاريخ','المندوب','رقم المستند','العميل','عدد الفواتير','المبيعات (ج.م)'],sales.map(t=>[t.date,name(t.rep),t.reference||'مجمع يومي',t.customerName||'غير محدد',t.invoiceCount||0,val(t.amount)]));
  info('الفواتير المجمعة يوميًا تظهر كحركة مجمعة، ولا تُعامل كل حركة تلقائيًا كفاتورة منفصلة.');break;
 case 'collections':
  kpis([['إجمالي التحصيلات',val(sum(collections,x=>x.amount))],['تحصيل المبيعات',val(sum(a.filter(x=>x.type==='collection'),x=>x.amount))],['تحصيل المديونية',val(sum(a.filter(x=>x.type==='debt'),x=>x.amount))],['تحت التصنيف',val(sum(a.filter(x=>x.type==='collection_pending'),x=>x.amount))]]);
  table(['التاريخ','المندوب','النوع','المرجع','العميل','القيمة (ج.م)'],collections.map(t=>[t.date,name(t.rep),labels[t.type]||t.type,t.reference||'—',t.customerName||'—',val(t.amount)]));info('التحصيل تحت التصنيف منفصل ولا يُحتسب تحصيل مبيعات حتى تصنيفه.');break;
 case 'returns':
  kpis([['المرتجعات',val(returned)],['الخصومات',val(discount)],['إجمالي المستبعد',val(returned+discount)]]);
  table(['التاريخ','المندوب','النوع','المرجع','القيمة (ج.م)'],a.filter(t=>['return','discount'].includes(t.type)).map(t=>[t.date,name(t.rep),labels[t.type],t.reference||'—',val(t.amount)]));info('هذه حركات مالية مسجلة فقط؛ لا تُعدّل المخزون.');break;
 case 'debt':{
  const f=pick(),to=f.to;
  const selected=state.reps.filter(r=>!f.rep||r.id===f.rep);
  const data=selected.map(r=>{const opening=r.opening||0,mov=(state.transactions||[]).filter(t=>!t.cancelled&&t.rep===r.id&&t.date<=to),closing=opening+sum(mov,t=>t.type==='sale'?t.amount:-t.amount),cfg=SalesModel.settings(state,r,to.slice(0,7)),day=Number(to.slice(8)),tier=day<=10?0:day<=15?1:day<=20?2:day<=25?3:4,cap=r.category==='مباشر'?null:cfg.policy?.[tier];return[r.name,r.category,val(opening),val(closing),cap==null?'غير محدد':val(cap),cap==null?'—':closing>cap?'تجاوز الحد':'ضمن الحد']});
  kpis([['عدد الحسابات',number(selected.length)],['إجمالي المديونية حتى نهاية الفترة',val(sum(selected,r=>r.opening||0)+sum((state.transactions||[]).filter(t=>!t.cancelled&&t.date<=to&&(!f.rep||t.rep===f.rep)),t=>t.type==='sale'?t.amount:-t.amount))]]);
  table(['المندوب','القطاع','رصيد أول المدة','الرصيد حتى التاريخ','الحد','الحالة'],data);info('الرصيد تراكمي حتى نهاية الفترة المختارة، ويشمل الحركات الأقدم من تاريخ البداية. حدود المديونية تُقرأ من سياسة الشهر.');break}
 case 'reps':{
  const f=pick(),selected=state.reps.filter(r=>!f.rep||r.id===f.rep);
  table(['المندوب','عدد الفواتير','إجمالي المبيعات','المرتجعات والخصومات','صافي المبيعات','التحصيلات','عدد العملاء المعروفين'],selected.map(r=>{const b=a.filter(t=>t.rep===r.id),s=b.filter(t=>t.type==='sale');return[r.name,number(sum(s,t=>t.invoiceCount||0)),val(sum(s,t=>t.amount)),val(sum(b.filter(t=>['return','discount'].includes(t.type)),t=>t.amount)),val(sum(s,t=>t.amount)-sum(b.filter(t=>['return','discount'].includes(t.type)),t=>t.amount)),val(sum(b.filter(t=>['collection','debt','collection_pending'].includes(t.type)),t=>t.amount)),number(new Set(s.map(t=>(t.customerName||'').trim()).filter(Boolean)).size)]}));
  kpis([['عدد المناديب',number(selected.length)],['إجمالي صافي المبيعات',val(gross-returned-discount)]]);info('مقارنة على الفترة المحددة. نشاط العملاء لا يشمل الفواتير التي لم يُسجل اسم عميلها.');break}
 case 'customers':{
  if(source?.loaded){
   const groups=new Map(),unique=new Set();
   for(const t of sourceRows){const k=source.key(t),key=t.customer+'|'+(source.rep(t)||'');if(!groups.has(key))groups.set(key,{customer:t.customer,rep:source.rep(t),invoices:new Set(),qty:0,amount:0,products:new Set(),first:t.date,last:t.date});const g=groups.get(key);g.invoices.add(k);g.qty+=t.quantity;g.amount+=t.amount;g.products.add(t.product);g.first=g.first<t.date?g.first:t.date;g.last=g.last>t.date?g.last:t.date;unique.add(k)}
   const list=[...groups.values()].sort((x,y)=>y.invoices.size-x.invoices.size);
   kpis([['العملاء',number(new Set(list.map(x=>x.customer)).size)],['الفواتير من كشف الأصناف',number(unique.size)],['فواتير غير مربوطة',number(sourceUnlinked.length)],['العملاء في حركات الموقع',number(new Set(sales.map(x=>x.customerName).filter(Boolean)).size)]]);
   table(['العميل','المندوب','عدد الفواتير','عدد الأصناف المختلفة','صافي كمية الحركة','صافي قيمة حركة المصدر','أول فاتورة','آخر فاتورة'],list.map(x=>[x.customer,x.rep?name(x.rep):'غير مربوط',x.invoices.size,x.products.size,number(x.qty),x.amount.toFixed(2),x.first,x.last]));
   info(sourceStatus+' الإشارة السالبة للكميات والقيم مأخوذة كما هي من كشف الأمين؛ لا يتم إعادة احتسابها كمبيعات.');break;
  }
  kpis([['أسماء العملاء في حركات الموقع',number(new Set(sales.map(t=>(t.customerName||'').trim()).filter(Boolean)).size)]]);
  table(['اسم العميل','المندوب','رقم المستند','قيمة البيع'],sales.filter(t=>t.customerName).map(t=>[t.customerName,name(t.rep),t.reference||'—',val(t.amount)]));info(sourceStatus);break}
 case 'products':{
  if(!source?.loaded){kpis([['حالة المصدر','غير متاح']]);table(['الصنف','الكمية','القيمة'],[]);info(sourceStatus);break}
  const grouped=new Map();
  for(const t of sourceRows){const key=t.product+'|'+t.unit;const g=grouped.get(key)||{product:t.product,unit:t.unit,quantity:0,amount:0,customers:new Set(),invoices:new Set()};g.quantity+=t.quantity;g.amount+=t.amount;g.customers.add(t.customer);g.invoices.add(source.key(t));grouped.set(key,g)}
  const data=[...grouped.values()].sort((x,y)=>Math.abs(y.quantity)-Math.abs(x.quantity));
  kpis([['الأصناف المختلفة',number(new Set(data.map(x=>x.product)).size)],['بنود الأصناف',number(sourceRows.length)],['الفواتير',number(sourceInvoices.length)]]);
  table(['الصنف','الوحدة','صافي كمية الحركة','صافي قيمة حركة المصدر','عدد العملاء','عدد الفواتير'],data.map(x=>[x.product,x.unit,number(x.quantity),x.amount.toFixed(2),x.customers.size,x.invoices.size]));info(sourceStatus+' الكميات من كشف حركة الأصناف، ولا تخصم من رصيد المخزون الحالي.');break}
 case 'invoices':{
  if(!source?.loaded){kpis([['حركات مبيعات الموقع',number(sales.length)],['عدد الفواتير المدخل',number(invoiceCount)]]);table(['التاريخ','رقم الفاتورة','المندوب','القيمة'],sales.map(x=>[x.date,x.document?.invoiceNumber||x.reference||'حركة مجمعة',name(x.rep),val(x.amount)]));info(sourceStatus);break}
  kpis([['فواتير كشف الأصناف',number(sourceInvoices.length)],['سطور الأصناف',number(sourceRows.length)],['فواتير غير مربوطة',number(sourceUnlinked.length)],['حركات مبيعات البرنامج',number(sales.length)]]);
  table(['التاريخ','رقم الفاتورة','العميل','المندوب','الصنف','الكمية','الوحدة','السعر','قيمة حركة المصدر'],sourceRows.map(x=>[x.date,x.series+' '+x.invoice,x.customer,source.rep(x)?name(source.rep(x)):'غير مربوط',x.product,number(x.quantity),x.unit,x.price.toFixed(2),x.amount.toFixed(2)]));
  info(sourceStatus+' رقم الفاتورة يختلف أحيانًا عن رقم سند الأمين؛ تم عرض الرقم الأصلي من كشف حركة الفواتير.');break}
 case 'unlinked':{
  kpis([['فواتير بلا مندوب',number(sourceUnlinked.length)],['عدد العملاء',number(new Set(sourceUnlinked.map(x=>x.customer)).size)]]);
  table(['التاريخ','رقم فاتورة المصدر','العميل','عدد الأصناف','قيمة حركة المصدر','حالة الربط'],sourceUnlinked.map(x=>[x.date,x.series+' '+x.invoice,x.customer,x.count,x.value.toFixed(2),'يحتاج تحديد المندوب']));
  info(sourceStatus+' اختر الفاتورة والمندوب من أداة الربط أعلى التقرير، ثم احفظ. الربط لا يغير المبيعات أو المخزون.');break}
 case 'treasury':
  kpis([['مقبوضات الخزينة',val(sum(c.filter(x=>x.kind==='collection'),x=>x.amountPiastres))],['التوريدات',val(sum(c.filter(x=>x.kind==='treasury'),x=>x.amountPiastres))],['صافي حركة النقدية',val(sum(c,x=>(x.kind==='collection'?1:-1)*x.amountPiastres))]]);
  table(['التاريخ','المندوب','السند','نوع الحركة','القيمة'],c.map(x=>[x.date,name(x.rep),x.voucherNumber||x.receiptNumber||'—',x.kind==='collection'?'تحصيل':'توريد للخزينة',val(x.amountPiastres)]));info('النتائج من سجلات النقدية المستوردة فقط، ولا تُضاعف تحصيلات مستندات المبيعات.');break;
 case 'inventory':
  kpis([['حالة المخزون','مرجعي فقط']]);table(['الصنف','الرصيد الحالي','السعر 2','السعر 6'],[]);info('لائحة أسعار الأصناف التي أرسلتها تمثل رصيد المخزن الحالي، ولم تُستورد إلى بيانات الموقع بعد. جميع الفواتير التاريخية لا تؤثر على رصيد المخزن.');break;
 }
}
window.renderReports=renderReports;
el('report-types').innerHTML=defs.map(([id,label])=>'<button type="button" data-report="'+id+'">'+label+'</button>').join('');
el('report-types').onclick=e=>{const b=e.target.closest('[data-report]');if(b){reportKind=b.dataset.report;renderReports()}};
for(const id of ['report-from','report-to','report-rep']){el(id).addEventListener('change',renderReports);el(id).addEventListener('input',renderReports)}
el('report-refresh').onclick=async()=>{const b=el('report-refresh');b.disabled=true;b.textContent='جارٍ تحديث التقرير…';try{await refresh();renderReports();toast('تم تحديث التقرير من البيانات المحفوظة على هذا الجهاز')}catch(err){toast('تعذر تحديث التقرير: '+err.message,true)}finally{b.disabled=false;b.textContent='تحديث التقرير'}};
el('report-from').value=today().slice(0,7)+'-01';el('report-to').value=today();
el('report-export').onclick=()=>{
 if(!valid())return;
 const csvCell=v=>{let s=String(v??'');if(/^[=+@\t\r-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 download('\ufeff'+[reportHeaders,...reportRows].map(row=>row.map(csvCell).join(',')).join('\r\n'),'report-'+reportKind+'-'+el('report-from').value+'-'+el('report-to').value+'.csv','text/csv;charset=utf-8');
};
el('report-print').onclick=()=>window.print();
})();
