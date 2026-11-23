import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { POLICES } from "../fonts";
import type { Style } from "../types";
import { OMBRE, PLACE, entreeSortie, unite } from "./commun";

// Un chiffre que la personne dit : il compte de 0 jusqu'à sa valeur en 1 s,
// en freinant, puis grossit un peu en arrivant. La légende dit ce qu'il mesure.
export const DUREE_COMPTE = 30; // images

export const Chiffre: React.FC<{
  readonly valeur: number;
  readonly decimales?: number;
  readonly prefixe?: string;
  readonly suffixe?: string;
  readonly legende?: string;
  readonly duree: number;
  readonly style: Style;
  readonly y?: number;
}> = ({ valeur, decimales = 0, prefixe = "", suffixe = "", legende, duree, style, y }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = unite(width, height);
  const { opacite, montee } = entreeSortie(frame, duree);
  const t = Math.min(1, frame / DUREE_COMPTE);
  const courant = valeur * (1 - (1 - t) ** 3);
  const langue = style.langue === "en" ? "en-US" : style.langue === "es" ? "es-ES" : "fr-FR";
  const texte = new Intl.NumberFormat(langue, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(t >= 1 ? valeur : courant);
  const bump = interpolate(frame, [DUREE_COMPTE, DUREE_COMPTE + 5, DUREE_COMPTE + 12], [1, 1.12, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taille = ((prefixe + texte + suffixe).length > 9 ? 130 : 170) * u;

  return (
    <AbsoluteFill style={{ opacity: opacite }}>
      <div
        style={{
          position: "absolute",
          top: height * (y ?? PLACE[style.format].chiffreY) + montee * 0.02 * height,
          left: 0,
          right: 0,
          transform: "translateY(-50%)",
          textAlign: "center",
          fontFamily: POLICES[style.sousTitres.police] ?? POLICES.Montserrat,
        }}
      >
        <div
          style={{
            fontSize: taille,
            fontWeight: 900,
            lineHeight: 1,
            color: style.couleur,
            textShadow: `${OMBRE}, 0 0 ${40 * u * (bump - 1) * 8}px ${style.couleur}`,
            transform: `scale(${bump})`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {prefixe}
          {texte}
          {suffixe}
        </div>
        {legende ? (
          <div
            style={{
              marginTop: 14 * u,
              padding: "0 8%",
              fontSize: 46 * u,
              fontWeight: 700,
              color: "#fff",
              textShadow: OMBRE,
              lineHeight: 1.2,
            }}
          >
            {legende}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
