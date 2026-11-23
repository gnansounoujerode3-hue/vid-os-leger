import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { POLICES } from "../fonts";
import type { Style } from "../types";
import { EASE_OUT, OMBRE, PLACE, entreeSortie, unite } from "./commun";

// Le titre d'accroche des premières secondes, en haut de l'image.
// Chaque mot monte l'un après l'autre ; un trait de la couleur principale dessous.
export const Titre: React.FC<{ readonly texte: string; readonly duree: number; readonly style: Style; readonly y?: number }> = ({
  texte,
  duree,
  style,
  y,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = unite(width, height);
  const { opacite } = entreeSortie(frame, duree);
  const mots = texte.split(/\s+/).filter(Boolean);
  const taille = (mots.join(" ").length > 28 ? 84 : 100) * u;
  const trait = interpolate(frame, [6, 20], [0, 1], { easing: EASE_OUT, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: opacite }}>
      <div
        style={{
          position: "absolute",
          top: height * (y ?? PLACE[style.format].titreY),
          left: "7%",
          right: "7%",
          transform: "translateY(-50%)",
          textAlign: "center",
          fontFamily: POLICES[style.sousTitres.police] ?? POLICES.Montserrat,
          fontWeight: 900,
          fontSize: taille,
          lineHeight: 1.05,
          color: "#fff",
          textShadow: OMBRE,
          textTransform: "uppercase",
        }}
      >
        {mots.map((m, i) => {
          const p = interpolate(frame, [i * 3, i * 3 + 10], [0, 1], {
            easing: EASE_OUT,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <span
              key={i}
              style={{ display: "inline-block", margin: "0 0.12em", opacity: p, transform: `translateY(${(1 - p) * 30 * u}px)` }}
            >
              {m}
            </span>
          );
        })}
        <div
          style={{
            margin: `${18 * u}px auto 0`,
            height: 10 * u,
            width: `${30 * trait}%`,
            borderRadius: 6 * u,
            background: style.couleur,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
