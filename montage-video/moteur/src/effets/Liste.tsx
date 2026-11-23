import { Check } from "lucide-react";
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { POLICES } from "../fonts";
import type { Style } from "../types";
import { EASE_OUT, PLACE, entreeSortie, unite } from "./commun";

// Une liste ou des conseils, en checklist en haut de l'image. La carte arrive
// avec une ligne vide par élément ; chaque élément s'écrit et se coche quand
// la personne le dit.
export type ItemListe = { texte: string; coche: number }; // coche : image dans la carte

export const Liste: React.FC<{
  readonly titre?: string;
  readonly items: ItemListe[];
  readonly duree: number;
  readonly style: Style;
  readonly y?: number;
}> = ({ titre, items, duree, style, y }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const u = unite(width, height);
  const { opacite, montee } = entreeSortie(frame, duree);
  const place = PLACE[style.format];
  const plusLong = Math.max(...items.map((i) => i.texte.length), 10);
  const taille = (plusLong > 34 ? 38 : plusLong > 24 ? 44 : 50) * u;
  const police = POLICES[style.sousTitres.police] ?? POLICES.Montserrat;

  return (
    <AbsoluteFill style={{ opacity: opacite }}>
      <div
        style={{
          position: "absolute",
          top: height * (y ?? place.haut) + montee * 0.02 * height,
          left: (width * (1 - place.largeurCarte)) / 2,
          width: width * place.largeurCarte,
          padding: `${30 * u}px ${36 * u}px`,
          borderRadius: 26 * u,
          background: "rgba(12,12,14,0.86)",
          border: `${2 * u}px solid ${style.couleur}55`,
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          fontFamily: police,
        }}
      >
        {titre ? (
          <div
            style={{
              color: style.couleur,
              fontWeight: 800,
              fontSize: 34 * u,
              letterSpacing: 2 * u,
              textTransform: "uppercase",
              marginBottom: 16 * u,
            }}
          >
            {titre}
          </div>
        ) : null}
        {items.map((it, i) => {
          const ecrit = interpolate(frame, [it.coche - 10, it.coche - 2], [0, 1], {
            easing: EASE_OUT,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const coche = spring({ frame: frame - it.coche, fps, config: { damping: 12, stiffness: 200 } });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 22 * u, padding: `${10 * u}px 0` }}>
              <div
                style={{
                  flex: "none",
                  width: 54 * u,
                  height: 54 * u,
                  borderRadius: 12 * u,
                  border: `${3 * u}px solid ${style.couleur}`,
                  background: frame >= it.coche ? style.couleur : "transparent",
                  transform: `scale(${frame >= it.coche ? 0.85 + 0.15 * coche : 1})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {frame >= it.coche ? <Check size={40 * u} color={style.texteSurCouleur} strokeWidth={3.5} /> : null}
              </div>
              <div
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: taille,
                  lineHeight: 1.2,
                  opacity: ecrit,
                  transform: `translateX(${(1 - ecrit) * 20 * u}px)`,
                }}
              >
                {it.texte}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
