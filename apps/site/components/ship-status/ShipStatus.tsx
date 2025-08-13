"use client"

import { useDidMissCheckIn } from "@/hooks/useDidMissCheckIn"
import { useHasJoinedGame } from "@/hooks/useHasJoinedGame"
import { useMe } from "@/hooks/useMe"

import { useIsWinner } from "@/hooks/useIsWinner"
import { type GameData, useLeaderboard } from "@/hooks/useLeaderboard"
import { isPlayerWithinGracePeriod } from "@/utils/helpers"
import { useState } from "react"
import { Circle } from "../sprites/Circle"
import { FinishedStatus } from "./FinishedStatus"
import { InProgressStatus } from "./InProgressStatus"
import { OpenStatus } from "./OpenStatus"
import { SankStatus } from "./SankStatus"
import { WonStatus } from "./WonStatus"

export function ShipStatus() {
  const { data: leaderboardData, isLoading: isLeaderboardLoading } =
    useLeaderboard()
  const [isCheckingIn, setIsCheckingIn] = useState(false)

  return (
    <section className="flex flex-col border border-foreground rounded-md flex-1">
      <div className="font-bold text-sm px-3 py-2 border-b border-b-foreground flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Circle className="w-4" />

          <h2 className="text-sm">Ship Status</h2>
        </div>
        <p className="text-sm font-light text-forground italic">
          {leaderboardData && (
            <StatusText
              gameData={leaderboardData}
              isCheckingIn={isCheckingIn}
            />
          )}
        </p>
      </div>

      {isLeaderboardLoading && (
        <div className="flex items-center justify-center gap-2 px-3 py-2">
          <p className="text-sm text-foreground italic text-center">
            Loading...
          </p>
        </div>
      )}

      {leaderboardData && (
        <Status
          gameData={leaderboardData}
          onCheckInStart={() => {
            setIsCheckingIn(true)
          }}
          onCheckInEnd={() => {
            setIsCheckingIn(false)
          }}
        />
      )}
    </section>
  )
}

function StatusText({
  gameData,
  isCheckingIn
}: { gameData: GameData; isCheckingIn: boolean }) {
  const { data: hasJoined } = useHasJoinedGame()
  const didMissCheckIn = useDidMissCheckIn()
  const me = useMe()
  const isWinner = useIsWinner()
  const isWithinGracePeriod = isPlayerWithinGracePeriod(
    me,
    Number(gameData.gracePeriod)
  )

  if (me?.isDisqualified || didMissCheckIn) {
    return "Sank"
  }

  if (isWinner) {
    return "Winner"
  }

  switch (gameData.status) {
    case "open":
      return hasJoined ? "Boarded" : "Boarding"
    case "inProgress":
      return isWithinGracePeriod
        ? "Needs Repair"
        : isCheckingIn
          ? "Repairing"
          : "Sailing"
    case "finished":
      return "Docked"
    default:
      return ""
  }
}

function Status({
  gameData,
  onCheckInStart,
  onCheckInEnd
}: {
  gameData: GameData
  onCheckInStart: () => void
  onCheckInEnd: () => void
}) {
  const didMissCheckIn = useDidMissCheckIn()
  const me = useMe()
  const isWinner = useIsWinner()
  const { data: hasJoined } = useHasJoinedGame()

  if (didMissCheckIn || me?.isDisqualified) {
    return <SankStatus />
  }

  if (isWinner) {
    return <WonStatus />
  }

  if (!hasJoined) {
    return <OpenStatus gameStartsTimestamp={gameData.gameStartTimestamp} />
  }

  switch (gameData.status) {
    case "open":
      return <OpenStatus gameStartsTimestamp={gameData.gameStartTimestamp} />
    case "inProgress":
      return (
        <InProgressStatus
          onCheckInStart={onCheckInStart}
          onCheckInEnd={onCheckInEnd}
        />
      )
    case "finished":
      return <FinishedStatus gameData={gameData} />
    default:
      return null
  }
}
