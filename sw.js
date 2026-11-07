/* ملف الخدمة: يحفظ ملفات التطبيق ليفتح دون إنترنت. لا يحفظ أي طلب لقاعدة البيانات. */
const CACHE='ind-app-v1';
const FILES=['./','index.html','p1-core.js','p2-facilities.js','p3-claims.js','p4-collection.js','p5-plan-licenses.js','p6-settings.js','p7-registry-crews.js','p8-inspection-form.js','p9-facility-detail.js','p10-samples-results.js','p11-groundwater.js','p12-dashboards.js','p13-reports.js','p14-permissions.js','p15-attachments.js','p16-offline.js','manifest.webmanifest','icon-192.png','icon-512.png'];
const LIBS=['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js','https://unpkg.com/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js','https://cdnjs.cloudflare.com/ajax/libs/supabase-js/2.45.4/supabase.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled([...FILES.map(u=>c.add(u)),...LIBS.map(u=>c.add(new Request(u,{mode:'no-cors'})))])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(u.hostname.endsWith('supabase.co'))return;                       // بيانات: دائماً من الشبكة
 if(LIBS.includes(r.url)){e.respondWith(caches.match(r.url).then(m=>m||fetch(r).then(x=>{const c=x.clone();caches.open(CACHE).then(ch=>ch.put(r.url,c));return x})));return}
 if(u.origin!==location.origin)return;
 if(r.method==='HEAD'){e.respondWith(fetch(r).catch(()=>caches.match(r.url).then(m=>m||new Response(null,{status:504}))));return}
 if(r.method!=='GET')return;
 e.respondWith(fetch(r).then(x=>{if(x.ok){const c=x.clone();caches.open(CACHE).then(ch=>ch.put(r,c))}return x}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))))});
