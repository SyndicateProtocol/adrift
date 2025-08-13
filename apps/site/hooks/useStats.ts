import { stats as hardcodedStats } from "@/data/stats"
import { API_URL } from "@/utils/constants"
import { useQuery } from "@tanstack/react-query"

interface StatsResponse {
  data: {
    players: number
    checkins: number
    playerRegistrationFees: bigint
    checkInFees: bigint
    dqCount: number
    dqFees: bigint
  } | null
}

export interface CombinedStats {
  transactions: number
  players: number
  playerRegistrationFees: bigint
  checkins: number
  checkinFees: bigint
  dqCount: number
  dqFees: bigint
}

export const STATS_QUERY_KEY = "stats"

export function useStats() {
  return useQuery({
    queryKey: [STATS_QUERY_KEY],
    queryFn: () =>
      fetch(`${API_URL}/stats`).then(
        (res) => res.json() as Promise<StatsResponse>
      ),
    select: (data): CombinedStats => {
      const apiStats = data.data
      const hardcodedTransactions =
        hardcodedStats.checkins +
        hardcodedStats.dqCount +
        hardcodedStats.players

      if (!apiStats) {
        // If no API data, return just hardcoded stats
        return {
          transactions: hardcodedTransactions,
          players: hardcodedStats.players,
          playerRegistrationFees: hardcodedStats.playerRegistrationFees,
          checkins: hardcodedStats.checkins,
          checkinFees: hardcodedStats.checkinFees,
          dqCount: hardcodedStats.dqCount,
          dqFees: hardcodedStats.dqFees
        }
      }

      // Combine hardcoded stats with API stats
      return {
        transactions:
          hardcodedTransactions +
          apiStats.checkins +
          apiStats.dqCount +
          apiStats.players,
        players: hardcodedStats.players + apiStats.players,
        playerRegistrationFees:
          hardcodedStats.playerRegistrationFees +
          BigInt(apiStats.playerRegistrationFees),
        checkins: hardcodedStats.checkins + apiStats.checkins,
        checkinFees: hardcodedStats.checkinFees + BigInt(apiStats.checkInFees),
        dqCount: hardcodedStats.dqCount + apiStats.dqCount,
        dqFees: hardcodedStats.dqFees + BigInt(apiStats.dqFees)
      }
    },
    refetchIntervalInBackground: true,
    refetchInterval: 120 * 1000, // 2 minutes
    staleTime: 120 * 1000, // 2 minutes
    gcTime: 300 * 1000, // 5 minutes
    notifyOnChangeProps: ["data", "error", "isLoading"]
  })
}
