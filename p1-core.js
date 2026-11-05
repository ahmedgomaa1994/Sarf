
const SB_URL='https://slnptitbvpxdbhnzftfl.supabase.co';
const SB_KEY='sb_publishable_6UVxLGRkeDvQanZvsYhrSQ_NQAPKDe1';
let sb;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ROLES={gm:'المدير العام',rq:'مدير الرقابة',ctl:'مدير التحكم',col:'مدير التحصيل',lic:'مدير التراخيص',insp:'فريق المعاينات'};
const ST={pending:['في الانتظار','w'],pass:['مطابقة','o'],fail:['غير مطابقة','e']};
let me=null,BR=[],LIM={},V='fac',FEE={},TIERS=[],MF={k:null,fid:null},PRE=null,LINK=null;
const today=()=>new Date().toISOString().slice(0,10);
const rnd=()=>Array.from({length:4},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
const err=e=>alert('خطأ: '+(e.message||e));

async function boot(){
  const{data:{session}}=await sb.auth.getSession();
  if(!session)return loginUI();
  const{data:p,error}=await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
  if(error)return $('#app').innerHTML=`<main><div class="c bad">تعذر الاتصال: ${esc(error.message)}<br>تأكد من تشغيل ملف SQL.</div></main>`;
  if(!p)return $('#app').innerHTML=`<main><div class="c"><h3>الحساب غير مفعّل بعد</h3><p>اطلب من المدير العام تفعيله. رقم الحساب:</p><pre>${session.user.id}</pre><button class="btn s" onclick="out()">خروج</button></div></main>`;
  me=p;
  BR=(await sb.from('branches').select('*').order('id')).data||[];
  LIM=Object.fromEntries(((await sb.from('lab_limits').select('*')).data||[]).map(x=>[x.param,x]));
  FEE={};((await sb.from('fee_settings').select('*').lte('effective_from',today()).order('effective_from',{ascending:false}).order('created_at',{ascending:false})).data||[]).forEach(x=>{if(!(x.key in FEE))FEE[x.key]=x.value});
  TIERS=(await sb.from('charge_tiers').select('*')).data||[];
  go('fac');
}
function loginUI(){$('#app').innerHTML=`<main><div class="c"><h2>الرقابة على الصرف الصناعي</h2><label>البريد الإلكتروني</label><input id="em" type="email" dir="ltr"><label>كلمة المرور</label><input id="pw" type="password" dir="ltr"><button class="btn" onclick="login()">دخول</button></div></main>`}
async function login(){const{error}=await sb.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value});if(error)return err(error);boot()}
async function out(){await sb.auth.signOut();me=null;loginUI()}

function shell(body){
  $('#app').innerHTML=`<header><b>${esc(me.full_name)} · ${ROLES[me.role]}</b><button onclick="out()">خروج</button></header><main>${body}</main>
  <nav>${[['fac','المنشآت'],['new','معاينة'],['samp','العينات'],['cl','المطالبات'],['col','التحصيل'],['plan','الخطة'],['lic','التراخيص'],['set','الإعدادات']].filter(x=>(x[0]!=='set'||me.role==='gm')&&(x[0]!=='col'||['gm','rq','ctl','col'].includes(me.role))&&(x[0]!=='lic'||['gm','rq','lic'].includes(me.role))).map(([k,t])=>`<button class="${k==V?'on':''}" onclick="go('${k}')">${t}</button>`).join('')}</nav>`}
async function go(v,arg){V=v;shell('<p class="m">جارٍ التحميل…</p>');
  try{shell(await R[v](arg));if(v==='new'&&PRE){Object.entries(PRE).forEach(([k,x])=>{const e=$('#'+k);if(e)e.value=x});PRE=null}}catch(e){shell(`<div class="c bad">${esc(e.message||e)}</div>`)}}


(window.PARTS=window.PARTS||[]).push('p1');
