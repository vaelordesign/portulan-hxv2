# Portulan Intra 2 : fiches, questions longues, quiz et examen blanc (histoire, 330-HXV-AG)

Fait le 25 octobre 2026 pour l'Intra 2 du cours *Histoire du monde depuis le XVe siècle* (Charles Dorval),
semaine 9 du plan de cours, 20 % de la note.

Sources (dans `sources/`) : les notes du prof retranscrites par Julien (`Histoire-Intra-2-notes.docx`) et les
PowerPoint des séances 9 (*L'État moderne européen et colonisation*, 50 diapos) et 10 (*L'esclavage*, 36 diapos),
lues une à une, images comprises (planches dans `img/planches/`). Tout est consigné dans `txt/MATIERE.md`.

## Ouvrir
- **En ligne, sans compte** : https://vaelordesign.github.io/portulan-hxv2/ (dépôt public `vaelordesign/portulan-hxv2`,
  GitHub Pages servi depuis `docs/`, page en noindex). Mis en ligne à la demande de Julien le 25 oct. 2026.
  `sources/`, `txt/` et `img/` (notes, diapos du prof) restent hors du dépôt (`.gitignore`).
- Artifact (privé) : https://claude.ai/artifact/WqAKv4fE2QnbcrHo6KnsW2
- Hors ligne : `docs/index.html`, copie dans `Grasset Session 1\Histoire\Portulan-Intra-2.html`.
- Progression dans le navigateur (localStorage, clés `portulan-hxv2` et `portulan-hxv2-draft`).

## Format de l'examen (dit par Julien)
Questions courtes (un mot à une phrase), moyennes (100 à 200 mots), une mi-longue (environ 500 mots) qui compte
beaucoup. Compréhension et liens, pas de par cœur. Une autre classe a eu « mondialisation et État moderne »;
Julien prédit « mondialisation et esclavage transatlantique » (dernière diapo de la séance 10 : « La traite
atlantique, nœud de la mondialisation »). Barème de l'examen blanc estimé : 10 × 0,5 + 2 × 3 + 9 = 20.

## Contenu
- 20 fiches (`parts/b1` à `b4-fiches.html`), dont la grille des 5 dimensions et les 7 fils rouges (fiche 2).
- 6 questions longues avec plan, réponse modèle (470 à 580 mots) et barème sur 9 : `parts/longues.json`.
- 28 questions moyennes avec réponse modèle et barème sur 3 : `parts/moy/*.json` (2 sous-agents).
- 287 qcm, vrai ou faux, réponses courtes et « une phrase » : `parts/bank/*.json` (4 sous-agents).
- Moteur `parts/e-app.js` (repris du Portulan de l'Intra 1, `confirm()` remplacé par une boîte dans la page,
  barème « Non / À moitié / Oui » par critère, compteur de mots).

## Modifier
`node build.js` vérifie la banque (ids, fiches, barèmes 3 et 9, liens #sN et #LN, aucun tiret long) puis écrit
`portulan-hxv2.html` (fragment Artifact) et `docs/index.html`. Test local : `node serve.js` (port 8773, config
`portulan2` dans `Typing\.claude\launch.json`). Après une modification : `node build.js`, puis `git add -A`, `git commit`, `git push` (Pages se redéploie seul), et republier `portulan-hxv2.html` pour garder l'Artifact à jour : ce sont deux copies.

## Points d'attention (vérifiés par les sous-agents)
- Notes : bourgeoisie « majorité » → minorité; « Gridle » = criollo; Philippines 1521 = arrivée de Magellan.
- Les chiffres Slave Voyages de la diapo totalisent 9,9 M; les 15 % de morts supposent environ 12,5 M (signalé).
- Néerlandais en Asie : notes = colonies d'exploitation, avec des réflexes de comptoir (piège signalé).
- Nouvelle-Amsterdam fondée par la Compagnie des Indes occidentales, pas la VOC; Plymouth = « Pèlerins ».
- Code noir : lancé par Colbert (mort en 1683), promulgué en 1685.
