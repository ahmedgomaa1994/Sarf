/* ===== p15: المرفقات والصور (Supabase Storage) ===== */
const ATTB='attachments';let ATTK=null;
function attKey(){try{ATTK=localStorage.getItem('attk_'+me.id)||(window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+rnd());localStorage.setItem('attk_'+me.id,ATTK)}catch(e){ATTK=ATTK||String(Date.now())}return ATTK}
async function compressImg(f){if(!/^image\/(jpeg|png|webp)/.test(f.type)||f.size<350000)return f;try{const bm=await createImageBitmap(f),sc=Math.min(1,1600/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.round(bm.width*sc);c.height=Math.round(bm.height*sc);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);
 const b=await new Promise(r=>c.toBlob(r,'image/jpeg',.8));return b&&b.size<f.size?new File([b],f.name.replace(/\.\w+$/,'')+'.jpg',{type:'image/jpeg'}):f}catch(e){return f}}
async function attInner(e,i,t){const{data:A,error}=await sb.from('attachments').select('*').eq('entity',e).eq('entity_id',String(i)).order('created_at',{ascending:false});
 if(error)return`<h3>${t}</h3><p class="bad">تعذر تحميل المرفقات: ${esc(error.message)}<br>شغّل p15-patch.sql أولاً.</p>`;
 let U={};if((A||[]).length){const{data:S}=await sb.storage.from(ATTB).createSignedUrls(A.map(a=>a.path),3600);(S||[]).forEach(s=>U[s.path]=s.signedUrl)}
 return`<h3>${t} (${(A||[]).length})</h3>${(A||[]).map(a=>{const u=U[a.path]||'#',img=/^image\//.test(a.mime||'');return`<div class="row">${img?`<a href="${u}" target="_blank"><img src="${u}" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:8px"></a>`:`<a href="${u}" target="_blank">📄 ${esc(a.name||'ملف')}</a>`}<div class="m">${esc(a.name||'')} — ${new Date(a.created_at).toLocaleDateString('ar-EG')}${me.role==='gm'||a.uploaded_by===me.id?` <a href="#" onclick="attDel(this,'${a.id}','${esc(a.path)}');return false" style="color:var(--er)">حذف</a>`:''}</div></div>`}).join('')||'<span class="m">لا توجد مرفقات</span>'}
 <label>إضافة ملفات أو صور (حتى 10 ملفات)</label><input type="file" accept="image/*,application/pdf" multiple><label>أو تصوير مباشر</label><input type="file" accept="image/*" capture="environment"><button class="btn s" onclick="attUp(this)">رفع</button><div class="m att-st"></div>`}
async function attBox(e,i,t){return`<div class="c attbox" data-e="${esc(e)}" data-i="${esc(i)}" data-t="${esc(t)}">${await attInner(e,i,t)}</div>`}
async function attRefresh(box){box.innerHTML=await attInner(box.dataset.e,box.dataset.i,box.dataset.t)}
async function attUp(btn){const box=btn.closest('.attbox'),st=box.querySelector('.att-st'),files=[...box.querySelectorAll('input[type=file]')].flatMap(x=>[...x.files]).slice(0,10);
 if(!files.length)return alert('اختر ملفاً أو صورة أولاً');let ok=0;
 for(const f0 of files){try{st.textContent='جارٍ رفع '+(ok+1)+' من '+files.length+'…';if(f0.size>15e6){alert('الملف '+f0.name+' أكبر من 15 ميجا');continue}
  const f=await compressImg(f0),ext=(f.type.split('/')[1]||'bin').replace('jpeg','jpg').replace(/[^a-z0-9]/gi,''),path=`${box.dataset.e}/${box.dataset.i}/${Date.now()}-${rnd()}.${ext}`;
  const{error}=await sb.storage.from(ATTB).upload(path,f,{contentType:f.type||'application/octet-stream'});if(error)throw error;
  const{error:e2}=await sb.from('attachments').insert({entity:box.dataset.e,entity_id:String(box.dataset.i),path,name:f0.name,mime:f.type,size:f.size});if(e2)throw e2;ok++}catch(e){err(e)}}
 await attRefresh(box);const s2=box.querySelector('.att-st');if(s2)s2.textContent=ok?'تم رفع '+ok+' ملف':''}
async function attDel(a,id,path){if(!confirm('حذف المرفق؟'))return;const box=a.closest('.attbox');try{await sb.storage.from(ATTB).remove([path]);const{error}=await sb.from('attachments').delete().eq('id',id);if(error)throw error;await attRefresh(box)}catch(e){err(e)}}
/* --- ربط المرفقات بالشاشات --- */
const wrapAtt=(k,e,t,idf)=>{const f=R[k];if(!f)return;R[k]=async function(a){const h=await f.call(this,a),id=idf?idf(a):a;return h+(id?await attBox(e,id,t):'')}};
wrapAtt('res','sample','تقرير المعمل ومرفقات العينة');wrapAtt('pd','claim','صور الإيصالات ومستندات المطالبة');wrapAtt('ld','license','مستندات الطلب');
const cd15=R.cd;R.cd=async function(id){const h=await cd15.call(this,id),{data:c}=await sb.from('claims').select('type').eq('id',id).single();return h+(c&&c.type==='compliance_notice'?await attBox('claim',id,'صورة النموذج الموقّع من المستلم'):'')};
const fd15=R.fd;R.fd=async function(id){const h=await fd15.call(this,id),{data:I}=await sb.from('inspections').select('id,inspected_on').eq('facility_id',id).eq('status','approved').order('inspected_on',{ascending:false});
 return h+((I||[]).length?`<div class="c"><h3>صور ومرفقات المعاينات</h3>${I.map(i=>`<button class="btn s" onclick="go('att','inspection:${i.id}')">معاينة ${i.inspected_on}</button>`).join('')}</div>`:'')};
Object.assign(R,{async att(arg){const i=arg.indexOf(':'),e=arg.slice(0,i),id=arg.slice(i+1);return`<button class="btn s" onclick="history.length>1?go('fac'):go('home')">رجوع</button>`+await attBox(e,id,'مرفقات المعاينة')}});
/* --- مرفقات استمارة المعاينة قبل الحفظ ثم ربطها بالمعاينة --- */
const new15=R.new;R.new=async function(a){const h=await new15.call(this,a);if(typeof h!=='string'||!h.includes('<h3>الختام</h3>'))return h;
 return h.replace('<div class="c"><h3>الختام</h3>',await attBox('inspection_draft',attKey(),'صور ومرفقات المعاينة')+'<div class="c"><h3>الختام</h3>')};
const save15=saveInsp;saveInsp=async function(){const key=attKey(),t0=new Date(Date.now()-2000).toISOString();await save15.apply(this,arguments);
 try{const{data:I}=await sb.from('inspections').select('id').eq('inspector_id',me.id).eq('status','approved').gte('created_at',t0).order('created_at',{ascending:false}).limit(1);
  if(I&&I[0]){await sb.from('attachments').update({entity:'inspection',entity_id:I[0].id}).eq('entity','inspection_draft').eq('entity_id',key);localStorage.removeItem('attk_'+me.id)}}catch(e){}};
(window.PARTS=window.PARTS||[]).push('p15');
