import React from "react";
import { AbsoluteFill } from "remotion";
import type { Style } from "../types";

// Le look de la vidéo : un filtre sur l'image filmée seulement, jamais sur
// les textes ni les graphiques.
export const filtreLook = (look: Style["look"]): string | undefined => {
  switch (look) {
    case "moody":
      return "contrast(1.08) saturate(0.82) brightness(0.93)";
    case "chaud":
      return "sepia(0.16) saturate(1.18) contrast(1.04) brightness(1.02)";
    case "noir-blanc":
      return "grayscale(1) contrast(1.12) brightness(0.98)";
    default:
      return undefined;
  }
};

/** Le vignettage du look moody et du noir et blanc : les bords s'assombrissent. */
export const Vignette: React.FC<{ readonly look: Style["look"] }> = ({ look }) => {
  if (look !== "moody" && look !== "noir-blanc") return null;
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.5) 100%)",
        pointerEvents: "none",
      }}
    />
  );
};
