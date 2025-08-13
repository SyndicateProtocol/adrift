"use client"

import { type LeaderboardPlayer, useLeaderboard } from "@/hooks/useLeaderboard"
import { useMe } from "@/hooks/useMe"
import { truncateAddress } from "@/utils/helpers"
import { memo, useMemo } from "react"
import Boat from "./sprites/Boat"
import BoatNoFlag from "./sprites/BoatNoFlag"
import GhostShip from "./sprites/GhostShip"
import Wave from "./sprites/Wave"

function generateWaves() {
  const waves = Array.from({ length: 10 }, (_, i) => {
    const x = getRandomRange(0, 100)
    const y = getRandomRange(0, 100)
    const size = getRandomRange(20, 40)
    const delay = getRandomRange(0, 1000)
    const speed = getRandomRange(6, 12)
    const direction = getRandomRange(0, 1)

    return {
      key: i,
      x,
      y,
      size,
      delay,
      speed,
      direction
    }
  })

  return waves
}

function generateBoatCoords(players: LeaderboardPlayer[] | undefined) {
  if (!players) return []

  // Create a grid for even distribution
  const gridSize = Math.ceil(Math.sqrt(players.length))
  const cellWidth = 80 / gridSize // 80% of available space (10-90%)
  const cellHeight = 80 / gridSize

  // Create all possible grid positions
  const gridPositions = []
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      gridPositions.push({ x, y })
    }
  }

  // Shuffle the grid positions for randomness
  const shuffledPositions = gridPositions.sort(() => Math.random() - 0.5)

  return players.map((player, index) => {
    // Use shuffled grid position
    const gridPos = shuffledPositions[index % shuffledPositions.length]

    // Base position in grid cell
    const baseX = 10 + gridPos.x * cellWidth + cellWidth / 2
    const baseY = 10 + gridPos.y * cellHeight + cellHeight / 2

    // Add jitter for randomness (±30% of cell size)
    const jitterX = (Math.random() - 0.5) * cellWidth * 0.6
    const jitterY = (Math.random() - 0.5) * cellHeight * 0.6

    const x = Math.max(10, Math.min(90, baseX + jitterX))
    const y = Math.max(10, Math.min(90, baseY + jitterY))

    const delay = getRandomRange(0, 1000)
    const speed = getRandomRange(15, 30)
    const direction = getRandomRange(0, 1)

    return { x, y, address: player.address, delay, speed, direction }
  })
}

function getRandomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

const SeaView = memo(function SeaView() {
  const { data, isLoading } = useLeaderboard()
  const me = useMe()

  const activePlayers = useMemo(
    () =>
      data?.topPlayers
        .filter(
          (player) => !player.isDisqualified && player.address !== me?.address
        )
        .slice(0, 10),
    [data?.topPlayers, me?.address]
  )

  const waves = useMemo(() => generateWaves(), [])
  const boatCoords = useMemo(
    () => generateBoatCoords(activePlayers),
    [activePlayers]
  )

  return (
    <>
      {waves.map((wave) => (
        <Wave
          key={wave.key}
          className="animate-wave absolute translate-x-1/2 translate-y-1/2"
          style={{
            width: `${wave.size}px`,
            top: `${wave.y}%`,
            left: `${wave.x}%`,
            animationDelay: `${wave.delay}ms`,
            animationDuration: `${wave.speed}s`,
            animationDirection: wave.direction === 0 ? "normal" : "reverse"
          }}
        />
      ))}

      {me && !me?.isDisqualified && (
        <div className="w-10 animate-boat absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
          <Boat className="" />
          <div className="text-xs text-foreground absolute -top-[14px] left-1/2 -translate-x-1/2">
            You
          </div>
        </div>
      )}

      {isLoading && (
        <div className="w-10 animate-boat absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
          <GhostShip className="text-foreground/70" />
          <div className="text-xs text-foreground absolute -top-[14px] left-1/2 -translate-x-1/2">
            Loading...
          </div>
        </div>
      )}

      {boatCoords.map((coord, index) => (
        <div
          key={`${coord.address}-${index}`}
          className="animate-boat absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
          style={{
            top: `${coord.y}%`,
            left: `${coord.x}%`,
            animationDelay: `${coord.delay}ms`,
            animationDuration: `${coord.speed}s`,
            animationDirection: coord.direction === 0 ? "normal" : "reverse"
          }}
        >
          <BoatNoFlag className="w-10 " />
          <div className="text-xs text-foreground/60 absolute -top-[14px] left-1/2 -translate-x-1/2">
            {truncateAddress(coord.address)}
          </div>
        </div>
      ))}
    </>
  )
})

export default SeaView
