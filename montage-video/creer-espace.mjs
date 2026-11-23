// Crée l'espace de montage : le dossier Video et tout ce qu'il contient.
// Usage : node creer-espace.mjs "<dossier où le créer>" [--nom Video] [--mettre-a-jour]
//   --mettre-a-jour : remet le moteur à neuf dans un espace qui existe déjà,
//                     sans toucher aux rushs, aux projets, au style ni aux installations.
import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k) => {
  const i = argv.indexOf(`--${k}`);
  return i === -1 ? undefined : argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true;
};
// Par défaut : le Bureau (sur Windows, il est parfois dans OneDrive).
const bureau = [path.join(os.homedir(), "Desktop"), path.join(os.homedir(), "OneDrive", "Desktop"), path.join(os.homedir(), "OneDrive", "Bureau")].find(
  (d) => existsSync(d),
) ?? os.homedir();
const parent = path.resolve(argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--nom") ?? bureau);
const nom = typeof opt("nom") === "string" ? opt("nom") : "Video";
const espace = path.join(parent, nom);
const moteur = path.join(espace, "_moteur");
const VERSION = "1.0.0";

const copierMoteur = () => {
  for (const f of readdirSync(path.join(ICI, "moteur"))) {
    if (f === "node_modules") continue;
    cpSync(path.join(ICI, "moteur", f), path.join(moteur, f), { recursive: true, force: true });
  }
};

if (existsSync(path.join(moteur, "outils", "preparer.mjs"))) {
  if (opt("mettre-a-jour")) {
    copierMoteur();
    writeFileSync(path.join(espace, ".montage-video"), JSON.stringify({ version: VERSION }) + "\n");
    console.log(`MIS À JOUR : ${espace}`);
  } else {
    console.log(`EXISTE DÉJÀ : ${espace}`);
  }
  process.exit(0);
}

for (const d of [
  "1-rushs",
  "2-scripts",
  "3-assets/images",
  "3-assets/logos",
  "3-assets/musique",
  "3-assets/sons",
  "4-videos-montees",
  "_moteur/projets",
]) {
  mkdirSync(path.join(espace, d), { recursive: true });
}
copierMoteur();
writeFileSync(path.join(espace, ".montage-video"), JSON.stringify({ version: VERSION }) + "\n");

writeFileSync(
  path.join(espace, "LISEZ-MOI.txt"),
  `TON ESPACE DE MONTAGE
=====================

1-rushs/            Dépose ici tes vidéos brutes (iPhone, Android, caméra : .mov, .mp4).
2-scripts/          Optionnel : le texte de ta vidéo. Les sous-titres prendront son orthographe.
3-assets/images/    Captures d'écran et photos à montrer dans la vidéo.
3-assets/logos/     Logos des outils ou marques que tu cites (PNG, fond transparent si possible).
3-assets/musique/   Ta musique de fond (libre de droits).
3-assets/sons/      Tes bruitages. Sinon, ceux fournis sont utilisés.
4-videos-montees/   Les vidéos finies arrivent ici.
MON-STYLE.md        Tes choix de montage. Tu peux les changer quand tu veux : dis-le à Claude.
_moteur/            Le moteur de montage. Ne pas toucher.

COMMENT MONTER UNE VIDÉO
1. Mets ton rush dans 1-rushs/.
2. Dans Claude, écris : « monte ma vidéo ».
3. Claude ouvre ton storyboard dans le navigateur : une image par moment clé.
   Écris à côté de chaque image ce que tu veux changer, puis clique sur le bouton.
4. La vidéo finie arrive dans 4-videos-montees/.

Skill offert par Bariq Rifki (@bariqrifki).
`,
  "utf-8",
);

console.log(`CRÉÉ : ${espace}`);
