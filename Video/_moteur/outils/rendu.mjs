// Rendu d'un projet.
//   node outils/rendu.mjs <projet> --apercu   images fixes des moments clés, dans <projet>/apercu/
//                                            (+ apercu.json, que lit outils/storyboard.mjs)
//   node outils/rendu.mjs <projet>            la vidéo finie, dans 4-videos-montees/
//   node outils/rendu.mjs <projet> --nom "ma-video-v2"   nom du fichier de sortie
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MOTEUR, SORTIES, args, mmss } from "./lib.mjs";
import { verifier } from "./verifier.mjs";

const { pos, opts } = args(process.argv.slice(2));
const { projet, erreurs, alertes, m } = await verifier(pos[0]);
for (const a of alertes) console.log(`ALERTE  ${a}`);
if (erreurs.length) {
  for (const e of erreurs) console.log(`ERREUR  ${e}`);
  console.log("\nRendu annulé : corrige montage.json puis relance.");
  process.exit(1);
}

const { bundle } = await import("@remotion/bundler");
const { renderMedia, renderStill, selectComposition } = await import("@remotion/renderer");

console.log("Préparation du rendu...");
const serveUrl = await bundle({
  entryPoint: path.join(MOTEUR, "src", "index.ts"),
  publicDir: path.join(projet, "media"),
});
const composition = await selectComposition({ serveUrl, id: "Montage", inputProps: m });
const fps = composition.fps;

// Temps du rush -> image de la vidéo montée (même calcul que src/timeline.ts).
const segs = [];
let out = 0;
for (const [a, b] of m.segments) {
  const s = Math.round(a * fps);
  const e = Math.min(Math.round(m.dureeRushS * fps), Math.round(b * fps));
  if (e - s < 2) continue;
  segs.push({ s, e, o: out });
  out += e - s;
}
const versSortie = (t) => {
  const f = t * fps;
  for (const g of segs) {
    if (f < g.s) return g.o;
    if (f < g.e) return g.o + Math.round(f - g.s);
  }
  return out;
};

const versRush = (f) => {
  for (const g of segs) if (f < g.o + (g.e - g.s)) return (g.s + Math.max(0, f - g.o)) / fps;
  return m.dureeRushS;
};

// Ce que montre un effet, en mots simples, pour le storyboard.
const decrire = (e) => {
  switch (e.type) {
    case "titre":
      return `Titre d'accroche : « ${e.texte} »`;
    case "chiffre":
      return `Chiffre animé : ${e.prefixe ?? ""}${e.valeur}${e.suffixe ?? ""}${e.legende ? ` (${e.legende})` : ""}`;
    case "icone":
      return `Icône : ${e.icone}`;
    case "liste":
      return `Liste${e.titre ? ` « ${e.titre} »` : ""} : ${e.items.map((it) => it.texte).join(", ")}`;
    case "image":
      return `Image : ${path.basename(e.fichier)}`;
    case "logo":
      return `Logo : ${e.nom}`;
    case "zoom":
      return "Zoom sur la phrase";
    default:
      return e.type;
  }
};

// Les mots dits autour d'un instant du rush (ceux qui restent au montage).
const garde = (t) => segs.some((g) => t * fps >= g.s && t * fps < g.e);
const parole = (t) =>
  m.mots
    .filter((w) => w.debut >= t - 1.2 && w.debut <= t + 2.5 && garde((w.debut + w.fin) / 2))
    .map((w) => w.t)
    .join(" ");

if (opts.apercu) {
  const dossier = path.join(projet, "apercu");
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  const dernier = composition.durationInFrames - 1;
  // Le début, puis chaque effet quand il est bien visible, puis la fin.
  // L'image du début seulement si aucun effet ne s'y montre déjà (sinon elle ferait doublon).
  const effetAuDebut = m.effets.some((e) => versSortie(e.debut) < 2 * fps);
  const moments = effetAuDebut ? [] : [{ f: Math.min(20, dernier), nom: "debut", effet: null, quoi: "Début de la vidéo" }];
  m.effets.forEach((e, i) => {
    let f = versSortie(e.debut) + 18;
    if (e.type === "chiffre" || e.type === "titre" || e.type === "zoom") f = versSortie(e.debut) + 45;
    if (e.type === "liste") f = versSortie(Math.max(...e.items.map((it) => it.coche))) + 10;
    moments.push({ f: Math.min(f, dernier), nom: `${String(i + 1).padStart(2, "0")}-${e.type}`, effet: i, quoi: decrire(e) });
  });
  moments.push({ f: Math.max(0, composition.durationInFrames - 15), nom: "fin", effet: null, quoi: "Fin de la vidéo" });
  const resume = [];
  for (const mo of moments.slice(0, 40)) {
    const fichier = `${mo.nom}-${mmss(mo.f / fps).replace(":", "m")}s.jpg`;
    await renderStill({ serveUrl, composition, inputProps: m, frame: Math.max(0, mo.f), output: path.join(dossier, fichier), imageFormat: "jpeg", jpegQuality: 80, scale: 0.5 });
    const rushS = mo.effet === null ? versRush(mo.f) : m.effets[mo.effet].debut;
    resume.push({ fichier, sortieS: +(mo.f / fps).toFixed(2), rushS: +rushS.toFixed(2), effet: mo.effet, quoi: mo.quoi, texte: parole(rushS) });
    console.log(`image : ${path.join(dossier, fichier)}`);
  }
  writeFileSync(
    path.join(dossier, "apercu.json"),
    JSON.stringify(
      {
        projet: path.basename(projet),
        format: m.style.format,
        couleur: m.style.couleur,
        texteSurCouleur: m.style.texteSurCouleur,
        dureeRushS: m.dureeRushS,
        dureeMonteeS: +(composition.durationInFrames / fps).toFixed(2),
        moments: resume,
      },
      null,
      2,
    ),
  );
  console.log(`\nAPERÇU PRÊT : ${resume.length} images dans ${dossier}`);
  process.exit(0);
}

mkdirSync(SORTIES, { recursive: true });
const nom = typeof opts.nom === "string" ? opts.nom : path.basename(projet);
const sortie = path.join(SORTIES, `${nom}.mp4`);
let dernier = -1;
const t0 = Date.now();
console.log(`Rendu de ${mmss(composition.durationInFrames / fps)} de vidéo (${composition.width}x${composition.height})...`);
await renderMedia({
  serveUrl,
  composition,
  inputProps: m,
  codec: "h264",
  crf: 18,
  audioCodec: "aac",
  outputLocation: sortie,
  onProgress: ({ progress }) => {
    const p = Math.floor(progress * 10) * 10;
    if (p !== dernier) {
      dernier = p;
      console.log(`  ${p} %`);
    }
  },
});
console.log(`\nVIDÉO PRÊTE en ${Math.round((Date.now() - t0) / 1000)} s : ${sortie}`);
