import { Easing, interpolate } from "remotion";
import type { Format } from "../types";

export const EASE_OUT = Easing.out(Easing.cubic);
export const FONDU = 12; // images d'apparition

/** Où se placent les éléments, en fraction de l'image, selon le format. */
export const PLACE: Record<
  Format,
  { haut: number; chiffreY: number; titreY: number; iconeY: number; largeurCarte: number; hauteurImageMax: number }
> = {
  vertical: { haut: 0.075, chiffreY: 0.16, titreY: 0.17, iconeY: 0.76, largeurCarte: 0.86, hauteurImageMax: 0.3 },
  horizontal: { haut: 0.07, chiffreY: 0.2, titreY: 0.16, iconeY: 0.62, largeurCarte: 0.5, hauteurImageMax: 0.5 },
  carre: { haut: 0.06, chiffreY: 0.16, titreY: 0.15, iconeY: 0.66, largeurCarte: 0.8, hauteurImageMax: 0.36 },
};

/** Entrée (fondu + montée) puis sortie, pour un élément affiché `duree` images. */
export const entreeSortie = (frame: number, duree: number, sortie = 8) => {
  const entree = interpolate(frame, [0, FONDU], [0, 1], {
    easing: EASE_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fin = interpolate(frame, [duree - sortie, duree], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacite: Math.min(entree, fin), montee: 1 - entree };
};

/** Unité de taille : 1 sur une vidéo verticale 1080 de large. */
export const unite = (width: number, height: number) => Math.min(width, height) / 1080;

export const OMBRE = "0 4px 18px rgba(0,0,0,0.55)";
