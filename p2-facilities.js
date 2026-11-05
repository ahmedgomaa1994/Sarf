const R={
async fac(){const{data,error}=await sb.from('facilities').select('id,code,name,address,classification,branch_id,monthly_water_m3').is('deleted_at',null).order('registered_at',{ascending:false}).limit(200);
  if(error)throw error;
  return`<div class="c">${(data||[]).map(f=>`<div class="row"><b>${esc(f.name)}</b> <span class="m">${esc(f.code)}</span><br><span class="m">${esc(BR.find(b=>b.id==f.branch_id)?.name)}، ${esc(f.classification)}${f.monthly_water_m3?'':' · لا استهلاك مسجل'}</span>${['gm','rq'].includes(me.role)?`<br><button class="btn s" style="min-height:36px;margin-top:6px" onclick="delFac('${f.id}')">حذف (للأرشيف)</button>`:''}</div>`).join('')||'<span class="m">لا توجد منشآت</span>'}</div>`},
async new(){
  if(!['gm','rq','insp'].includes(me.role))return'<div class="c">غير مصرّح لدورك بإنشاء معاينات</div>';
  const o=a=>a.map(x=>`<option>${x}</option>`).join('');
  return`<div class="c"><h3>معاينة جديدة</h3>
  <label>سبب المعاينة</label><select id="rs">${o(['طلب توصيل','خطة الإدارة','مسح'])}</select>
  <label>الفرع</label><select id="br">${BR.map(b=>`<option value="${b.id}" ${me.branch_id==b.id?'selected':''}>${esc(b.name)}</option>`).join('')}</select>
  <label>اسم المنشأة *</label><input id="nm"><label>العنوان</label><input id="ad"><label>اسم المالك *</label><input id="ow">
  <div class="g"><div><label>التصنيف *</label><select id="cl">${o(['','تجارية','صناعية','أخرى'])}</select></div><div><label>النشاط</label><input id="ac"></div>
  <div><label>مصدر المياه</label><select id="ws">${o(['حكومي','جوفي','حكومي وجوفي'])}</select></div><div><label>الاستهلاك الشهري م³</label><input id="wm" type="number" min="0"></div></div>
  <label>رقم حساب العميل (للحكومي)</label><input id="ca">
  <div class="g"><div><label>نوعية الصرف</label><select id="dt">${o(['صناعي','آدمي','خليط'])}</select></div><div><label>جهة التوصيل</label><select id="cn">${o(['على الشبكة','كسح تابع للشركة','كسح تابع لجهة خارج الشركة'])}</select></div></div>
  <label>عدد العينات</label><input id="sc" type="number" min="0" max="10" value="1" oninput="smp()"><div id="sl"></div>
  <label>ملاحظات</label><textarea id="nt" rows="2"></textarea><button class="btn" onclick="saveInsp()">اعتماد وحفظ</button></div>`},
async samp(){const{data,error}=await sb.from('samples').select('id,code,status,collected_on,sample_type,facilities(name)').order('collected_on',{ascending:false}).limit(200);if(error)throw error;
  return`<div class="c">${(data||[]).map(s=>`<div class="row" onclick="go('res','${s.id}')"><b>${esc(s.code)}</b> <span class="tag ${ST[s.status][1]}">${ST[s.status][0]}</span><br><span class="m">${esc(s.facilities?.name)}، ${s.collected_on}، ${esc(s.sample_type)}</span></div>`).join('')||'<span class="m">لا توجد عينات</span>'}</div>`},
async res(id){const{data:s}=await sb.from('samples').select('*,facilities(name)').eq('id',id).single();
  const{data:r}=await sb.from('lab_results').select('*').eq('sample_id',id).order('received_on',{ascending:false}).limit(1);const x=(r&&r[0])||{};
  const F=[['temp','الحرارة °م'],['ph','pH'],['bod','BOD'],['cod','COD'],['tss','TSS'],['og','زيوت وشحوم'],['settle10','راسبة 10 د'],['settle15','راسبة 15 د']];
  const can=me.role!=='lic'&&me.role!=='col'&&me.role!=='ctl'&&(['gm','rq'].includes(me.role)||me.job_title==='كيميائي');
  return`<button class="btn s" onclick="go('samp')">رجوع</button><div class="c"><h3>${esc(s.code)} <span class="tag ${ST[s.status][1]}">${ST[s.status][0]}</span></h3><span class="m">${esc(s.facilities?.name)}</span>
  <div class="g">${F.map(([k,t])=>`<div><label>${t}</label><input id="r_${k}" type="number" step="any" value="${x[k]??''}" ${can?'':'disabled'}></div>`).join('')}</div>
  ${can?`<button class="btn" onclick="saveRes('${id}')">حفظ وتقييم</button>`:'<p class="m">الإدخال للكيميائي ومدير الرقابة والمدير العام</p>'}</div>`}};

function smp(){const n=Math.min(10,+$('#sc').value||0);$('#sl').innerHTML=Array.from({length:n},(_,i)=>`<div class="g"><div><label>نوع العينة ${i+1}</label><select class="st"><option>بسيطة</option><option>مركبة</option></select></div><div><label>المخرج</label><input class="so"></div></div>`).join('')}
async function saveInsp(){try{
  const v=i=>$('#'+i).value.trim(),br=+v('br'),b=BR.find(x=>x.id==br);
  if(!v('nm')||!v('ow')||!v('cl'))return alert('أكمل: اسم المنشأة والمالك والتصنيف');
  if(v('ws')!=='جوفي'&&!v('ca'))return alert('رقم حساب العميل إجباري للمصدر الحكومي');
  if(v('cn')==='كسح تابع لجهة خارج الشركة'){await sb.from('inspections').insert({reason:v('rs'),branch_id:br,inspector_id:me.id,status:'cancelled',notes:'لا يتم التعامل مع هذه المنشأة: '+v('nm')});alert('لا يتم التعامل مع هذه المنشأة، وتُعتبر المعاينة كأن لم تكن.');return go('fac')}
  let{data:f}=await sb.from('facilities').select('id,code').eq('branch_id',br).eq('name',v('nm')).eq('owner_name',v('ow')).is('deleted_at',null).maybeSingle();
  if(f){if(!confirm('المنشأة مسجلة سابقاً، هل تريد ربط المعاينة بها؟'))return}
  else{const{data:code,error:e1}=await sb.rpc('next_facility_code',{b:br});if(e1)throw e1;
    const{data,error}=await sb.from('facilities').insert({code,branch_id:br,name:v('nm'),address:v('ad'),owner_name:v('ow'),classification:v('cl'),activity:v('ac'),water_source:v('ws'),customer_account:v('ca')||null,discharge_type:v('dt'),connection_type:v('cn'),monthly_water_m3:+v('wm')||null}).select('id,code').single();if(error)throw error;f=data}
  const{data:ins,error:e2}=await sb.from('inspections').insert({facility_id:f.id,reason:v('rs'),branch_id:br,inspector_id:me.id,status:'approved',notes:v('nt'),license_request_id:LINK}).select('id').single();if(e2)throw e2;LINK=null;
  const t=[...document.querySelectorAll('.st')].map(e=>e.value),o=[...document.querySelectorAll('.so')].map(e=>e.value);
  if(t.length){const d=today().replace(/-/g,'').slice(2);const{error:e3}=await sb.from('samples').insert(t.map((x,i)=>({code:`${b.code}-${d}-${rnd()}`,inspection_id:ins.id,facility_id:f.id,sample_type:x,outlet:o[i]})));if(e3)throw e3}
  alert('تم الحفظ. كود المنشأة: '+f.code);go('fac')}catch(e){err(e)}}
async function saveRes(id){try{
  const g=k=>{const x=$('#r_'+k).value;return x===''?null:+x},v={temp:g('temp'),ph:g('ph'),bod:g('bod'),cod:g('cod'),tss:g('tss'),og:g('og'),settle10:g('settle10'),settle15:g('settle15')};
  const bad=[['bod','BOD'],['tss','TSS'],['cod','COD'],['og','OG']].some(([k,p])=>v[k]!=null&&LIM[p]?.max_value!=null&&v[k]>LIM[p].max_value)||(v.ph!=null&&LIM.pH&&(v.ph>LIM.pH.max_value||v.ph<LIM.pH.min_value));
  const{error}=await sb.from('lab_results').insert({sample_id:id,...v,received_on:today(),entered_by:me.id});if(error)throw error;
  const{error:e2}=await sb.from('samples').update({status:bad?'fail':'pass'}).eq('id',id);if(e2)throw e2;go('res',id)}catch(e){err(e)}}

(window.PARTS=window.PARTS||[]).push('p2');
