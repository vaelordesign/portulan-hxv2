
// ------------------------------------------------------------------
// Banque : groupes et types. Les questions sont dans parts/bank/*.json (qcm, vf, courte, phrase),
// parts/moy/*.json (questions moyennes) et parts/longues.json (questions longues), fusionnés par build.js.
// moy  : q, m = réponse modèle HTML (130-190 mots), crit = [[critère, points]] sur 3, k = mots-clés
// long : titre, q, pourquoi, these, plan = [[titre, [faits]]], m = réponse modèle HTML (environ 500 mots),
//        liens, crit = [[critère, points]] sur 9
// ------------------------------------------------------------------
const GROUPS = [
  {id:'g1', name:'Méthode et mondialisation', s:['s1','s2']},
  {id:'g2', name:'Première mondialisation (suite)', s:['s3','s4','s5','s6']},
  {id:'g3', name:'État moderne', s:['s7','s8']},
  {id:'g4', name:'Société et économie', s:['s9','s10']},
  {id:'g5', name:'Nouvelle vague coloniale', s:['s11','s12']},
  {id:'g6', name:'Esclavage transatlantique', s:['s13','s14','s15','s16','s17']},
  {id:'g7', name:'Synthèse', s:['s18','s19','s20']}
];
const TYPES = {qcm:'Choix multiple', vf:'Vrai ou faux', courte:'Réponse courte', phrase:'Une phrase', moy:'Question moyenne'};
// examen blanc (barème estimé, le prof ne l'a pas donné) : 10 courtes à 0,5 · 2 moyennes sur 3 au choix, à 3 · 1 longue sur 9
const EXAM = {p1:{courte:3, phrase:2, qcm:3, vf:2, pts:0.5}, p2:{offer:3, pick:2, pts:3}, p3:{pts:9}};
