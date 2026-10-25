const {execSync}=require('child_process');const fs=require('fs');const path=require('path');
const dir=process.argv[2];
function dec(s){return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');}
function paraText(xml){ // split on paragraphs
  return xml.split(/<\/a:p>|<\/w:p>/).map(p=>{
    let t='';const re=/<(a:t|w:t)(?:\s[^>]*)?>([^<]*)<\/\1>|<w:tab\/>|<a:br\/>|<w:br\/>/g;let m;
    while((m=re.exec(p))){ if(m[2]!==undefined) t+=m[2]; else t+=' ';}
    return dec(t);
  }).filter(x=>x.trim()).join('\n');
}
for(const f of fs.readdirSync(dir)){
  const fp=path.join(dir,f);let out='';
  if(f.endsWith('.docx')){
    const xml=execSync(`unzip -p "${fp}" word/document.xml`,{maxBuffer:1e8}).toString('utf8');
    // tables: mark cells
    const x2=xml.replace(/<\/w:tc>/g,' | </w:tc>').replace(/<\/w:tr>/g,'</w:tr>');
    out=paraText(x2);
    const media=execSync(`unzip -l "${fp}"`).toString().split('\n').filter(l=>/media\//.test(l)).map(l=>l.trim().split(/\s+/).pop());
    if(media.length) out+='\n[MEDIA: '+media.join(', ')+']';
  } else if(f.endsWith('.pptx')){
    const list=execSync(`unzip -l "${fp}"`).toString().split('\n').map(l=>l.trim().split(/\s+/).pop()).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n));
    list.sort((a,b)=>+a.match(/\d+/)[0]-+b.match(/\d+/)[0]);
    for(const s of list){
      const xml=execSync(`unzip -p "${fp}" ${s}`,{maxBuffer:1e8}).toString('utf8');
      const n=s.match(/\d+/)[0];
      const pics=(xml.match(/<p:pic>/g)||[]).length;
      const ch=(xml.match(/<c:chart/g)||[]).length+(xml.match(/graphicData uri="[^"]*chart/g)||[]).length;
      let notes='';
      try{const rel=execSync(`unzip -p "${fp}" ppt/slides/_rels/slide${n}.xml.rels`).toString();const nm=rel.match(/notesSlides\/(notesSlide\d+\.xml)/);if(nm){const nx=execSync(`unzip -p "${fp}" ppt/notesSlides/${nm[1]}`).toString('utf8');notes=paraText(nx).replace(/^\d+$/m,'').trim();}}catch(e){}
      out+=`\n===== DIAPO ${n}${pics?` [${pics} image(s)]`:''}${ch?` [graphique]`:''} =====\n`+paraText(xml)+(notes?`\n--- notes: ${notes}`:'')+'\n';
    }
  } else continue;
  fs.writeFileSync(path.join(dir,'..','txt',f.replace(/\.\w+$/,'.txt')),out);
  console.log(f, out.length);
}
