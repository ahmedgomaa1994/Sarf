/* ===== المطالبات ===== */
const TL={inspection:'رسوم معاينة وانتقال',analysis_cost:'تكلفة تحليل عينة',treatment_burden:'أعباء تنقية',compliance_notice:'توفيق أوضاع',groundwater:'أحمال مياه جوفية'};
const MK={ins:'inspection',an:'analysis_cost',gw:'groundwater',bur:'treatment_burden',tw:'compliance_notice'};
const CST={draft:['مسودة','w'],review:['مراجعة','w'],approved:['معتمدة','o'],print_ready:['جاهزة للطباعة','o']};
const NX={draft:['review',['gm','ctl','rq'],'إرسال للمراجعة'],review:['approved',['gm'],'اعتماد المدير العام'],approved:['print_ready',['gm','ctl','rq'],'جاهزة للطباعة']};
const CY=[['يناير','فبراير'],['مارس','أبريل'],['مايو','يونيو'],['يوليو','أغسطس'],['سبتمبر','أكتوبر'],['نوفمبر','ديسمبر']];
const r2=x=>Math.round((x+Number.EPSILON)*100)/100,fm=x=>r2(+x||0).toLocaleString('ar-EG');
const U=['','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر'],TT=['','','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'],HH=['','مائة','مائتان','ثلاثمائة','أربعمائة','خمسمائة','ستمائة','سبعمائة','ثمانمائة','تسعمائة'];
const b3=n=>{const p=[],h=n/100|0,r=n%100;if(h)p.push(HH[h]);if(r)p.push(r<20?U[r]:(r%10?U[r%10]+' و':'')+TT[r/10|0]);return p.join(' و')};
const grp=(n,a,b,c,d)=>n===1?a:n===2?b:n<=10?U[n]+' '+c:b3(n)+' '+d;
function words(n){if(!n)return'صفر';const m=n/1e6|0,t=(n/1e3|0)%1e3,r=n%1e3,p=[];if(m)p.push(grp(m,'مليون','مليونان','ملايين','مليوناً'));if(t)p.push(grp(t,'ألف','ألفان','آلاف','ألفاً'));if(r)p.push(b3(r));return p.join(' و')}
function tafq(x){const j=Math.floor(x),q=Math.round((x-j)*100);let s=j===1?'جنيه مصري واحد':j===2?'جنيهان مصريان':words(j)+(j>=3&&j<=10?' جنيهات مصرية':' جنيهاً مصرياً');if(q)s+=' و'+(q===1?'قرش واحد':q===2?'قرشان':words(q)+(q<=10?' قروش':' قرشاً'));return s+' لا غير'}
function evalV(v){const b=[];[['bod','BOD'],['tss','TSS'],['cod','COD'],['og','OG']].forEach(([k,p])=>{if(v[k]!=null&&LIM[p]&&LIM[p].max_value!=null&&v[k]>LIM[p].max_value)b.push(p)});if(v.ph!=null&&LIM.pH&&(v.ph>LIM.pH.max_value||v.ph<LIM.pH.min_value))b.push('pH');return b}
function calcB(v,water,conf){const L=[],both=v.bod>LIM.BOD.max_value&&v.cod>LIM.COD.max_value;
 [['BOD','bod'],['TSS','tss'],['COD','cod'],['OG','og']].forEach(([P,k])=>{const x=v[k];if(x==null)return;
  const t=TIERS.find(t=>t.param===P&&x>+t.from_value&&(t.to_value==null||x<=+t.to_value));if(!t||(t.kind==='plant_input'&&!conf))return;
  const mo=t.grace_unit==='month'?+t.grace_value:+t.grace_value/4,mult=Math.max(1,mo),val=water*mult*+t.rate;
  L.push({p:P,v:x,rate:+t.rate,mult,val});if(P==='COD'&&both)L.push({p:'خصم COD '+FEE.cod_discount_pct+'%',v:'',rate:'',mult:'',val:-val*FEE.cod_discount_pct/100})});
 if(v.ph!=null){const lo=LIM.pH.min_value,hi=LIM.pH.max_value,h=v.ph;let r=0;if(h<2||h>12)r=60;else if(h<lo||h>hi)r=30;if(r)L.push({p:'pH',v:h,rate:r,mult:1,val:water*r})}
 return{L,total:r2(L.reduce((a,x)=>a+x.val,0))}}
async function mkClaim(type,f,lines,extra){
  const{data:serial,error:e0}=await sb.rpc('next_claim_serial',{t:type});if(e0)throw e0;
  const sub=r2(lines.reduce((a,x)=>a+x.amount,0)),vatOn=type==='treatment_burden'?+FEE.vat_on_treatment===1:type!=='compliance_notice',vat=vatOn?r2(sub*FEE.vat_pct/100):0;
  const{data:c,error}=await sb.from('claims').insert({type,serial,facility_id:f.id,branch_id:f.branch_id,subtotal:sub,vat,total:r2(sub+vat),settings_snapshot:{fees:FEE,vat_applied:vatOn},created_by:me.id,...extra}).select('id').single();if(error)throw error;
  const{error:e2}=await sb.from('claim_lines').insert(lines.map(l=>({claim_id:c.id,...l})));if(e2)throw e2;return c.id}
const mfv=()=>{const o={};['bod','cod','tss','og','ph'].forEach(k=>{const x=$('#v_'+k).value;o[k]=x===''?null:+x});return o};
async function mfFill(sid){const{data}=await sb.from('lab_results').select('*').eq('sample_id',sid).order('received_on',{ascending:false}).limit(1);const r=(data&&data[0])||{};['bod','cod','tss','og','ph'].forEach(k=>{$('#v_'+k).value=r[k]??''})}
function mfCalc(){const v=mfv(),c=calcB(v,+$('#bw').value||0,!evalV(v).length);$('#bp').innerHTML=c.L.length?`<table>${c.L.map(x=>`<tr><td>${esc(x.p)}</td><td>${x.v}</td><td>${x.rate}</td><td>${x.mult}</td><td>${fm(x.val)}</td></tr>`).join('')}</table><b>${fm(c.total)} جنيه</b>`:'<span class="m">لا أعباء على هذه القيم</span>';return c}
async function mfDo(k){try{const f=MF.f,g=i=>$('#'+i)&&$('#'+i).value;let id;
 if(k==='ins'){const t=+g('mt')||0,d=g('md');id=await mkClaim('inspection',f,[{description:'رسوم معاينة منشأة '+f.classification+' بتاريخ '+d,amount:+(f.classification==='تجارية'?FEE.inspection_commercial:FEE.inspection_other)},{description:'رسوم انتقال',amount:t}],{})}
 else if(k==='an'){const u=+g('mc');if(!(u>0))return alert('أدخل تكلفة تحليل العينة');const ids=[...document.querySelectorAll('.sk:checked')];if(!ids.length)return alert('اختر عينة واحدة على الأقل');
  id=await mkClaim('analysis_cost',f,ids.map(e=>({description:'تحليل عينة '+e.dataset.code+' (جمع '+e.dataset.d+')',amount:u})),{})}
 else if(k==='bur'){const c=mfCalc();if(!c.L.length)return alert('لا أعباء لإنشائها');id=await mkClaim('treatment_burden',f,c.L.map(x=>({description:x.p,measured:x.v===''?null:x.v,rate:x.rate===''?null:x.rate,months:x.mult===''?null:x.mult,amount:x.val})),{sample_id:g('ms')||null})}
 else if(k==='tw'){const v=mfv(),b=evalV(v);if(!b.length)return alert('كل البنود مطابقة');const l={BOD:LIM.BOD.max_value,TSS:LIM.TSS.max_value,COD:LIM.COD.max_value,OG:LIM.OG.max_value,pH:LIM.pH.min_value+'-'+LIM.pH.max_value},m={BOD:'bod',TSS:'tss',COD:'cod',OG:'og',pH:'ph'};
  id=await mkClaim('compliance_notice',f,b.map(p=>({description:p,measured:v[m[p]],amount:0,extra:{limit:l[p]}})),{sample_id:g('ms')||null})}
 else{const d=+g('gd'),a=+g('g1'),b=+g('g2');if(!(d>0)||!(a>0)||!(b>0)||a>31||b>31)return alert('قيم غير صحيحة');const cy=CY[+g('gcy')],y=g('gy'),r=+FEE.groundwater_rate;
  id=await mkClaim('groundwater',f,[{description:`${cy[0]} ${y}: ${d} م³/يوم × ${a} يوم`,measured:d*a,rate:r,amount:d*a*r},{description:`${cy[1]} ${y}: ${d} م³/يوم × ${b} يوم`,measured:d*b,rate:r,amount:d*b*r}],{})}
 MF={k:null,fid:null};go('cd',id)}catch(e){err(e)}}
async function adv(id,st){try{const n=NX[st],u={status:n[0]};if(n[0]==='review'){u.reviewer_user_id=me.id;u.reviewed_at=new Date().toISOString()}if(n[0]==='approved'){u.approved_by=me.id;u.approved_at=new Date().toISOString()}
 const{error}=await sb.from('claims').update(u).eq('id',id);if(error)throw error;go('cd',id)}catch(e){err(e)}}
async function editLine(cid,lid,v){try{const{error}=await sb.from('claim_lines').update({amount:+v}).eq('id',lid);if(error)throw error;
 const{data:L}=await sb.from('claim_lines').select('amount').eq('claim_id',cid),{data:c}=await sb.from('claims').select('settings_snapshot').eq('id',cid).single(),sub=r2(L.reduce((a,x)=>a+ +x.amount,0)),vat=c.settings_snapshot&&c.settings_snapshot.vat_applied?r2(sub*(c.settings_snapshot.fees.vat_pct)/100):0;
 await sb.from('claims').update({subtotal:sub,vat,total:r2(sub+vat)}).eq('id',cid);go('cd',cid)}catch(e){err(e)}}
async function prt(id){try{const{data:c}=await sb.from('claims').select('*,facilities(name,code,address,branch_id)').eq('id',id).single(),{data:L}=await sb.from('claim_lines').select('*').eq('claim_id',id).order('id'),nt=c.type==='compliance_notice',b=BR.find(x=>x.id==c.facilities.branch_id);
 let d=document.getElementById('pv');if(!d){d=document.createElement('div');d.id='pv';document.body.appendChild(d)}
 d.innerHTML=`<div class="np g"><button class="btn" onclick="window.print()">طباعة / حفظ PDF</button><button class="btn s" onclick="this.closest('#pv').remove()">إغلاق</button></div><div dir="rtl" style="padding:8mm;font-family:Cairo,Tahoma,sans-serif"><h2 style="text-align:center">إدارة الرقابة على الصرف الصناعي</h2><h3 style="text-align:center">${nt?'نموذج توفيق أوضاع':'مطالبة '+TL[c.type]} رقم ${c.serial}</h3><p>التاريخ: ${c.created_at.slice(0,10)}<br>المنشأة: ${esc(c.facilities.name)} (كود ${esc(c.facilities.code)})<br>العنوان: ${esc(c.facilities.address||'-')}، فرع ${esc(b&&b.name)}</p>
 ${nt?`<p><b>يجب سرعة توفيق أوضاع المنشأة خلال شهر من تاريخ استلام هذا النموذج.</b></p><table><tr><th>البند</th><th>القيمة المقاسة</th><th>الحد</th></tr>${L.map(x=>`<tr><td>${esc(x.description)}</td><td>${x.measured}</td><td>${esc(x.extra&&x.extra.limit)}</td></tr>`).join('')}</table><p>اسم المستلم: ........ التوقيع: ........ تاريخ الاستلام: ........ ختم المنشأة: ........</p>`
 :`<table><tr><th>البيان</th><th>المبلغ (جنيه)</th></tr>${L.map(x=>`<tr><td>${esc(x.description)}</td><td>${fm(x.amount)}</td></tr>`).join('')}<tr><td>الضريبة</td><td>${fm(c.vat)}</td></tr><tr><th>الإجمالي</th><th>${fm(c.total)}</th></tr></table><p>${tafq(+c.total)}</p><p>المراجع: ........ &nbsp; اعتماد المدير العام: ........</p>`}
 <p style="font-size:12px">وفقاً للقانون 93 لسنة 1962 ولائحته التنفيذية 44 لسنة 2000</p></div>`}catch(e){err(e)}}
Object.assign(R,{
async cl(){const{data,error}=await sb.from('claims').select('id,type,serial,status,total,cancelled_on,facilities(name)').is('deleted_at',null).order('created_at',{ascending:false}).limit(200);if(error)throw error;
 return`<div class="c"><h3>إصدار مطالبة يدوياً</h3>${Object.entries(MK).map(([k,t])=>`<button class="btn s" onclick="MF={k:'${k}',fid:null};go('mf','${k}')">نموذج ${TL[t]}</button>`).join('')}</div><div class="c">${(data||[]).map(c=>`<div class="row" onclick="go('cd','${c.id}')"><b>${TL[c.type]} #${c.serial}</b> ${c.cancelled_on?'<span class="tag e">ملغاة (تظلم)</span>':`<span class="tag ${CST[c.status][1]}">${CST[c.status][0]}</span>`}<br><span class="m">${esc(c.facilities&&c.facilities.name)}${c.type==='compliance_notice'?'':'، '+fm(c.total)+' جنيه'}</span></div>`).join('')||'<span class="m">لا توجد مطالبات</span>'}</div>`},
async cd(id){const{data:c,error}=await sb.from('claims').select('*,facilities(name,code)').eq('id',id).single();if(error)throw error;const{data:L}=await sb.from('claim_lines').select('*').eq('claim_id',id).order('id'),nt=c.type==='compliance_notice',n=NX[c.status],dr=c.status==='draft'&&['gm','ctl'].includes(me.role);
 return`<button class="btn s" onclick="go('cl')">رجوع</button><div class="c"><h3>${TL[c.type]} #${c.serial} <span class="tag ${CST[c.status][1]}">${CST[c.status][0]}</span></h3><span class="m">${esc(c.facilities.name)}، كود ${esc(c.facilities.code)}</span>
 ${L.map(x=>nt?`<div class="row">${esc(x.description)}: ${x.measured} (الحد ${esc(x.extra&&x.extra.limit)})</div>`:`<div class="row">${esc(x.description)}<br>${dr?`<input type="number" step="any" value="${x.amount}" onchange="editLine('${id}','${x.id}',this.value)">`:fm(x.amount)+' جنيه'}</div>`).join('')}
 ${nt?'':`<div class="row">قبل الضريبة: ${fm(c.subtotal)}<br>الضريبة: ${fm(c.vat)}<br><b>الإجمالي: ${fm(c.total)} جنيه</b><br><span class="m">${tafq(+c.total)}</span></div>`}</div>
 ${n&&n[1].includes(me.role)?`<button class="btn" onclick="adv('${id}','${c.status}')">${n[2]}</button>`:''}<button class="btn s" onclick="prt('${id}')">معاينة الطباعة PDF</button>`},
async mf(k){const{data:F}=await sb.from('facilities').select('id,name,code,classification,branch_id,monthly_water_m3').is('deleted_at',null).order('name');let f=MF.fid?(F||[]).find(x=>x.id===MF.fid):null;MF.f=f;
 const vf='<div class="g">'+[['bod','BOD'],['cod','COD'],['tss','TSS'],['og','زيوت وشحوم'],['ph','pH']].map(([q,t])=>`<div><label>${t}</label><input id="v_${q}" type="number" step="any"></div>`).join('')+'</div>';
 let ss=[];if(f&&['an','bur','tw'].includes(k))ss=(await sb.from('samples').select('id,code,collected_on').eq('facility_id',f.id).order('collected_on',{ascending:false})).data||[];
 const sm=`<label>العينة (اختياري)</label><select id="ms" onchange="mfFill(this.value)"><option value="">إدخال يدوي</option>${ss.map(s=>`<option value="${s.id}">${esc(s.code)}</option>`).join('')}</select>`;let b='';
 if(f){if(k==='ins')b=`<div class="row">رسم المعاينة (${esc(f.classification)}): ${fm(f.classification==='تجارية'?FEE.inspection_commercial:FEE.inspection_other)} جنيه</div><label>تاريخ المعاينة</label><input id="md" type="date" value="${today()}"><label>رسوم الانتقال (جنيه)</label><input id="mt" type="number" step="any" value="${FEE.transport_default||0}">`;
  else if(k==='an')b=`<label>تكلفة تحليل العينة (جنيه)</label><input id="mc" type="number" step="any" value="${FEE.analysis_cost||''}">${ss.map(s=>`<label style="display:flex;gap:8px;align-items:center;color:var(--fg)"><input type="checkbox" class="sk" style="width:22px;min-height:22px" checked data-code="${esc(s.code)}" data-d="${s.collected_on}">${esc(s.code)} (${s.collected_on})</label>`).join('')||'<p class="m">لا توجد عينات مسجلة لهذه المنشأة</p>'}`;
  else if(k==='bur'){const w=f.monthly_water_m3?f.monthly_water_m3*FEE.discharge_pct/100:'';b=`${sm}${vf}<label>كمية المياه المنصرفة شهرياً (م³) ${f.monthly_water_m3?'— '+FEE.discharge_pct+'% من '+f.monthly_water_m3:'— لا استهلاك مسجل'}</label><input id="bw" type="number" step="any" value="${w}"><button class="btn s" onclick="mfCalc()">معاينة الحساب</button><div id="bp"></div>`}
  else if(k==='tw')b=`${sm}${vf}<p class="m">تُدرج البنود المخالفة فقط مع حدودها.</p>`;
  else b=`<label>الدورة</label><div class="g"><select id="gcy">${CY.map((c,i)=>`<option value="${i}">${c.join(' و')}</option>`).join('')}</select><input id="gy" type="number" value="${new Date().getFullYear()}"></div><label>الكمية اليومية (م³/يوم)</label><input id="gd" type="number" step="any"><div class="g"><div><label>أيام الشهر الأول</label><input id="g1" type="number"></div><div><label>أيام الشهر الثاني</label><input id="g2" type="number"></div></div>`;
  b+=`<button class="btn" onclick="mfDo('${k}')">إنشاء مسودة</button>`}
 return`<button class="btn s" onclick="go('cl')">رجوع</button><div class="c"><h3>نموذج ${TL[MK[k]]}</h3><label>المنشأة</label><select onchange="MF={k:'${k}',fid:this.value};go('mf','${k}')"><option value="">اختر منشأة</option>${(F||[]).map(x=>`<option value="${x.id}" ${f&&f.id===x.id?'selected':''}>${esc(x.name)} (${esc(x.code)})</option>`).join('')}</select>${b}</div>`}});


(window.PARTS=window.PARTS||[]).push('p3');
