/* Review compares live local movements against the approved source totals. */
function renderVerifiedReview(){
 const panel=$('#verified-review'),a=SalesModel.verifiedAudit(state);panel.hidden=!a;if(!a)return;
 $('#verified-status').textContent=a.matches?'مطابق للمصدر':'توجد فروق تحتاج مراجعة';$('#verified-status').className='badge '+(a.matches?'green':'red');
 $('#verified-note').textContent='الفترة '+a.from+' إلى '+a.to+' • رصيد أول المدة محفوظ كما كان، وكذلك الأهداف وحدود المديونية والمناديب. المرتجعات لم تُستورد بعد؛ المديونية وصافي المبيعات مؤقتان لحين إضافتها. التوريد للخزينة لا يخفض المديونية مرة ثانية.';
 $('#verified-rows').innerHTML=a.rows.map(x=>`<tr><td>${escape(state.reps.find(r=>r.id===x.rep)?.name||x.name)}</td><td>${x.actual.invoiceCount} / ${x.invoiceCount}</td><td>${money(x.actual.sales)}</td><td>${money(x.sales)}</td><td>${money(x.actual.collection)}</td><td>${money(x.collection)}</td><td>${money(x.actual.treasury)}</td><td>${money(x.treasury)}</td><td><span class="badge ${x.matches?'green':'red'}">${x.matches?'مطابق':'فرق'}</span></td></tr>`).join('');
 $('#hintdata').textContent='الحركات المعتمدة من ملفي الأمين فقط • أرصدة أول المدة محفوظة • المرتجعات في انتظار الاستيراد • '+a.duplicateCount+' مستند مكرر.';
 const captions=$('#cards').querySelectorAll('article small');if(a.returnsPending){if(captions[0])captions[0].textContent='المبيعات قبل استيراد المرتجعات';if(captions[2])captions[2].textContent='المديونية قبل استيراد المرتجعات'}
}
$('#verified-export').onclick=()=>download(JSON.stringify({review:SalesModel.verifiedAudit(state),coverage:state.dataCoverage,openingBalances:state.reps.map(r=>({id:r.id,name:r.name,opening:r.opening}))},null,2),'verified-source-review.json','application/json');
