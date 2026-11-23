import { Audio } from "@remotion/media";
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Chiffre, DUREE_COMPTE } from "./effets/Chiffre";
import { Icone } from "./effets/Icone";
import { ImageCarte, Logo } from "./effets/Image";
import { Liste } from "./effets/Liste";
import { filtreLook, Vignette } from "./effets/Look";
import { Son } from "./effets/Son";
import { SousTitres } from "./effets/SousTitres";
import { Titre } from "./effets/Titre";
import {
  construireSegments,
  cycleDeZooms,
  dureeTotale,
  type Fenetre,
  motsEnSortie,
  type Segment,
  versSortie,
} from "./timeline";
import type { Effet, Montage as MontageProps } from "./types";

// La composition unique du moteur. Elle lit montage.json (passé en props) et
// monte la vidéo : coupes, zooms, look, graphiques, sous-titres, sons, musique.

const DUREES: Record<Effet["type"], number> = {
  titre: 2.5,
  chiffre: 2.6,
  icone: 1.5,
  liste: 4,
  image: 3,
  logo: 2.2,
  zoom: 2,
};

const SON_PAR_DEFAUT: Record<Effet["type"], string | null> = {
  titre: "impact",
  chiffre: "pop",
  icone: "pop",
  liste: "tap",
  image: "woosh",
  logo: "pop",
  zoom: null,
};

const MOUVEMENT = 6; // images d'un zoom
const DOUX = Easing.inOut(Easing.cubic);

const niveauZoom = (fenetres: Fenetre[], f: number) => {
  let niveau = 0;
  for (const w of fenetres) {
    if (f < w.from || f >= w.to + MOUVEMENT) continue;
    let n = 1;
    if (f < w.from + MOUVEMENT) n = interpolate(f, [w.from, w.from + MOUVEMENT], [0, 1], { easing: DOUX });
    else if (f >= w.to) n = interpolate(f, [w.to, w.to + MOUVEMENT], [1, 0], { easing: DOUX });
    niveau = Math.max(niveau, n * w.force);
  }
  return niveau;
};

const PartieRush: React.FC<{
  readonly src: string;
  readonly seg: Segment;
  readonly echelle: number;
  readonly position: string;
}> = ({ src, seg, echelle, position }) => {
  const duree = seg.srcEnd - seg.srcStart;
  return (
    <AbsoluteFill style={{ transform: `scale(${echelle})`, transformOrigin: position }}>
      <OffthreadVideo
        src={src}
        trimBefore={seg.srcStart}
        trimAfter={seg.srcEnd}
        // Deux images de fondu du son à chaque coupe : pas de clic.
        volume={(f) => interpolate(f, [0, 2, duree - 2, duree], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: position }}
      />
    </AbsoluteFill>
  );
};

const Rush: React.FC<{
  readonly m: MontageProps;
  readonly segs: Segment[];
  readonly fenetres: Fenetre[];
}> = ({ m, segs, fenetres }) => {
  const frame = useCurrentFrame();
  const niveau = niveauZoom(fenetres, frame);
  const vitesse = Math.abs(niveau - niveauZoom(fenetres, frame - 1));
  const flou = Math.min(3, vitesse * 60);
  const position = `${m.cadrage.x}% ${m.cadrage.y}%`;
  const src = staticFile(m.rush);
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${1 + niveau})`,
        transformOrigin: `${m.cadrage.x}% 38%`,
        filter: flou > 0.2 ? `blur(${flou.toFixed(2)}px)` : undefined,
      }}
    >
      {segs.map((seg, i) => (
        <Sequence key={seg.outStart} from={seg.outStart} durationInFrames={seg.srcEnd - seg.srcStart} premountFor={30}>
          <PartieRush src={src} seg={seg} position={position} echelle={m.style.zooms === "coupes" && i % 2 === 1 ? 1.12 : 1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const Montage: React.FC<MontageProps> = (m) => {
  const { fps } = useVideoConfig();
  const segs = useMemo(() => construireSegments(m), [m]);
  const total = dureeTotale(segs);
  const mots = useMemo(() => motsEnSortie(segs, m.mots, fps), [segs, m.mots, fps]);
  const bruitages = m.style.sons === "bruitages" || m.style.sons === "bruitages+musique";
  const musique = m.musique && (m.style.sons === "musique" || m.style.sons === "bruitages+musique") ? m.musique : null;

  // Chaque effet, recalé en images de la vidéo montée.
  const places = useMemo(
    () =>
      m.effets.map((e) => {
        const from = versSortie(segs, e.debut, fps);
        let to = e.fin !== undefined ? versSortie(segs, e.fin, fps) : from + Math.round(DUREES[e.type] * fps);
        if (e.type === "liste") {
          const derniere = Math.max(...e.items.map((it) => versSortie(segs, it.coche, fps)));
          if (e.fin === undefined) to = derniere + Math.round(1.5 * fps);
        }
        if (e.type === "chiffre") to = Math.max(to, from + DUREE_COMPTE + 20);
        return { e, from, duree: Math.max(10, Math.min(to, total) - from) };
      }),
    [m.effets, segs, fps, total],
  );

  const fenetres = useMemo(() => {
    const zoomsEffets: Fenetre[] = places
      .filter((p) => p.e.type === "zoom")
      .map((p) => ({ from: p.from, to: p.from + p.duree, force: (p.e as { force?: number }).force ?? 0.2 }));
    if (m.style.zooms !== "cycle") return zoomsEffets;
    const titres = places.filter((p) => p.e.type === "titre").map((p): [number, number] => [p.from, p.from + p.duree]);
    return [...cycleDeZooms(mots, fps, total, titres), ...zoomsEffets];
  }, [places, m.style.zooms, mots, fps, total]);

  if (!m.rush) {
    return <AbsoluteFill style={{ background: "#111", color: "#fff", fontSize: 50, alignItems: "center", justifyContent: "center" }}>Aucun montage chargé</AbsoluteFill>;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ filter: filtreLook(m.style.look) }}>
        <Rush m={m} segs={segs} fenetres={fenetres} />
      </AbsoluteFill>
      <Vignette look={m.style.look} />

      {places.map(({ e, from, duree }, i) => {
        const son = e.son === undefined ? SON_PAR_DEFAUT[e.type] : e.son;
        return (
          <Sequence key={i} from={from} durationInFrames={duree} name={e.type}>
            {e.type === "titre" ? <Titre texte={e.texte} duree={duree} style={m.style} y={e.y} /> : null}
            {e.type === "chiffre" ? (
              <>
                <Chiffre {...e} duree={duree} style={m.style} />
                <Son nom={e.son === null ? null : "ding"} at={DUREE_COMPTE} actif={bruitages} />
              </>
            ) : null}
            {e.type === "icone" ? <Icone icone={e.icone} duree={duree} style={m.style} y={e.y} /> : null}
            {e.type === "liste" ? (
              <>
                <Liste
                  titre={e.titre}
                  y={e.y}
                  duree={duree}
                  style={m.style}
                  items={e.items.map((it) => ({ texte: it.texte, coche: versSortie(segs, it.coche, fps) - from }))}
                />
                {e.items.map((it, k) => (
                  <Son key={k} nom={e.son === null ? null : "click"} at={versSortie(segs, it.coche, fps) - from} actif={bruitages} />
                ))}
              </>
            ) : null}
            {e.type === "image" ? <ImageCarte fichier={e.fichier} duree={duree} style={m.style} y={e.y} hauteur={e.hauteur} /> : null}
            {e.type === "logo" ? (
              <>
                <Logo fichier={e.fichier} nom={e.nom} duree={duree} style={m.style} y={e.y} />
                <Son nom={e.son === null ? null : "swipe"} at={10} actif={bruitages} />
              </>
            ) : null}
            <Son nom={son} actif={bruitages} />
          </Sequence>
        );
      })}

      <SousTitres mots={mots} style={m.style} />

      {musique ? (
        <Audio
          src={staticFile(musique.fichier)}
          loop
          volume={(f) =>
            musique.volume *
            interpolate(f, [0, fps, total - 1.5 * fps, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};
