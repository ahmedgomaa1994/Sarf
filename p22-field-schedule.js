/* ===== p22: جدول النزول الأسبوعي — سيارتان يومياً (مطالبات / عينات) بتوزيع تلقائي أو يدوي ===== */
let SC={w:wkStart(today())},SCFG=null,SCDATA=null;
const CARS={claims:['🧾 سيارة تسليم المطالبات','فنيان'],samples:['🧪 سيارة جمع العينات','فني + مهندس أو كيميائي']},SST={planned:['مخطط','w'],done:['تم','o'],broken:['السيارة تعطلت','e'],cancelled:['ملغي','e']},DAYN=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const dowJS=d=>new Date(d+'T00:00:00Z').getUTCDay();
async function schedCfg(){if(SCFG)return SCFG;try{const{data}=await sb.from('app_settings').select('value').eq('key','sched').maybeSingle();SCFG=(data&&data.value)||{}}catch(e){SCFG={}}if(!Array.isArray(SCFG.days))SCFG.days=[6,0,1,2,3];return SCFG}
const isWork=(d,cfg)=>cfg.days.includes(dowJS(d));
async function schedPool(){let r=await sb.from('profiles').select('id,full_name,job_title,branch_id').eq('active',true).is('deleted_at',null).in('job_title',['فني','مهندس','كيميائي']).order('full_name');if(r.error)r=await sb.from('profiles').select('id,full_name,job_title,branch_id').eq('active',true).in('job_title',['فني','مهندس','كيميائي']).order('full_name');return r.data||[]}
async function schedBacklog(){const[C,P,H]=await Promise.all([sb.from('claims').select('branch_id,created_at').in('status',['approved','print_ready']).is('delivered_on',null).is('deleted_at',null).is('cancelled_on',null),sb.from('plan_items').select('branch_id,priority,plan_date').eq('status','مجدول'),sb.from('field_schedule').select('work_date,car,branch_id,members,status').gte('work_date',addDays(today(),-28))]);
 const cs={},cc={},ss={},sc={},age={},W={'قصوى':3,'عالية':2,'متوسطة':1};
 (C.data||[]).forEach(c=>{if(!c.branch_id)return;cc[c.branch_id]=(cc[c.branch_id]||0)+1;cs[c.branch_id]=(cs[c.branch_id]||0)+1;age[c.branch_id]=Math.max(age[c.branch_id]||0,(Date.now()-new Date(c.created_at))/864e5)});
 Object.keys(cs).forEach(b=>cs[b]+=Math.min(5,age[b]/7));
 (P.data||[]).forEach(p=>{if(!p.branch_id)return;sc[p.branch_id]=(sc[p.branch_id]||0)+1;ss[p.branch_id]=(ss[p.branch_id]||0)+(W[p.priority]||1)+(p.plan_date<today()?1:0)});
 return{cs,cc,ss,sc,hist:H.data||[]}}
/* التوزيع التلقائي: يختار الفرع الأكثر احتياجاً (مطالبات غير مسلّمة / بنود خطة) مع تدوير الفروع، ويوزّع الفِرَق بعدالة */
async function schedAuto(ws,from,ov){const cfg=await schedCfg(),pool=await schedPool(),B=await schedBacklog(),days=[];if(!BR.length)return{rows:[],warn:['لا توجد فروع']};
 for(let i=0;i<7;i++){const d=addDays(ws,i);if(d>=from&&isWork(d,cfg))days.push(d)}
 const{data:ex}=await sb.from('field_schedule').select('*').gte('work_date',ws).lt('work_date',addDays(ws,7)),exm={};(ex||[]).forEach(r=>exm[r.work_date+'|'+r.car]=r);
 const techs=pool.filter(u=>u.job_title==='فني'),engs=pool.filter(u=>u.job_title!=='فني'),cnt={};pool.forEach(u=>cnt[u.id]=0);
 B.hist.forEach(h=>{if(h.status!=='cancelled')(h.members||[]).forEach(m=>{if(m in cnt)cnt[m]++})});
 const last={claims:{},samples:{}};B.hist.forEach(h=>{if(h.branch_id&&h.car in last&&(!last[h.car][h.branch_id]||h.work_date>last[h.car][h.branch_id]))last[h.car][h.branch_id]=h.work_date});
 const score={claims:{...B.cs},samples:{...B.ss}},prevB={claims:null,samples:null},prefer={claims:null,samples:null},rows=[],warn=[];
 ['claims','samples'].forEach(car=>{for(let i=0;i<7;i++){const d=addDays(ws,i),r=exm[d+'|'+car];if(r&&d<from){if(r.status==='broken'&&r.branch_id)prefer[car]=r.branch_id;if(r.status!=='cancelled')prevB[car]=r.branch_id}}});
 for(const d of days){const used=new Set();
  for(const car of['claims','samples']){const e=exm[d+'|'+car];
   if(e&&(e.status!=='planned'||!ov)){prevB[car]=e.branch_id;(e.members||[]).forEach(m=>{used.add(m);if(m in cnt)cnt[m]++});if(e.status==='broken'&&e.branch_id)prefer[car]=e.branch_id;continue}
   let best=BR[0],bs=-1e9;for(const b of BR){const dsl=last[car][b.id]?(Date.parse(d)-Date.parse(last[car][b.id]))/864e5:30,eff=(score[car][b.id]||0)+0.2*Math.min(30,dsl)-(prevB[car]===b.id?5:0)+(prefer[car]===b.id?100:0);if(eff>bs){bs=eff;best=b}}
   if(prefer[car]===best.id)prefer[car]=null;score[car][best.id]=(score[car][best.id]||0)*0.3;last[car][best.id]=d;prevB[car]=best.id;
   const pick=L=>{const c=L.filter(u=>!used.has(u.id)).sort((a,b)=>(cnt[a.id]||0)-(cnt[b.id]||0)||a.full_name.localeCompare(b.full_name))[0];if(c){used.add(c.id);cnt[c.id]++}return c},m=[];
   if(car==='claims'){[pick(techs),pick(techs)].forEach(x=>x&&m.push(x.id));if(m.length<2)warn.push(d+' — سيارة المطالبات: فريق ناقص ('+m.length+' من 2 فني)')}
   else{[pick(techs),pick(engs)].forEach(x=>x&&m.push(x.id));if(m.length<2)warn.push(d+' — سيارة العينات: فريق ناقص ('+m.length+' من 2)')}
   rows.push({work_date:d,car,branch_id:best.id,members:m,status:'planned'})}}
 return{rows,warn}}
async function schedRun(mode){try{if(!lrole('rq'))return;const ws=SC.w,from=mode==='rest'?(today()>ws?today():ws):ws;
 const{data:ex}=await sb.from('field_schedule').select('id,status').gte('work_date',from).lt('work_date',addDays(ws,7));let ov=false;
 if((ex||[]).some(r=>r.status==='planned'))ov=confirm('يوجد توزيع مخطط بالفعل. اضغط موافق لاستبداله بتوزيع جديد، أو إلغاء لملء الخانات الفارغة فقط (المنفّذ والمتعطل لا يتغير).');
 const{rows,warn}=await schedAuto(ws,from,ov);if(!rows.length&&!warn.length)return alert('لا توجد خانات جديدة لتوزيعها');
 if(rows.length){const{error}=await sb.from('field_schedule').upsert(rows,{onConflict:'work_date,car'});if(error)throw error;try{await notifyMany(['insp'],'صدر جدول النزول لأسبوع '+ws,'sched:'+ws)}catch(e){}}
 alert('تم توزيع '+rows.length+' مهمة'+(warn.length?'\nتنبيهات:\n'+warn.join('\n'):''));go('sched',ws)}catch(e){err(e)}}
const sid=(d,c)=>d+'_'+c;
async function schedSave(d,car){try{const g=i=>document.getElementById(i+sid(d,car)),m=[...new Set([g('sm1_').value,g('sm2_').value].filter(Boolean))];
 if(!g('sb_').value)return alert('اختر الفرع');const row={work_date:d,car,branch_id:+g('sb_').value,members:m,status:g('ss_').value,note:g('sn_').value.trim()||null};
 const{error}=await sb.from('field_schedule').upsert(row,{onConflict:'work_date,car'});if(error)throw error;go('sched',SC.w)}catch(e){err(e)}}
async function schedBroken(d,car){try{if(!confirm('تسجيل تعطل السيارة وترحيل هذا الفرع لأول يوم قادم؟'))return;
 const{error}=await sb.from('field_schedule').update({status:'broken',note:'تعطلت السيارة'}).eq('work_date',d).eq('car',car);if(error)throw error;
 const next=addDays(d,1),ws=wkStart(d),{rows,warn}=await schedAuto(ws,next,false);if(rows.length){const{error:e2}=await sb.from('field_schedule').upsert(rows,{onConflict:'work_date,car'});if(e2)throw e2}
 alert('سُجل التعطل'+(rows.length?' وأُعيد توزيع الأيام التالية في نفس الأسبوع مع تقديم هذا الفرع':'. لا توجد أيام عمل متبقية هذا الأسبوع، سيُراعى الفرع في التوزيع القادم.'));go('sched',SC.w)}catch(e){err(e)}}
async function schedCfgSave(){try{const days=[...document.querySelectorAll('.sdw:checked')].map(x=>+x.value);if(!days.length)return alert('اختر يوماً واحداً على الأقل');const{error}=await sb.from('app_settings').upsert({key:'sched',value:{days}},{onConflict:'key'});if(error)throw error;SCFG=null;alert('تم حفظ أيام النزول');go('sched',SC.w)}catch(e){err(e)}}
function schedNav(n){SC.w=addDays(SC.w,7*n);go('sched',SC.w)}
function prtSched(){const D=SCDATA;if(!D)return;let d=document.getElementById('pv');if(!d){d=document.createElement('div');d.id='pv';document.body.appendChild(d)}
 const cell=r=>r?`<b>${esc(brn(r.branch_id))}</b><br>${(r.members||[]).map(m=>esc(D.nm[m]||'-')).join('<br>')||'—'}${r.status!=='planned'?'<br><i>('+SST[r.status][0]+')</i>':''}`:'—',
 rows=Array.from({length:7},(_,i)=>{const dt=addDays(D.ws,i),work=isWork(dt,D.cfg);return`<tr><td>${DN[i]}<br>${dt}</td>${work?`<td>${cell(D.rows[dt+'|claims'])}</td><td>${cell(D.rows[dt+'|samples'])}</td>`:'<td colspan="2" style="text-align:center">إجازة — لا نزول</td>'}</tr>`}).join('');
 d.innerHTML=`<div class="np g"><button class="btn" onclick="window.print()">طباعة / حفظ PDF</button><button class="btn s" onclick="this.closest('#pv').remove()">إغلاق</button></div><div dir="rtl" style="padding:8mm;font-family:Cairo,Tahoma,sans-serif"><h2 style="text-align:center">إدارة الرقابة على الصرف الصناعي</h2><h3 style="text-align:center">جدول النزول الأسبوعي</h3><p>من ${D.ws} إلى ${addDays(D.ws,6)}</p><table><tr><th>اليوم والتاريخ</th><th>${CARS.claims[0]}<br><small>(فنيان) — تسليم المطالبات</small></th><th>${CARS.samples[0]}<br><small>(فني + مهندس/كيميائي) — جمع العينات</small></th></tr>${rows}</table><p style="margin-top:12mm">اعتماد مدير الرقابة: ........ &nbsp;&nbsp; اعتماد المدير العام: ........</p></div>`}
R.sched=async function(arg){if(arg&&/^\d{4}-\d{2}-\d{2}$/.test(arg))SC.w=wkStart(arg);const cfg=await schedCfg(),ws=SC.w,[S,U,B]=await Promise.all([sb.from('field_schedule').select('*').gte('work_date',ws).lt('work_date',addDays(ws,7)),sb.from('profiles').select('id,full_name,job_title'),schedBacklog()]);if(S.error)throw S.error;
 const adm=lrole('rq'),nm=Object.fromEntries((U.data||[]).map(u=>[u.id,u.full_name])),pool=(U.data||[]).filter(u=>['فني','مهندس','كيميائي'].includes(u.job_title)),rows={};(S.data||[]).forEach(r=>rows[r.work_date+'|'+r.car]=r);SCDATA={ws,cfg,rows,nm};
 const opts=(L,cur)=>'<option value="">—</option>'+L.map(u=>`<option value="${u.id}" ${u.id===cur?'selected':''}>${esc(u.full_name)} (${esc(u.job_title)})</option>`).join(''),techs=pool.filter(u=>u.job_title==='فني'),engs=pool.filter(u=>u.job_title!=='فني');
 const slot=(d,car)=>{const r=rows[d+'|'+car],b=r&&BR.find(x=>x.id===r.branch_id),st=r?SST[r.status]:null,mine=r&&(r.members||[]).includes(me.id),L1=techs,L2=car==='claims'?techs:engs,s=sid(d,car),m=(r&&r.members)||[];
  const info=r&&r.branch_id?(car==='claims'?`🧾 مطالبات بانتظار التسليم بالفرع: ${B.cc[r.branch_id]||0}`:`📋 بنود خطة معلّقة بالفرع: ${B.sc[r.branch_id]||0}`):'';
  return`<div class="pl" style="border-inline-start:5px solid ${r?(r.status==='broken'?'var(--er)':r.status==='done'?'var(--ok)':'var(--p2)'):'var(--bd)'}"><div class="pt"><b>${CARS[car][0]}</b>${st?`<span class="tag ${st[1]}">${st[0]}</span>`:''}</div>
  ${r?`<div>📍 <b>${esc(b?b.name:'-')}</b></div><div class="m">👥 ${m.map(x=>esc(nm[x]||'-')).join('، ')||'بدون فريق'} ${mine?'<span class="tag o">أنت</span>':''}</div><div class="m">${info}</div>${r.note?`<div class="m">📝 ${esc(r.note)}</div>`:''}`:'<div class="m">لم يُحدَّد بعد</div>'}
  ${adm?`<details style="margin-top:6px"><summary class="m">تعديل يدوي</summary><label>الفرع</label><select id="sb_${s}"><option value="">اختر</option>${BR.map(x=>`<option value="${x.id}" ${r&&r.branch_id===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select><div class="g"><div><label>العضو 1 (${car==='claims'?'فني':'فني'})</label><select id="sm1_${s}">${opts(L1,m[0])}</select></div><div><label>العضو 2 (${car==='claims'?'فني':'مهندس/كيميائي'})</label><select id="sm2_${s}">${opts(L2,m[1])}</select></div></div><div class="g"><div><label>الحالة</label><select id="ss_${s}">${Object.entries(SST).map(([k,v])=>`<option value="${k}" ${(r?r.status:'planned')===k?'selected':''}>${v[0]}</option>`).join('')}</select></div><div><label>ملاحظة</label><input id="sn_${s}" value="${esc((r&&r.note)||'')}"></div></div><button class="btn" style="min-height:42px" onclick="schedSave('${d}','${car}')">حفظ</button>${r&&r.status==='planned'?`<button class="btn s" style="min-height:42px" onclick="schedBroken('${d}','${car}')">🚧 السيارة تعطلت (ترحيل الفرع)</button>`:''}</details>`:''}</div>`};
 const day=i=>{const d=addDays(ws,i),work=isWork(d,cfg);return`<div class="dayh"><b>${DN[i]} ${fmtD(d)}${d===today()?' — اليوم':''}</b><span class="m">${work?'يوم نزول':'إجازة'}</span></div>${work?slot(d,'claims')+slot(d,'samples'):'<div class="c m" style="text-align:center">لا نزول في هذا اليوم</div>'}`};
 return`<button class="btn s" onclick="go('plan')">رجوع للخطة</button><div class="c"><h3>🚚 جدول النزول الأسبوعي</h3><div class="pnav"><button onclick="schedNav(-1)">›</button><b>${fmtD(ws)} – ${fmtD(addDays(ws,6))} ${addDays(ws,6).slice(0,4)}</b><button onclick="schedNav(1)">‹</button></div>
 <p class="m">سيارتان يومياً: <b>المطالبات</b> (فنيان) و<b>العينات</b> (فني + مهندس أو كيميائي).</p>
 ${adm?`<button class="btn" onclick="schedRun('week')">⚙ توزيع تلقائي للأسبوع</button><button class="btn s" onclick="schedRun('rest')">↻ إعادة توزيع من اليوم</button>`:''}<button class="btn s" onclick="prtSched()">🖨 طباعة الجدول PDF</button>
 ${me.role==='gm'?`<details><summary class="m">أيام النزول</summary><div class="g">${[6,0,1,2,3,4,5].map(n=>`<label style="display:flex;gap:6px;align-items:center;color:var(--fg)"><input type="checkbox" class="sdw" value="${n}" style="width:22px;min-height:22px" ${cfg.days.includes(n)?'checked':''}>${DAYN[n]}</label>`).join('')}</div><button class="btn s" onclick="schedCfgSave()">حفظ أيام النزول</button></details>`:''}</div>${Array.from({length:7},(_,i)=>day(i)).join('')}`};
const home22=R.home;R.home=async function(a){const h=await home22.call(this,a);try{const{data}=await sb.from('field_schedule').select('car,branch_id,members,status').eq('work_date',today()).contains('members',[me.id]);
 if(data&&data.length)return`<div class="c" style="border-color:var(--p2)"><h3>🚚 مهمتي اليوم</h3>${data.map(r=>`<div class="row">${CARS[r.car][0]} — <b>${esc(brn(r.branch_id))}</b> <span class="tag ${SST[r.status][1]}">${SST[r.status][0]}</span></div>`).join('')}<button class="btn s" onclick="go('sched')">جدول النزول</button></div>`+h}catch(e){}return h};
const plan22=R.plan;R.plan=async function(a){return`<button class="btn" onclick="go('sched')">🚚 جدول النزول الأسبوعي (السيارتان)</button><div style="height:10px"></div>`+await plan22.call(this,a)};
N17.sched=['جدول النزول','🚚',()=>'sched',()=>true];GROUP17.plan.push('sched');
(window.PARTS=window.PARTS||[]).push('p22');
