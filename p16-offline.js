/* ===== p16: العمل بدون إنترنت + قائمة المزامنة + تثبيت التطبيق ===== */
const oqKey=()=>'oq_'+(me?me.id:'x'),oqGet=()=>{try{return JSON.parse(localStorage.getItem(oqKey())||'[]')}catch(e){return[]}},oqSet=a=>{try{localStorage.setItem(oqKey(),JSON.stringify(a))}catch(e){alert('مساحة التخزين على الجهاز ممتلئة')}};
let SYNCING=false;
async function isOnline(){if(navigator.onLine===false)return false;try{const c=new AbortController(),t=setTimeout(()=>c.abort(),2500);await fetch(SB_URL+'/rest/v1/',{headers:{apikey:SB_KEY},signal:c.signal,cache:'no-store'});clearTimeout(t);return true}catch(e){return false}}
const isNetErr=e=>/failed to fetch|network|load failed|abort/i.test(String((e&&e.message)||e));
function ofbUpdate(){try{const e=document.getElementById('ofb');if(!e)return;const n=oqGet().length,off=navigator.onLine===false;e.innerHTML=(off?'<span style="color:#ffd27a">⚠ دون اتصال</span> ':'')+(n?`<a href="#" onclick="go('sync');return false" style="color:#fff">⏳ ${n} بانتظار المزامنة</a>`:'')}catch(e){}}
const _shell16=shell;shell=function(body){_shell16(body);try{const h=document.querySelector('header');if(h&&!document.getElementById('ofb')){const b=h.querySelector('b');if(b)b.insertAdjacentHTML('afterend','<span id="ofb" style="font-size:12px"></span>')}}catch(e){}ofbUpdate()};
window.addEventListener('online',()=>{ofbUpdate();syncQueue(false)});window.addEventListener('offline',ofbUpdate);
/* --- حفظ المعاينة دون اتصال --- */
function inspMiss(v){const t=x=>(x||'').trim(),m=[];if(!t(v.nm))m.push('اسم المنشأة');if(!t(v.ow))m.push('اسم المالك');if(!v.cl)m.push('التصنيف');if(v.ws!=='جوفي'&&!t(v.ca))m.push('رقم حساب العميل (للحكومي)');
 if(v.ws!=='حكومي'&&!(v.pu.length&&v.pu.every(p=>+p.hp>0)))m.push('بيانات الطلمبات (للجوفي)');if(v.wd!==''&&(+v.wd<1||+v.wd>31))m.push('أيام العمل بين 1 و31');return m}
async function queueInsp(){const v=fv(),miss=inspMiss(v);if(miss.length)return alert('أكمل أو صحّح: '+miss.join('، '));
 const b=BR.find(x=>x.id===+v.br),ext=v.cn==='كسح تابع لجهة خارج الشركة',ds=(v.md||today()).replace(/-/g,'').slice(2),codes=ext?[]:v.sm.map(()=>`${b.code}-${ds}-${rnd()}`),q=oqGet();
 q.push({id:Date.now()+'-'+rnd(),v,codes,link:LINK,draft:DRAFT_ID,at:new Date().toISOString()});oqSet(q);clearDraft();LINK=null;
 alert('لا يوجد اتصال: حُفظت المعاينة على الجهاز وستُرفع تلقائياً عند عودة الإنترنت.'+(codes.length?'\nأكواد العينات (اكتبها على العبوات):\n'+codes.join('\n'):''));go('sync')}
const _save16=saveInsp;saveInsp=async function(){if(await isOnline())return _save16.apply(this,arguments);return queueInsp()};
/* --- المزامنة --- */
async function doSaveInsp(it){const v=it.v,t=x=>(x||'').trim(),br=+v.br;
 if(v.cn==='كسح تابع لجهة خارج الشركة'){const{error}=await sb.from('inspections').insert({reason:v.rs,inspected_on:v.md||today(),branch_id:br,inspector_id:me.id,status:'cancelled',notes:v.nt||null,snapshot:v});if(error)throw error;if(it.draft)await sb.from('inspections').delete().eq('id',it.draft);return{note:'معاينة ملغاة (كسح خارجي)'}}
 const fp={name:t(v.nm),address:t(v.ad)||null,lat:v.la?+v.la:null,lng:v.ln?+v.ln:null,owner_name:t(v.ow),tenant_name:t(v.tn)||null,classification:v.cl,activity:t(v.ac)||null,materials:t(v.mt)?t(v.mt).split(/[,،]/).map(x=>x.trim()).filter(Boolean):null,workers:v.wk===''?null:+v.wk,shifts:v.sh===''?null:+v.sh,weekly_off:t(v.wo)||null,work_days:v.wd===''?null:+v.wd,contact_name:t(v.mg)||null,contact_phone:t(v.mp)||null,water_source:v.ws,customer_account:t(v.ca)||null,discharge_type:v.dt,connection_type:v.cn};
 if(v.wm!==''){fp.monthly_water_m3=+v.wm;fp.water_source_note=v.wn;fp.water_updated_at=today()}
 let q=sb.from('facilities').select('id,code').eq('name',fp.name).eq('owner_name',fp.owner_name).is('deleted_at',null);q=fp.address?q.eq('address',fp.address):q.is('address',null);
 const{data:ex,error:e0}=await q.limit(1);if(e0)throw e0;let f=ex&&ex[0],linked=false;
 if(f){linked=true;const{error}=await sb.from('facilities').update(fp).eq('id',f.id);if(error)throw error}
 else{const{data:code,error:e1}=await sb.rpc('next_facility_code',{b:br});if(e1)throw e1;const{data,error}=await sb.from('facilities').insert({...fp,code,branch_id:br}).select('id,code').single();if(error)throw error;f=data}
 await sb.from('pumps').delete().eq('facility_id',f.id);
 if(v.ws!=='حكومي'&&v.pu.length){const{error}=await sb.from('pumps').insert(v.pu.map(p=>({facility_id:f.id,hp:+p.hp,mode:p.md,hours_per_day:p.md==='ساعات يومياً'&&p.hr!==''?+p.hr:null})));if(error)throw error}
 const d=v.md||today(),{data:ins,error:e2}=await sb.from('inspections').insert({facility_id:f.id,reason:v.rs,inspected_on:d,branch_id:br,inspector_id:me.id,status:'approved',notes:v.nt||null,snapshot:{...v,synced_offline:true},license_request_id:it.link||null}).select('id').single();if(e2)throw e2;
 if(v.sm.length){const{error}=await sb.from('samples').insert(v.sm.map((s,i)=>({code:it.codes[i],inspection_id:ins.id,facility_id:f.id,sample_type:s.t,outlet:s.o||null,lab_id:s.l?+s.l:null,collected_on:d})));if(error)throw error}
 if(it.draft)await sb.from('inspections').delete().eq('id',it.draft);
 return{code:f.code,linked,note:(linked?'رُبطت بمنشأة مسجلة ':'منشأة جديدة ')+f.code}}
async function syncQueue(manual){if(SYNCING||!me)return;SYNCING=true;const res=[];
 try{const q0=oqGet();if(!q0.length){if(manual)alert('لا توجد عناصر بانتظار المزامنة');return}
  if(!(await isOnline())){if(manual)alert('لا يوجد اتصال بالإنترنت الآن');return}
  let q=oqGet();
  for(const it of q0){if(!oqGet().some(x=>x.id===it.id))continue;
   try{const r=await doSaveInsp(it);res.push('✓ '+(it.v.nm)+' — '+r.note);q=oqGet().filter(x=>x.id!==it.id);oqSet(q)}
   catch(e){if(isNetErr(e)){res.push('⏸ توقفت المزامنة لانقطاع الاتصال');break}res.push('✗ '+it.v.nm+': '+(e.message||e));oqSet(oqGet().map(x=>x.id===it.id?{...x,err:String(e.message||e)}:x))}}
 }finally{SYNCING=false}
 ofbUpdate();if(res.length&&(manual||res.some(x=>x[0]==='✓')))alert(res.join('\n'));if(V==='sync')go('sync')}
Object.assign(R,{async sync(){const q=oqGet(),on=navigator.onLine!==false;
 return`<div class="c"><h3>المزامنة</h3><span class="m">${on?'متصل':'<b>دون اتصال</b>'} — ${q.length} عنصر بانتظار الرفع</span><button class="btn" onclick="syncQueue(true)">مزامنة الآن</button></div>
 ${q.map(it=>`<div class="c"><b>${esc(it.v.nm)}</b><br><span class="m">${esc(it.v.md||'')} — ${it.codes.length} عينة${it.codes.length?'<br>'+it.codes.map(esc).join('، '):''}</span>${it.err?`<p class="bad">آخر خطأ: ${esc(it.err)}</p>`:''}<button class="btn s" onclick="oqDel('${it.id}')">حذف من القائمة</button></div>`).join('')||'<div class="c m">لا توجد عناصر</div>'}`}});
function oqDel(id){if(!confirm('حذف هذه المعاينة من الجهاز نهائياً؟'))return;oqSet(oqGet().filter(x=>x.id!==id));ofbUpdate();go('sync')}
/* --- عرض آخر البيانات المحفوظة عند انقطاع الاتصال --- */
const rcKey=(k,a)=>'rc_'+(me?me.id:'x')+'_'+k+'_'+(a||'');
['home','fac','samp','plan','fd','res','cl','col'].forEach(k=>{const f=R[k];if(!f)return;R[k]=async function(a){try{const h=await f.call(this,a);if(typeof h==='string'&&h.length<250000){try{localStorage.setItem(rcKey(k,a),JSON.stringify({t:new Date().toLocaleString('ar-EG'),h}))}catch(e){}}return h}
 catch(e){let c=null;try{c=JSON.parse(localStorage.getItem(rcKey(k,a))||'null')}catch(x){}if(c&&(navigator.onLine===false||isNetErr(e)))return`<div class="c" style="border-color:var(--wn)">⚠ دون اتصال — آخر بيانات محفوظة (${c.t}). التعديل يتطلب اتصالاً، عدا المعاينة الجديدة.</div>`+c.h;throw e}}});
/* --- الدخول دون اتصال + مسح الذاكرة عند الخروج --- */
const _boot16=boot;boot=async function(){const raw=localStorage.getItem('offcfg');
 if(raw&&!(await isOnline())){try{const c=JSON.parse(raw);me=c.me;BR=c.BR;LIM=c.LIM;FEE=c.FEE;TIERS=c.TIERS;go('home');return}catch(e){}}
 await _boot16();if(me){try{localStorage.setItem('offcfg',JSON.stringify({me,BR,LIM,FEE,TIERS}))}catch(e){}ofbUpdate();syncQueue(false)}};
const _out16=out;out=async function(){try{Object.keys(localStorage).filter(k=>k.startsWith('rc_')||k==='offcfg').forEach(k=>localStorage.removeItem(k))}catch(e){}return _out16.apply(this,arguments)};
/* --- تثبيت التطبيق وملف الخدمة --- */
try{if(!document.querySelector('link[rel=manifest]'))document.head.insertAdjacentHTML('beforeend','<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#1b3a63">');if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}
(window.PARTS=window.PARTS||[]).push('p16');
