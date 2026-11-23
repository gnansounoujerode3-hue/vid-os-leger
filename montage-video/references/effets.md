# montage.json et les effets

`montage.json` est dans `_moteur/projets/<projet>/`. `preparer.mjs` l'écrit ; toi, tu le complètes. **Tous les temps sont en secondes du rush**, comme dans `transcription.txt` (`01:12.4` s'écrit `72.4`). Le moteur recale tout seul après les coupes : un effet placé sur un mot tombe sur ce mot dans la vidéo montée.

## Les champs

| Champ | Ce que c'est | Tu y touches ? |
|---|---|---|
| `fps`, `rush`, `dureeRushS` | la copie propre du rush | non |
| `cadrage` | `{ "x": 50, "y": 40 }` : le point gardé au centre quand le rush n'a pas le format de sortie (en %). Visage trop haut et coupé : baisse `y` (30). Personne à gauche du cadre : baisse `x` | si l'aperçu montre un visage mal cadré |
| `segments` | les parties gardées, dans l'ordre : `[[0.42, 5.1], [5.8, 12.3]]`. Retirer un passage = couper un segment en deux autour de lui | oui, pour les prises ratées |
| `mots` | `{ "t": "Bonjour", "debut": 0.42, "fin": 0.8 }` : les sous-titres | seulement le texte `t`, jamais les temps |
| `style` | une copie du style au moment de la préparation | si la personne change le style de cette vidéo |
| `effets` | la liste des effets, ci-dessous | oui |
| `musique` | `{ "fichier": "musique/fond.mp3", "volume": 0.08 }` ou `null` | si la personne veut une autre musique |

## Les effets

Chaque effet a `type` et `debut` (secondes du rush). Champs communs, tous facultatifs :
- `fin` : la fin, en secondes du rush. Sans `fin`, chaque effet a sa durée par défaut.
- `son` : `null` pour aucun son, ou le nom d'un son pour remplacer le son par défaut.
- `y` : la hauteur dans l'image, de 0 (en haut) à 1 (en bas). Le centre pour titre, chiffre, logo et icône ; le bord haut pour liste et image. Sert à libérer le visage.

Place `debut` **sur le mot** qui déclenche l'effet (son temps dans `transcription.txt` ou dans `mots`).

### titre : l'accroche des premières secondes
```json
{ "type": "titre", "debut": 0.3, "texte": "Ta banque te ment" }
```
En haut, en majuscules, mot par mot, avec un trait de ta couleur. 2,5 s. Son : `impact`. 6 mots au plus.

### chiffre : un chiffre que la personne dit (style : « chiffres »)
```json
{ "type": "chiffre", "debut": 14.2, "valeur": 42, "suffixe": " %", "legende": "des salariés utilisent déjà l'IA" }
```
Compte de 0 à la valeur en 1 s, puis grossit un peu. Champs : `valeur` (nombre), `decimales` (`14.9` → `1`), `prefixe` (`"+"` pour « plus de », `"$"`), `suffixe` (`" %"`, `" €"`, `" M"`, `" h"`), `legende` (ce que mesure le chiffre, avec les mots de la personne, 8 mots au plus ; si sa phrase ne dit pas ce qu'il mesure, reprends ses mots tels quels sans rien ajouter). 2,6 s. Sons : `pop`, puis `ding` à l'arrivée. Écris « 3 millions » `"valeur": 3, "suffixe": " millions"`.

### icone : une icône sur un mot concret (style : « icones »)
```json
{ "type": "icone", "debut": 21.0, "icone": "wallet" }
```
Un rond sombre cerclé de ta couleur, sous les sous-titres. 1,5 s. Son : `pop`. Noms des icônes Lucide (https://lucide.dev/icons), en minuscules avec des tirets. Des noms sûrs :

| Idée | Icône |
|---|---|
| argent, salaire | `wallet`, `banknote`, `piggy-bank`, `euro`, `dollar-sign` |
| temps, délai | `clock`, `hourglass`, `calendar` |
| danger, arnaque | `triangle-alert`, `shield-alert`, `skull`, `siren` |
| sécurité | `shield-check`, `lock`, `key-round` |
| téléphone, appli | `smartphone`, `app-window`, `bell` |
| travail | `briefcase`, `laptop`, `building` |
| idée, conseil | `lightbulb`, `sparkles`, `target` |
| croissance, baisse | `trending-up`, `trending-down`, `chart-line` |
| personne, groupe | `user`, `users`, `baby` |
| santé | `heart-pulse`, `stethoscope`, `brain` |
| monde, pays | `globe`, `map-pin`, `plane` |
| IA, robot | `bot`, `cpu`, `sparkles` |
| oui, non | `circle-check`, `circle-x`, `thumbs-up`, `thumbs-down` |
| message, mail | `message-circle`, `mail`, `send` |
| maison, voiture | `house`, `car`, `shopping-cart` |

`verifier.mjs` refuse un nom qui n'existe pas.

### liste : des conseils ou des éléments en checklist (style : « listes »)
```json
{ "type": "liste", "debut": 30.1, "titre": "3 réglages", "items": [
  { "texte": "Coupe la localisation", "coche": 31.4 },
  { "texte": "Active la double sécurité", "coche": 34.0 },
  { "texte": "Change ton code", "coche": 36.8 }
] }
```
Une carte sombre en haut. Chaque élément s'écrit puis se coche à son `coche` (le temps de son mot clé, dans le rush). La carte reste 1,5 s après la dernière coche (ou jusqu'à `fin`). `titre` seulement si la personne nomme la liste. Éléments courts (5 mots), avec les mots de la personne. 5 éléments au plus. Sons : `tap` à l'arrivée, `click` à chaque coche.

### image : une capture d'écran ou une photo (style : « images »)
```json
{ "type": "image", "debut": 44.5, "fin": 48.0, "fichier": "images/capture-banque.png" }
```
En haut, coins arrondis, ombre douce. 3 s par défaut. Son : `woosh`. `fichier` est le chemin dans `3-assets/` (le vérificateur le copie dans le projet). `hauteur` (fraction de l'image, 0.3 par défaut en vertical) pour la réduire si elle cache le visage. Seulement des fichiers que la personne a donnés.

### logo : le logo d'un outil ou d'une marque citée (style : « images »)
```json
{ "type": "logo", "debut": 52.2, "fichier": "logos/chatgpt.png", "nom": "ChatGPT" }
```
Le logo arrive, puis son nom glisse à côté. 2,2 s. Sons : `pop`, puis `swipe`. Fichier dans `3-assets/logos/`. Un logo qui manque : demande-le à la personne (PNG, fond transparent si possible), ou propose de le chercher sur le site officiel de la marque.

### zoom : un zoom sur une phrase forte (style : zooms « mots », ou en plus d'un autre réglage)
```json
{ "type": "zoom", "debut": 60.0, "fin": 63.5, "force": 0.2 }
```
Zoom avant rapide, tenu, puis zoom arrière. `force` : 0.1 léger, 0.2 net (par défaut), 0.3 fort. Pas de son par défaut. Avec le style « mots » : un zoom sur une phrase forte (un chiffre qui frappe, une révélation, une chute), tenu 2 à 4 s, et au plus un zoom toutes les 15 secondes. Avec le style « cycle », le moteur place les zooms tout seul : n'en ajoute pas. Avec « coupes », le plan alterne tout seul à chaque coupe.

## Les sons fournis

`woosh`, `swipe`, `pop`, `tap`, `click`, `ding`, `riser`, `impact`. Fabriqués en code, libres de droits, réglés sous une voix à -14 LUFS. Un son à la personne : un fichier dans `3-assets/sons/` (`.wav` ou `.mp3`), appelé par son nom sans extension, ou avec l'extension pour un `.mp3` (`"son": "boom.mp3"`). Avec le style `musique` ou `aucun`, les bruitages restent muets.

## Les places dans l'image

Les pourcentages se comptent depuis le haut de l'image (0 % en haut, 100 % en bas).

| | vertical | horizontal | carré |
|---|---|---|---|
| liste, image (bord haut) | 7,5 % | 7 % | 6 % |
| chiffre (centre) | 16 % | 20 % | 16 % |
| titre, logo (centre) | 17 % | 16 % | 15 % |
| icône (centre) | 76 %, ou au-dessus des sous-titres quand ils sont en bas | 62 % | 66 % |

En vertical, la tête est souvent entre 20 % et 45 % de la hauteur : une image haute peut la toucher. L'aperçu le montre, `y` et `hauteur` le règlent.

## Exemple complet d'effets

```json
"effets": [
  { "type": "titre", "debut": 0.2, "texte": "L'arnaque du faux conseiller" },
  { "type": "chiffre", "debut": 6.8, "valeur": 382, "suffixe": " M€", "legende": "volés en 2024 par ce procédé" },
  { "type": "icone", "debut": 15.3, "icone": "smartphone" },
  { "type": "image", "debut": 22.0, "fin": 26.5, "fichier": "images/sms.png" },
  { "type": "liste", "debut": 34.0, "items": [
    { "texte": "Raccroche", "coche": 35.1 },
    { "texte": "Rappelle ta banque toi-même", "coche": 37.9 },
    { "texte": "Ne donne jamais un code", "coche": 41.2 }
  ] }
]
```
