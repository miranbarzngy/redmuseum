import { HomePage } from "@/components/HomePage";

// Paintings/exhibitions/gallery come from Supabase; re-fetch at most once a
// minute so admin edits show up promptly without hitting the DB on every
// request. Admin mutations also call revalidatePath for immediate updates.
export const revalidate = 60;

export default function Page() {
  return <HomePage />;
}
