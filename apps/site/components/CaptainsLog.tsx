"use client"

import { useDidMissCheckIn } from "@/hooks/useDidMissCheckIn"
import { useHasJoinedGame } from "@/hooks/useHasJoinedGame"
import { useIsMiniApp } from "@/hooks/useIsMiniApp"
import { useIsWinner } from "@/hooks/useIsWinner"
import { type GameData, useLeaderboard } from "@/hooks/useLeaderboard"
import { useMe } from "@/hooks/useMe"
import { usePlayer } from "@/hooks/usePlayer"
import {
  isPlayerWithinGracePeriod,
  useIsPlayerFirstCheckIn,
  useTotalActivePlayers
} from "@/utils/helpers"
import sdk from "@farcaster/miniapp-sdk"
import { useAccount } from "@getpara/react-sdk"
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  fromUnixTime,
  subSeconds
} from "date-fns"
import { Fragment, type ReactNode, memo, useMemo } from "react"
import type { Address } from "viem"
import { ConnectWallet } from "./ConnectWallet"
import { RaiseFlagJoin } from "./RaiseFlagJoin"
import { Logo } from "./sprites/Logo"
import { Page } from "./sprites/Page"

export const CaptainsLog = memo(function CaptainsLog() {
  const { data: gameData, isLoading } = useLeaderboard()

  const day = useMemo(
    () =>
      gameData?.gameStartTimestamp
        ? differenceInDays(
            new Date(),
            fromUnixTime(Number(gameData.gameStartTimestamp))
          )
        : 0,
    [gameData?.gameStartTimestamp]
  )

  return (
    <section className="border border-foreground rounded-md flex-1 basis-full sm:basis-0 flex flex-col">
      <div className="font-bold text-sm px-3 py-2 border-b border-b-foreground flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Page className="w-4" />

          <h2 className="text-sm">Captains Log</h2>
        </div>
        {day >= 0 && (
          <p className="text-sm font-light text-forground italic">Day {day}</p>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 px-3 py-2">
          <p className="text-sm text-foreground italic text-center">
            Loading...
          </p>
        </div>
      )}

      {gameData && <Log gameData={gameData} />}
    </section>
  )
})

interface LogProps {
  gameData: GameData
}

const Log = memo(function Log({ gameData }: LogProps) {
  const { embedded } = useAccount()
  const isConnected = embedded?.isConnected
  const didMissCheckIn = useDidMissCheckIn()

  const { data: hasJoined } = useHasJoinedGame()
  const { data: me } = usePlayer(embedded?.wallets?.[0]?.address as Address)
  const isWinner = useIsWinner()
  const { data: isMiniApp } = useIsMiniApp()

  async function addMiniApp() {
    await sdk.actions.addMiniApp()
  }

  if (!isConnected) {
    return <Connect />
  }

  if (didMissCheckIn || me?.data?.isDisqualified) {
    return (
      <LogText
        logs={[
          "Ship systems critical",
          "You failed to repair your ship in time",
          "The vessel has sank"
        ]}
      />
    )
  }

  if (isWinner) {
    return (
      <LogText
        logs={[
          "Sending signal for other boats",
          "There is only one boat remaining: yours",
          <span key="1" className="font-bold">
            You have outlasted all the other sailors and won. Congratulations!
          </span>
        ]}
      />
    )
  }

  if (!hasJoined) {
    return <RaiseFlagJoin />
  }

  switch (gameData.status) {
    case "open":
      if (hasJoined) {
        return (
          <LogText
            logs={[
              "You're on board. Waiting for the ships to set sail...",
              isMiniApp && "Add the Mini App to Farcaster to get updates",
              <Fragment key="1">
                Join the{" "}
                <a
                  href="https://farcaster.xyz/~/channel/adrift"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  /adrift Farcaster channel
                </a>{" "}
                and{" "}
                <a
                  href="https://t.me/syndicateiocommunity"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {" "}
                  Telegram group
                </a>{" "}
                to chat with other sailors and get updates
              </Fragment>
            ]}
          />
        )
      }
      return <RaiseFlagJoin />
    case "inProgress":
      if (hasJoined) {
        return <PlayerCheckIn />
      }
      return (
        <LogText
          logs={[
            "Vessels have set out for their voyage already",
            "Hover over the ships to see which sailors are still afloat"
          ]}
        />
      )
    case "finished":
      return <FinishedState />
    default:
      return null
  }
})

const PlayerCheckIn = memo(function PlayerCheckIn() {
  const me = useMe()
  const isFirstCheckIn = useIsPlayerFirstCheckIn(me)
  const totalActivePlayers = useTotalActivePlayers()
  const { data: gameData } = useLeaderboard()
  const isWithinGracePeriod = useMemo(
    () => isPlayerWithinGracePeriod(me, gameData?.gracePeriod),
    [me, gameData?.gracePeriod]
  )

  const logs = useMemo(() => {
    const logs = []

    if (me?.isDisqualified) {
      logs.push("Ship systems critical")
      logs.push("Repairs cause additional issues")
      logs.push("There were too many issues for the vessel to handle")
      logs.push("The vessel has sank")
      logs.push("You are eliminated")
    } else {
      if (isFirstCheckIn) {
        logs.push(`There are ${totalActivePlayers} boats still out at sea`)
      }

      if (isWithinGracePeriod) {
        logs.push("The hull needs to be mended")
        logs.push("Begin repairs as soon as possible")
      } else {
        logs.push("Beware, waters are treacherous")
        logs.push(
          "Early repairs may carry you further out to sea or you may sink in the storm"
        )

        if (me?.nextCheckinTimestamp && gameData?.gracePeriod) {
          const nextCheckIn = fromUnixTime(Number(me.nextCheckinTimestamp))
          const timeToPromptForCheckIn = subSeconds(
            nextCheckIn,
            Number(gameData.gracePeriod)
          )

          const days = Math.floor(
            differenceInHours(timeToPromptForCheckIn, new Date()) / 24
          )
          const hours =
            differenceInHours(timeToPromptForCheckIn, new Date()) % 24
          const minutes =
            differenceInMinutes(timeToPromptForCheckIn, new Date()) % 60

          if (days > 0) {
            logs.push(`Safely repair your ship in ${days}d ${hours}h`)
          } else if (hours > 0) {
            logs.push(`Safely repair your ship in ${hours}h ${minutes}m`)
          } else {
            logs.push(`Safely repair your ship in ${minutes}m`)
          }
        }
      }
    }

    return logs
  }, [
    me,
    isFirstCheckIn,
    totalActivePlayers,
    isWithinGracePeriod,
    gameData?.gracePeriod
  ])

  return <LogText logs={logs} />
})

const Connect = memo(function Connect() {
  return (
    <div className="p-4 grow flex flex-col">
      <Logo className="max-w-64 mb-6" />
      <p>
        A survival game. Mend your boat daily. Last one left at sea wins. A game
        by Syndicate.
      </p>

      <div className="grow flex items-center justify-center">
        <ConnectWallet />
      </div>
    </div>
  )
})

const FinishedState = memo(function FinishedState() {
  return (
    <div className="p-4 grow flex flex-col">
      <Logo className="max-w-64 mb-6" />
      <p className="mb-12">
        A survival game. Mend your boat daily. Last one left at sea wins. A game
        by Syndicate.
      </p>
    </div>
  )
})

const LogText = memo(function LogText(props: {
  logs: Array<string | ReactNode>
}) {
  const { logs } = props

  return (
    <div className="p-4 space-y-2 text-sm leading-snug">
      {logs.map((log, index) => (
        <div key={index} className="relative pl-3">
          <span className="absolute left-0 top-0">&gt;</span>
          <span className="block">{log}</span>
        </div>
      ))}
    </div>
  )
})
