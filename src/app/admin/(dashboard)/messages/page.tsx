import { getMessages } from "./actions";
import { MessagesInbox } from "./MessagesInbox";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const { open } = await searchParams;
  const messages = await getMessages();

  return <MessagesInbox messages={messages} initialOpenId={open ?? null} />;
}
