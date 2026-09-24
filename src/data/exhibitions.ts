import type { LocalizedText } from "./types";

export interface ExhibitionEntry {
  id: string;
  year: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
}
