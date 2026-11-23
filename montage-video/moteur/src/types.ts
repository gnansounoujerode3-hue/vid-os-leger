// Le format de montage.json, le fichier que Claude écrit pour chaque vidéo.
// Tous les temps sont en SECONDES DU RUSH (la vidéo brute), comme dans
// transcription.txt. Le moteur les recale tout seul après les coupes.

export type Format = "vertical" | "horizontal" | "carre";

export type ModeSousTitres = "boite" | "karaoke" | "phrase" | "aucun";

export type Style = {
  format: Format;
  sousTitres: {
    mode: ModeSousTitres;
    /** Centre de la ligne, en fraction de la hauteur (0.62 = 62 %). */
    position: number;
    police: "Montserrat" | "Inter" | "Poppins" | "Bebas Neue";
    /** Nombre de mots affichés en même temps. */
    maxMots: number;
    majuscules: boolean;
  };
  /** Couleur principale (hex). */
  couleur: string;
  /** Couleur du texte posé sur la couleur principale. */
  texteSurCouleur: string;
  coupes: "dynamique" | "naturel" | "aucune";
  zooms: "cycle" | "coupes" | "mots" | "aucun";
  effets: Array<"chiffres" | "icones" | "listes" | "images">;
  sons: "bruitages+musique" | "bruitages" | "musique" | "aucun";
  look: "naturel" | "moody" | "chaud" | "noir-blanc";
  /** Langue parlée, trouvée à la transcription ("fr", "en"...). */
  langue?: string;
};

export type Mot = { t: string; debut: number; fin: number };

type Base = {
  debut: number;
  fin?: number;
  /** null : aucun son. Un nom : ce son à la place du son par défaut. */
  son?: string | null;
  /** Hauteur dans l'image (0 = en haut, 1 = en bas), pour ne pas cacher le visage. */
  y?: number;
};

export type Effet =
  | (Base & { type: "titre"; texte: string })
  | (Base & {
      type: "chiffre";
      valeur: number;
      decimales?: number;
      prefixe?: string;
      suffixe?: string;
      legende?: string;
    })
  | (Base & { type: "icone"; icone: string })
  | (Base & {
      type: "liste";
      titre?: string;
      items: Array<{ texte: string; coche: number }>;
    })
  | (Base & { type: "image"; fichier: string; /** hauteur max, en fraction de l'image */ hauteur?: number })
  | (Base & { type: "logo"; fichier: string; nom: string })
  | (Base & { type: "zoom"; force?: number });

export type Montage = {
  fps: number;
  /** Nom du rush dans le dossier media du projet. */
  rush: string;
  dureeRushS: number;
  /** Cadrage quand le rush n'a pas le format de sortie : centre en %. */
  cadrage: { x: number; y: number };
  /** Parties gardées du rush, dans l'ordre : [début, fin] en secondes. */
  segments: Array<[number, number]>;
  mots: Mot[];
  style: Style;
  effets: Effet[];
  musique: { fichier: string; volume: number } | null;
};

export const DIMENSIONS: Record<Format, { width: number; height: number }> = {
  vertical: { width: 1080, height: 1920 },
  horizontal: { width: 1920, height: 1080 },
  carre: { width: 1080, height: 1080 },
};
