import sdk from "@farcaster/miniapp-sdk"
import { useQuery } from "@tanstack/react-query"

export function useIsMiniApp() {
  return useQuery({
    queryKey: ["isMiniApp"],
    queryFn: async () => {
      const isMiniApp = await sdk.isInMiniApp()
      return isMiniApp
    }
  })
}
