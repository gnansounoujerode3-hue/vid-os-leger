import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { POLICES } from "../fonts";
import type { MotSortie } from "../timeline";
import type { Style } from "../types";
import { unite } from "./commun";

// Trois styles de sous-titres :
// - boite   : quelques mots, le mot dit posé sur une boîte de la couleur principale
// - karaoke : gros mots en majuscules, le mot dit dans la couleur principale
// - phrase  : une phrase simple sur un bandeau sombre, sans mot surligné

type Bloc = { mots: MotSortie[]; startMs: number; endMs: number };

const finDePhrase = (t: string) => /[.!?…]["»”)]*$/.test(t);
const virgule = (t: string) => /[,;:]["»”)]*$/.test(t);

export const decouper = (mots: MotSortie[], maxMots: number): Bloc[] => {
  const blocs: Bloc[] = [];
  let cur: MotSortie[] = [];
  const pousser = () => {
    if (cur.length) blocs.push({ mots: cur, startMs: cur[0].startMs, endMs: cur[cur.length - 1].endMs });
    cur = [];
  };
  mots.forEach((w, i) => {
    const prec = mots[i - 1];
    if (cur.length && prec && w.startMs - prec.endMs > 700) pousser();
    cur.push(w);
    if (cur.length >= maxMots || finDePhrase(w.t) || (virgule(w.t) && cur.length >= 2)) pousser();
  });
  pousser();
  // Un bloc reste à l'écran jusqu'au suivant (au plus 0,6 s après son dernier mot).
  blocs.forEach((b, i) => {
    const suivant = blocs[i + 1];
    b.endMs = suivant ? Math.min(suivant.startMs, b.endMs + 600) : b.endMs + 400;
  });
  return blocs;
};

const nettoyer = (t: string, majuscules: boolean) => {
  const s = t.trim();
  return majuscules ? s.toLocaleUpperCase() : s;
};

const VueBloc: React.FC<{ readonly bloc: Bloc; readonly style: Style }> = ({ bloc, style }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const u = unite(width, height);
  const maintenant = bloc.startMs + (frame / fps) * 1000;
  const st = style.sousTitres;
  const police = POLICES[st.police] ?? POLICES.Montserrat;

  let actif = 0;
  bloc.mots.forEach((w, i) => {
    if (w.startMs <= maintenant) actif = i;
  });

  const conteneur: React.CSSProperties = {
    position: "absolute",
    top: height * st.position,
    left: 0,
    right: 0,
    transform: "translateY(-50%)",
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    padding: "0 6%",
    fontFamily: police,
    textAlign: "center",
  };

  if (st.mode === "phrase") {
    const texte = bloc.mots.map((w) => nettoyer(w.t, st.majuscules)).join(" ");
    return (
      <AbsoluteFill>
        <div style={conteneur}>
          <span
            style={{
              fontSize: 50 * u,
              fontWeight: 700,
              lineHeight: 1.3,
              color: "#fff",
              background: "rgba(0,0,0,0.62)",
              padding: `${0.2 * 50 * u}px ${0.5 * 50 * u}px`,
              borderRadius: 14 * u,
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            {texte}
          </span>
        </div>
      </AbsoluteFill>
    );
  }

  if (st.mode === "karaoke") {
    const taille = (st.police === "Bebas Neue" ? 120 : 96) * u;
    const debutActif = Math.round(((bloc.mots[actif].startMs - bloc.startMs) / 1000) * fps);
    const pop = spring({ frame: frame - debutActif, fps, config: { damping: 12, stiffness: 220 }, durationInFrames: 8 });
    return (
      <AbsoluteFill>
        <div style={{ ...conteneur, columnGap: 0.38 * taille, rowGap: 0, lineHeight: 1.1 }}>
          {bloc.mots.map((w, i) => (
            <span
              key={i}
              style={{
                fontSize: taille,
                fontWeight: 900,
                color: i === actif ? style.couleur : "#fff",
                textShadow: `0 0 ${10 * u}px rgba(0,0,0,0.6), 0 ${5 * u}px 0 rgba(0,0,0,0.85)`,
                WebkitTextStroke: `${3 * u}px rgba(0,0,0,0.9)`,
                paintOrder: "stroke fill",
                // Un petit bond vers le haut, sans grossir : les mots ne se touchent jamais.
                transform: i === actif ? `translateY(${-0.08 * taille * (1 - pop)}px)` : undefined,
                display: "inline-block",
              }}
            >
              {nettoyer(w.t, true)}
            </span>
          ))}
        </div>
      </AbsoluteFill>
    );
  }

  // boite
  const taille = 64 * u;
  return (
    <AbsoluteFill>
      <div style={{ ...conteneur, lineHeight: 1.3, fontSize: taille, fontWeight: 800 }}>
        {bloc.mots.map((w, i) => {
          const on = i === actif;
          return (
            <span
              key={i}
              style={{
                padding: "0 0.18em",
                margin: "0 0.03em",
                borderRadius: 10 * u,
                backgroundColor: on ? style.couleur : "transparent",
                color: on ? style.texteSurCouleur : "#fff",
                textShadow: on ? "none" : "0 2px 12px rgba(0,0,0,0.7)",
              }}
            >
              {nettoyer(w.t, st.majuscules)}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const SousTitres: React.FC<{ readonly mots: MotSortie[]; readonly style: Style }> = ({ mots, style }) => {
  const { fps } = useVideoConfig();
  const st = style.sousTitres;
  const maxMots = st.mode === "phrase" ? Math.max(st.maxMots, 6) : st.maxMots;
  const blocs = useMemo(() => decouper(mots, maxMots), [mots, maxMots]);
  if (st.mode === "aucun") return null;
  return (
    <AbsoluteFill>
      {blocs.map((b) => {
        const from = Math.round((b.startMs / 1000) * fps);
        const duree = Math.round((b.endMs / 1000) * fps) - from;
        if (duree <= 0) return null;
        return (
          <Sequence key={b.startMs} from={from} durationInFrames={duree} layout="none">
            <VueBloc bloc={b} style={style} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
