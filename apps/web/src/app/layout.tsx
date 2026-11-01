import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/rubik/wght.css";
import "@fontsource-variable/rubik/wght-italic.css";
import "./styles.css";
import { MotionProvider } from "@/components/motion/motion-provider";

export const metadata: Metadata = {
  applicationName: "Stopix",
  title: "Stopix — o Stop/Adedonha que o chat da sua live joga",
  description:
    "Jogo interativo para lives do TikTok e da Twitch: sorteia categoria e letra, o chat responde e ganha pontos. Integrado ao Neon Live Labs.",
};

export const viewport: Viewport = {
  themeColor: "#070a1f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
