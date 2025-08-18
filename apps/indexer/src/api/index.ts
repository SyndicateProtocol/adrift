import { db } from "ponder:api"
import { checkins, game, gamePlayer } from "ponder:schema"
import { waitForHash } from "@syndicateio/syndicate-node/utils"
import { Hono } from "hono"
import { and, count, desc, eq, lt, replaceBigInts, sum } from "ponder"
import { getAddress, stringify } from "viem"
import { pacifica } from "../utils/chain"
import { env } from "../utils/env"
import { syndicate } from "../utils/syndicate"

const app = new Hono()

app.post("/join", async (c) => {
  const { playerAddress } = await c.req.json()

  if (!playerAddress) {
    return c.text("No player address provided", 400)
  }

  const wellFormedAddress = getAddress(playerAddress)

  const currentGame = await db.query.game.findFirst({
    where: eq(game.address, env.ACTIVE_GAME_ADDRESS)
  })

  if (!currentGame) {
    return c.text("No game found", 400)
  }

  const tx = await syndicate.transact.sendTransaction({
    projectId: env.SYNDICATE_TC_PROJECT_ID,
    contractAddress: currentGame.address,
    chainId: pacifica.id,
    functionSignature: "register(address player)",
    args: {
      player: wellFormedAddress
    }
  })

  const hash = await waitForHash(syndicate, {
    projectId: env.SYNDICATE_TC_PROJECT_ID,
    transactionId: tx.transactionId
  })

  return c.json({ success: true, hash })
})

app.get("/leaderboard", async (c) => {
  // First get the current game
  const currentGame = await db.query.game.findFirst({
    where: eq(game.address, env.ACTIVE_GAME_ADDRESS)
  })

  if (!currentGame) {
    return c.json({ data: null })
  }

  const [playersResult, totalPlayers, totalActivePlayers] = await Promise.all([
    db.query.gamePlayer.findMany({
      where: eq(gamePlayer.gameAddress, currentGame.address),
      orderBy: desc(gamePlayer.totalActiveMinutes),
      limit: 250
    }),
    db
      .select({ count: count() })
      .from(gamePlayer)
      .where(eq(gamePlayer.gameAddress, currentGame.address)),
    db
      .select({ count: count() })
      .from(gamePlayer)
      .where(
        and(
          eq(gamePlayer.gameAddress, currentGame.address),
          eq(gamePlayer.isDisqualified, false)
        )
      )
  ])

  const playersResultReplaced = playersResult.map((d) =>
    replaceBigInts(d, (v) => String(v))
  )
  const currentGameReplaced = replaceBigInts(currentGame, (v) => String(v))

  return c.json({
    data: {
      address: currentGameReplaced.address,
      gameStartTimestamp: currentGameReplaced.gameStartTimestamp,
      gameEndTimestamp: currentGameReplaced.gameEndTimestamp,
      gracePeriod: currentGameReplaced.gracePeriod,
      maxNextCheckInOutsideGracePeriod:
        currentGameReplaced.maxNextCheckInOutsideGracePeriod,
      topPlayers: playersResultReplaced.map((player) => ({
        address: player.playerAddress,
        lastCheckinTimestamp: player.lastCheckinTimestamp,
        nextCheckinTimestamp: player.nextCheckinTimestamp,
        lastActiveTimestamp: player.lastActiveTimestamp,
        registeredAtTimestamp: player.registeredAtTimestamp,
        isDisqualified: player.isDisqualified,
        isWinner: player.isWinner
      })),
      totalPlayers: totalPlayers?.[0]?.count ?? 0,
      totalActivePlayers: totalActivePlayers?.[0]?.count ?? 0
    }
  })
})

app.get("/player/:address", async (c) => {
  const playerAddress = c.req.param("address")
  const wellFormedAddress = getAddress(playerAddress)

  const [gamePlayerResult, checkinsResult] = await Promise.all([
    db
      .select()
      .from(gamePlayer)
      .where(
        and(
          eq(gamePlayer.gameAddress, env.ACTIVE_GAME_ADDRESS),
          eq(gamePlayer.playerAddress, wellFormedAddress)
        )
      )
      .limit(1),
    db
      .select()
      .from(checkins)
      .where(
        and(
          eq(checkins.gameAddress, env.ACTIVE_GAME_ADDRESS),
          eq(checkins.playerAddress, wellFormedAddress)
        )
      )
      .orderBy(desc(checkins.checkInTimestamp))
  ])

  const gamePlayerInfo = gamePlayerResult[0]
  if (!gamePlayerInfo) {
    return c.json({ data: null })
  }

  return c.json({
    data: replaceBigInts(
      {
        address: gamePlayerInfo.playerAddress,
        nextCheckinTimestamp: gamePlayerInfo.nextCheckinTimestamp,
        lastCheckinTimestamp: gamePlayerInfo.lastCheckinTimestamp,
        lastActiveTimestamp: gamePlayerInfo.lastActiveTimestamp,
        registeredAtTimestamp: gamePlayerInfo.registeredAtTimestamp,
        isDisqualified: gamePlayerInfo.isDisqualified,
        checkins: checkinsResult,
        totalActiveMinutes: gamePlayerInfo.totalActiveMinutes,
        isWinner: gamePlayerInfo.isWinner,
        isActive:
          gamePlayerInfo.nextCheckinTimestamp > Date.now() / 1000 &&
          gamePlayerInfo.isDisqualified === false
      },
      (v) => v.toString()
    )
  })
})

app.get("/stats", async (c) => {
  const currentGame = await db.query.game.findFirst({
    where: eq(game.address, env.ACTIVE_GAME_ADDRESS)
  })

  if (!currentGame) {
    return c.json({ data: null })
  }

  const [
    playerCount,
    playerRegistrationFees,
    checkInCount,
    checkInFees,
    dqCount,
    dqFees
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(gamePlayer)
      .where(eq(gamePlayer.gameAddress, currentGame.address)),
    db
      .select({ sum: sum(gamePlayer.registrationTotalFee) })
      .from(gamePlayer)
      .where(eq(gamePlayer.gameAddress, currentGame.address)),
    db
      .select({ count: count() })
      .from(checkins)
      .where(eq(checkins.gameAddress, currentGame.address)),
    db
      .select({ sum: sum(checkins.totalFee) })
      .from(checkins)
      .where(eq(checkins.gameAddress, currentGame.address)),
    db
      .select({ count: count() })
      .from(gamePlayer)
      .where(
        and(
          eq(gamePlayer.gameAddress, currentGame.address),
          eq(gamePlayer.isDisqualified, true)
        )
      ),
    db
      .select({ sum: sum(gamePlayer.dqTotalFee) })
      .from(gamePlayer)
      .where(
        and(
          eq(gamePlayer.gameAddress, currentGame.address),
          eq(gamePlayer.isDisqualified, true)
        )
      )
  ])

  return c.json({
    data: JSON.parse(
      stringify({
        players: playerCount?.[0]?.count ?? 0,
        checkins: checkInCount?.[0]?.count ?? 0,
        playerRegistrationFees: playerRegistrationFees?.[0]?.sum ?? 0n,
        checkInFees: checkInFees?.[0]?.sum ?? 0n,
        dqCount: dqCount?.[0]?.count ?? 0,
        dqFees: dqFees?.[0]?.sum ?? 0n
      })
    )
  })
})

app.get("/heartbeat", async (c) => {
  const currentGame = await db.query.game.findFirst({
    where: eq(game.address, env.ACTIVE_GAME_ADDRESS)
  })

  if (!currentGame) {
    return c.text("No game found", 404)
  }

  const hasGameStarted = currentGame.gameStartTimestamp < Date.now() / 1000
  if (!hasGameStarted) {
    console.debug("Game has not started, skipping heartbeat")
    return c.json({
      data: {
        success: true,
        action: "none, game has not started"
      }
    })
  }

  // DQ inactive players
  const now = Math.floor(Date.now() / 1000)
  const inactivePlayers = await db.query.gamePlayer.findMany({
    where: and(
      eq(gamePlayer.gameAddress, currentGame.address),
      lt(gamePlayer.nextCheckinTimestamp, BigInt(now)),
      eq(gamePlayer.isDisqualified, false),
      eq(gamePlayer.isWinner, false)
    ),
    limit: 100
  })

  if (inactivePlayers.length > 0) {
    console.debug(
      `Disqualifying ${inactivePlayers.length} players: ${inactivePlayers
        .map((player) => player.playerAddress)
        .join(", ")}`
    )

    // Check if the TC project is backed up
    const { transactionRequests } =
      await syndicate.wallet.getTransactionRequestsByProject(
        env.SYNDICATE_TC_PROJECT_ID
      )
    // if requests are valid & don't have attempts, they are in the queue
    const requestsInQueue = transactionRequests.filter(
      ({ transactionAttempts, invalid }) =>
        !invalid && (transactionAttempts?.length === 0 || !transactionAttempts)
    )

    if (requestsInQueue.length > 0) {
      const transactionIds = requestsInQueue.map((req) => req.transactionId)
      console.debug(
        `TC project is backed up, skipping disqualification: ${transactionIds.join(
          ", "
        )}`
      )
      return c.json({
        data: {
          success: false,
          action: "disqualifyInactivePlayers, TC project is backed up",
          players: inactivePlayers.map((player) => player.playerAddress),
          transactionIds
        }
      })
    }
    const txs = await Promise.all(
      inactivePlayers.map(async (player) => {
        return syndicate.transact.sendTransaction({
          projectId: env.SYNDICATE_TC_PROJECT_ID,
          contractAddress: currentGame.address,
          chainId: pacifica.id,
          functionSignature: "disqualifyInactivePlayer(address player)",
          args: {
            player: player.playerAddress
          }
        })
      })
    )
    console.debug(
      `Disqualification tx IDs: ${txs
        .filter((tx) => !!tx)
        .map((tx) => tx.transactionId)
        .join(", ")}`
    )
    return c.json({
      data: {
        success: true,
        action: "disqualifyInactivePlayers",
        players: inactivePlayers.map((player) => player.playerAddress)
      }
    })
  }

  return c.json({
    data: {
      success: true,
      action: "none"
    }
  })
})

export default app
