import {
  LitActionResource,
  LitPKPResource,
  createSiweMessage,
  generateAuthSig
} from "@lit-protocol/auth-helpers"
import { LIT_ABILITY, LIT_NETWORK, LIT_RPC } from "@lit-protocol/constants"
import { LitNodeClient } from "@lit-protocol/lit-node-client"
import * as ethers from "ethers"
// @ts-ignore
import Hash from "ipfs-only-hash"
import { LocalStorage } from "node-localstorage"
//@ts-ignore
import type { Hex } from "viem"
import { pacifica, risa } from "../src/utils/chain"
import { env } from "../src/utils/env"
import { litActionCode } from "./action"

export async function getLitBundlerTransaction() {
  const client = new LitNodeClient({
    litNetwork: LIT_NETWORK.DatilDev,
    debug: false,
    alertWhenUnauthorized: true,
    storageProvider: {
      provider: new LocalStorage("./lit_storage.db")
    }
  })
  await client.connect()

  const ethersWallet = new ethers.Wallet(
    env.LIT_PRIVATE_KEY,
    new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
  )

  const sessionSigs = await client.getSessionSigs({
    chain: "pacifica",
    expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    resourceAbilityRequests: [
      {
        resource: new LitActionResource("*"),
        ability: LIT_ABILITY.LitActionExecution
      },
      {
        resource: new LitPKPResource("*"),
        ability: LIT_ABILITY.PKPSigning
      }
    ],
    authNeededCallback: async ({
      uri,
      expiration,
      resourceAbilityRequests
    }) => {
      const toSign = await createSiweMessage({
        uri,
        expiration,
        resources: resourceAbilityRequests,
        walletAddress: await ethersWallet.getAddress(),
        nonce: await client.getLatestBlockhash(),
        litNodeClient: client
      })

      return await generateAuthSig({
        signer: ethersWallet,
        toSign
      })
    }
  })
  const codeHash = await Hash.of(litActionCode)
  const { success, response } = await client.executeJs({
    sessionSigs,
    code: litActionCode,
    jsParams: {
      RANDOM_CONTRACT_ADDRESS: env.RANDOM_CONTRACT_ADDRESS,
      BUNDLER_ADDRESS: env.BUNDLER_ADDRESS,
      PACIFICA_RPC_URL: env.PACIFICA_RPC_URL,
      PACIFICA_CHAIN_ID: pacifica.id,
      RISA_RPC_URL: env.RISA_RPC_URL,
      RISA_CHAIN_ID: risa.id,
      PKP_PUBLIC_KEY: env.LIT_PKP_PUBLIC_KEY
    }
  })
  if (!success) {
    throw new Error("Failed to execute LIT action")
  }
  const { bundlerTransaction } = JSON.parse(response as string) as {
    bundlerTransaction: Hex
  }
  if (!bundlerTransaction) {
    throw new Error("No bundler transaction found")
  }
  return bundlerTransaction
}
