// app/fonts.ts
import { Birthstone, Delius, Cherry_Bomb_One, Nunito } from "next/font/google";

export const birthstone = Birthstone({
  subsets: ["latin"],
  weight: "400",
});

export const delius = Delius({
  subsets: ["latin"],
  weight: "400",
});

export const cherryBomb = Cherry_Bomb_One({
  subsets: ["latin"],
  weight: "400",
});

// base sans font for general text + footer
export const sans = Nunito({
  subsets: ["latin"],
  weight: ["400", "600"],
});
