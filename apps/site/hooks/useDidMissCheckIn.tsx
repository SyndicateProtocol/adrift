import type { Player } from "@/types"
import { useMe } from "./useMe"

export function useDidMissCheckIn() {
  const me = useMe()
  return didPlayerMissCheckIn(me)
}

export function didPlayerMissCheckIn(
  player?: Pick<Player, "nextCheckinTimestamp"> | null
) {
  if (!player) return false
  return new Date(Number(player.nextCheckinTimestamp) * 1000) < new Date()
}

export function isPlayerActive(
  player?: Pick<Player, "isDisqualified" | "nextCheckinTimestamp"> | null
) {
  if (!player) return false
  return !player.isDisqualified && !didPlayerMissCheckIn(player)
}
