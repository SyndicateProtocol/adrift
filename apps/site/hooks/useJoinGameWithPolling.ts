import { useAccount } from "@getpara/react-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { useJoinGame } from "./useJoinGame"
import { LEADERBOARD_QUERY_KEY } from "./useLeaderboard"
import { PLAYER_QUERY_KEY, type PlayerResponse } from "./usePlayer"

interface JoinGameWithPollingOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  maxPollingAttempts?: number
  pollingInterval?: number
}

export function useJoinGameWithPolling(
  options: JoinGameWithPollingOptions = {}
) {
  const {
    onSuccess,
    onError,
    maxPollingAttempts = 30, // 30 seconds max
    pollingInterval = 1000 // 1 second intervals
  } = options

  const { mutateAsync: joinGame } = useJoinGame()
  const { embedded } = useAccount()
  const queryClient = useQueryClient()

  const [isPolling, setIsPolling] = useState(false)
  const [pollingAttempts, setPollingAttempts] = useState(0)
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isPlayerInGame = useCallback(async () => {
    // Invalidate and refetch the query
    await queryClient.invalidateQueries({
      queryKey: [LEADERBOARD_QUERY_KEY]
    })

    const { data: freshPlayerData } =
      await queryClient.fetchQuery<PlayerResponse>({
        queryKey: [PLAYER_QUERY_KEY, embedded?.wallets?.[0]?.address]
      })

    if (!embedded?.wallets?.[0]?.address || !freshPlayerData?.address) {
      return false
    }

    return true
  }, [embedded?.wallets, queryClient])

  // Cleanup function to stop polling
  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
    }
    setIsPolling(false)
    setPollingAttempts(0)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  const pollForPlayer = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      let attempts = 0

      const poll = async () => {
        try {
          attempts++
          setPollingAttempts(attempts)

          // Check if player is now in the game
          if (await isPlayerInGame()) {
            stopPolling()
            await queryClient.refetchQueries({
              queryKey: [LEADERBOARD_QUERY_KEY]
            })
            resolve(true)
            return
          }

          // Check if we've exceeded max attempts
          if (attempts >= maxPollingAttempts) {
            stopPolling()
            reject(
              new Error(
                "Player did not appear in game after maximum polling attempts"
              )
            )
            return
          }

          // Continue polling
          pollingTimeoutRef.current = setTimeout(poll, pollingInterval)
        } catch (error) {
          stopPolling()
          reject(error)
        }
      }

      poll()
    })
  }, [
    queryClient,
    isPlayerInGame,
    maxPollingAttempts,
    pollingInterval,
    stopPolling
  ])

  const joinGameWithPolling = useCallback(async () => {
    if (!embedded?.wallets?.[0]?.address) {
      throw new Error("No wallet connected")
    }

    try {
      setIsPolling(true)
      setPollingAttempts(0)

      // Call the original joinGame function
      await joinGame({
        playerAddress: embedded.wallets[0].address
      })

      // Start polling for the player to appear
      await pollForPlayer()

      onSuccess?.()
    } catch (error) {
      stopPolling()
      onError?.(error as Error)
      throw error
    }
  }, [
    embedded?.wallets,
    joinGame,
    pollForPlayer,
    onSuccess,
    onError,
    stopPolling
  ])

  return {
    joinGameWithPolling,
    isPolling,
    pollingAttempts,
    maxPollingAttempts,
    stopPolling
  }
}
