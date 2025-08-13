import { fromUnixTime, intervalToDuration } from "date-fns"
import { useCallback, useEffect, useMemo, useState } from "react"

export function useElapsedTimer(startTimestamp?: string) {
  const startTime = useMemo(
    () => (startTimestamp ? fromUnixTime(Number(startTimestamp)) : null),
    [startTimestamp]
  )

  const [elapsed, setElapsed] = useState(() => {
    if (!startTime) return intervalToDuration({ start: 0, end: 0 })
    const now = new Date()
    return intervalToDuration({ start: startTime, end: now })
  })

  const updateElapsed = useCallback(() => {
    if (!startTime) return
    const now = new Date()
    setElapsed(intervalToDuration({ start: startTime, end: now }))
  }, [startTime])

  // Update every second
  useEffect(() => {
    if (!startTime) return
    const interval = setInterval(updateElapsed, 1000)
    return () => clearInterval(interval)
  }, [startTime, updateElapsed])

  return elapsed
}
