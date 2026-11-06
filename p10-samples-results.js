/* ===== p10: العينات والنتائج الكاملة + معاينة الحساب + إنشاء مسودات المطالبات ===== */
let SF={q:'',br:'',lab:'',st:'',d1:'',d2:''},SAMPS=[],LABN={},OFF=null;
const SBORD={pending:'var(--wn)',pass:'var(--ok)',fail:'var(--er)'};
async function myOff(){if(OFF)return OFF;const{data}=await sb.from('branch_claim_assignments').select('*').eq('user_id',me.id),t=today();OFF=(data||[]).filter(a=>a.is_primary||(a.valid_from<=t&&t<=a.valid_to)).map(a=>a.branch_id);return OFF}
const canMk=async b=>['gm','ctl'].includes(me.role)||(await myOff()).includes(b);
function sList(){const f=SF,q=f.q.trim().toLowerCase();const L=SAMPS.filter(s=>{const fa=s.facilities||{};
  if(q&&!((s.code||'')+' '+(fa.name||'')+' '+(fa.address||'')).toLowerCase().includes(q))return false;
  if(f.br&&String(fa.branch_id)!==f.br)return false;if(f.lab&&String(s.lab_id)!==f.lab)return false;if(f.st&&s.status!==f.st)return false;
  if(f.d1&&s.collected_on<f.d1)return false;if(f.d2&&s.collected_on>f.d2)return false;return true});
 return`<div class="m" style="margin:6px 0">${L.length} عينة</div>`+L.map(s=>`<div class="row" onclick="go('res','${s.id}')" style="border-inline-start:5px solid ${SBORD[s.status]};padding-inline-start:8px"><b>${esc(s.code)}</b> <span class="tag ${ST[s.status][1]}">${ST[s.status][0]}</span><br><span class="m">${esc(s.facilities&&s.facilities.name)}، ${esc((s.facilities&&s.facilities.address)||'-')}<br>${s.collected_on}، ${esc(LABN[s.lab_id]||'-')}، ${esc(s.sample_type||'')}</span></div>`).join('')||'<span class="m">لا توجد عينات مطابقة</span>'}
function sfSet(k,v){SF[k]=v;$('#sl').innerHTML=sList()}
async function evalStatus(sid,status,reason){const{error}=await sb.from('samples').update({status,status_manual_reason:reason||null}).eq('id',sid);if(error)throw error}
const PK={BOD:'bod',TSS:'tss',COD:'cod',OG:'og'};
const lastRes=x=>(x.lab_results||[]).slice().sort((a,b)=>String(b.received_on).localeCompare(String(a.received_on)))[0];
async function planClaims(sid){
 const{data:s,error}=await sb.from('samples').select('id,code,inspection_id,facility_id,collected_on,facilities(id,name,branch_id,monthly_water_m3)').eq('id',sid).single();if(error)throw error;
 const f=s.facilities,warn=[],items=[];let S=[{id:s.id,code:s.code,collected_on:s.collected_on}];
 if(s.inspection_id)S=((await sb.from('samples').select('id,code,collected_on,lab_results(*)').eq('inspection_id',s.inspection_id)).data||[]);else{const{data}=await sb.from('samples').select('id,code,collected_on,lab_results(*)').eq('id',sid);S=data||[]}
 const ev=S.map(x=>({id:x.id,code:x.code,d:x.collected_on,r:lastRes(x)})).filter(x=>x.r);if(!ev.length)return{s,f,warn:['لا توجد نتائج محفوظة بعد'],items,conf:null};
 const vals=r=>({bod:r.bod,cod:r.cod,tss:r.tss,og:r.og,ph:r.ph}),conf=ev.every(x=>!evalV(vals(x.r)).length),mx={},ref={};
 ['bod','cod','tss','og'].forEach(k=>ev.forEach(x=>{const v=x.r[k];if(v!=null&&(mx[k]==null||+v>+mx[k])){mx[k]=+v;ref[k]=x}}));
 let phd=-1;ev.forEach(x=>{const p=x.r.ph;if(p==null)return;const d=Math.max(+LIM.pH.min_value-p,p-+LIM.pH.max_value);if(d>phd||mx.ph==null){phd=d;mx.ph=+p;ref.ph=x}});
 const refS=(ref.bod||ref.cod||ref.tss||ref.og||ev[0]),x0={inspection_id:s.inspection_id||null,sample_id:refS.id};
 if(conf||+FEE.analysis_for_fail===1){if(!(+FEE.analysis_cost>0))warn.push('تكلفة تحليل العينة غير محددة في الإعدادات');else items.push({type:'analysis_cost',lines:ev.map(x=>({description:'تحليل عينة '+x.code+' (جمع '+x.d+')',amount:+FEE.analysis_cost})),extra:x0})}
 const w=(f.monthly_water_m3||0)*FEE.discharge_pct/100;
 if(!(w>0))warn.push('لا يوجد استهلاك مسجل للمنشأة: لا تُنشأ مسودة أعباء (تنبيه لمسؤول الفرع)');
 else{const c=calcB(mx,w,conf);if(c.L.length)items.push({type:'treatment_burden',lines:c.L.map(l=>({description:l.p+(PK[l.p]&&ref[PK[l.p]]?' — عينة '+ref[PK[l.p]].code:''),measured:l.v===''?null:l.v,rate:l.rate===''?null:l.rate,months:l.mult===''?null:l.mult,amount:l.val})),extra:x0,total:c.total})}
 if(!conf){const b=evalV(mx),lim={BOD:LIM.BOD.max_value,TSS:LIM.TSS.max_value,COD:LIM.COD.max_value,OG:LIM.OG.max_value,pH:LIM.pH.min_value+'-'+LIM.pH.max_value},mk={BOD:'bod',TSS:'tss',COD:'cod',OG:'og',pH:'ph'};items.push({type:'compliance_notice',lines:b.map(p=>({description:p,measured:mx[mk[p]],amount:0,extra:{limit:lim[p]}})),extra:x0})}
 let eq=sb.from('claims').select('id,status,type').is('deleted_at',null).is('cancelled_on',null);eq=s.inspection_id?eq.eq('inspection_id',s.inspection_id):eq.eq('sample_id',sid);const{data:E}=await eq;
 items.forEach(i=>{const e=(E||[]).find(c=>c.type===i.type);i.exist=e||null;i.sum=r2(i.lines.reduce((a,l)=>a+ +l.amount,0))});
 return{s,f,warn,items,conf,ev}}
async function replaceClaim(c,type,lines){await sb.from('claim_lines').delete().eq('claim_id',c.id);const{error}=await sb.from('claim_lines').insert(lines.map(l=>({claim_id:c.id,...l})));if(error)throw error;
 const sub=r2(lines.reduce((a,l)=>a+ +l.amount,0)),on=type==='treatment_burden'?+FEE.vat_on_treatment===1:type!=='compliance_notice',vat=on?r2(sub*FEE.vat_pct/100):0;
 const{error:e2}=await sb.from('claims').update({subtotal:sub,vat,total:r2(sub+vat),settings_snapshot:{fees:FEE,vat_applied:on}}).eq('id',c.id);if(e2)throw e2}
async function makeClaims(sid,replace,silent){const P=await planClaims(sid);if(!P.items.length){if(!silent)alert('لا توجد مسودات لإنشائها\n'+P.warn.join('\n'));return 0}
 if(!(await canMk(P.f.branch_id))){if(!silent)alert('الإنشاء لمسؤول الفرع أو مدير التحكم أو المدير العام');return 0}
 let n=0;for(const i of P.items){if(i.exist){if(replace&&i.exist.status==='draft'){await replaceClaim(i.exist,i.type,i.lines);n++}continue}
  await mkClaim(i.type,{id:P.f.id,branch_id:P.f.branch_id},i.lines,i.extra);n++}
 if(!silent)alert('تمت معالجة '+n+' مسودة'+(P.warn.length?'\nتنبيه: '+P.warn.join('، '):''));return n}
async function bulkMk(){try{if(!confirm('إنشاء المسودات لكل العينات التي لها نتائج ولا مسودات لها؟ (لن تُمَس المسودات الموجودة)'))return;
 const{data}=await sb.from('samples').select('id,inspection_id,status').neq('status','pending'),seen=new Set();let n=0;
 for(const s of data||[]){const k=s.inspection_id||s.id;if(seen.has(k))continue;seen.add(k);n+=await makeClaims(s.id,false,true)}alert('أُنشئت '+n+' مسودة');go('cl')}catch(e){err(e)}}
function rcheck(){[['bod','BOD'],['tss','TSS'],['cod','COD'],['og','OG']].forEach(([k,p])=>{const e=$('#r_'+k),m=LIM[p]&&LIM[p].max_value;if(e)e.classList.toggle('bad',e.value!==''&&m!=null&&+e.value>m)});const h=$('#r_ph');if(h&&LIM.pH)h.classList.toggle('bad',h.value!==''&&(+h.value>LIM.pH.max_value||+h.value<LIM.pH.min_value))}
async function saveRes(id){try{const g=k=>{const x=$('#r_'+k).value;return x===''?null:+x},v={temp:g('temp'),ph:g('ph'),bod:g('bod'),cod:g('cod'),tss:g('tss'),og:g('og'),settle10:g('settle10'),settle15:g('settle15')};
 if(Object.values(v).every(x=>x==null))return alert('أدخل قيمة واحدة على الأقل');
 if(Object.values(v).some(x=>x!=null&&(isNaN(x)||x<0)))return alert('قيم غير منطقية: لا تقبل قيماً سالبة');if(v.ph!=null&&v.ph>14)return alert('pH لا يتجاوز 14');
 const d=$('#rd').value||today(),{error}=await sb.from('lab_results').insert({sample_id:id,...v,received_on:d,entered_by:me.id});if(error)throw error;
 const bad=evalV(v);await evalStatus(id,bad.length?'fail':'pass',null);go('rv',id)}catch(e){err(e)}}
async function manualSt(id){try{const st=$('#ms_s').value,w=$('#ms_w').value.trim();if(!w)return alert('اكتب سبب التعديل اليدوي');await evalStatus(id,st,w);go('res',id)}catch(e){err(e)}}
async function redoClaims(id){if(!confirm('سيُستبدل محتوى المسودات الحالية بالحساب الجديد. متابعة؟'))return;try{await makeClaims(id,true);go('rv',id)}catch(e){err(e)}}
Object.assign(R,{
async samp(){const[S,Lb]=await Promise.all([sb.from('samples').select('id,code,status,collected_on,sample_type,lab_id,facilities(name,address,branch_id)').order('collected_on',{ascending:false}).limit(500),sb.from('labs').select('*')]);if(S.error)throw S.error;SAMPS=S.data||[];LABN=Object.fromEntries((Lb.data||[]).map(l=>[l.id,l.name]));
 const o=(a,c)=>a.map(([v,t])=>`<option value="${v}" ${String(v)===String(c)?'selected':''}>${esc(t)}</option>`).join('');
 return`<div class="c"><h3>سجل العينات</h3><input placeholder="بحث بالكود أو المنشأة أو العنوان" value="${esc(SF.q)}" oninput="sfSet('q',this.value)"><div class="g"><select onchange="sfSet('br',this.value)">${o([['','كل الفروع']].concat(BR.map(b=>[b.id,b.name])),SF.br)}</select><select onchange="sfSet('lab',this.value)">${o([['','كل المعامل']].concat((Lb.data||[]).map(l=>[l.id,l.name])),SF.lab)}</select><select onchange="sfSet('st',this.value)">${o([['','كل الحالات'],['pending','في الانتظار'],['pass','مطابقة'],['fail','غير مطابقة']],SF.st)}</select><span></span><input type="date" value="${SF.d1}" onchange="sfSet('d1',this.value)"><input type="date" value="${SF.d2}" onchange="sfSet('d2',this.value)"></div>
 ${['gm','ctl'].includes(me.role)||(await myOff()).length?'<button class="btn s" onclick="bulkMk()">إنشاء مسودات المطالبات لكل النتائج الجاهزة</button>':''}</div><div class="c" id="sl">${sList()}</div>`},
async res(id){const{data:s,error}=await sb.from('samples').select('*,facilities(id,name,address,branch_id)').eq('id',id).single();if(error)throw error;
 const{data:H}=await sb.from('lab_results').select('*,profiles(full_name)').eq('sample_id',id).order('received_on',{ascending:false}),x=(H&&H[0])||{},{data:SS}=await sb.from('samples').select('collected_on,lab_results(bod,cod,tss,received_on)').eq('facility_id',s.facility_id).order('collected_on');
 const F=[['temp','الحرارة °م'],['ph','pH'],['bod','BOD (مجم/لتر)'],['cod','COD (مجم/لتر)'],['tss','TSS (مجم/لتر)'],['og','الزيوت والشحوم O&G'],['settle10','راسبة بعد 10 د (مل/لتر)'],['settle15','راسبة بعد 15 د (مل/لتر)']],can=['gm','rq'].includes(me.role)||me.job_title==='كيميائي';
 setTimeout(rcheck,0);
 return`<button class="btn s" onclick="go('samp')">رجوع</button><div class="c"><h3>${esc(s.code)} <span class="tag ${ST[s.status][1]}">${ST[s.status][0]}</span></h3><span class="m">${esc(s.facilities.name)}، ${esc(s.facilities.address||'-')}<br>جمع ${s.collected_on}، ${esc(s.sample_type||'')}${s.status_manual_reason?'<br><b>تعديل يدوي للحالة: '+esc(s.status_manual_reason)+'</b>':''}</span></div>
 <div class="c" oninput="rcheck()"><h3>نتائج التحليل</h3><div class="g">${F.map(([k,t])=>`<div><label>${t}</label><input id="r_${k}" type="number" step="any" min="0" value="${x[k]??''}" ${can?'':'disabled'}></div>`).join('')}<div><label>تاريخ ورود النتيجة</label><input id="rd" type="date" value="${today()}" ${can?'':'disabled'}></div></div>
 ${x.entered_by?`<p class="m">آخر إدخال: ${x.received_on}${x.profiles?'، '+esc(x.profiles.full_name):''}</p>`:''}
 ${can?`<button class="btn" onclick="saveRes('${id}')">حفظ وتقييم</button>`:'<p class="m">الإدخال للكيميائي ومدير الرقابة والمدير العام</p>'}${H&&H.length?`<button class="btn s" onclick="go('rv','${id}')">معاينة الحساب والمطالبات</button>`:''}</div>
 <div class="c"><h3>مقارنة العينات المتتالية</h3>${typeof chartSVG==='function'?chartSVG(SS||[]):''}</div>
 ${['gm','rq'].includes(me.role)?`<div class="c"><h3>تعديل الحالة يدوياً</h3><select id="ms_s"><option value="pass">مطابقة</option><option value="fail">غير مطابقة</option><option value="pending">في الانتظار</option></select><input id="ms_w" placeholder="سبب التعديل (إجباري)"><button class="btn s" onclick="manualSt('${id}')">تعديل الحالة</button></div>`:''}
 ${H&&H.length>1?`<div class="c"><h3>سجل النتائج</h3>${H.map(h=>`<div class="row m">${h.received_on}: BOD ${h.bod??'-'}، COD ${h.cod??'-'}، TSS ${h.tss??'-'}، O&G ${h.og??'-'}، pH ${h.ph??'-'}${h.profiles?'، '+esc(h.profiles.full_name):''}</div>`).join('')}</div>`:''}`},
async rv(id){const P=await planClaims(id);if(P.conf===null)return`<button class="btn s" onclick="go('res','${id}')">رجوع</button><div class="c">${esc(P.warn.join('، '))}</div>`;
 const ok=await canMk(P.f.branch_id);
 return`<button class="btn s" onclick="go('res','${id}')">رجوع</button><div class="c"><h3>معاينة الحساب <span class="tag ${P.conf?'o':'e'}">${P.conf?'مطابقة':'غير مطابقة'}</span></h3><span class="m">${esc(P.f.name)}${P.ev.length>1?'<br>معاينة بعدة عينات: أعلى قيمة لكل بند مع ذكر العينة المرجعية':''}</span>${P.warn.map(w=>`<p class="bad">${esc(w)}</p>`).join('')}</div>
 ${P.items.map(i=>`<div class="c"><h3>${TL[i.type]} ${i.exist?`<span class="tag ${i.exist.status==='draft'?'w':'o'}">موجودة (${CST[i.exist.status][0]})</span>`:''}</h3>${i.lines.map(l=>`<div class="row m">${esc(l.description)}${i.type==='compliance_notice'?': '+l.measured+' (الحد '+esc(l.extra.limit)+')':' — '+fm(l.amount)+' جنيه'}</div>`).join('')}${i.type==='compliance_notice'?'':`<b>الإجمالي قبل الضريبة: ${fm(i.sum)} جنيه</b>`}</div>`).join('')||'<div class="c m">لا توجد مسودات مستحقة لهذه النتيجة</div>'}
 ${P.items.length&&ok?`<button class="btn" onclick="makeClaims('${id}',false).then(()=>go('cl'))">إنشاء المسودات الناقصة</button>${P.items.some(i=>i.exist&&i.exist.status==='draft')?`<button class="btn s" onclick="redoClaims('${id}')">إعادة حساب المسودات الموجودة</button>`:''}`:(P.items.length?'<p class="m">الإنشاء لمسؤول الفرع أو مدير التحكم أو المدير العام</p>':'')}`}});
(window.PARTS=window.PARTS||[]).push('p10');
