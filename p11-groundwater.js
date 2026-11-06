/* ===== p11: تقرير المياه الجوفية + إصدار دورة الجوفي الجماعية ===== */
let GC={br:'',cy:Math.floor(new Date().getMonth()/2),yr:new Date().getFullYear()};
const gwKey=()=>GC.yr+'-'+GC.cy;
async function gwData(){const[F,Rp]=await Promise.all([sb.from('facilities').select('id,name,code,address,branch_id,water_source,monthly_water_m3,govt_water_m3').in('water_source',['جوفي','حكومي وجوفي']).is('deleted_at',null).order('name'),sb.from('groundwater_reports').select('*').order('created_at',{ascending:false})]);
 if(F.error)throw F.error;if(Rp.error)throw Rp.error;const rep={};(Rp.data||[]).forEach(r=>{if(!rep[r.facility_id])rep[r.facility_id]=r});return{F:F.data||[],rep}}
async function gwPlan(){const{F,rep}=await gwData(),b=+GC.br,key=gwKey();
 const{data:E}=await sb.from('claims').select('facility_id').eq('type','groundwater').is('deleted_at',null).is('cancelled_on',null).eq('settings_snapshot->>cycle',key),done=new Set((E||[]).map(x=>x.facility_id)),rate=+FEE.groundwater_rate;
 const inB=F.filter(f=>f.branch_id===b),ok=[],missing=[],issued=[];
 inB.forEach(f=>{const r=rep[f.id];if(done.has(f.id))return issued.push(f);if(!r||!r.approved_by)return missing.push(f);const q=+r.daily_m3*+r.operating_days;ok.push({f,r,q,sub:r2(q*2*rate)})});
 return{F,rep,ok,missing,issued,key}}
async function issueCycle(){try{if(!['gm','ctl'].includes(me.role))return alert('الإصدار لمدير التحكم أو المدير العام');if(!GC.br)return alert('اختر الفرع');
 const br=BR.find(x=>x.id===+GC.br);if(!br.groundwater_billing_enabled)return alert('تحصيل الجوفي غير مفعّل لهذا الفرع (الإعدادات ثم الفروع)');
 const P=await gwPlan();if(!P.ok.length)return alert('لا توجد منشآت مؤهلة بتقرير معتمد');
 if(!confirm('إصدار '+P.ok.length+' مسودة مطالبة جوفي للدورة؟'))return;const m=CY[GC.cy],rate=+FEE.groundwater_rate;let n=0;
 for(const x of P.ok){const d=+x.r.daily_m3,days=+x.r.operating_days,lines=m.map(mn=>({description:`${mn} ${GC.yr}: ${d} م³/يوم × ${days} يوم = ${d*days} م³`,measured:d*days,rate,amount:d*days*rate}));
  await mkClaim('groundwater',{id:x.f.id,branch_id:x.f.branch_id},lines,{settings_snapshot:{fees:FEE,vat_applied:true,cycle:P.key,cycle_label:m.join(' و')+' '+GC.yr}});n++}
 alert('أُنشئت '+n+' مسودة'+(P.missing.length?'. بلا تقرير جوفي معتمد: '+P.missing.map(f=>f.name).join('، '):''));go('cl')}catch(e){err(e)}}
async function saveGw(fid){try{if(S_ROLE_NOT_GM())return;const d=+$('#gd').value,n=+$('#gn').value,gv=$('#gg')?+$('#gg').value||0:0;
 if(!(d>0)||!(n>=1&&n<=31))return alert('أدخل كمية يومية صحيحة وأيام تشغيل بين 1 و31');
 const{data:old}=await sb.from('groundwater_reports').select('id').eq('facility_id',fid).order('created_at',{ascending:false}).limit(1),row={daily_m3:d,operating_days:n,approved_by:me.id};
 const r=old&&old[0]?await sb.from('groundwater_reports').update(row).eq('id',old[0].id):await sb.from('groundwater_reports').insert({facility_id:fid,...row});if(r.error)throw r.error;
 const{data:f}=await sb.from('facilities').select('water_source').eq('id',fid).single(),both=f.water_source==='حكومي وجوفي',total=r2(d*n+(both?gv:0));
 const{error}=await sb.from('facilities').update({monthly_water_m3:total,water_source_note:both?'مجموع حكومي وجوفي':'تقرير المياه الجوفية',water_updated_at:today(),...(both?{govt_water_m3:gv}:{})}).eq('id',fid);if(error)throw error;
 alert('تم الحفظ. الاستهلاك الشهري المسجّل: '+fm(total)+' م³');go('gwf',fid)}catch(e){err(e)}}
const S_ROLE_NOT_GM=()=>{if(me.role!=='gm'){alert('تقرير المياه الجوفية للمدير العام فقط');return true}return false};
Object.assign(R,{
async gw(){if(!['gm','ctl','rq'].includes(me.role))return'<div class="c">غير مصرّح لدورك</div>';const P=GC.br?await gwPlan():null,{F,rep}=P||await gwData(),o=(a,c)=>a.map(([v,t])=>`<option value="${v}" ${String(v)===String(c)?'selected':''}>${esc(t)}</option>`).join(''),b=BR.find(x=>x.id===+GC.br);
 const list=F.filter(f=>!GC.br||f.branch_id===+GC.br);
 return`<button class="btn s" onclick="go('cl')">رجوع</button><div class="c"><h3>إصدار مطالبات دورة الجوفي</h3><label>الفرع</label><select onchange="GC.br=this.value;go('gw')">${o([['','اختر الفرع']].concat(BR.map(x=>[x.id,x.name])),GC.br)}</select>
 <div class="g"><div><label>الدورة</label><select onchange="GC.cy=+this.value;go('gw')">${o(CY.map((c,i)=>[i,c.join(' و')]),GC.cy)}</select></div><div><label>السنة</label><input type="number" value="${GC.yr}" onchange="GC.yr=+this.value;go('gw')"></div></div>
 ${b&&!b.groundwater_billing_enabled?'<p class="bad">تحصيل الجوفي غير مفعّل لهذا الفرع</p>':''}
 ${P?`<div class="row"><b>مؤهلة للإصدار: ${P.ok.length}</b>${P.ok.map(x=>`<div class="m">${esc(x.f.name)}: ${fm(x.q)} م³ × شهرين × ${FEE.groundwater_rate} = ${fm(x.sub)} (قبل الضريبة)</div>`).join('')}</div>
 ${P.missing.length?`<div class="row bad">بلا تقرير جوفي معتمد (${P.missing.length}): ${P.missing.map(f=>esc(f.name)).join('، ')}</div>`:''}${P.issued.length?`<div class="row m">صدرت لها مطالبة هذه الدورة: ${P.issued.length}</div>`:''}
 ${['gm','ctl'].includes(me.role)&&P.ok.length?'<button class="btn" onclick="issueCycle()">إصدار مطالبات الدورة</button>':''}`:'<p class="m">اختر الفرع لمعاينة المنشآت المؤهلة.</p>'}</div>
 <div class="c"><h3>المنشآت ذات المصدر الجوفي</h3>${list.map(f=>{const r=rep[f.id];return`<div class="row" onclick="go('gwf','${f.id}')"><b>${esc(f.name)}</b> <span class="m">${esc(f.code)}</span><br><span class="m">${r?fm(r.daily_m3)+' م³/يوم × '+r.operating_days+' يوم':'<span class="bad">لا يوجد تقرير جوفي</span>'}</span></div>`}).join('')||'<span class="m">لا توجد منشآت</span>'}</div>`},
async gwf(fid){const{data:f,error}=await sb.from('facilities').select('id,name,code,address,branch_id,water_source,monthly_water_m3,govt_water_m3').eq('id',fid).single();if(error)throw error;
 const[Rp,Pm,In]=await Promise.all([sb.from('groundwater_reports').select('*').eq('facility_id',fid).order('created_at',{ascending:false}).limit(1),sb.from('pumps').select('*').eq('facility_id',fid),sb.from('inspections').select('inspected_on,reason,notes').eq('facility_id',fid).eq('status','approved').order('inspected_on',{ascending:false}).limit(1)]);
 const r=(Rp.data||[])[0],both=f.water_source==='حكومي وجوفي',isGm=me.role==='gm';let H=[];if(isGm&&r){H=(await sb.from('audit_log').select('at,old_row,new_row,action').eq('table_name','groundwater_reports').eq('row_id',r.id).order('at',{ascending:false}).limit(10)).data||[]}
 return`<button class="btn s" onclick="go('gw')">رجوع</button><div class="c"><h3>${esc(f.name)} <span class="m">${esc(f.code)}</span></h3><span class="m">${esc(f.address||'-')}<br>المصدر: ${esc(f.water_source)}، الاستهلاك الشهري المسجل: ${f.monthly_water_m3==null?'-':fm(f.monthly_water_m3)} م³</span></div>
 <div class="c"><h3>من تقرير المعاينة</h3>${(In.data||[])[0]?`<div class="row m">آخر معاينة معتمدة: ${In.data[0].inspected_on}، ${esc(In.data[0].reason||'')}</div>`:'<span class="m">لا توجد معاينة معتمدة</span>'}${(Pm.data||[]).map((p,i)=>`<div class="row m">طلمبة ${i+1}: ${p.hp} حصان، ${esc(p.mode||'')}${p.hours_per_day!=null?'، '+p.hours_per_day+' ساعة يومياً':''}</div>`).join('')}</div>
 <div class="c"><h3>تقرير المياه الجوفية ${r?'<span class="tag o">معتمد</span>':'<span class="tag w">غير موجود</span>'}</h3>
 <label>الكمية اليومية (م³/يوم)</label><input id="gd" type="number" step="any" min="0" value="${r?r.daily_m3:''}" ${isGm?'':'disabled'}><label>عدد أيام التشغيل بالشهر</label><input id="gn" type="number" min="1" max="31" value="${r?r.operating_days:''}" ${isGm?'':'disabled'}>
 ${both?`<label>استهلاك المياه الحكومي الشهري (م³) ويُجمع مع الجوفي</label><input id="gg" type="number" step="any" min="0" value="${f.govt_water_m3??''}" ${isGm?'':'disabled'}>`:''}
 ${isGm?`<button class="btn" onclick="saveGw('${fid}')">حفظ واعتماد</button>`:'<p class="m">الاعتماد والتعديل للمدير العام فقط</p>'}</div>
 ${H.length?`<div class="c"><h3>سجل التغييرات</h3>${H.map(h=>`<div class="row m">${new Date(h.at).toLocaleString('ar-EG')}: ${h.action==='UPDATE'&&h.old_row?fm(h.old_row.daily_m3)+'×'+h.old_row.operating_days+' ← '+fm(h.new_row.daily_m3)+'×'+h.new_row.operating_days:'إضافة'}</div>`).join('')}</div>`:''}`}});
const cl2=R.cl;R.cl=async()=>(['gm','ctl','rq'].includes(me.role)?'<button class="btn s" onclick="go(\'gw\')">المياه الجوفية: التقارير وإصدار الدورة</button><div style="height:10px"></div>':'')+await cl2();
(window.PARTS=window.PARTS||[]).push('p11');
