import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/lilita-one/400.css";
import "@fontsource-variable/nunito/wght.css";
import "./styles.css";

export const metadata: Metadata = {
  applicationName: "Stopix",
  title: "Stopix — o Stop/Adedonha que o chat da sua live joga",
  description:
    "Jogo interativo para lives do TikTok e da Twitch: sorteia categoria e letra, o chat responde e ganha pontos. Integrado ao Neon Live Labs.",
};

export const viewport: Viewport = {
  themeColor: "#12082a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
