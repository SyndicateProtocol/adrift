import { prodLeaderboard } from "@/data/leaderboard"
import type { Player } from "@/types"
import { API_URL } from "@/utils/constants"
import { useQuery } from "@tanstack/react-query"
import { fromUnixTime, isFuture, isPast } from "date-fns"
import type { Address } from "viem"

export type LeaderboardPlayer = Omit<
  Player,
  "checkins" | "isActive" | "totalActiveMinutes"
> & {
  isArchived?: boolean
  archivedGameStartTimestamp?: string
  archivedGameEndTimestamp?: string
}

interface LeaderboardResponse {
  data: {
    address: Address
    gameStartTimestamp: string
    gameEndTimestamp: string
    gracePeriod: string
    maxNextCheckInOutsideGracePeriod: string
    topPlayers: LeaderboardPlayer[]
    totalPlayers: number
    totalActivePlayers: number
  }
}

export type GameData = LeaderboardResponse["data"] & {
  status: GameStatus
}

export type GameStatus = "open" | "inProgress" | "finished"

function getStatus(
  gameStartTimestamp: string,
  gameEndTimestamp: string
): GameStatus {
  const gameStart = fromUnixTime(Number(gameStartTimestamp))

  if (isFuture(gameStart)) {
    return "open"
  }

  if (isPast(gameStart) && !gameEndTimestamp) {
    return "inProgress"
  }

  return "finished"
}

export const LEADERBOARD_QUERY_KEY = "leaderboard"

export function useLeaderboard() {
  return useQuery({
    queryKey: [LEADERBOARD_QUERY_KEY],
    queryFn: () =>
      fetch(`${API_URL}/leaderboard`).then(
        (res) => res.json() as Promise<LeaderboardResponse>
      ),
    select: (data) => {
      const status = getStatus(
        data.data.gameStartTimestamp,
        data.data.gameEndTimestamp
      )

      // Merge current API data with historical prod leaderboard data
      const archivedPlayers = prodLeaderboard.data.topPlayers.map((player) => ({
        ...player,
        isArchived: true,
        archivedGameStartTimestamp: prodLeaderboard.data.gameStartTimestamp,
        archivedGameEndTimestamp: prodLeaderboard.data.gameEndTimestamp
      }))

      const combinedTopPlayers = [...data.data.topPlayers, ...archivedPlayers]

      const combinedTotalPlayers =
        prodLeaderboard.data.totalPlayers + data.data.totalPlayers
      const combinedTotalActivePlayers =
        prodLeaderboard.data.totalActivePlayers + data.data.totalActivePlayers

      return {
        ...data.data,
        status,
        topPlayers: combinedTopPlayers,
        totalPlayers: combinedTotalPlayers,
        totalActivePlayers: combinedTotalActivePlayers
      }
    },
    refetchIntervalInBackground: true,
    refetchInterval: 120 * 1000, // Increased from 60s to 120s to reduce network requests
    staleTime: 120 * 1000, // Increased from 60s to 120s
    gcTime: 300 * 1000, // Add garbage collection time
    notifyOnChangeProps: ["data", "error", "isLoading"]
  })
}
