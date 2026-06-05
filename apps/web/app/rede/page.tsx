import { Header } from "@/components/header"
import { Feed } from "@/components/rede/feed"
import { Sugestoes } from "@/components/rede/sugestoes"
import { ComunidadesList } from "@/components/rede/comunidades-list"
import { BotaoAdmin } from "@/components/rede/botao-admin"
import { OnlineAgora } from "@/components/rede/online-agora"

export const metadata = {
  title: "Comunidade",
}

export default function RedePage() {
  return (
    <div className="min-h-screen">
      <Header title="Comunidade" subtitle="Rede de médicos verificados" />
      <div className="mx-auto grid max-w-5xl gap-6 p-8 lg:grid-cols-[1fr_280px]">
        <Feed />
        <aside className="hidden space-y-5 lg:block">
          <BotaoAdmin />
          <OnlineAgora />
          <Sugestoes />
          <ComunidadesList />
        </aside>
      </div>
    </div>
  )
}
