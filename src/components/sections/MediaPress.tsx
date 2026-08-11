import { getPressItems, getPressCategories } from "@/lib/data/press";
import { MediaPressClient } from "./MediaPressClient";

export async function MediaPress() {
  const [items, categories] = await Promise.all([getPressItems(), getPressCategories()]);
  return <MediaPressClient items={items} categories={categories} limit={6} />;
}
