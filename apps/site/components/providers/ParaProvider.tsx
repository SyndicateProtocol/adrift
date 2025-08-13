import { useLeaderboard } from "@/hooks/useLeaderboard"
import { pacifica } from "@/utils/chain"
import { sdk } from "@farcaster/miniapp-sdk"
import {
  AuthLayout,
  Environment,
  ParaProvider as ParaProviderBase
} from "@getpara/react-sdk"

const API_KEY = process.env.NEXT_PUBLIC_PARA_API_KEY
if (!API_KEY) {
  throw new Error(
    "API key is not defined. Please set NEXT_PUBLIC_PARA_API_KEY in your environment variables."
  )
}

export function ParaProvider({ children }: { children: React.ReactNode }) {
  const { refetch } = useLeaderboard()

  const env = process.env.NEXT_PUBLIC_PARA_API_KEY?.startsWith("prod")
    ? Environment.PRODUCTION
    : Environment.BETA

  return (
    <ParaProviderBase
      config={{
        appName: "Adrift"
      }}
      externalWalletConfig={{
        wallets: [],
        evmConnector: {
          config: {
            chains: [pacifica],
            ssr: true
          }
        }
      }}
      paraClientConfig={{
        apiKey: process.env.NEXT_PUBLIC_PARA_API_KEY as string,
        env: env
      }}
      paraModalConfig={{
        oAuthMethods: [],
        authLayout: [AuthLayout.AUTH_FULL],
        recoverySecretStepEnabled: false,
        onRampTestMode: false,
        disablePhoneLogin: true,
        logo: "https://adrift.syndicate.io/para-logo.png",
        theme: {
          foregroundColor: "#373737",
          backgroundColor: "#e1e3d5",
          borderRadius: "none"
        }
      }}
      callbacks={{
        onLogin: async (_) => {
          refetch()
          const isMiniApp = await sdk.isInMiniApp()

          if (isMiniApp) {
            const ctx = await sdk.context

            if (!ctx.client.added) {
              await sdk.actions.addMiniApp()
            }
          }
        }
      }}
    >
      {children}
    </ParaProviderBase>
  )
}
