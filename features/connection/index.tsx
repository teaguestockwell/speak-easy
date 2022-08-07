import { ChatProvider } from "./chat-provider"
import { SelfProvider } from "./self-provider"

export const Connection = () => {
  return (
    <SelfProvider>
      <ChatProvider />
    </SelfProvider>
  )
}