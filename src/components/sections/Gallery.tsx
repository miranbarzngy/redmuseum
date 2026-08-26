import { getGalleryGroups } from "@/lib/data/gallery";
import { GalleryClient } from "./GalleryClient";

export async function Gallery() {
  const groups = await getGalleryGroups();
  return <GalleryClient groups={groups} />;
}
