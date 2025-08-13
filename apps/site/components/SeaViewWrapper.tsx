"use client"

import dynamic from "next/dynamic"

const SeaView = dynamic(() => import("@/components/SeaView"), {
  ssr: false,
  loading: () => (
    <p className="text-sm italic text-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      Checking charts...
    </p>
  )
})

export function SeaViewWrapper() {
  return (
    <section className="flex-1 basis-full border border-foreground rounded-md min-h-[300px] overflow-hidden relative">
      <SeaView />
    </section>
  )
}
