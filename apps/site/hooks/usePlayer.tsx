import { useQuery } from "@tanstack/react-query"

import type { Player } from "@/types"
import { API_URL } from "@/utils/constants"
import type { Address } from "viem"

export interface PlayerResponse {
  data: Player | null
}

export const PLAYER_QUERY_KEY = "player"

export function usePlayer(playerAddress?: Address | null) {
  return useQuery<PlayerResponse>({
    queryKey: [PLAYER_QUERY_KEY, playerAddress],
    enabled: !!playerAddress,
    queryFn: () =>
      fetch(`${API_URL}/player/${playerAddress}`).then(
        (res) => res.json() as Promise<PlayerResponse>
      )
  })
}
