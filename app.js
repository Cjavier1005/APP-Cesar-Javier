// Demo 20.9: Visuales en tarjeta "banco" como Total Recaudado (flechas, colores, ocultar ceros)
const LS_KEY='demo20_9_Data';
const DEFAULT_CONFIG={cuotaReunion:4, cuotaMensual:25, meses:['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'], mesesReuniones:['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'], mesesMensualidades:['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']};
const state={config:{...DEFAULT_CONFIG}, personas:[], familias:[], pagosReuniones:[], pagosMensualidades:[], deudas:[], gastos:[], extras:[], edit:{persona:null,familia:null,deuda:null,gasto:null,extra:null}, saldoManual:0, saldoBloqueado:false};
const $=s=>document.querySelector(s);
const fmt=n=>Number(n||0).toLocaleString('es-EC',{minimumFractionDigits:2,maximumFractionDigits:2});
const todayISO=()=>new Date().toISOString().slice(0,10);
const toDMY=iso=>{ if(!iso) return ''; const [y,m,d]=iso.split('-'); return `${d?.padStart(2,'0')}/${m?.padStart(2,'0')}/${y}`; }
const parseFecha=(v)=>{ if(!v) return ''; if(/\d{2}\/\d{2}\/\d{4}/.test(v)){ const [d,m,y]=v.split('/'); return `${y}-${m}-${d}`; } if(/\d{4}-\d{2}-\d{2}/.test(v)) return v; return ''; }
function showToast(msg,type='ok'){ const stack=$('#toastStack'); if(!stack) return; const el=document.createElement('div'); el.className='toast'+(type==='warn'?' warn':type==='err'?' err':''); el.textContent=msg; stack.appendChild(el); setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(10px)'; setTimeout(()=>el.remove(),200); }, 2000); }
function save(){ localStorage.setItem(LS_KEY,JSON.stringify(state)); renderAll(); }
function load(){ const raw=localStorage.getItem(LS_KEY); if(raw){ try{ Object.assign(state,JSON.parse(raw)); }catch{} } if(!state.config.mesesReuniones) state.config.mesesReuniones=[...state.config.meses]; if(!state.config.mesesMensualidades) state.config.mesesMensualidades=[...state.config.meses]; renderAll(); }

function renderSelects(){ $('#reunionPersona').innerHTML=state.personas.map(p=>`<option value="${p.id}">${p.nombre}</option>`).join(''); $('#reunionMes').innerHTML=state.config.mesesReuniones.map(m=>`<option>${m}</option>`).join(''); $('#mensualFamilia').innerHTML=state.familias.map(f=>`<option value="${f.id}">${f.nombre}</option>`).join(''); $('#mensualMes').innerHTML=state.config.mesesMensualidades.map(m=>`<option>${m}</option>`).join(''); const sm=$('#saldoManual'); const cb=$('#saldoLock'); if(sm&&cb){ sm.value=state.saldoManual||0; cb.checked=!!state.saldoBloqueado; sm.disabled=cb.checked; } }

function renderPersonas(){ const tb=$('#tablaPersonas tbody'); if(!tb) return; tb.innerHTML=''; state.personas.forEach((p,i)=>{ const edit=state.edit.persona===p.id; const tr=document.createElement('tr'); if(edit){ tr.innerHTML=`<td>${i+1}</td>
  <td class="inline"><input id="perEditNombre" value="${p.nombre}"></td>
  <td class="inline"><input id="perEditCedula" value="${p.cedula||''}"></td>
  <td class="inline"><input id="perEditCumple" type="date" value="${p.cumple||''}"></td>
  <td><button data-save-per="${p.id}" class="primary"><span class="icon">✔️</span>Guardar</button> <button data-cancel-per><span class="icon">↩️</span>Cancelar</button></td>`; }
  else { tr.innerHTML=`<td>${i+1}</td><td>${p.nombre}</td><td>${p.cedula||''}</td><td>${toDMY(p.cumple)}</td>
  <td><button data-edit-per="${p.id}"><span class="icon">✎</span>Editar</button> <button data-del-per="${p.id}" class="danger"><span class="icon">🗑️</span>Eliminar</button></td>`; }
  tb.appendChild(tr); }); }

function renderFamilias(){ const tb=$('#tablaFamilias tbody'); if(!tb) return; tb.innerHTML=''; state.familias.forEach((f,i)=>{ const edit=state.edit.familia===f.id; const tr=document.createElement('tr'); tr.innerHTML= edit
  ? `<td>${i+1}</td><td class="inline"><input id="famEditNombre" value="${f.nombre}"></td><td><button data-save-fam="${f.id}" class="primary"><span class="icon">✔️</span>Guardar</button> <button data-cancel-fam><span class="icon">↩️</span>Cancelar</button></td>`
  : `<td>${i+1}</td><td>${f.nombre}</td><td><button data-edit-fam="${f.id}"><span class="icon">✎</span>Editar</button> <button data-del-fam="${f.id}" class="danger"><span class="icon">🗑️</span>Eliminar</button></td>`; tb.appendChild(tr); }); }

function renderDeudas(){ const tb=$('#tablaDeudas tbody'); if(!tb) return; tb.innerHTML=''; state.deudas.forEach((d)=>{ const edit=state.edit.deuda===d.id; const tr=document.createElement('tr'); tr.innerHTML= edit
  ? `<td class="inline"><input type="date" id="deuEditFecha" value="${d.fechaISO||todayISO()}"></td>
     <td class="inline"><input id="deuEditNombre" value="${d.nombre||''}"></td>
     <td class="inline"><input type="number" step="0.01" id="deuEditValor" value="${Number(d.valor||0)}"></td>
     <td><button data-save-deu="${d.id}" class="primary"><span class="icon">✔️</span>Guardar</button> <button data-cancel-deu><span class="icon">↩️</span>Cancelar</button></td>`
  : `<td>${toDMY(d.fechaISO)}</td><td>${d.nombre}</td><td>${fmt(d.valor)}</td>
     <td><button data-edit-deu="${d.id}"><span class="icon">✎</span>Editar</button> <button data-del-deu="${d.id}" class="danger"><span class="icon">🗑️</span>Eliminar</button></td>`; tb.appendChild(tr); }); const total=state.deudas.reduce((a,b)=>a+Number(b.valor||0),0); $('#deudaTotalTfoot').textContent=`$ ${fmt(total)}`; }

function renderGastos(){ const tb=$('#tablaGastos tbody'); if(!tb) return; tb.innerHTML=''; state.gastos.forEach((g)=>{ const edit=state.edit.gasto===g.id; const tr=document.createElement('tr'); tr.innerHTML= edit
  ? `<td class="inline"><input type="date" id="gasEditFecha" value="${g.fechaISO||todayISO()}"></td>
     <td class="inline"><input id="gasEditNombre" value="${g.nombre||''}"></td>
     <td class="inline"><input type="number" step="0.01" id="gasEditValor" value="${Number(g.valor||0)}"></td>
     <td><button data-save-gas="${g.id}" class="primary"><span class="icon">✔️</span>Guardar</button> <button data-cancel-gas><span class="icon">↩️</span>Cancelar</button></td>`
  : `<td>${toDMY(g.fechaISO)}</td><td>${g.nombre}</td><td>${fmt(g.valor)}</td>
     <td><button data-edit-gas="${g.id}"><span class="icon">✎</span>Editar</button> <button data-del-gas="${g.id}" class="danger"><span class="icon">🗑️</span>Eliminar</button></td>`; tb.appendChild(tr); }); const total=state.gastos.reduce((a,b)=>a+Number(b.valor||0),0); $('#gastosTotalTfoot').textContent=`$ ${fmt(total)}`; }

function renderExtras(){ const tb=$('#tablaExtras tbody'); if(!tb) return; tb.innerHTML=''; state.extras.forEach((x)=>{ const edit=state.edit.extra===x.id; const tr=document.createElement('tr'); tr.innerHTML= edit
  ? `<td class="inline"><input type="date" id="extEditFecha" value="${x.fechaISO||todayISO()}"></td>
     <td class="inline"><input id="extEditDetalle" value="${x.detalle||''}"></td>
     <td class="inline"><input type="number" step="0.01" id="extEditValor" value="${Number(x.valor||0)}"></td>
     <td><button data-save-ext="${x.id}" class="primary"><span class="icon">✔️</span>Guardar</button> <button data-cancel-ext><span class="icon">↩️</span>Cancelar</button></td>`
  : `<td>${toDMY(x.fechaISO)}</td><td>${x.detalle}</td><td>${fmt(x.valor)}</td>
     <td><button data-edit-ext="${x.id}"><span class="icon">✎</span>Editar</button> <button data-del-ext="${x.id}" class="danger"><span class="icon">🗑️</span>Eliminar</button></td>`; tb.appendChild(tr); }); const total=state.extras.reduce((a,b)=>a+Number(b.valor||0),0); $('#extrasTotalTfoot').textContent=`$ ${fmt(total)}`; }

function renderChecklistReuniones(){ const table=$('#tablaReunionesChecklist'); if(!table) return; const meses=state.config.mesesReuniones; let thead='<thead><tr><th>#</th><th>Persona</th>'+meses.map(m=>`<th>${m}</th>`).join('')+'</tr></thead>'; const rows=state.personas.map((p,i)=>{ let tds=`<td>${i+1}</td><td>${p.nombre}</td>`; meses.forEach(m=>{ const pago=state.pagosReuniones.find(x=>x.personaId===p.id&&x.mes===m); const checked=pago?'checked':''; tds+=`<td><input type="checkbox" data-ckp="${p.id}" data-ckm="${m}" ${checked}></td>`;}); return `<tr>${tds}</tr>`;}); const mesTotals={}; meses.forEach(m=>{ mesTotals[m]=state.pagosReuniones.filter(x=>x.mes===m).reduce((a,b)=>a+Number(b.valor||0),0);}); const tfoot1='<tfoot><tr><th colspan="2" style="text-align:right">Total por mes</th>'+meses.map(m=>`<th>$ ${fmt(mesTotals[m])}</th>`).join('')+'</tr>';
  const sumTotal=Object.values(mesTotals).reduce((a,b)=>a+b,0); const tfoot2=`<tr><th colspan="${2+meses.length}" style="text-align:right">Total general: $ ${fmt(sumTotal)}</th></tr></tfoot>`; table.innerHTML=thead+'<tbody>'+rows.join('')+'</tbody>'+tfoot1+tfoot2; $('#ckInfo').textContent=`Total general: $ ${fmt(sumTotal)} — Personas: ${state.personas.length}`; }

function renderChecklistMensualidades(){ const table=$('#tablaMensualidadesChecklist'); if(!table) return; const meses=state.config.mesesMensualidades; let thead='<thead><tr><th>#</th><th>Familia</th>'+meses.map(m=>`<th>${m}</th>`).join('')+'</tr></thead>'; const rows=state.familias.map((f,i)=>{ let tds=`<td>${i+1}</td><td>${f.nombre}</td>`; meses.forEach(m=>{ const pago=state.pagosMensualidades.find(x=>x.familiaId===f.id&&x.mes===m); const checked=pago?'checked':''; tds+=`<td><input type="checkbox" data-mkp="${f.id}" data-mkm="${m}" ${checked}></td>`;}); return `<tr>${tds}</tr>`;}); const mesTotals={}; meses.forEach(m=>{ mesTotals[m]=state.pagosMensualidades.filter(x=>x.mes===m).reduce((a,b)=>a+Number(b.valor||0),0);}); const tfoot1='<tfoot><tr><th colspan="2" style="text-align:right">Total por mes</th>'+meses.map(m=>`<th>$ ${fmt(mesTotals[m])}</th>`).join('')+'</tr>';
  const sumTotal=Object.values(mesTotals).reduce((a,b)=>a+b,0); const tfoot2=`<tr><th colspan="${2+meses.length}" style="text-align:right">Total general: $ ${fmt(sumTotal)}</th></tr></tfoot>`; table.innerHTML=thead+'<tbody>'+rows.join('')+'</tbody>'+tfoot1+tfoot2; $('#mkInfo').textContent=`Total general: $ ${fmt(sumTotal)} — Familias: ${state.familias.length}`; }

function renderCumplesMes(){ const ul=$('#cumplesMes'); if(!ul) return; const now=new Date(); const month=now.getMonth(); const today=now.getDate(); const list=state.personas.filter(p=>{ if(!p.cumple) return false; const d=new Date(p.cumple); return !isNaN(d)&&d.getMonth()===month; }).map(p=>{ const d=new Date(p.cumple); const dia=d.getDate(); const iso=p.cumple; const tag=(dia===today)?'HOY':(dia>today&&dia<=today+7?'PRÓX.':''); return {nombre:p.nombre,iso,dmY:toDMY(iso),dia,tag}; }).sort((a,b)=>a.dia-b.dia||a.nombre.localeCompare(b.nombre,'es')); ul.innerHTML= list.length? list.map(x=>`<li><span>${x.nombre}</span><span style="display:flex;gap:6px;align-items:center"><strong>${x.dmY}</strong>${x.tag? `<span class="tag ${x.tag==='HOY'?'hoy':'prox'}">${x.tag}</span>`:''}</span></li>`).join('') : '<li><span>No hay cumpleaños este mes</span></li>'; }

function showRow(id, amount, negative){ const row=document.getElementById(id); if(!row) return; row.style.display = amount<=0? 'none' : ''; const strong=row.querySelector('strong'); strong.classList.toggle('neg', !!negative); strong.classList.toggle('pos', !negative); }

function renderResumen(){ const tReu=state.pagosReuniones.reduce((a,b)=>a+Number(b.valor||0),0); const tMen=state.pagosMensualidades.reduce((a,b)=>a+Number(b.valor||0),0); const tExt=state.extras.reduce((a,b)=>a+Number(b.valor||0),0); const tDeu=state.deudas.reduce((a,b)=>a+Number(b.valor||0),0); const tGas=state.gastos.reduce((a,b)=>a+Number(b.valor||0),0);
const row=document.getElementById('banRowGas'); if(row) row.style.display=tGas>0?'':'none';
const tg=document.getElementById('totalGastos'); if(tg) tg.textContent=`$ ${fmt(tGas)}`;
const __banG=document.getElementById('totalGastos'); if(__banG){ __banG.textContent=`$ ${fmt(tGas)}`;}
 const tSal=Number(state.saldoManual||0);
  // Banco (detalles con flechas y ocultar ceros)
  $('#totalReuniones').textContent=`$ ${fmt(tReu)}`; showRow('banRowReu',tReu,false); const a1=$('#banArrowReu'); if(a1) a1.textContent='↑';
  $('#totalMensualidades').textContent=`$ ${fmt(tMen)}`; showRow('banRowMen',tMen,false); const a2=$('#banArrowMen'); if(a2) a2.textContent='↑';
  $('#totalExtras').textContent=`$ ${fmt(tExt)}`; showRow('banRowExt',tExt,false); const a3=$('#banArrowExt'); if(a3) a3.textContent='↑';
  $('#totalDeudas').textContent=`$ ${fmt(tDeu)}`; showRow('banRowDeu',tDeu,true); const a4=$('#banArrowDeu'); if(a4) a4.textContent='↓';
  const salEl=$('#totalSaldoManual'); if(salEl) salEl.textContent=`$ ${fmt(tSal)}`; showRow('banRowSal',tSal,false); const a5=$('#banArrowSal'); if(a5) a5.textContent='↑';
  const totalBanco=(tReu+tMen+tSal+tExt)-tDeu; $('#totalConSaldo').textContent=`$ ${fmt(totalBanco)}`;
const totalRecaudadoBanco=(tReu+tMen+tSal+tExt)-tGas; const trb=document.getElementById('totalRecaudadoBanco'); if(trb) trb.textContent=`$ ${fmt(totalRecaudadoBanco)}`;
  // Total Recaudado
  const recReu=$('#recReuniones'), recMen=$('#recMensualidades'), recExt=$('#recExtras'), recGas=$('#recGastos'); if(recReu) recReu.textContent=`$ ${fmt(tReu)}`; if(recMen) recMen.textContent=`$ ${fmt(tMen)}`; if(recExt) recExt.textContent=`$ ${fmt(tExt)}`; if(recGas) recGas.textContent=`$ ${fmt(tGas)}`; const totalRecaudado=(tReu+tMen+tExt)-tGas; const totalEl=$('#totalRecaudado'); if(totalEl){ totalEl.textContent=`$ ${fmt(totalRecaudado)}`; totalEl.classList.toggle('neg', totalRecaudado<0); totalEl.classList.toggle('pos', totalRecaudado>=0); }
  renderCumplesMes(); }

function renderAll(){ renderSelects(); renderPersonas(); renderFamilias(); renderDeudas(); renderGastos(); renderExtras(); renderChecklistReuniones(); renderChecklistMensualidades(); renderResumen(); }

// Eventos
addEventListener('click',(e)=>{ const t=e.target; if(t.matches('.tabs button')){ document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active')); t.classList.add('active'); document.querySelectorAll('.tab').forEach(s=>s.classList.remove('active')); document.getElementById('tab-'+t.dataset.tab).classList.add('active'); }
  if(t.id==='resetBtn'){ localStorage.removeItem(LS_KEY); location.reload(); }
  if(t.id==='recCopyBtn'){ const tReu=state.pagosReuniones.reduce((a,b)=>a+Number(b.valor||0),0); const tMen=state.pagosMensualidades.reduce((a,b)=>a+Number(b.valor||0),0); const tExt=state.extras.reduce((a,b)=>a+Number(b.valor||0),0); const tGas=state.gastos.reduce((a,b)=>a+Number(b.valor||0),0); const totalRecaudado=(tReu+tMen+tExt)-tGas; const text=`Total Recaudado
Pago Reuniones: $ ${fmt(tReu)}
Pago Mensualidades: $ ${fmt(tMen)}
Extras: $ ${fmt(tExt)}
Gastos: $ ${fmt(tGas)}
Resultado: $ ${fmt(totalRecaudado)}`; if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(()=>showToast('Detalle copiado')); } else { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); showToast('Detalle copiado'); }catch{ showToast('No se pudo copiar','err'); } finally{ ta.remove(); } } return; }
  // Personas
  const ep=t.getAttribute('data-edit-per'); if(ep){ state.edit.persona=ep; renderPersonas(); return; }
  const sp=t.getAttribute('data-save-per'); if(sp){ const p=state.personas.find(x=>x.id===sp); if(p){ const nombre=document.getElementById('perEditNombre').value.trim(); const ced=document.getElementById('perEditCedula').value.trim(); const cum=document.getElementById('perEditCumple').value; if(ced && (!/^\d+$/.test(ced) || ced.length!=10)){ showToast('Cédula inválida (10 dígitos numéricos).','err'); return; } p.nombre=nombre||p.nombre; p.cedula=ced; p.cumple=(cum||'').slice(0,10); state.edit.persona=null; save(); showToast('Guardado'); } return; }
  if(t.hasAttribute('data-cancel-per')){ state.edit.persona=null; renderPersonas(); return; }
  const dp=t.getAttribute('data-del-per'); if(dp){ if(!confirm('¿Seguro que deseas eliminar?')) return; state.personas=state.personas.filter(x=>x.id!==dp); save(); showToast('Eliminado','warn'); return; }
  // Familias
  const ef=t.getAttribute('data-edit-fam'); if(ef){ state.edit.familia=ef; renderFamilias(); return; }
  const sf=t.getAttribute('data-save-fam'); if(sf){ const f=state.familias.find(x=>x.id===sf); if(f){ const nombre=document.getElementById('famEditNombre').value.trim(); if(nombre) f.nombre=nombre; state.edit.familia=null; save(); showToast('Guardado'); } return; }
  if(t.hasAttribute('data-cancel-fam')){ state.edit.familia=null; renderFamilias(); return; }
  const df=t.getAttribute('data-del-fam'); if(df){ if(!confirm('¿Seguro que deseas eliminar?')) return; state.familias=state.familias.filter(x=>x.id!==df); save(); showToast('Eliminado','warn'); return; }
  // Deudas
  const ed=t.getAttribute('data-edit-deu'); if(ed){ state.edit.deuda=ed; renderDeudas(); return; }
  const sd=t.getAttribute('data-save-deu'); if(sd){ const d=state.deudas.find(x=>x.id===sd); if(d){ const fecha=document.getElementById('deuEditFecha').value||todayISO(); const nombre=document.getElementById('deuEditNombre').value.trim(); const valor=Number(document.getElementById('deuEditValor').value||0); d.fechaISO=fecha.slice(0,10); d.nombre=nombre; d.valor=valor; state.edit.deuda=null; save(); showToast('Guardado'); } return; }
  if(t.hasAttribute('data-cancel-deu')){ state.edit.deuda=null; renderDeudas(); return; }
  const dd=t.getAttribute('data-del-deu'); if(dd){ if(!confirm('¿Seguro que deseas eliminar?')) return; state.deudas=state.deudas.filter(x=>x.id!==dd); save(); showToast('Eliminado','warn'); return; }
  // Gastos
  const eg=t.getAttribute('data-edit-gas'); if(eg){ state.edit.gasto=eg; renderGastos(); return; }
  const sg=t.getAttribute('data-save-gas'); if(sg){ const g=state.gastos.find(x=>x.id===sg); if(g){ const fecha=document.getElementById('gasEditFecha').value||todayISO(); const nombre=document.getElementById('gasEditNombre').value.trim(); const valor=Number(document.getElementById('gasEditValor').value||0); g.fechaISO=fecha.slice(0,10); g.nombre=nombre; g.valor=valor; state.edit.gasto=null; save(); showToast('Guardado'); } return; }
  if(t.hasAttribute('data-cancel-gas')){ state.edit.gasto=null; renderGastos(); return; }
  const dg=t.getAttribute('data-del-gas'); if(dg){ if(!confirm('¿Seguro que deseas eliminar?')) return; state.gastos=state.gastos.filter(x=>x.id!==dg); save(); showToast('Eliminado','warn'); return; }
  // Extras
  const ee=t.getAttribute('data-edit-ext'); if(ee){ state.edit.extra=ee; renderExtras(); return; }
  const se=t.getAttribute('data-save-ext'); if(se){ const x=state.extras.find(y=>y.id===se); if(x){ const fecha=document.getElementById('extEditFecha').value||todayISO(); const det=document.getElementById('extEditDetalle').value.trim(); const valor=Number(document.getElementById('extEditValor').value||0); x.fechaISO=fecha.slice(0,10); x.detalle=det; x.valor=valor; state.edit.extra=null; save(); showToast('Guardado'); } return; }
  if(t.hasAttribute('data-cancel-ext')){ state.edit.extra=null; renderExtras(); return; }
  const de=t.getAttribute('data-del-ext'); if(de){ if(!confirm('¿Seguro que deseas eliminar?')) return; state.extras=state.extras.filter(x=>x.id!==de); save(); showToast('Eliminado','warn'); return; }
});

addEventListener('change',(e)=>{ const t=e.target; if(t.id==='saldoLock'){ state.saldoBloqueado=t.checked; const sm=$('#saldoManual'); if(sm){ sm.disabled=t.checked; } save(); showToast(t.checked?'Saldo bloqueado':'Saldo editable'); }
  const pId=t.getAttribute && t.getAttribute('data-ckp'); const mes=t.getAttribute && t.getAttribute('data-ckm'); if(pId && mes){ if(t.checked){ const exists=state.pagosReuniones.find(x=>x.personaId===pId&&x.mes===mes); if(!exists){ state.pagosReuniones.push({id:crypto.randomUUID(),fechaISO:todayISO(),personaId:pId,mes,valor:Number(state.config.cuotaReunion)||4}); } } else { state.pagosReuniones=state.pagosReuniones.filter(x=>!(x.personaId===pId&&x.mes===mes)); } save(); showToast('Guardado'); }
  const fId=t.getAttribute && t.getAttribute('data-mkp'); const mes2=t.getAttribute && t.getAttribute('data-mkm'); if(fId && mes2){ if(t.checked){ const exists=state.pagosMensualidades.find(x=>x.familiaId===fId&&x.mes===mes2); if(!exists){ state.pagosMensualidades.push({id:crypto.randomUUID(),fechaISO:todayISO(),familiaId:fId,mes:mes2,valor:Number(state.config.cuotaMensual)||25}); } } else { state.pagosMensualidades=state.pagosMensualidades.filter(x=>!(x.familiaId===fId&&x.mes===mes2)); } save(); showToast('Guardado'); }
});

// Formularios crear
$('#personaForm')?.addEventListener('submit',e=>{ e.preventDefault(); const nombre=$('#personaNombre').value.trim(); const ced=$('#personaCedula').value.trim(); const cum=$('#personaCumple').value; if(ced && (!/^\d+$/.test(ced) || ced.length!=10)){ showToast('Cédula inválida (10 dígitos numéricos).','err'); return; } state.personas.push({id:crypto.randomUUID(),nombre,cedula:ced,cumple:(cum||'').slice(0,10)}); e.target.reset(); save(); showToast('Guardado'); });
$('#familiaForm')?.addEventListener('submit',e=>{ e.preventDefault(); const nombre=$('#familiaNombre').value.trim(); if(!nombre) return; state.familias.push({id:crypto.randomUUID(),nombre}); e.target.reset(); save(); showToast('Guardado'); });
$('#reunionForm')?.addEventListener('submit',e=>{ e.preventDefault(); state.pagosReuniones.push({id:crypto.randomUUID(),fechaISO:todayISO(),personaId:$('#reunionPersona').value,mes:$('#reunionMes').value,valor:Number($('#reunionValor').value||0)}); e.target.reset(); save(); showToast('Guardado'); });
$('#mensualForm')?.addEventListener('submit',e=>{ e.preventDefault(); state.pagosMensualidades.push({id:crypto.randomUUID(),fechaISO:todayISO(),familiaId:$('#mensualFamilia').value,mes:$('#mensualMes').value,valor:Number($('#mensualValor').value||0)}); e.target.reset(); save(); showToast('Guardado'); });
$('#deudaForm')?.addEventListener('submit',e=>{ e.preventDefault(); state.deudas.push({id:crypto.randomUUID(),fechaISO:($('#deudaFecha').value||todayISO()),nombre:$('#deudaNombre').value.trim(),valor:Number($('#deudaValor').value||0)}); e.target.reset(); save(); showToast('Guardado'); });
$('#gastoForm')?.addEventListener('submit',e=>{ e.preventDefault(); state.gastos.push({id:crypto.randomUUID(),fechaISO:($('#gastoFecha').value||todayISO()),nombre:$('#gastoNombre').value.trim(),valor:Number($('#gastoValor').value||0)}); e.target.reset(); save(); showToast('Guardado'); });
$('#extraForm')?.addEventListener('submit',e=>{ e.preventDefault(); state.extras.push({id:crypto.randomUUID(),fechaISO:todayISO(),detalle:$('#extraInvitado').value.trim(),valor:Number($('#extraValor').value||0)}); e.target.reset(); save(); showToast('Guardado'); });

$('#saldoManual')?.addEventListener('input',e=>{ if(state.saldoBloqueado){ e.target.value=state.saldoManual; return;} state.saldoManual=Number(e.target.value||0); localStorage.setItem(LS_KEY,JSON.stringify(state)); renderResumen(); });

// CONFIG
$('#guardarCfg')?.addEventListener('click',()=>{ const cr=Number($('#cfgCuotaReunion').value||state.config.cuotaReunion); const cm=Number($('#cfgCuotaMensual').value||state.config.cuotaMensual); const reuTxt=$('#cfgMesesReu').value.trim(); const menTxt=$('#cfgMesesMen').value.trim(); state.config={cuotaReunion:cr, cuotaMensual:cm, meses:state.config.meses, mesesReuniones: reuTxt? reuTxt.split(',').map(x=>x.trim()).filter(Boolean): state.config.mesesReuniones, mesesMensualidades: menTxt? menTxt.split(',').map(x=>x.trim()).filter(Boolean): state.config.mesesMensualidades}; save(); showToast('Configuración guardada'); });

// EXPORT / IMPORT
function buildSheet(data, headers){ const ws = XLSX.utils.json_to_sheet(data, {header:headers, skipHeader:false}); return ws; }
function downloadWorkbook(){ const wb=XLSX.utils.book_new();
  const personas=state.personas.map(p=>({Nombre:p.nombre,Cedula:p.cedula||'',Cumpleanos:toDMY(p.cumple)}));
  const familias=state.familias.map(f=>({Familia:f.nombre}));
  const reu=state.pagosReuniones.map(x=>({Fecha:x.fechaISO, Persona:(state.personas.find(p=>p.id===x.personaId)?.nombre||''), Mes:x.mes, Valor:x.valor}));
  const men=state.pagosMensualidades.map(x=>({Fecha:x.fechaISO, Familia:(state.familias.find(f=>f.id===x.familiaId)?.nombre||''), Mes:x.mes, Valor:x.valor}));
  const deu=state.deudas.map(x=>({Fecha:toDMY(x.fechaISO), Nombre:x.nombre, Valor:x.valor}));
  const gas=state.gastos.map(x=>({Fecha:toDMY(x.fechaISO), Nombre:x.nombre, Valor:x.valor}));
  const ext=state.extras.map(x=>({Fecha:toDMY(x.fechaISO), Detalle:x.detalle, Valor:x.valor}));
  const cfg=[{CuotaReunion:state.config.cuotaReunion, CuotaMensualidad:state.config.cuotaMensual, Meses:state.config.meses.join(', ')}];
  XLSX.utils.book_append_sheet(wb, buildSheet(personas,['Nombre','Cedula','Cumpleanos']), 'Personas');
  XLSX.utils.book_append_sheet(wb, buildSheet(familias,['Familia']), 'Familias');
  XLSX.utils.book_append_sheet(wb, buildSheet(reu,['Fecha','Persona','Mes','Valor']), 'Reuniones');
  XLSX.utils.book_append_sheet(wb, buildSheet(men,['Fecha','Familia','Mes','Valor']), 'Mensualidades');
  XLSX.utils.book_append_sheet(wb, buildSheet(deu,['Fecha','Nombre','Valor']), 'Deudas');
  XLSX.utils.book_append_sheet(wb, buildSheet(gas,['Fecha','Nombre','Valor']), 'Gastos');
  XLSX.utils.book_append_sheet(wb, buildSheet(ext,['Fecha','Detalle','Valor']), 'Extras');
  XLSX.utils.book_append_sheet(wb, buildSheet(cfg,['CuotaReunion','CuotaMensual','Meses']), 'Config');
  XLSX.writeFile(wb, 'reuniones-demo20-9.xlsx'); showToast('Archivo Excel generado');
}
function handleImport(file){ const reader=new FileReader(); reader.onload=(e)=>{ const data=new Uint8Array(e.target.result); const wb=XLSX.read(data,{type:'array'});
  const wsP=wb.Sheets['Personas']; if(wsP){ const arr=XLSX.utils.sheet_to_json(wsP,{defval:''}); state.personas = arr.map(r=>({id:crypto.randomUUID(), nombre:r.Nombre||'', cedula:String(r.Cedula||'').trim(), cumple: parseFecha(String(r.Cumpleanos||'')) })).filter(x=>x.nombre); }
  const wsF=wb.Sheets['Familias']; if(wsF){ const arr=XLSX.utils.sheet_to_json(wsF,{defval:''}); state.familias = arr.map(r=>({id:crypto.randomUUID(), nombre:r.Familia||''})).filter(x=>x.nombre); }
  const wsR=wb.Sheets['Reuniones']; if(wsR){ const arr=XLSX.utils.sheet_to_json(wsR,{defval:''}); state.pagosReuniones = arr.filter(r=>r.Persona && r.Mes).map(r=>{ const persona=state.personas.find(p=>p.nombre===r.Persona); return {id:crypto.randomUUID(), fechaISO: parseFecha(String(r.Fecha||todayISO()))||todayISO(), personaId: persona? persona.id: '', mes: String(r.Mes||''), valor: Number(r.Valor||0)}; }).filter(x=>x.personaId); }
  const wsM=wb.Sheets['Mensualidades']; if(wsM){ const arr=XLSX.utils.sheet_to_json(wsM,{defval:''}); state.pagosMensualidades = arr.filter(r=>r.Familia && r.Mes).map(r=>{ const fam=state.familias.find(f=>f.nombre===r.Familia); return {id:crypto.randomUUID(), fechaISO: parseFecha(String(r.Fecha||todayISO()))||todayISO(), familiaId: fam? fam.id: '', mes: String(r.Mes||''), valor: Number(r.Valor||0)}; }).filter(x=>x.familiaId); }
  const wsD=wb.Sheets['Deudas']; if(wsD){ const arr=XLSX.utils.sheet_to_json(wsD,{defval:''}); state.deudas = arr.filter(r=>r.Nombre).map(r=>({id:crypto.randomUUID(), fechaISO: parseFecha(String(r.Fecha||todayISO()))||todayISO(), nombre:String(r.Nombre||'').trim(), valor:Number(r.Valor||0)})); }
  const wsG=wb.Sheets['Gastos']; if(wsG){ const arr=XLSX.utils.sheet_to_json(wsG,{defval:''}); state.gastos = arr.filter(r=>r.Nombre).map(r=>({id:crypto.randomUUID(), fechaISO: parseFecha(String(r.Fecha||todayISO()))||todayISO(), nombre:String(r.Nombre||'').trim(), valor:Number(r.Valor||0)})); }
  const wsE=wb.Sheets['Extras']; if(wsE){ const arr=XLSX.utils.sheet_to_json(wsE,{defval:''}); state.extras = arr.filter(r=>r.Detalle).map(r=>({id:crypto.randomUUID(), fechaISO: parseFecha(String(r.Fecha||todayISO()))||todayISO(), detalle:String(r.Detalle||'').trim(), valor:Number(r.Valor||0)})); }
  const wsC=wb.Sheets['Config']; if(wsC){ const arr=XLSX.utils.sheet_to_json(wsC,{defval:''}); if(arr[0]){ const cr=Number(arr[0].CuotaReunion||state.config.cuotaReunion); const cm=Number(arr[0].CuotaMensualidad||state.config.cuotaMensual); const meses= String(arr[0].Meses||'').split(',').map(x=>x.trim()).filter(Boolean); state.config={cuotaReunion:cr, cuotaMensual:cm, meses: meses.length? meses: state.config.meses}; } }
  save(); showToast('Importación realizada'); };
  reader.readAsArrayBuffer(file); }

$('#exportBtn')?.addEventListener('click',downloadWorkbook);
$('#fileInput')?.addEventListener('change',e=>{ const f=e.target.files?.[0]; if(f) handleImport(f); });

window.addEventListener('DOMContentLoaded',load);

function switchTab(tab){document.querySelectorAll('[data-tab]').forEach(s=>s.style.display='none');document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));const sec=document.querySelector('[data-tab=+tab+]');if(sec){sec.style.display='block';sec.classList.add('active-module');}const btn=document.querySelector('.tabs button[data-tab=+tab+]');if(btn){btn.classList.add('active');}window.scrollTo(0,0);}
// === PATCH BLOQUEO POR MES (EXTENSION SEGURA) ===
if(!state.bloqueosMeses){ state.bloqueosMeses={reuniones:{}, mensualidades:{}}; }
const _renderReu = renderChecklistReuniones;
const _renderMen = renderChecklistMensualidades;
function _isLocked(t,m){ return !!state.bloqueosMeses[t][m]; }

renderChecklistReuniones = function(){ _renderReu(); const t=document.querySelector('#tablaReunionesChecklist thead'); if(!t) return; const meses=state.config.mesesReuniones||[]; const tr=document.createElement('tr'); tr.className='tr-lock'; tr.innerHTML='<th colspan="2">🔒 Bloquear mes</th>'+meses.map(m=>`<th><input type="checkbox" data-lock="reuniones" data-mes="${m}" ${_isLocked('reuniones',m)?'checked':''}></th>`).join(''); t.appendChild(tr);
 document.querySelectorAll('#tablaReunionesChecklist input[data-ckm]').forEach(i=>{ if(_isLocked('reuniones',i.getAttribute('data-ckm'))) i.disabled=true; }); }

renderChecklistMensualidades = function(){ _renderMen(); const t=document.querySelector('#tablaMensualidadesChecklist thead'); if(!t) return; const meses=state.config.mesesMensualidades||[]; const tr=document.createElement('tr'); tr.className='tr-lock'; tr.innerHTML='<th colspan="2">🔒 Bloquear mes</th>'+meses.map(m=>`<th><input type="checkbox" data-lock="mensualidades" data-mes="${m}" ${_isLocked('mensualidades',m)?'checked':''}></th>`).join(''); t.appendChild(tr);
 document.querySelectorAll('#tablaMensualidadesChecklist input[data-mkm]').forEach(i=>{ if(_isLocked('mensualidades',i.getAttribute('data-mkm'))) i.disabled=true; }); }

addEventListener('change',e=>{
 const t=e.target; const tipo=t.getAttribute('data-lock'); const mes=t.getAttribute('data-mes');
 if(tipo && mes){ state.bloqueosMeses[tipo][mes]=t.checked; save(); showToast(t.checked?'Mes bloqueado':'Mes desbloqueado','warn'); }
});

// === ANDROID BOTTOM NAV ===
document.querySelectorAll('.bottom-nav button').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const tab = btn.dataset.tab;

    document.querySelectorAll('.tabs button').forEach(b=>{
      b.classList.toggle('active', b.dataset.tab === tab);
    });

    document.querySelectorAll('.tab').forEach(sec=>{
      sec.classList.toggle('active', sec.id === 'tab-'+tab);
    });

    window.scrollTo(0,0);
  });
});
