// Vérifie montage.json avant le rendu, et copie dans le projet les fichiers
// dont il a besoin (images, logos, musique, sons de 3-assets).
// Usage : node outils/verifier.mjs <projet>
// Sortie : 0 si tout va bien, 1 s'il y a des erreurs. Les alertes n'empêchent pas le rendu.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ASSETS, args, dossierProjet, lireJson, mmss } from "./lib.mjs";

const TYPES = ["titre", "chiffre", "icone", "liste", "image", "logo", "zoom"];
const EN_HAUT = ["titre", "chiffre", "liste", "image", "logo"];
const DUREES = { titre: 2.5, chiffre: 2.6, icone: 1.5, liste: 4, image: 3, logo: 2.2, zoom: 2 };
const FAMILLE = { chiffre: "chiffres", icone: "icones", liste: "listes", image: "images", logo: "images" };

export const verifier = async (nomProjet) => {
  const projet = dossierProjet(nomProjet);
  const media = path.join(projet, "media");
  const m = lireJson(path.join(projet, "montage.json"));
  const erreurs = [];
  const alertes = [];
  const D = m.dureeRushS;

  // Un fichier demandé : déjà dans le projet, sinon copié depuis 3-assets.
  const fichierPresent = (rel, quoi) => {
    const dest = path.join(media, rel);
    if (existsSync(dest)) return;
    const src = path.join(ASSETS, rel);
    if (existsSync(src)) {
      mkdirSync(path.dirname(dest), { recursive: true });
      copyFileSync(src, dest);
      return;
    }
    erreurs.push(`${quoi} : fichier introuvable « ${rel} » (à déposer dans 3-assets/${rel})`);
  };

  if (!existsSync(path.join(media, m.rush))) erreurs.push(`Rush introuvable : ${m.rush}`);
  if (!Array.isArray(m.segments) || m.segments.length === 0) erreurs.push("Aucun segment : la vidéo serait vide.");
  let fin = -1;
  for (const [a, b] of m.segments ?? []) {
    if (!(a < b)) erreurs.push(`Segment à l'envers : [${a}, ${b}]`);
    if (a < fin - 0.001) erreurs.push(`Segments qui se chevauchent ou dans le désordre vers ${mmss(a)}`);
    if (b > D + 0.05) erreurs.push(`Segment après la fin du rush : [${a}, ${b}] (rush : ${D} s)`);
    fin = b;
  }

  const { icons } = await import("lucide-react");
  const nomLucide = (n) => n.trim().split(/[-_\s]+/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");

  const fenetresHaut = [];
  (m.effets ?? []).forEach((e, i) => {
    const ou = `effet ${i + 1} (${e.type ?? "?"} à ${typeof e.debut === "number" ? mmss(e.debut) : "?"})`;
    if (!TYPES.includes(e.type)) return erreurs.push(`${ou} : type inconnu. Types possibles : ${TYPES.join(", ")}`);
    if (typeof e.debut !== "number" || e.debut < 0 || e.debut > D) return erreurs.push(`${ou} : « debut » doit être un nombre de secondes du rush, entre 0 et ${D}`);
    if (e.fin !== undefined && !(e.fin > e.debut)) erreurs.push(`${ou} : « fin » doit venir après « debut »`);
    const garde = (m.segments ?? []).some(([a, b]) => e.debut >= a - 0.3 && e.debut < b);
    if (!garde) alertes.push(`${ou} : tombe dans un passage coupé, il glisse au début du passage suivant`);
    if (FAMILLE[e.type] && !(m.style.effets ?? []).includes(FAMILLE[e.type]))
      alertes.push(`${ou} : la personne n'a pas choisi les « ${FAMILLE[e.type]} » dans son style`);

    if (e.type === "titre" && !e.texte) erreurs.push(`${ou} : « texte » manque`);
    if (e.type === "chiffre") {
      if (typeof e.valeur !== "number") erreurs.push(`${ou} : « valeur » doit être un nombre (ex. 42 ou 14.9)`);
      if (!e.legende) alertes.push(`${ou} : pas de « legende », un chiffre seul ne dit pas ce qu'il mesure`);
    }
    if (e.type === "icone" && !icons[nomLucide(e.icone ?? "")])
      erreurs.push(`${ou} : icône « ${e.icone} » inconnue. Liste : https://lucide.dev/icons (ex. wallet, clock, shield-alert)`);
    if (e.type === "liste") {
      if (!Array.isArray(e.items) || e.items.length === 0) erreurs.push(`${ou} : « items » manque`);
      else {
        if (e.items.length > 5) alertes.push(`${ou} : plus de 5 éléments, la carte risque d'être trop haute`);
        e.items.forEach((it, k) => {
          if (typeof it.coche !== "number" || it.coche < e.debut) erreurs.push(`${ou} : l'élément ${k + 1} doit avoir « coche » après « debut »`);
          if (e.fin !== undefined && it.coche > e.fin) erreurs.push(`${ou} : l'élément ${k + 1} se coche après la fin de la carte`);
        });
      }
    }
    if (e.type === "image") fichierPresent(e.fichier ?? "", ou);
    if (e.type === "logo") {
      fichierPresent(e.fichier ?? "", ou);
      if (!e.nom) erreurs.push(`${ou} : « nom » manque`);
    }
    if (typeof e.son === "string" && !existsSync(path.join(media, "sons", e.son.includes(".") ? e.son : `${e.son}.wav`)))
      fichierPresent(`sons/${e.son.includes(".") ? e.son : `${e.son}.wav`}`, `${ou}, son`);

    if (EN_HAUT.includes(e.type)) {
      let f = e.fin ?? e.debut + DUREES[e.type];
      if (e.type === "liste" && e.fin === undefined && Array.isArray(e.items)) f = Math.max(...e.items.map((it) => it.coche)) + 1.5;
      fenetresHaut.push({ a: e.debut, b: f, ou });
    }
  });

  fenetresHaut.sort((x, y) => x.a - y.a);
  for (let i = 1; i < fenetresHaut.length; i++) {
    const p = fenetresHaut[i - 1];
    const c = fenetresHaut[i];
    if (c.a < p.b) alertes.push(`${c.ou} : arrive avant la fin de ${p.ou}, les deux se superposent en haut de l'image`);
  }

  if (m.musique) fichierPresent(m.musique.fichier, "musique");
  if ((m.style.sons === "musique" || m.style.sons === "bruitages+musique") && !m.musique)
    alertes.push("Le style demande une musique, mais aucune n'est choisie : dépose un fichier dans 3-assets/musique/");

  const dureeMontee = (m.segments ?? []).reduce((s, [a, b]) => s + Math.max(0, b - a), 0);
  return { projet, erreurs, alertes, m, dureeMontee };
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { pos } = args(process.argv.slice(2));
  const { erreurs, alertes, m, dureeMontee } = await verifier(pos[0]);
  for (const a of alertes) console.log(`ALERTE  ${a}`);
  for (const e of erreurs) console.log(`ERREUR  ${e}`);
  console.log(`Durée : rush ${mmss(m.dureeRushS)}, vidéo montée ${mmss(dureeMontee)}`);
  console.log(erreurs.length ? `\n${erreurs.length} erreur(s) à corriger avant le rendu.` : "\nOK, montage.json est prêt pour le rendu.");
  process.exit(erreurs.length ? 1 : 0);
}
