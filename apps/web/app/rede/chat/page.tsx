import { Header } from "@/components/header"
import { ChatView } from "@/components/rede/chat-view"

export const metadata = {
  title: "Chat",
}

export default function ChatPage() {
  return (
    <div className="min-h-screen">
      <Header title="Chat" subtitle="Mensagens entre médicos" />
      <div className="p-4 lg:p-8">
        <ChatView />
      </div>
    </div>
  )
}
