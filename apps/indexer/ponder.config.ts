import { createConfig, factory } from "ponder"
import { parseAbiItem } from "viem"

import { AdriftAbi } from "./abis/AdriftAbi"
import { AdriftBundlerAbi } from "./abis/AdriftBundlerAbi"
import { AdriftFactoryAbi } from "./abis/AdriftFactoryAbi"
import { pacifica, risa } from "./src/utils/chain"
import { env } from "./src/utils/env"

export default createConfig({
  chains: {
    pacifica: {
      id: pacifica.id,
      rpc: pacifica.rpcUrls.default.http[0]
    },
    risa: {
      id: risa.id,
      rpc: risa.rpcUrls.default.http[0]
    }
  },
  contracts: {
    AdriftFactory: {
      chain: "pacifica",
      abi: AdriftFactoryAbi,
      address: env.FACTORY_ADDRESS,
      startBlock: env.START_BLOCK,
      includeTransactionReceipts: true
    },
    Adrift: {
      chain: "pacifica",
      abi: AdriftAbi,
      address: factory({
        // Address of the factory contract.
        address: env.FACTORY_ADDRESS,
        // Event from the factory contract ABI which contains the child address.
        event: parseAbiItem(
          "event AdriftCreated(address indexed gameAddress, address indexed checkInOutcomes, address indexed gameAdmin)"
        ),
        // Name of the event parameter containing the child address.
        parameter: "gameAddress"
      }),
      startBlock: env.START_BLOCK,
      includeTransactionReceipts: true
    },
    AdriftBundler: {
      chain: "risa",
      abi: AdriftBundlerAbi,
      address: env.BUNDLER_ADDRESS,
      startBlock: "latest"
    }
  }
})
