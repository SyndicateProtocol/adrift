import { http, type Chain, createPublicClient } from "viem"

export const pacifica = {
  id: 63_828,
  name: "Pacifica",
  nativeCurrency: {
    decimals: 18,
    name: "OAR",
    symbol: "OAR"
  },
  rpcUrls: {
    default: {
      http: ["https://pacifica.rpc.testnet.syndicate.io/"]
    },
    public: {
      http: ["https://pacifica.rpc.testnet.syndicate.io/"]
    }
  },
  blockExplorers: {
    default: {
      name: "Pacifica Explorer",
      url: "https://pacifica.explorer.testnet.syndicate.io/"
    }
  }
} as const satisfies Chain

export const publicClient = createPublicClient({
  chain: pacifica,
  transport: http()
})
