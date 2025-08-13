// @ts-nocheck
const _litActionCode = async () => {
  try {
    const PKPETHAddress = ethers.utils.computeAddress(PKP_PUBLIC_KEY)

    // Helper function to create and sign Ethereum transactions
    async function createAndSignTransaction({
      rpcUrl,
      contractAddress,
      abi,
      functionName,
      functionArgs,
      chainId,
      sigName
    }) {
      const unsignedTransactionResponse = await Lit.Actions.runOnce(
        { waitForResponse: true, name: `${sigName}Generator` },
        async () => {
          try {
            // Tx creation
            const ethersProvider = new ethers.providers.JsonRpcProvider(rpcUrl)
            const iface = new ethers.utils.Interface(abi)
            const contract = new ethers.Contract(
              contractAddress,
              abi,
              ethersProvider
            )
            const data = iface.encodeFunctionData(functionName, functionArgs)

            const estimatedGas = await contract.estimateGas[functionName](
              ...functionArgs,
              { from: PKPETHAddress }
            )
            const feeData = await ethersProvider.getFeeData()
            const nonce =
              await ethersProvider.getTransactionCount(PKPETHAddress)

            const unsignedTransaction = {
              to: contractAddress,
              gasLimit: estimatedGas * 2,
              nonce,
              chainId,
              maxFeePerGas: feeData.maxFeePerGas,
              maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
              type: 2,
              data
            }
            return JSON.stringify(unsignedTransaction)
          } catch (error) {
            return `Error: Could not generate unsigned transaction: ${error.message}`
          }
        }
      )

      const unsignedTransaction = JSON.parse(unsignedTransactionResponse)
      const serializedTx =
        ethers.utils.serializeTransaction(unsignedTransaction)
      const toSign = ethers.utils.arrayify(ethers.utils.keccak256(serializedTx))

      const litSignature = await Lit.Actions.signAndCombineEcdsa({
        toSign,
        publicKey: PKP_PUBLIC_KEY.slice(2),
        sigName
      })

      const jsonSignature = JSON.parse(litSignature)
      jsonSignature.r = `0x${jsonSignature.r.substring(2)}`
      jsonSignature.s = `0x${jsonSignature.s}`
      const hexSignature = ethers.utils.joinSignature(jsonSignature)

      const signedTransaction = ethers.utils.serializeTransaction(
        unsignedTransaction,
        hexSignature
      )

      const recoveredAddress = ethers.utils.recoverAddress(toSign, hexSignature)
      if (recoveredAddress !== PKPETHAddress) {
        throw new Error(
          `Recovered address does not match PKPETHAddress: ${recoveredAddress} vs ${PKPETHAddress}`
        )
      }

      return signedTransaction
    }

    async function getRandomessTransaction() {
      const randomness = await Lit.Actions.runOnce(
        { waitForResponse: true, name: "randomnessGenerator" },
        async () => {
          try {
            // 1. Fetch drand randomness
            const url =
              "https://api.drand.sh/v2/chains/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971/rounds/latest"
            const resp = await fetch(url).then((response) => response.json())
            const { signature } = resp
            if (!signature) {
              Lit.Actions.setResponse({
                response: "No signature found"
              })
              return
            }

            // 2. Process drand signature
            const signatureBytes = hexToBytes(signature)
            const hashBuffer = await crypto.subtle.digest(
              "SHA-256",
              signatureBytes
            )
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            const drandRandomness = hashArray
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("")

            // 3. Generate local randomness using Web Crypto API
            const localRandomBytes = crypto.getRandomValues(new Uint8Array(32))
            const localRandomHex = Array.from(localRandomBytes)
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("")

            // 4. Combine both randomness sources using HMAC
            const combinedData = new TextEncoder().encode(
              drandRandomness + localRandomHex
            )
            const key = await crypto.subtle.importKey(
              "raw",
              new TextEncoder().encode("drand-local-combiner"),
              { name: "HMAC", hash: "SHA-256" },
              false,
              ["sign"]
            )
            const combinedSignature = await crypto.subtle.sign(
              "HMAC",
              key,
              combinedData
            )
            const combinedRandomness = Array.from(
              new Uint8Array(combinedSignature)
            )
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("")

            // 5. Final entropy extraction using HKDF
            const salt = new TextEncoder().encode("proof-of-survival-entropy")
            const info = new TextEncoder().encode("combined-randomness")

            const hkdfKey = await crypto.subtle.importKey(
              "raw",
              hexToBytes(combinedRandomness),
              { name: "HKDF" },
              false,
              ["deriveBits"]
            )
            const finalRandomness = await crypto.subtle.deriveBits(
              {
                name: "HKDF",
                hash: "SHA-256",
                salt: salt,
                info: info
              },
              hkdfKey,
              256 // 32 bytes
            )
            const finalRandomnessHex = `0x${Array.from(
              new Uint8Array(finalRandomness)
            )
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("")}`

            return finalRandomnessHex
          } catch (error) {
            return `Error: Could not generate randomness: ${error.message}`
          }
        }
      )

      return await createAndSignTransaction({
        rpcUrl: PACIFICA_RPC_URL,
        contractAddress: RANDOM_CONTRACT_ADDRESS,
        abi: ["function setRandom(uint256 _random) external"],
        functionName: "setRandom",
        functionArgs: [BigInt(randomness)],
        chainId: PACIFICA_CHAIN_ID,
        sigName: "setRandomnessTransaction"
      })
    }

    async function getBundlerTransaction(randomnessTx) {
      return await createAndSignTransaction({
        rpcUrl: RISA_RPC_URL,
        contractAddress: BUNDLER_ADDRESS,
        abi: ["function addRandomness(bytes randomnessTx) external"],
        functionName: "addRandomness",
        functionArgs: [randomnessTx],
        chainId: RISA_CHAIN_ID,
        sigName: "addBundlerTransaction"
      })
    }

    const randomnessTransaction = await getRandomessTransaction()
    const bundlerTransaction = await getBundlerTransaction(
      randomnessTransaction
    )

    Lit.Actions.setResponse({
      response: JSON.stringify({
        randomnessTransaction,
        bundlerTransaction,
        timestamp: Date.now()
      })
    })
  } catch (error) {
    Lit.Actions.setResponse({ response: error.message })
  }

  function hexToBytes(hex) {
    const formattedHex = hex.startsWith("0x") ? hex.slice(2) : hex
    if (formattedHex.length % 2 !== 0) {
      throw new Error("Hex string must have an even length")
    }
    const bytes = new Uint8Array(formattedHex.length / 2)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Number.parseInt(formattedHex.substr(i * 2, 2), 16)
    }
    return bytes
  }
}

export const litActionCode = `(${_litActionCode.toString()})();`
