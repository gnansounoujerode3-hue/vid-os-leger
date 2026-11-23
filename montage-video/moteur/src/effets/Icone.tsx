import { icons, type LucideIcon } from "lucide-react";
import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Style } from "../types";
import { PLACE, entreeSortie, unite } from "./commun";

// Une icône qui surgit sur un mot concret (argent, temps, danger...), sur la
// poitrine, jamais sur le visage. Icônes Lucide : https://lucide.dev/icons
// Le nom s'écrit comme sur le site : "wallet", "shield-alert", "clock".

const versNomLucide = (nom: string) =>
  nom
    .trim()
    .split(/[-_\s]+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");

export const trouverIcone = (nom: string): LucideIcon | null =>
  (icons as Record<string, LucideIcon>)[versNomLucide(nom)] ?? null;

export const Icone: React.FC<{ readonly icone: string; readonly duree: number; readonly style: Style; readonly y?: number }> = ({
  icone,
  duree,
  style,
  y,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const u = unite(width, height);
  const Composant = trouverIcone(icone);
  const { opacite } = entreeSortie(frame, duree, 6);
  const pop = spring({ frame, fps, config: { damping: 11, stiffness: 180 } });
  if (!Composant) return null;
  const taille = 150 * u;
  // Sous les sous-titres ; au-dessus quand les sous-titres sont déjà en bas.
  const base = PLACE[style.format].iconeY;
  const ligne = style.sousTitres.mode === "aucun" ? 0 : style.sousTitres.position;
  const centre = y ?? (ligne >= base - 0.05 ? ligne - 0.15 : base);

  return (
    <AbsoluteFill style={{ opacity: opacite }}>
      <div
        style={{
          position: "absolute",
          top: height * centre - taille / 2,
          left: width / 2 - taille / 2,
          width: taille,
          height: taille,
          borderRadius: "50%",
          background: "rgba(10,10,12,0.82)",
          border: `${5 * u}px solid ${style.couleur}`,
          boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${pop})`,
        }}
      >
        <Composant size={taille * 0.52} color={style.couleur} strokeWidth={2.2} />
      </div>
    </AbsoluteFill>
  );
};
