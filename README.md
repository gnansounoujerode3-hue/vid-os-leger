# Montage vidéo — guide de démarrage

Le dossier [`montage-video/`](montage-video/) contient le kit de montage fourni dans l’archive : moteur Remotion, transcription locale avec Whisper, détection des silences, sous-titres et effets, storyboard de validation, puis export MP4. Les originaux ne sont pas modifiés.

## Pour monter tes vidéos brutes

1. Il faut **Node.js 20 ou plus**. Dans un terminal, depuis ce dépôt, crée ton espace de travail :
   ```bash
   node montage-video/creer-espace.mjs .
   ```
   Cela crée `Video/` ici, avec `1-rushs/`, `2-scripts/`, `3-assets/` et `4-videos-montees/`.
2. Dépose ta vidéo originale (`.mp4` ou `.mov`) dans `Video/1-rushs/`. Un script ou des logos/captures peuvent être ajoutés aux dossiers correspondants.
3. Installe le moteur (première utilisation, téléchargement de dépendances et du modèle de transcription) :
   ```bash
   cd Video/_moteur
   node outils/installer.mjs
   ```
4. Choisis tes préférences dans `Video/_moteur/style.json` (formats, sous-titres, coupes et effets), puis prépare le fichier :
   ```bash
   node outils/preparer.mjs "../1-rushs/NOM_DU_FICHIER.mp4"
   ```
   Le programme affiche le nom du projet créé. Consulte sa transcription et son `montage.json`, ajuste les textes/effets si besoin, puis vérifie et exporte :
   ```bash
   node outils/verifier.mjs NOM_DU_PROJET
   node outils/rendu.mjs NOM_DU_PROJET --apercu
   node outils/rendu.mjs NOM_DU_PROJET
   ```
   Le MP4 final est dans `Video/4-videos-montees/`.

Pour les options et les étapes de validation, voir [`montage-video/SKILL.md`](montage-video/SKILL.md), [`montage-video/references/effets.md`](montage-video/references/effets.md) et [`montage-video/references/depannage.md`](montage-video/references/depannage.md).

**Pour que je prépare concrètement ton premier montage :** joins ici la vidéo brute (ou indique son chemin si elle est accessible dans l’espace de travail). Dis aussi le format de sortie souhaité — vertical TikTok/Reel/Short, horizontal YouTube, ou autre — et le style recherché. Le kit est prêt, mais l’archive ne contient pas tes vidéos brutes.
