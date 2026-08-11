import type { LocalizedText } from "./types";

export interface ExhibitionEntry {
  id: string;
  year: string;
  title: LocalizedText;
  description: LocalizedText;
}
