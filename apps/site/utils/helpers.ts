import { useLeaderboard } from "@/hooks/useLeaderboard"
import type { Player } from "@/types"

export const truncateAddress = (address: string): string => {
  if (address.length <= 12) return address
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

export const isPlayerWithinGracePeriod = (
  player?: Player | null,
  gracePeriodSeconds?: number | string
) => {
  if (!player) return false
  const nextCheckIn = Number(player.nextCheckinTimestamp)
  // If the next check-in time is in the future, check if we're within the grace period
  if (nextCheckIn > Date.now() / 1000) {
    const timeUntilCheckIn = nextCheckIn - Date.now() / 1000
    return timeUntilCheckIn <= Number(gracePeriodSeconds)
  }
  // If the next check-in time is in the past, they are not within grace period
  return false
}

export const useIsPlayerFirstCheckIn = (player?: Player | null) => {
  return (
    player?.lastCheckinTimestamp === null ||
    player?.lastCheckinTimestamp === undefined
  )
}

export const useTotalActivePlayers = () => {
  const { data: leaderboardData } = useLeaderboard()
  return leaderboardData?.totalActivePlayers
}

export const isStaging = () => {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
}

export const isProd = () => {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
}

export const isDev = () => {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === undefined
}
