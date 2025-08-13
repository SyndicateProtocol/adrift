import type { CheckIn } from "@/types"
import { API_URL } from "@/utils/constants"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useRef } from "react"
import type { Address, Hex } from "viem"

interface UsePollForCheckInOptions {
  maxAttempts?: number
  intervalMs?: number
}

export function usePollForCheckIn({
  maxAttempts = 30,
  intervalMs = 2000 // Increased from 1000ms to reduce network requests
}: UsePollForCheckInOptions = {}) {
  const queryClient = useQueryClient()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const pollForCheckIn = useCallback(
    async (hash: Hex, playerAddress: Address): Promise<CheckIn> => {
      return new Promise((resolve, reject) => {
        let attempts = 0

        const poll = async () => {
          try {
            attempts++

            // Fetch fresh player data using the query client
            const freshPlayerData = await queryClient.fetchQuery({
              queryKey: ["player", playerAddress],
              queryFn: () =>
                fetch(`${API_URL}/player/${playerAddress}`).then((res) => {
                  if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`)
                  }
                  return res.json()
                }),
              staleTime: 5000, // Add stale time to prevent excessive refetching
              gcTime: 10000 // Add garbage collection time
            })

            const checkIn = freshPlayerData.data?.checkins?.find(
              (checkin: { hash: string }) => checkin.hash === hash
            )

            if (checkIn) {
              console.debug(`Check-in found after ${attempts} attempts`)
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
              }
              return resolve(checkIn)
            }

            // Check if we've exceeded max attempts
            if (attempts >= maxAttempts) {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
              }
              console.error(`Check-in not found after ${maxAttempts} attempts`)
              return reject(
                new Error(`Check-in not found after ${maxAttempts} attempts`)
              )
            }

            // Continue polling
            timeoutRef.current = setTimeout(poll, intervalMs)
          } catch (error) {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
              timeoutRef.current = null
            }
            reject(error)
          }
        }

        // Start the polling
        poll()
      })
    },
    [queryClient, maxAttempts, intervalMs]
  )

  const stopPolling = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  return {
    pollForCheckIn,
    stopPolling
  }
}
