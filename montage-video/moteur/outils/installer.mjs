// Installe tout ce que le moteur demande, une seule fois :
// les paquets Node, le navigateur de rendu, whisper.cpp et son modèle.
// Usage : node outils/installer.mjs [--modele small]
//   --modele : large-v3-turbo (par défaut, 1,6 Go, très bon) ou small (480 Mo, pour un vieil ordinateur)
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { args, MOTEUR, MODELE_PAR_DEFAUT, WHISPER_DOSSIER, WHISPER_VERSION, cheminModele, cheminWhisper } from "./lib.mjs";

const { opts } = args(process.argv.slice(2));
const modele = typeof opts.modele === "string" ? opts.modele : MODELE_PAR_DEFAUT;
const win = os.platform() === "win32";

const etape = (t) => console.log(`\n=== ${t}`);

etape("1/4 Node.js");
const majeur = Number(process.versions.node.split(".")[0]);
if (majeur < 20) {
  console.error(`Node ${process.versions.node} est trop ancien. Il faut Node 20 ou plus : https://nodejs.org (version LTS).`);
  process.exit(2);
}
console.log(`OK, Node ${process.versions.node}`);

etape("2/4 Paquets du moteur (Remotion)");
if (!existsSync(path.join(MOTEUR, "node_modules", "remotion"))) {
  const r = spawnSync(win ? "npm.cmd" : "npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], {
    cwd: MOTEUR,
    stdio: "inherit",
    shell: win,
  });
  if (r.status !== 0) {
    console.error("npm install a échoué. Vérifie ta connexion internet et relance.");
    process.exit(1);
  }
}
console.log("OK, paquets installés");

const { ensureBrowser } = await import("@remotion/renderer");
const { installWhisperCpp, downloadWhisperModel } = await import("@remotion/install-whisper-cpp");

console.log("Navigateur de rendu (une fois, environ 100 Mo)...");
await ensureBrowser();
console.log("OK, navigateur prêt");

etape("3/4 whisper.cpp (la transcription, sur ton ordinateur)");
if (os.platform() === "darwin") {
  const xc = spawnSync("xcode-select", ["-p"], { encoding: "utf-8" });
  if (xc.status !== 0) {
    console.error(
      "Il manque les outils de développement d'Apple (git, make).\n" +
        "Lance cette commande dans le Terminal, clique sur « Installer », puis relance l'installation :\n\n" +
        "  xcode-select --install\n",
    );
    process.exit(3);
  }
}
if (!existsSync(cheminWhisper())) {
  if (existsSync(WHISPER_DOSSIER)) {
    console.error(`Le dossier ${WHISPER_DOSSIER} existe mais il est incomplet. Supprime-le et relance.`);
    process.exit(1);
  }
  console.log("Compilation de whisper.cpp (une minute environ)...");
  await installWhisperCpp({ to: WHISPER_DOSSIER, version: WHISPER_VERSION, printOutput: false });
}
console.log("OK, whisper.cpp prêt");

etape(`4/4 Modèle de transcription (${modele})`);
if (!existsSync(cheminModele(modele))) {
  let dernier = -1;
  await downloadWhisperModel({
    model: modele,
    folder: WHISPER_DOSSIER,
    printOutput: false,
    onProgress: (n, total) => {
      const p = Math.floor((n / total) * 10) * 10;
      if (p !== dernier) {
        dernier = p;
        console.log(`  téléchargé : ${p} %`);
      }
    },
  });
}
writeFileSync(path.join(MOTEUR, "modele.txt"), modele + "\n");
console.log("OK, modèle prêt");

console.log("\nPRÊT. Le moteur de montage est installé.");
