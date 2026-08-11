import { getBiographyIntro, getBiographyBlocks } from "@/lib/data/biography";
import { BiographyClient } from "./BiographyClient";

export async function Biography() {
  const [intro, blocks] = await Promise.all([getBiographyIntro(), getBiographyBlocks()]);

  return <BiographyClient intro={intro} blocks={blocks} />;
}
