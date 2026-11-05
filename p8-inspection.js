/* ===== p8: استمارة المعاينة الكاملة + المسودات + الملغاة ===== */
let NV={},NID=null,NDYN={pc:-1,sc:-1},NLABS=[];
const nSel='#nf input[id],#nf select[id],#nf textarea[id]';
const nval=()=>{const o={};document.querySelectorAll(nSel).forEach(e=>{o[e.id]=e.value});return o};
const nset=o=>{Object.keys(o||{}).forEach(k=>{const e=document.getElementById(k);if(e&&e.closest('#nf'))e.value=o[k]})};
const nInt=x=>x===''||x==null||isNaN(+x)?null:Math.round(+x),nNum=x=>x===''||x==null||isNaN(+x)?null:+x;
function nRows(){const v=nval(),pc=Math.min(20,+v.pc||0),sc=Math.min(10,+v.sc||0),mk=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 if(NDYN.pc!==pc){NDYN.pc=pc;document.getElementById('pr').innerHTML=Array.from({length:pc},(_,i)=>`<div class="g"><div><label>قدرة الطلمبة ${i+1} (حصان)</label><input id="hp${i}" type="number" min="0" step="any"></div><div><label>طريقة التشغيل</label><select id="pm${i}" onchange="nIn()"><option>ساعات يومياً</option><option>عند انقطاع المياه فقط</option></select></div><div id="phw${i}"><label>ساعات التشغيل يومياً</label><input id="ph${i}" type="number" min="0" max="24" step="any"></div></div>`).join('');nset(NV)}
 if(NDYN.sc!==sc){NDYN.sc=sc;document.getElementById('sr').innerHTML=Array.from({length:sc},(_,i)=>`<div class="g"><div><label>نوع العينة ${i+1}</label><select id="st${i}"><option>بسيطة</option><option>مركبة</option></select></div><div><label>المخرج</label><input id="so${i}"></div><div><label>المعمل</label><select id="sl${i}">${NLABS.map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select></div></div>`).join('');nset(NV)}
 for(let i=0;i<pc;i++){const m=document.getElementById('pm'+i);document.getElementById('phw'+i).style.display=m&&m.value==='ساعات يومياً'?'':'none'}}
function nIn(){Object.assign(NV,nval());try{localStorage.setItem('nf_auto',JSON.stringify(NV))}catch(e){}
 const v=nval(),ws=v.ws||'حكومي',ext=v.cn==='كسح تابع لجهة خارج الشركة';
 document.getElementById('gv').style.display=ws==='جوفي'?'none':'';document.getElementById('gwp').style.display=ws==='حكومي'?'none':'';
 document.getElementById('ext').style.display=ext?'':'none';document.getElementById('sm').style.display=ext?'none':'';nRows()}
function nGps(){if(!navigator.geolocation)return alert('GPS غير متاح');navigator.geolocation.getCurrentPosition(p=>{document.getElementById('lat').value=p.coords.latitude.toFixed(6);document.getElementById('lng').value=p.coords.longitude.toFixed(6);nIn()},()=>alert('تعذر تحديد الموقع، فعّل الموقع للمتصفح'))}
R.new=async function(draftId){
  if(!['gm','rq','insp'].includes(me.role))return'<div class="c">غير مصرّح لدورك بإنشاء معاينات</div>';
  const pre=PRE?{...PRE}:null;NDYN={pc:-1,sc:-1};NID=null;NV={};
  NLABS=(await sb.from('labs').select('id,name').order('id')).data||[];
  if(draftId){const{data}=await sb.from('inspections').select('id,snapshot').eq('id',draftId).single();if(data){NID=data.id;NV=data.snapshot||{}}}
  else{try{NV=JSON.parse(localStorage.getItem('nf_auto')||'{}')}catch(e){NV={}}}
  const o=a=>a.map(x=>`<option>${x}</option>`).join('');
  setTimeout(()=>{if(!document.getElementById('nf'))return;nset(NV);nRows();nset(NV);if(pre)nset(pre);if(!document.getElementById('dd').value)document.getElementById('dd').value=today();if(me.role==='insp'&&me.branch_id&&!document.getElementById('br').value)document.getElementById('br').value=me.branch_id;nIn()},0);
  return`<div id="nf" oninput="nIn()" onchange="nIn()">${NID?'<div class="c m">تعديل مسودة محفوظة</div>':''}
  <div class="c"><h3>بيانات المعاينة</h3><label>سبب المعاينة</label><select id="rs">${o(['طلب توصيل','خطة الإدارة','مسح'])}</select>
  <div class="g"><div><label>تاريخ المعاينة</label><input id="dd" type="date"></div><div><label>الفرع</label><select id="br" ${me.role==='insp'&&me.branch_id?'disabled':''}>${BR.map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select></div></div></div>
  <div class="c"><h3>بيانات المنشأة</h3><label>اسم المنشأة *</label><input id="nm"><label>العنوان</label><input id="ad"><div class="g"><input id="lat" placeholder="خط العرض" readonly><input id="lng" placeholder="خط الطول" readonly></div><button type="button" class="btn s" onclick="nGps()">تحديد موقعي GPS</button>
  <label>اسم المالك *</label><input id="ow"><label>اسم المستأجر (اختياري)</label><input id="tn">
  <div class="g"><div><label>التصنيف *</label><select id="cl">${o(['','تجارية','صناعية','أخرى'])}</select></div><div><label>نوع النشاط</label><input id="ac"></div></div>
  <label>المواد المستخدمة (افصل بفاصلة)</label><input id="mt" placeholder="مثال: صبغات، أحماض، زيوت">
  <div class="g"><div><label>عدد العاملين</label><input id="wk" type="number" min="0"></div><div><label>عدد الورديات</label><input id="sh" type="number" min="0" max="6"></div><div><label>الإجازة الأسبوعية (اختياري)</label><input id="wo"></div><div><label>أيام العمل بالشهر (1–31)</label><input id="wd" type="number" min="1" max="31"></div></div>
  <div class="g"><div><label>اسم المسؤول بالمنشأة</label><input id="mg"></div><div><label>هاتفه</label><input id="mp" type="tel"></div></div>
  <div class="g"><div><label>متوسط الاستهلاك الشهري (م³)</label><input id="wm" type="number" min="0" step="any"></div><div><label>مصدر القيمة</label><select id="wsn">${o(['فاتورة مياه حكومي','تقرير المياه الجوفية','تقدير المعاينة'])}</select></div></div></div>
  <div class="c"><h3>مصادر المياه</h3><select id="ws">${o(['حكومي','جوفي','حكومي وجوفي'])}</select>
  <div id="gv"><label>رقم حساب العميل *</label><input id="ca"></div>
  <div id="gwp" style="display:none"><label>عدد الطلمبات</label><input id="pc" type="number" min="0" max="20"><div id="pr"></div></div></div>
  <div class="c"><h3>الصرف</h3><div class="g"><div><label>نوعية الصرف</label><select id="dt">${o(['صناعي','آدمي','خليط'])}</select></div><div><label>جهة التوصيل</label><select id="cn">${o(['على الشبكة','كسح تابع للشركة','كسح تابع لجهة خارج الشركة'])}</select></div></div>
  <p id="ext" class="bad" style="display:none"><b>لا يتم التعامل مع هذه المنشأة، وتُعتبر المعاينة كأن لم تكن.</b></p></div>
  <div class="c" id="sm"><h3>العينات</h3><label>عدد العينات (0 فأكثر)</label><input id="sc" type="number" min="0" max="10"><div id="sr"></div></div>
  <div class="c"><h3>الختام</h3><label>ملاحظات المعاين</label><textarea id="nt" rows="3"></textarea><p class="m">المعاين: ${esc(me.full_name)} (تلقائياً). المرفقات والصور في جزء لاحق.</p>
  <button type="button" class="btn s" onclick="nDraft()">حفظ كمسودة</button><button type="button" class="btn" onclick="nSave()">اعتماد وحفظ</button></div></div>`};
function nCheck(v){const m=[];if(!v.nm.trim())m.push('اسم المنشأة');if(!v.ow.trim())m.push('اسم المالك');if(!v.cl)m.push('التصنيف');
 if(v.ws!=='جوفي'&&!v.ca.trim())m.push('رقم حساب العميل');
 if(v.wd!==''&&(+v.wd<1||+v.wd>31))m.push('أيام العمل بين 1 و31');
 [['wk','عدد العاملين'],['sh','عدد الورديات'],['wm','الاستهلاك الشهري']].forEach(([k,t])=>{if(v[k]!==''&&+v[k]<0)m.push(t+' لا يكون سالباً')});
 if(v.ws!=='حكومي'){const n=+v.pc||0;if(!n)m.push('عدد الطلمبات للمصدر الجوفي');for(let i=0;i<n;i++){if(!(+v['hp'+i]>0))m.push('قدرة الطلمبة '+(i+1));if(v['pm'+i]==='ساعات يومياً'&&!(+v['ph'+i]>0&&+v['ph'+i]<=24))m.push('ساعات الطلمبة '+(i+1)+' (1–24)')}}
 return m}
async function nDraft(){try{const v=nval();if(!v.nm.trim())return alert('اكتب اسم المنشأة على الأقل');const row={reason:v.rs,inspected_on:v.dd||today(),branch_id:+v.br,inspector_id:me.id,status:'draft',notes:v.nt||null,snapshot:v};
 const{error}=NID?await sb.from('inspections').update(row).eq('id',NID):await sb.from('inspections').insert(row);if(error)throw error;try{localStorage.removeItem('nf_auto')}catch(e){}NID=null;alert('تم حفظ المسودة');go('drafts')}catch(e){err(e)}}
async function nSave(){try{const v=nval(),m=nCheck(v);if(m.length)return alert('أكمل/صحّح: '+m.join('، '));const br=+v.br,b=BR.find(x=>x.id===br);
 if(v.cn==='كسح تابع لجهة خارج الشركة'){const row={reason:v.rs,inspected_on:v.dd,branch_id:br,inspector_id:me.id,status:'cancelled',notes:'لا يتم التعامل مع هذه المنشأة',snapshot:v};
  const{error}=NID?await sb.from('inspections').update(row).eq('id',NID):await sb.from('inspections').insert(row);if(error)throw error;try{localStorage.removeItem('nf_auto')}catch(e){}NID=null;alert('لا يتم التعامل مع هذه المنشأة، وتُعتبر المعاينة كأن لم تكن. حُفظت في أرشيف المعاينات الملغاة.');return go('fac')}
 const fp={name:v.nm.trim(),address:v.ad||null,lat:nNum(v.lat),lng:nNum(v.lng),owner_name:v.ow.trim(),tenant_name:v.tn||null,classification:v.cl,activity:v.ac||null,materials:v.mt?v.mt.split(/[,،]/).map(x=>x.trim()).filter(Boolean):null,workers:nInt(v.wk),shifts:nInt(v.sh),weekly_off:v.wo||null,work_days:nInt(v.wd),contact_name:v.mg||null,contact_phone:v.mp||null,water_source:v.ws,customer_account:v.ws==='جوفي'?null:v.ca.trim(),discharge_type:v.dt,connection_type:v.cn};
 if(v.wm!==''){fp.monthly_water_m3=nNum(v.wm);fp.water_source_note=v.wsn;fp.water_updated_at=today()}
 let q=sb.from('facilities').select('id,code').eq('branch_id',br).eq('name',fp.name).eq('owner_name',fp.owner_name).is('deleted_at',null).limit(1);if(fp.address)q=q.eq('address',fp.address);
 const{data:ex}=await q;let f=ex&&ex[0];
 if(f){if(!confirm('المنشأة مسجلة سابقاً ('+f.code+')، هل تريد ربط المعاينة بها؟'))return;const{error}=await sb.from('facilities').update(fp).eq('id',f.id);if(error)throw error}
 else{const{data:code,error:e1}=await sb.rpc('next_facility_code',{b:br});if(e1)throw e1;const{data,error}=await sb.from('facilities').insert({...fp,code,branch_id:br}).select('id,code').single();if(error)throw error;f=data}
 if(v.ws!=='حكومي'){await sb.from('pumps').delete().eq('facility_id',f.id);const n=+v.pc||0,P=[];for(let i=0;i<n;i++)P.push({facility_id:f.id,hp:+v['hp'+i],mode:v['pm'+i],hours_per_day:v['pm'+i]==='ساعات يومياً'?+v['ph'+i]:null});if(P.length){const{error}=await sb.from('pumps').insert(P);if(error)throw error}}
 const row={facility_id:f.id,reason:v.rs,inspected_on:v.dd,branch_id:br,inspector_id:me.id,status:'approved',notes:v.nt||null,snapshot:v,license_request_id:LINK};let iid;
 if(NID){const{error}=await sb.from('inspections').update(row).eq('id',NID);if(error)throw error;iid=NID}else{const{data,error}=await sb.from('inspections').insert(row).select('id').single();if(error)throw error;iid=data.id}
 const sc=Math.min(10,+v.sc||0);if(sc){const d=v.dd.replace(/-/g,'').slice(2),S=[];for(let i=0;i<sc;i++)S.push({code:`${b.code}-${d}-${rnd()}`,inspection_id:iid,facility_id:f.id,sample_type:v['st'+i],outlet:v['so'+i]||null,lab_id:+v['sl'+i]||null,collected_on:v.dd});const{error}=await sb.from('samples').insert(S);if(error)throw error}
 try{localStorage.removeItem('nf_auto')}catch(e){}NID=null;LINK=null;alert('تم الاعتماد. كود المنشأة: '+f.code);go('fac')}catch(e){err(e)}}
async function delDraft(id){if(!confirm('حذف المسودة؟'))return;const{error}=await sb.from('inspections').delete().eq('id',id);if(error)return err(error);go('drafts')}
Object.assign(R,{
async drafts(){let q=sb.from('inspections').select('id,inspected_on,snapshot,branch_id').eq('status','draft').order('created_at',{ascending:false});if(me.role!=='gm')q=q.eq('inspector_id',me.id);const{data,error}=await q;if(error)throw error;
 return`<button class="btn s" onclick="go('fac')">رجوع</button><div class="c"><h3>مسودات المعاينات</h3>${(data||[]).map(d=>`<div class="row"><b>${esc((d.snapshot&&d.snapshot.nm)||'بدون اسم')}</b> <span class="m">${d.inspected_on}، ${esc((BR.find(b=>b.id===d.branch_id)||{}).name)}</span><div class="g"><button class="btn s" onclick="go('new','${d.id}')">متابعة</button><button class="btn s" onclick="delDraft('${d.id}')">حذف</button></div></div>`).join('')||'<span class="m">لا توجد مسودات</span>'}</div>`},
async canc(){if(!['gm','rq'].includes(me.role))return'<div class="c">للمدير العام ومدير الرقابة</div>';const{data,error}=await sb.from('inspections').select('id,inspected_on,snapshot,branch_id').eq('status','cancelled').order('created_at',{ascending:false});if(error)throw error;
 return`<button class="btn s" onclick="go('fac')">رجوع</button><div class="c"><h3>معاينات ملغاة (كسح خارج الشركة)</h3>${(data||[]).map(d=>`<div class="row"><b>${esc((d.snapshot&&d.snapshot.nm)||'-')}</b><br><span class="m">${esc((d.snapshot&&d.snapshot.ad)||'-')}، ${d.inspected_on}، ${esc((BR.find(b=>b.id===d.branch_id)||{}).name)}</span></div>`).join('')||'<span class="m">لا توجد</span>'}</div>`}});
const fac8=R.fac;R.fac=async function(a){const t=['gm','rq','insp'].includes(me.role)?`<div class="g"><button class="btn s" onclick="go('drafts')">مسوداتي</button>${['gm','rq'].includes(me.role)?'<button class="btn s" onclick="go(\'canc\')">معاينات ملغاة</button>':'<span></span>'}</div><div style="height:10px"></div>`:'';return t+await fac8(a)};
(window.PARTS=window.PARTS||[]).push('p8');
