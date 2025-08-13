import { useDurationTimer } from "@/hooks/useDurationTimer"
import { useHasJoinedGame } from "@/hooks/useHasJoinedGame"

import { useAccount } from "@getpara/react-sdk"
import { formatDuration } from "date-fns"
import { IconWithTitle } from "../IconWithTitle"
import { Anchor } from "../sprites/Anchor"

export function OpenStatus(props: {
  gameStartsTimestamp: string
}) {
  const { gameStartsTimestamp } = props
  const isGameStarted = Number(gameStartsTimestamp) < Number(Date.now() / 1000)
  const { data: hasJoined } = useHasJoinedGame()
  const { isConnected } = useAccount()

  return (
    <>
      <div className="text-center flex flex-col items-center justify-center p-4 flex-1">
        <IconWithTitle
          icon={Anchor}
          title={hasJoined ? "Ship boarded" : "Ship boarding"}
        />
        {hasJoined && <p className="text-sm">You're onboard!</p>}
        {!hasJoined && !isConnected && (
          <p className="text-sm">Sign in to board.</p>
        )}
        {!hasJoined && isConnected && (
          <p className="text-sm">Raise your flag to board.</p>
        )}
      </div>

      {!isGameStarted && (
        <GameCountdown gameStartsTimestamp={gameStartsTimestamp} />
      )}
    </>
  )
}

function GameCountdown(props: {
  gameStartsTimestamp: string
}) {
  const { gameStartsTimestamp } = props
  const isGameStarted = Number(gameStartsTimestamp) < Number(Date.now() / 1000)
  const timeUntilGameStarts = useDurationTimer(gameStartsTimestamp)

  return (
    <div className="px-4 py-2 border-t border-t-foreground">
      <p className="text-xs italic text-center">
        Ship sets sail in{" "}
        {formatDuration(timeUntilGameStarts, {
          delimiter: ", ",
          zero: true
        })}
      </p>
    </div>
  )
}
