"use client"
import { sdk } from "@farcaster/miniapp-sdk"
import "@getpara/react-sdk/styles.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect } from "react"
import { ParaProvider } from "./ParaProvider"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true
    }
  }
})

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    sdk.actions.ready()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ParaProvider>{children}</ParaProvider>
    </QueryClientProvider>
  )
}
