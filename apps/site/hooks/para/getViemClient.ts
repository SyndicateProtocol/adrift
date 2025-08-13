import type ParaWeb from "@getpara/react-sdk"
import { createParaViemClient } from "@getpara/viem-v2-integration"
import type { WalletClientConfig } from "viem"
import { getViemAccount } from "./getViemAccount"

export const getViemClient = async ({
  para,
  address,
  walletClientConfig
}: {
  para: ParaWeb
  address?: `0x${string}`
  walletClientConfig: Omit<WalletClientConfig, "account">
}) => {
  const viemAccount = await getViemAccount({
    para,
    address
  })

  if (!viemAccount || !para) {
    return null
  }

  return await createParaViemClient(para, {
    ...walletClientConfig,
    account: viemAccount
  })
}
