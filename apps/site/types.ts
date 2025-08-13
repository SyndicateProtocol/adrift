import type { Address } from "viem"

export interface CheckIn {
  playerAddress: string
  gameAddress: string
  checkInTimestamp: string
  buffOrDebuffSeconds: string
  hash: string
  isDisqualified: boolean
}

export interface Player {
  address: Address
  nextCheckinTimestamp: string
  lastCheckinTimestamp: string
  lastActiveTimestamp?: string
  registeredAtTimestamp: string
  isDisqualified: boolean
  checkins: CheckIn[]
  isActive: boolean
  isWinner: boolean
  totalActiveMinutes: string
}
