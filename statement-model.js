/* Read-only account statements. Amounts remain integer piastres. */
const StatementModel=(()=>{
 const valid=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
 const order=(a,b)=>a.date.localeCompare(b.date)||String(a.reference||a.voucherNumber||'').localeCompare(String(b.reference||b.voucherNumber||''),'en',{numeric:true})||a.id.localeCompare(b.id);
 function build(s,repId,kind,from,to){
  const rep=s.reps.find(r=>r.id===repId);if(!rep||!['sales','cash'].includes(kind)||!valid(from)||!valid(to)||from>to)throw Error('اختر المندوب وفترة صحيحة من تاريخ إلى تاريخ');
  let opening,source;
  if(kind==='sales'){source=s.transactions.filter(t=>!t.cancelled&&t.rep===repId);opening=rep.opening+source.filter(t=>t.date<from).reduce((n,t)=>n+(t.type==='sale'?t.amount:-t.amount),0)}
  else{const accounts=(s.cashAccounts||[]).filter(a=>a.rep===repId);if(!accounts.length)throw Error('لم يُستورد كشف نقدية لهذا المندوب بعد');if(accounts.some(a=>a.openingDate>from))throw Error('بداية كشف النقدية المتاحة: '+accounts.map(a=>a.openingDate).sort().at(-1)+'؛ اختر بداية الفترة من هذا التاريخ');source=(s.cashEntries||[]).filter(t=>!t.cancelled&&t.rep===repId);opening=accounts.reduce((n,a)=>n+a.openingCashPiastres,0)+source.filter(t=>t.date<from).reduce((n,t)=>n+(t.kind==='collection'?t.amountPiastres:-t.amountPiastres),0)}
  let balance=opening;const totals={sales:0,returns:0,collections:0,treasury:0};const rows=source.filter(t=>t.date>=from&&t.date<=to).slice().sort(order).map(t=>{
   const cash=kind==='cash',sale=!cash&&t.type==='sale'?t.amount:0,returned=!cash&&['return','discount'].includes(t.type)?t.amount:0,collection=(cash?t.kind==='collection':['collection','debt','collection_pending'].includes(t.type))?(cash?t.amountPiastres:t.amount):0,treasury=cash&&t.kind==='treasury'?t.amountPiastres:0;
   balance+=cash?collection-treasury:sale-returned-collection;totals.sales+=sale;totals.returns+=returned;totals.collections+=collection;totals.treasury+=treasury;
   return{id:t.id,date:t.date,reference:cash?t.voucherNumber:t.reference,origin:cash?t.receiptNumber:t.document?.invoiceNumber||t.document?.originNumber||'',originKind:cash?t.originKind:t.document?.originKind||(sale?'invoice':''),description:cash?(t.kind==='collection'?'تحصيل من العملاء إلى خزينة المندوب':'توريد من خزينة المندوب إلى الخزينة الرئيسية'):(t.type==='sale'?'مبيعات':t.type==='return'?'مرتجع':t.type==='discount'?'خصم':'تحصيل من العملاء'),note:cash?'حساب النقدية '+t.account:t.note||'',sales:sale,returns:returned,collections:collection,treasury,balance};
  });return{rep,kind,from,to,opening,closing:balance,totals,rows};
 }
 return{build};
})();
