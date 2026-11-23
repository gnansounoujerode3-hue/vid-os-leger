// Le storyboard en images : une page dans le navigateur, une image par moment
// clé, et à côté de chacune une case où la personne écrit ce qu'elle veut changer.
// Quand elle clique sur le bouton, ses changements arrivent dans le projet
// (retours.json et retours.md), s'affichent ici, et le serveur s'arrête tout seul.
//
// Usage (après « node outils/rendu.mjs <projet> --apercu ») :
//   node outils/storyboard.mjs <projet>              ouvre la page et attend les changements
//   node outils/storyboard.mjs <projet> --pas-ouvrir  sans ouvrir le navigateur (affiche le lien)
// À lancer en arrière-plan : il attend la personne jusqu'à 2 heures.
import { spawn } from "node:child_process";
import { createReadStream, existsSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { args, dossierProjet, lireJson, mmss } from "./lib.mjs";

const { pos, opts } = args(process.argv.slice(2));
const projet = dossierProjet(pos[0]);
const dossier = path.join(projet, "apercu");
const fichierApercu = path.join(dossier, "apercu.json");
if (!existsSync(fichierApercu)) {
  console.error(`Pas d'aperçu pour ce projet. Lance d'abord : node outils/rendu.mjs ${path.basename(projet)} --apercu`);
  process.exit(1);
}
const data = lireJson(fichierApercu);

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const minsec = (s) => mmss(s).replace(/\.\d$/, "").replace(/^0/, "");

const carte = (mo, i) => `
  <article class="carte">
    <img src="/img/${encodeURIComponent(mo.fichier)}" alt="Image à ${esc(minsec(mo.sortieS))}" loading="lazy">
    <div class="texte">
      <div class="temps">${esc(minsec(mo.sortieS))} dans la vidéo</div>
      <div class="quoi">${esc(mo.quoi)}</div>
      ${mo.texte ? `<div class="dit">« ${esc(mo.texte)} »</div>` : ""}
      <label for="c${i}">Ce que tu veux changer ici</label>
      <textarea id="c${i}" data-i="${i}" rows="3" placeholder="Laisse vide si c'est bon. Exemple : enlève l'icône, mets le chiffre plus bas, change le mot…"></textarea>
    </div>
  </article>`;

const page = () => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Storyboard · ${esc(data.projet)}</title>
<style>
  :root { --accent: ${esc(data.couleur)}; --sur: ${esc(data.texteSurCouleur)}; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f2f2f0; color: #1b1b1a; font: 17px/1.5 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  main { max-width: 980px; margin: 0 auto; padding: 32px 16px 120px; }
  h1 { font-size: 28px; margin: 0 0 6px; }
  .intro { color: #55524c; margin: 0 0 28px; }
  .carte { display: flex; gap: 24px; background: #fff; border-radius: 16px; padding: 18px; margin-bottom: 18px; box-shadow: 0 2px 10px rgba(0,0,0,.06); }
  .carte img { flex: none; width: ${data.format === "horizontal" ? 420 : data.format === "carre" ? 300 : 240}px; max-width: 100%; height: auto; border-radius: 10px; background: #000; }
  .texte { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .temps { font-size: 14px; font-weight: 700; color: #6b675f; text-transform: uppercase; letter-spacing: .04em; }
  .quoi { font-size: 19px; font-weight: 700; }
  .dit { font-style: italic; color: #55524c; }
  label { margin-top: auto; font-size: 14px; font-weight: 600; color: #6b675f; }
  textarea { width: 100%; font: inherit; padding: 10px 12px; border: 2px solid #dcd9d2; border-radius: 10px; resize: vertical; }
  textarea:focus { outline: none; border-color: var(--accent); }
  .general { background: #fff; border-radius: 16px; padding: 18px; box-shadow: 0 2px 10px rgba(0,0,0,.06); }
  .general h2 { font-size: 19px; margin: 0 0 8px; }
  .barre { position: fixed; left: 0; right: 0; bottom: 0; background: rgba(242,242,240,.96); border-top: 1px solid #dcd9d2; padding: 14px 16px; text-align: center; }
  button { font: inherit; font-weight: 700; font-size: 18px; padding: 14px 28px; border: 0; border-radius: 12px; background: var(--accent); color: var(--sur); cursor: pointer; }
  button:disabled { opacity: .6; cursor: default; }
  .fin { max-width: 640px; margin: 18vh auto; text-align: center; padding: 0 16px; }
  .fin textarea { margin-top: 16px; }
  @media (max-width: 640px) { .carte { flex-direction: column; } .carte img { width: 100%; } }
</style>
</head>
<body>
<main id="contenu">
  <h1>Ton storyboard</h1>
  <p class="intro">Durée : ${esc(minsec(data.dureeRushS))} filmées, ${esc(minsec(data.dureeMonteeS))} après montage. Regarde chaque image. Si quelque chose ne te plaît pas, écris-le à côté. Puis clique sur le bouton en bas.</p>
  ${data.moments.map(carte).join("")}
  <section class="general">
    <h2>Autre chose sur toute la vidéo ?</h2>
    <textarea id="general" rows="3" placeholder="Exemple : plus de zooms, sous-titres plus gros, enlève le passage où je me trompe…"></textarea>
  </section>
</main>
<div class="barre" id="barre"><button id="envoyer">Tout est bon, lance le montage</button></div>
<script>
  const moments = ${JSON.stringify(data.moments.map((m) => ({ fichier: m.fichier, sortieS: m.sortieS, rushS: m.rushS, effet: m.effet, quoi: m.quoi }))).replace(/</g, "\\u003c")};
  const bouton = document.getElementById("envoyer");
  const champs = [...document.querySelectorAll("textarea")];
  const rien = () => champs.every((c) => !c.value.trim());
  const majBouton = () => { bouton.textContent = rien() ? "Tout est bon, lance le montage" : "Envoyer mes changements à Claude"; };
  champs.forEach((c) => c.addEventListener("input", majBouton));
  const collecter = () => ({
    toutEstBon: rien(),
    general: document.getElementById("general").value.trim(),
    changements: [...document.querySelectorAll("textarea[data-i]")]
      .map((c) => ({ ...moments[Number(c.dataset.i)], changement: c.value.trim() }))
      .filter((x) => x.changement),
  });
  const enTexte = (r) => r.toutEstBon ? "Storyboard : tout est bon, lance le montage." :
    ["Mes changements sur le storyboard :"].concat(
      r.changements.map((x) => "- " + x.fichier + " (" + x.quoi + ") : " + x.changement),
      r.general ? ["- Sur toute la vidéo : " + r.general] : []).join("\\n");
  const finir = (html) => { document.getElementById("barre").remove(); document.getElementById("contenu").outerHTML = '<div class="fin">' + html + '</div>'; window.scrollTo(0, 0); };
  bouton.addEventListener("click", async () => {
    const r = collecter();
    bouton.disabled = true;
    try {
      const rep = await fetch("/retours", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
      if (!rep.ok) throw new Error();
      finir(r.toutEstBon
        ? "<h1>C'est noté.</h1><p>Retourne dans Claude : il lance le montage.</p>"
        : "<h1>C'est envoyé.</h1><p>Retourne dans Claude : il applique tes changements.</p>");
    } catch {
      const t = enTexte(r);
      try { await navigator.clipboard.writeText(t); } catch {}
      finir("<h1>Copie ce texte dans Claude</h1><p>La page n'a pas pu l'envoyer toute seule. Il est déjà copié : colle-le dans la conversation.</p><textarea rows='8' readonly>" + t.replace(/</g, "&lt;") + "</textarea>");
    }
  });
</script>
</body>
</html>`;

const enMarkdown = (r) => {
  const lignes = ["# Retours sur le storyboard", "", `Tout est bon : ${r.toutEstBon ? "oui" : "non"}`, ""];
  if (r.changements?.length) {
    lignes.push("## Changements, image par image", "");
    for (const c of r.changements) {
      const effet = c.effet === null || c.effet === undefined ? "pas d'effet" : `effet n° ${c.effet + 1} de montage.json`;
      lignes.push(`- ${c.fichier} (${mmss(c.sortieS)} dans la vidéo, ${mmss(c.rushS)} du rush, ${effet}, ${c.quoi}) : ${c.changement}`);
    }
    lignes.push("");
  }
  if (r.general) lignes.push("## Sur toute la vidéo", "", r.general, "");
  return lignes.join("\n");
};

const serveur = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(page());
    return;
  }
  if (req.method === "GET" && url.pathname.startsWith("/img/")) {
    const nom = path.basename(decodeURIComponent(url.pathname.slice(5)));
    const f = path.join(dossier, nom);
    if (!nom.endsWith(".jpg") || !existsSync(f)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "no-store" });
    createReadStream(f).pipe(res);
    return;
  }
  if (req.method === "POST" && url.pathname === "/retours") {
    let corps = "";
    req.on("data", (d) => {
      corps += d;
      if (corps.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      let r;
      try {
        r = JSON.parse(corps);
      } catch {
        res.writeHead(400).end();
        return;
      }
      writeFileSync(path.join(projet, "retours.json"), JSON.stringify(r, null, 2) + "\n");
      const md = enMarkdown(r);
      writeFileSync(path.join(projet, "retours.md"), md);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"ok":true}');
      console.log(`\nRETOURS REÇUS (${path.join(projet, "retours.md")})\n\n${md}`);
      setTimeout(() => process.exit(0), 300);
    });
    return;
  }
  res.writeHead(404).end();
});

serveur.listen(Number(opts.port) || 0, "127.0.0.1", () => {
  const lien = `http://127.0.0.1:${serveur.address().port}/`;
  console.log(`STORYBOARD OUVERT : ${lien}`);
  console.log("En attente des changements de la personne (le serveur s'arrête tout seul quand elle clique sur le bouton).");
  if (!opts["pas-ouvrir"]) {
    const [cmd, a] =
      process.platform === "darwin" ? ["open", [lien]] : process.platform === "win32" ? ["cmd", ["/c", "start", "", lien]] : ["xdg-open", [lien]];
    try {
      spawn(cmd, a, { detached: true, stdio: "ignore" }).unref();
    } catch {
      console.log("Le navigateur ne s'est pas ouvert : donne ce lien à la personne.");
    }
  }
});

setTimeout(() => {
  console.log("Personne n'a répondu en 2 heures : storyboard fermé. Relance-le si besoin.");
  process.exit(2);
}, 2 * 60 * 60 * 1000);
