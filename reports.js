/* Abu Hamda reports center — read-only, no inventory or ledger mutations. */
(function(){
const defs=[
 ['sales','المبيعات والفواتير'],['collections','التحصيلات'],['returns','المرتجعات والخصومات'],
 ['debt','المديونية وحدودها'],['reps','مقارنة المناديب'],['customers','العملاء ونشاطهم'],
 ['products','الأصناف والكميات'],['invoices','تفاصيل الفواتير'],['treasury','الخزينة والتوريد'],['inventory','أرصدة المخزون']
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
 const a=rows(),c=cash(),sales=a.filter(x=>x.type==='sale'),collections=a.filter(x=>['collection','debt','collection_pending'].includes(x.type));
 const uniqueSales=new Set(sales.map(x=>[x.documentSeries||'',x.reference||x.id||''].join('|')));
 const gross=sum(sales,x=>x.amount),returned=sum(a.filter(x=>x.type==='return'),x=>x.amount),discount=sum(a.filter(x=>x.type==='discount'),x=>x.amount);
 const invoiceCount=sum(sales,x=>x.invoiceCount||((x.reference||x.id)?1:0));
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
  const mapped=new Map(),unassigned=sales.filter(t=>!(t.customerName||'').trim());
  for(const t of sales){const customer=(t.customerName||'').trim();if(!customer)continue;const key=t.rep+'|'+customer,v=mapped.get(key)||{customer,rep:t.rep,first:t.date,last:t.date,amount:0,count:0,records:0};v.first=v.first<t.date?v.first:t.date;v.last=v.last>t.date?v.last:t.date;v.amount+=t.amount;v.count+=t.invoiceCount||0;v.records++;mapped.set(key,v)}
  const data=[...mapped.values()].sort((x,y)=>y.amount-x.amount);
  kpis([['عملاء مميزون',number(new Set(data.map(x=>x.customer)).size)],['علاقات عميل/مندوب',number(data.length)],['فواتير دون اسم عميل',number(unassigned.length)]]);
  table(['العميل','المندوب','عدد الفواتير','قيمة المبيعات','أول تعامل بالفترة','آخر تعامل بالفترة'],data.map(x=>[x.customer,name(x.rep),number(x.count),val(x.amount),x.first,x.last]));
  info('هذا التقرير يعرض العملاء الذين تم تسجيل أسمائهم داخل حركات المبيعات. لا يمكن استنتاج عميل جديد أو متوقف بدقة دون سجل تاريخي كامل وربط الفواتير بالمندوب.');break}
 case 'products':
  kpis([['حالة البيانات','غير متاحة']]);table(['الصنف','الكمية','القيمة'],[]);info('تفاصيل الأصناف والكميات موجودة في كشف الفواتير PDF المرسل، لكنها غير مرتبطة بعد بقاعدة بيانات الموقع. لن نخمن توزيعها على المناديب أو نخصمها من المخزون.');break;
 case 'invoices':
  kpis([['حركات المبيعات',number(sales.length)],['عدد الفواتير المدخل',number(invoiceCount)],['مستندات مميزة',number(uniqueSales.size)]]);
  table(['التاريخ','رقم الفاتورة / التجميع','المندوب','العميل','القيمة'],sales.map(t=>[t.date,t.reference||'حركة مجمعة',name(t.rep),t.customerName||'غير محدد',val(t.amount)]));info('تمييز رقم الفاتورة يعتمد على رقم المرجع والسلسلة. الحركات المجمعة تحتاج تفاصيل المصدر للوصول إلى فواتير منفصلة.');break;
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
for(const id of ['report-from','report-to','report-rep'])el(id).addEventListener('change',renderReports);
el('report-from').value=today().slice(0,7)+'-01';el('report-to').value=today();
el('report-export').onclick=()=>{
 if(!valid())return;
 const csvCell=v=>{let s=String(v??'');if(/^[=+@\t\r-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 download('\ufeff'+[reportHeaders,...reportRows].map(row=>row.map(csvCell).join(',')).join('\r\n'),'report-'+reportKind+'-'+el('report-from').value+'-'+el('report-to').value+'.csv','text/csv;charset=utf-8');
};
el('report-print').onclick=()=>window.print();
})();
