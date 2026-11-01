import type { Metadata } from "next";
import { Overlay } from "@/features/live/components/overlay";
import { DEMO_CID, extractChannelId, settingsFromSearch } from "@/features/live/settings";

export const metadata: Metadata = { title: "Stopix Live", robots: { index: false } };

type Props = {
  params: Promise<{ cid: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Fonte de navegador: sem login (o código do canal vai na URL).
export default async function OverlayPage({ params, searchParams }: Props) {
  const { cid } = await params;
  if (cid !== DEMO_CID && !extractChannelId(cid)) {
    return (
      <p className="m-6 rounded-xl bg-panel p-4 text-center">
        Código de canal inválido. Gere o link de novo no painel do Stopix.
      </p>
    );
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") search.set(key, value);
  }
  const settings = settingsFromSearch(cid, search);
  return (
    <>
      {settings.background === "transparent" ? (
        <style>{"html,body{background:transparent!important;}"}</style>
      ) : null}
      <Overlay settings={settings} />
    </>
  );
}
