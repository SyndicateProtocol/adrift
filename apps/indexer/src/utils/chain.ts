import { createPublicClient, defineChain, http } from "viem"

export const pacifica = defineChain({
  id: 63_828,
  name: "Pacifica",
  network: "pacifica",
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
})

export const risa = {
  id: 51014,
  name: "Risa Testnet",
  network: "risa-testnet",
  nativeCurrency: {
    name: "Testnet Syndicate",
    symbol: "TestnetSYND",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["https://risa-testnet.g.alchemy.com/public"]
    },
    public: {
      http: ["https://risa-testnet.g.alchemy.com/public"]
    }
  },
  blockExplorers: {
    default: {
      name: "Risa Testnet Explorer",
      url: "https://risa-testnet.explorer.alchemy.com/"
    }
  },
  testnet: true
}

export const pacificaPublicClient = createPublicClient({
  chain: pacifica,
  transport: http()
})

export const risaPublicClient = createPublicClient({
  chain: risa,
  transport: http()
})
