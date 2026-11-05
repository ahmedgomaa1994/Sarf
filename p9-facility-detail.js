/* ===== p9: سجل المنشآت بالفلاتر + صفحة تفاصيل المنشأة + الاستهلاك + إعادة الترقيم ===== */
let FACS=[],FVIS={},FF={q:'',br:'',cl:'',ac:'',dt:'',cn:'',ws:'',rs:'',d1:'',d2:''};
function facApply(){const f=FF;const L=FACS.filter(x=>{const v=FVIS[x.id]||[];
  if(f.q&&!(x.name+' '+x.code+' '+(x.address||'')+' '+(x.owner_name||'')).toLowerCase().includes(f.q.toLowerCase()))return false;
  if(f.br&&String(x.branch_id)!==f.br)return false;if(f.cl&&x.classification!==f.cl)return false;
  if(f.ac&&!(x.activity||'').includes(f.ac))return false;if(f.dt&&x.discharge_type!==f.dt)return false;
  if(f.cn&&x.connection_type!==f.cn)return false;if(f.ws&&x.water_source!==f.ws)return false;
  if(f.rs&&!v.some(i=>i.reason===f.rs))return false;if(f.d1&&!v.some(i=>i.inspected_on>=f.d1))return false;if(f.d2&&!v.some(i=>i.inspected_on<=f.d2))return false;return true});
 document.getElementById('fl').innerHTML=L.map(x=>`<div class="row" onclick="go('fd','${x.id}')"><b>${esc(x.name)}</b> <span class="m">${esc(x.code)}</span><br><span class="m">${esc((BR.find(b=>b.id===x.branch_id)||{}).name)}، ${esc(x.classification)}${x.activity?'، '+esc(x.activity):''}${x.monthly_water_m3?'':' · لا استهلاك مسجل'}</span></div>`).join('')||'<span class="m">لا نتائج</span>';
 document.getElementById('fc').textContent=L.length+' من '+FACS.length}
function facSet(k,v){FF[k]=v;facApply()}
R.fac=async function(){
 const[F,I]=await Promise.all([sb.from('facilities').select('id,code,name,address,owner_name,branch_id,classification,activity,discharge_type,connection_type,water_source,monthly_water_m3').is('deleted_at',null).order('registered_at',{ascending:false}).limit(1000),sb.from('inspections').select('facility_id,reason,inspected_on').eq('status','approved')]);
 if(F.error)throw F.error;FACS=F.data||[];FVIS={};(I.data||[]).forEach(i=>(FVIS[i.facility_id]=FVIS[i.facility_id]||[]).push(i));
 const o=(a,k)=>`<option value="">الكل</option>`+a.map(x=>`<option ${FF[k]===x?'selected':''}>${x}</option>`).join('');
 const top=['gm','rq','insp'].includes(me.role)?`<div class="g"><button class="btn s" onclick="go('drafts')">مسوداتي</button>${['gm','rq'].includes(me.role)?'<button class="btn s" onclick="go(\'canc\')">معاينات ملغاة</button>':'<span></span>'}</div>`:'';
 setTimeout(facApply,0);
 return`${top}<div class="c" style="margin-top:10px"><input placeholder="بحث بالاسم أو الكود أو العنوان أو المالك" value="${esc(FF.q)}" oninput="facSet('q',this.value)">
 <details><summary class="m" style="padding:8px 0">فلاتر متقدمة</summary><div class="g">
 <div><label>الفرع</label><select onchange="facSet('br',this.value)"><option value="">الكل</option>${BR.map(b=>`<option value="${b.id}" ${FF.br===String(b.id)?'selected':''}>${esc(b.name)}</option>`).join('')}</select></div>
 <div><label>التصنيف</label><select onchange="facSet('cl',this.value)">${o(['تجارية','صناعية','أخرى'],'cl')}</select></div>
 <div><label>نوعية الصرف</label><select onchange="facSet('dt',this.value)">${o(['صناعي','آدمي','خليط'],'dt')}</select></div>
 <div><label>جهة التوصيل</label><select onchange="facSet('cn',this.value)">${o(['على الشبكة','كسح تابع للشركة'],'cn')}</select></div>
 <div><label>نوع المياه</label><select onchange="facSet('ws',this.value)">${o(['حكومي','جوفي','حكومي وجوفي'],'ws')}</select></div>
 <div><label>سبب المعاينة</label><select onchange="facSet('rs',this.value)">${o(['طلب توصيل','خطة الإدارة','مسح'],'rs')}</select></div>
 <div><label>النشاط يحتوي</label><input value="${esc(FF.ac)}" oninput="facSet('ac',this.value)"></div><div></div>
 <div><label>معاينة من</label><input type="date" value="${FF.d1}" onchange="facSet('d1',this.value)"></div><div><label>إلى</label><input type="date" value="${FF.d2}" onchange="facSet('d2',this.value)"></div></div></details>
 <span class="m">النتائج: <span id="fc"></span></span></div><div class="c" id="fl"></div>`};
async function saveWater(id){try{const v=document.getElementById('wv').value;if(v===''||+v<0)return alert('أدخل قيمة صحيحة');const{error}=await sb.from('facilities').update({monthly_water_m3:+v,water_source_note:document.getElementById('wn').value,water_updated_at:today()}).eq('id',id);if(error)throw error;go('fd',id)}catch(e){err(e)}}
function chartSVG(S){const R_=S.filter(s=>s.lab_results&&s.lab_results[0]).slice(-6);if(R_.length<2)return'<span class="m">يلزم نتيجتان على الأقل للمقارنة</span>';
 const K=[['bod','BOD','#1b3a63'],['cod','COD','#b7791f'],['tss','TSS','#1d7a46']],mx=Math.max(...R_.flatMap(s=>K.map(k=>+s.lab_results[0][k[0]]||0)),1),W=300,H=120,gw=W/R_.length;
 return`<svg viewBox="0 0 ${W} ${H+22}" style="width:100%;direction:ltr">${R_.map((s,i)=>K.map((k,j)=>{const v=+s.lab_results[0][k[0]]||0,h=v/mx*H;return`<rect x="${i*gw+6+j*((gw-12)/3)}" y="${H-h}" width="${(gw-12)/3-2}" height="${h}" fill="${k[2]}"><title>${k[1]} ${v}</title></rect>`}).join('')+`<text x="${i*gw+gw/2}" y="${H+14}" font-size="9" text-anchor="middle" fill="currentColor">${s.collected_on.slice(5)}</text>`).join('')}</svg><div class="m">${K.map(k=>`<span style="color:${k[2]}">■</span> ${k[1]}`).join('  ')}</div>`}
R.fd=async function(id){
 const[Fr,Pr,Ir,Sr,Cr,Ur,Lr]=await Promise.all([sb.from('facilities').select('*').eq('id',id).single(),sb.from('pumps').select('*').eq('facility_id',id),sb.from('inspections').select('id,reason,inspected_on,inspector_id').eq('facility_id',id).eq('status','approved').order('inspected_on',{ascending:false}),sb.from('samples').select('id,code,status,collected_on,sample_type,outlet,lab_results(*)').eq('facility_id',id).order('collected_on'),sb.from('claims').select('id,type,serial,status,total').eq('facility_id',id).is('deleted_at',null).order('created_at'),sb.from('profiles').select('id,full_name'),sb.from('license_requests').select('id,status,created_at,facility_name').is('deleted_at',null)]);
 if(Fr.error)throw Fr.error;const f=Fr.data,un=Object.fromEntries((Ur.data||[]).map(u=>[u.id,u.full_name])),S=Sr.data||[],dis=f.monthly_water_m3?r2(f.monthly_water_m3*(+FEE.discharge_pct||80)/100):null,lic=(Lr.data||[]).filter(l=>(l.facility_name||'').trim()===f.name.trim());
 const mfb=['gm','ctl'].includes(me.role)?`<div class="c"><h3>إصدار مطالبة لهذه المنشأة</h3>${Object.entries(MK).map(([k,t])=>`<button class="btn s" onclick="MF={k:'${k}',fid:'${id}'};go('mf','${k}')">${TL[t]}</button>`).join('')}</div>`:'';
 return`<button class="btn s" onclick="go('fac')">رجوع</button>
 <div class="c"><h3>${esc(f.name)} <span class="m">${esc(f.code)}</span></h3><span class="m">${esc((BR.find(b=>b.id===f.branch_id)||{}).name)}، ${esc(f.classification)}، ${esc(f.activity||'-')}</span>
 <div class="row">العنوان: ${esc(f.address||'-')}${f.lat?` <span class="m">(${f.lat}, ${f.lng})</span>`:''}<br>المالك: ${esc(f.owner_name)}${f.tenant_name?'، المستأجر: '+esc(f.tenant_name):''}<br>المسؤول: ${esc(f.contact_name||'-')} ${esc(f.contact_phone||'')}</div>
 <div class="row">العاملون: ${f.workers??'-'}، الورديات: ${f.shifts??'-'}، أيام العمل بالشهر: ${f.work_days??'-'}، الإجازة: ${esc(f.weekly_off||'-')}<br>المواد: ${esc((f.materials||[]).join('، ')||'-')}</div>
 <div class="row">المياه: ${esc(f.water_source||'-')}${f.customer_account?'، حساب '+esc(f.customer_account):''}<br>الصرف: ${esc(f.discharge_type||'-')}، التوصيل: ${esc(f.connection_type||'-')}${(Pr.data||[]).length?'<br>الطلمبات: '+Pr.data.map(p=>p.hp+' حصان ('+esc(p.mode)+(p.hours_per_day?' '+p.hours_per_day+'س':'')+')').join('، '):''}</div></div>
 <div class="c"><h3>الاستهلاك والمنصرف</h3>${f.monthly_water_m3?`<div class="row">متوسط الاستهلاك الشهري: <b>${fm(f.monthly_water_m3)} م³</b><br>المنصرف الشهري (${FEE.discharge_pct||80}%): <b>${fm(dis)} م³</b><br><span class="m">المصدر: ${esc(f.water_source_note||'-')}، آخر تحديث ${f.water_updated_at||'-'}</span></div>`:'<div class="row bad">لا يوجد استهلاك مسجل: لا تُنشأ مسودة أعباء.</div>'}
 ${['gm','rq','ctl'].includes(me.role)?`<label>تحديث الاستهلاك الشهري (م³)</label><input id="wv" type="number" min="0" step="any"><label>المصدر</label><select id="wn"><option>فاتورة مياه حكومي</option><option>تقرير المياه الجوفية</option><option>تقدير المعاينة</option></select><button class="btn s" onclick="saveWater('${id}')">حفظ (يُسجَّل في سجل التغييرات)</button>`:''}</div>
 ${mfb}
 <div class="c"><h3>الزيارات (${(Ir.data||[]).length})</h3>${(Ir.data||[]).map(i=>`<div class="row m">${i.inspected_on}، ${esc(i.reason||'')}، ${esc(un[i.inspector_id]||'-')}</div>`).join('')||'<span class="m">لا زيارات</span>'}</div>
 <div class="c"><h3>العينات والنتائج</h3>${S.map(s=>{const r=s.lab_results&&s.lab_results[0];return`<div class="row" onclick="go('res','${s.id}')"><b>${esc(s.code)}</b> <span class="tag ${ST[s.status][1]}">${ST[s.status][0]}</span><br><span class="m">${s.collected_on}، ${esc(s.sample_type||'')}${r?`، BOD ${r.bod??'-'} COD ${r.cod??'-'} TSS ${r.tss??'-'} pH ${r.ph??'-'}`:'، بانتظار النتيجة'}</span></div>`}).join('')||'<span class="m">لا عينات</span>'}<h4>مقارنة العينات المتتالية</h4>${chartSVG(S)}</div>
 <div class="c"><h3>المطالبات ونماذج توفيق الأوضاع</h3>${(Cr.data||[]).map(c=>`<div class="row" onclick="go('cd','${c.id}')"><b>${TL[c.type]} #${c.serial}</b> <span class="tag ${CST[c.status][1]}">${CST[c.status][0]}</span>${c.type==='compliance_notice'?'':'<br><span class="m">'+fm(c.total)+' جنيه</span>'}</div>`).join('')||'<span class="m">لا مطالبات</span>'}</div>
 <div class="c"><h3>طلبات الترخيص</h3>${lic.map(l=>`<div class="row" onclick="go('ld','${l.id}')">${esc(l.status)} <span class="m">${l.created_at.slice(0,10)}</span></div>`).join('')||'<span class="m">لا طلبات مطابقة باسم المنشأة</span>'}</div>`};
/* إعادة ترقيم المنشآت (المدير العام) */
async function renumView(){const[F,B]=await Promise.all([sb.from('facilities').select('id,name,code,branch_id,registered_at').order('registered_at').order('id'),sb.from('branches').select('id,code,name')]);if(F.error)throw F.error;const bc=Object.fromEntries(B.data.map(b=>[b.id,b])),cnt={};
 const L=F.data.map(f=>{cnt[f.branch_id]=(cnt[f.branch_id]||0)+1;return{...f,nc:cnt[f.branch_id]+'/'+bc[f.branch_id].code}}),ch=L.filter(x=>x.nc!==x.code);
 return`<button class="btn s" onclick="go('set')">رجوع</button><div class="c"><h3>إعادة ترقيم المنشآت</h3><p class="m">الترتيب بتاريخ التسجيل (الأقدم فالأحدث) داخل كل فرع. هذه معاينة فقط، لن يتغير شيء قبل التنفيذ.</p><b>${ch.length} منشأة سيتغير كودها من ${L.length}</b>
 ${ch.slice(0,60).map(x=>`<div class="row m">${esc(x.name)}: ${esc(x.code||'-')} ← <b>${x.nc}</b></div>`).join('')}${ch.length>60?'<p class="m">… والباقي</p>':''}${ch.length?`<button class="btn" onclick="renumGo()">تنفيذ إعادة الترقيم</button>`:'<p>الأكواد مطابقة بالفعل.</p>'}</div>`}
async function renumGo(){if(!confirm('سيتم تغيير أكواد المنشآت. متابعة؟')||!confirm('تأكيد ثانٍ: الأكواد الظاهرة في المطالبات السابقة تُحسب من المنشأة وستتغير'))return;const{data,error}=await sb.rpc('renumber_facilities');if(error)return err(error);alert('تم ترقيم '+data+' منشأة');go('set')}
SETS.push(['renum','إعادة ترقيم المنشآت']);const set9=R.set;R.set=async function(sec){if(sec!=='renum')return set9(sec);if(me.role!=='gm')return'<div class="c">للمدير العام فقط</div>';return await renumView()};
(window.PARTS=window.PARTS||[]).push('p9');
