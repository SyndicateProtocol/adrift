import { useLeaderboard } from "@/hooks/useLeaderboard"
import { differenceInHours } from "date-fns"
import { IconWithTitle } from "../IconWithTitle"
import { Winner } from "../sprites/Winner"

export function WonStatus() {
  const { data: gameData } = useLeaderboard()

  return (
    <div className="text-center flex flex-col items-center justify-center p-4 flex-1">
      <IconWithTitle icon={Winner} title="You won!" />
      {gameData && (
        <p className="text-sm">
          You braved the open seas for{" "}
          {differenceInHours(
            Number(gameData.gameEndTimestamp) * 1000,
            Number(gameData.gameStartTimestamp) * 1000
          )}{" "}
          hours and outlasted the other sailors
        </p>
      )}
    </div>
  )
}
