import { useViemClient } from "@/hooks/para/useViemClients"
import { useDurationTimer } from "@/hooks/useDurationTimer"
import { useElapsedTimer } from "@/hooks/useElapsedTimer"
import { useHasJoinedGame } from "@/hooks/useHasJoinedGame"
import { LEADERBOARD_QUERY_KEY, useLeaderboard } from "@/hooks/useLeaderboard"
import { useMe } from "@/hooks/useMe"
import { usePollForCheckIn } from "@/hooks/usePollForCheckIn"
import { pacifica, publicClient } from "@/utils/chain"
import { isPlayerWithinGracePeriod } from "@/utils/helpers"
import { useWallet } from "@getpara/react-sdk"
import { useQueryClient } from "@tanstack/react-query"
import { formatDuration } from "date-fns"
import { memo, useCallback, useMemo, useState } from "react"
import {
  encodeFunctionData,
  http,
  parseAbiItem,
  parseEther,
  type Address
} from "viem"
import { IconWithTitle } from "../IconWithTitle"
import { Holes } from "../games/Holes"
import { Compass } from "../sprites/Compass"
import { Hammer } from "../sprites/Hammer"
import { Storm } from "../sprites/Storm"
import { Sun } from "../sprites/Sun"
import { Wind } from "../sprites/Wind"

export const InProgressStatus = memo(function InProgressStatus(props: {
  onCheckInStart: () => void
  onCheckInEnd: () => void
}) {
  const { onCheckInStart, onCheckInEnd } = props
  const { data: hasJoined } = useHasJoinedGame()
  const { data: gameData } = useLeaderboard()
  const elapsedSinceGameStart = useElapsedTimer(gameData?.gameStartTimestamp)

  const formattedElapsedTime = useMemo(
    () =>
      formatDuration(elapsedSinceGameStart, {
        delimiter: ", ",
        zero: true
      }),
    [elapsedSinceGameStart]
  )

  return (
    <>
      {hasJoined ? (
        <PlayerCheckIn
          onCheckInStart={onCheckInStart}
          onCheckInEnd={onCheckInEnd}
        />
      ) : (
        <>
          <div className="text-center flex flex-col items-center justify-center p-4 flex-1">
            <IconWithTitle icon={Compass} title="Game underway" />
            <p className="text-sm mb-4">
              Ships have already boarded and headed out to sea.
            </p>
          </div>
          <div className="px-4 py-2 border-t border-t-foreground">
            <p className="text-xs italic text-center">
              Ships sailing for {formattedElapsedTime}
            </p>
          </div>
        </>
      )}
    </>
  )
})

const PlayerCheckIn = memo(function PlayerCheckIn(props: {
  onCheckInStart: () => void
  onCheckInEnd: () => void
}) {
  const { onCheckInStart, onCheckInEnd } = props
  const me = useMe()
  const timeToPromptForCheckInString = useDurationTimer(
    me?.nextCheckinTimestamp
  )
  const [showGame, setShowGame] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [buffOrDebuffSeconds, setBuffOrDebuffSeconds] = useState<number | null>(
    null
  )

  const { data: gameData } = useLeaderboard()
  const queryClient = useQueryClient()
  const { viemClient } = useViemClient({
    walletClientConfig: {
      chain: pacifica,
      transport: http()
    }
  })
  const { pollForCheckIn } = usePollForCheckIn()
  const { data: wallet } = useWallet()

  const checkIn = useCallback(async () => {
    if (!gameData?.address) {
      throw new Error("No game data, please refresh the page")
    }

    if (!viemClient || !viemClient.account) {
      throw new Error("No wallet, please sign in")
    }

    if (
      viemClient.account.address !== me?.address &&
      viemClient.account.address !== wallet?.address
    ) {
      throw new Error("Incorrect wallet found, please sign out & re-sign in")
    }
    onCheckInStart()

    setShowGame(false)
    setIsCheckingIn(true)

    const balance = await publicClient.getBalance({
      address: viemClient.account.address as Address
    })
    if (balance < parseEther("0.00001")) {
      alert("Insufficient balance. Need at least 0.00001 ETH for gas fees.")
      setIsCheckingIn(false)
      return
    }

    // Add buffer to the gas estimate to account for the fact that the txs are held at the bundler level for some time
    const gas = await publicClient.estimateGas({
      account: viemClient.account,
      to: gameData.address,
      data: encodeFunctionData({
        abi: [parseAbiItem("function checkIn()")],
        functionName: "checkIn",
        args: []
      })
    })

    const tx = await viemClient.writeContract({
      address: gameData.address,
      abi: [parseAbiItem("function checkIn()")],
      functionName: "checkIn",
      chain: pacifica,
      account: viemClient.account,
      gas: gas * BigInt(2)
    })

    await publicClient.waitForTransactionReceipt({
      hash: tx
    })

    try {
      // Poll until the hash appears in the player's checkins array
      const checkIn = await pollForCheckIn(
        tx,
        viemClient.account.address as Address
      )

      if (!checkIn.isDisqualified) {
        // Small delay to ensure smooth transition
        await new Promise((resolve) => setTimeout(resolve, 100))
        setBuffOrDebuffSeconds(Number(checkIn.buffOrDebuffSeconds))
      } else {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [LEADERBOARD_QUERY_KEY]
          })
        ])
        await Promise.all([
          queryClient.refetchQueries({
            queryKey: [LEADERBOARD_QUERY_KEY]
          })
        ])
      }
    } catch (e) {
      setIsCheckingIn(false)
    } finally {
      onCheckInEnd()
    }
  }, [
    gameData?.address,
    viemClient,
    me?.address,
    wallet?.address,
    onCheckInStart,
    pollForCheckIn,
    queryClient,
    onCheckInEnd
  ])

  const hasBuffOrDebuff = buffOrDebuffSeconds !== null
  const isWithinGracePeriod = useMemo(
    () => isPlayerWithinGracePeriod(me, gameData?.gracePeriod),
    [me, gameData?.gracePeriod]
  )

  const formattedTimeRemaining = useMemo(
    () =>
      formatDuration(timeToPromptForCheckInString, {
        delimiter: ", ",
        zero: true
      }),
    [timeToPromptForCheckInString]
  )

  const handleShowGame = useCallback(() => setShowGame(true), [])
  const handleHideGame = useCallback(() => {
    setIsCheckingIn(false)
    setBuffOrDebuffSeconds(null)
    setShowGame(false)
  }, [])

  const renderContent = useMemo(() => {
    if (hasBuffOrDebuff) {
      return (
        <BuffOrDebuff seconds={buffOrDebuffSeconds} onClick={handleHideGame} />
      )
    }

    if (isCheckingIn) {
      return <p className="text-sm">Attempting repairs...</p>
    }

    if (showGame) {
      return (
        <Holes
          isWithinGracePeriod={isPlayerWithinGracePeriod(me)}
          onSuccess={checkIn}
        />
      )
    }

    if (isWithinGracePeriod) {
      return (
        <div className="flex flex-col items-center justify-center gap-4">
          <IconWithTitle icon={Hammer} title="Repair Needed" />
          <div>
            <p className="text-sm mb-2">
              The hull has been damaged and needs repair. Mend the patches by
              clicking on all of the holes.
            </p>
          </div>
          <button
            type="button"
            className="bg-background text-foreground border border-foreground px-4 py-2 rounded-md cursor-pointer"
            onClick={handleShowGame}
          >
            Repair hull
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <IconWithTitle icon={Sun} title="Smooth Sailing" />
        <div>
          <p className="text-sm mb-2">
            You can attempt more repairs, at your own peril. Conditions may stay
            the same, improve, or worsen
          </p>
        </div>
        <button
          type="button"
          className="bg-background text-foreground border border-foreground px-4 py-2 rounded-md cursor-pointer"
          onClick={handleShowGame}
        >
          Repair boat
        </button>
      </div>
    )
  }, [
    hasBuffOrDebuff,
    buffOrDebuffSeconds,
    isCheckingIn,
    showGame,
    isWithinGracePeriod,
    me,
    checkIn,
    handleShowGame,
    handleHideGame
  ])

  return (
    <>
      <div className="text-center flex flex-col items-center justify-center p-4 flex-1">
        {renderContent}
      </div>
      <div className="px-4 py-2 border-t border-t-foreground">
        <p className="text-xs italic text-center">
          Ship breaks down in {formattedTimeRemaining}
        </p>
      </div>
    </>
  )
})

const BuffOrDebuff = memo(function BuffOrDebuff({
  seconds,
  onClick
}: {
  seconds: number
  onClick: () => void
}) {
  const { icon, title, description, formattedDuration } = useMemo(() => {
    let icon = Hammer
    let title = "Ship repaired!"
    let description = "All systems are stable and operational"

    if (seconds > 0) {
      icon = Wind
      title = "Winds from the north!"
      description = "Your ship caught favorable winds, conditions improved"
    } else if (seconds < 0) {
      icon = Storm
      title = "Storm incoming!"
      description =
        "Your ship encountered a storm! Conditions are critical and need extra monitoring."
    } else if (seconds === 0) {
      icon = Hammer
      title = "Ship repaired!"
      description = "All systems are stable and operational"
    }

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    const formattedDuration = formatDuration(
      hours === 0 ? { minutes, seconds } : { hours }
    )

    return { icon, title, description, formattedDuration }
  }, [seconds])

  return (
    <div>
      <IconWithTitle icon={icon} title={title} />
      <div>{description}</div>
      <div className="my-2">
        <span className="italic text-sm text-center">
          {seconds > 0 && "+"}
          {formattedDuration}
        </span>
      </div>
      <button
        type="button"
        className="bg-foreground text-background border border-foreground px-4 py-2 rounded-md cursor-pointer mt-2"
        onClick={onClick}
      >
        Acknowledged
      </button>
    </div>
  )
})
