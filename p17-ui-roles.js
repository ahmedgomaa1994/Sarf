/* ===== p17: الشكل الاحترافي + التبويبات + دور المحاسب + مسؤول مطالبات لعدة فروع ===== */
ROLES.acct='المحاسب';if(typeof ROLEN!=='undefined')ROLEN.acct='المحاسب';
/* --- 1) أنماط الشكل --- */
(function(){const css=`
:root{--sh:0 1px 3px rgba(20,35,58,.08),0 6px 18px rgba(20,35,58,.06);--rad:14px;--p2:#2b5a96}
@media(prefers-color-scheme:dark){:root{--sh:0 1px 3px rgba(0,0,0,.4),0 6px 18px rgba(0,0,0,.25)}}
body{background:var(--bg);font-size:15.5px;line-height:1.55;padding-bottom:104px!important}
header{background:linear-gradient(135deg,var(--p),var(--p2));box-shadow:0 2px 10px rgba(0,0,0,.18);padding:12px 14px!important}
header b{font-size:15px;font-weight:700}header button{border-radius:10px!important}
#ofb{margin-inline-start:6px}
main{padding:14px 12px!important}
.c{border-radius:var(--rad)!important;box-shadow:var(--sh);border:1px solid var(--bd);padding:14px!important}
.c h3{display:flex;align-items:center;gap:8px;font-size:16px!important;margin:0 0 10px!important;padding-bottom:8px;border-bottom:1px solid var(--bd)}
h4{margin:14px 0 6px;color:var(--p)}
.row{padding:12px 4px!important;transition:background .15s;border-radius:8px}
.row:active{background:rgba(43,90,150,.08)}
.btn{border-radius:12px!important;min-height:48px!important;font-size:15px;box-shadow:0 2px 6px rgba(27,58,99,.25);transition:transform .08s}
.btn:active{transform:scale(.98)}.btn.s{box-shadow:none!important;background:var(--card)!important}
input,select,textarea{border-radius:10px!important;transition:border .15s,box-shadow .15s}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--p2)!important;box-shadow:0 0 0 3px rgba(43,90,150,.18)}
label{font-weight:600}
.tag{border-radius:999px!important;padding:2px 10px!important;font-size:12px!important;font-weight:700}
table{border-radius:10px;overflow:hidden}th{background:rgba(43,90,150,.1);font-weight:700}tr:nth-child(even) td{background:rgba(43,90,150,.04)}
.n div,.g>.c{border-radius:var(--rad)!important;box-shadow:var(--sh)}
details>summary{cursor:pointer;font-weight:700;padding:8px 0}
nav.nav17{display:grid!important;grid-auto-flow:column;grid-auto-columns:1fr;align-items:end;overflow:visible!important;flex-wrap:nowrap!important;background:var(--card);border-top:1px solid var(--bd);box-shadow:0 -4px 18px rgba(20,35,58,.1);padding:6px 4px calc(6px + env(safe-area-inset-bottom))!important}
nav.nav17 button{display:flex!important;flex-direction:column;align-items:center;gap:2px;min-height:54px!important;padding:4px 2px!important;border-radius:12px;font-size:11.5px!important;color:var(--mut);position:relative;border-top:0!important}
nav.nav17 button i{font-style:normal;font-size:21px;line-height:1}
nav.nav17 button.on{color:var(--p)!important;font-weight:800;background:rgba(43,90,150,.1)}
nav.nav17 button.fab{margin-top:-24px;color:var(--pf)!important}
nav.nav17 button.fab i{width:52px;height:52px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:linear-gradient(135deg,var(--p),var(--p2));color:#fff;font-size:26px;box-shadow:0 6px 16px rgba(27,58,99,.4)}
nav.nav17 button.fab span{color:var(--mut)}
nav.nav17 .dot{position:absolute;top:2px;inset-inline-start:calc(50% + 8px);background:var(--er);color:#fff;border-radius:999px;font-size:10px;padding:0 5px;min-width:16px}
#sheet17{position:fixed;inset:0;z-index:60;display:none}#sheet17.open{display:block}
#sheet17 .bk{position:absolute;inset:0;background:rgba(10,20,35,.5)}
#sheet17 .pn{position:absolute;bottom:0;inset-inline:0;background:var(--card);border-radius:22px 22px 0 0;padding:14px 14px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -10px 30px rgba(0,0,0,.3);max-height:82vh;overflow:auto}
#sheet17 .gr{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:10px 0}
#sheet17 .it{background:var(--bg);border:1px solid var(--bd);border-radius:14px;padding:14px 6px;text-align:center;font-size:13px;font-weight:600;cursor:pointer}
#sheet17 .it i{display:block;font-style:normal;font-size:26px;margin-bottom:4px}
#sheet17 .who{display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid var(--bd)}
#sheet17 .av{width:42px;height:42px;border-radius:50%;background:var(--p);color:var(--pf);display:flex;align-items:center;justify-content:center;font-weight:800}
`;const s=document.createElement('style');s.id='ui17';s.textContent=css;document.head.appendChild(s)})();
/* --- 2) تعريف التبويبات حسب الدور --- */
const N17={home:['الرئيسية','🏠',()=>'home',()=>true],fac:['المنشآت','🏭',()=>'fac',()=>perm('facilities','view')],new:['معاينة','➕',()=>'new',()=>['gm','rq','insp'].includes(me.role)&&perm('inspections','add')],samp:['العينات','🧪',()=>'samp',()=>perm('samples','view')],
 cl:['المطالبات','📄',()=>'cl',()=>['gm','rq','ctl','col','acct'].includes(me.role)||(typeof OFF!=='undefined'&&(OFF||[]).length>0)],col:['التحصيل','💰',()=>'col',()=>['gm','rq','ctl','col','acct'].includes(me.role)],
 plan:['الخطة','📅',()=>'plan',()=>perm('plan','view')],lic:['التراخيص','🪪',()=>'lic',()=>['gm','rq','lic'].includes(me.role)],rpt:['التقارير','📊',()=>['gm','rq','ctl'].includes(me.role)?'rpt':'rep',()=>['gm','rq','ctl','col','acct'].includes(me.role)],
 set:['الإعدادات','⚙️',()=>'set',()=>me.role==='gm'],branch:['الفرع','🏢',()=>'branch',()=>['gm','rq','ctl','col','acct'].includes(me.role)||(me.role==='insp'&&me.branch_id)||(typeof OFF!=='undefined'&&(OFF||[]).length>0)],stmt:['كشف حساب','🧾',()=>'stmt',()=>['gm','rq','ctl','col','acct'].includes(me.role)],ntf:['الإشعارات','🔔',()=>'ntf',()=>true],sync:['المزامنة','🔄',()=>'sync',()=>true]};
const PRIM17={gm:['home','fac','new','samp'],rq:['home','fac','new','samp'],insp:['home','plan','new','samp'],ctl:['home','cl','fac','samp'],col:['home','col','stmt','branch'],acct:['home','col','stmt','branch'],lic:['home','lic','fac']};
const GROUP17={branch:['branch','fp'],stmt:['stmt'],home:['home'],fac:['fac','fd','ied','ihist','att'],new:['new','drafts','canc'],samp:['samp','res','rv'],cl:['cl','cd','mf','gw','gwf'],col:['col','pd','fr','fa','fdc','rep'],plan:['plan','crew'],lic:['lic','ld','ln'],rpt:['rpt'],set:['set','bm','pmx'],ntf:['ntf'],sync:['sync']};
const grp17=k=>Object.keys(GROUP17).find(g=>GROUP17[g].includes(k))||'';
function closeSheet(){const s=document.getElementById('sheet17');if(s)s.classList.remove('open')}
function openSheet(){let s=document.getElementById('sheet17');if(!s){s=document.createElement('div');s.id='sheet17';document.body.appendChild(s)}
 const prim=PRIM17[me.role]||['home','fac','samp'],vis=k=>N17[k]&&N17[k][3](),rest=Object.keys(N17).filter(k=>!prim.includes(k)&&vis(k)&&k!=='ntf'&&k!=='sync'),av=(me.full_name||'?').trim().slice(0,1);
 s.innerHTML=`<div class="bk" onclick="closeSheet()"></div><div class="pn"><div class="who"><div class="av">${esc(av)}</div><div style="flex:1"><b>${esc(me.full_name)}</b><br><span class="m">${ROLES[me.role]||''}${me.job_title?' — '+esc(me.job_title):''}</span></div><button class="btn s" style="width:auto;margin:0;padding:0 14px" onclick="closeSheet();out()">خروج</button></div>
 <div class="gr">${rest.map(k=>`<div class="it" onclick="closeSheet();go('${N17[k][2]()}')"><i>${N17[k][1]}</i>${N17[k][0]}</div>`).join('')}<div class="it" onclick="closeSheet();go('ntf')"><i>🔔</i>الإشعارات</div><div class="it" onclick="closeSheet();go('sync')"><i>🔄</i>المزامنة</div></div></div>`;s.classList.add('open')}
const _shell17=shell;shell=function(body){_shell17(body);try{const nv=document.querySelector('nav');if(!nv||!me)return;
 let prim=(PRIM17[me.role]||['home','fac','samp']).filter(k=>N17[k][3]());if(typeof OFF!=='undefined'&&(OFF||[]).length&&!prim.includes('branch'))prim=['home','branch'].concat(prim.filter(k=>k!=='home').slice(0,2));const on=grp17(V);let h='';
 prim.forEach(k=>{const[t,ic,tg]=N17[k];h+=`<button class="${k==='new'?'fab ':''}${on===k?'on':''}" onclick="go('${tg()}')"><i>${ic}</i><span>${t}</span></button>`});
 const moreOn=on&&!prim.includes(on);h+=`<button class="${moreOn?'on':''}" onclick="openSheet()"><i>☰</i><span>المزيد</span></button>`;
 nv.className='nav17';nv.innerHTML=h;ofbUpdate&&ofbUpdate()}catch(e){}};
/* --- 3) لوحة المحاسب --- */
const _dash17=dashFor;dashFor=async function(role){if(role!=='acct')return _dash17(role);const base=await _dash17('col');return base.concat([['مطالبات تحت المراجعة',await cnt(T('claims').eq('status','review').is('deleted_at',null)),'cl'],['مطالبات مسودة',await cnt(T('claims').eq('status','draft').is('deleted_at',null)),'cl']])};
/* --- 4) مسؤول مطالبات يمسك عدة فروع (بحسب المستخدم) --- */
let BCU='';
async function saveBcu(){try{if(me.role!=='gm')return;if(!BCU)return alert('اختر مستخدماً');const{data:A}=await sb.from('branch_claim_assignments').select('*').eq('is_primary',true),have=new Set((A||[]).filter(a=>a.user_id===BCU).map(a=>a.branch_id));let n=0;
 for(const b of BR){const on=document.getElementById('bcb'+b.id).checked;if(on&&!have.has(b.id)){await sb.from('branch_claim_assignments').delete().eq('branch_id',b.id).eq('is_primary',true);const{error}=await sb.from('branch_claim_assignments').insert({branch_id:b.id,user_id:BCU,is_primary:true});if(error)throw error;n++}
  else if(!on&&have.has(b.id)){const{error}=await sb.from('branch_claim_assignments').delete().eq('branch_id',b.id).eq('user_id',BCU).eq('is_primary',true);if(error)throw error;n++}}
 try{OFF=null}catch(e){}alert(n?'تم الحفظ ('+n+' تغيير)':'لا يوجد تغيير');go('set','bcu')}catch(e){err(e)}}
SETS.push(['bcu','مسؤول المطالبات: بحسب المستخدم (عدة فروع)']);
const set17=R.set;R.set=async function(sec){if(sec!=='bcu')return set17.call(this,sec);if(me.role!=='gm')return'<div class="c">للمدير العام فقط</div>';
 const[U,A]=await Promise.all([sb.from('profiles').select('id,full_name,role').eq('active',true).order('full_name'),sb.from('branch_claim_assignments').select('*').eq('is_primary',true)]),nm=Object.fromEntries((U.data||[]).map(u=>[u.id,u.full_name])),mine=new Set((A.data||[]).filter(a=>a.user_id===BCU).map(a=>a.branch_id));
 return`<button class="btn s" onclick="go('set')">رجوع</button><div class="c"><h3>مسؤول مطالبات يمسك عدة فروع</h3><p class="m">اختر المستخدم ثم علّم كل الفروع التي يمسكها. اختيار فرع يمسكه مسؤول آخر ينقله لهذا المستخدم.</p>
 <select onchange="BCU=this.value;go('set','bcu')"><option value="">اختر مستخدماً</option>${(U.data||[]).map(u=>`<option value="${u.id}" ${u.id===BCU?'selected':''}>${esc(u.full_name)} — ${ROLES[u.role]||u.role}</option>`).join('')}</select>
 ${BCU?`<div class="g" style="margin-top:12px">${BR.map(b=>{const cur=(A.data||[]).find(a=>a.branch_id===b.id),other=cur&&cur.user_id!==BCU;return`<label style="display:flex;gap:8px;align-items:center;color:var(--fg);background:var(--bg);padding:10px;border-radius:10px;margin:0"><input type="checkbox" id="bcb${b.id}" style="width:22px;min-height:22px" ${mine.has(b.id)?'checked':''}><span>${esc(b.name)}${other?`<br><span class="m">حالياً: ${esc(nm[cur.user_id]||'-')}</span>`:''}</span></label>`}).join('')}</div><button class="btn" onclick="saveBcu()">حفظ</button>`:''}</div>`};
(window.PARTS=window.PARTS||[]).push('p17');
