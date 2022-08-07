import { SelfProvider } from "./self-provider"
import { PeerProvider } from "./peer-provider"

export const Connection = () => {
  return (
    <SelfProvider>
      <PeerProvider />
    </SelfProvider>
  )
}