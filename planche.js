// node planche.js <deck> <n1,n2,...> <sortie-prefixe>  -> planches 2x2 (1920x1080) dans img/planches/
const {execSync}=require('child_process'),fs=require('fs'),p=require('path');
const [deck,list,pref]=process.argv.slice(2);
const nums=list.split(',').map(Number);
const dir=p.join(__dirname,'img','planches');fs.mkdirSync(dir,{recursive:true});
for(let i=0;i<nums.length;i+=4){
  const g=nums.slice(i,i+4);while(g.length<4)g.push(null);
  const inputs=g.map(n=>n?`-i "${p.join(__dirname,'img',deck,String(n).padStart(2,'0')+'.png')}"`:`-f lavfi -i color=white:s=960x540:d=1`).join(' ');
  const lbl=g.map((n,k)=>`[${k}:v]scale=960:540,drawbox=x=0:y=0:w=70:h=34:color=black@0.8:t=fill,drawtext=text='${n||''}':x=8:y=4:fontsize=26:fontcolor=yellow:fontfile='C\\:/Windows/Fonts/arial.ttf'[v${k}]`).join(';');
  const out=p.join(dir,`${pref}-${String(i/4+1).padStart(2,'0')}.png`);
  execSync(`ffmpeg -y -loglevel error ${inputs} -filter_complex "${lbl};[v0][v1][v2][v3]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0" -frames:v 1 "${out}"`);
  console.log(out);
}
