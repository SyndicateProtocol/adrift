import { eq } from "ponder"
import { ponder } from "ponder:registry"
import {
  checkins as checkinsTable,
  gamePlayer as gamePlayerTable,
  game as gameTable,
  player as playerTable
} from "ponder:schema"
import { zeroAddress } from "viem"
import { AdriftBundlerAbi } from "../abis/AdriftBundlerAbi"
import { getLitBundlerTransaction } from "../lit/lit"
import { risaPublicClient } from "./utils/chain"
import { env } from "./utils/env"
import { calculateTotalFee } from "./utils/fee"

ponder.on("AdriftFactory:AdriftCreated", async ({ event, context }) => {
  const { gameAddress } = event.args

  const [gameStartTimestamp, gracePeriod, maxNextCheckInOutsideGracePeriod] =
    await Promise.all([
      context.client.readContract({
        address: gameAddress,
        abi: context.contracts.Adrift.abi,
        functionName: "gameStartTime"
      }),
      context.client.readContract({
        address: gameAddress,
        abi: context.contracts.Adrift.abi,
        functionName: "CHECKIN_GRACE_PERIOD"
      }),
      context.client.readContract({
        address: gameAddress,
        abi: context.contracts.Adrift.abi,
        functionName: "MAX_NEXT_CHECK_IN_OUTSIDE_GRACE_PERIOD"
      })
    ])

  await context.db
    .insert(gameTable)
    .values({
      address: gameAddress,
      gameStartTimestamp,
      gracePeriod,
      maxNextCheckInOutsideGracePeriod
    })
    .onConflictDoNothing()
})

ponder.on("Adrift:GameStartTimeSet", async ({ event, context }) => {
  const { gameStartTime } = event.args

  await context.db.update(gameTable, { address: event.log.address }).set({
    gameStartTimestamp: gameStartTime
  })

  // Batch update all players' next check-in timestamps
  await context.db.sql
    .update(gamePlayerTable)
    .set({ nextCheckinTimestamp: gameStartTime + 86400n })
    .where(eq(gamePlayerTable.gameAddress, event.log.address))
})

ponder.on("Adrift:GameEnded", async ({ event, context }) => {
  const { gameEndTime, winner } = event.args

  const gameHasWinner = winner !== zeroAddress

  await context.db.update(gameTable, { address: event.log.address }).set({
    gameEndTimestamp: gameEndTime,
    winner: gameHasWinner ? winner : null
  })

  const gamePlayer = await context.db.find(gamePlayerTable, {
    gameAddress: event.log.address,
    playerAddress: winner
  })

  if (!gamePlayer) {
    throw new Error(`Game player not found for address ${winner}`)
  }

  if (gameHasWinner) {
    const game = await context.db.find(gameTable, {
      address: event.log.address
    })

    if (!game) {
      throw new Error(`Game not found for address ${event.log.address}`)
    }

    await context.db
      .update(gamePlayerTable, {
        gameAddress: event.log.address,
        playerAddress: winner
      })
      .set({
        totalActiveMinutes:
          (gameEndTime - gamePlayer.registeredAtTimestamp) / 60n,
        isWinner: true
      })
  }
})

ponder.on("Adrift:PlayerRegistered", async ({ event, context }) => {
  const { player, registrationTime, nextCheckInTime } = event.args

  const existingPlayer = await context.db.find(playerTable, {
    address: player
  })
  if (!existingPlayer) {
    await context.db.insert(playerTable).values({
      address: player
    })
  }

  const gameStartTime = await context.client.readContract({
    address: event.log.address,
    abi: context.contracts.Adrift.abi,
    functionName: "gameStartTime"
  })

  await context.db
    .insert(gamePlayerTable)
    .values({
      playerAddress: player,
      gameAddress: event.log.address,
      registrationHash: event.transaction.hash,

      // Default to 1 day from game start timestamp
      nextCheckinTimestamp: nextCheckInTime,
      registeredAtTimestamp: registrationTime,
      totalActiveMinutes: 0n,
      registrationTotalFee: calculateTotalFee(event)
    })
    .onConflictDoNothing()
})

ponder.on("Adrift:PlayerCheckedIn", async ({ event, context }) => {
  const { player, checkInTime, nextCheckInTime, buffOrDebuff, isDisqualified } =
    event.args

  const [game, gamePlayer] = await Promise.all([
    context.db.find(gameTable, {
      address: event.log.address
    }),
    context.db.find(gamePlayerTable, {
      playerAddress: player,
      gameAddress: event.log.address
    })
  ])

  if (!game) {
    throw new Error(`Game not found for address ${event.log.address}`)
  }

  if (!gamePlayer) {
    throw new Error(`Game player not found for address ${player}`)
  }

  await context.db
    .update(gamePlayerTable, {
      playerAddress: player,
      gameAddress: event.log.address
    })
    .set({
      lastCheckinTimestamp: checkInTime,
      nextCheckinTimestamp: nextCheckInTime,
      // totalActiveMinutes here is marked based on the checkin. These users are still active.
      // When returning from the API we should return ((Date.now() / 1000) - registeredAtTimestamp) / 60n or handle in the UI
      totalActiveMinutes: (checkInTime - gamePlayer.registeredAtTimestamp) / 60n
    })

  await context.db.insert(checkinsTable).values({
    id: event.id,
    playerAddress: player,
    gameAddress: event.log.address,
    checkInTimestamp: checkInTime,
    buffOrDebuffSeconds: buffOrDebuff,
    hash: event.transaction.hash,
    createdAtBlock: event.block.number,
    totalFee: calculateTotalFee(event),
    isDisqualified
  })
})

ponder.on("Adrift:PlayerDisqualified", async ({ event, context }) => {
  const { player, lastActiveTime, disqualificationTime } = event.args

  // Get the game details
  const game = await context.db.find(gameTable, {
    address: event.log.address
  })

  if (!game) {
    throw new Error(`Game not found for address ${event.log.address}`)
  }

  await context.db
    .update(gamePlayerTable, {
      playerAddress: player,
      gameAddress: event.log.address
    })
    .set({
      isDisqualified: true,
      lastActiveTimestamp: disqualificationTime,
      totalActiveMinutes:
        (disqualificationTime - game.gameStartTimestamp) / 60n,
      dqHash: event.transaction.hash,
      dqTotalFee: calculateTotalFee(event)
    })
})

ponder.on("Adrift:GracePeriodSet", async ({ event, context }) => {
  const { gracePeriod } = event.args

  await context.db.update(gameTable, { address: event.log.address }).set({
    gracePeriod
  })
})

ponder.on(
  "Adrift:MaxNextCheckInOutsideGracePeriodSet",
  async ({ event, context }) => {
    const { maxNextCheckInOutsideGracePeriod } = event.args

    await context.db.update(gameTable, { address: event.log.address }).set({
      maxNextCheckInOutsideGracePeriod
    })
  }
)

ponder.on("AdriftBundler:MempoolUpdated", async () => {
  if (env.APP_ENV !== "production") {
    return
  }

  try {
    const mempoolLength = await risaPublicClient.readContract({
      address: env.BUNDLER_ADDRESS,
      abi: AdriftBundlerAbi,
      functionName: "getMempoolLength"
    })

    if (mempoolLength === BigInt(0)) {
      console.debug("Mempool is empty, skipping randomness tx")
      return
    }
    try {
      const bundlerTransaction = await getLitBundlerTransaction()
      const txHash = await risaPublicClient.sendRawTransaction({
        serializedTransaction: bundlerTransaction
      })

      console.debug("Randomness tx sent to AdriftBundler on Risa", txHash)
    } catch (e) {
      console.error("Error sending bundler tx via Lit", e)
    }
  } catch (e) {
    console.error("Error sending randomness tx", e)
  }
})
