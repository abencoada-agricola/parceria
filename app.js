const $=s=>document.querySelector(s), money=v=>(v/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const records=REPORT.records,sum=(a,k)=>a.reduce((s,r)=>s+r[k],0),byType=t=>records.filter(r=>r.category===t),expenses=byType('Despesas'),payments=byType('Depósitos de Leonardo'),shares=byType('Parte de Pedro nos recebimentos'),interest=sum(byType('Juros'),'plus'),plus=sum(records,'plus'),minus=sum(records,'minus');
const escapeHTML=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

for(const [id,v] of Object.entries({'final-value':REPORT.final,'initial-value':REPORT.initial,'increase-value':REPORT.final-REPORT.initial,'sum-start':REPORT.initial,'sum-plus':plus,'sum-minus':minus}))$('#'+id).textContent=money(v);
const steps=[['Início','Dívida que já existia','No início de 2026',REPORT.initial],['+','Despesas da metade de Leonardo','Janeiro a setembro',sum(expenses,'plus')],['+','Juros','Janeiro a setembro',interest],['+','Metade de Pedro nos recebimentos da usina','Inclui o depósito de 13/10/2026',sum(shares,'plus')],['−','Leonardo já depositou para Pedro','Três depósitos de agosto',minus]];
$('#steps').innerHTML=steps.map(([sign,label,desc,v])=>`<div class="step ${sign==='−'?'minus':sign==='='?'final':''}"><span class="step-symbol" style="font-size:${sign==='Início'?8:17}px">${sign}</span><span class="step-label">${label}<small>${desc}</small></span><span class="step-value">${money(v)}</span></div>`).join('');

const groups={};expenses.forEach(r=>{const name=r.description.replace(' - 50% - Leonardo','');groups[name]=(groups[name]||0)+r.plus;});const sorted=Object.entries(groups).sort((a,b)=>b[1]-a[1]);$('#expense-total').textContent=money(sum(expenses,'plus'));$('#expense-bars').innerHTML=sorted.map(([name,v])=>`<div class="expense-row"><div><span>${escapeHTML(name)}</span><b>${money(v)}</b></div><div class="expense-track"><div class="expense-fill" style="width:${v/sorted[0][1]*100}%"></div></div></div>`).join('');

const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function renderLedger(){const q=normalize($('#search').value.trim()),t=$('#filter-type').value,list=records.filter(r=>(t==='all'||r.category===t)&&(!q||normalize(r.description).includes(q)));$('#ledger').innerHTML=list.map(r=>`<tr><td>${r.date}</td><td>${escapeHTML(r.description)}</td><td>${r.category}</td><td class="number">${r.plus?money(r.plus):'—'}</td><td class="number">${r.minus?money(r.minus):'—'}</td></tr>`).join('');$('#ledger-total').innerHTML=`<tr><td colspan="3">Total dos itens mostrados</td><td class="number">${money(sum(list,'plus'))}</td><td class="number">${money(sum(list,'minus'))}</td></tr>`;$('#table-status').textContent=`${list.length} de ${records.length} itens do acerto`;$('#empty').hidden=!!list.length;}
$('#search').oninput=renderLedger;$('#filter-type').onchange=renderLedger;$('#clear').onclick=()=>{$('#search').value='';$('#filter-type').value='all';renderLedger();};renderLedger();$('#print').onclick=()=>{document.querySelectorAll('details').forEach(d=>d.open=true);window.print();};

// Continuous report: every explanation stays visible.
document.querySelectorAll('details').forEach(d=>d.open=true);
$('#print').onclick=()=>window.print();

const spending=REPORT.expenseItems,monthNames=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro'];
monthNames.forEach((name,i)=>{const o=document.createElement('option');o.value=i;o.textContent=name;$('#expense-period').append(o);});
function renderSpending(){const q=normalize($('#expense-query').value.trim()),period=$('#expense-period').value,all=period==='all';const list=spending.filter(r=>(!q||normalize(r.description).includes(q))&&(all||r.months[+period]!==0)).map(r=>{const total=all?r.total:r.months[+period];const pedro=all?r.pedro:Math.round(total/2);return {...r,total,pedro,leonardo:all?r.leonardo:total-pedro};});
const totals={total:sum(list,'total'),pedro:sum(list,'pedro'),leonardo:sum(list,'leonardo')};for(const k of ['total','pedro','leonardo'])$('#detail-'+k).textContent=money(totals[k]);
$('#expense-share-note').textContent=all?'As partes de cada parceiro seguem a planilha. No total de janeiro a setembro, os arredondamentos deixam R$ 0,21 a mais na parte de Pedro.':'Neste mês, as partes de cada um são calculadas em 50% por item, com ajuste de centavos. A planilha informa as partes de cada parceiro somente no total de janeiro a setembro.';
$('#expense-count').textContent=`${list.length} itens encontrados · ${all?'Janeiro a setembro':monthNames[+period]}${q?' · Busca: '+$('#expense-query').value:''}`;
$('#expense-items').innerHTML=list.map(r=>`<tr><td>${escapeHTML(r.description)}</td><td class="number">${money(r.total)}</td><td class="number">${money(r.pedro)}</td><td class="number">${money(r.leonardo)}</td></tr>`).join('');$('#expense-items-total').innerHTML=`<tr><td>Total dos itens mostrados</td><td class="number">${money(totals.total)}</td><td class="number">${money(totals.pedro)}</td><td class="number">${money(totals.leonardo)}</td></tr>`;$('#expense-no-results').hidden=!!list.length;
const subset=spending.filter(r=>!q||normalize(r.description).includes(q)),monthly=monthNames.map((_,i)=>subset.reduce((n,r)=>n+r.months[i],0)),max=Math.max(...monthly,1);
$('#expense-month-chart').innerHTML=monthly.map((v,i)=>`<button class="spending-month ${period===String(i)?'selected':''}" data-expense-month="${i}" aria-pressed="${period===String(i)}" aria-label="${monthNames[i]}: ${money(v)}"><span>${monthNames[i].slice(0,3)}</span><span class="spending-track"><span style="width:${Math.max(0,v/max*100)}%"></span></span><b>${money(v)}</b></button>`).join('');document.querySelectorAll('[data-expense-month]').forEach(b=>b.onclick=()=>{$('#expense-period').value=b.dataset.expenseMonth;renderSpending();});}
$('#expense-query').oninput=renderSpending;$('#expense-period').onchange=renderSpending;$('#expense-reset').onclick=()=>{$('#expense-query').value='';$('#expense-period').value='all';renderSpending();};renderSpending();

// Print the complete report even when on-screen searches are active.
let printFilters=null;
window.addEventListener('beforeprint',()=>{printFilters={query:$('#expense-query').value,period:$('#expense-period').value,search:$('#search').value,type:$('#filter-type').value};$('#expense-query').value='';$('#expense-period').value='all';$('#search').value='';$('#filter-type').value='all';renderSpending();renderLedger();});
window.addEventListener('afterprint',()=>{if(!printFilters)return;$('#expense-query').value=printFilters.query;$('#expense-period').value=printFilters.period;$('#search').value=printFilters.search;$('#filter-type').value=printFilters.type;renderSpending();renderLedger();printFilters=null;});

$('#logout').onclick=()=>{sessionStorage.removeItem('parceria-login');location.replace('login.html');};
