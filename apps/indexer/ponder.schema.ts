import { onchainTable, primaryKey, relations } from "ponder"

export const game = onchainTable("game", (t) => ({
  address: t.hex().primaryKey(),
  gameStartTimestamp: t.bigint().notNull(),
  gameEndTimestamp: t.bigint(),
  winner: t.hex(),
  gracePeriod: t.bigint().notNull(),
  maxNextCheckInOutsideGracePeriod: t.bigint().notNull()
}))

export const player = onchainTable("player", (t) => ({
  address: t.hex().primaryKey()
}))

export const gamePlayer = onchainTable(
  "gamePlayer",
  (t) => ({
    playerAddress: t.hex().notNull(),
    gameAddress: t.hex().notNull(),
    lastCheckinTimestamp: t.bigint(),
    nextCheckinTimestamp: t.bigint().notNull(),
    lastActiveTimestamp: t.bigint(),
    registeredAtTimestamp: t.bigint().notNull(),
    isDisqualified: t.boolean().default(false),
    isWinner: t.boolean().default(false),
    totalActiveMinutes: t.bigint().default(0n),
    registrationHash: t.hex(),
    registrationTotalFee: t.bigint().default(0n),
    dqHash: t.hex(),
    dqTotalFee: t.bigint().default(0n)
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.playerAddress, table.gameAddress] })
  })
)

export const gamePlayerRelations = relations(gamePlayer, ({ one }) => ({
  player: one(player, {
    fields: [gamePlayer.playerAddress],
    references: [player.address]
  }),
  game: one(game, {
    fields: [gamePlayer.gameAddress],
    references: [game.address]
  })
}))

export const checkins = onchainTable(
  "checkins",
  (t) => ({
    playerAddress: t.hex().notNull(),
    gameAddress: t.hex().notNull(),
    checkInTimestamp: t.bigint().notNull(),
    buffOrDebuffSeconds: t.bigint().notNull(),
    hash: t.hex().notNull(),
    totalFee: t.bigint().notNull(),
    isDisqualified: t.boolean().notNull(),
    createdAtBlock: t.bigint().notNull()
  }),
  (table) => ({
    pk: primaryKey({
      columns: [table.playerAddress, table.gameAddress, table.checkInTimestamp]
    })
  })
)

export const checkinsRelations = relations(checkins, ({ one }) => ({
  player: one(player, {
    fields: [checkins.playerAddress],
    references: [player.address]
  }),
  game: one(game, {
    fields: [checkins.gameAddress],
    references: [game.address]
  })
}))
