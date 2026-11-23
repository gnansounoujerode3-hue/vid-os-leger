import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { Montage } from "./Montage";
import { construireSegments, dureeTotale } from "./timeline";
import { DIMENSIONS, type Montage as MontageProps } from "./types";

// Valeurs vides : le vrai montage arrive par --props (outils/rendu.mjs).
const VIDE: MontageProps = {
  fps: 30,
  rush: "",
  dureeRushS: 1,
  cadrage: { x: 50, y: 40 },
  segments: [],
  mots: [],
  effets: [],
  musique: null,
  style: {
    format: "vertical",
    sousTitres: { mode: "boite", position: 0.62, police: "Montserrat", maxMots: 3, majuscules: false },
    couleur: "#FFD400",
    texteSurCouleur: "#111111",
    coupes: "naturel",
    zooms: "cycle",
    effets: ["chiffres", "icones", "listes", "images"],
    sons: "bruitages",
    look: "naturel",
  },
};

const metadonnees: CalculateMetadataFunction<MontageProps> = ({ props }) => {
  const segs = construireSegments(props);
  const { width, height } = DIMENSIONS[props.style.format] ?? DIMENSIONS.vertical;
  return { durationInFrames: Math.max(1, dureeTotale(segs)), fps: props.fps, width, height };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Montage"
    component={Montage}
    defaultProps={VIDE}
    calculateMetadata={metadonnees}
    durationInFrames={30}
    fps={30}
    width={1080}
    height={1920}
  />
);
