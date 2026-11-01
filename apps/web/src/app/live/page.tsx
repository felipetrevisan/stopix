import { redirect } from "next/navigation";

// O painel do streamer fica na página inicial.
export default function LivePage() {
  redirect("/");
}
