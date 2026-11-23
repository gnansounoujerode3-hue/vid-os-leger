// Outils communs aux scripts du moteur. Aucune dépendance en dehors de Node
// et des paquets du moteur : ffmpeg vient avec Remotion.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MOTEUR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ESPACE = path.resolve(MOTEUR, "..");
export const PROJETS = path.join(MOTEUR, "projets");
export const ASSETS = path.join(ESPACE, "3-assets");
export const SORTIES = path.join(ESPACE, "4-videos-montees");

export const WHISPER_VERSION = "1.5.5";
export const WHISPER_DOSSIER = path.join(MOTEUR, "whisper.cpp");
export const MODELE_PAR_DEFAUT = "large-v3-turbo";


export const cheminCli = () => {
  const cli = path.join(MOTEUR, "node_modules", "@remotion", "cli", "remotion-cli.js");
  if (!existsSync(cli)) throw new Error("Le moteur n'est pas installé. Lance d'abord : node outils/installer.mjs");
  return cli;
};

/** Lance le ffmpeg (ou ffprobe) livré avec Remotion. */
export const ff = (outil, args, { silencieux = true } = {}) => {
  const r = spawnSync(process.execPath, [cheminCli(), outil, ...args], {
    cwd: MOTEUR,
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 200,
    stdio: silencieux ? ["ignore", "pipe", "pipe"] : ["ignore", "inherit", "inherit"],
  });
  if (r.status !== 0) {
    throw new Error(`${outil} a échoué (${r.status}) :\n${(r.stderr || "").split("\n").slice(-15).join("\n")}`);
  }
  return { stdout: r.stdout || "", stderr: r.stderr || "" };
};

export const lireJson = (p) => JSON.parse(readFileSync(p, "utf-8"));
export const ecrireJson = (p, data) => writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf-8");

export const cheminWhisper = () => {
  const exe = os.platform() === "win32" ? "main.exe" : "main";
  return path.join(WHISPER_DOSSIER, exe);
};

export const cheminModele = (modele) => path.join(WHISPER_DOSSIER, `ggml-${modele}.bin`);

/** Le modèle installé : celui de modele.txt, sinon le modèle par défaut. */
export const modeleInstalle = () => {
  const f = path.join(MOTEUR, "modele.txt");
  return existsSync(f) ? readFileSync(f, "utf-8").trim() : MODELE_PAR_DEFAUT;
};

/** "1-rushs/ma video.MOV" -> "ma-video" */
export const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "video";

export const aujourdhui = () => {
  const d = new Date();
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

/** Le dossier d'un projet, à partir de son nom ou de son chemin. */
export const dossierProjet = (nom) => {
  if (!nom) throw new Error("Donne le nom du projet (le dossier dans _moteur/projets).");
  const direct = path.resolve(process.cwd(), nom);
  if (existsSync(path.join(direct, "montage.json"))) return direct;
  const dansProjets = path.join(PROJETS, path.basename(nom));
  if (existsSync(dansProjets)) return dansProjets;
  throw new Error(`Projet introuvable : ${nom}`);
};

export const mmss = (s) => {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${String(m).padStart(2, "0")}:${r.toFixed(1).padStart(4, "0")}`;
};

export const args = (argv) => {
  const pos = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      if (v !== undefined) opts[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith("--")) opts[k] = argv[++i];
      else opts[k] = true;
    } else pos.push(a);
  }
  return { pos, opts };
};
