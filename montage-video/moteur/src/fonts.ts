// Polices Google (licence libre), chargées au rendu. Une connexion internet suffit.
import { loadFont as bebas } from "@remotion/google-fonts/BebasNeue";
import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { loadFont as montserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as poppins } from "@remotion/google-fonts/Poppins";

const opts = { subsets: ["latin", "latin-ext"] as Array<"latin" | "latin-ext"> };

export const POLICES = {
  Montserrat: montserrat("normal", { weights: ["700", "800", "900"], ...opts }).fontFamily,
  Inter: inter("normal", { weights: ["600", "700", "800"], ...opts }).fontFamily,
  Poppins: poppins("normal", { weights: ["600", "700", "800"], ...opts }).fontFamily,
  "Bebas Neue": bebas("normal", { weights: ["400"], ...opts }).fontFamily,
} as const;

export type NomPolice = keyof typeof POLICES;
