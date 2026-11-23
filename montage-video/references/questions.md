# Les 8 questions de style

Deux appels de 4 questions. Avec AskUserQuestion, le `header` fait 12 caractères au plus, chaque question a 2 à 4 options, et l'option recommandée vient en premier. La personne peut toujours répondre autre chose (« Autre ») : prends sa réponse telle quelle et traduis-la dans le style.

## Premier appel

**1. Format** (header `Format`) : « Où tu publies tes vidéos ? »
- `Vertical 9:16 (Recommandé)` : Reels, TikTok, YouTube Shorts.
- `Horizontal 16:9` : YouTube, LinkedIn en paysage.
- `Carré 1:1` : fil Instagram, LinkedIn.

**2. Sous-titres** (header `Sous-titres`) : « Quel style de sous-titres ? » Mets ces aperçus dans le champ `preview` des options :
- `Mot surligné (Recommandé)` : 3 mots à la fois, le mot dit posé sur une boîte de ta couleur.
  ```
  ┌──────────────────────────┐
  │                          │
  │          (toi)           │
  │                          │
  │   tu vois ▐ÇA▌ ici       │
  │                          │
  └──────────────────────────┘
  ```
- `Karaoké géant` : gros mots en majuscules, le mot dit dans ta couleur.
  ```
  ┌──────────────────────────┐
  │                          │
  │          (toi)           │
  │                          │
  │      TU VOIS *ÇA*        │
  │                          │
  └──────────────────────────┘
  ```
- `Phrase simple` : une phrase sur un bandeau sombre, en bas. Sobre.
  ```
  ┌──────────────────────────┐
  │                          │
  │          (toi)           │
  │                          │
  │                          │
  │ ▓ tu vois ça ici, en bas ▓│
  └──────────────────────────┘
  ```
- `Aucun` : pas de sous-titres.

**3. Couleur** (header `Couleur`) : « Ta couleur principale ? Elle sert aux sous-titres, chiffres, icônes et listes. »
- `Jaune` : `#FFD400`
- `Vert` : `#22C55E`
- `Rouge` : `#EF4444`
- `Bleu` : `#3B82F6`

Une autre couleur (un nom ou un code comme `#FF6A00`) : prends-la. Un nom (« violet », « orange », « la couleur de ma marque ») : choisis un code vif et lisible sur une vidéo.

**4. Rythme** (header `Coupes`) : « Quel rythme pour les coupes ? »
- `Naturel (Recommandé)` : coupe les blancs de plus de 0,6 s, garde les respirations.
- `Dynamique` : coupe presque tous les blancs. Rythme serré, style TikTok.
- `Aucune coupe` : la vidéo telle que tu l'as filmée.

## Deuxième appel

**5. Zooms** (header `Zooms`) : « Quels mouvements de caméra ? »
- `Cycle régulier (Recommandé)` : un zoom avant tenu 4 s, puis un plan large de 10 à 16 s, tout au long de la vidéo.
- `À chaque coupe` : alterne plan normal et plan serré à chaque coupe.
- `Phrases fortes` : un zoom seulement sur les moments forts, que je choisis.
- `Aucun zoom`

**6. Effets** (header `Effets`, `multiSelect: true`) : « Quels effets graphiques ? Coche tout ce que tu veux. »
- `Chiffres animés` : quand tu dis un chiffre, il s'affiche et compte jusqu'à sa valeur.
- `Icônes` : une icône surgit sur un mot concret (argent, temps, danger...).
- `Listes` : tes conseils en checklist qui se coche au fil de ta voix.
- `Images et logos` : tes captures d'écran, et le logo des outils que tu cites.

**7. Son** (header `Son`) : « Et pour le son ? »
- `Bruitages (Recommandé)` : un petit son discret sur chaque effet.
- `Bruitages + musique` : les bruitages, et ta musique douce sous ta voix.
- `Musique seulement` : une musique douce sous ta voix.
- `Voix seule` : rien d'autre que ta voix.

La musique vient de `3-assets/musique/` : rappelle à la personne d'y déposer un morceau libre de droits si elle choisit la musique.

**8. Look** (header `Look`) : « Quel look pour l'image ? »
- `Naturel (Recommandé)` : l'image telle quelle.
- `Moody` : contraste doux, couleurs adoucies, bords sombres. Ambiance cinéma.
- `Chaud` : tons dorés, ensoleillés.
- `Noir et blanc`

## Écrire le style

### `_moteur/style.json`

```json
{
  "format": "vertical",
  "sousTitres": { "mode": "boite", "position": 0.62, "police": "Montserrat", "maxMots": 3, "majuscules": false },
  "couleur": "#FFD400",
  "texteSurCouleur": "#111111",
  "coupes": "naturel",
  "zooms": "cycle",
  "effets": ["chiffres", "icones", "listes", "images"],
  "sons": "bruitages",
  "look": "naturel"
}
```

| Réponse | Champ | Valeur |
|---|---|---|
| Vertical / Horizontal / Carré | `format` | `vertical` / `horizontal` / `carre` |
| Mot surligné | `sousTitres` | `mode: "boite"`, `police: "Montserrat"`, `maxMots: 3`, `majuscules: false` |
| Karaoké géant | `sousTitres` | `mode: "karaoke"`, `police: "Montserrat"`, `maxMots: 2`, `majuscules: true` |
| Phrase simple | `sousTitres` | `mode: "phrase"`, `police: "Inter"`, `maxMots: 7`, `majuscules: false` |
| Aucun | `sousTitres` | `mode: "aucun"` (garde les autres champs) |
| Couleur | `couleur` | le code hex |
| Naturel / Dynamique / Aucune coupe | `coupes` | `naturel` / `dynamique` / `aucune` |
| Cycle / À chaque coupe / Phrases fortes / Aucun | `zooms` | `cycle` / `coupes` / `mots` / `aucun` |
| Effets cochés | `effets` | `chiffres`, `icones`, `listes`, `images` (rien de coché : `[]`) |
| Bruitages / + musique / Musique / Voix seule | `sons` | `bruitages` / `bruitages+musique` / `musique` / `aucun` |
| Naturel / Moody / Chaud / Noir et blanc | `look` | `naturel` / `moody` / `chaud` / `noir-blanc` |

**`position`** (centre de la ligne de sous-titres, en fraction de la hauteur) :

| Format | boite | karaoke | phrase |
|---|---|---|---|
| vertical | 0.62 | 0.60 | 0.80 |
| horizontal | 0.84 | 0.82 | 0.88 |
| carre | 0.74 | 0.72 | 0.86 |

**`texteSurCouleur`** : `#111111` sur une couleur claire (jaune, vert clair, orange, cyan, rose clair), `#FFFFFF` sur une couleur foncée (rouge, bleu, violet, vert foncé). Règle : luminance perçue `0.299 R + 0.587 G + 0.114 B` au-dessus de 150 (sur 255) donne `#111111`.

**`police`** : la personne peut en demander une autre parmi `Montserrat`, `Inter`, `Poppins`, `Bebas Neue` (très haute et serrée, belle en karaoké).

### `MON-STYLE.md` (à la racine de l'espace)

Pour la personne, en clair :

```markdown
# Mon style de montage

- Format : vertical 9:16 (Reels, TikTok, Shorts)
- Sous-titres : mot surligné, 3 mots à la fois
- Couleur : jaune #FFD400
- Coupes : naturelles, les respirations restent
- Zooms : cycle régulier
- Effets : chiffres animés, icônes, listes, images et logos
- Son : bruitages discrets
- Look : naturel

Titre d'accroche : proposé dans le storyboard de chaque vidéo.

Pour changer : dis-le simplement à Claude (« passe les sous-titres en vert »).
```

Si la personne refuse le titre d'accroche, écris « Titre d'accroche : non. » et ne le propose plus.
