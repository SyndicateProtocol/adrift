import { useAccount } from "@getpara/react-sdk"
import type { Address } from "viem"
import { usePlayer } from "./usePlayer"

export function useMe() {
  const { embedded } = useAccount()
  const { data: playerData } = usePlayer(
    embedded?.wallets?.[0]?.address as Address
  )

  return playerData?.data
}
