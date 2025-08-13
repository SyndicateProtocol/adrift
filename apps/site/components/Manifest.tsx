"use client"

import { formatUnits } from "viem"
import { useStats } from "../hooks/useStats"

export function Manifest() {
  const { data: stats, isLoading, error } = useStats()

  if (isLoading) {
    return (
      <section className="border border-foreground rounded-md flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-b-foreground">
          <h2 className="font-bold text-sm">Manifest</h2>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground">Loading...</span>
          </div>
        </div>
      </section>
    )
  }

  if (error || !stats) {
    return (
      <section className="border border-foreground rounded-md flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-b-foreground">
          <h2 className="font-bold text-sm">Manifest</h2>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground">Error loading stats</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="border border-foreground rounded-md flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-b-foreground">
        <h2 className="font-bold text-sm">Manifest</h2>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground">Transactions</span>
          <span className="text-sm font-mono">
            {stats.transactions.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground">Sailors</span>
          <span className="text-sm font-mono">
            {stats.players.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground">Check Ins</span>
          <span className="text-sm font-mono">
            {stats.checkins.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground">Fees paid</span>
          <span className="text-sm font-mono">
            {Number(
              formatUnits(
                stats.playerRegistrationFees + stats.checkinFees + stats.dqFees,
                18
              )
            ).toFixed(2)}{" "}
            ETH
          </span>
        </div>
      </div>
    </section>
  )
}
