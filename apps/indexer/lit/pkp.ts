import {
  AUTH_METHOD_SCOPE,
  AUTH_METHOD_TYPE,
  LIT_NETWORK,
  LIT_RPC
} from "@lit-protocol/constants"
import { LitContracts } from "@lit-protocol/contracts-sdk"
import { ethers } from "ethers"
// @ts-ignore
import Hash from "ipfs-only-hash"
import { litActionCode } from "./action"

export async function createPkp() {
  const ethersWallet = new ethers.Wallet(
    process.env.LIT_PRIVATE_KEY as string,
    new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
  )
  const litContracts = new LitContracts({
    signer: ethersWallet,
    network: LIT_NETWORK.DatilDev
  })
  await litContracts.connect()
  const mintCost = await litContracts.pkpNftContract.read.mintCost()
  const ipfsCid = await Hash.of(litActionCode)
  // The context in which the lit action is run, changes its CID. This CID is the current
  // lit action code running via the indexer.
  const hardcodedIpfsCid = "QmXDkiEZ8yjPMJJ6HuMb2uan7QHcPAKZTvPwhPUqxwVnDN"
  const txn =
    await litContracts.pkpHelperContract.write.mintNextAndAddAuthMethods(
      AUTH_METHOD_TYPE.LitAction,
      [AUTH_METHOD_TYPE.LitAction, AUTH_METHOD_TYPE.LitAction],
      [
        ethers.utils.base58.decode(ipfsCid),
        ethers.utils.base58.decode(hardcodedIpfsCid)
      ],
      ["0x", "0x"],
      [[AUTH_METHOD_SCOPE.SignAnything], [AUTH_METHOD_SCOPE.SignAnything]],
      false,
      true,
      { value: mintCost, gasLimit: 4000000 }
    )
  const receipt = await txn.wait()
  const pkpId = receipt.logs[0]?.topics[1]
  if (!pkpId) {
    throw new Error("PKP ID not found")
  }
  const pkpPubkeyInfo = await litContracts.pubkeyRouterContract.read.pubkeys(
    ethers.BigNumber.from(pkpId)
  )
  // console.log("PKP Info:", pkpPubkeyInfo);
  const pkpPublicKey = pkpPubkeyInfo.pubkey
  const pkpEthAddress = ethers.utils.computeAddress(pkpPublicKey)
  const pkpInfo = {
    publicKey: pkpPublicKey,
    ethAddress: pkpEthAddress,
    tokenId: pkpId
  }
  console.log("PKP Info:", pkpInfo)
}

createPkp()
  .then(() => {
    process.exit(0)
    console.log("done")
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
