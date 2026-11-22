/* ===== p28: أعباء تلقائية من نتيجة العينة + تنبيه المُصدِر + ترحيل المبالغ + تعديل/حذف/إرجاع المطالبة ===== */
const officersOf=async b=>((await sb.from('branch_claim_assignments').select('user_id').eq('branch_id',b)).data||[]).map(x=>x.user_id);
async function notifyIssuers(b,text,link){try{for(const u of await officersOf(b))await notify(null,text,link,u);await notify('ctl',text,link)}catch(e){}}
const isIssuerOf=(branch,type)=>cap('claims_issue')||(typeof OFF!=='undefined'&&(OFF||[]).includes(branch)&&['analysis_cost','treatment_burden','compliance_notice'].includes(type));
/* --- 1) إنشاء المسودات تلقائياً بعد حفظ نتيجة العينة --- */
async function autoClaims(sid){try{const P=await planClaims(sid);if(!P.f||P.conf===null)return 0;const made=[];
 for(const it of P.items){if(it.exist)continue;let id=null;
  const{data,error}=await sb.rpc('create_auto_claim',{p_type:it.type,p_facility:P.f.id,p_sample:it.extra.sample_id,p_inspection:it.extra.inspection_id,p_lines:it.lines,p_snapshot:{fees:FEE,vat_applied:it.type==='analysis_cost'||(it.type==='treatment_burden'&&+FEE.vat_on_treatment===1),auto:true}});
  if(error){if(/function|schema cache|42883|PGRST202/i.test(error.message)&&await canMk(P.f.branch_id))id=await mkClaim(it.type,{id:P.f.id,branch_id:P.f.branch_id},it.lines,it.extra);else{console.warn('auto claim',error.message);continue}}else id=data;
  if(id)made.push({type:it.type,id})}
 for(const m of made)await notifyIssuers(P.f.branch_id,'📄 أُنشئت مسودة '+TL[m.type]+' تلقائياً من نتيجة العينة: '+P.f.name,'cd:'+m.id);
 if(P.warn.length)await notifyIssuers(P.f.branch_id,'⚠ '+P.f.name+': '+P.warn.join('، '),'rv:'+sid);
 return made.length}catch(e){console.warn('autoClaims',e);return 0}}
const _ev28=evalStatus;evalStatus=async function(sid,status,reason){await _ev28(sid,status,reason);if(status!=='pending')autoClaims(sid)};
/* --- 2) تنبيه المُصدِر بالعينات التي لم تُدخَل نتائجها --- */
const home28=R.home;R.home=async function(a){const h=await home28.call(this,a);
 try{const off=await myOff();if(!(['gm','ctl','rq'].includes(me.role)||off.length))return h;
  const{data}=await sb.from('samples').select('id,code,collected_on,facilities(name,branch_id)').eq('status','pending').lte('collected_on',addDays(today(),-3)).order('collected_on').limit(80),
   mine=(data||[]).filter(s=>['gm','ctl','rq'].includes(me.role)||(s.facilities&&off.includes(s.facilities.branch_id)));if(!mine.length)return h;
  const{data:ex}=await sb.from('notifications').select('link').like('text','⏰%').in('link',mine.map(s=>'res:'+s.id)),have=new Set((ex||[]).map(x=>x.link)),age=s=>Math.floor((Date.now()-new Date(s.collected_on))/864e5);
  for(const s of mine.filter(s=>!have.has('res:'+s.id)).slice(0,20))await notifyIssuers(s.facilities.branch_id,'⏰ عينة بلا نتيجة منذ '+age(s)+' يوماً: '+s.code+' — '+s.facilities.name,'res:'+s.id);
  return`<div class="c" style="border-color:var(--wn)"><h3>⏰ عينات لم تُدخَل نتائجها (${mine.length})</h3><p class="m">لا يمكن إصدار أعباء التنقية قبل ظهور النتيجة.</p>${mine.slice(0,8).map(s=>`<div class="row" onclick="go('res','${s.id}')"><b>${esc(s.code)}</b> <span class="tag w">${age(s)} يوم</span><br><span class="m">${esc(s.facilities&&s.facilities.name)} — جُمعت ${s.collected_on}</span></div>`).join('')}${mine.length>8?`<div class="m">+${mine.length-8} عينات أخرى (سجل العينات ← في الانتظار)</div>`:''}</div>`+h}catch(e){}return h};
/* --- 3) ترحيل المستحقات السابقة بالترتيب في كل مطالبة --- */
async function carriedList(c){try{const{data:C}=await sb.from('claims').select('id,type,serial,total,created_at').eq('facility_id',c.facility_id).in('status',['approved','print_ready']).neq('type','compliance_notice').is('deleted_at',null).is('cancelled_on',null).lt('created_at',c.created_at).neq('id',c.id);if(!C||!C.length)return[];
 const{data:P}=await sb.from('payments').select('claim_id,amount').in('claim_id',C.map(x=>x.id)),pm={};(P||[]).forEach(x=>pm[x.claim_id]=(pm[x.claim_id]||0)+ +x.amount);
 return C.map(x=>({type:x.type,serial:x.serial,at:x.created_at,rem:r2(x.total-(pm[x.id]||0))})).filter(x=>x.rem>0).sort((a,b)=>(TORD.indexOf(a.type)-TORD.indexOf(b.type))||(a.at<b.at?-1:1))}catch(e){return[]}}
/* --- 4) إرجاع المطالبة لمُصدِرها / حذفها / حماية المسدَّد --- */
const paidOf=async id=>((await sb.from('payments').select('amount').eq('claim_id',id)).data||[]).reduce((a,x)=>a+ +x.amount,0);
async function clRet(id){try{if(await paidOf(id))return alert('عليها تحصيل: لا يمكن إرجاعها');const w=prompt('اكتب سبب الإرجاع وما المطلوب تعديله');if(!w||!w.trim())return;const{data:c}=await sb.from('claims').select('created_by,type,serial,facility_id').eq('id',id).single();
 const{error}=await sb.from('claims').update({status:'draft',return_note:w.trim(),returned_by:me.id,returned_at:new Date().toISOString(),reviewer_user_id:null,reviewed_at:null,approved_by:null,approved_at:null}).eq('id',id);if(error)throw error;
 try{if(c.created_by&&c.created_by!==me.id)await notify(null,'↩ أُعيدت إليك مطالبة للتعديل ('+TL[c.type]+' #'+c.serial+'): '+w.trim(),'cd:'+id,c.created_by);await notify('ctl','↩ أُعيدت مطالبة للتعديل: '+w.trim(),'cd:'+id)}catch(e){}go('cd',id)}catch(e){err(e)}}
async function clDel(id){try{if(await paidOf(id))return alert('عليها تحصيل: لا يمكن حذفها');if(!confirm('حذف هذه المطالبة؟ يمكن للمدير العام استعادتها لاحقاً.'))return;const{data:c}=await sb.from('claims').select('created_by,type,serial').eq('id',id).single();
 const{error}=await sb.from('claims').update({deleted_at:new Date().toISOString()}).eq('id',id);if(error)throw error;
 try{if(c.created_by&&c.created_by!==me.id)await notify(null,'🗑 حُذفت مطالبتك ('+TL[c.type]+' #'+c.serial+')',null,c.created_by)}catch(e){}go('cl')}catch(e){err(e)}}
const _el28=editLine;editLine=async function(cid,lid,v){if(await paidOf(cid)){alert('عليها تحصيل: لا يمكن تعديلها');return go('cd',cid)}return _el28(cid,lid,v)};
const cd28=R.cd;R.cd=async function(id){try{await myOff()}catch(e){}const h=await cd28.call(this,id),{data:c}=await sb.from('claims').select('id,type,status,created_by,branch_id,return_note,deleted_at').eq('id',id).single();if(!c)return h;
 const paid=await paidOf(id)>0,gm=me.role==='gm',issuer=c.created_by===me.id||isIssuerOf(c.branch_id,c.type);let bar='';
 if(c.return_note&&c.status==='draft')bar+=`<div class="c" style="border-color:var(--wn)"><b>↩ أُعيدت للتعديل</b><br><span class="m">${esc(c.return_note)}</span></div>`;
 if(paid)bar+='<div class="c m">🔒 عليها تحصيل: لا يمكن تعديلها أو حذفها أو إرجاعها.</div>';
 else{if(c.status==='review'&&issuer)bar+=`<button class="btn s" onclick="clRet('${id}')">↩ إرجاعها لمُصدِرها للتعديل</button>`;if(gm&&['approved','print_ready'].includes(c.status))bar+=`<button class="btn s" onclick="clRet('${id}')">↩ إرجاع للتعديل (المدير العام)</button>`;
  if((['draft','review'].includes(c.status)&&issuer)||gm)bar+=`<button class="btn s" style="color:var(--er)" onclick="clDel('${id}')">🗑 حذف المطالبة</button>`}
 return h+bar};
(window.PARTS=window.PARTS||[]).push('p28');
