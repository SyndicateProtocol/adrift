import { useMe } from "@/hooks/useMe"
import { formatDuration } from "date-fns"
import { IconWithTitle } from "../IconWithTitle"
import { Skull } from "../sprites/Skull"

export function SankStatus() {
  const me = useMe()

  const duration = me
    ? formatDuration(
        {
          hours: Math.floor(Number(me.totalActiveMinutes) / 60),
          minutes: Number(me.totalActiveMinutes) % 60
        },
        {
          format: ["hours", "minutes"],
          zero: false
        }
      )
    : 0

  return (
    <div className="text-center flex flex-col items-center justify-center p-4 flex-1">
      <IconWithTitle icon={Skull} title="Your ship sank" />
      <p className="text-sm">
        You braved the open seas for {duration || "0 minutes"}
      </p>
    </div>
  )
}
