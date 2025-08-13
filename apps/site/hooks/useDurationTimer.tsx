import { type Duration, fromUnixTime, intervalToDuration } from "date-fns"
import { useCallback, useMemo, useState } from "react"
import { useInterval } from "./useInterval"

export function useDurationTimer(end?: number | string) {
  const endTime = useMemo(
    () => (end ? fromUnixTime(Number(end)) : new Date()),
    [end]
  )

  const [timeRemaining, setTimeRemaining] = useState<Duration>(() =>
    intervalToDuration({
      start: new Date(),
      end: endTime
    })
  )

  const updateTimeRemaining = useCallback(() => {
    setTimeRemaining(
      intervalToDuration({
        start: new Date(),
        end: endTime
      })
    )
  }, [endTime])

  useInterval(updateTimeRemaining, 1000)

  return timeRemaining
}
