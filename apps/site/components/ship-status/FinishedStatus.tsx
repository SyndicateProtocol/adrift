import type { GameData } from "@/hooks/useLeaderboard"
import { formatDuration } from "date-fns"
import { IconWithTitle } from "../IconWithTitle"
import { Moon } from "../sprites/Moon"

export function FinishedStatus(props: {
  gameData: GameData
}) {
  const { gameData } = props
  const gameLengthSeconds =
    Number(gameData.gameEndTimestamp) - Number(gameData.gameStartTimestamp)

  const days = Math.floor(gameLengthSeconds / 86400)
  const hours = Math.floor((gameLengthSeconds % 86400) / 3600)
  const minutes = Math.floor((gameLengthSeconds % 3600) / 60)
  const seconds = gameLengthSeconds % 60

  let formattedDuration = ""
  if (days > 0) {
    formattedDuration = formatDuration({ days, hours })
  } else if (hours > 0) {
    formattedDuration = formatDuration({ hours, minutes })
  } else if (minutes > 0) {
    formattedDuration = formatDuration({ minutes, seconds })
  } else {
    formattedDuration = formatDuration({ seconds })
  }

  return (
    <div className="text-center flex flex-col items-center justify-center p-4 flex-1">
      <IconWithTitle icon={Moon} title="Voyage has been completed" />
      <p className="text-sm">
        {gameData.totalPlayers} ships braved the open seas for{" "}
        {formattedDuration}
      </p>
    </div>
  )
}
