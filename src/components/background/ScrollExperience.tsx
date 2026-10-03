import { getSiteProfile } from "@/lib/data/profile";
import { backgroundImageUrls } from "@/lib/backgroundDefaults";
import { PaintCanvas } from "./PaintCanvas";

export async function ScrollExperience({ children }: { children: React.ReactNode }) {
  const profile = await getSiteProfile();

  return (
    <>
      <PaintCanvas pieces={backgroundImageUrls(profile)} />
      <div className="relative">{children}</div>
    </>
  );
}
