import type { Metadata } from "next";
import { Panel } from "@/features/live/components/panel";

export const metadata: Metadata = {
  title: "Stopix Live — jogue Stop com o chat da sua live",
  description:
    "Overlay do Stopix para TikTok LIVE Studio, OBS e Streamlabs, integrado ao Neon Live Labs.",
};

export default function LivePage() {
  return <Panel />;
}
