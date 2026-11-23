# Dépannage

Lis le message d'erreur en entier avant de chercher ici. Répare ce que tu peux réparer toi-même ; ne renvoie vers la personne que ce qu'elle seule peut faire (cliquer sur « Installer », déposer un fichier).

## Installation

| Symptôme | Cause | Remède |
|---|---|---|
| `node: command not found` | Node absent | Mac : `brew install node` ou https://nodejs.org (LTS). Windows : `winget install OpenJS.NodeJS.LTS`. Puis relancer Claude |
| « Node … est trop ancien » | Node < 20 | Même remède : installer la version LTS |
| code 3, « outils de développement d'Apple » | Mac sans Xcode Command Line Tools | La personne lance `xcode-select --install`, clique « Installer », attend la fin, puis tu relances l'installation |
| « Le dossier … whisper.cpp existe mais il est incomplet » | compilation interrompue | supprime `_moteur/whisper.cpp` et relance `node outils/installer.mjs` |
| `make` échoue sur Linux | compilateur absent | `sudo apt install build-essential git` (la personne tape son mot de passe), puis relance |
| téléchargement du modèle coupé | connexion | supprime le fichier `_moteur/whisper.cpp/ggml-*.bin` incomplet, relance |
| peu de place disque ou ordinateur lent | modèle de 1,6 Go | `node outils/installer.mjs --modele small` (480 Mo) |
| `npm install` échoue | réseau, proxy, droits | relance une fois ; sinon montre les 10 dernières lignes à la personne |

## Préparation

Pour relancer `preparer.mjs` sur un projet qui existe, ajoute toujours `--nom <projet>` (sinon un nouveau projet daté du jour est créé). `--force` efface les effets de `montage.json` : à faire avant de les écrire, jamais après. `--recouper` garde les effets.

| Symptôme | Cause | Remède |
|---|---|---|
| « style.json manque » | questions de style pas posées | étape 2 du skill |
| « Ce fichier n'a pas de son » | vidéo muette | rien à transcrire : monte sans sous-titres (`"mots": []`) ou demande la bonne vidéo |
| transcription dans la mauvaise langue | la détection s'est trompée (début muet, musique) | relance avec `--langue fr` (ou `en`, `es`, `ar`...) et `--force` |
| noms propres mal écrits | Whisper ne les connaît pas | `--prompt "Nom1, Nom2, Marque"` et `--force`, ou corrige `t` dans `mots` |
| des mots répétés en boucle, un texte inventé sur un passage muet | défaut connu de Whisper sur les longs silences | retire ces mots de `mots` (seulement eux) |
| presque rien n'est coupé alors qu'il y a des blancs | fond bruyant (ventilateur, rue) | `--seuil -30` puis `--recouper` (le seuil réel suit le niveau de la voix ; `preparer.mjs` l'affiche) |
| des mots tout bas sont coupés | voix faible par moments | `--seuil -40` puis `--recouper` |
| copie très lente | rush 4K long | normal : la copie réduit l'image une fois pour toutes. Lance en arrière-plan |

## Rendu

| Symptôme | Cause | Remède |
|---|---|---|
| ERREUR « fichier introuvable » | image, logo ou musique absente de `3-assets/` | demande le fichier, ou retire l'effet |
| ERREUR « icône inconnue » | nom Lucide faux | prends un nom de la table de `effets.md` ou de https://lucide.dev/icons |
| les polices ne s'affichent pas, rendu bloqué sur `delayRender` | pas de connexion (polices Google) | vérifie la connexion, relance |
| image noire ou figée par moments | rush à cadence variable mal copié | relance `preparer.mjs` avec `--force` |
| son qui claque à une coupe | coupe sur une syllabe | décale le bord du segment de 0,05 à 0,1 s vers le blanc |
| sous-titres en avance ou en retard | rare, sur un début de rush muet | décale tous les `mots` du même écart (petit script Node), sans en changer le texte |
| rendu très lent | ordinateur ancien | normal ; la vidéo sort quand même. Ferme les autres applis |

## Remotion

Remotion est gratuit pour une personne seule et pour les entreprises de 3 personnes ou moins. Au-delà, une licence entreprise est demandée : https://remotion.dev/license
