// Prépare un rush pour le montage, en une commande :
//   1. copie propre du rush (H.264, image fixe, son mis à -14 LUFS)
//   2. transcription mot par mot (whisper.cpp, sur l'ordinateur)
//   3. détection des blancs et premières coupes, selon ton style
//   4. un montage.json de départ + transcription.txt lisible
//
// Usage (depuis le dossier _moteur) :
//   node outils/preparer.mjs "../1-rushs/ma video.mov" [--nom mon-projet]
//        [--langue fr] [--prompt "Noms à bien écrire"] [--seuil -35]
//        [--recouper]  refait les coupes (après un changement de rythme), garde les effets
//        [--force]     repart de zéro : nouvelle transcription, montage.json vide
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  ASSETS,
  MOTEUR,
  PROJETS,
  args,
  aujourdhui,
  cheminModele,
  cheminWhisper,
  ecrireJson,
  ff,
  lireJson,
  mmss,
  modeleInstalle,
  slug,
} from "./lib.mjs";
import { writeFileSync } from "node:fs";

const { pos, opts } = args(process.argv.slice(2));
const rushArg = pos[0];
if (!rushArg) {
  console.error('Usage : node outils/preparer.mjs "../1-rushs/ma-video.mov" [--nom mon-projet]');
  process.exit(1);
}
const rush = path.resolve(process.cwd(), rushArg);
if (!existsSync(rush)) {
  console.error(`Rush introuvable : ${rush}`);
  process.exit(1);
}
const fichierStyle = path.join(MOTEUR, "style.json");
if (!existsSync(fichierStyle)) {
  console.error("style.json manque : pose d'abord les questions de style (voir le skill).");
  process.exit(1);
}
const style = lireJson(fichierStyle);
const modele = modeleInstalle();
if (!existsSync(cheminWhisper()) || !existsSync(cheminModele(modele))) {
  console.error("Le moteur n'est pas installé. Lance d'abord : node outils/installer.mjs");
  process.exit(1);
}

const nom = typeof opts.nom === "string" ? slug(opts.nom) : `${aujourdhui()}-${slug(path.basename(rush))}`;
const projet = path.join(PROJETS, nom);
const media = path.join(projet, "media");
// Un projet déjà préparé garde son propre style (celui de son montage.json).
if (existsSync(path.join(projet, "montage.json")) && !opts.force) {
  Object.assign(style, lireJson(path.join(projet, "montage.json")).style);
}
mkdirSync(path.join(media, "sons"), { recursive: true });
console.log(`Projet : ${projet}`);

// --- 1. Copie propre du rush --------------------------------------------
const sonde = JSON.parse(
  ff("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", rush]).stdout,
);
const video = sonde.streams.find((s) => s.codec_type === "video");
const audio = sonde.streams.find((s) => s.codec_type === "audio");
if (!video) throw new Error("Ce fichier n'a pas d'image.");
if (!audio) throw new Error("Ce fichier n'a pas de son : rien à transcrire.");

const rotation = Math.abs(
  Number(video.tags?.rotate ?? video.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? 0),
);
let [w, h] = [video.width, video.height];
if (rotation === 90 || rotation === 270) [w, h] = [h, w];
const [num, den] = String(video.avg_frame_rate || video.r_frame_rate || "30/1").split("/").map(Number);
const fpsSource = den ? num / den : 30;
const fps = Math.abs(fpsSource - 25) < 1 || Math.abs(fpsSource - 50) < 1 ? 25 : Math.abs(fpsSource - 24) < 0.5 ? 24 : 30;

const DIM = { vertical: [1080, 1920], horizontal: [1920, 1080], carre: [1080, 1080] }[style.format] ?? [1080, 1920];
// Assez grand pour couvrir le format de sortie, avec de la marge pour les zooms.
const couvre = Math.max(DIM[0] / w, DIM[1] / h);
const facteur = Math.min(1, couvre * 1.25);
const filtres = facteur < 0.999 ? ["-vf", `scale=trunc(iw*${facteur.toFixed(4)}/2)*2:trunc(ih*${facteur.toFixed(4)}/2)*2`] : [];

// Le son brut, sans aucun réglage : base de la transcription, de la mesure et des blancs.
const wav = path.join(projet, "audio.wav");
if (!existsSync(wav) || opts.force) {
  ff("ffmpeg", ["-hide_banner", "-y", "-i", rush, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav]);
}

// Le niveau de la voix, mesuré une fois (EBU R128) : sert au réglage du son et au seuil des blancs.
const fichierMesure = path.join(projet, "mesure.json");
if (!existsSync(fichierMesure) || opts.force) {
  const { stderr } = ff("ffmpeg", [
    "-hide_banner",
    "-i",
    rush,
    "-vn",
    "-af",
    "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
    "-c:a",
    "pcm_s16le",
    "-f",
    "null",
    "-",
  ]);
  const bloc = stderr.slice(stderr.lastIndexOf("{"), stderr.lastIndexOf("}") + 1);
  ecrireJson(fichierMesure, JSON.parse(bloc));
}
const mesure = lireJson(fichierMesure);
const voixLufs = Number.isFinite(Number(mesure.input_i)) ? Number(mesure.input_i) : -23;

const sortieRush = path.join(media, "rush.mp4");
if (!existsSync(sortieRush) || opts.force) {
  console.log(`Copie propre du rush (${w}x${h}, ${fpsSource.toFixed(2)} i/s -> ${fps} i/s)...`);
  ff("ffmpeg", [
    "-hide_banner",
    "-y",
    "-i",
    rush,
    ...filtres,
    "-r",
    String(fps),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-af",
    // Gain fixe (linear=true) : la voix monte à -14 LUFS sans écraser les blancs.
    `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${mesure.input_i}:measured_TP=${mesure.input_tp}:measured_LRA=${mesure.input_lra}:measured_thresh=${mesure.input_thresh}:offset=${mesure.target_offset}:linear=true`,
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    sortieRush,
  ]);
}
const duree = Number(
  JSON.parse(ff("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", sortieRush]).stdout).format.duration,
);

// --- 2. Transcription mot par mot ----------------------------------------
const fichierMots = path.join(projet, "mots.json");
const baseWhisper = path.join(projet, "whisper");
let langue = typeof opts.langue === "string" ? opts.langue : style.langue ?? "auto";
if (!existsSync(fichierMots) || opts.force) {
  console.log(`Transcription (${modele})... une minute de vidéo prend environ 15 secondes sur un ordinateur récent.`);
  const wargs = ["-m", cheminModele(modele), "-f", wav, "-l", langue, "-ml", "1", "-sow", "-oj", "-ojf", "-of", baseWhisper, "-np"];
  if (typeof opts.prompt === "string") wargs.push("--prompt", opts.prompt);
  const r = spawnSync(cheminWhisper(), wargs, { encoding: "utf-8", maxBuffer: 1024 * 1024 * 100 });
  if (r.status !== 0) throw new Error(`whisper.cpp a échoué :\n${(r.stderr || "").slice(-2000)}`);
  const sortie = lireJson(`${baseWhisper}.json`);
  const mots = [];
  for (const item of sortie.transcription) {
    const t = item.text.trim();
    if (!t || /^\[.*\]$/.test(t) || /^\(.*\)$/.test(t)) continue;
    const debut = item.offsets.from / 1000;
    const fin = Math.max(debut + 0.05, item.offsets.to / 1000);
    // Une ponctuation seule se colle au mot d'avant.
    if (/^[.,;:!?…»"')\]]+$/.test(t) && mots.length) {
      mots[mots.length - 1].t += t;
      mots[mots.length - 1].fin = fin;
      continue;
    }
    mots.push({ t, debut: +debut.toFixed(3), fin: +fin.toFixed(3) });
  }
  ecrireJson(fichierMots, mots);
}
const mots = lireJson(fichierMots);
if (typeof opts.langue !== "string" && existsSync(`${baseWhisper}.json`)) {
  langue = lireJson(`${baseWhisper}.json`).result?.language ?? langue;
}

// --- 3. Blancs et coupes -------------------------------------------------
const REGLES = {
  dynamique: { pause: 0.3, apres: 0.06, avant: 0.08 },
  naturel: { pause: 0.6, apres: 0.1, avant: 0.15 },
  aucune: null,
};
const regle = REGLES[style.coupes] ?? REGLES.naturel;
// --seuil se lit pour une voix à -14 LUFS (-35 par défaut) ; il suit le niveau réel de la voix.
const seuil = (typeof opts.seuil === "string" ? Number(opts.seuil) : -35) + (voixLufs + 14);
const seuilBrut = Math.max(-70, Math.min(-20, seuil)).toFixed(1);
const silences = [];
{
  const { stderr } = ff("ffmpeg", [
    "-hide_banner",
    "-i",
    wav,
    "-vn",
    "-af",
    `silencedetect=noise=${seuilBrut}dB:d=${regle ? regle.pause : 0.6}`,
    "-c:a",
    "pcm_s16le",
    "-f",
    "null",
    "-",
  ]);
  let debut = null;
  for (const ligne of stderr.split("\n")) {
    const a = /silence_start: (-?[\d.]+)/.exec(ligne);
    const b = /silence_end: ([\d.]+)/.exec(ligne);
    if (a) debut = Math.max(0, Number(a[1]));
    if (b && debut !== null) {
      silences.push([debut, Number(b[1])]);
      debut = null;
    }
  }
  if (debut !== null) silences.push([debut, duree]);
}
ecrireJson(path.join(projet, "silences.json"), silences);

let coupes = [];
if (regle) {
  for (const [s, e] of silences) {
    const a = s <= 0.05 ? 0 : s + regle.apres;
    const b = e >= duree - 0.05 ? duree : e - regle.avant;
    if (b - a < 0.08) continue;
    // Un mot dit tout bas, entier dans le blanc : on garde ce blanc.
    if (mots.some((m) => m.debut >= a && m.fin <= b && m.fin - m.debut > 0.15)) continue;
    coupes.push([a, b]);
  }
  // Deux coupes séparées par un souffle deviennent une seule (pas de flash).
  const fusion = [];
  for (const c of coupes) {
    const der = fusion[fusion.length - 1];
    if (der && c[0] - der[1] < 0.2 && !mots.some((m) => (m.debut + m.fin) / 2 > der[1] && (m.debut + m.fin) / 2 < c[0])) der[1] = c[1];
    else fusion.push([...c]);
  }
  coupes = fusion;
}
const segments = [];
let t = 0;
for (const [a, b] of coupes) {
  if (a - t > 0.05) segments.push([+t.toFixed(3), +a.toFixed(3)]);
  t = b;
}
if (duree - t > 0.05) segments.push([+t.toFixed(3), +duree.toFixed(3)]);
const dureeMontee = segments.reduce((s, [a, b]) => s + (b - a), 0);

// --- 4. Fichiers du projet -----------------------------------------------
// Transcription lisible : une ligne par phrase, avec ses temps dans le rush.
const lignes = [];
let cur = [];
const pousser = () => {
  if (!cur.length) return;
  lignes.push(`[${mmss(cur[0].debut)} -> ${mmss(cur[cur.length - 1].fin)}] ${cur.map((m) => m.t).join(" ")}`);
  cur = [];
};
mots.forEach((m, i) => {
  if (cur.length && m.debut - mots[i - 1].fin > 0.6) pousser();
  cur.push(m);
  if (/[.!?…]["»)]*$/.test(m.t) || cur.length >= 22) pousser();
});
pousser();
const coupesTxt = coupes.map(([a, b]) => `  ${mmss(a)} -> ${mmss(b)} (${(b - a).toFixed(1)} s)`).join("\n");
writeFileSync(
  path.join(projet, "transcription.txt"),
  `Rush : ${path.basename(rush)}\nDurée du rush : ${mmss(duree)}  |  après coupes des blancs : ${mmss(dureeMontee)}\n` +
    `Langue : ${langue}  |  ${mots.length} mots\n` +
    `Les temps sont en secondes du rush (mm:ss.s). Ce sont eux qu'on écrit dans montage.json.\n\n` +
    `--- TEXTE\n${lignes.join("\n")}\n\n--- BLANCS COUPÉS (${coupes.length})\n${coupesTxt || "  aucun"}\n`,
  "utf-8",
);

// Les sons : ceux du moteur, puis ceux de 3-assets/sons (les tiens gagnent).
for (const dossier of [path.join(MOTEUR, "sons"), path.join(ASSETS, "sons")]) {
  if (!existsSync(dossier)) continue;
  for (const f of readdirSync(dossier)) {
    if (/\.(wav|mp3)$/i.test(f)) copyFileSync(path.join(dossier, f), path.join(media, "sons", f));
  }
}

const fichierMontage = path.join(projet, "montage.json");
if (!existsSync(fichierMontage) || opts.force) {
  let musique = null;
  if (style.sons === "musique" || style.sons === "bruitages+musique") {
    const dm = path.join(ASSETS, "musique");
    const f = existsSync(dm) ? readdirSync(dm).find((x) => /\.(mp3|wav|m4a|aac)$/i.test(x)) : null;
    if (f) musique = { fichier: `musique/${f}`, volume: 0.08 };
  }
  ecrireJson(fichierMontage, {
    fps,
    rush: "rush.mp4",
    dureeRushS: +duree.toFixed(3),
    cadrage: { x: 50, y: 40 },
    segments,
    mots,
    style: { ...style, langue },
    effets: [],
    musique,
  });
} else if (opts.recouper) {
  const m = lireJson(fichierMontage);
  m.segments = segments;
  ecrireJson(fichierMontage, m);
  console.log("montage.json : coupes recalculées, effets gardés.");
} else {
  console.log("montage.json existe déjà : gardé tel quel (--recouper pour refaire les coupes, --force pour repartir de zéro).");
}

console.log(`
PRÊT
  projet        : ${nom}
  rush          : ${mmss(duree)}  ->  ${mmss(dureeMontee)} après coupes (${coupes.length} blancs coupés)
  langue        : ${langue}, ${mots.length} mots
  voix          : ${voixLufs.toFixed(1)} LUFS au départ, seuil des blancs ${seuilBrut} dB
  à lire        : ${path.join(projet, "transcription.txt")}
  à compléter   : ${fichierMontage}`);
