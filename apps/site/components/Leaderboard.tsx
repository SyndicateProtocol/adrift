"use client"
import { isPlayerActive } from "@/hooks/useDidMissCheckIn"
import { type LeaderboardPlayer, useLeaderboard } from "@/hooks/useLeaderboard"
import { useMe } from "@/hooks/useMe"
import { cn } from "@/utils/cn"
import { truncateAddress } from "@/utils/helpers"
import {
  differenceInHours,
  formatDistanceToNowStrict,
  fromUnixTime
} from "date-fns"
import { Star } from "./sprites/Star"
import { Winner } from "./sprites/Winner"

export function Leaderboard() {
  const { data, isLoading } = useLeaderboard()

  return (
    <section className="border border-foreground rounded-md flex-1 flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-b-foreground justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4" />
          <h2 className="font-bold text-sm">Leaderboard</h2>
        </div>
        <p className="text-sm font-light text-forground italic flex items-center gap-1">
          <span className="text-foreground">
            {data?.totalActivePlayers?.toLocaleString()}
          </span>
          <span className="text-foreground/50">/</span>
          <span className="text-foreground/50">
            {data?.totalPlayers?.toLocaleString()}
          </span>
          <span className="ml-0.5">sailors remain</span>
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 px-3 py-2 grow">
          <p className="text-sm text-forground italic text-center">
            Loading...
          </p>
        </div>
      )}

      {data && data?.totalPlayers === 0 && (
        <div className="flex items-center justify-center gap-2 px-3 py-2">
          <p className="text-sm font-light text-foreground italic text-center">
            No sailors yet
          </p>
        </div>
      )}

      {data && data?.totalPlayers > 0 && (
        <LeaderboardList
          players={data.topPlayers}
          gameStartTimestamp={data.gameStartTimestamp}
          gameEndTimestamp={data.gameEndTimestamp}
        />
      )}
    </section>
  )
}

type LeaderboardListProps = {
  players: LeaderboardPlayer[]
  gameStartTimestamp: string
  gameEndTimestamp: string | null
}

function LeaderboardList(props: LeaderboardListProps) {
  const { players, gameStartTimestamp, gameEndTimestamp } = props
  const sortedPlayers = sortPlayers(players, gameStartTimestamp)
  const me = useMe()
  return (
    <div className="overflow-y-auto grow sm:h-0 h-80">
      {sortedPlayers.map((player) => (
        <div
          key={player.address}
          className={cn(
            "flex gap-2 px-3 py-0.5 justify-between",
            !isPlayerActive(player) && !player.isWinner && "opacity-50",
            player.isWinner && "font-bold",
            player.address === me?.address && "text-background bg-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            {hasGameStarted(gameStartTimestamp) && (
              <span>
                {player.position === "winner" && <Winner className="w-5" />}
              </span>
            )}
            <span>{truncateAddress(player.address)}</span>
          </div>
          <p
            className={cn(
              "text-sm text-foreground leading-7",
              player.address === me?.address && "text-background"
            )}
          >
            {hasGameStarted(gameStartTimestamp)
              ? player.isArchived
                ? `Capsized After ${calculateHoursAtSea(
                    player,
                    gameStartTimestamp,
                    gameEndTimestamp
                  )}h`
                : `${isPlayerActive(player) || player.isWinner ? "Sailing For" : "Capsized After"} ${calculateHoursAtSea(
                    player,
                    gameStartTimestamp,
                    gameEndTimestamp
                  )}h`
              : `On Deck ${formatDistanceToNowStrict(
                  fromUnixTime(Number(player.registeredAtTimestamp)),
                  { unit: "hour" }
                )
                  .replace(/hours?/g, "h")
                  .replace(" ", "")}`}
          </p>
        </div>
      ))}
    </div>
  )
}

function hasGameStarted(gameStartTimestamp?: string) {
  if (!gameStartTimestamp) return false
  return Number(gameStartTimestamp) < Date.now() / 1000
}

function calculateHoursAtSea(
  player: LeaderboardPlayer,
  gameStartTimestamp: string,
  gameEndTimestamp?: string | null
) {
  // For archived players, use their archived game timestamps
  if (player.isArchived && player.archivedGameStartTimestamp) {
    const archivedGameStart = fromUnixTime(
      Number(player.archivedGameStartTimestamp)
    )

    if (player.isWinner && player.archivedGameEndTimestamp) {
      // Winner sailed until the end of archived game
      return differenceInHours(
        fromUnixTime(Number(player.archivedGameEndTimestamp)),
        archivedGameStart
      )
    } else {
      // Use lastActiveTimestamp from archived game
      const timestamp =
        player.lastActiveTimestamp && player.lastActiveTimestamp !== "1"
          ? player.lastActiveTimestamp
          : player.nextCheckinTimestamp

      return differenceInHours(
        fromUnixTime(Number(timestamp)),
        archivedGameStart
      )
    }
  }

  // Original logic for current players
  const gameStart = fromUnixTime(Number(gameStartTimestamp))
  if (!isPlayerActive(player)) {
    // Use lastActiveTimestamp if it exists and isn't "1", otherwise use nextCheckinTimestamp (first expected check-in)
    const timestamp =
      player.lastActiveTimestamp && player.lastActiveTimestamp !== "1"
        ? player.lastActiveTimestamp
        : player.nextCheckinTimestamp

    return differenceInHours(fromUnixTime(Number(timestamp)), gameStart)
  }
  if (gameEndTimestamp && player.isWinner) {
    return differenceInHours(fromUnixTime(Number(gameEndTimestamp)), gameStart)
  }
  if (!hasGameStarted(gameStartTimestamp)) {
    return 0
  }
  // For active players who have started sailing, duration is from game start to now
  // But if they haven't made their first check-in yet, they have 0 sailing time
  if (!player.lastCheckinTimestamp) {
    return 0
  }
  return differenceInHours(Date.now(), gameStart)
}

function sortPlayers(players: LeaderboardPlayer[], gameStartTimestamp: string) {
  // Sort all players by sailing time (descending - longest time first)
  const sortedByTime = [...players].sort((a, b) => {
    const aDuration = calculateHoursAtSea(a, gameStartTimestamp) ?? 0
    const bDuration = calculateHoursAtSea(b, gameStartTimestamp) ?? 0
    return bDuration - aDuration
  })

  // Assign positions based on sailing time ranking
  const sortedPlayers = sortedByTime.map((player, index) => ({
    ...player,
    position: player.isWinner ? "winner" : index + 1
  }))

  return sortedPlayers
}
