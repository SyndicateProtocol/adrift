import { useAccount } from "@getpara/react-sdk"
import { useQuery } from "@tanstack/react-query"
import type { Address } from "viem"
import { usePlayer } from "./usePlayer"

export function useHasJoinedGame() {
  const { embedded } = useAccount()
  const { data: playerData } = usePlayer(
    embedded?.wallets?.[0]?.address as Address
  )

  return useQuery({
    queryKey: ["hasJoinedGame", embedded?.wallets?.[0]?.address],
    enabled: Boolean(playerData?.data),
    queryFn: () => {
      return embedded?.isConnected && !!playerData?.data?.address
    },
    staleTime: 60 * 1000
  })
}
