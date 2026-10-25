
// ------------------------------------------------------------------
// Moteur : fiches, question longue, quiz, examen blanc (format de l'Intra 2), cartes éclair.
// Progression 100 % localStorage (clé portulan-hxv2), aucun compte.
// ------------------------------------------------------------------
(function(){
const KEY='portulan-hxv2', DKEY='portulan-hxv2-draft';
const $=(s,r)=> (r||document).querySelector(s);
const $$=(s,r)=> Array.prototype.slice.call((r||document).querySelectorAll(s));
const FICHES=$$('.fiche').map(f=>f.id);
const TITLE={}; $$('.fiche').forEach(f=>TITLE[f.id]=f.getAttribute('data-title'));
const MASTERABLE=FICHES.filter(id=>id!=='s1');
const BYID={}; BANK.concat(LONGS).forEach(q=>BYID[q.id]=q);
const LBY={}; LONGS.forEach(l=>LBY[l.id]=l);
const IN_FRAME=(function(){ try{ return window.self!==window.top; }catch(e){ return true; } })();

let state=load();
function load(){
  try{ const s=JSON.parse(localStorage.getItem(KEY)||'{}');
    return {mastered:s.mastered||{}, stats:s.stats||{}, cfg:s.cfg||null, exams:s.exams||[], longs:s.longs||{}}; }
  catch(e){ return {mastered:{},stats:{},cfg:null,exams:[],longs:{}}; }
}
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(state)); }catch(e){} }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function stat(id){ return state.stats[id]||{seen:0,ok:0,ko:0,last:null}; }
function record(id,score){ const st=stat(id); st.seen++; if(score>=1) st.ok++; else st.ko++; st.last=score; state.stats[id]=st; save(); updateBadge(); }
function groupOf(s){ return GROUPS.find(g=>g.s.indexOf(s)>=0)||{id:'g0',name:'Synthèse'}; }
function toReview(){ return BANK.filter(q=>{ const st=stat(q.id); return st.seen>0 && st.last<1; }); }
function updateBadge(){ const n=toReview().length; const b=$('#n-quiz'); b.innerHTML=n?n+'<span class="lg"> à revoir</span>':''; b.style.display=n?'':'none'; }
function pct(a,b){ return b?Math.round(100*a/b):0; }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmt(x){ return (Math.round(x*100)/100).toString().replace('.',','); }
function words(t){ return (String(t||'').match(/[0-9A-Za-zÀ-ÖØ-öø-ÿŒœ]+(?:['’][0-9A-Za-zÀ-ÖØ-öø-ÿŒœ]+)*/g)||[]).length; }
function wcText(n,lo,hi){ if(!n) return 'Cible : '+lo+' à '+hi+' mots'; return n+' mot'+(n>1?'s':'')+(n<lo?' · vise '+lo+' à '+hi:(n>hi?' · un peu long (cible '+lo+' à '+hi+')':' · dans la cible')); }
function wcCls(n,lo,hi){ return 'wc'+(n>=lo&&n<=hi?' ok':(n>hi?' hi':'')); }
function bindWc(ta,el,lo,hi,cb){ const up=()=>{ const n=words(ta.value); el.textContent=wcText(n,lo,hi); el.className=wcCls(n,lo,hi); }; up(); ta.addEventListener('input',()=>{ up(); if(cb) cb(ta.value); }); }
const WC={moy:[100,200], long:[450,650], phrase:[5,40]};

// confirmation dans la page (confirm() ne s'affiche pas dans un Artifact)
function ask(msg,yes,no,okLabel){
  const d=document.createElement('div'); d.className='ask';
  d.innerHTML='<div class="ask-box" role="dialog" aria-modal="true"><p>'+esc(msg)+'</p><div class="row"><button type="button" class="btn primary" data-a="1">'+esc(okLabel||'Oui')+'</button><button type="button" class="btn ghost" data-a="0">Annuler</button></div></div>';
  document.body.appendChild(d);
  const close=v=>{ document.removeEventListener('keydown',key); d.remove(); if(v){ if(yes) yes(); } else if(no) no(); };
  const key=e=>{ if(e.key==='Escape') close(false); };
  document.addEventListener('keydown',key);
  d.addEventListener('click',e=>{ const b=e.target.closest('button[data-a]'); if(b) close(b.getAttribute('data-a')==='1'); else if(e.target===d) close(false); });
  d.querySelector('button[data-a="1"]').focus();
}

// ---- barème à cocher (questions moyennes et longues) : chaque critère vaut 0, la moitié ou tous ses points
function rubMax(crit){ return crit.reduce((a,c)=>a+c[1],0); }
function rubScore(crit,ch){ return crit.reduce((a,c,i)=>a+(typeof ch[i]==='number'?ch[i]*c[1]:0),0); }
function rubDone(crit,ch){ return crit.every((c,i)=>typeof ch[i]==='number'); }
function rubHtml(crit,ch,attr,title){
  return '<div class="rub" '+(attr||'')+'><h4>'+esc(title||'Barème : note chaque critère honnêtement')+'</h4><ul>'+crit.map((c,i)=>'<li><span class="lab">'+esc(c[0])+'<small>'+fmt(c[1])+' pt'+(c[1]>1?'s':'')+'</small></span><span class="seg" data-ci="'+i+'">'+[[0,'Non'],[0.5,'À moitié'],[1,'Oui']].map(x=>'<button type="button" data-f="'+x[0]+'"'+(ch[i]===x[0]?' class="on"':'')+'>'+x[1]+'</button>').join('')+'</span></li>').join('')+
    '</ul><div class="tot"><span data-rl>'+(rubDone(crit,ch)?'Ta note':'Note chaque critère pour obtenir ta note')+'</span><b data-rt>'+fmt(rubScore(crit,ch))+' / '+fmt(rubMax(crit))+'</b></div></div>';
}
function bindRub(box,crit,ch,onChange){
  $$('.seg',box).forEach(seg=>seg.addEventListener('click',e=>{ const b=e.target.closest('button[data-f]'); if(!b) return; const i=parseInt(seg.getAttribute('data-ci'),10);
    ch[i]=parseFloat(b.getAttribute('data-f')); $$('button',seg).forEach(x=>x.classList.toggle('on',x===b));
    $('[data-rt]',box).textContent=fmt(rubScore(crit,ch))+' / '+fmt(rubMax(crit)); $('[data-rl]',box).textContent=rubDone(crit,ch)?'Ta note':'Note chaque critère pour obtenir ta note';
    if(onChange) onChange(); }));
}

function kwHtml(q){ return q.k?'<div class="kw">'+q.k.map(k=>'<span>'+esc(k)+'</span>').join('')+'</div>':''; }
function modelHtml(q){
  if(q.t==='moy') return '<div class="model"><span class="blabel">Réponse modèle ('+words(q.m.replace(/<[^>]+>/g,' '))+' mots)</span>'+q.m+kwHtml(q)+'</div>';
  if(q.t==='long') return '<div class="model lmodel"><span class="blabel">Réponse modèle ('+words(q.m.replace(/<[^>]+>/g,' '))+' mots)</span>'+q.m+'</div>'+(q.liens?'<div class="lien"><span class="blabel">Les liens à écrire en toutes lettres</span><ul>'+q.liens.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>':'');
  return '<div class="model"><span class="blabel">Réponse modèle</span><p>'+esc(q.m)+'</p>'+kwHtml(q)+'</div>';
}
// la réponse attendue, bien écrite : la première phrase de la réponse modèle (sinon le premier terme accepté)
function ansHead(q){ const m=String(q.m||''); const i=m.indexOf('. '); const h=(i>0&&i<100)?m.slice(0,i):''; if(h) return h; const a=(q.acc&&q.acc[0])||''; return a.charAt(0).toUpperCase()+a.slice(1); }
function fbLink(q){ return '<p style="margin-top:6px"><a href="#'+q.s+'" class="ui" style="font-size:13px">Relire la fiche : '+esc(TITLE[q.s])+'</a></p>'; }

// ---- correction automatique des réponses courtes
const STOP={le:1,la:1,les:1,l:1,un:1,une:1,des:1,du:1,de:1,d:1,en:1,au:1,aux:1};
function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/œ/g,'oe').replace(/[’'`]/g,' ').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w&&!STOP[w]).join(' '); }
function lev(a,b){ const m=a.length,n=b.length; if(!m) return n; if(!n) return m; let p=[]; for(let j=0;j<=n;j++) p[j]=j; for(let i=1;i<=m;i++){ let c=[i]; for(let j=1;j<=n;j++){ c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1)); } p=c; } return p[n]; }
function matchShort(input,acc){
  const x=norm(input); if(!x||!acc||!acc.length) return false;
  return acc.some(a=>{ const y=norm(a); if(!y) return false; if(x===y) return true;
    const xw=x.split(' '), yw=y.split(' ');
    if(xw.length<=yw.length+3 && (' '+x+' ').indexOf(' '+y+' ')>=0) return true;
    if(/\d/.test(y)) return false;
    const d=lev(x,y); return (y.length>=5 && y.length<=8 && d<=1) || (y.length>8 && d<=2); });
}

// ---------------- navigation
const VIEWS=['express','fiches','longue','quiz','exam','cards'];
function showView(v){
  VIEWS.forEach(x=>$('#view-'+x).classList.toggle('on',x===v));
  $$('.tab').forEach(t=>t.setAttribute('aria-selected', t.getAttribute('data-view')===v ? 'true':'false'));
  if(v==='longue' && !curLong) renderLongHome();
  if(v==='quiz' && !quiz) renderQuizSetup();
  if(v==='exam' && !exam) renderExamIntro();
  if(v==='cards' && !deck) renderCardsSetup();
}
$$('.tab').forEach(t=>t.addEventListener('click',()=>{ const h='#'+t.getAttribute('data-view'); if(location.hash===h) route(); else location.hash=h; }));
function route(){
  const h=(location.hash||'#express').slice(1);
  if(h==='longue') curLong=null;
  if(VIEWS.indexOf(h)>=0){ showView(h); if(h==='fiches'||h==='express'||h==='longue') window.scrollTo(0,0); return; }
  if(/^L\d+$/.test(h) && LBY[h]){ showView('longue'); openLong(h); window.scrollTo(0,0); return; }
  if(/^x[a-d]$/.test(h) && $('#'+h)){ showView('express'); setTimeout(()=>{ $('#'+h).scrollIntoView({block:'start'}); },0); return; }
  if(/^s\d+$/.test(h) && $('#'+h)){ showView('fiches'); $('#toc').classList.remove('open'); setTimeout(()=>{ $('#'+h).scrollIntoView({block:'start'}); },0); return; }
  showView('express');
}
window.addEventListener('hashchange',route);
$$('.fiche').forEach(f=>f.style.scrollMarginTop='76px');

// ---------------- fiches : sommaire, maîtrise, actions
const tocLinks=$$('#toc a');
$('#toc-btn').addEventListener('click',()=>$('#toc').classList.toggle('open'));
tocLinks.forEach(a=>a.addEventListener('click',()=>$('#toc').classList.remove('open')));
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(entries=>{
    entries.forEach(en=>{ if(en.isIntersecting){ tocLinks.forEach(a=>a.classList.toggle('cur', a.getAttribute('href')==='#'+en.target.id)); } });
  },{rootMargin:'-70px 0px -75% 0px',threshold:0});
  $$('.fiche').forEach(f=>io.observe(f));
}
function refreshMastery(){
  const done=MASTERABLE.filter(id=>state.mastered[id]).length;
  $('#toc-pct').textContent=done+(done>1?' fiches maîtrisées':' fiche maîtrisée')+' sur '+MASTERABLE.length;
  $('#toc-bar').style.width=pct(done,MASTERABLE.length)+'%';
  tocLinks.forEach(a=>a.classList.toggle('done', !!state.mastered[a.getAttribute('href').slice(1)]));
  $$('.fiche').forEach(f=>{ const b=$('.btn-master',f); if(b){ const on=!!state.mastered[f.id]; b.textContent=on?'Fiche maîtrisée ✓':'Je maîtrise cette fiche'; b.classList.toggle('done',on); } });
}
const SHORT=['qcm','vf','courte','phrase'];
$$('.fiche').forEach(f=>{
  const act=$('.sec-actions',f); if(!act) return;
  const id=f.id;
  if(id!=='s1'){ const b1=document.createElement('button'); b1.type='button'; b1.className='btn btn-master';
    b1.addEventListener('click',()=>{ state.mastered[id]=!state.mastered[id]; save(); refreshMastery(); });
    act.appendChild(b1); }
  const n=BANK.filter(q=>q.s===id && SHORT.indexOf(q.t)>=0).length;
  if(n){ const b2=document.createElement('button'); b2.type='button'; b2.className='btn primary'; b2.textContent='Quiz sur cette fiche ('+n+')';
    b2.addEventListener('click',()=>{ startQuiz({sections:[id],types:SHORT,n:0,prio:false,label:'Fiche '+id.slice(1)+' · '+TITLE[id]}); location.hash='#quiz'; });
    act.appendChild(b2); }
  const nm=BANK.filter(q=>q.s===id && q.t==='moy').length;
  if(nm){ const b3=document.createElement('button'); b3.type='button'; b3.className='btn'; b3.textContent='Questions moyennes ('+nm+')';
    b3.addEventListener('click',()=>{ startQuiz({sections:[id],types:['moy'],n:0,prio:false,label:'Moyennes · '+TITLE[id]}); location.hash='#quiz'; });
    act.appendChild(b3); }
  LONGS.filter(l=>l.s===id).forEach(l=>{ const a=document.createElement('a'); a.className='btn ghost'; a.href='#'+l.id; a.textContent='Question longue : '+l.titre; act.appendChild(a); });
});
(function(){ const act=$('#s1 .sec-actions'); if(!act) return;
  if(!IN_FRAME){ const p=document.createElement('button'); p.type='button'; p.className='btn'; p.textContent='Imprimer les fiches'; p.addEventListener('click',()=>{ location.hash='#fiches'; setTimeout(()=>window.print(),150); }); act.appendChild(p); }
  const r=document.createElement('button'); r.type='button'; r.className='btn ghost'; r.textContent='Effacer ma progression';
  r.addEventListener('click',()=>ask('Effacer les fiches cochées, les résultats de quiz, tes textes de questions longues et les examens blancs sur cet appareil ?',()=>{ state={mastered:{},stats:{},cfg:null,exams:[],longs:{}}; save(); try{localStorage.removeItem(DKEY);}catch(e){} refreshMastery(); updateBadge(); },null,'Effacer'));
  act.appendChild(r); })();

// ---------------- question longue
let curLong=null, lTimer=null;
const lroot=$('#longue-root');
function lstate(id){ if(!state.longs[id]) state.longs[id]={text:'',ch:[],shown:false}; return state.longs[id]; }
function prioBadge(l){ return '<span class="badge'+(l.id==='L1'?' hot':(l.id==='L2'?' warm':''))+'">'+esc(l.prio||'Sujet possible')+'</span>'; }
function renderLongHome(){
  curLong=null; if(lTimer){ clearInterval(lTimer); lTimer=null; }
  lroot.innerHTML='<div class="card"><div class="eyebrow">Question mi-longue · environ 500 mots</div><h2>La question qui compte le plus</h2>'+
    '<p class="lead">Elle demande de <b>faire le lien entre la mondialisation et un grand sujet du cours</b>. Voici la structure qui marche, puis six sujets probables avec plan, réponse modèle et barème à cocher. Écris d\'abord, compare ensuite.</p>'+
    '<div class="struct"><div><b>Introduction</b>~80 mots<br><span>définition du prof, sujet amené, plan</span></div><div><b>Partie 1</b>~120 mots<br><span>une dimension, 2 faits précis</span></div><div><b>Partie 2</b>~120 mots<br><span>une autre dimension</span></div><div><b>Partie 3</b>~120 mots<br><span>une troisième</span></div><div><b>Conclusion</b>~60 mots<br><span>synthèse, ouverture</span></div></div>'+
    '<ul><li>L\'introduction <b>cite la définition du prof</b> : « interaction généralisée entre les différentes parties de l\'humanité ».</li><li>Chaque partie suit une <b>dimension</b> de la définition (économique, politique, sociale et culturelle, environnementale) et finit par une phrase qui <b>revient à la mondialisation</b>.</li><li>Chaque partie a au moins <b>deux faits précis</b> : date, chiffre, nom, lieu, définition du prof.</li><li>Les liens sont <b>écrits en toutes lettres</b> : « c\'est pourquoi », « ce qui entraîne », « en conséquence ».</li></ul>'+
    '<div class="row"><a class="btn" href="#s2">La grille des 5 dimensions (fiche 2)</a></div></div>'+
    '<div class="card"><div class="eyebrow">Les six sujets</div><div class="lgrid">'+LONGS.map(l=>{ const s=state.longs[l.id]; const n=s?words(s.text):0; const sc=s&&s.ch&&l.crit&&rubDone(l.crit,s.ch)?fmt(rubScore(l.crit,s.ch))+' / 9':'';
      return '<button type="button" class="lcard" data-l="'+l.id+'">'+prioBadge(l)+'<h3>'+esc(l.titre)+'</h3><p>'+esc(l.q)+'</p><div class="st">'+(n?'Ton texte : '+n+' mots'+(sc?' · ta note : '+sc:''):'Pas encore écrit')+'</div></button>'; }).join('')+'</div></div>'+
    '<div class="card"><div class="eyebrow">Et si c\'est un autre sujet ?</div><h2>La recette du sujet surprise</h2>'+
    '<ol class="steps"><li><b>Repère le sujet X</b> dans la grille de la <a href="#s2">fiche 2</a> : sa ligne te donne des faits pour chaque dimension.</li><li><b>Choisis 3 dimensions</b> où tu as le plus de faits précis : ce sont tes 3 parties.</li><li><b>Pour chaque partie, trouve le lien</b> avec un autre sujet (les 7 fils rouges) : c\'est ce qui fait la différence.</li><li><b>Recycle</b> : les six réponses modèles se répondent. Les paragraphes sur le mercantilisme, le choc microbien ou le racisme se réutilisent presque tels quels.</li></ol></div>';
  $$('.lcard',lroot).forEach(b=>b.addEventListener('click',()=>{ location.hash='#'+b.getAttribute('data-l'); }));
}
function openLong(id){
  const l=LBY[id]; if(!l) return; curLong=id; if(lTimer){ clearInterval(lTimer); lTimer=null; }
  const s=lstate(id); const i=LONGS.indexOf(l);
  const prev=LONGS[i-1], next=LONGS[i+1];
  lroot.innerHTML='<div class="card"><div class="qhead"><span class="eyebrow">Question longue · sujet '+(i+1)+' sur '+LONGS.length+'</span>'+prioBadge(l)+'</div>'+
    '<h2>'+esc(l.titre)+'</h2><div class="qtext">'+esc(l.q)+'</div>'+
    '<div class="note"><span class="blabel">Pourquoi ce sujet</span><p>'+esc(l.pourquoi)+'</p></div>'+
    '<div class="row"><button type="button" class="btn" id="l-plan-btn">'+(s.plan?'Cacher le plan':'Voir l\'idée directrice et le plan')+'</button><button type="button" class="btn ghost" id="l-chrono">Chrono 45 min</button><span class="timer" id="l-timer" hidden>45:00</span></div>'+
    '<div id="l-plan"'+(s.plan?'':' hidden')+'><div class="retenir" style="margin-top:14px"><span class="blabel">Idée directrice</span><p>'+esc(l.these)+'</p></div><div class="lplan">'+l.plan.map((pp,k)=>'<div class="pp"><b class="t">Partie '+(k+1)+' · '+esc(pp[0])+'</b><ul>'+pp[1].map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>').join('')+'</div></div>'+
    '<h4 style="font-family:var(--f-ui);font-size:12.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-2);margin:22px 0 8px">Ta réponse</h4>'+
    '<textarea id="l-text" style="min-height:380px" placeholder="Introduction : la définition de la mondialisation du prof, le sujet, ton plan.&#10;&#10;D\'abord, ...&#10;&#10;Ensuite, ...&#10;&#10;Enfin, ...&#10;&#10;Conclusion : ...">'+esc(s.text)+'</textarea><div class="wc" id="l-wc"></div>'+
    '<div class="row" style="margin-top:12px"><button type="button" class="btn primary" id="l-show">'+(s.shown?'Cacher la réponse modèle':'Voir la réponse modèle et le barème')+'</button><button type="button" class="btn ghost" id="l-clear">Effacer mon texte</button></div>'+
    '<div id="l-model"></div>'+
    '<div class="qnav"><button type="button" class="btn ghost" id="l-home">Tous les sujets</button><span class="row">'+(prev?'<a class="btn" href="#'+prev.id+'">Sujet précédent</a>':'')+(next?'<a class="btn" href="#'+next.id+'">Sujet suivant</a>':'')+'</span></div></div>';
  const ta=$('#l-text');
  bindWc(ta,$('#l-wc'),WC.long[0],WC.long[1],v=>{ s.text=v; save(); });
  $('#l-plan-btn').addEventListener('click',()=>{ s.plan=!s.plan; save(); $('#l-plan').hidden=!s.plan; $('#l-plan-btn').textContent=s.plan?'Cacher le plan':'Voir l\'idée directrice et le plan'; });
  function showModel(){ const box=$('#l-model'); if(!s.shown){ box.innerHTML=''; return; }
    box.innerHTML=modelHtml(l)+rubHtml(l.crit,s.ch,'id="l-rub"','Barème sur 9 : compare ton texte, critère par critère');
    bindRub($('#l-rub'),l.crit,s.ch,()=>save()); }
  showModel();
  $('#l-show').addEventListener('click',()=>{ const go=()=>{ s.shown=!s.shown; save(); $('#l-show').textContent=s.shown?'Cacher la réponse modèle':'Voir la réponse modèle et le barème'; showModel(); if(s.shown) $('#l-model').scrollIntoView({block:'start'}); };
    if(!s.shown && words(s.text)<150) ask('Tu as écrit '+words(s.text)+' mots. Voir le corrigé maintenant ? Tu retiendras beaucoup mieux en essayant d\'abord, même un plan rapide.',go,null,'Voir le corrigé'); else go(); });
  $('#l-clear').addEventListener('click',()=>ask('Effacer ton texte et ta note pour ce sujet ?',()=>{ state.longs[id]={text:'',ch:[],shown:false}; save(); openLong(id); },null,'Effacer'));
  $('#l-home').addEventListener('click',()=>{ location.hash='#longue'; });
  $('#l-chrono').addEventListener('click',()=>{ const btn=$('#l-chrono'), out=$('#l-timer'); if(lTimer){ clearInterval(lTimer); lTimer=null; btn.textContent='Relancer le chrono'; return; }
    const end=Date.now()+45*60000; out.hidden=false; btn.textContent='Arrêter le chrono';
    const tick=()=>{ const left=Math.max(0,end-Date.now()); const m=Math.floor(left/60000), sec=Math.floor((left%60000)/1000); out.textContent=(m<10?'0':'')+m+':'+(sec<10?'0':'')+sec; out.classList.toggle('low',left<5*60000); if(!left){ clearInterval(lTimer); lTimer=null; btn.textContent='Relancer le chrono'; } };
    tick(); lTimer=setInterval(tick,1000); });
}

// ---------------- quiz
let quiz=null;
const qroot=$('#quiz-root');
function renderQuizSetup(){
  quiz=null;
  const cfg=state.cfg||{groups:GROUPS.map(g=>g.id),types:SHORT.slice(),n:20,prio:false};
  const rev=toReview();
  const seen=Object.keys(state.stats).filter(k=>BYID[k]&&BYID[k].t!=='long').length;
  const oks=Object.keys(state.stats).reduce((a,k)=>a+state.stats[k].ok,0);
  const tot=Object.keys(state.stats).reduce((a,k)=>a+state.stats[k].seen,0);
  qroot.innerHTML=
   '<div class="card"><div class="eyebrow">Quiz</div><h2>Compose ton quiz</h2>'+
   '<p class="lead">Choisis les blocs de matière, les types de questions et le nombre. Les questions fermées sont corrigées tout de suite; pour les phrases et les questions moyennes, tu compares avec la réponse modèle.</p>'+
   '<div class="field"><label>Blocs de matière</label><div class="chips" id="q-groups">'+GROUPS.map(g=>'<button type="button" class="chip" data-g="'+g.id+'" aria-pressed="'+(cfg.groups.indexOf(g.id)>=0)+'">'+g.name+'<span class="cnt">'+BANK.filter(q=>g.s.indexOf(q.s)>=0).length+'</span></button>').join('')+'</div></div>'+
   '<div class="field"><label>Types de questions</label><div class="chips" id="q-types">'+Object.keys(TYPES).map(t=>'<button type="button" class="chip" data-t="'+t+'" aria-pressed="'+(cfg.types.indexOf(t)>=0)+'">'+TYPES[t]+'<span class="cnt">'+BANK.filter(q=>q.t===t).length+'</span></button>').join('')+'</div></div>'+
   '<div class="row"><div class="field"><label for="q-n">Nombre de questions</label><select id="q-n"><option value="10">10</option><option value="20">20</option><option value="40">40</option><option value="0">Toutes</option></select></div>'+
   '<div class="field"><label>Priorité</label><button type="button" class="chip" id="q-prio" aria-pressed="'+!!cfg.prio+'">Prioriser mes erreurs</button></div></div>'+
   '<div class="row"><button type="button" class="btn primary" id="q-start">Commencer</button><span class="stat-line" id="q-avail"></span></div></div>'+
   '<div class="card"><div class="eyebrow">Ma progression</div>'+
   (seen?'<div class="score"><div><small>Questions vues</small><b>'+seen+'<span style="font-size:16px;color:var(--muted)"> / '+BANK.length+'</span></b></div><div><small>Taux de réussite</small><b>'+pct(oks,tot)+' %</b></div><div><small>À revoir</small><b>'+rev.length+'</b></div></div>'+
     '<div class="row">'+(rev.length?'<button type="button" class="btn primary" id="q-review">Refaire mes '+rev.length+' question'+(rev.length>1?'s':'')+' ratée'+(rev.length>1?'s':'')+'</button>':'')+'</div>'
    :'<p class="empty">Aucune question faite pour l\'instant. Les résultats restent sur cet appareil.</p>')+
   '</div>';
  $('#q-n').value=String(cfg.n);
  function readCfg(){ return {groups:$$('#q-groups .chip').filter(c=>c.getAttribute('aria-pressed')==='true').map(c=>c.getAttribute('data-g')), types:$$('#q-types .chip').filter(c=>c.getAttribute('aria-pressed')==='true').map(c=>c.getAttribute('data-t')), n:parseInt($('#q-n').value,10), prio:$('#q-prio').getAttribute('aria-pressed')==='true'}; }
  function avail(){ const c=readCfg(); const secs=GROUPS.filter(g=>c.groups.indexOf(g.id)>=0).reduce((a,g)=>a.concat(g.s),[]); const n=BANK.filter(q=>secs.indexOf(q.s)>=0 && c.types.indexOf(q.t)>=0).length; $('#q-avail').textContent=n+' question'+(n>1?'s':'')+' disponible'+(n>1?'s':'')+' avec ces choix'; $('#q-start').disabled=!n; return c; }
  $$('#q-groups .chip, #q-types .chip, #q-prio').forEach(c=>c.addEventListener('click',()=>{ c.setAttribute('aria-pressed', c.getAttribute('aria-pressed')==='true'?'false':'true'); avail(); }));
  $('#q-n').addEventListener('change',avail);
  avail();
  $('#q-start').addEventListener('click',()=>{ const c=avail(); state.cfg=c; save(); const secs=GROUPS.filter(g=>c.groups.indexOf(g.id)>=0).reduce((a,g)=>a.concat(g.s),[]); startQuiz({sections:secs,types:c.types,n:c.n,prio:c.prio,label:'Quiz'}); });
  const rb=$('#q-review'); if(rb) rb.addEventListener('click',()=>startQuiz({ids:rev.map(q=>q.id),n:0,label:'Mes erreurs'}));
}
const WRITTEN={moy:1};
function startQuiz(o){
  let list;
  if(o.ids){ list=BANK.filter(q=>o.ids.indexOf(q.id)>=0); }
  else { list=BANK.filter(q=>o.sections.indexOf(q.s)>=0 && o.types.indexOf(q.t)>=0); }
  shuffle(list);
  if(o.prio){ list.sort((a,b)=>{ const sa=stat(a.id), sb=stat(b.id); const ka=(sa.seen&&sa.last<1)?0:(sa.seen?2:1); const kb=(sb.seen&&sb.last<1)?0:(sb.seen?2:1); return ka-kb; }); }
  if(o.n) list=list.slice(0,o.n);
  // comme à l'examen : les questions moyennes à la fin
  list.sort((a,b)=>(WRITTEN[a.t]?1:0)-(WRITTEN[b.t]?1:0));
  quiz={list:list.map(q=>({q:q, order:q.t==='qcm'?shuffle(q.o.map((_,i)=>i)):null, score:null, ch:[]})), i:0, label:o.label||'Quiz'};
  renderQuestion();
  window.scrollTo(0,0);
}
function renderQuestion(){
  const it=quiz.list[quiz.i], q=it.q, n=quiz.list.length;
  const g=groupOf(q.s);
  let body='';
  if(q.t==='qcm'){ body='<div class="opts" id="opts">'+it.order.map((oi,k)=>'<button type="button" class="opt" data-i="'+oi+'"><span class="k">'+(k+1)+'</span>'+esc(q.o[oi])+'</button>').join('')+'</div>'; }
  else if(q.t==='vf'){ body='<div class="opts" id="opts"><button type="button" class="opt" data-i="1"><span class="k">1</span>Vrai</button><button type="button" class="opt" data-i="0"><span class="k">2</span>Faux</button></div>'; }
  else if(q.t==='courte'){ body='<input type="text" id="q-in" autocomplete="off" spellcheck="false" placeholder="Ta réponse (un mot ou quelques mots)"><div class="row" style="margin-top:10px"><button type="button" class="btn primary" id="q-check">Vérifier</button><button type="button" class="btn ghost" id="q-idk">Je ne sais pas</button></div>'; }
  else if(q.t==='phrase'){ body='<textarea id="q-text" style="min-height:90px" placeholder="Réponds en une phrase complète."></textarea><div class="row" style="margin-top:10px"><button type="button" class="btn primary" id="q-reveal">Voir la réponse modèle</button></div>'; }
  else { body='<textarea id="q-text" style="min-height:220px" placeholder="Une phrase qui répond tout de suite, deux ou trois faits précis, un lien de cause à effet, une phrase qui revient à la mondialisation."></textarea><div class="wc" id="q-wc"></div><div class="row" style="margin-top:10px"><button type="button" class="btn primary" id="q-reveal">Voir le corrigé et le barème</button></div>'; }
  qroot.innerHTML='<div class="card"><div class="qhead"><span class="eyebrow">'+esc(quiz.label)+' · question '+(quiz.i+1)+' sur '+n+'</span><span class="qtype">'+TYPES[q.t]+' · '+esc(g.name)+'</span></div>'+
    '<div class="progress"><i style="width:'+pct(quiz.i,n)+'%"></i></div>'+
    '<div class="qtext">'+esc(q.q)+'</div>'+body+'<div id="q-fb"></div>'+
    '<div class="qnav"><button type="button" class="btn ghost" id="q-quit">Arrêter le quiz</button><span></span></div></div>';
  $('#q-quit').addEventListener('click',()=>{ const stop=()=>{ quiz=null; renderQuizSetup(); }; if(quiz.i===0) stop(); else ask('Arrêter ce quiz ? Les réponses déjà données sont retenues.',stop,null,'Arrêter'); });
  if(q.t==='qcm'||q.t==='vf'){ $$('#opts .opt').forEach(b=>b.addEventListener('click',()=>answerChoice(parseInt(b.getAttribute('data-i'),10)))); }
  else if(q.t==='courte'){ const inp=$('#q-in'); inp.focus({preventScroll:true});
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); checkShort(false); } });
    $('#q-check').addEventListener('click',()=>checkShort(false)); $('#q-idk').addEventListener('click',()=>checkShort(true)); }
  else { $('#q-reveal').addEventListener('click',revealModel); if(q.t==='moy') bindWc($('#q-text'),$('#q-wc'),WC.moy[0],WC.moy[1]); }
}
function answerChoice(i){
  const it=quiz.list[quiz.i], q=it.q;
  const correct = q.t==='qcm' ? q.a : (q.a?1:0);
  const ok = i===correct;
  $$('#opts .opt').forEach(b=>{ b.disabled=true; const bi=parseInt(b.getAttribute('data-i'),10); if(bi===correct) b.classList.add('ok'); else if(bi===i) b.classList.add('ko'); });
  it.score=ok?1:0; record(q.id,it.score);
  $('#q-fb').innerHTML='<div class="fb '+(ok?'ok':'ko')+'"><span class="blabel">'+(ok?'Bonne réponse':'Mauvaise réponse')+'</span><p>'+esc(q.w)+'</p>'+fbLink(q)+'</div>';
  nextButton();
}
function checkShort(idk){
  const it=quiz.list[quiz.i], q=it.q; const inp=$('#q-in'); const val=inp.value;
  if(!idk && !val.trim()){ inp.focus(); return; }
  inp.disabled=true; $('#q-check').disabled=true; $('#q-idk').disabled=true;
  const ok=!idk && matchShort(val,q.acc);
  if(ok){ it.score=1; record(q.id,1);
    $('#q-fb').innerHTML='<div class="fb ok"><span class="blabel">Bonne réponse</span><p>'+esc(q.m)+'</p></div>'; nextButton(); return; }
  $('#q-fb').innerHTML='<div class="fb ko"><span class="blabel">'+(idk?'Réponse attendue':'Pas reconnue automatiquement')+'</span><p>'+esc(q.m)+'</p></div>'+
    '<div class="grade"><span class="eyebrow">'+(idk?'':'Ta réponse était-elle juste, formulée autrement ?')+'</span>'+(idk?'':'<button type="button" class="btn" data-g="1">Oui, j\'avais bon</button>')+'<button type="button" class="btn" data-g="0">'+(idk?'Continuer':'Non, raté')+'</button><a href="#'+q.s+'" class="btn ghost">Relire la fiche</a></div>';
  $$('#q-fb .grade .btn[data-g]').forEach(b=>b.addEventListener('click',()=>{ const s=parseFloat(b.getAttribute('data-g')); it.score=s; record(q.id,s); $$('#q-fb .grade .btn[data-g]').forEach(x=>{ x.disabled=true; x.classList.toggle('done',x===b); }); nextButton(); }));
}
function revealModel(){
  const it=quiz.list[quiz.i], q=it.q;
  $('#q-reveal').disabled=true;
  if(q.t==='moy'){
    $('#q-fb').innerHTML=modelHtml(q)+rubHtml(q.crit,it.ch,'id="q-rub"','Barème sur 3 : compare ta réponse')+fbLink(q)+'<div class="grade"><button type="button" class="btn primary" id="q-val" disabled>Valider ma note</button></div>';
    const v=$('#q-val');
    bindRub($('#q-rub'),q.crit,it.ch,()=>{ v.disabled=!rubDone(q.crit,it.ch); });
    v.addEventListener('click',()=>{ if(!rubDone(q.crit,it.ch)) return; it.score=rubScore(q.crit,it.ch)/rubMax(q.crit); record(q.id,it.score); v.disabled=true; v.textContent='Note : '+fmt(rubScore(q.crit,it.ch))+' / 3'; $$('#q-rub .seg button').forEach(b=>b.disabled=true); nextButton(); });
    return;
  }
  $('#q-fb').innerHTML=modelHtml(q)+'<div class="grade"><span class="eyebrow">Auto-évaluation :</span><button type="button" class="btn" data-g="1">Je l\'avais</button><button type="button" class="btn" data-g="0.5">À moitié</button><button type="button" class="btn" data-g="0">Raté</button><a href="#'+q.s+'" class="btn ghost">Relire la fiche</a></div>';
  $$('#q-fb .grade .btn[data-g]').forEach(b=>b.addEventListener('click',()=>{ const s=parseFloat(b.getAttribute('data-g')); it.score=s; record(q.id,s); $$('#q-fb .grade .btn[data-g]').forEach(x=>{ x.disabled=true; x.classList.toggle('done',x===b); }); nextButton(); }));
}
function nextButton(){
  const last=quiz.i===quiz.list.length-1;
  const nav=$('.qnav'); const b=document.createElement('button'); b.type='button'; b.className='btn primary'; b.textContent=last?'Voir mes résultats':'Question suivante';
  b.addEventListener('click',()=>{ if(last) renderResults(); else { quiz.i++; renderQuestion(); window.scrollTo(0,0); } });
  nav.lastElementChild.replaceWith(b); b.focus({preventScroll:true});
}
document.addEventListener('keydown',e=>{
  if(!quiz || !quiz.list || quiz.done || !$('#view-quiz').classList.contains('on') || $('.ask')) return;
  if(e.target && (e.target.tagName==='TEXTAREA'||e.target.tagName==='INPUT'||e.target.tagName==='SELECT')) return;
  const opts=$$('#opts .opt:not(:disabled)');
  if(opts.length && /^[1-4]$/.test(e.key)){ const b=opts[parseInt(e.key,10)-1]; if(b) b.click(); }
  else if(e.key==='Enter'){ const nb=$('.qnav .btn.primary'); if(nb) nb.click(); }
});
function renderResults(){
  const L=quiz.list, n=L.length;
  const total=L.reduce((a,it)=>a+(it.score||0),0);
  const byG={}; L.forEach(it=>{ const g=groupOf(it.q.s); byG[g.id]=byG[g.id]||{name:g.name,n:0,s:0}; byG[g.id].n++; byG[g.id].s+=it.score||0; });
  const missed=L.filter(it=>(it.score||0)<1);
  const p=pct(total,n);
  const msg = p>=90?'Excellent. Cette partie est prête.': p>=75?'Solide. Relis les fiches des questions ratées et refais-les.': p>=50?'Ça avance. Concentre-toi sur les fiches ci-dessous avant de continuer.':'Relis les fiches concernées avant de refaire un quiz : ça vaut mieux que de deviner.';
  qroot.innerHTML='<div class="card"><div class="eyebrow">'+esc(quiz.label)+' · résultats</div><h2>'+fmt(total)+' sur '+n+'</h2><p class="lead">'+msg+'</p>'+
    '<div class="score"><div><small>Note</small><b>'+p+' %</b></div><div><small>Réussies</small><b>'+L.filter(it=>it.score>=1).length+'</b></div><div><small>À revoir</small><b>'+missed.length+'</b></div></div>'+
    '<ul class="bygroup">'+Object.keys(byG).map(k=>'<li><span>'+esc(byG[k].name)+'</span><span class="tnum">'+fmt(byG[k].s)+' / '+byG[k].n+'</span><span class="bar"><i style="width:'+pct(byG[k].s,byG[k].n)+'%"></i></span></li>').join('')+'</ul>'+
    '<div class="row">'+(missed.length?'<button type="button" class="btn primary" id="r-redo">Refaire les '+missed.length+' ratée'+(missed.length>1?'s':'')+'</button>':'')+'<button type="button" class="btn" id="r-new">Nouveau quiz</button><a class="btn ghost" href="#fiches">Retour aux fiches</a></div></div>'+
    (missed.length?'<div class="card"><div class="eyebrow">À revoir</div><ul class="missed">'+missed.map(it=>'<li>'+esc(it.q.q)+' <a href="#'+it.q.s+'">Fiche '+it.q.s.slice(1)+' : '+esc(TITLE[it.q.s])+'</a></li>').join('')+'</ul></div>':'');
  const rd=$('#r-redo'); if(rd) rd.addEventListener('click',()=>startQuiz({ids:missed.map(it=>it.q.id),n:0,label:'Reprise'}));
  $('#r-new').addEventListener('click',()=>{ quiz=null; renderQuizSetup(); });
  quiz={done:true,list:L,label:quiz.label};
  window.scrollTo(0,0);
}

// ---------------- examen blanc : courtes, moyennes, longue (barème estimé dans EXAM)
let exam=null;
const eroot=$('#exam-root');
const P1N=EXAM.p1.courte+EXAM.p1.phrase+EXAM.p1.qcm+EXAM.p1.vf, P1MAX=P1N*EXAM.p1.pts, P2MAX=EXAM.p2.pick*EXAM.p2.pts, P3MAX=EXAM.p3.pts;
function loadDraft(){ try{ const d=JSON.parse(localStorage.getItem(DKEY)||'null'); if(d && d.p1 && d.p1.every(x=>BYID[x.id]) && d.p2.every(x=>BYID[x.id]) && LBY[d.p3.id]) return d; }catch(e){} return null; }
function saveDraft(){ if(!exam||exam.submitted) return; try{ localStorage.setItem(DKEY,JSON.stringify({p1:exam.p1.map(x=>({id:x.q.id,order:x.order,sel:x.sel,text:x.text})),p2:exam.p2.map(x=>({id:x.q.id,pick:x.pick,text:x.text})),p3:{id:exam.p3.q.id,text:exam.p3.text},end:exam.end,mins:exam.mins})); }catch(e){} }
function clearDraft(){ try{ localStorage.removeItem(DKEY); }catch(e){} }
function renderExamIntro(){
  exam=null;
  const d=loadDraft();
  eroot.innerHTML='<div class="qwrap"><div class="card"><div class="eyebrow">Examen blanc</div><h2>Une copie complète de l\'Intra 2</h2>'+
    '<p class="lead"><b>Partie 1</b> : '+P1N+' questions courtes, d\'un mot à une phrase ('+fmt(P1MAX)+' points). <b>Partie 2</b> : tu choisis '+EXAM.p2.pick+' questions moyennes sur '+EXAM.p2.offer+', 100 à 200 mots chacune ('+fmt(P2MAX)+' points). <b>Partie 3</b> : la question mi-longue, environ 500 mots ('+fmt(P3MAX)+' points). Total sur 20.</p>'+
    '<p class="stat-line" style="margin-top:0">Le prof n\'a pas donné le barème : cette répartition est une estimation qui respecte ce qu\'il a dit (la longue compte pour beaucoup). La partie 1 est surtout corrigée automatiquement; pour le reste, tu te notes avec le corrigé et le barème : sois sévère.</p>'+
    '<div class="row"><div class="field"><label for="e-dur">Durée</label><select id="e-dur"><option value="110">1 h 50 (une séance complète)</option><option value="90">1 h 30</option><option value="0">Sans limite</option></select></div>'+
    '<div class="field"><label for="e-long">Question longue</label><select id="e-long"><option value="">Tirée au hasard</option>'+LONGS.filter(l=>l.m).map(l=>'<option value="'+l.id+'">'+esc(l.titre)+'</option>').join('')+'</select></div></div>'+
    '<div class="row"><button type="button" class="btn primary" id="e-start">Commencer l\'examen</button>'+(d?'<button type="button" class="btn" id="e-resume">Reprendre l\'examen en cours</button>':'')+'</div>'+
    '<p class="stat-line">Conseil de temps sur 1 h 50 : 15 min pour la partie 1, 35 min pour les deux moyennes, 50 min pour la longue, 10 min pour te relire.</p></div>'+
    '<div class="card"><div class="eyebrow">Mes examens blancs</div>'+(state.exams.length?'<ul class="bygroup">'+state.exams.slice().reverse().map(x=>'<li><span>'+esc(x.date)+'</span><span class="tnum">'+fmt(x.score)+' / '+x.total+'</span><span class="bar"><i style="width:'+pct(x.score,x.total)+'%"></i></span></li>').join('')+'</ul>':'<p class="empty">Aucun examen blanc fait pour l\'instant.</p>')+'</div></div>';
  $('#e-start').addEventListener('click',()=>{ const go=()=>{ clearDraft(); startExam(parseInt($('#e-dur').value,10),$('#e-long').value); }; if(d) ask('Commencer un nouvel examen ? L\'examen en cours sera abandonné.',go,null,'Nouvel examen'); else go(); });
  const rs=$('#e-resume'); if(rs) rs.addEventListener('click',()=>resumeExam(d));
}
function pickSpread(filter,count){
  const buckets=GROUPS.map(g=>shuffle(BANK.filter(q=>filter(q) && g.s.indexOf(q.s)>=0)));
  const out=[]; let guard=0;
  while(out.length<count && guard<1000){ guard++; let any=false; for(const b of shuffle(buckets.slice())){ if(out.length>=count) break; if(b.length){ out.push(b.pop()); any=true; } } if(!any) break; }
  return out;
}
function startExam(mins,longId){
  const E=EXAM.p1;
  const p1=pickSpread(q=>q.t==='courte',E.courte).concat(pickSpread(q=>q.t==='phrase',E.phrase),pickSpread(q=>q.t==='qcm',E.qcm),pickSpread(q=>q.t==='vf',E.vf));
  const p2=pickSpread(q=>q.t==='moy',EXAM.p2.offer);
  const L=longId&&LBY[longId]?LBY[longId]:shuffle(LONGS.filter(l=>l.m))[0];
  exam={p1:shuffle(p1).map(q=>({q:q,order:q.t==='qcm'?shuffle(q.o.map((_,i)=>i)):null,sel:null,text:'',score:null,override:false})),
        p2:p2.map(q=>({q:q,pick:false,text:'',ch:[]})), p3:{q:L,text:'',ch:[]},
        mins:mins,end:mins?Date.now()+mins*60000:0,timer:null,submitted:false};
  if(mins) exam.timer=setInterval(tickExam,1000);
  saveDraft(); renderExamPaper(); window.scrollTo(0,0);
}
function resumeExam(d){
  exam={p1:d.p1.map(x=>({q:BYID[x.id],order:x.order,sel:x.sel,text:x.text||'',score:null,override:false})),
        p2:d.p2.map(x=>({q:BYID[x.id],pick:!!x.pick,text:x.text||'',ch:[]})), p3:{q:LBY[d.p3.id],text:d.p3.text||'',ch:[]},
        mins:d.mins,end:d.end,timer:null,submitted:false};
  if(exam.end && exam.end<=Date.now()){ submitExam(true); return; }
  if(exam.end) exam.timer=setInterval(tickExam,1000);
  renderExamPaper(); window.scrollTo(0,0);
}
function tickExam(){
  if(!exam||exam.submitted) return;
  const el=$('#e-timer'); if(!el) return;
  const left=exam.end-Date.now();
  if(left<=0){ clearInterval(exam.timer); submitExam(true); return; }
  const h=Math.floor(left/3600000), m=Math.floor((left%3600000)/60000), s=Math.floor((left%60000)/1000);
  el.textContent=(h?h+' h ':'')+(m<10?'0':'')+m+':'+(s<10?'0':'')+s; el.classList.toggle('low',left<10*60000);
}
function renderExamPaper(){
  const picks=exam.p2.filter(x=>x.pick).length;
  let h='<div class="ewrap"><div class="ebar"><span class="eyebrow">Examen blanc · copie</span><span class="row">'+(exam.mins?'<span class="timer" id="e-timer">--:--</span>':'')+'<button type="button" class="btn primary sm" id="e-submit-top">Remettre ma copie</button></span></div>';
  // partie 1
  h+='<div class="paper"><div class="part-h"><h3>Partie 1 · Questions courtes</h3><span class="pts">'+fmt(P1MAX)+' points · '+P1N+' × '+fmt(EXAM.p1.pts)+'</span></div>';
  exam.p1.forEach((it,k)=>{ const q=it.q; let body='';
    if(q.t==='qcm') body='<div class="opts">'+it.order.map((oi,j)=>'<button type="button" class="opt'+(it.sel===oi?' sel':'')+'" data-p1="'+k+'" data-i="'+oi+'"><span class="k">'+String.fromCharCode(97+j)+'</span>'+esc(q.o[oi])+'</button>').join('')+'</div>';
    else if(q.t==='vf') body='<div class="opts"><button type="button" class="opt'+(it.sel===1?' sel':'')+'" data-p1="'+k+'" data-i="1"><span class="k">V</span>Vrai</button><button type="button" class="opt'+(it.sel===0?' sel':'')+'" data-p1="'+k+'" data-i="0"><span class="k">F</span>Faux</button></div>';
    else if(q.t==='courte') body='<input type="text" data-p1t="'+k+'" autocomplete="off" spellcheck="false" placeholder="Un mot ou quelques mots" value="'+esc(it.text)+'">';
    else body='<textarea data-p1t="'+k+'" style="min-height:76px" placeholder="Une phrase complète">'+esc(it.text)+'</textarea>';
    h+='<div class="eq"><span class="n">Question '+(k+1)+' · '+TYPES[q.t]+' · '+fmt(EXAM.p1.pts)+' pt</span><div class="qtext">'+esc(q.q)+'</div>'+body+'</div>'; });
  h+='</div>';
  // partie 2
  h+='<div class="paper"><div class="part-h"><h3>Partie 2 · Questions moyennes</h3><span class="pts">'+fmt(P2MAX)+' points · '+EXAM.p2.pick+' × '+EXAM.p2.pts+'</span></div><p class="stat-line" style="margin-top:0">Choisis <b>'+EXAM.p2.pick+' questions sur '+EXAM.p2.offer+'</b> et réponds en 100 à 200 mots. <span id="p2-count">'+picks+' / '+EXAM.p2.pick+' choisies</span></p>';
  exam.p2.forEach((it,k)=>{ const dis=!it.pick && picks>=EXAM.p2.pick;
    h+='<div class="eq'+(it.pick?'':' off')+'"><label class="pick"><input type="checkbox" data-p2="'+k+'"'+(it.pick?' checked':'')+(dis?' disabled':'')+'> Je choisis cette question</label><div class="qtext">'+esc(it.q.q)+'</div>'+(it.pick?'<textarea data-p2t="'+k+'" placeholder="Une phrase qui répond, deux ou trois faits précis, un lien de cause à effet, une phrase qui revient à la mondialisation.">'+esc(it.text)+'</textarea><div class="wc" data-p2w="'+k+'"></div>':'')+'</div>'; });
  h+='</div>';
  // partie 3
  const L=exam.p3.q;
  h+='<div class="paper"><div class="part-h"><h3>Partie 3 · Question mi-longue</h3><span class="pts">'+fmt(P3MAX)+' points</span></div><div class="qtext">'+esc(L.q)+'</div><textarea id="p3-text" style="min-height:420px" placeholder="Introduction (définition du prof, sujet, plan), trois parties, conclusion.">'+esc(exam.p3.text)+'</textarea><div class="wc" id="p3-wc"></div></div>';
  h+='<div class="row" style="margin-top:18px;justify-content:space-between"><button type="button" class="btn ghost" id="e-quit">Abandonner</button><button type="button" class="btn primary" id="e-submit">Remettre ma copie</button></div></div>';
  eroot.innerHTML=h;
  if(exam.mins) tickExam();
  $$('.opt[data-p1]').forEach(b=>b.addEventListener('click',()=>{ const k=parseInt(b.getAttribute('data-p1'),10); exam.p1[k].sel=parseInt(b.getAttribute('data-i'),10); $$('.opt[data-p1="'+k+'"]').forEach(x=>x.classList.toggle('sel',x===b)); saveDraft(); }));
  $$('[data-p1t]').forEach(inp=>inp.addEventListener('input',()=>{ exam.p1[parseInt(inp.getAttribute('data-p1t'),10)].text=inp.value; saveDraft(); }));
  $$('input[data-p2]').forEach(c=>c.addEventListener('change',()=>{ const k=parseInt(c.getAttribute('data-p2'),10); const it=exam.p2[k];
    const apply=()=>{ it.pick=c.checked; if(!it.pick) it.text=''; saveDraft(); const y=window.scrollY; renderExamPaper(); window.scrollTo(0,y); const ta=$('textarea[data-p2t="'+k+'"]'); if(ta) ta.focus({preventScroll:true}); };
    if(!c.checked && it.text.trim()){ ask('Retirer cette question ? Ta réponse sera effacée.',apply,()=>{ c.checked=true; },'Retirer'); return; }
    apply(); }));
  $$('textarea[data-p2t]').forEach(ta=>{ const k=parseInt(ta.getAttribute('data-p2t'),10); bindWc(ta,$('[data-p2w="'+k+'"]'),WC.moy[0],WC.moy[1],v=>{ exam.p2[k].text=v; saveDraft(); }); });
  bindWc($('#p3-text'),$('#p3-wc'),WC.long[0],WC.long[1],v=>{ exam.p3.text=v; saveDraft(); });
  const sub=()=>{ const p=exam.p2.filter(x=>x.pick).length; const miss=P1N-exam.p1.filter(x=>x.sel!==null||x.text.trim()).length;
    let warn=[]; if(miss) warn.push(miss+' question'+(miss>1?'s':'')+' de la partie 1 sans réponse'); if(p<EXAM.p2.pick) warn.push('seulement '+p+' question'+(p>1?'s':'')+' moyenne'+(p>1?'s':'')+' choisie'+(p>1?'s':'')); const w3=words(exam.p3.text); if(w3<300) warn.push('la question longue fait '+w3+' mots');
    if(!warn.length) submitExam(false); else ask('Attention : '+warn.join(', ')+'. Remettre quand même ?',()=>submitExam(false),null,'Remettre'); };
  $('#e-submit').addEventListener('click',sub); $('#e-submit-top').addEventListener('click',sub);
  $('#e-quit').addEventListener('click',()=>ask('Abandonner cet examen blanc ? Rien ne sera enregistré.',()=>{ if(exam.timer) clearInterval(exam.timer); clearDraft(); exam=null; renderExamIntro(); window.scrollTo(0,0); },null,'Abandonner'));
}
function submitExam(timeout){
  if(exam.timer) clearInterval(exam.timer);
  exam.submitted=true; clearDraft();
  const pt=EXAM.p1.pts;
  exam.p1.forEach(it=>{ const q=it.q;
    if(q.t==='qcm') it.score=it.sel===q.a?pt:0;
    else if(q.t==='vf') it.score=(it.sel!==null && (it.sel===1)===q.a)?pt:0;
    else if(q.t==='courte') it.score=matchShort(it.text,q.acc)?pt:0;
    else it.score=it.text.trim()?null:0;
    if(it.score!==null) record(q.id,it.score/pt); });
  exam.timeout=timeout; renderCorrection(); window.scrollTo(0,0);
}
function examTotals(){
  const p1=exam.p1.reduce((a,it)=>a+(it.score||0),0);
  const chosen=exam.p2.filter(x=>x.pick);
  const p2=chosen.reduce((a,x)=>a+rubScore(x.q.crit,x.ch),0);
  const p3=rubScore(exam.p3.q.crit,exam.p3.ch);
  const graded=exam.p1.every(it=>it.score!==null) && chosen.every(x=>rubDone(x.q.crit,x.ch)) && rubDone(exam.p3.q.crit,exam.p3.ch);
  return {p1:p1,p2:p2,p3:p3,graded:graded,total:p1+p2+p3};
}
function renderCorrection(){
  const T=examTotals();
  const pt=EXAM.p1.pts;
  let h='<div class="ewrap"><div class="card" id="e-head">'+headHtml(T)+'</div>';
  h+='<div class="paper"><div class="part-h"><h3>Partie 1 · Questions courtes</h3><span class="pts" id="c-p1">'+fmt(T.p1)+' / '+fmt(P1MAX)+'</span></div>';
  exam.p1.forEach((it,k)=>{ const q=it.q; let you='';
    if(q.t==='qcm'){ const ok=it.score>0; you='<p class="res '+(ok?'ok':'ko')+'">Ta réponse : <b>'+(it.sel===null?'aucune':esc(q.o[it.sel]))+'</b>'+(ok?' ✓':'')+'</p>'+(ok?'':'<p class="res">Bonne réponse : <b>'+esc(q.o[q.a])+'</b></p>')+'<p style="font-size:15px;color:var(--ink-2);margin-top:6px">'+esc(q.w)+'</p>'; }
    else if(q.t==='vf'){ const ok=it.score>0; you='<p class="res '+(ok?'ok':'ko')+'">Ta réponse : <b>'+(it.sel===null?'aucune':(it.sel===1?'Vrai':'Faux'))+'</b>'+(ok?' ✓':'')+'</p>'+(ok?'':'<p class="res">Bonne réponse : <b>'+(q.a?'Vrai':'Faux')+'</b></p>')+'<p style="font-size:15px;color:var(--ink-2);margin-top:6px">'+esc(q.w)+'</p>'; }
    else if(q.t==='courte'){ const ok=it.score>0; you='<p class="res '+(ok?'ok':'ko')+'">Ta réponse : <b>'+(it.text.trim()?esc(it.text):'aucune')+'</b>'+(ok?' ✓':'')+'</p><p class="res">Réponse attendue : <b>'+esc(ansHead(q))+'</b></p><p style="font-size:15px;color:var(--ink-2);margin-top:6px">'+esc(q.m)+'</p>'+
      (!ok && it.text.trim()?'<div class="grade"><button type="button" class="btn sm'+(it.override?' done':'')+'" data-ov="'+k+'">'+(it.override?'Comptée juste ✓':'Ma réponse était juste (autre formulation)')+'</button></div>':''); }
    else { you='<p class="res">Ta réponse : <b>'+(it.text.trim()?esc(it.text):'aucune')+'</b></p>'+modelHtml(q)+
      (it.text.trim()?'<div class="pts-btns" data-ph="'+k+'"><span class="eyebrow">Ma note :</span>'+[[pt,'Juste'],[pt/2,'À moitié'],[0,'Raté']].map(x=>'<button type="button" class="btn sm'+(it.score===x[0]?' done':'')+'" data-v="'+x[0]+'">'+x[1]+' ('+fmt(x[0])+')</button>').join('')+'</div>':''); }
    h+='<div class="eq"><span class="n">Question '+(k+1)+' · '+TYPES[q.t]+' · <a href="#'+q.s+'">fiche '+q.s.slice(1)+'</a></span><div class="qtext">'+esc(q.q)+'</div>'+you+'</div>'; });
  h+='</div>';
  const chosen=exam.p2.filter(x=>x.pick);
  h+='<div class="paper"><div class="part-h"><h3>Partie 2 · à noter avec le barème</h3><span class="pts" id="c-p2">'+fmt(T.p2)+' / '+fmt(P2MAX)+'</span></div>';
  if(!chosen.length) h+='<p class="empty">Aucune question choisie.</p>';
  exam.p2.forEach((it,k)=>{ if(!it.pick) return; const q=it.q;
    h+='<div class="eq"><span class="n"><a href="#'+q.s+'">fiche '+q.s.slice(1)+'</a></span><div class="qtext">'+esc(q.q)+'</div><p class="res">Ta réponse ('+words(it.text)+' mots) :</p><div class="fb" style="white-space:pre-wrap;margin-top:4px">'+(it.text.trim()?esc(it.text):'<span class="empty">aucune réponse</span>')+'</div>'+modelHtml(q)+rubHtml(q.crit,it.ch,'data-r2="'+k+'"','Barème sur 3')+'</div>'; });
  const others=exam.p2.filter(x=>!x.pick);
  if(others.length) h+='<p class="stat-line">Non choisie'+(others.length>1?'s':'')+' (à réviser aussi) : '+others.map(x=>esc(x.q.q)).join(' · ')+'</p>';
  h+='</div>';
  const L=exam.p3.q;
  h+='<div class="paper"><div class="part-h"><h3>Partie 3 · à noter avec le barème</h3><span class="pts" id="c-p3">'+fmt(T.p3)+' / '+fmt(P3MAX)+'</span></div><div class="qtext">'+esc(L.q)+'</div><p class="res">Ta réponse ('+words(exam.p3.text)+' mots) :</p><div class="fb" style="white-space:pre-wrap;margin-top:4px">'+(exam.p3.text.trim()?esc(exam.p3.text):'<span class="empty">aucune réponse</span>')+'</div>'+modelHtml(L)+rubHtml(L.crit,exam.p3.ch,'id="r3"','Barème sur 9')+'</div>';
  h+='</div>';
  eroot.innerHTML=h;
  bindCorrection();
}
function headHtml(T){
  return '<div class="eyebrow">Examen blanc · correction</div><h2>'+(T.graded?fmt(T.total)+' / 20':'Note tes réponses écrites')+'</h2>'+
    (exam.timeout?'<p class="lead">Le temps est écoulé : la copie a été remise automatiquement.</p>':'')+
    '<div class="score"><div><small>Partie 1</small><b>'+fmt(T.p1)+'<span style="font-size:16px;color:var(--muted)"> / '+fmt(P1MAX)+'</span></b></div><div><small>Partie 2</small><b>'+fmt(T.p2)+'<span style="font-size:16px;color:var(--muted)"> / '+fmt(P2MAX)+'</span></b></div><div><small>Partie 3</small><b>'+fmt(T.p3)+'<span style="font-size:16px;color:var(--muted)"> / '+fmt(P3MAX)+'</span></b></div></div>'+
    (T.graded?'<p class="lead">'+(T.total>=17?'Excellent : tu es prêt.':T.total>=14?'Bien. Relis les corrigés là où tu as perdu des points, surtout dans la longue.':T.total>=10?'La note de passage est là, mais il reste du travail : reprends les fiches des questions ratées et réécris la longue.':'Reprends les fiches et les fils rouges, puis refais un examen blanc.')+'</p><div class="row"><button type="button" class="btn primary" id="e-again">Nouvel examen blanc</button><a class="btn ghost" href="#longue">Travailler la question longue</a></div>'
      :'<p class="stat-line">Pour chaque réponse écrite, compare avec le corrigé et note chaque critère. Un argument sans fait précis vaut la moitié.</p>');
}
function bindCorrection(){
  function refresh(){ const T=examTotals(); $('#e-head').innerHTML=headHtml(T); $('#c-p1').textContent=fmt(T.p1)+' / '+fmt(P1MAX); $('#c-p2').textContent=fmt(T.p2)+' / '+fmt(P2MAX); $('#c-p3').textContent=fmt(T.p3)+' / '+fmt(P3MAX);
    const ag=$('#e-again'); if(ag) ag.addEventListener('click',()=>{ exam=null; renderExamIntro(); window.scrollTo(0,0); });
    if(T.graded && !exam.saved){ exam.saved=true;
      exam.p2.filter(x=>x.pick).forEach(x=>record(x.q.id,rubScore(x.q.crit,x.ch)/3));
      state.exams.push({date:new Date().toLocaleDateString('fr-CA',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}),score:T.total,total:20}); if(state.exams.length>20) state.exams.shift(); save(); }
    else if(T.graded && exam.saved){ state.exams[state.exams.length-1].score=T.total; save(); } }
  const pt=EXAM.p1.pts;
  $$('[data-ov]').forEach(b=>b.addEventListener('click',()=>{ const it=exam.p1[parseInt(b.getAttribute('data-ov'),10)]; it.override=!it.override; it.score=it.override?pt:0; if(state.stats[it.q.id]){ state.stats[it.q.id].last=it.score/pt; save(); updateBadge(); } b.classList.toggle('done',it.override); b.textContent=it.override?'Comptée juste ✓':'Ma réponse était juste (autre formulation)'; refresh(); }));
  $$('[data-ph]').forEach(box=>box.addEventListener('click',e=>{ const b=e.target.closest('button[data-v]'); if(!b) return; const it=exam.p1[parseInt(box.getAttribute('data-ph'),10)]; const first=it.score===null; it.score=parseFloat(b.getAttribute('data-v'));
    if(first) record(it.q.id,it.score/pt); else if(state.stats[it.q.id]){ state.stats[it.q.id].last=it.score/pt; save(); updateBadge(); }
    $$('button[data-v]',box).forEach(x=>x.classList.toggle('done',x===b)); refresh(); }));
  $$('[data-r2]').forEach(box=>{ const it=exam.p2[parseInt(box.getAttribute('data-r2'),10)]; bindRub(box,it.q.crit,it.ch,refresh); });
  bindRub($('#r3'),exam.p3.q.crit,exam.p3.ch,refresh);
  refresh();
}

// ---------------- cartes éclair
let deck=null;
const croot=$('#cards-root');
function renderCardsSetup(){
  deck=null;
  const cards=BANK.filter(q=>q.t==='courte'||q.t==='phrase');
  croot.innerHTML='<div class="card"><div class="eyebrow">Cartes éclair</div><h2>Une question, une réponse</h2><p class="lead">Idéal pour les questions courtes : définitions, personnages, dates, classements. Réfléchis, retourne la carte, puis dis honnêtement si tu l\'avais. Les cartes « à revoir » reviennent en fin de paquet.</p>'+
    '<div class="field"><label>Blocs de matière</label><div class="chips" id="c-groups">'+GROUPS.map(g=>'<button type="button" class="chip" data-g="'+g.id+'" aria-pressed="true">'+g.name+'<span class="cnt">'+cards.filter(q=>g.s.indexOf(q.s)>=0).length+'</span></button>').join('')+'</div></div>'+
    '<div class="row"><button type="button" class="btn primary" id="c-start">Commencer</button><span class="stat-line" id="c-avail"></span></div></div>';
  function sel(){ const gs=$$('#c-groups .chip').filter(c=>c.getAttribute('aria-pressed')==='true').map(c=>c.getAttribute('data-g')); const secs=GROUPS.filter(g=>gs.indexOf(g.id)>=0).reduce((a,g)=>a.concat(g.s),[]); const l=cards.filter(q=>secs.indexOf(q.s)>=0); $('#c-avail').textContent=l.length+' carte'+(l.length>1?'s':''); $('#c-start').disabled=!l.length; return l; }
  $$('#c-groups .chip').forEach(c=>c.addEventListener('click',()=>{ c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')==='true'?'false':'true'); sel(); }));
  sel();
  $('#c-start').addEventListener('click',()=>{ deck={queue:shuffle(sel().slice()),flipped:false,ok:0,again:0,total:0}; deck.total=deck.queue.length; renderCard(); });
}
function renderCard(){
  if(!deck.queue.length){ croot.innerHTML='<div class="card"><div class="eyebrow">Cartes éclair · terminé</div><h2>Paquet terminé</h2><div class="score"><div><small>Sues du premier coup</small><b>'+deck.ok+'</b></div><div><small>Revues</small><b>'+deck.again+'</b></div></div><div class="row"><button type="button" class="btn primary" id="c-new">Nouveau paquet</button><a class="btn ghost" href="#fiches">Retour aux fiches</a></div></div>'; $('#c-new').addEventListener('click',renderCardsSetup); return; }
  const q=deck.queue[0];
  const done=deck.total-deck.queue.length;
  croot.innerHTML='<div class="card"><div class="qhead"><span class="eyebrow">Cartes éclair · '+deck.queue.length+' restante'+(deck.queue.length>1?'s':'')+'</span><span class="qtype">'+esc(TITLE[q.s])+'</span></div>'+
    '<div class="progress"><i style="width:'+pct(Math.max(0,done),deck.total)+'%"></i></div>'+
    '<div class="flash" id="c-card" role="button" tabindex="0"><div class="side" id="c-front">'+esc(q.q)+'</div><div class="side back" id="c-back" hidden>'+(q.acc&&q.acc.length?'<p style="font-family:var(--f-display);font-size:26px;margin-bottom:6px">'+esc(ansHead(q))+'</p>':'')+'<p>'+esc(q.m)+'</p></div><div class="hint" id="c-hint">Clique ou appuie sur Espace pour retourner</div></div>'+
    '<div class="grade" id="c-grade" hidden><button type="button" class="btn" data-r="ok">Je l\'avais</button><button type="button" class="btn" data-r="again">À revoir</button><a href="#'+q.s+'" class="btn ghost">Relire la fiche</a></div>'+
    '<div class="qnav"><button type="button" class="btn ghost" id="c-quit">Arrêter</button></div></div>';
  const flip=()=>{ if(deck.flipped) return; deck.flipped=true; $('#c-front').hidden=true; $('#c-back').hidden=false; $('#c-hint').hidden=true; $('#c-grade').hidden=false; };
  $('#c-card').addEventListener('click',flip);
  $('#c-card').addEventListener('keydown',e=>{ if(e.key===' '||e.key==='Enter'){ e.preventDefault(); flip(); } });
  $$('#c-grade .btn[data-r]').forEach(b=>b.addEventListener('click',()=>{ const r=b.getAttribute('data-r'); deck.queue.shift(); deck.flipped=false; if(r==='ok'){ deck.ok++; record(q.id,1); } else { deck.again++; record(q.id,0); deck.queue.push(q); } renderCard(); }));
  $('#c-quit').addEventListener('click',()=>{ deck=null; renderCardsSetup(); });
  $('#c-card').focus({preventScroll:true});
}

// ---------------- révision express
$$('[data-express]').forEach(b=>b.addEventListener('click',()=>{
  const all=GROUPS.reduce((a,g)=>a.concat(g.s),[]);
  const k=b.getAttribute('data-express');
  if(k==='p1'){ const E=EXAM.p1; const l=shuffle(BANK.filter(q=>q.t==='courte')).slice(0,E.courte).concat(shuffle(BANK.filter(q=>q.t==='phrase')).slice(0,E.phrase),shuffle(BANK.filter(q=>q.t==='qcm')).slice(0,E.qcm),shuffle(BANK.filter(q=>q.t==='vf')).slice(0,E.vf)); startQuiz({ids:l.map(q=>q.id),n:0,label:'Comme la partie 1'}); }
  else if(k==='p2') startQuiz({sections:all,types:['moy'],n:2,prio:false,label:'Comme la partie 2'});
  location.hash='#quiz';
}));
(function(){ const btn=$('#x-chrono'), out=$('#x-timer'); if(!btn) return; let t0=null, id=null;
  btn.addEventListener('click',()=>{ if(id){ clearInterval(id); id=null; btn.textContent='Relancer le chrono'; return; }
    t0=Date.now(); out.hidden=false; btn.textContent='Arrêter le chrono';
    id=setInterval(()=>{ const s=Math.floor((Date.now()-t0)/1000); const m=Math.floor(s/60); out.textContent=(m<10?'0':'')+m+':'+(s%60<10?'0':'')+(s%60); out.classList.toggle('low',m>=30); },1000); });
})();

// ---------------- démarrage
refreshMastery(); updateBadge();
route();
})();
