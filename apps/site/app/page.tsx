import { CaptainsLog } from "@/components/CaptainsLog"
import { Header } from "@/components/Header"
import { Leaderboard } from "@/components/Leaderboard"
import { Manifest } from "@/components/Manifest"
import { SeaViewWrapper } from "@/components/SeaViewWrapper"
import { ShipStatus } from "@/components/ship-status/ShipStatus"

import { Links } from "@/components/Links"

export default function Home() {
  return (
    <main className="p-4 max-w-7xl w-full pb-6 mx-auto grow flex flex-col">
      <Header />
      <div className="flex flex-col sm:flex-row gap-6 grow">
        <div className="flex gap-6 flex-1 flex-wrap">
          <SeaViewWrapper />

          <CaptainsLog />

          <ShipStatus />
        </div>

        <section className="md:min-w-[380px] flex flex-col gap-6">
          <Leaderboard />
          <Manifest />
          <Links />
        </section>
      </div>
    </main>
  )
}
