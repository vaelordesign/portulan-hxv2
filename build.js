// Assemble les morceaux de parts/ en une seule page autonome, après avoir vérifié la banque de questions.
//  - portulan-hxv2.html : fragment (sans <html>/<head>/<body>) pour l'Artifact
//  - docs/index.html    : page complète (ouverture locale en double-clic, ou GitHub Pages)
// Usage : node build.js            (échoue si la banque a une erreur bloquante)
const fs=require('fs'),p=require('path');
const P=x=>fs.readFileSync(p.join(__dirname,'parts',x),'utf8');

// ---------- rose des vents (motif des portulans), dessinée ici pour garder le HTML léger
function star(r1,r2,r3,rv){ const pts=[]; for(let i=0;i<32;i++){ const a=i*Math.PI/16-Math.PI/2; const j=i/2; const r=i%2?rv:(j%4===0?r1:(j%2===0?r2:r3)); pts.push((r*Math.cos(a)).toFixed(2)+','+(r*Math.sin(a)).toFixed(2)); } return pts.join(' '); }
function roseBig(){
  let s='<svg class="rose" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false"><g stroke="currentColor" fill="none">';
  for(let i=0;i<32;i++){ const a=i*Math.PI/16; const w=i%4===0?0.5:(i%2===0?0.32:0.2); s+='<line x1="0" y1="0" x2="'+(100*Math.cos(a)).toFixed(2)+'" y2="'+(100*Math.sin(a)).toFixed(2)+'" stroke-width="'+w+'"/>'; }
  s+='<circle r="58" stroke-width="0.45"/><circle r="61" stroke-width="0.25"/>';
  for(let i=0;i<64;i++){ const a=i*Math.PI/32; const r2=i%2?56.6:55; s+='<line x1="'+(58*Math.cos(a)).toFixed(2)+'" y1="'+(58*Math.sin(a)).toFixed(2)+'" x2="'+(r2*Math.cos(a)).toFixed(2)+'" y2="'+(r2*Math.sin(a)).toFixed(2)+'" stroke-width="0.3"/>'; }
  s+='</g><polygon points="'+star(46,33,21,5)+'" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width=".5"/><circle r="3" fill="currentColor"/></svg>';
  return s;
}
function roseSmall(){ return '<svg width="30" height="30" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false"><circle r="44" fill="none" stroke="currentColor" stroke-width="2.5"/><polygon points="'+star(48,34,22,6)+'" fill="currentColor" fill-opacity=".25" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle r="4.5" fill="currentColor"/></svg>'; }

// ---------- banque : fusion et vérification
const fiches=[P('b1-fiches.html'),P('b2-fiches.html'),P('b3-fiches.html'),P('b4-fiches.html')].join('\n');
const SECS=new Set([...fiches.matchAll(/<section class="fiche" id="(s\d+)"/g)].map(m=>m[1]));
function readDir(d){ const dir=p.join(__dirname,'parts',d); let out=[];
  for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort()){
    try{ const a=JSON.parse(fs.readFileSync(p.join(dir,f),'utf8')); out=out.concat(a); console.log(d+'/'+f,':',a.length); }
    catch(e){ console.error('ERREUR JSON dans',d+'/'+f,':',e.message); process.exit(1); } }
  return out; }
const qbank=readDir('bank'), moy=readDir('moy');
let longs; try{ longs=JSON.parse(P('longues.json')); }catch(e){ console.error('ERREUR JSON dans longues.json :',e.message); process.exit(1); }
const errors=[], warns=[], ids=new Set();
const DASH=/[—–]/;
const sum=c=>(c||[]).reduce((a,x)=>a+x[1],0);
for(const q of qbank.concat(moy,longs)){
  const tag=(q&&q.id)||'(sans id)';
  if(!q.id) errors.push(tag+' : id manquant'); else if(ids.has(q.id)) errors.push(tag+' : id en double'); else ids.add(q.id);
  if(!SECS.has(q.s)) errors.push(tag+' : fiche inconnue '+q.s);
  if(['qcm','vf','courte','phrase','moy','long'].indexOf(q.t)<0) errors.push(tag+' : type inconnu '+q.t);
  if(!q.q||typeof q.q!=='string') errors.push(tag+' : énoncé manquant');
  if(q.t==='qcm'){ if(!Array.isArray(q.o)||q.o.length<3) errors.push(tag+' : options'); if(!(Number.isInteger(q.a)&&q.a>=0&&q.a<(q.o||[]).length)) errors.push(tag+' : index de réponse'); if(q.o&&new Set(q.o).size!==q.o.length) errors.push(tag+' : options en double'); }
  if(q.t==='vf' && typeof q.a!=='boolean') errors.push(tag+' : a doit être true/false');
  if((q.t==='qcm'||q.t==='vf') && !q.w) warns.push(tag+' : pas d\'explication');
  if(q.t==='courte'){ if(!q.m) errors.push(tag+' : réponse modèle manquante'); if(!Array.isArray(q.acc)||!q.acc.length) errors.push(tag+' : acc doit être un tableau non vide'); }
  if(q.t==='phrase' && !q.m) errors.push(tag+' : phrase modèle manquante');
  if(q.t==='moy'){ if(!q.m) errors.push(tag+' : réponse modèle manquante'); if(sum(q.crit)!==3) errors.push(tag+' : barème = '+sum(q.crit)+' au lieu de 3'); }
  if(q.t==='long'){ if(!q.plan||!q.plan.length) errors.push(tag+' : plan manquant'); if(q.m && sum(q.crit)!==9) errors.push(tag+' : barème = '+sum(q.crit)+' au lieu de 9'); }
  if(DASH.test(JSON.stringify(q))) errors.push(tag+' : tiret long ou moyen');
}
const ALL=[P('b0-topbar.html'),P('f-express.html'),fiches,P('c-views.html'),P('d1-core.js'),P('e-app.js')].join('\n');
const dashLines=ALL.split('\n').map((l,i)=>[i,l]).filter(([i,l])=>DASH.test(l));
if(dashLines.length) warns.push(dashLines.length+' ligne(s) de contenu avec un tiret long ou moyen : '+dashLines.slice(0,3).map(([i,l])=>l.trim().slice(0,60)).join(' | '));
for(const m of fiches.matchAll(/href="#(s\d+|L\d+)"/g)){ const id=m[1]; if(id[0]==='s'&&!SECS.has(id)) errors.push('lien vers une fiche inconnue : #'+id); if(id[0]==='L'&&!longs.find(l=>l.id===id)) errors.push('lien vers une question longue inconnue : #'+id); }
if(warns.length) console.warn('AVERTISSEMENTS :\n  '+warns.slice(0,20).join('\n  '));
if(errors.length){ console.error('ERREURS ('+errors.length+') :\n  '+errors.slice(0,40).join('\n  ')); process.exit(1); }

// ---------- statistiques
const types={}; qbank.concat(moy).forEach(q=>types[q.t]=(types[q.t]||0)+1);
console.log('Questions :',qbank.length+moy.length+longs.length,'=',JSON.stringify(types),'+ longues',longs.length);
const perS={}; qbank.forEach(q=>perS[q.s]=(perS[q.s]||0)+1); console.log('Par fiche :',Object.keys(perS).sort((a,b)=>+a.slice(1)-+b.slice(1)).map(s=>s+':'+perS[s]).join(' '));

// ---------- assemblage
const head=P('a-head.html');
const bankJs='\nconst BANK = '+JSON.stringify(qbank.concat(moy))+';\nconst LONGS = '+JSON.stringify(longs)+';\n'+P('d1-core.js')+'\n';
let body=[P('b0-topbar.html'),P('f-express.html'),fiches,P('c-views.html'),'<script>',bankJs,P('e-app.js'),'</script>',''].join('\n');
body=body.split('<!--ROSE-->').join(roseBig()).split('<!--ROSE_SMALL-->').join(roseSmall());
const frag=head+'\n'+body;
fs.writeFileSync(p.join(__dirname,'portulan-hxv2.html'),frag);
fs.mkdirSync(p.join(__dirname,'docs'),{recursive:true});
const full='<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="robots" content="noindex">\n'+head+'\n</head>\n<body>\n'+body+'</body>\n</html>\n';
fs.writeFileSync(p.join(__dirname,'docs','index.html'),full);
console.log('portulan-hxv2.html :',(frag.length/1024).toFixed(0),'Ko ; docs/index.html écrit');
