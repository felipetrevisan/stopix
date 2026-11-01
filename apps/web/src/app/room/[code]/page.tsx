import type { Metadata } from "next";
import { RoomScreen } from "@/features/party/components/room-screen";
import { normalizeCode } from "@/features/party/code";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Sala ${normalizeCode(code)} · Stopix`,
    description: "Entra aí: Stop (adedonha) online com os amigos.",
    robots: { index: false },
  };
}

export default async function RoomPage({ params }: Props) {
  const { code } = await params;
  return <RoomScreen code={normalizeCode(code)} />;
}
