import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { POLICES } from "../fonts";
import type { Style } from "../types";
import { EASE_OUT, OMBRE, PLACE, entreeSortie, unite } from "./commun";

// Une capture d'écran ou une photo, en haut de l'image, coins arrondis.
// Une vraie capture vaut toujours mieux qu'une interface dessinée.
export const ImageCarte: React.FC<{
  readonly fichier: string;
  readonly duree: number;
  readonly style: Style;
  readonly y?: number;
  readonly hauteur?: number;
}> = ({ fichier, duree, style, y, hauteur }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = unite(width, height);
  const { opacite, montee } = entreeSortie(frame, duree);
  const place = PLACE[style.format];
  return (
    <AbsoluteFill style={{ opacity: opacite }}>
      <div
        style={{
          position: "absolute",
          top: height * (y ?? place.haut) + montee * 0.02 * height,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Img
          src={staticFile(fichier)}
          style={{
            maxWidth: width * (style.format === "horizontal" ? 0.6 : 0.9),
            maxHeight: height * (hauteur ?? place.hauteurImageMax),
            objectFit: "contain",
            borderRadius: 22 * u,
            boxShadow: "0 14px 44px rgba(0,0,0,0.5)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Le logo d'un outil quand la personne le nomme : le logo arrive, puis son nom
// glisse de derrière lui.
export const Logo: React.FC<{
  readonly fichier: string;
  readonly nom: string;
  readonly duree: number;
  readonly style: Style;
  readonly y?: number;
}> = ({ fichier, nom, duree, style, y }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = unite(width, height);
  const { opacite } = entreeSortie(frame, duree);
  const glisse = interpolate(frame, [10, 22], [0, 1], { easing: EASE_OUT, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taille = 120 * u;
  return (
    <AbsoluteFill style={{ opacity: opacite }}>
      <div
        style={{
          position: "absolute",
          top: height * (y ?? PLACE[style.format].titreY) - taille / 2,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 24 * u * glisse,
        }}
      >
        <Img
          src={staticFile(fichier)}
          style={{ width: taille, height: taille, objectFit: "contain", borderRadius: 26 * u, filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.45))" }}
        />
        <div
          style={{
            overflow: "hidden",
            maxWidth: width * 0.6 * glisse,
            whiteSpace: "nowrap",
            fontFamily: POLICES[style.sousTitres.police] ?? POLICES.Montserrat,
            fontWeight: 800,
            fontSize: 84 * u,
            color: "#fff",
            textShadow: OMBRE,
            opacity: glisse,
          }}
        >
          {nom}
        </div>
      </div>
    </AbsoluteFill>
  );
};
