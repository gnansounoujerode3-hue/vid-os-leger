import { Audio } from "@remotion/media";
import React from "react";
import { Sequence, staticFile } from "remotion";

// Les bruitages fournis (fabriqués en code, libres de droits). Volumes réglés
// pour passer sous une voix à -14 LUFS, le niveau que preparer.mjs donne au rush.
// Un son à toi : dépose un .wav ou .mp3 dans 3-assets/sons/, et donne son nom
// (sans extension) dans le champ "son" d'un effet.
export const SONS: Record<string, number> = {
  woosh: 0.7,
  swipe: 0.5,
  pop: 0.55,
  tap: 0.5,
  click: 0.45,
  ding: 0.32,
  riser: 0.7,
  impact: 0.77,
};

export const Son: React.FC<{
  readonly nom: string | null | undefined;
  readonly at?: number;
  readonly actif: boolean;
}> = ({ nom, at = 0, actif }) => {
  if (!actif || !nom) return null;
  const fichier = nom.includes(".") ? nom : `${nom}.wav`;
  const volume = SONS[nom] ?? 0.6;
  return (
    <Sequence from={at} layout="none" name={`son ${nom}`}>
      <Audio src={staticFile(`sons/${fichier}`)} volume={volume} />
    </Sequence>
  );
};
