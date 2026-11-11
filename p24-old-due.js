/* ===== p24: مستحق قديم على المنشأة (ليس له مطالبات سابقة في النظام) ===== */
TL.old_due='مستحق قديم';MK.od='old_due';if(typeof TORD!=='undefined'&&!TORD.includes('old_due'))TORD.unshift('old_due');if(typeof ORD!=='undefined')ORD.old_due=-1;
async function odCreate(){try{const fid=document.getElementById('odf').value,amt=+document.getElementById('oda').value,ds=document.getElementById('odd').value.trim(),od=document.getElementById('odo').value||null;
 if(!fid)return alert('اختر المنشأة');if(!(amt>0))return alert('أدخل مبلغاً صحيحاً');if(!ds)return alert('اكتب بيان المستحق (مثل: رسوم معاينة وتحليل عن عام 2022)');
 const{data:f,error}=await sb.from('facilities').select('id,branch_id').eq('id',fid).single();if(error)throw error;
 const id=await mkClaim('old_due',f,[{description:ds+(od?' — بتاريخ '+od:''),amount:amt}],{settings_snapshot:{fees:FEE,vat_applied:false,legacy:true,origin_date:od}});go('cd',id)}catch(e){err(e)}}
const mf24=R.mf;R.mf=async function(k){if(k!=='od')return mf24.call(this,k);
 if(!ro('gm','ctl'))return`<button class="btn s" onclick="go('cl')">رجوع</button><div class="c">هذا النموذج لمدير التحكم والمدير العام</div>`;
 const{data:F}=await sb.from('facilities').select('id,name,code,branch_id').is('deleted_at',null).order('name');
 return`<button class="btn s" onclick="go('cl')">رجوع</button><div class="c"><h3>نموذج مستحق قديم</h3><p class="m">يُضاف على منشأة لها مبلغ مستحق سابق ليس له مطالبات في النظام. يدخل في المديونية وكشف الحساب والتحصيل مثل أي مطالبة، <b>بدون ضريبة</b>، ويمر بدورة المراجعة والاعتماد.</p>
 <label>المنشأة</label><select id="odf"><option value="">اختر منشأة</option>${(F||[]).map(x=>`<option value="${x.id}">${esc(x.name)} (${esc(x.code)}) — ${esc(brn(x.branch_id))}</option>`).join('')}</select>
 <label>المبلغ المستحق (جنيه)</label><input id="oda" type="number" step="any" min="0"><label>بيان المستحق</label><input id="odd" placeholder="مثال: رسوم معاينة وتحليل عن عام 2022"><label>تاريخ نشأة المستحق (اختياري)</label><input id="odo" type="date"><button class="btn" onclick="odCreate()">إنشاء مسودة</button></div>`};
(window.PARTS=window.PARTS||[]).push('p24');
